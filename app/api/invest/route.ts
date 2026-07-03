export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { checkAndEnforceRateLimit } from '@/lib/rate-limit';

// POST /api/invest — 提交认购意向
export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: '请先登录' }, { status: 401 });
    }

    await checkAndEnforceRateLimit('api.general', request);

    const { assetId, assetType, shares, notes, contactName, contactPhone } = await request.json() as {
      assetId: number;
      assetType: 'asset' | 'bulk_project';
      shares: number;
      notes?: string;
      contactName?: string;
      contactPhone?: string;
    };

    if (!assetId || !assetType || !shares || shares < 1) {
      return NextResponse.json({ success: false, error: '参数不完整' }, { status: 400 });
    }

    // 查询资产的参投配置
    const table = assetType === 'bulk_project' ? 'bulk_projects' : 'assets';
    const asset = await queryOne<{
      id: number; invest_enabled: number; invest_total_shares: number;
      invest_share_price: number; invest_min_shares: number; invest_sold_shares: number;
      title: string;
    }>(
      `SELECT id, title, invest_enabled, invest_total_shares, invest_share_price, invest_min_shares, invest_sold_shares FROM ${table} WHERE id = ? AND status = 'approved'`,
      assetId
    );

    if (!asset) {
      return NextResponse.json({ success: false, error: '资产不存在或未上架' }, { status: 404 });
    }

    if (!asset.invest_enabled) {
      return NextResponse.json({ success: false, error: '该资产未开放参投' }, { status: 400 });
    }

    if (shares < (asset.invest_min_shares || 1)) {
      return NextResponse.json({ success: false, error: `最低起投 ${asset.invest_min_shares || 1} 份` }, { status: 400 });
    }

    // 检查是否已认购
    const existing = await queryOne<{ id: number; shares: number; status: string }>(
      'SELECT id, shares, status FROM investments WHERE asset_id = ? AND asset_type = ? AND user_id = ? AND status != ?',
      assetId, assetType, user.id, 'withdrawn'
    );

    if (existing) {
      return NextResponse.json({ success: false, error: '您已提交过认购意向，请勿重复提交' }, { status: 400 });
    }

    // 防超额：乐观锁 — 原子更新，仅当剩余份数足够时才成功
    const remaining = asset.invest_total_shares - asset.invest_sold_shares;
    if (shares > remaining) {
      return NextResponse.json({ success: false, error: `仅剩 ${remaining} 份可认购` }, { status: 400 });
    }

    const amount = shares * (asset.invest_share_price || 0);

    // 原子更新已认购份数（乐观锁）
    const updateResult = await execute(
      `UPDATE ${table} SET invest_sold_shares = invest_sold_shares + ? WHERE id = ? AND invest_sold_shares + ? <= invest_total_shares`,
      shares, assetId, shares
    );

    if (!updateResult.meta?.changes || updateResult.meta.changes === 0) {
      return NextResponse.json({ success: false, error: '认购份数不足，请重新选择' }, { status: 400 });
    }

    // 写入认购记录
    await execute(
      `INSERT INTO investments (asset_id, asset_type, user_id, shares, amount, notes, contact_name, contact_phone, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'), datetime('now'))`,
      assetId, assetType, user.id, shares, amount, notes || null, contactName || null, contactPhone || null
    );

    // 创建线索记录（让发布者知道谁感兴趣）
    await execute(
      'INSERT INTO leads (asset_id, user_id, unlock_type, status, notes, created_at) VALUES (?, ?, ?, ?, ?, datetime(\'now\'))',
      assetId, user.id, 'invest', 'new',
      `认购${shares}份，金额${amount}万${notes ? '，备注：' + notes : ''}`
    );

    return NextResponse.json({
      success: true,
      message: '认购意向已提交，发布者将尽快联系您',
      data: { shares, amount, remaining: remaining - shares },
    });
  } catch (error: any) {
    if (error.message?.includes('Rate limit')) {
      return NextResponse.json({ success: false, error: '操作过于频繁，请稍后再试' }, { status: 429 });
    }
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

// GET /api/invest — 查询我的认购记录
export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: '请先登录' }, { status: 401 });
    }

    const results = await query<{
      id: number; asset_id: number; asset_type: string; shares: number;
      amount: number; status: string; notes: string; created_at: string;
      asset_title: string; asset_images: string;
    }>(
      `SELECT i.*, 
        CASE i.asset_type 
          WHEN 'bulk_project' THEN (SELECT title FROM bulk_projects WHERE id = i.asset_id)
          ELSE (SELECT title FROM assets WHERE id = i.asset_id)
        END as asset_title,
        CASE i.asset_type
          WHEN 'bulk_project' THEN (SELECT images FROM bulk_projects WHERE id = i.asset_id)
          ELSE (SELECT images FROM assets WHERE id = i.asset_id)
        END as asset_images
       FROM investments i WHERE i.user_id = ? ORDER BY i.created_at DESC`,
      user.id
    );

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
