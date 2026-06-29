export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';
import { hashPassword, validatePassword, createSession, logLoginEvent } from '@/lib/auth';
import { checkAndEnforceRateLimit } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    await checkAndEnforceRateLimit('auth.register', request);

    const body = await request.json() as {
      phone: string;
      password: string;
      nickname: string;
      role_apply?: string;
      apply_reason?: string;
      broker_region?: string;
      broker_specialties?: string;
      broker_bio?: string;
      org_name?: string;
    };

    const { phone, password, nickname, role_apply, apply_reason, broker_region, broker_specialties, broker_bio, org_name } = body;
    const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '';
    const ua = request.headers.get('user-agent') || '';

    // 校验
    if (!phone || !password || !nickname) {
      return NextResponse.json({ success: false, error: '手机号、密码、昵称不能为空' }, { status: 400 });
    }

    if (!/^1[3-9]\d{9}$/.test(phone)) {
      return NextResponse.json({ success: false, error: '手机号格式不正确' }, { status: 400 });
    }

    const pwdCheck = validatePassword(password);
    if (!pwdCheck.valid) {
      return NextResponse.json({ success: false, error: pwdCheck.reason }, { status: 400 });
    }

    // 检查手机号是否已注册
    const existing = await queryOne<{ id: number }>('SELECT id FROM users WHERE phone = ?', phone);
    if (existing) {
      return NextResponse.json({ success: false, error: '该手机号已注册' }, { status: 409 });
    }

    // 确定角色和状态
    const validRoles = ['user', 'broker', 'village_org'];
    const applyRole = validRoles.includes(role_apply || '') ? role_apply : 'user';
    const needsReview = applyRole !== 'user'; // broker 和 village_org 需要审核
    const status = needsReview ? 'pending' : 'active';

    // 密码加密
    const passwordHash = await hashPassword(password);

    // 创建用户
    const result = await execute(
      `INSERT INTO users (phone, nickname, password_hash, role, status, role_apply, apply_reason, broker_region, broker_specialties, broker_bio, org_name, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      phone, nickname, passwordHash, applyRole, status,
      needsReview ? applyRole : null, apply_reason || null,
      broker_region || null, broker_specialties || null, broker_bio || null,
      org_name || null
    );

    const userId = result.meta.last_row_id;

    await logLoginEvent({ phone, userId, success: true, ip, ua, reason: '注册成功' });

    if (needsReview) {
      // 需要审核：返回提示，不自动登录
      return NextResponse.json({
        success: true,
        pending: true,
        message: `注册成功！您的${applyRole === 'broker' ? '合伙人' : '村集体'}账号正在审核中，审核通过后即可登录。`,
      });
    }

    // 普通用户：自动登录
    const sessionId = await createSession(userId);

    const res = NextResponse.json({
      success: true,
      user: { id: userId, nickname, role: applyRole },
    });
    res.cookies.set('user_session', sessionId, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 86400,
      path: '/',
    });
    return res;
  } catch (error: any) {
    if (error.message?.includes('Rate limit')) {
      return NextResponse.json({ success: false, error: '操作过于频繁，请稍后再试' }, { status: 429 });
    }
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
