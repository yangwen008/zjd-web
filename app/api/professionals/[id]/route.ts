export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { getProfessionalById, getProfessionalReviews } from '@/lib/data';

/**
 * GET /api/professionals/[id]
 * 公开接口：获取服务商详情（含评价）
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const professional = await getProfessionalById(id);
    if (!professional) {
      return NextResponse.json({ success: false, error: '服务商不存在' }, { status: 404 });
    }

    const reviews = await getProfessionalReviews(id, 10);

    return NextResponse.json({
      success: true,
      data: professional,
      reviews,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
