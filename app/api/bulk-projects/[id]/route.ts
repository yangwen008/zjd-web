export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { getBulkProjectById, incrementBulkViews } from '@/lib/data';

/**
 * GET /api/bulk-projects/:id
 * 获取大宗项目详情
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const project = await getBulkProjectById(id);
    if (!project) {
      return NextResponse.json({ success: false, error: '项目不存在' }, { status: 404 });
    }

    incrementBulkViews(id).catch(() => {});

    return NextResponse.json({ success: true, data: project });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
