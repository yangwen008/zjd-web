export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { getAssets, getAssetsCount } from '@/lib/data';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const source = searchParams.get('source') || undefined;
  const province = searchParams.get('province') || undefined;
  const asset_type = searchParams.get('asset_type') || undefined;
  const search = searchParams.get('search') || undefined;
  const sort = searchParams.get('sort') || 'views';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

  try {
    const [results, total] = await Promise.all([
      getAssets({ source, province, asset_type, search, sort, page, limit }),
      getAssetsCount({ source, province, asset_type, search }),
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
