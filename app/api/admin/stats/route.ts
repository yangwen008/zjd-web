export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';

export async function GET() {
  try {
    const [assetsRow, pendingAssets, pendingBulk, pendingUsers, totalUsers] = await Promise.all([
      queryOne<{ total: number; today_new: number }>(
        `SELECT 
           COUNT(*) as total,
           SUM(CASE WHEN date(created_at) = date('now') THEN 1 ELSE 0 END) as today_new
         FROM assets`
      ),
      queryOne<{ cnt: number }>(
        "SELECT COUNT(*) as cnt FROM assets WHERE status = 'pending'"
      ),
      queryOne<{ cnt: number }>(
        "SELECT COUNT(*) as cnt FROM bulk_projects WHERE status = 'pending'"
      ),
      queryOne<{ cnt: number }>(
        "SELECT COUNT(*) as cnt FROM users WHERE status = 'pending'"
      ),
      queryOne<{ cnt: number }>(
        "SELECT COUNT(*) as cnt FROM users WHERE status = 'active'"
      ),
    ]);

    const pa = pendingAssets?.cnt || 0;
    const pb = pendingBulk?.cnt || 0;
    const pu = pendingUsers?.cnt || 0;

    return NextResponse.json({
      success: true,
      data: {
        total: assetsRow?.total || 0,
        todayNew: assetsRow?.today_new || 0,
        pending: pa + pb + pu,
        pendingAssets: pa,
        pendingBulk: pb,
        pendingUsers: pu,
        totalUsers: totalUsers?.cnt || 0,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
