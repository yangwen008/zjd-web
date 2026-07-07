// lib/data/bulk-projects.ts — 大宗路演项目

import { query, queryOne } from '../db';

export interface BulkProject {
  id: number;
  title: string;
  code: string | null;
  description: string | null;
  location: string | null;
  province: string | null;
  city: string | null;
  district: string | null;
  area_mu: number | null;
  area_sqm: number | null;
  price_total: number | null;
  price_start: number | null;
  yield_rate: number | null;
  lease_years: number | null;
  certification: string;
  planning_use: string | null;
  images: string | null;
  video_url: string | null;
  commercial_plan: string | null;
  cert_doc_url: string | null;
  infra_details: string | null;
  transport_info: string | null;
  cert_info: string | null;
  gps_lat: number | null;
  gps_lng: number | null;
  contact_name: string | null;
  contact_phone: string | null;
  views: number;
  status: string;
  featured: number;
  user_id: number | null;
  invest_enabled: number;
  invest_total_shares: number | null;
  invest_share_price: number | null;
  invest_min_shares: number;
  invest_sold_shares: number;
  created_at: string;
  updated_at: string;
}

export interface BulkProjectFilters {
  province?: string;
  status?: string;
  featured?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export async function getBulkProjects(params: BulkProjectFilters = {}): Promise<BulkProject[]> {
  const { province, status = 'approved', featured, search, page = 1, limit = 20 } = params;
  const limitNum = Math.min(limit, 50);
  let sql = 'SELECT * FROM bulk_projects WHERE status = ?';
  const args: unknown[] = [status];
  if (province) { sql += ' AND province = ?'; args.push(province); }
  if (featured) { sql += ' AND featured = 1'; }
  if (search) { sql += ' AND (title LIKE ? OR description LIKE ? OR location LIKE ?)'; const q = `%${search}%`; args.push(q, q, q); }
  sql += ' ORDER BY featured DESC, views DESC LIMIT ? OFFSET ?';
  args.push(limitNum, (page - 1) * limitNum);
  return query<BulkProject>(sql, ...args);
}

export async function getBulkProjectsCount(params: BulkProjectFilters = {}): Promise<number> {
  const { province, status = 'approved', featured, search } = params;
  let sql = 'SELECT COUNT(*) as count FROM bulk_projects WHERE status = ?';
  const args: unknown[] = [status];
  if (province) { sql += ' AND province = ?'; args.push(province); }
  if (featured) { sql += ' AND featured = 1'; }
  if (search) { sql += ' AND (title LIKE ? OR description LIKE ? OR location LIKE ?)'; const q = `%${search}%`; args.push(q, q, q); }
  const row = await queryOne<{ count: number }>(sql, ...args);
  return row?.count || 0;
}

export async function getBulkProjectById(id: number | string): Promise<BulkProject | null> {
  return queryOne<BulkProject>(
    `SELECT bp.*,
            COALESCE(bp.contact_phone, u.phone) as contact_phone,
            COALESCE(bp.contact_name, u.nickname) as contact_name,
            u.nickname as publisher_name, u.role as publisher_role
     FROM bulk_projects bp LEFT JOIN users u ON bp.user_id = u.id
     WHERE bp.id = ? AND bp.status = ?`,
    id, 'approved'
  );
}

export async function getFeaturedBulkProjects(limit: number = 2): Promise<BulkProject[]> {
  return query<BulkProject>(
    'SELECT * FROM bulk_projects WHERE status = ? AND featured = 1 ORDER BY views DESC LIMIT ?',
    'approved', limit
  );
}

export async function incrementBulkViews(id: number | string): Promise<void> {
  await queryOne('UPDATE bulk_projects SET views = views + 1 WHERE id = ?', id);
}
