export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const scope = searchParams.get('scope');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    let sql = `SELECT * FROM assets`;
    const args: unknown[] = [];

    // 权限控制：只有 admin/superadmin 可以查看所有资产
    if (scope === 'all' && ['admin', 'superadmin'].includes(user.role)) {
      sql += ` ORDER BY created_at DESC LIMIT ?`;
      args.push(limit);
    } else {
      // 普通用户/合伙人/村委只能看自己的
      sql += ` WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`;
      args.push(user.id, limit);
    }

    const results = await query(sql, ...args);
    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
