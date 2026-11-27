export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { execute, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { encryptPhone, decryptPhone } from '@/lib/phone-crypto';

interface UnlockBody {
  assetId: number;
  assetType?: 'asset' | 'bulk_project';
}

interface ContactRow {
  id: number;
  contact_phone: string | null;
  contact_name: string | null;
  title: string;
}

// POST /api/unlock - 解锁资产/大宗项目联系方式（需登录）
// 完整电话仅通过本接口输出：公开页面/API 只出脱敏号（见 lib/phone-crypto.ts）
export async function POST(request: Request) {
  try {
    const { assetId, assetType = 'asset' } = await request.json() as UnlockBody;

    if (!assetId) {
      return NextResponse.json({ success: false, error: 'assetId required' }, { status: 400 });
    }

    // 校验用户登录
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: '请先登录' }, { status: 401 });
    }

    // 大宗项目：返回联系方式即可。
    // 不写 unlock_tasks/leads（两表 asset_id 外键指向 assets 表，大宗不入线索跟踪）
    if (assetType === 'bulk_project') {
      const project = await queryOne<ContactRow>(
        'SELECT id, contact_phone, contact_name, title FROM bulk_projects WHERE id = ? AND status = ?',
        assetId, 'approved'
      );
      if (!project) {
        return NextResponse.json({ success: false, error: '项目不存在或未上架' }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        data: {
          contact_name: project.contact_name || '未提供',
          contact_phone: (await decryptPhone(project.contact_phone)) || '未提供',
          asset_title: project.title,
        },
      });
    }

    // 查询资产
    const asset = await queryOne<ContactRow>(
      'SELECT id, contact_phone, contact_name, title FROM assets WHERE id = ? AND status = ?',
      assetId, 'approved'
    );
    if (!asset) {
      return NextResponse.json({ success: false, error: '资产不存在或未上架' }, { status: 404 });
    }

    // 检查是否已解锁（防重复，且避免重复生成线索）
    const existing = await queryOne<{ id: number; result_data: string }>(
      'SELECT id, result_data FROM unlock_tasks WHERE asset_id = ? AND user_id = ? AND status = ?',
      assetId, user.id, 'done'
    );
    if (existing) {
      let data: { contact_name?: string; contact_phone?: string; asset_title?: string } | null = null;
      if (existing.result_data) {
        data = JSON.parse(existing.result_data);
        // result_data 中电话为密文存储，输出前解密
        if (data && data.contact_phone) {
          data.contact_phone = (await decryptPhone(data.contact_phone)) || '未提供';
        }
      }
      return NextResponse.json({
        success: true,
        taskId: existing.id,
        data,
        alreadyUnlocked: true,
      });
    }

    // 创建解锁任务
    const result = await execute(
      'INSERT INTO unlock_tasks (asset_id, user_id, status, created_at) VALUES (?, ?, ?, datetime("now"))',
      assetId, user.id, 'pending'
    );
    const taskId = result.meta?.last_row_id;

    const plainPhone = await decryptPhone(asset.contact_phone);

    // 写入解锁结果（电话密文落库，防 DB 泄露）
    const resultData = JSON.stringify({
      contact_name: asset.contact_name || '未提供',
      contact_phone: await encryptPhone(plainPhone),
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
      data: { contact_name: asset.contact_name, contact_phone: plainPhone || '未提供' },
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

    let data: Record<string, unknown> | null = null;
    if (task.status === 'done' && task.result_data) {
      data = JSON.parse(task.result_data);
      if (data && data.contact_phone) {
        data.contact_phone = (await decryptPhone(data.contact_phone as string)) || '未提供';
      }
    }

    return NextResponse.json({
      success: true,
      status: task.status,
      data,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
