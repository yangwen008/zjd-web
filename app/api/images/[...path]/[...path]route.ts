export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getEnv } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { path: string[] } }
) {
  try {
    const env = getEnv();
    // 将 URL 路径拼接成 R2 的 key，例如 ['uploads', '123.jpg'] -> 'uploads/123.jpg'
    const key = params.path.join('/');
    
    // 安全检查：防止路径遍历攻击 (如 ../../../etc/passwd)
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
    
    // 设置缓存策略，减轻服务器压力
    if (object.httpMetadata?.contentType?.startsWith('image/')) {
      headers.set('Cache-Control', 'public, max-age=31536000, immutable'); // 图片缓存1年
    } else if (object.httpMetadata?.contentType?.startsWith('video/')) {
      headers.set('Cache-Control', 'public, max-age=86400'); // 视频缓存1天
    } else {
      headers.set('Cache-Control', 'public, max-age=3600'); // 其他缓存1小时
    }

    // 返回文件流
    return new Response(object.body, {
      headers,
    });
  } catch (error) {
    console.error('Image proxy error:', error);
    return NextResponse.json({ error: 'Failed to load file' }, { status: 500 });
  }
}
