// lib/data/config.ts — 首页配置

import { query } from '../db';

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
  section_latest_title: '最新发布',
  section_latest_subtitle: '查看全部最新资产',
  section_latest_count: '6',
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
