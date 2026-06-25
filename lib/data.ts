// 数据访问层 - 封装所有 D1 查询，供 Server Components 调用
// 在 Cloudflare Pages 环境中，DB 通过 process.env 绑定

import { query, queryOne } from './db';

// ============ 首页配置 ============

export async function getHomepageConfig(): Promise<Record<string, string>> {
  const rows = await query<{ key: string; value: string }>(
    'SELECT key, value FROM homepage_config'
  );
  const config: Record<string, string> = {};
  for (const row of rows) {
    config[row.key] = row.value;
  }
  return config;
}

// ============ 资产列表 ============

export interface Asset {
  id: number;
  title: string;
  description: string | null;
  location: string | null;
  province: string | null;
  city: string | null;
  district: string | null;
  address: string | null;
  area_mu: number | null;
  price_year: number | null;
  price_total: number | null;
  lease_years: number | null;
  asset_type: string | null;
  source_type: string;
  source_url: string | null;
  images: string | null;
  video_url: string | null;
  gps_lat: number | null;
  gps_lng: number | null;
  contact_phone: string | null;
  contact_name: string | null;
  views: number;
  status: string;
  featured: number;
  user_id: number | null;
  raw_html: string | null;
  ai_extracted: string | null;
  created_at: string;
  updated_at: string;
}

export interface AssetFilters {
  source?: string;
  province?: string;
  areaMin?: number;
  areaMax?: number;
  priceMin?: number;
  priceMax?: number;
  search?: string;
  page?: number;
  limit?: number;
  featured?: boolean;
}

function buildAssetQuery(params: AssetFilters, countOnly = false) {
  const {
    source, province, areaMin, areaMax,
    priceMin, priceMax, search,
    page = 1, limit = 20, featured,
  } = params;

  const limitNum = Math.min(limit, 50);
  let sql: string;
  let args: unknown[] = [];

  if (search) {
    // FTS5 全文搜索
    const selectClause = countOnly
      ? 'SELECT COUNT(*) as count'
      : 'SELECT assets.*';
    sql = `${selectClause} FROM assets
           JOIN assets_fts ON assets.id = assets_fts.rowid
           WHERE assets.status = ? AND assets_fts MATCH ?`;
    args = ['approved', search];
    if (source) { sql += ' AND assets.source_type = ?'; args.push(source); }
    if (province) { sql += ' AND assets.province = ?'; args.push(province); }
    if (areaMin) { sql += ' AND assets.area_mu >= ?'; args.push(areaMin); }
    if (areaMax) { sql += ' AND assets.area_mu <= ?'; args.push(areaMax); }
    if (priceMin) { sql += ' AND assets.price_year >= ?'; args.push(priceMin); }
    if (priceMax) { sql += ' AND assets.price_year <= ?'; args.push(priceMax); }
    if (featured) { sql += ' AND assets.featured = 1'; }
  } else {
    const selectClause = countOnly ? 'SELECT COUNT(*) as count' : 'SELECT *';
    sql = `${selectClause} FROM assets WHERE status = ?`;
    args = ['approved'];
    if (source) { sql += ' AND source_type = ?'; args.push(source); }
    if (province) { sql += ' AND province = ?'; args.push(province); }
    if (areaMin) { sql += ' AND area_mu >= ?'; args.push(areaMin); }
    if (areaMax) { sql += ' AND area_mu <= ?'; args.push(areaMax); }
    if (priceMin) { sql += ' AND price_year >= ?'; args.push(priceMin); }
    if (priceMax) { sql += ' AND price_year <= ?'; args.push(priceMax); }
    if (featured) { sql += ' AND featured = 1'; }
  }

  if (!countOnly) {
    sql += ' ORDER BY views DESC LIMIT ? OFFSET ?';
    args.push(limitNum, (page - 1) * limitNum);
  }

  return { sql, args };
}

