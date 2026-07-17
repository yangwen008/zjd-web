export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getEnv } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const env = getEnv();
    const { filename, contentType } = await request.json() as { filename: string; contentType: string };

    if (!filename || !contentType) {
      return NextResponse.json({ success: false, error: '缺少文件名或类型' }, { status: 400 });
    }

    // 生成唯一文件名
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const ext = filename.split('.').pop() || 'jpg';
    const key = `uploads/${timestamp}-${randomStr}.${ext}`;

    // 创建 R2 预签名 URL (用于直接上传)
    // 注意：这里需要 Cloudflare Workers 的 R2 binding
    // 如果使用 Pages Functions，需要调整
    
    return NextResponse.json({ 
      success: true, 
      uploadUrl: `/api/upload/r2/direct?key=${encodeURIComponent(key)}`,
      key,
      publicUrl: `https://z.zjd.cn/api/images/${key}`
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}