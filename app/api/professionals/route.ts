export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { getProfessionals, getProfessionalsCount, getProfessionalStats } from '@/lib/data';

/**
 * GET /api/professionals
 * 公开接口：获取服务商列表
 * 查询参数：prof_type, province, city, search, sort, page, limit
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const prof_type = searchParams.get('type') || searchParams.get('prof_type') || undefined;
  const province = searchParams.get('province') || undefined;
  const city = searchParams.get('city') || undefined;
  const search = searchParams.get('search') || undefined;
  const sort = (searchParams.get('sort') || 'rating') as 'rating' | 'order_count' | 'price_min' | 'newest';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
  const statsOnly = searchParams.get('stats') === '1';

  try {
    // stats=1 时只返回统计数字
    if (statsOnly) {
      const stats = await getProfessionalStats();
      return NextResponse.json({ success: true, stats });
    }

    const [results, total] = await Promise.all([
      getProfessionals({ prof_type, province, city, search, sort, page, limit }),
      getProfessionalsCount({ prof_type, province, city, search }),
    ]);

    return NextResponse.json({
      success: true,
      data: results,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
