export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { queryOne, execute, query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

/**
 * POST /api/appointments
 * 创建预约带看
 */
export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: '请先登录' }, { status: 401 });
    }

    const body = await request.json() as {
      assetId: number;
      contactName: string;
      contactPhone: string;
      notes?: string;
    };

    const { assetId, contactName, contactPhone, notes } = body;

    if (!assetId || !contactName || !contactPhone) {
      return NextResponse.json({ success: false, error: '资产ID、姓名、电话为必填' }, { status: 400 });
    }

    if (!/^1[3-9]\d{9}$/.test(contactPhone)) {
      return NextResponse.json({ success: false, error: '手机号格式不正确' }, { status: 400 });
    }

    // 检查资产是否存在
    const asset = await queryOne<{ id: number; user_id: number; title: string }>(
      'SELECT id, user_id, title FROM assets WHERE id = ? AND status = ?',
      assetId, 'approved'
    );
    if (!asset) {
      return NextResponse.json({ success: false, error: '资产不存在或未上架' }, { status: 404 });
    }

    // 不能预约自己的资产
    if (asset.user_id === user.id) {
      return NextResponse.json({ success: false, error: '不能预约自己发布的资产' }, { status: 400 });
    }

    // 检查是否已预约
    const existing = await queryOne<{ id: number }>(
      'SELECT id FROM appointments WHERE asset_id = ? AND user_id = ?',
      assetId, user.id
    );
    if (existing) {
      return NextResponse.json({ success: false, error: '您已预约过该资产' }, { status: 409 });
    }

    // 1. 创建预约记录
    const result = await execute(
      `INSERT INTO appointments (asset_id, user_id, contact_name, contact_phone, notes, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'pending', datetime('now'), datetime('now'))`,
      assetId, user.id, contactName, contactPhone, notes || null
    );

    // 2. 同时写入线索表（让资产所有者在"我的线索"里看到）
    await execute(
      `INSERT INTO leads (asset_id, user_id, unlock_type, status, notes, created_at)
       VALUES (?, ?, 'appointment', 'new', ?, datetime('now'))`,
      assetId, user.id,
      JSON.stringify({ contact_name: contactName, contact_phone: contactPhone, notes })
    );

    // 3. 尝试推送模板消息给资产所有者（如果有的话）
    try {
      const owner = await queryOne<{ wx_openid: string }>(
        'SELECT wx_openid FROM users WHERE id = ? AND wx_openid IS NOT NULL',
        asset.user_id
      );
      if (owner?.wx_openid) {
        const { notifyAppointment } = await import('@/lib/wechat');
        const templateId = (process.env as Record<string, string>).WX_TEMPLATE_APPOINTMENT || '';
        const siteUrl = (process.env as Record<string, string>).SITE_URL || 'https://www.zjd.cn';
        if (templateId) {
          await notifyAppointment(owner.wx_openid, asset.title, contactName, contactPhone, assetId, siteUrl, templateId);
        }
      }
    } catch (e) {
      // 模板消息发送失败不影响预约
      console.warn('Appointment notification failed:', e);
    }

    return NextResponse.json({
      success: true,
      data: { id: result.meta?.last_row_id, status: 'pending' },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

/**
 * GET /api/appointments?assetId=123
 * 查询当前用户是否已预约某资产
 */
export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const assetId = searchParams.get('assetId');

    if (!assetId) {
      return NextResponse.json({ success: false, error: 'assetId required' }, { status: 400 });
    }

    const appointment = await queryOne<{ id: number; status: string; created_at: string }>(
      'SELECT id, status, created_at FROM appointments WHERE asset_id = ? AND user_id = ?',
      parseInt(assetId), user.id
    );

    return NextResponse.json({
      success: true,
      data: appointment || null,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
