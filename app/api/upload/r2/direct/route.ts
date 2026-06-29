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
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ success: false, error: '不支持的文件类型' }, { status: 400 });
    }

    // 验证文件大小
    const maxSize = file.type.startsWith('image/') ? 10 * 1024 * 1024 : 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ success: false, error: '文件大小超过限制' }, { status: 400 });
    }

    // 上传到R2
    const arrayBuffer = await file.arrayBuffer();
    await env.R2.put(key, arrayBuffer, {
      httpMetadata: {
        contentType: file.type,
      },
      customMetadata: {
        uploadedAt: new Date().toISOString(),
      },
    });

    // 生成公开访问URL（需要R2 bucket配置公开访问）
    // 方式1：使用Cloudflare R2公开域名
    const publicUrl = `https://pub-xxxx.r2.dev/${key}`; // 替换为你的R2公开域名
    
    // 方式2：使用自定义域名（如果配置了）
    // const publicUrl = `https://assets.zjd.cn/${key}`;

    return NextResponse.json({ 
      success: true, 
      url: publicUrl,
      key
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
