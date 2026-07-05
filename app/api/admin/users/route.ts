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

    if (action === 'update-profile') {
      const { id, nickname, phone, real_name, org_name, bio, broker_region, broker_specialties, broker_bio, daily_quota } = body as Record<string, any>;
      if (!id) return NextResponse.json({ success: false, error: '缺少用户ID' }, { status: 400 });

      const fields: string[] = [];
      const args: unknown[] = [];

      if (nickname !== undefined) { fields.push('nickname = ?'); args.push(nickname); }
      if (phone !== undefined) { fields.push('phone = ?'); args.push(phone || null); }
      if (real_name !== undefined) { fields.push('real_name = ?'); args.push(real_name || null); }
      if (org_name !== undefined) { fields.push('org_name = ?'); args.push(org_name || null); }
      if (bio !== undefined) { fields.push('bio = ?'); args.push(bio || null); }
      if (broker_region !== undefined) { fields.push('broker_region = ?'); args.push(broker_region || null); }
      if (broker_specialties !== undefined) { fields.push('broker_specialties = ?'); args.push(broker_specialties || null); }
      if (broker_bio !== undefined) { fields.push('broker_bio = ?'); args.push(broker_bio || null); }
      if (daily_quota !== undefined) { fields.push('daily_quota = ?'); args.push(parseInt(daily_quota) || 3); }

      if (fields.length === 0) return NextResponse.json({ success: false, error: '没有要修改的字段' }, { status: 400 });

      fields.push("updated_at = datetime('now')");
      args.push(id);
      await execute(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, ...args);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
