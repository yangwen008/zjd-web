export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const userId = user.id;

    const [assets, views, leads, favorites, bulk, infra] = await Promise.all([
      queryOne<{ total: number; approved: number; pending: number }>(
        `SELECT COUNT(*) as total,
         SUM(CASE WHEN status='approved' THEN 1 ELSE 0 END) as approved,
         SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) as pending
         FROM assets WHERE user_id = ?`, userId
      ),
      queryOne<{ total: number }>(
        'SELECT COALESCE(SUM(views), 0) as total FROM assets WHERE user_id = ?', userId
      ),
      queryOne<{ total: number }>(
        `SELECT COUNT(*) as total FROM leads l
         JOIN assets a ON l.asset_id = a.id
         WHERE a.user_id = ?`, userId
      ),
      queryOne<{ total: number }>(
        'SELECT COUNT(*) as total FROM user_favorites WHERE user_id = ?', userId
      ).catch(() => ({ total: 0 })),
      queryOne<{ total: number }>(
        'SELECT COUNT(*) as total FROM bulk_projects WHERE user_id = ?', userId
      ),
      queryOne<{ total: number }>(
        'SELECT COUNT(*) as total FROM infrastructure_ratings WHERE province IN (SELECT broker_region FROM users WHERE id = ?)', userId
      ).catch(() => ({ total: 0 })),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalAssets: assets?.total || 0,
        approvedAssets: assets?.approved || 0,
        pendingAssets: assets?.pending || 0,
        totalViews: views?.total || 0,
        totalLeads: leads?.total || 0,
        totalFavorites: favorites?.total || 0,
        totalBulk: bulk?.total || 0,
        totalInfra: infra?.total || 0,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
