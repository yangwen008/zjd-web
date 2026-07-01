export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { execute, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// POST /api/unlock - 解锁资产联系方式
export async function POST(request: Request) {
  try {
    const { assetId } = await request.json() as { assetId: number };

    if (!assetId) {
      return NextResponse.json({ success: false, error: 'assetId required' }, { status: 400 });
    }

    // 校验用户登录
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: '请先登录' }, { status: 401 });
    }

    // 查询资产
    const asset = await queryOne<{ id: number; contact_phone: string | null; contact_name: string | null; title: string }>(
      'SELECT id, contact_phone, contact_name, title FROM assets WHERE id = ? AND status = ?',
      assetId, 'approved'
    );
    if (!asset) {
      return NextResponse.json({ success: false, error: '资产不存在或未上架' }, { status: 404 });
    }

    // 检查是否已解锁（防重复）
    const existing = await queryOne<{ id: number; result_data: string }>(
      'SELECT id, result_data FROM unlock_tasks WHERE asset_id = ? AND user_id = ? AND status = ?',
      assetId, user.id, 'done'
    );
    if (existing) {
      return NextResponse.json({
        success: true,
        taskId: existing.id,
        data: existing.result_data ? JSON.parse(existing.result_data) : null,
        alreadyUnlocked: true,
      });
    }

    // 创建解锁任务
    const result = await execute(
      'INSERT INTO unlock_tasks (asset_id, user_id, status, created_at) VALUES (?, ?, ?, datetime("now"))',
      assetId, user.id, 'pending'
    );
    const taskId = result.meta?.last_row_id;

    // 写入解锁结果（联系方式）
    const resultData = JSON.stringify({
      contact_name: asset.contact_name || '未提供',
      contact_phone: asset.contact_phone || '未提供',
      asset_title: asset.title,
      unlocked_at: new Date().toISOString(),
    });

    await execute(
      'UPDATE unlock_tasks SET status = ?, result_data = ?, completed_at = datetime("now") WHERE id = ?',
      'done', resultData, taskId
    );

    // 创建线索记录（让资产发布者知道谁感兴趣）
    await execute(
      'INSERT INTO leads (asset_id, user_id, unlock_type, status, created_at) VALUES (?, ?, ?, ?, datetime("now"))',
      assetId, user.id, 'phone', 'new'
    );

    return NextResponse.json({
      success: true,
      taskId,
      data: { contact_name: asset.contact_name, contact_phone: asset.contact_phone },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

// GET /api/unlock/status - 查询解锁状态
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const taskId = searchParams.get('taskId');

  if (!taskId) {
    return NextResponse.json({ success: false, error: 'taskId required' }, { status: 400 });
  }

  try {
    const task = await queryOne<{ status: string; result_data: string }>(
      'SELECT status, result_data FROM unlock_tasks WHERE id = ?',
      taskId
    );

    if (!task) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      status: task.status,
      data: task.status === 'done' ? JSON.parse(task.result_data || '{}') : null,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
