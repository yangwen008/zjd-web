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

// 板块配置默认值（deprecated — 优先从 homepage_config 表读取，仅作最终兜底）
const SECTION_DEFAULTS: Record<string, string> = {
  hero_title: '寻找被低估的低密度空间资产',
  hero_subtitle: '乡村资产数字化绿色流转中枢。全网多源产权低频提纯，一键交叉碰撞，让技术重归山川。',
  total_assets: '104,281',
  today_new: '142',
  section_regions_title: '核心地点寻源区',
  section_regions_subtitle: '默认按本站最热点击量、收藏量降序排列',
  section_regions_count: '6',
  section_market_title: '省级行政细分流速与交易深度',
  section_market_subtitle: 'CONNECTED',
  section_official_title: '纯净一手官方原矿区',
  section_official_subtitle: '进入原矿搜寻引擎',
  section_official_count: '6',
  section_village_title: '村集体直发专区',
  section_village_subtitle: '查看所有村委直发',
  section_village_count: '2',
  section_bulk_title: '文旅大宗产业路演带',
  section_bulk_subtitle: '进入独立路演大厅',
  section_bulk_count: '2',
  section_infra_title: '数字化隐居基建硬指标',
  section_infra_subtitle: '查看全国基建指数表',
  section_infra_count: '6',
  section_brokers_title: '本地金牌"农房合伙人"联播网',
  section_brokers_subtitle: '查看全网合伙人名册',
  section_brokers_count: '3',
  region_emojis: '{}',
  default_image: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=600&h=400&fit=crop',
  default_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
};

export function getConfigValue(config: Record<string, string>, key: string): string {
  return config[key] || SECTION_DEFAULTS[key] || '';
}

