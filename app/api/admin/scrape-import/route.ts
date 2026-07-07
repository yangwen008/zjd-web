export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { execute, queryOne, getEnv } from '@/lib/db';
import { getUserFromRequest, type User } from '@/lib/auth';
import { writeAuditLog } from '@/lib/audit';

// 支持 admin_token 和 user_session 两种认证
async function getAdminUser(request: Request): Promise<User | null> {
  // 先检查 admin_token（Admin 后台登录）
  const cookie = request.headers.get('cookie') || '';
  if (cookie.includes('admin_token=')) {
    // admin_token 已在 middleware 验证，直接返回虚拟 admin 用户
    return { id: 0, nickname: '管理员', role: 'superadmin', status: 'active' } as User;
  }
  // 再检查 user_session（用户登录）
  const user = await getUserFromRequest(request);
  if (user && (user.role === 'admin' || user.role === 'superadmin')) {
    return user;
  }
  return null;
}

/**
 * POST /api/admin/scrape-import
 * 一键采集+入库（从聚土网抓取数据，自动导入到 assets 表）
 * 
 * Body: { source?: 'jutubao', type?: string, province?: string, limit?: number }
 */

// 聚土网土地类型映射
const TYPE_MAP: Record<string, string> = {
  'nongfang': 'c5j0m0l0',
  'linmumiaopu': 'c3j0m0l0',
  'shucailiangyou': 'c1j0m0l0',
  'guochacansang': 'c2j0m0l0',
  'xumufangyang': 'c4j0m0l0',
  'chanzhiyangzhi': 'c7j0m0l0',
};

const PROVINCE_MAP: Record<string, string> = {
  'sichuan': 't-sichuan', 'yunnan': 't-yunnan', 'guizhou': 't-guizhou',
  'chongqing': 't-chongqing', 'guangxi': 't-guangxi', 'hubei': 't-hubei',
  'hunan': 't-hunan', 'guangdong': 't-guangdong', 'zhejiang': 't-zhejiangsheng',
  'jiangsu': 't-jiangsu', 'anhui': 't-anhui', 'fujian': 't-fujian',
  'jiangxi': 't-jiangxi', 'shandong': 't-shandong', 'henan': 't-henan',
  'hebei': 't-hebei', 'beijing': 't-beijing', 'shanghai': 't-shanghai',
  'hainan': 't-hainan',
};

const LAND_TYPE_NAMES: Record<string, string> = {
  'nongfang': '农房', 'linmumiaopu': '林木苗圃地', 'shucailiangyou': '蔬菜粮油地',
  'guochacansang': '水果茶桑地', 'xumufangyang': '畜牧放养地', 'chanzhiyangzhi': '水产养殖地',
};

function buildUrl(type: string, province: string, page: number): string {
  const typeCode = TYPE_MAP[type] || '';
  const provCode = province ? (PROVINCE_MAP[province] || `t-${province}`) : '';
  if (provCode && typeCode) return `http://www.jutubao.com/${provCode}/${typeCode}/`;
  if (provCode) return `http://www.jutubao.com/${provCode}/`;
  if (typeCode) {
    return page === 1
      ? `http://www.jutubao.com/tudi/${typeCode}`
      : `http://www.jutubao.com/tudi/${typeCode}-p${page}/`;
  }
  return page === 1
    ? `http://www.jutubao.com/tudi/`
    : `http://www.jutubao.com/tudi-p${page}/`;
}

function parseAreaMu(text: string): number | null {
  if (!text) return null;
  const s = text.replace(/\s/g, '');
  const mu = s.match(/([\d.]+)\s*亩/);
  if (mu) return parseFloat(mu[1]);
  const sqm = s.match(/([\d.]+)\s*(?:平米|平方米|㎡)/);
  if (sqm) return Math.round(parseFloat(sqm[1]) / 666.67 * 100) / 100;
  return null;
}

function parseLocation(text: string) {
  if (!text) return { province: null, city: null, district: null };
  const cleaned = text.replace(/所在地区：?/, '').replace(/\s/g, '');
  const parts = cleaned.split('-').map(s => s.trim()).filter(Boolean);
  return { province: parts[0] || null, city: parts[1] || null, district: parts[2] || null };
}

function mapAssetType(landType: string): string {
  if (!landType) return '其他';
  const t = landType.trim();
  if (t.includes('农房') || t.includes('宅基地')) return '宅基地';
  if (t.includes('林') || t.includes('苗圃')) return '林地';
  if (t.includes('茶') || t.includes('果园') || t.includes('果')) return '茶园';
  if (t.includes('蔬菜') || t.includes('粮油') || t.includes('旱地') || t.includes('水田')) return '种植';
  if (t.includes('厂房') || t.includes('仓储')) return '厂房';
  if (t.includes('商') || t.includes('铺')) return '商铺';
  return '其他';
}

