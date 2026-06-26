export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { getBrokersFiltered, getBrokersCount, getBrokerProvinces, getBrokerCities } from '@/lib/data';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // 如果请求 provinces 列表
    if (searchParams.get('action') === 'provinces') {
      const provinces = await getBrokerProvinces();
      return NextResponse.json({ success: true, data: provinces });
    }

    // 如果请求某省的 cities 列表
    if (searchParams.get('action') === 'cities') {
      const province = searchParams.get('province') || '';
      const cities = await getBrokerCities(province);
      return NextResponse.json({ success: true, data: cities });
    }

    // 正常筛选查询
    const params = {
      province: searchParams.get('province') || undefined,
      city: searchParams.get('city') || undefined,
      rating: searchParams.get('rating') || undefined,
      search: searchParams.get('search') || undefined,
      sort: (searchParams.get('sort') as 'rating' | 'show_count' | 'good_rate') || 'show_count',
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    };

    const [brokers, total] = await Promise.all([
      getBrokersFiltered(params),
      getBrokersCount(params),
    ]);

    return NextResponse.json({
      success: true,
      data: brokers,
      total,
      page: params.page,
      pageSize: params.limit,
      totalPages: Math.ceil(total / params.limit),
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
