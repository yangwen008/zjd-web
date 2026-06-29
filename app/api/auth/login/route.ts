export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';
import { hashPassword, verifyPassword, createSession, checkLoginAttempts, recordLoginAttempt, logLoginEvent, validatePassword, type User } from '@/lib/auth';
import { checkAndEnforceRateLimit } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    await checkAndEnforceRateLimit('auth.login', request);

    const { phone, password } = await request.json() as { phone: string; password: string };
    const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '';
    const ua = request.headers.get('user-agent') || '';

    if (!phone || !password) {
      return NextResponse.json({ success: false, error: '手机号和密码不能为空' }, { status: 400 });
    }

    // 检查登录锁定
    const attemptCheck = await checkLoginAttempts(phone);
    if (!attemptCheck.allowed) {
      await logLoginEvent({ phone, success: false, ip, ua, reason: '账号已锁定' });
      return NextResponse.json({ success: false, error: '登录失败次数过多，账号已锁定30分钟' }, { status: 429 });
    }

    // 查找用户
    const user = await queryOne<User>('SELECT * FROM users WHERE phone = ?', phone);
    if (!user) {
      await recordLoginAttempt(phone, false);
      await logLoginEvent({ phone, success: false, ip, ua, reason: '用户不存在' });
      return NextResponse.json({ success: false, error: '手机号或密码错误' }, { status: 401 });
    }

    // 验证密码
    if (!user.password_hash) {
      await recordLoginAttempt(phone, false);
      await logLoginEvent({ phone, userId: user.id, success: false, ip, ua, reason: '未设置密码' });
      return NextResponse.json({ success: false, error: '该账号未设置密码，请使用微信登录' }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      await recordLoginAttempt(phone, false);
      await logLoginEvent({ phone, userId: user.id, success: false, ip, ua, reason: '密码错误' });
      return NextResponse.json({ success: false, error: `手机号或密码错误（剩余${attemptCheck.remaining - 1}次机会）` }, { status: 401 });
    }

    // 检查用户状态
    if (user.status === 'banned') {
      await logLoginEvent({ phone, userId: user.id, success: false, ip, ua, reason: '账号已封禁' });
      return NextResponse.json({ success: false, error: '账号已被封禁，请联系管理员' }, { status: 403 });
    }

    if (user.status === 'pending') {
      await logLoginEvent({ phone, userId: user.id, success: false, ip, ua, reason: '账号待审核' });
      return NextResponse.json({ success: false, error: '账号正在审核中，请耐心等待', pending: true }, { status: 403 });
    }

    // 登录成功
    await recordLoginAttempt(phone, true);
    const sessionId = await createSession(user.id);
    await logLoginEvent({ phone, userId: user.id, success: true, ip, ua });

    const res = NextResponse.json({
      success: true,
      user: { id: user.id, nickname: user.nickname, role: user.role, avatar_url: user.avatar_url },
    });
    res.cookies.set('user_session', sessionId, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 86400, // 7天
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