// 从 HTML 解析列表数据
function parseListHtml(html: string): any[] {
  const items: any[] = [];
  // 聚土网列表结构：<li><a href="/tudi/content-xxx">...</a></li>
  const liRegex = /<li>\s*<a[^>]*href="([^"]*content-[^"]*)"[^>]*>([\s\S]*?)<\/a>\s*<\/li>/gi;
  let match;
  while ((match = liRegex.exec(html)) !== null) {
    const link = match[1];
    const block = match[2];
    if (!link || !block) continue;

    // 标题（class可能是 textover mltr-p1 或 mltr-p1）
    const titleMatch = block.match(/class="[^"]*mltr-p1[^"]*"[^>]*>([^<]+)/);
    const title = titleMatch ? titleMatch[1].trim() : '';
    if (!title) continue;

    // 图片
    const imgMatch = block.match(/<img[^>]*original="([^"]*)"[^>]*>/) || block.match(/<img[^>]*src="([^"]*static\.jutubao\.com[^"]*)"[^>]*>/);
    const imgSrc = imgMatch ? imgMatch[1].split('?')[0] : '';

    // 流转类型
    const typeMatch = block.match(/class="mspan2"[^>]*>([^<]+)/);
    const transferType = typeMatch ? typeMatch[1].trim() : '';

    // 土地类型（第一个 mltr-p2，排除"所在地区"和"最新刷新"）
    const p2Matches = block.match(/class="mltr-p2"[^>]*>([^<]+)/g);
    let landType = '';
    if (p2Matches) {
      for (const m of p2Matches) {
        const text = m.replace(/class="mltr-p2"[^>]*>/, '').trim();
        if (!text.includes('所在地区') && !text.includes('最新刷新')) {
          landType = text;
          break;
        }
      }
    }

    // 面积+年限
    const areaMatch = block.match(/class="fl"[^>]*><span>([^<]+)<\/span>[\s\S]*?<span>([^<]+)<\/span>/);
    const areaText = areaMatch ? areaMatch[1].trim() : '';
    const leaseText = areaMatch ? areaMatch[2].trim() : '';

    // 价格
    const priceMatch = block.match(/class="f18[^"]*"[^>]*>([^<]+)/);
    const priceNum = priceMatch ? priceMatch[1].trim() : '';
    const priceUnitMatch = block.match(/class="fr"[^>]*>[\s\S]*?<\/div>/);
    let priceUnit = '';
    if (priceUnitMatch) {
      priceUnit = priceUnitMatch[0].replace(/<[^>]*>/g, '').replace(priceNum, '').trim();
    }

    // 位置（包含"所在地区"的 mltr-p2）
    let location = '';
    if (p2Matches) {
      for (const m of p2Matches) {
        const text = m.replace(/class="mltr-p2"[^>]*>/, '').trim();
        if (text.includes('所在地区')) {
          location = text;
          break;
        }
      }
    }

    items.push({ title, link, imgSrc, transferType, landType, areaText, leaseText, priceNum, priceUnit, location });
  }
  return items;
}

// 解析价格
function parsePrice(priceNum: string, priceUnit: string) {
  if (!priceNum) return { price_year: null, price_total: null };
  const num = parseFloat(priceNum);
  if (isNaN(num)) return { price_year: null, price_total: null };
  const unit = (priceUnit || '').replace(/\s/g, '');
  if (unit.includes('元/月')) return { price_year: Math.round(num * 12 / 10000 * 100) / 100, price_total: null };
  if (unit.includes('万元')) return { price_year: null, price_total: num };
  if (unit.includes('元/年')) return { price_year: Math.round(num / 10000 * 100) / 100, price_total: null };
  return { price_year: null, price_total: null };
}

// 下载图片上传到 R2（通过代理服务器下载，绕过反爬）
const PROXY_BASE_IMG = 'http://112.44.232.181:8443';

