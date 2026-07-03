export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

// ============ 类型定义 ============

interface SearchResult {
  type: 'asset' | 'broker' | 'bulk_project';
  id: number;
  title: string;
  subtitle: string;
  location: string | null;
  province: string | null;
  city: string | null;
  image: string | null;
  price: string | null;
  badge: string | null;
  views: number;
  score: number;  // 相关性+地理加权综合得分
  extra: Record<string, unknown>;
}

// ============ IP 地理定位 ============

interface GeoInfo {
  country: string;
  region: string;   // 省/州
  city: string;
}

function getGeoFromRequest(request: Request): GeoInfo {
  // Cloudflare Workers 自动注入 cf 对象
  const cf = (request as any).cf;
  return {
    country: cf?.country || '',
    region: cf?.region || '',
    city: cf?.city || '',
  };
}

// 中文省份映射（Cloudflare 返回的是英文/拼音）
const REGION_MAP: Record<string, string> = {
  'Beijing': '北京市', 'Shanghai': '上海市', 'Tianjin': '天津市', 'Chongqing': '重庆市',
  'Zhejiang': '浙江省', 'Jiangsu': '江苏省', 'Guangdong': '广东省', 'Sichuan': '四川省',
  'Yunnan': '云南省', 'Guizhou': '贵州省', 'Hunan': '湖北省', 'Hubei': '湖北省',
  'Shandong': '山东省', 'Henan': '河北省', 'Hebei': '河北省', 'Fujian': '福建省',
  'Anhui': '安徽省', 'Jiangxi': '江西省', 'Liaoning': '辽宁省', 'Heilongjiang': '黑龙江省',
  'Jilin': '吉林省', 'Shanxi': '山西省', 'Shaanxi': '陕西省', 'Gansu': '甘肃省',
  'Hainan': '海南省', 'Qinghai': '青海省', 'Inner Mongolia': '内蒙古自治区',
  'Guangxi': '广西壮族自治区', 'Tibet': '西藏自治区', 'Ningxia': '宁夏回族自治区',
  'Xinjiang': '新疆维吾尔自治区',
};

function normalizeProvince(region: string): string {
  if (!region) return '';
  // 如果已经是中文省份名，直接返回
  if (/[\u4e00-\u9fa5]/.test(region)) return region;
  return REGION_MAP[region] || region;
}

// ============ 搜索逻辑 ============

function tokenize(query: string): string[] {
  // 简单分词：按空格/逗号/顿号分割，过滤太短的 token
  return query
    .split(/[\s,，、;；]+/)
    .map(t => t.trim())
    .filter(t => t.length >= 1);
}

function buildLikeConditions(fields: string[], tokens: string[]): { where: string; args: string[] } {
  if (tokens.length === 0) return { where: '', args: [] };

  const orClauses: string[] = [];
  const args: string[] = [];

  for (const field of fields) {
    for (const token of tokens) {
      orClauses.push(`${field} LIKE ?`);
      args.push(`%${token}%`);
    }
  }

  return { where: `(${orClauses.join(' OR ')})`, args };
}

async function searchAssets(keyword: string, userProvince: string, limit: number): Promise<SearchResult[]> {
  const tokens = tokenize(keyword);
  if (tokens.length === 0) {
    // 无关键词，返回用户所在地热门资产
    if (userProvince) {
      const rows = await query<any>(
        `SELECT a.*, u.nickname as publisher_name, u.role as publisher_role
         FROM assets a LEFT JOIN users u ON a.user_id = u.id
         WHERE a.status = 'approved' AND a.province = ?
         ORDER BY a.featured DESC, a.views DESC LIMIT ?`,
        userProvince, limit
      );
      return rows.map(r => assetToResult(r, userProvince));
    }
    return [];
  }

  const { where, args } = buildLikeConditions(
    ['a.title', 'a.description', 'a.location', 'a.province', 'a.city', 'a.asset_type', 'a.address'],
    tokens
  );

  const rows = await query<any>(
    `SELECT a.*, u.nickname as publisher_name, u.role as publisher_role
     FROM assets a LEFT JOIN users u ON a.user_id = u.id
     WHERE a.status = 'approved' AND ${where}
     ORDER BY a.featured DESC, a.views DESC LIMIT ?`,
    ...args, limit * 2  // 多取一些用于排序
  );

  return rows.map(r => assetToResult(r, userProvince)).slice(0, limit);
}

