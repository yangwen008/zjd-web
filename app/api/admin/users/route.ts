export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const role = searchParams.get('role');
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

  let sql = 'SELECT * FROM users';
  const args: unknown[] = [];
  const conditions: string[] = [];

  if (status && status !== 'all') { conditions.push('status = ?'); args.push(status); }
  if (role) { conditions.push('role = ?'); args.push(role); }
  if (conditions.length > 0) sql += ' WHERE ' + conditions.join(' AND ');
  sql += ' ORDER BY created_at DESC LIMIT ?';
  args.push(limit);

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

    if (action === 'approve') {
      const { id } = body as { id: number };
      const user = await queryOne<{ role_apply: string }>('SELECT role_apply FROM users WHERE id = ?', id);
      if (!user) return NextResponse.json({ success: false, error: '用户不存在' }, { status: 404 });

      // 将申请角色设为正式角色，状态改为激活
      await execute(
        'UPDATE users SET role = ?, status = ?, role_apply = NULL, role_approved_at = datetime("now"), updated_at = datetime("now") WHERE id = ?',
        user.role_apply || 'user', 'active', id
      );
      return NextResponse.json({ success: true });
    }

    if (action === 'reject') {
      const { id, reason } = body as { id: number; reason: string };
      await execute(
        'UPDATE users SET status = ?, apply_reason = ?, updated_at = datetime("now") WHERE id = ?',
        'banned', reason || '审核未通过', id
      );
      return NextResponse.json({ success: true });
    }

    if (action === 'ban') {
      const { id } = body as { id: number };
      await execute('UPDATE users SET status = ?, updated_at = datetime("now") WHERE id = ?', 'banned', id);
      return NextResponse.json({ success: true });
    }

    if (action === 'unban') {
      const { id } = body as { id: number };
      await execute('UPDATE users SET status = ?, updated_at = datetime("now") WHERE id = ?', 'active', id);
      return NextResponse.json({ success: true });
    }

    if (action === 'update-role') {
      const { id, role } = body as { id: number; role: string };
      await execute('UPDATE users SET role = ?, updated_at = datetime("now") WHERE id = ?', role, id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
