export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { getAssetById, getAssets, incrementViews } from '@/lib/data';

/**
 * GET /api/assets/:id
 * 获取单个资产详情（小程序和H5共用）
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const asset = await getAssetById(id);
    if (!asset) {
      return NextResponse.json({ success: false, error: '资产不存在' }, { status: 404 });
    }

    // 异步增加浏览量
    incrementViews(id).catch(() => {});

    return NextResponse.json({ success: true, data: asset });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
