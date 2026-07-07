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
    // admin_token 已在 middleware 验证，从数据库查真实管理员
    const admin = await queryOne<User>(
      `SELECT * FROM users WHERE role IN ('admin', 'superadmin') AND status = 'active' ORDER BY id LIMIT 1`
    );
    if (admin) return admin;
    // 兜底：返回虚拟用户
    return { id: 1, nickname: '管理员', role: 'superadmin', status: 'active' } as User;
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
// 从详情页 HTML 解析描述和图片
function parseDetailHtml(html: string): { description: string; images: string[] } {
  let description = '';
  const images: string[] = [];

  // 1. 描述：从"其他说明"区域的 .cont-b .f18 提取
  const descMatch = html.match(/其他说明[\s\S]*?<div[^>]*class="[^"]*cont-b[^"]*c9[^"]*f14[^"]*"[^>]*>[\s\S]*?<div[^>]*class="f18[^"]*"[^>]*>([\s\S]*?)<\/div>/);
  if (descMatch) {
    description = descMatch[1].replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 800);
  }

  // 2. 土地信息：从 .cont-b.land-info 提取结构化数据
  const landInfoMatch = html.match(/<div[^>]*class="cont-b land-info[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/);
  if (landInfoMatch) {
    const block = landInfoMatch[1];
    const pairs = [...block.matchAll(/<span>([^<]+：)<\/span><span[^>]*class="c3"[^>]*>([^<]*)<\/span>/g)];
    const parts: string[] = [];
    for (const m of pairs) {
      const label = m[1].replace('：', '').trim();
      const value = m[2].trim();
      if (value && value !== '不详') parts.push(`${label}：${value}`);
    }
    if (parts.length > 0) description += (description ? '\n' : '') + '土地属性：' + parts.join('；');
  }

  // 3. 图片：从 #Jimg-show 区域提取
  const imgShowMatch = html.match(/id="Jimg-show"[\s\S]*?<ul[\s\S]*?>([\s\S]*?)<\/ul>/);
  if (imgShowMatch) {
    const imgSrcs = [...imgShowMatch[1].matchAll(/<img[^>]*src="(http[^"]*static\.jutubao\.com[^"]*)"[^>]*>/g)];
    for (const m of imgSrcs) {
      images.push(m[1].split('?')[0]);
    }
  }

  // 4. 备用：扫描所有 static.jutubao.com 图片
  if (images.length === 0) {
    const allImgs = [...html.matchAll(/<img[^>]*src="(http[^"]*static\.jutubao\.com[^"?]*)"[^>]*>/g)];
    for (const m of allImgs) {
      const src = m[1];
      if (!src.includes('logo') && !src.includes('icon') && !src.includes('qrcode')) {
        images.push(src);
      }
    }
  }

  return { description, images };
}

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



export async function POST(request: Request) {
  // 强制返回 JSON（防止 Worker 崩溃返回 HTML）
  const jsonResponse = (data: any, status = 200) => {
    return new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  };

  try {
    // Step 1: 认证
    const user = await getAdminUser(request);
    if (!user) {
      return jsonResponse({ success: false, error: '需要管理员权限', step: 'auth' }, 403);
    }

    // Step 2: 解析请求体
    const body = await request.json().catch(() => ({})) as {
      source?: string; type?: string; province?: string; limit?: number;
    };
    const landType = body.type || 'nongfang';
    const province = body.province || '';
    const limit = Math.min(body.limit || 10, 50);

    // Step 3: 获取默认发布者
    const sourceAccount = await queryOne<{ user_id: number }>(
      `SELECT user_id FROM source_accounts WHERE name LIKE '%聚土网%' AND enabled = 1 LIMIT 1`
    );
    const adminUser = await queryOne<{ id: number }>(
      `SELECT id FROM users WHERE role IN ('admin', 'superadmin') AND status = 'active' ORDER BY id LIMIT 1`
    );
    const defaultUserId = sourceAccount?.user_id || adminUser?.id || 1;

    // Step 4: 直接抓取聚土网（Worker 可直连，不需要代理）
    let listUrl = 'http://www.jutubao.com/tudi/';
    if (province) {
      const provCode = PROVINCE_MAP[province] || `t-${province}`;
      listUrl = `http://www.jutubao.com/${provCode}/`;
    }
    const res = await fetch(listUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Referer': 'http://www.jutubao.com/',
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      return jsonResponse({ success: false, error: `抓取失败: HTTP ${res.status}`, step: 'fetch' }, 502);
    }

    // Step 5: 解析 HTML
    const html = await res.text();
    const rawItems = parseListHtml(html);
    if (rawItems.length === 0) {
      return jsonResponse({ success: false, error: '未解析到数据', step: 'parse' }, 502);
    }

    // 处理数据
    const items = rawItems.slice(0, limit);
    let imported = 0;
    let skipped = 0;
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

        // 抓取详情页（描述+图片）
        let detailDesc = '';
        let detailImages: string[] = [];
        try {
          const detailRes = await fetch(fullLink, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36', 'Referer': 'http://www.jutubao.com/' },
            signal: AbortSignal.timeout(8000),
          });
          if (detailRes.ok) {
            const detailHtml = await detailRes.text();
            const detail = parseDetailHtml(detailHtml);
            detailDesc = detail.description;
            detailImages = detail.images;
          }
        } catch { /* 详情页抓取失败，继续用列表页数据 */ }

        // 图片：优先用详情页图片（更清晰），fallback 到列表页缩略图
        let imagesJson = '[]';
        const allImageUrls = detailImages.length > 0 ? detailImages : (item.imgSrc ? [item.imgSrc] : []);
        const uploadedUrls: string[] = [];
        for (const imgUrl of allImageUrls.slice(0, 8)) {
          try {
            const imgRes = await fetch(imgUrl, {
              headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'http://www.jutubao.com/' },
              signal: AbortSignal.timeout(5000),
            });
            if (imgRes.ok) {
              const ct = imgRes.headers.get('content-type') || '';
              if (ct.startsWith('image/')) {
                const buffer = await imgRes.arrayBuffer();
                if (buffer.byteLength < 3 * 1024 * 1024) {
                  const ext = ct.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
                  const key = `scraped/${Date.now()}-${Math.random().toString(36).substring(2, 6)}.${ext}`;
                  const env = getEnv();
                  await env.R2.put(key, buffer, { httpMetadata: { contentType: ct } });
                  uploadedUrls.push(`/api/images/${key}`);
                }
              }
            }
          } catch { /* 单张图片失败不影响整体 */ }
        }
        if (uploadedUrls.length > 0) imagesJson = JSON.stringify(uploadedUrls);

        await execute(
          `INSERT INTO assets (
            title, description, location, province, city, district,
            area_mu, price_year, price_total, lease_years,
            asset_type, source_type, source_url, images,
            status, user_id, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
          item.title,
          detailDesc || null,
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
      detail: `一键采集(${LAND_TYPE_NAMES[landType] || landType}): ${imported}条导入, ${skipped}条跳过`,
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

        failed: errors.length,
        errors: errors.slice(0, 5),
      },
    });
  } catch (error: any) {
    return jsonResponse({ success: false, error: error.message || '未知错误', stack: error.stack?.substring(0, 200) }, 500);
  }
}
