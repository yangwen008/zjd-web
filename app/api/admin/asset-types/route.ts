export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/lib/db';

export async function GET() {
  try {
    const results = await query(
      `SELECT at.*, (SELECT COUNT(*) FROM assets WHERE asset_type = at.name) as asset_count
       FROM asset_types at ORDER BY at.sort_order, at.name`
    );
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
      const { name, icon, description, sort_order, active } = body as Record<string, unknown>;
      const result = await execute(
        'INSERT INTO asset_types (name, icon, description, sort_order, active) VALUES (?, ?, ?, ?, ?)',
        name, icon || null, description || null, sort_order || 0, active ?? 1
      );
      return NextResponse.json({ success: true, id: result.meta.last_row_id });
    }

    if (action === 'update') {
      const { id, name, icon, description, sort_order, active } = body as Record<string, unknown>;
      await execute(
        'UPDATE asset_types SET name=?, icon=?, description=?, sort_order=?, active=? WHERE id=?',
        name, icon, description, sort_order, active, id
      );
      return NextResponse.json({ success: true });
    }

    if (action === 'delete') {
      const { id: deleteId } = body as { id: number };
      const count = await queryOne<{ c: number }>('SELECT COUNT(*) as c FROM assets WHERE asset_type = (SELECT name FROM asset_types WHERE id = ?)', deleteId);
      if (count && count.c > 0) {
        return NextResponse.json({ success: false, error: `该类型下有 ${count.c} 宗资产，无法删除` }, { status: 400 });
      }
      await execute('DELETE FROM asset_types WHERE id = ?', deleteId);
      return NextResponse.json({ success: true });
    }

    if (action === 'toggle-active') {
      const { id, active } = body as { id: number; active: number };
      await execute('UPDATE asset_types SET active = ? WHERE id = ?', active ? 1 : 0, id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
