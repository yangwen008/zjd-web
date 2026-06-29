export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });

    // 收藏本质上是用户主动产生的 leads 记录
    const results = await query(
      `SELECT l.id, l.asset_id, l.created_at, a.title as asset_title, a.province as asset_province
       FROM leads l LEFT JOIN assets a ON l.asset_id = a.id
       WHERE l.user_id = ? ORDER BY l.created_at DESC LIMIT 50`,
      user.id
    );
    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}