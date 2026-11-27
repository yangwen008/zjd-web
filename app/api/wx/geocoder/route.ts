export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// ============ /api/wx/geocoder — 坐标 → 省市区 / IP 定位 ============
//
// 反查优先级：
//   1) 腾讯地图 API（需配置 TENCENT_MAP_KEY 环境变量，最精确，配了自动启用）
//   2) 自家 regions 表最近点反查（免Key、稳定，区县精度，覆盖自动定位需求）
//   3) Cloudflare 请求地理信息（IP 兜底）
//
// 修复记录 2026-11-27：
//   - 旧版只依赖 TENCENT_MAP_KEY + request.cf，两者都缺失时整个接口瘫痪，
//     导致小程序"自动定位"拿不到省市。
//   - 新增 regions 表反查兜底，保证无 Key 也能定位到城市。
//   - 注意：next-on-pages 运行时下 request.cf 可能为空，兜底里做了容错。

const REGION_MAP: Record<string, string> = {
  'Beijing': '北京市', 'Shanghai': '上海市', 'Tianjin': '天津市', 'Chongqing': '重庆市',
  'Zhejiang': '浙江省', 'Jiangsu': '江苏省', 'Guangdong': '广东省', 'Sichuan': '四川省',
  'Yunnan': '云南省', 'Guizhou': '贵州省', 'Hunan': '湖南省', 'Hubei': '湖北省',
  'Shandong': '山东省', 'Henan': '河南省', 'Hebei': '河北省', 'Fujian': '福建省',
  'Anhui': '安徽省', 'Jiangxi': '江西省', 'Liaoning': '辽宁省', 'Heilongjiang': '黑龙江省',
  'Jilin': '吉林省', 'Shanxi': '山西省', 'Shaanxi': '陕西省', 'Gansu': '甘肃省',
  'Hainan': '海南省', 'Qinghai': '青海省', 'Inner Mongolia': '内蒙古自治区',
  'Guangxi Zhuang': '广西壮族自治区', 'Tibet': '西藏自治区', 'Ningxia Hui': '宁夏回族自治区',
  'Xinjiang Uygur': '新疆维吾尔自治区',
};

// ============ Haversine 距离（km） ============
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface RegionRow {
  name: string;
  level: string;
  province: string | null;
  city: string | null;
  lat: number | null;
  lng: number | null;
}

// ============ 免Key反查：自家 regions 表找最近行政区 ============
async function nearestRegion(lat: number, lng: number): Promise<{ province: string; city: string; district: string } | null> {
  const rows = await query<RegionRow>(
    `SELECT name, level, province, city, lat, lng FROM regions
     WHERE active = 1 AND level IN ('province', 'city', 'district')
       AND lat IS NOT NULL AND lng IS NOT NULL`
  );
  if (!rows.length) return null;

  let best: RegionRow | null = null;
  let bestDist = Infinity;
  for (const r of rows) {
    const d = haversine(lat, lng, r.lat as number, r.lng as number);
    if (d < bestDist) {
      bestDist = d;
      best = r;
    }
  }
  if (!best) return null;

  const province = best.province || (best.level === 'province' ? best.name : '');
  let city = '';
  let district = '';
  if (best.level === 'district') {
    city = best.city || '';
    district = best.name;
  } else if (best.level === 'city') {
    city = best.name;
  }
  return { province, city, district };
}

// ============ IP 兜底：Cloudflare 请求地理信息 ============
function fallbackByCF(request: Request) {
  try {
    const cf = (request as any).cf;
    const region = cf?.region || '';
    const city = cf?.city || '';
    if (region) {
      const province = REGION_MAP[region] || region;
      return NextResponse.json({
        success: true,
        address: { province, city: city ? city + '市' : '', district: '' },
        source: 'cf',
      });
    }
  } catch {
    // cf 对象不可用时静默降级
  }
  return NextResponse.json({ success: false, error: '无法获取位置信息' });
}

// ============ Handler ============
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get('lat') || '');
  const lng = parseFloat(searchParams.get('lng') || '');

  // ---- 有坐标：反查省市区 ----
  if (!isNaN(lat) && !isNaN(lng)) {
    // 1) 腾讯地图（配置了 TENCENT_MAP_KEY 时自动启用）
    const key = (process.env as any).TENCENT_MAP_KEY || '';
    if (key) {
      try {
        const res = await fetch(
          'https://apis.map.qq.com/ws/geocoder/v1/?location=' + lat + ',' + lng + '&key=' + key
        );
        const data = await res.json() as any;
        if (data.status === 0 && data.result?.address_component) {
          const addr = data.result.address_component;
          return NextResponse.json({
            success: true,
            address: {
              province: addr.province || '',
              city: addr.city || '',
              district: addr.district || '',
            },
            source: 'tencent',
          });
        }
      } catch {
        // 腾讯接口失败继续走兜底
      }
    }

    // 2) 自家 regions 表最近点反查（免Key）
    try {
      const addr = await nearestRegion(lat, lng);
      if (addr && (addr.province || addr.city)) {
        return NextResponse.json({ success: true, address: addr, source: 'regions' });
      }
    } catch {
      // 查询失败继续走兜底
    }
  }

  // ---- 无坐标 / 上面都失败：IP 兜底 ----
  return fallbackByCF(request);
}
