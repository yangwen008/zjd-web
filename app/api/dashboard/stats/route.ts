export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
    }

    // 并行执行多个统计查询
    const [assetStats, leadStats, favStats, bulkStats, infraStats] = await Promise.all([
      // 1. 资产统计
      queryOne<{ total: number; approved: number; pending: number; views: number }>(
        `SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
          COALESCE(SUM(views), 0) as views
        FROM assets WHERE user_id = ?`,
        user.id
      ),
      // 2. 线索统计（作为 broker 收到的线索）
      queryOne<{ total: number }>(
        `SELECT COUNT(*) as total FROM leads WHERE broker_id = ?`,
        user.id
      ),
      // 3. 收藏统计
      queryOne<{ total: number }>(
        `SELECT COUNT(*) as total FROM user_favorites WHERE user_id = ?`,
        user.id
      ).catch(() => ({ total: 0 })),
      // 4. 大宗项目统计
      queryOne<{ total: number }>(
        `SELECT COUNT(*) as total FROM bulk_projects WHERE user_id = ?`,
        user.id
      ),
      // 5. 基建数据统计
      queryOne<{ total: number }>(
        `SELECT COUNT(*) as total FROM infrastructure_ratings`
      ),
    ]);

    // 组装前端期望的数据结构
    const stats = {
      totalAssets: assetStats?.total || 0,
      approvedAssets: assetStats?.approved || 0,
      pendingAssets: assetStats?.pending || 0,
      totalViews: assetStats?.views || 0,
      totalLeads: leadStats?.total || 0,
      totalFavorites: favStats?.total || 0,
      totalBulk: bulkStats?.total || 0,
      totalInfra: infraStats?.total || 0,
    };

    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
