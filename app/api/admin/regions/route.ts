export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const level = searchParams.get('level');
  const province = searchParams.get('province');
  const search = searchParams.get('search');

  let sql = 'SELECT * FROM regions';
  const args: unknown[] = [];
  const conditions: string[] = [];

  if (level && level !== 'all') { conditions.push('level = ?'); args.push(level); }
  if (province) { conditions.push('province = ?'); args.push(province); }
  if (search) { conditions.push('(name LIKE ? OR code LIKE ?)'); args.push(`%${search}%`, `%${search}%`); }
  if (conditions.length > 0) sql += ' WHERE ' + conditions.join(' AND ');
  sql += ' ORDER BY level, sort_order, name';

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
      const { code, name, level, parent_code, province, city, emoji, lat, lng, sort_order, active } = body as Record<string, unknown>;
      const result = await execute(
        `INSERT INTO regions (code, name, level, parent_code, province, city, emoji, lat, lng, sort_order, active, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        code, name, level, parent_code || null, province || null, city || null,
        emoji || null, lat || null, lng || null, sort_order || 0, active ?? 1
      );
      return NextResponse.json({ success: true, id: result.meta.last_row_id });
    }

    if (action === 'update') {
      const { id, code, name, level, parent_code, province, city, emoji, lat, lng, sort_order, active } = body as Record<string, unknown>;
      await execute(
        `UPDATE regions SET code=?, name=?, level=?, parent_code=?, province=?, city=?, emoji=?, lat=?, lng=?, sort_order=?, active=? WHERE id=?`,
        code, name, level, parent_code, province, city, emoji, lat, lng, sort_order, active, id
      );
      return NextResponse.json({ success: true });
    }

    if (action === 'delete') {
      // Check for children
      const children = await queryOne<{ c: number }>('SELECT COUNT(*) as c FROM regions WHERE parent_code = (SELECT code FROM regions WHERE id = ?)', body.id);
      if (children && children.c > 0) {
        return NextResponse.json({ success: false, error: `该区域下有 ${children.c} 个子区域，请先删除子区域` }, { status: 400 });
      }
      await execute('DELETE FROM regions WHERE id = ?', body.id);
      return NextResponse.json({ success: true });
    }

    if (action === 'toggle-active') {
      const { id, active } = body as { id: number; active: number };
      await execute('UPDATE regions SET active = ? WHERE id = ?', active ? 1 : 0, id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
