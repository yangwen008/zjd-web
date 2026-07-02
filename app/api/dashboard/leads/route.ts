export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });

    // 合伙人/村委看「谁解锁了我发布的资产」，普通用户看「我解锁了哪些资产」
    const isProvider = ['broker', 'village_org', 'project_publisher', 'admin', 'superadmin'].includes(user.role);

    let results;
    if (isProvider) {
      results = await query(
        `SELECT l.id, l.asset_id, l.unlock_type, l.notes, l.created_at,
                a.title as asset_title,
                u.nickname as user_nickname
         FROM leads l
         LEFT JOIN assets a ON l.asset_id = a.id
         LEFT JOIN users u ON l.user_id = u.id
         WHERE a.user_id = ?
         ORDER BY l.created_at DESC LIMIT 50`,
        user.id
      );
    } else {
      results = await query(
        `SELECT l.id, l.asset_id, l.unlock_type, l.notes, l.created_at,
                a.title as asset_title,
                u.nickname as user_nickname
         FROM leads l
         LEFT JOIN assets a ON l.asset_id = a.id
         LEFT JOIN users u ON l.user_id = u.id
         WHERE l.user_id = ?
         ORDER BY l.created_at DESC LIMIT 50`,
        user.id
      );
    }
    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
