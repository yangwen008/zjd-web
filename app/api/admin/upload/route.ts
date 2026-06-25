export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { getEnv } from '@/lib/db';
import { uploadToR2, getR2PublicUrl } from '@/lib/r2';

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // 校验文件类型
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!ALLOWED_EXTENSIONS.includes(ext) || !ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: `Invalid file type. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}` },
        { status: 400 }
      );
    }

    // 校验文件大小
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: `File too large. Max size: 5MB` },
        { status: 400 }
      );
    }

    // 生成存储路径：assets/{timestamp}-{random}.{ext}
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10);
    const key = `assets/${timestamp}-${random}.${ext}`;

    // 上传到 R2
    const buffer = await file.arrayBuffer();
    const env = getEnv();
    await uploadToR2(env, key, buffer, file.type);

    const url = getR2PublicUrl(key);

    return NextResponse.json({ success: true, key, url });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
