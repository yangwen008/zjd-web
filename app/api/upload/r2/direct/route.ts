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
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm', 'video/quicktime',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ success: false, error: `不支持的文件类型: ${file.type}` }, { status: 400 });
    }

    // 验证文件大小 (图片10M，视频100M，文档20M)
    let maxSize = 10 * 1024 * 1024;
    if (file.type.startsWith('video/')) maxSize = 100 * 1024 * 1024;
    else if (file.type.startsWith('application/')) maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ success: false, error: '文件大小超过限制' }, { status: 400 });
    }

    // 上传到 R2
    const arrayBuffer = await file.arrayBuffer();
    await env.R2.put(key, arrayBuffer, {
      httpMetadata: {
        contentType: file.type,
      },
      customMetadata: {
        uploadedAt: new Date().toISOString(),
      },
    });

    // 【核心区别】：不返回 R2 公开域名，而是返回我们自己的代理 API 路径
    const proxyUrl = `/api/images/${key}`;

    return NextResponse.json({ 
      success: true, 
      url: proxyUrl,
      key
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