function assetToResult(r: any, userProvince: string): SearchResult {
  const geoBoost = userProvince && r.province === userProvince ? 100 : 0;
  const featuredBoost = r.featured ? 50 : 0;
  const viewsBoost = Math.min(Math.log10((r.views || 0) + 1) * 10, 30);

  let image: string | null = null;
  try {
    if (r.images) {
      const arr = JSON.parse(r.images);
      if (Array.isArray(arr) && arr.length > 0) {
        const first = arr[0];
        image = typeof first === 'object' ? (first.thumb || first.url) : first;
      }
    }
  } catch {}

  const badge = r.publisher_role === 'project_publisher' ? '交易所'
    : r.source_type === 'official' ? '官方'
    : r.source_type === 'village' ? '村委'
    : '个人';

  return {
    type: 'asset',
    id: r.id,
    title: r.title,
    subtitle: r.asset_type || '乡村资产',
    location: r.location,
    province: r.province,
    city: r.city,
    image,
    price: r.price_year ? `¥${r.price_year}万/年` : '价格面议',
    badge,
    views: r.views || 0,
    score: geoBoost + featuredBoost + viewsBoost,
    extra: {
      area_mu: r.area_mu,
      asset_type: r.asset_type,
      source_type: r.source_type,
      certification: r.certification,
      lease_years: r.lease_years,
      publisher_name: r.publisher_name,
      publisher_role: r.publisher_role,
    },
  };
}

async function searchBrokers(keyword: string, userProvince: string, limit: number): Promise<SearchResult[]> {
  const tokens = tokenize(keyword);
  if (tokens.length === 0) {
    if (userProvince) {
      const rows = await query<any>(
        `SELECT * FROM brokers WHERE status = 'active' AND province = ?
         ORDER BY CASE rating WHEN 'gold' THEN 1 WHEN 'silver' THEN 2 ELSE 3 END, show_count DESC LIMIT ?`,
        userProvince, limit
      );
      return rows.map(r => brokerToResult(r, userProvince));
    }
    return [];
  }

  const { where, args } = buildLikeConditions(
    ['b.name', 'b.region', 'b.bio', 'b.province', 'b.city', 'b.specialties'],
    tokens
  );

  const rows = await query<any>(
    `SELECT b.* FROM brokers b
     WHERE b.status = 'active' AND ${where}
     ORDER BY CASE b.rating WHEN 'gold' THEN 1 WHEN 'silver' THEN 2 ELSE 3 END, b.show_count DESC LIMIT ?`,
    ...args, limit * 2
  );

  return rows.map(r => brokerToResult(r, userProvince)).slice(0, limit);
}

function brokerToResult(r: any, userProvince: string): SearchResult {
  const geoBoost = userProvince && r.province === userProvince ? 100 : 0;
  const ratingBoost = r.rating === 'gold' ? 50 : r.rating === 'silver' ? 30 : 10;
  const showBoost = Math.min(Math.log10((r.show_count || 0) + 1) * 10, 20);

  let specialties: string[] = [];
  try {
    if (r.specialties) specialties = JSON.parse(r.specialties);
  } catch {}

  return {
    type: 'broker',
    id: r.id,
    title: r.name,
    subtitle: `${r.region || '全国'} · ${r.rating === 'gold' ? '🥇金牌' : r.rating === 'silver' ? '🥈银牌' : '🥉铜牌'}合伙人`,
    location: r.region,
    province: r.province,
    city: r.city,
    image: r.avatar_url,
    price: `${r.show_count || 0} 宗带看 · ${Math.round((r.good_rate || 0) * 100)}%好评`,
    badge: '合伙人',
    views: r.show_count || 0,
    score: geoBoost + ratingBoost + showBoost,
    extra: {
      rating: r.rating,
      good_rate: r.good_rate,
      specialties,
      phone_encrypted: r.phone_encrypted,
    },
  };
}

