/**
 * 批量修复资产图片：下载外部图片 → 上传 R2 → 更新数据库
 * 
 * 用法：在 Cloudflare Workers 环境中运行
 * 或者通过 API 调用：POST /api/admin/fix-images
 */

export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { query, execute, getEnv } from '@/lib/db';
import { requireRole } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const user = await requireRole(request, ['admin', 'superadmin']);
    const env = getEnv();
    const body = await request.json().catch(() => ({})) as { limit?: number };
    const limit = body.limit || 50;

    // 查找有外部图片 URL 的资产
    const assets = await query<{ id: number; images: string }>(
      `SELECT id, images FROM assets 
       WHERE images IS NOT NULL 
       AND images != '[]' 
       AND images NOT LIKE '%/api/images/%'
       AND (images LIKE '%http://%' OR images LIKE '%https://%')
       LIMIT ?`,
      Math.min(limit, 100)
    );

    let fixed = 0;
    let skipped = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const asset of assets) {
      try {
        const imageUrls: string[] = JSON.parse(asset.images);
        if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
          skipped++;
          continue;
        }

        const newImages: string[] = [];
        let changed = false;

        for (const url of imageUrls.slice(0, 5)) { // 最多处理5张
          // 跳过已经是 R2 的
          if (url.startsWith('/api/images/')) {
            newImages.push(url);
            continue;
          }

          // 跳过非图片 URL
          if (!url.startsWith('http')) {
            newImages.push(url);
            continue;
          }

          // 下载图片
          try {
            const res = await fetch(url, {
              headers: { 'User-Agent': 'Mozilla/5.0 (compatible; zjd-bot/1.0)' },
              signal: AbortSignal.timeout(10000),
            });

            if (!res.ok) {
              // 下载失败，保留原始 URL
              newImages.push(url);
              continue;
            }

            const ct = res.headers.get('content-type') || '';
            if (!ct.startsWith('image/')) {
              newImages.push(url);
              continue;
            }

            const buffer = await res.arrayBuffer();
            if (buffer.byteLength > 5 * 1024 * 1024) {
              newImages.push(url);
              continue;
            }

            // 上传到 R2
            const ext = ct.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
            const key = `scraped/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
            await env.R2.put(key, buffer, { httpMetadata: { contentType: ct } });

            newImages.push(`/api/images/${key}`);
            changed = true;

            // 间隔 200ms
            await new Promise(r => setTimeout(r, 200));
          } catch {
            newImages.push(url); // 下载失败保留原始
          }
        }

        if (changed) {
          await execute(
            'UPDATE assets SET images = ?, updated_at = datetime("now") WHERE id = ?',
            JSON.stringify(newImages), asset.id
          );
          fixed++;
        } else {
          skipped++;
        }
      } catch (e: any) {
        failed++;
        errors.push(`ID ${asset.id}: ${e.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        total: assets.length,
        fixed,
        skipped,
        failed,
        errors: errors.slice(0, 10),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
