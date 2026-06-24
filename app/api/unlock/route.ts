import { NextResponse } from 'next/server';
import { execute, queryOne } from '@/lib/db';

// POST /api/unlock - 创建解锁任务
export async function POST(request: Request) {
  try {
    const { assetId, wechatOpenid }: any = await request.json();

    const result = await execute(
      'INSERT INTO unlock_tasks (asset_id, wechat_openid, status) VALUES (?, ?, ?)',
      assetId, wechatOpenid, 'pending'
    );

    const taskId = result.meta?.last_row_id;

    // 异步处理 (实际部署中使用 Cloudflare Queue)
    await execute(
      'UPDATE unlock_tasks SET status = ?, completed_at = datetime("now") WHERE id = ?',
      'done', taskId
    );

    return NextResponse.json({ success: true, taskId });
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