async function searchBulkProjects(keyword: string, userProvince: string, limit: number): Promise<SearchResult[]> {
  const tokens = tokenize(keyword);
  if (tokens.length === 0) {
    if (userProvince) {
      const rows = await query<any>(
        `SELECT * FROM bulk_projects WHERE status = 'approved' AND province = ?
         ORDER BY featured DESC, views DESC LIMIT ?`,
        userProvince, limit
      );
      return rows.map(r => bulkToResult(r, userProvince));
    }
    return [];
  }

  const { where, args } = buildLikeConditions(
    ['bp.title', 'bp.description', 'bp.location', 'bp.province', 'bp.city', 'bp.planning_use'],
    tokens
  );

  const rows = await query<any>(
    `SELECT bp.* FROM bulk_projects bp
     WHERE bp.status = 'approved' AND ${where}
     ORDER BY bp.featured DESC, bp.views DESC LIMIT ?`,
    ...args, limit * 2
  );

  return rows.map(r => bulkToResult(r, userProvince)).slice(0, limit);
}

function bulkToResult(r: any, userProvince: string): SearchResult {
  const geoBoost = userProvince && r.province === userProvince ? 100 : 0;
  const featuredBoost = r.featured ? 50 : 0;
  const viewsBoost = Math.min(Math.log10((r.views || 0) + 1) * 10, 30);

  let image: string | null = null;
  try {
    if (r.images) {
      const arr = JSON.parse(r.images);
      if (Array.isArray(arr) && arr.length > 0) {
        const first = arr[0];
        image = typeof first === 'object' ? (first.thumb || first.url) : first;
      }
    }
  } catch {}

  return {
    type: 'bulk_project',
    id: r.id,
    title: r.title,
    subtitle: r.planning_use ? `${r.planning_use}项目` : '大宗路演',
    location: r.location,
    province: r.province,
    city: r.city,
    image,
    price: r.price_start ? `¥${r.price_start}万/年起` : '价格面议',
    badge: '大宗',
    views: r.views || 0,
    score: geoBoost + featuredBoost + viewsBoost,
    extra: {
      code: r.code,
      area_mu: r.area_mu,
      area_sqm: r.area_sqm,
      yield_rate: r.yield_rate,
      certification: r.certification,
      planning_use: r.planning_use,
    },
  };
}

// ============ API Handler ============

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const keyword = (searchParams.get('q') || '').trim();
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '30'), 50);
  const typeFilter = searchParams.get('type') || ''; // asset | broker | bulk_project
  const geoOverride = searchParams.get('province') || ''; // 手动指定省份

  try {
    // 1. 获取用户地理位置
    const geo = getGeoFromRequest(request);
    const userProvince = geoOverride || normalizeProvince(geo.region);
    const userCity = geo.city || '';

    // 2. 确定搜索哪些类型
    const types: string[] = typeFilter
      ? [typeFilter]
      : ['asset', 'broker', 'bulk_project'];

    // 3. 并行搜索各类型
    const perTypeLimit = Math.ceil(limit * 1.5); // 每种类型多取一些
    const searchPromises: Promise<SearchResult[]>[] = [];

    if (types.includes('asset')) searchPromises.push(searchAssets(keyword, userProvince, perTypeLimit));
    if (types.includes('broker')) searchPromises.push(searchBrokers(keyword, userProvince, perTypeLimit));
    if (types.includes('bulk_project')) searchPromises.push(searchBulkProjects(keyword, userProvince, perTypeLimit));

    const resultsByType = await Promise.all(searchPromises);

    // 4. 合并 + 按 score 降序排序
    let allResults = resultsByType.flat().sort((a, b) => b.score - a.score);

    // 5. 分页
    const total = allResults.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const paged = allResults.slice(start, start + limit);

    return NextResponse.json({
      success: true,
      data: paged,
      pagination: { page, limit, total, totalPages },
      geo: {
        detected: userProvince || userCity || '未知',
        province: userProvince,
        city: userCity,
        country: geo.country,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
