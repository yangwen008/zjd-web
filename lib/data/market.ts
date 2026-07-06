// lib/data/market.ts — 行情数据 + 基建评分

import { query, queryOne } from '../db';

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

export async function getMarketDataByProvince(province: string): Promise<MarketData | null> {
  return queryOne<MarketData>(
    'SELECT * FROM market_data WHERE province = ?',
    province
  );
}

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

export async function getInfraRatingById(id: number | string): Promise<InfraRating | null> {
  return queryOne<InfraRating>(
    'SELECT * FROM infrastructure_ratings WHERE id = ?',
    id
  );
}
