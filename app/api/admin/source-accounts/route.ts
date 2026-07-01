export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { query, execute, queryOne } from '@/lib/db';
import { getAllSourceAccounts } from '@/lib/source-account';

// GET /api/admin/source-accounts - 获取所有来源账号
export async function GET() {
  try {
    const accounts = await getAllSourceAccounts();
    return NextResponse.json({ success: true, data: accounts });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

// POST /api/admin/source-accounts - 新增/更新来源映射
export async function POST(request: Request) {
  try {
    const body = await request.json() as any;
    const { action } = body;

    if (action === 'create') {
      const { name, province, city, district, user_id } = body;
      if (!name || !province) {
        return NextResponse.json({ success: false, error: '名称和省份必填' }, { status: 400 });
      }
      await execute(
        'INSERT INTO source_accounts (name, province, city, district, user_id, auto_approve) VALUES (?, ?, ?, ?, ?, ?)',
        name, province, city || null, district || null, user_id || null, body.auto_approve ? 1 : 0
      );
      return NextResponse.json({ success: true });
    }

    if (action === 'update') {
      const { id, name, province, city, district, user_id, auto_approve, enabled } = body;
      await execute(
        `UPDATE source_accounts SET name=?, province=?, city=?, district=?, user_id=?, auto_approve=?, enabled=? WHERE id=?`,
        name, province, city || null, district || null, user_id || null, auto_approve ? 1 : 0, enabled ? 1 : 0, id
      );
      return NextResponse.json({ success: true });
    }

    if (action === 'delete') {
      await execute('DELETE FROM source_accounts WHERE id = ?', body.id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
