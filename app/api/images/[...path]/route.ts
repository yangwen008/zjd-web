export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getEnv } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const env = getEnv();
    const { path } = await params;
    const key = path.join('/');

    // 安全检查：防止路径遍历攻击
    if (!key || key.includes('..') || key.startsWith('/')) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    // 从 R2 获取文件对象
    const object = await env.R2.get(key);

    if (!object) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // 设置响应头
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);

    // 缓存策略
    const contentType = object.httpMetadata?.contentType || '';
    if (contentType.startsWith('image/')) {
      headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (contentType.startsWith('video/')) {
      headers.set('Cache-Control', 'public, max-age=86400');
    } else {
      headers.set('Cache-Control', 'public, max-age=3600');
    }

    return new Response(object.body, { headers });
  } catch (error) {
    console.error('Image proxy error:', error);
    return NextResponse.json({ error: 'Failed to load file' }, { status: 500 });
  }
}
