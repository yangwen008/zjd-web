export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level') || 'province';
    const parentCode = searchParams.get('parent_code');
    const province = searchParams.get('province');
    const city = searchParams.get('city');
    const q = searchParams.get('q');

    // 模糊搜索
    if (q) {
      const results = await query(
        'SELECT * FROM regions WHERE active = 1 AND name LIKE ? ORDER BY level, sort_order LIMIT 20',
        `%${q}%`
      );
      return NextResponse.json({ success: true, data: results });
    }

    // 按省份查城市
    if (level === 'city' && province) {
      const results = await query(
        'SELECT * FROM regions WHERE level = ? AND province = ? AND active = 1 ORDER BY sort_order',
        'city', province
      );
      return NextResponse.json({ success: true, data: results });
    }

    // 按城市查区县
    if (level === 'district' && city && province) {
      const results = await query(
        'SELECT * FROM regions WHERE level = ? AND city = ? AND province = ? AND active = 1 ORDER BY sort_order',
        'district', city, province
      );
      return NextResponse.json({ success: true, data: results });
    }

    // 按 parent_code 查
    if (parentCode) {
      const results = await query(
        'SELECT * FROM regions WHERE parent_code = ? AND active = 1 ORDER BY sort_order',
        parentCode
      );
      return NextResponse.json({ success: true, data: results });
    }

    // 默认：查指定级别
    const results = await query(
      'SELECT * FROM regions WHERE level = ? AND active = 1 ORDER BY sort_order',
      level
    );
    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
