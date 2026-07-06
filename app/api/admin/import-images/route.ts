export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { getEnv } from '@/lib/db';
import { requireRole } from '@/lib/auth';

/**
 * POST /api/admin/import-images
 * 批量下载外部图片并上传到 R2
 * 
 * Body: { urls: string[] }
 * Returns: { results: { original: string, r2key: string, proxyUrl: string }[] }
 */

export async function POST(request: Request) {
  try {
    await requireRole(request, ['admin', 'superadmin']);
    const env = getEnv();
    const { urls } = await request.json() as { urls: string[] };

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ success: false, error: '缺少 urls 数组' }, { status: 400 });
    }

    // 限制每次最多处理 20 张
    const limitedUrls = urls.slice(0, 20);
    const results: { original: string; r2key: string; proxyUrl: string; error?: string }[] = [];

    for (const url of limitedUrls) {
      try {
        // 跳过已经是 R2 代理路径的 URL
        if (url.startsWith('/api/images/')) {
          results.push({ original: url, r2key: url.replace('/api/images/', ''), proxyUrl: url });
          continue;
        }

        // 下载图片
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; zjd-bot/1.0)',
            'Referer': new URL(url).origin,
          },
          signal: AbortSignal.timeout(15000),
        });

        if (!res.ok) {
          results.push({ original: url, r2key: '', proxyUrl: '', error: `HTTP ${res.status}` });
          continue;
        }

        const contentType = res.headers.get('content-type') || 'image/jpeg';
        if (!contentType.startsWith('image/')) {
          results.push({ original: url, r2key: '', proxyUrl: '', error: `非图片类型: ${contentType}` });
          continue;
        }

        const buffer = await res.arrayBuffer();
        if (buffer.byteLength > 10 * 1024 * 1024) {
          results.push({ original: url, r2key: '', proxyUrl: '', error: '图片超过10MB' });
          continue;
        }

        // 生成 R2 key
        const ext = contentType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        const key = `scraped/${timestamp}-${randomStr}.${ext}`;

        // 上传到 R2
        await env.R2.put(key, buffer, {
          httpMetadata: { contentType },
          customMetadata: { source: url, importedAt: new Date().toISOString() },
        });

        const proxyUrl = `/api/images/${key}`;
        results.push({ original: url, r2key: key, proxyUrl });

        // 间隔 200ms 避免过快
        await new Promise(r => setTimeout(r, 200));
      } catch (err: any) {
        results.push({ original: url, r2key: '', proxyUrl: '', error: err.message });
      }
    }

    const successCount = results.filter(r => !r.error).length;
    const failCount = results.filter(r => r.error).length;

    return NextResponse.json({
      success: true,
      data: { total: limitedUrls.length, success: successCount, failed: failCount, results },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
