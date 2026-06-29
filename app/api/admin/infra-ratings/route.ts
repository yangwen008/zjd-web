export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const province = searchParams.get('province');
  const search = searchParams.get('search');

  let sql = 'SELECT * FROM infrastructure_ratings';
  const args: unknown[] = [];
  const conditions: string[] = [];

  if (province) { conditions.push('province = ?'); args.push(province); }
  if (search) { conditions.push('(region LIKE ? OR province LIKE ? OR city LIKE ?)'); args.push(`%${search}%`, `%${search}%`, `%${search}%`); }
  if (conditions.length > 0) sql += ' WHERE ' + conditions.join(' AND ');
  sql += ' ORDER BY signal_5g_ms ASC';

  try {
    const results = await query(sql, ...args);
    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body as { action: string };

    if (action === 'add') {
      const { region, province, city, signal_5g_ms, hospital_min, grid_redundancy, overall_grade } = body as Record<string, unknown>;
      const result = await execute(
        `INSERT INTO infrastructure_ratings (region, province, city, signal_5g_ms, hospital_min, grid_redundancy, overall_grade, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        region, province || null, city || null, signal_5g_ms || 0, hospital_min || 0, grid_redundancy || 0, overall_grade || 'B'
      );
      return NextResponse.json({ success: true, id: result.meta.last_row_id });
    }

    if (action === 'update') {
      const { id, region, province, city, signal_5g_ms, hospital_min, grid_redundancy, overall_grade } = body as Record<string, unknown>;
      await execute(
        `UPDATE infrastructure_ratings SET region=?, province=?, city=?, signal_5g_ms=?, hospital_min=?, grid_redundancy=?, overall_grade=?, updated_at=datetime('now') WHERE id=?`,
        region, province, city, signal_5g_ms, hospital_min, grid_redundancy, overall_grade, id
      );
      return NextResponse.json({ success: true });
    }

    if (action === 'delete') {
      await execute('DELETE FROM infrastructure_ratings WHERE id = ?', body.id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
