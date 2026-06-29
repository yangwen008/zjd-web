export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getEnv } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const env = getEnv();
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json({ success: false, error: '缺少 key' }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ success: false, error: '缺少文件' }, { status: 400 });
    }

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ success: false, error: '不支持的文件类型' }, { status: 400 });
    }

    // 验证文件大小 (最大 50MB)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: '文件大小不能超过 50MB' }, { status: 400 });
    }

    // 上传到 R2
    const arrayBuffer = await file.arrayBuffer();
    await env.R2.put(key, arrayBuffer, {
      httpMetadata: {
        contentType: file.type,
      },
    });

    return NextResponse.json({ 
      success: true, 
      url: `https://zjd-web.pages.dev/api/images/${key}`
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}