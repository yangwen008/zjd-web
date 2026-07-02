export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { getBulkProjects, getBulkProjectsCount } from '@/lib/data';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const province = searchParams.get('province') || undefined;
  const search = searchParams.get('search') || undefined;
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '16'), 50);

  try {
    const [results, total] = await Promise.all([
      getBulkProjects({ province, search, page, limit }),
      getBulkProjectsCount({ province, search }),
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
