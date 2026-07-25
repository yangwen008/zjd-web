export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/lib/db';

/**
 * GET /api/admin/professionals — 获取所有服务商（含非活跃）
 * POST /api/admin/professionals — 新增/更新服务商
 * DELETE /api/admin/professionals — 删除服务商
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const prof_type = searchParams.get('type') || undefined;
  const status = searchParams.get('status') || undefined;
  const search = searchParams.get('search') || undefined;
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

  let sql = 'SELECT * FROM professionals WHERE 1=1';
  const args: unknown[] = [];

  if (prof_type) { sql += ' AND prof_type = ?'; args.push(prof_type); }
  if (status) { sql += ' AND status = ?'; args.push(status); }
  if (search) {
    sql += ' AND (name LIKE ? OR org_name LIKE ? OR bio LIKE ? OR city LIKE ?)';
    const q = `%${search}%`;
    args.push(q, q, q, q);
  }

  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  args.push(limit, (page - 1) * limit);

  try {
    const [results, countRow] = await Promise.all([
      query(sql, ...args),
      queryOne<{ count: number }>('SELECT COUNT(*) as count FROM professionals'),
    ]);
    return NextResponse.json({
      success: true,
      data: results,
      total: countRow?.count || 0,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;

    if (body.id) {
      // 更新
      await execute(
        `UPDATE professionals SET
         prof_type=?, name=?, org_name=?, phone=?, bio=?, license_no=?, qualification=?,
         province=?, city=?, district=?, service_areas=?, services=?,
         pricing_model=?, price_min=?, price_max=?, verified=?, status=?, updated_at=datetime('now')
         WHERE id=?`,
        body.prof_type, body.name, body.org_name || null, body.phone || null,
        body.bio || null, body.license_no || null, body.qualification || null,
        body.province || null, body.city || null, body.district || null,
        typeof body.service_areas === 'string' ? body.service_areas : JSON.stringify(body.service_areas || []),
        typeof body.services === 'string' ? body.services : JSON.stringify(body.services || []),
        body.pricing_model || 'negotiable', body.price_min || null, body.price_max || null,
        body.verified ? 1 : 0, body.status || 'active',
        body.id
      );
      return NextResponse.json({ success: true, id: body.id });
    } else {
      // 新增
      const result = await execute(
        `INSERT INTO professionals (prof_type, name, org_name, phone, bio, license_no, qualification,
         province, city, district, service_areas, services, pricing_model, price_min, price_max, verified, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        body.prof_type, body.name, body.org_name || null, body.phone || null,
        body.bio || null, body.license_no || null, body.qualification || null,
        body.province || null, body.city || null, body.district || null,
        typeof body.service_areas === 'string' ? body.service_areas : JSON.stringify(body.service_areas || []),
        typeof body.services === 'string' ? body.services : JSON.stringify(body.services || []),
        body.pricing_model || 'negotiable', body.price_min || null, body.price_max || null,
        body.verified ? 1 : 0, body.status || 'active'
      );
      return NextResponse.json({ success: true, id: result.meta?.last_row_id });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 });
    }
    await execute('DELETE FROM professionals WHERE id = ?', id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
