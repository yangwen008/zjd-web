// lib/data/publisher.ts — 发布者资料

import { query, queryOne } from '../db';
import type { Asset } from './assets';

export interface PublisherProfile {
  id: number;
  nickname: string;
  avatar_url: string | null;
  role: string;
  org_name: string | null;
  org_license: string | null;
  verified: number;
  broker_region: string | null;
  broker_specialties: string | null;
  broker_bio: string | null;
  bio: string | null;
  created_at: string;
  asset_count: number;
  total_views: number;
}

export async function getPublisherProfile(id: number | string): Promise<PublisherProfile | null> {
  return queryOne<PublisherProfile>(
    `SELECT u.id, u.nickname, u.avatar_url, u.role, u.org_name, u.org_license,
            u.verified, u.broker_region, u.broker_specialties, u.broker_bio, u.bio, u.created_at,
            (SELECT COUNT(*) FROM assets WHERE user_id = u.id AND status = 'approved') as asset_count,
            (SELECT COALESCE(SUM(views), 0) FROM assets WHERE user_id = u.id AND status = 'approved') as total_views
     FROM users u WHERE u.id = ? AND u.status = 'active'`,
    id
  );
}

export async function getPublisherAssets(userId: number | string, limit: number = 12, offset: number = 0): Promise<Asset[]> {
  return query<Asset>(
    `SELECT a.*, u.nickname as publisher_name, u.role as publisher_role
     FROM assets a LEFT JOIN users u ON a.user_id = u.id
     WHERE a.user_id = ? AND a.status = 'approved'
     ORDER BY a.featured DESC, a.created_at DESC LIMIT ? OFFSET ?`,
    userId, limit, offset
  );
}

export async function getPublisherAssetCount(userId: number | string): Promise<number> {
  const row = await queryOne<{ cnt: number }>(
    `SELECT COUNT(*) as cnt FROM assets WHERE user_id = ? AND status = 'approved'`,
    userId
  );
  return row?.cnt ?? 0;
}
