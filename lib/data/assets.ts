// lib/data/assets.ts — 资产查询

import { query, queryOne } from '../db';

export interface Asset {
  id: number;
  publisher_name?: string;
  publisher_role?: string;
  publisher_avatar?: string;
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
  infra_details: string | null;
  transport_info: string | null;
  cert_info: string | null;
  certification: string;
  invest_enabled: number;
  invest_total_shares: number | null;
  invest_share_price: number | null;
  invest_min_shares: number;
  invest_sold_shares: number;
  created_at: string;
  updated_at: string;
}

function enrichPublisherName(assets: Asset[]): Asset[] {
  return assets.map(a => ({
    ...a,
    publisher_name: (a as any).publisher_name || '平台',
    publisher_role: (a as any).publisher_role || 'user',
    publisher_avatar: (a as any).publisher_avatar || null,
  }));
}

export interface AssetFilters {
  source?: string;
  province?: string;
  areaMin?: number;
  areaMax?: number;
  priceMin?: number;
  priceMax?: number;
  search?: string;
  sort?: string;
  page?: number;
  limit?: number;
  featured?: boolean;
}

function buildAssetQuery(params: AssetFilters, countOnly = false) {
  const {
    source, province, areaMin, areaMax,
    priceMin, priceMax, search, sort,
    page = 1, limit = 20, featured,
  } = params;

  const limitNum = Math.min(limit, 50);
  let sql: string;
  let args: unknown[] = [];

  if (search) {
    const selectClause = countOnly
      ? 'SELECT COUNT(*) as count'
      : `SELECT assets.*, u.nickname as publisher_name, u.role as publisher_role`;
    const joinClause = countOnly ? '' : ' LEFT JOIN users u ON assets.user_id = u.id';
    sql = `${selectClause} FROM assets${joinClause}
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
    const selectClause = countOnly ? 'SELECT COUNT(*) as count' : `SELECT assets.*, u.nickname as publisher_name, u.role as publisher_role`;
    const joinClause = countOnly ? '' : ' LEFT JOIN users u ON assets.user_id = u.id';
    sql = `${selectClause} FROM assets${joinClause} WHERE assets.status = ?`;
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
    const orderBy = sort === 'price' ? 'price_year ASC' : sort === 'newest' ? 'created_at DESC' : 'views DESC';
    sql += ` ORDER BY featured DESC, ${orderBy} LIMIT ? OFFSET ?`;
    args.push(limitNum, (page - 1) * limitNum);
  }

  return { sql, args };
}

export async function getAssets(params: AssetFilters = {}): Promise<Asset[]> {
  const { sql, args } = buildAssetQuery(params);
  const assets = await query<Asset>(sql, ...args);
  return enrichPublisherName(assets);
}

export async function getAssetsCount(params: AssetFilters = {}): Promise<number> {
  const { sql, args } = buildAssetQuery(params, true);
  const row = await queryOne<{ count: number }>(sql, ...args);
  return row?.count || 0;
}

export async function getAssetById(id: number | string): Promise<Asset | null> {
  return queryOne<Asset>(
    'SELECT a.*, u.nickname as publisher_name, u.role as publisher_role, u.avatar_url as publisher_avatar FROM assets a LEFT JOIN users u ON a.user_id = u.id WHERE a.id = ? AND a.status = ?',
    id, 'approved'
  );
}

export async function getHotAssets(limit: number = 6): Promise<Asset[]> {
  return query<Asset>(
    'SELECT a.*, u.nickname as publisher_name, u.role as publisher_role FROM assets a LEFT JOIN users u ON a.user_id = u.id WHERE a.status = ? ORDER BY a.featured DESC, a.views DESC LIMIT ?',
    'approved', limit
  );
}

export async function getFeaturedAssets(limit: number = 6): Promise<Asset[]> {
  return query<Asset>(
    'SELECT a.*, u.nickname as publisher_name, u.role as publisher_role FROM assets a LEFT JOIN users u ON a.user_id = u.id WHERE a.status = ? AND a.featured = 1 ORDER BY a.views DESC LIMIT ?',
    'approved', limit
  );
}

export async function getAssetsBySource(sourceType: string, limit: number = 6): Promise<Asset[]> {
  return query<Asset>(
    'SELECT a.*, u.nickname as publisher_name, u.role as publisher_role FROM assets a LEFT JOIN users u ON a.user_id = u.id WHERE a.status = ? AND a.source_type = ? ORDER BY a.featured DESC, a.created_at DESC LIMIT ?',
    'approved', sourceType, limit
  );
}

export async function getLatestAssets(limit: number = 6): Promise<Asset[]> {
  return query<Asset>(
    'SELECT a.*, u.nickname as publisher_name, u.role as publisher_role FROM assets a LEFT JOIN users u ON a.user_id = u.id WHERE a.status = ? ORDER BY a.featured DESC, a.created_at DESC LIMIT ?',
    'approved', limit
  );
}

export async function getAssetsByProvince(province: string, limit: number = 20): Promise<Asset[]> {
  return query<Asset>(
    'SELECT a.*, u.nickname as publisher_name, u.role as publisher_role FROM assets a LEFT JOIN users u ON a.user_id = u.id WHERE a.status = ? AND a.province = ? ORDER BY a.featured DESC, a.views DESC LIMIT ?',
    'approved', province, limit
  );
}

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

export async function searchAssets(keyword: string, limit: number = 20): Promise<Asset[]> {
  return query<Asset>(
    `SELECT assets.* FROM assets
     JOIN assets_fts ON assets.id = assets_fts.rowid
     WHERE assets.status = ? AND assets_fts MATCH ?
     ORDER BY assets.featured DESC, assets.views DESC LIMIT ?`,
    'approved', keyword, limit
  );
}

export async function incrementViews(id: number | string): Promise<void> {
  await queryOne('UPDATE assets SET views = views + 1 WHERE id = ?', id);
}