async function uploadImageToR2(r2: R2Bucket, url: string): Promise<string | null> {
  try {
    if (!url || url.startsWith('/api/images/')) return url;
    const proxyUrl = `${PROXY_BASE_IMG}/fetch?url=${encodeURIComponent(url)}`;
    const res = await fetch(proxyUrl, {
      headers: { 'X-Forwarded-Referer': 'http://www.jutubao.com/' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') || '';
    if (!ct.startsWith('image/')) return null;
    const buffer = await res.arrayBuffer();
    if (buffer.byteLength > 5 * 1024 * 1024) return null;
    const ext = ct.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
    const key = `scraped/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
    await r2.put(key, buffer, { httpMetadata: { contentType: ct } });
    return `/api/images/${key}`;
  } catch { return null; }
}

export async function POST(request: Request) {
  // 强制返回 JSON（防止 Worker 崩溃返回 HTML）
  const jsonResponse = (data: any, status = 200) => {
    return new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  };

  try {
    const user = await getAdminUser(request);
    if (!user) {
      return jsonResponse({ success: false, error: '需要管理员权限' }, 403);
    }
    const body = await request.json().catch(() => ({})) as {
      source?: string; type?: string; province?: string; limit?: number;
    };

    const landType = body.type || 'nongfang';
    const province = body.province || '';
    const limit = Math.min(body.limit || 10, 50);
    const env = getEnv();

    // 获取来源账号（聚土网 → 自动创建的 project_publisher 账号）
    const sourceAccount = await queryOne<{ user_id: number }>(
      `SELECT user_id FROM source_accounts WHERE name LIKE '%聚土网%' AND enabled = 1 LIMIT 1`
    );
    // 如果没有来源账号，找第一个管理员账号作为发布者
    const adminUser = await queryOne<{ id: number }>(
      `SELECT id FROM users WHERE role IN ('admin', 'superadmin') AND status = 'active' ORDER BY id LIMIT 1`
    );
    const defaultUserId = sourceAccount?.user_id || adminUser?.id || 1;

    // 构建 URL（直接用主页，不按类型筛选）
    let listUrl = 'http://www.jutubao.com/tudi/';
    if (province) {
      const provCode = PROVINCE_MAP[province] || `t-${province}`;
      listUrl = `http://www.jutubao.com/${provCode}/`;
    }

    // 抓取列表页（通过代理服务器绕过反爬）
    const PROXY_BASE = 'http://112.44.232.181:8443';
    const proxyUrl = `${PROXY_BASE}/fetch?url=${encodeURIComponent(listUrl)}`;
    const res = await fetch(proxyUrl, {
      headers: {
        'X-Forwarded-Referer': 'http://www.jutubao.com/',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return jsonResponse({ success: false, error: `抓取失败: HTTP ${res.status}` }, 502);
    }

    const html = await res.text();
    const rawItems = parseListHtml(html);

    if (rawItems.length === 0) {
      return jsonResponse({ success: false, error: '未解析到数据，页面结构可能已变化' }, 502);
    }

    // 处理数据
    const items = rawItems.slice(0, limit);
    let imported = 0;
    let skipped = 0;
    let imagesUploaded = 0;
    const errors: string[] = [];

    for (const item of items) {
      try {
        const loc = parseLocation(item.location);
        const areaMu = parseAreaMu(item.areaText);
        const leaseYears = item.leaseText ? parseInt(item.leaseText) : null;
        const { price_year, price_total } = parsePrice(item.priceNum, item.priceUnit);
        const fullLink = item.link.startsWith('http') ? item.link : `http://www.jutubao.com${item.link}`;

        // 去重
        const existing = await queryOne<{ id: number }>('SELECT id FROM assets WHERE source_url = ?', fullLink);
        if (existing) { skipped++; continue; }

        // 图片：先保存原始URL，后续批量上传R2（避免Worker超时）
        let imagesJson = '[]';
        if (item.imgSrc) {
          imagesJson = JSON.stringify([item.imgSrc]);
        }

        await execute(
          `INSERT INTO assets (
            title, description, location, province, city, district,
            area_mu, price_year, price_total, lease_years,
            asset_type, source_type, source_url, images,
            status, user_id, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
          item.title,
          null,
          item.location.replace(/所在地区：?/, '').replace(/\s/g, ''),
          loc.province, loc.city, loc.district,
          areaMu, price_year, price_total, leaseYears,
          mapAssetType(item.landType), 'official', fullLink, imagesJson,
          'approved', defaultUserId,
        );
        imported++;
      } catch (e: any) {
        errors.push(`${item.title}: ${e.message}`);
      }
    }

    await writeAuditLog({
      userId: user.id, userRole: user.role,
      action: 'scrape-import', module: 'scraper', targetType: 'scraped_data',
      detail: `一键采集(${LAND_TYPE_NAMES[landType] || landType}): ${imported}条导入, ${skipped}条跳过, ${imagesUploaded}张图片上传R2`,
      request,
    });

    return jsonResponse({
      success: true,
      data: {
        source: '聚土网',
        type: LAND_TYPE_NAMES[landType] || landType,
        province: province || '全国',
        total: items.length,
        imported,
        skipped,
        imagesUploaded,
        failed: errors.length,
        errors: errors.slice(0, 5),
      },
    });
  } catch (error: any) {
    return jsonResponse({ success: false, error: error.message || '未知错误' }, 500);
  }
}
