export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { execute, queryOne, getEnv } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { writeAuditLog } from '@/lib/audit';

/**
 * POST /api/admin/import-tuliu
 * 导入采集数据到 assets 表，支持自动下载图片上传到 R2
 * 
 * Body: { items: Array<ImportItem>, uploadImages?: boolean }
 */

interface ImportItem {
  title: string;
  location?: string;
  province?: string;
  city?: string;
  district?: string;
  area_mu?: number | null;
  price_year?: number | null;
  price_total?: number | null;
  lease_years?: number | null;
  asset_type?: string;
  source_url?: string;
  images?: string;
  description?: string;
  contact_name?: string;
}

// 下载外部图片并上传到 R2
async function downloadAndUploadToR2(r2: R2Bucket, url: string): Promise<string | null> {
  try {
    if (url.startsWith('/api/images/')) return url;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; zjd-bot/1.0)' },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') || '';
    if (!ct.startsWith('image/')) return null;
    const buffer = await res.arrayBuffer();
    if (buffer.byteLength > 5 * 1024 * 1024) return null;
    const ext = ct.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
    const key = `scraped/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
    await r2.put(key, buffer, { httpMetadata: { contentType: ct } });
    return `/api/images/${key}`;
  } catch {
    return null;
  }
}

// 处理图片数组：下载外部图片上传到 R2
async function processImages(r2: R2Bucket, imagesJson: string, uploadImages: boolean): Promise<string> {
  if (!uploadImages) return imagesJson;
  try {
    const arr = JSON.parse(imagesJson);
    if (!Array.isArray(arr) || arr.length === 0) return imagesJson;
    const processed: string[] = [];
    for (const item of arr.slice(0, 5)) { // 最多处理5张
      const url = typeof item === 'object' ? (item.url || item.thumb || '') : item;
      if (!url) continue;
      const r2Url = await downloadAndUploadToR2(r2, url);
      processed.push(r2Url || url); // 上传失败则保留原始URL
    }
    return JSON.stringify(processed);
  } catch {
    return imagesJson;
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole(request, ['admin', 'superadmin']);
    const body = await request.json() as { items: ImportItem[]; uploadImages?: boolean };

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ success: false, error: '缺少 items 数组' }, { status: 400 });
    }

    const env = getEnv();
    const uploadImages = body.uploadImages !== false; // 默认开启图片上传到R2

    // 获取来源账号
    const sourceAccount = await queryOne<{ user_id: number }>(
      `SELECT user_id FROM source_accounts WHERE (name LIKE '%土流网%' OR name LIKE '%聚土网%') AND enabled = 1 LIMIT 1`
    );
    const defaultUserId = sourceAccount?.user_id || user.id;

    let imported = 0;
    let skipped = 0;
    let imagesUploaded = 0;
    const errors: string[] = [];

    for (const item of body.items) {
      try {
        // 去重：检查 source_url
        if (item.source_url) {
          const existing = await queryOne<{ id: number }>(
            'SELECT id FROM assets WHERE source_url = ?', item.source_url
          );
          if (existing) { skipped++; continue; }
        }

        // 去重：检查标题+省份
        const titleDup = await queryOne<{ id: number }>(
          'SELECT id FROM assets WHERE title = ? AND province = ?', item.title, item.province || ''
        );
        if (titleDup) { skipped++; continue; }

        // 处理图片（可选上传到 R2）
        const images = await processImages(env.R2, item.images || '[]', uploadImages);

        await execute(
          `INSERT INTO assets (
            title, description, location, province, city, district,
            area_mu, price_year, price_total, lease_years,
            asset_type, source_type, source_url, images,
            contact_name, status, user_id,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
          item.title,
          item.description || null,
          item.location || [item.province, item.city, item.district].filter(Boolean).join('/'),
          item.province || null, item.city || null, item.district || null,
          item.area_mu || null, item.price_year || null, item.price_total || null,
          item.lease_years || null, item.asset_type || '宅基地',
          'official', item.source_url || null, images,
          item.contact_name || null, 'approved', defaultUserId,
        );
        imported++;
      } catch (e: any) {
        errors.push(`${item.title}: ${e.message}`);
      }
    }

    await writeAuditLog({
      userId: user.id, userRole: user.role,
      action: 'import', module: 'scraper', targetType: 'scraped_data',
      detail: `导入数据: ${imported}条成功, ${skipped}条跳过, ${errors.length}条失败, ${imagesUploaded}张图片上传R2`,
      request,
    });

    return NextResponse.json({
      success: true,
      data: {
        total: body.items.length, imported, skipped,
        failed: errors.length, imagesUploaded,
        errors: errors.slice(0, 10),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