export function getConfigCount(config: Record<string, string>, key: string, fallback: number): number {
  const val = config[key];
  if (!val) return fallback;
  const n = parseInt(val, 10);
  return isNaN(n) ? fallback : Math.max(1, Math.min(12, n));
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

export async function getAssetsByProvince(province: string, limit: number = 20): Promise<Asset[]> {
  return query<Asset>(
    'SELECT * FROM assets WHERE status = ? AND province = ? ORDER BY views DESC LIMIT ?',
    'approved', province, limit
  );
}

export async function getMarketDataByProvince(province: string): Promise<MarketData | null> {
  return queryOne<MarketData>(
    'SELECT * FROM market_data WHERE province = ?',
    province
  );
}

export async function getBrokerById(id: number | string): Promise<Broker | null> {
  return queryOne<Broker>(
    'SELECT * FROM brokers WHERE id = ? AND status = ?',
    id, 'active'
  );
}

export async function getInfraRatingById(id: number | string): Promise<InfraRating | null> {
  return queryOne<InfraRating>(
    'SELECT * FROM infrastructure_ratings WHERE id = ?',
    id
  );
}

// 增加浏览量
export async function incrementViews(id: number | string): Promise<void> {
  await queryOne('UPDATE assets SET views = views + 1 WHERE id = ?', id);
}

// ============ 行政区划 ============

export interface Region {
  id: number;
  code: string;
  name: string;
  level: string;
  parent_code: string | null;
  province: string | null;
  city: string | null;
  emoji: string | null;
  lat: number | null;
  lng: number | null;
  sort_order: number;
  active: number;
}

export async function getRegionsByLevel(level: string): Promise<Region[]> {
  return query<Region>(
    'SELECT * FROM regions WHERE level = ? AND active = 1 ORDER BY sort_order',
    level
  );
}

export async function getProvinceEmoji(province: string): Promise<string> {
  const row = await queryOne<Region>(
    'SELECT emoji FROM regions WHERE name = ? AND level = ?',
    province, 'province'
  );
  return row?.emoji || '📍';
}

export async function getAllProvinceEmojis(): Promise<Record<string, string>> {
  const rows = await query<Region>(
    "SELECT name, emoji FROM regions WHERE level = 'province' AND emoji IS NOT NULL"
  );
  const map: Record<string, string> = {};
  for (const r of rows) {
    map[r.name] = r.emoji || '📍';
  }
  return map;
}

// ============ 资产类型 ============

export interface AssetType {
  id: number;
  name: string;
  icon: string | null;
  description: string | null;
  sort_order: number;
}

export async function getAssetTypes(): Promise<AssetType[]> {
  return query<AssetType>(
    'SELECT * FROM asset_types WHERE active = 1 ORDER BY sort_order'
  );
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
  province: string | null;
  city: string | null;
  bio: string | null;
  specialties: string | null;
  rating: string;
  show_count: number;
  good_rate: number;
  phone_encrypted: string | null;
  avatar_url: string | null;
  status: string;
  created_at: string;
}

export interface BrokerFilters {
  province?: string;
  city?: string;
  rating?: string;
  search?: string;
  sort?: 'rating' | 'show_count' | 'good_rate';
  page?: number;
  limit?: number;
}

export async function getBrokers(limit: number = 20): Promise<Broker[]> {
  return query<Broker>(
    "SELECT * FROM brokers WHERE status = ? ORDER BY CASE rating WHEN 'gold' THEN 1 WHEN 'silver' THEN 2 ELSE 3 END, show_count DESC LIMIT ?",
    'active', limit
  );
}

export async function getBrokersFiltered(params: BrokerFilters = {}): Promise<Broker[]> {
  const {
    province, city, rating, search,
    sort = 'show_count', page = 1, limit = 20,
  } = params;

  const limitNum = Math.min(limit, 50);
  let sql = 'SELECT * FROM brokers WHERE status = ?';
  const args: unknown[] = ['active'];

  if (province) { sql += ' AND province = ?'; args.push(province); }
  if (city) { sql += ' AND city = ?'; args.push(city); }
  if (rating) { sql += ' AND rating = ?'; args.push(rating); }
  if (search) { sql += ' AND (name LIKE ? OR region LIKE ? OR bio LIKE ?)'; const q = `%${search}%`; args.push(q, q, q); }

  const sortMap: Record<string, string> = {
    rating: "CASE rating WHEN 'gold' THEN 1 WHEN 'silver' THEN 2 ELSE 3 END",
    show_count: 'show_count DESC',
    good_rate: 'good_rate DESC',
  };
  sql += ` ORDER BY ${sortMap[sort] || sortMap.show_count} LIMIT ? OFFSET ?`;
  args.push(limitNum, (page - 1) * limitNum);

  return query<Broker>(sql, ...args);
}

export async function getBrokersCount(params: BrokerFilters = {}): Promise<number> {
  const { province, city, rating, search } = params;
  let sql = 'SELECT COUNT(*) as count FROM brokers WHERE status = ?';
  const args: unknown[] = ['active'];

  if (province) { sql += ' AND province = ?'; args.push(province); }
  if (city) { sql += ' AND city = ?'; args.push(city); }
  if (rating) { sql += ' AND rating = ?'; args.push(rating); }
  if (search) { sql += ' AND (name LIKE ? OR region LIKE ? OR bio LIKE ?)'; const q = `%${search}%`; args.push(q, q, q); }

  const row = await queryOne<{ count: number }>(sql, ...args);
  return row?.count || 0;
}

export async function getBrokerProvinces(): Promise<string[]> {
  const rows = await query<{ province: string }>(
    "SELECT DISTINCT province FROM brokers WHERE status = 'active' AND province IS NOT NULL ORDER BY province"
  );
  return rows.map((r) => r.province);
}

export async function getBrokerCities(province: string): Promise<string[]> {
  const rows = await query<{ city: string }>(
    "SELECT DISTINCT city FROM brokers WHERE status = 'active' AND province = ? AND city IS NOT NULL ORDER BY city",
    province
  );
  return rows.map((r) => r.city);
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
