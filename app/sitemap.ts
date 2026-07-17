import type { MetadataRoute } from 'next';
import { query } from '@/lib/db';

export const runtime = 'edge';
export const revalidate = 3600; // 1小时缓存

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://z.zjd.cn';

  // 静态页面
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/search`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/regions`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/market-index`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/brokers`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/bulk-projects`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/infra-rating`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/village`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/smart-search`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    { url: `${baseUrl}/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${baseUrl}/register`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  ];

  // �态资产页面
  let assetPages: MetadataRoute.Sitemap = [];
  try {
    const assets = await query<{ id: number; updated_at: string }>(
      "SELECT id, updated_at FROM assets WHERE status = 'approved' ORDER BY updated_at DESC LIMIT 5000"
    );
    assetPages = assets.map((a) => ({
      url: `${baseUrl}/asset/${a.id}`,
      lastModified: new Date(a.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
  } catch {}

  // 动态大宗项目页面
  let bulkPages: MetadataRoute.Sitemap = [];
  try {
    const bulks = await query<{ id: number; updated_at: string }>(
      "SELECT id, updated_at FROM bulk_projects WHERE status = 'approved' ORDER BY updated_at DESC LIMIT 1000"
    );
    bulkPages = bulks.map((b) => ({
      url: `${baseUrl}/bulk-projects/${b.id}`,
      lastModified: new Date(b.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  } catch {}

  // 合伙人页面
  let brokerPages: MetadataRoute.Sitemap = [];
  try {
    const brokers = await query<{ id: number; created_at: string }>(
      "SELECT id, created_at FROM brokers WHERE status = 'active' ORDER BY created_at DESC LIMIT 500"
    );
    brokerPages = brokers.map((b) => ({
      url: `${baseUrl}/brokers/${b.id}`,
      lastModified: new Date(b.created_at),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }));
  } catch {}

  return [...staticPages, ...assetPages, ...bulkPages, ...brokerPages];
}
