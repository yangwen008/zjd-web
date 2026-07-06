// lib/data/regions.ts — 行政区划 + 资产类型

import { query, queryOne } from '../db';

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
