export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// GET /api/dashboard/favorites — 获取我的收藏列表
export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });

    const results = await query(
      `SELECT f.id, f.asset_id, f.created_at, a.title as asset_title, a.province as asset_province,
              a.price_year, a.area_mu, a.images
       FROM user_favorites f
       LEFT JOIN assets a ON f.asset_id = a.id
       WHERE f.user_id = ?
       ORDER BY f.created_at DESC LIMIT 50`,
      user.id
    );
    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

// POST /api/dashboard/favorites — 添加/取消收藏（toggle）
export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });

    const { assetId } = await request.json() as { assetId: number };
    if (!assetId) return NextResponse.json({ success: false, error: '缺少 assetId' }, { status: 400 });

    // 检查资产是否存在
    const asset = await query<{ id: number }>('SELECT id FROM assets WHERE id = ? AND status = ?', assetId, 'approved');
    if (!asset.length) return NextResponse.json({ success: false, error: '资产不存在' }, { status: 404 });

    // Toggle：已收藏则取消，未收藏则添加
    const existing = await query<{ id: number }>(
      'SELECT id FROM user_favorites WHERE user_id = ? AND asset_id = ?',
      user.id, assetId
    );

    if (existing.length > 0) {
      await execute('DELETE FROM user_favorites WHERE user_id = ? AND asset_id = ?', user.id, assetId);
      return NextResponse.json({ success: true, favorited: false });
    } else {
      await execute('INSERT INTO user_favorites (user_id, asset_id) VALUES (?, ?)', user.id, assetId);
      return NextResponse.json({ success: true, favorited: true });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
