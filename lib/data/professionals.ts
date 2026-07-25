// lib/data/professionals.ts — 专业服务商（公证处/律师/风水师）

import { query, queryOne } from '../db';

// ============ 类型定义 ============

export interface Professional {
  id: number;
  user_id: number | null;
  prof_type: string;           // notary/lawyer/fengshui
  name: string;
  org_name: string | null;
  phone: string | null;
  phone_encrypted: string | null;
  avatar_url: string | null;
  bio: string | null;
  license_no: string | null;
  qualification: string | null;
  province: string | null;
  city: string | null;
  district: string | null;
  service_areas: string | null; // JSON
  services: string | null;      // JSON
  pricing_model: string;
  price_min: number | null;
  price_max: number | null;
  rating: number;
  review_count: number;
  order_count: number;
  verified: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ProfessionalOrder {
  id: number;
  professional_id: number;
  asset_id: number | null;
  user_id: number;
  service_name: string;
  status: string;
  contact_name: string | null;
  contact_phone: string | null;
  notes: string | null;
  review_rating: number | null;
  review_text: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfessionalFilters {
  prof_type?: string;
  province?: string;
  city?: string;
  search?: string;
  sort?: 'rating' | 'order_count' | 'price_min' | 'newest';
  page?: number;
  limit?: number;
}

export interface ServiceItem {
  name: string;
  price: string;
  duration: string;
}

// ============ 查询函数 ============

export async function getProfessionals(params: ProfessionalFilters = {}): Promise<Professional[]> {
  const {
    prof_type, province, city, search,
    sort = 'rating', page = 1, limit = 20,
  } = params;

  const limitNum = Math.min(limit, 50);
  let sql = 'SELECT * FROM professionals WHERE status = ?';
  const args: unknown[] = ['active'];

  if (prof_type) { sql += ' AND prof_type = ?'; args.push(prof_type); }
  if (province) { sql += ' AND province = ?'; args.push(province); }
  if (city) { sql += ' AND city = ?'; args.push(city); }
  if (search) {
    sql += ' AND (name LIKE ? OR org_name LIKE ? OR bio LIKE ? OR province LIKE ? OR city LIKE ?)';
    const q = `%${search}%`;
    args.push(q, q, q, q, q);
  }

  const sortMap: Record<string, string> = {
    rating: 'rating DESC',
    order_count: 'order_count DESC',
    price_min: 'price_min ASC',
    newest: 'created_at DESC',
  };
  sql += ` ORDER BY verified DESC, ${sortMap[sort] || sortMap.rating} LIMIT ? OFFSET ?`;
  args.push(limitNum, (page - 1) * limitNum);

  return query<Professional>(sql, ...args);
}

export async function getProfessionalsCount(params: ProfessionalFilters = {}): Promise<number> {
  const { prof_type, province, city, search } = params;
  let sql = 'SELECT COUNT(*) as count FROM professionals WHERE status = ?';
  const args: unknown[] = ['active'];

  if (prof_type) { sql += ' AND prof_type = ?'; args.push(prof_type); }
  if (province) { sql += ' AND province = ?'; args.push(province); }
  if (city) { sql += ' AND city = ?'; args.push(city); }
  if (search) {
    sql += ' AND (name LIKE ? OR org_name LIKE ? OR bio LIKE ?)';
    const q = `%${search}%`;
    args.push(q, q, q);
  }

  const row = await queryOne<{ count: number }>(sql, ...args);
  return row?.count || 0;
}

export async function getProfessionalById(id: number | string): Promise<Professional | null> {
  return queryOne<Professional>(
    'SELECT * FROM professionals WHERE id = ? AND status = ?',
    id, 'active'
  );
}

/**
 * 获取指定资产所在城市/省份的服务商，用于资产详情页"交易保障"模块
 */
export async function getProfessionalsForAsset(
  province: string,
  city: string | null,
  limit: number = 2
): Promise<{ notary: Professional[]; lawyer: Professional[]; fengshui: Professional[] }> {
  const types = ['notary', 'lawyer', 'fengshui'] as const;
  const result: Record<string, Professional[]> = { notary: [], lawyer: [], fengshui: [] };

  for (const t of types) {
    // 优先同城市，其次同省份
    if (city) {
      const cityResults = await query<Professional>(
        'SELECT * FROM professionals WHERE prof_type = ? AND city = ? AND status = ? ORDER BY verified DESC, rating DESC LIMIT ?',
        t, city, 'active', limit
      );
      result[t] = cityResults;
    }
    // 同城市不够，补同省份
    if (result[t].length < limit) {
      const existing = result[t].length;
      const provinceResults = await query<Professional>(
        `SELECT * FROM professionals WHERE prof_type = ? AND province = ? AND status = ?
         AND id NOT IN (${result[t].map(() => '?').join(',') || '?'})
         ORDER BY verified DESC, rating DESC LIMIT ?`,
        t, province, 'active', ...result[t].map(p => p.id), 0, limit - existing
      );
      // 排除已有的
      const existingIds = new Set(result[t].map(p => p.id));
      for (const p of provinceResults) {
        if (!existingIds.has(p.id) && result[t].length < limit) {
          result[t].push(p);
        }
      }
    }
  }

  return result as { notary: Professional[]; lawyer: Professional[]; fengshui: Professional[] };
}

/**
 * 获取各类型服务商数量（用于首页/服务页统计）
 */
export async function getProfessionalStats(): Promise<Record<string, number>> {
  const rows = await query<{ prof_type: string; cnt: number }>(
    "SELECT prof_type, COUNT(*) as cnt FROM professionals WHERE status = 'active' GROUP BY prof_type"
  );
  const stats: Record<string, number> = { notary: 0, lawyer: 0, fengshui: 0 };
  for (const r of rows) {
    stats[r.prof_type] = r.cnt;
  }
  return stats;
}

/**
 * 获取服务商的评价列表
 */
export async function getProfessionalReviews(
  professionalId: number | string,
  limit: number = 10
): Promise<ProfessionalOrder[]> {
  return query<ProfessionalOrder>(
    `SELECT po.*, u.nickname as user_nickname, u.avatar_url as user_avatar
     FROM professional_orders po
     LEFT JOIN users u ON po.user_id = u.id
     WHERE po.professional_id = ? AND po.review_rating IS NOT NULL
     ORDER BY po.created_at DESC LIMIT ?`,
    professionalId, limit
  );
}

/**
 * 创建服务预约
 */
export async function createProfessionalOrder(params: {
  professional_id: number;
  asset_id?: number;
  user_id: number;
  service_name: string;
  contact_name?: string;
  contact_phone?: string;
  notes?: string;
}): Promise<number> {
  const { query: _q, execute } = await import('../db');
  const result = await execute(
    `INSERT INTO professional_orders (professional_id, asset_id, user_id, service_name, contact_name, contact_phone, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    params.professional_id,
    params.asset_id || null,
    params.user_id,
    params.service_name,
    params.contact_name || null,
    params.contact_phone || null,
    params.notes || null
  );
  // 更新订单计数
  await execute(
    'UPDATE professionals SET order_count = order_count + 1 WHERE id = ?',
    params.professional_id
  );
  return result.meta?.last_row_id || 0;
}

/**
 * 解析服务商的 services JSON
 */
export function parseServices(servicesJson: string | null): ServiceItem[] {
  if (!servicesJson) return [];
  try {
    const arr = JSON.parse(servicesJson);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

/**
 * 解析服务商的 service_areas JSON
 */
export function parseServiceAreas(areasJson: string | null): string[] {
  if (!areasJson) return [];
  try {
    const arr = JSON.parse(areasJson);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

/**
 * 获取职业类型中文名
 */
export function getProfTypeLabel(type: string): string {
  const map: Record<string, string> = {
    notary: '公证处',
    lawyer: '律师',
    fengshui: '风水师',
  };
  return map[type] || type;
}

/**
 * 获取职业类型图标
 */
export function getProfTypeIcon(type: string): string {
  const map: Record<string, string> = {
    notary: '📋',
    lawyer: '⚖️',
    fengshui: '🏔️',
  };
  return map[type] || '👤';
}
