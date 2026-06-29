export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth'; // 使用项目统一的鉴权

export async function GET(request: Request) {
  try {
    // 1. 鉴权：获取当前登录用户
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
    }

    // 2. 资产统计 (聚合查询，而不是查列表)
    const assetStats = await queryOne<{
      totalAssets: number;
      approvedAssets: number;
      pendingAssets: number;
      totalViews: number;
    }>(
      `SELECT 
        COUNT(*) as totalAssets,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approvedAssets,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pendingAssets,
        COALESCE(SUM(views), 0) as totalViews
      FROM assets WHERE user_id = ?`,
      user.id
    );

    // 3. 线索统计 (合伙人/村委作为 broker 收到的线索)
    const leadStats = await queryOne<{ totalLeads: number }>(
      `SELECT COUNT(*) as totalLeads FROM leads WHERE broker_id = ?`,
      user.id
    );

    // 4. 收藏/感兴趣统计 (用户主动解锁的线索)
    const favStats = await queryOne<{ totalFavorites: number }>(
      `SELECT COUNT(*) as totalFavorites FROM leads WHERE user_id = ?`,
      user.id
    );

    // 5. 大宗项目统计
    const bulkStats = await queryOne<{ totalBulk: number }>(
      `SELECT COUNT(*) as totalBulk FROM bulk_projects WHERE user_id = ?`,
      user.id
    );

    // 6. 基建数据统计
    const infraStats = await queryOne<{ totalInfra: number }>(
      `SELECT COUNT(*) as totalInfra FROM infrastructure_ratings`
    );

    // 7. 组装前端期望的统计对象
    const stats = {
      totalAssets: assetStats?.totalAssets || 0,
      approvedAssets: assetStats?.approvedAssets || 0,
      pendingAssets: assetStats?.pendingAssets || 0,
      totalViews: assetStats?.totalViews || 0,
      totalLeads: leadStats?.totalLeads || 0,
      totalFavorites: favStats?.totalFavorites || 0,
      totalBulk: bulkStats?.totalBulk || 0,
      totalInfra: infraStats?.totalInfra || 0,
    };

    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
