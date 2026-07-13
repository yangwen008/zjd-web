// lib/data/brokers.ts — 合伙人

import { query, queryOne } from '../db';

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
    "SELECT b.*, COALESCE(NULLIF(b.avatar_url, ''), u.avatar_url) as avatar_url FROM brokers b LEFT JOIN users u ON b.user_id = u.id WHERE b.status = ? ORDER BY CASE b.rating WHEN 'gold' THEN 1 WHEN 'silver' THEN 2 ELSE 3 END, b.show_count DESC LIMIT ?",
    'active', limit
  );
}

export async function getBrokersFiltered(params: BrokerFilters = {}): Promise<Broker[]> {
  const {
    province, city, rating, search,
    sort = 'show_count', page = 1, limit = 20,
  } = params;

  const limitNum = Math.min(limit, 50);
  let sql = 'SELECT b.*, COALESCE(NULLIF(b.avatar_url, \'\'), u.avatar_url) as avatar_url FROM brokers b LEFT JOIN users u ON b.user_id = u.id WHERE b.status = ?';
  const args: unknown[] = ['active'];

  if (province) { sql += ' AND b.province = ?'; args.push(province); }
  if (city) { sql += ' AND b.city = ?'; args.push(city); }
  if (rating) { sql += ' AND b.rating = ?'; args.push(rating); }
  if (search) { sql += ' AND (b.name LIKE ? OR b.region LIKE ? OR b.bio LIKE ?)'; const q = `%${search}%`; args.push(q, q, q); }

  const sortMap: Record<string, string> = {
    rating: "CASE b.rating WHEN 'gold' THEN 1 WHEN 'silver' THEN 2 ELSE 3 END",
    show_count: 'b.show_count DESC',
    good_rate: 'b.good_rate DESC',
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

export async function getBrokerById(id: number | string): Promise<Broker | null> {
  return queryOne<Broker>(
    'SELECT b.*, COALESCE(NULLIF(b.avatar_url, \'\'), u.avatar_url) as avatar_url FROM brokers b LEFT JOIN users u ON b.user_id = u.id WHERE b.id = ? AND b.status = ?',
    id, 'active'
  );
}

export async function getBrokerProvinces(): Promise<{ name: string; emoji: string | null; broker_count: number }[]> {
  const regions = await query<{ name: string; emoji: string }>(
    "SELECT name, emoji FROM regions WHERE level = 'province' AND active = 1 ORDER BY sort_order"
  );
  const counts = await query<{ province: string; cnt: number }>(
    "SELECT province, COUNT(*) as cnt FROM brokers WHERE status = 'active' AND province IS NOT NULL GROUP BY province"
  );
  const countMap: Record<string, number> = {};
  for (const c of counts) countMap[c.province] = c.cnt;
  return regions.map((r) => ({
    name: r.name,
    emoji: r.emoji,
    broker_count: countMap[r.name] || 0,
  }));
}

export async function getBrokerCities(province: string): Promise<string[]> {
  const regionCities = await query<{ name: string }>(
    "SELECT name FROM regions WHERE level = 'city' AND province = ? AND active = 1 ORDER BY sort_order",
    province
  );
  if (regionCities.length > 0) return regionCities.map((r) => r.name);
  const rows = await query<{ city: string }>(
    "SELECT DISTINCT city FROM brokers WHERE status = 'active' AND province = ? AND city IS NOT NULL ORDER BY city",
    province
  );
  return rows.map((r) => r.city);
}
