export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });

    // 合伙人/村委看别人对自己的线索，普通用户看自己产生的线索
    const isProvider = ['broker', 'village_org', 'admin', 'superadmin'].includes(user.role);
    const whereClause = isProvider ? 'l.broker_id = ?' : 'l.user_id = ?';

    const results = await query(
      `SELECT l.id, l.unlock_type, l.created_at, a.title as asset_title, u.nickname as user_nickname
       FROM leads l
       LEFT JOIN assets a ON l.asset_id = a.id
       LEFT JOIN users u ON l.user_id = u.id
       WHERE ${whereClause} ORDER BY l.created_at DESC LIMIT 50`,
      user.id
    );
    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}