export async function getAssets(params: AssetFilters = {}): Promise<Asset[]> {
  const { sql, args } = buildAssetQuery(params);
  return query<Asset>(sql, ...args);
}

export async function getAssetsCount(params: AssetFilters = {}): Promise<number> {
  const { sql, args } = buildAssetQuery(params, true);
  const row = await queryOne<{ count: number }>(sql, ...args);
  return row?.count || 0;
}

export async function getAssetById(id: number | string): Promise<Asset | null> {
  return queryOne<Asset>(
    'SELECT * FROM assets WHERE id = ? AND status = ?',
    id, 'approved'
  );
}

export async function getHotAssets(limit: number = 6): Promise<Asset[]> {
  return query<Asset>(
    'SELECT * FROM assets WHERE status = ? ORDER BY views DESC LIMIT ?',
    'approved', limit
  );
}

export async function getFeaturedAssets(limit: number = 6): Promise<Asset[]> {
  return query<Asset>(
    'SELECT * FROM assets WHERE status = ? AND featured = 1 ORDER BY views DESC LIMIT ?',
    'approved', limit
  );
}

export async function getAssetsBySource(sourceType: string, limit: number = 6): Promise<Asset[]> {
  return query<Asset>(
    'SELECT * FROM assets WHERE status = ? AND source_type = ? ORDER BY views DESC LIMIT ?',
    'approved', sourceType, limit
  );
}

// 增加浏览量
export async function incrementViews(id: number | string): Promise<void> {
  await queryOne('UPDATE assets SET views = views + 1 WHERE id = ?', id);
}

// ============ 行情数据 ============

export interface MarketData {
  id: number;
  province: string;
  median_price: number;
  change_pct: number;
  bargain_space: number;
  total_listings: number;
  updated_at: string;
}

export async function getMarketData(): Promise<MarketData[]> {
  return query<MarketData>(
    'SELECT * FROM market_data ORDER BY median_price DESC'
  );
}

// ============ 基建评分 ============

export interface InfraRating {
  id: number;
  region: string;
  signal_5g_ms: number;
  hospital_min: number;
  grid_redundancy: number;
  overall_grade: string;
  updated_at: string;
}

export async function getInfraRatings(): Promise<InfraRating[]> {
  return query<InfraRating>(
    'SELECT * FROM infrastructure_ratings ORDER BY signal_5g_ms ASC'
  );
}

// ============ 合伙人 ============

export interface Broker {
  id: number;
  user_id: number;
  name: string;
  region: string;
  bio: string | null;
  rating: string;
  show_count: number;
  good_rate: number;
  phone_encrypted: string | null;
  avatar_url: string | null;
  status: string;
  created_at: string;
}

export async function getBrokers(limit: number = 20): Promise<Broker[]> {
  return query<Broker>(
    "SELECT * FROM brokers WHERE status = ? ORDER BY CASE rating WHEN 'gold' THEN 1 WHEN 'silver' THEN 2 ELSE 3 END, show_count DESC LIMIT ?",
    'active', limit
  );
}

// ============ 统计数据 ============

export async function getAssetStats(): Promise<{
  total: number;
  todayNew: number;
  pending: number;
}> {
  const row = await queryOne<{ total: number; today_new: number; pending: number }>(
    `SELECT 
       COUNT(*) as total,
       SUM(CASE WHEN date(created_at) = date('now') THEN 1 ELSE 0 END) as today_new,
       SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
     FROM assets`
  );
  return {
    total: row?.total || 0,
    todayNew: row?.today_new || 0,
    pending: row?.pending || 0,
  };
}

// ============ 搜索 (FTS5) ============

export async function searchAssets(keyword: string, limit: number = 20): Promise<Asset[]> {
  return query<Asset>(
    `SELECT assets.* FROM assets
     JOIN assets_fts ON assets.id = assets_fts.rowid
     WHERE assets.status = ? AND assets_fts MATCH ?
     ORDER BY assets.views DESC LIMIT ?`,
    'approved', keyword, limit
  );
}
