export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { getEnv } from '@/lib/db';

// 中文省份映射（Cloudflare cf.region 返回英文）
const REGION_MAP: Record<string, string> = {
  'Beijing': '北京市', 'Shanghai': '上海市', 'Tianjin': '天津市', 'Chongqing': '重庆市',
  'Zhejiang': '浙江省', 'Jiangsu': '江苏省', 'Guangdong': '广东省', 'Sichuan': '四川省',
  'Yunnan': '云南省', 'Guizhou': '贵州省', 'Hubei': '湖北省', 'Hunan': '湖南省',
  'Shandong': '山东省', 'Hebei': '河北省', 'Henan': '河南省', 'Fujian': '福建省',
  'Anhui': '安徽省', 'Jiangxi': '江西省', 'Liaoning': '辽宁省', 'Heilongjiang': '黑龙江省',
  'Jilin': '吉林省', 'Shanxi': '山西省', 'Shaanxi': '陕西省', 'Gansu': '甘肃省',
  'Hainan': '海南省', 'Qinghai': '青海省', 'Inner Mongolia': '内蒙古自治区',
  'Guangxi Zhuang': '广西壮族自治区', 'Tibet': '西藏自治区', 'Ningxia Hui': '宁夏回族自治区',
  'Xinjiang Uygur': '新疆维吾尔自治区',
};

/**
 * GET /api/wx/geocoder?lat=xx&lng=xx
 * 
 * 有 lat/lng → 腾讯地图反向地理编码
 * 无 lat/lng → Cloudflare cf 对象 IP 定位
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  // 方案1：GPS 坐标反向地理编码
  if (lat && lng) {
    try {
      const env = getEnv();
      const key = (env as any).TENCENT_MAP_KEY || '';
      if (!key) {
        // 没有配置 Key，降级到 IP 定位
        return fallbackByCF(request);
      }

      const url = 'https://apis.map.qq.com/ws/geocoder/v1/?location=' + lat + ',' + lng + '&key=' + key;
      const res = await fetch(url);
      const data = await res.json() as {
        status?: number;
        result?: {
          address_component?: {
            province?: string;
            city?: string;
            district?: string;
          };
        };
        message?: string;
      };

      if (data.status === 0 && data.result?.address_component) {
        const addr = data.result.address_component;
        return NextResponse.json({
          success: true,
          address: {
            province: addr.province || '',
            city: addr.city || '',
            district: addr.district || '',
          },
        });
      }

      // 腾讯地图返回错误，降级
      console.error('Tencent geocoder error:', data.status, data.message);
      return fallbackByCF(request);
    } catch (e) {
      console.error('Tencent geocoder exception:', e);
      return fallbackByCF(request);
    }
  }

  // 方案2：IP 定位（Cloudflare 自动注入）
  return fallbackByCF(request);
}

function fallbackByCF(request: Request) {
  const cf = (request as any).cf;
  const region = cf?.region || '';
  const city = cf?.city || '';
  const country = cf?.country || '';

  // 有省份信息就返回（Cloudflare Workers 环境）
  if (region) {
    const province = REGION_MAP[region] || region;
    return NextResponse.json({
      success: true,
      address: { province, city: city ? city + '市' : '', district: '' },
      source: 'cf',
    });
  }

  // 无 cf 对象（非 Cloudflare 环境，如开发者工具）
  return NextResponse.json({
    success: false,
    error: '无法获取位置信息，请确保已开启定位权限',
  });
}
