export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';
import { getOpenOAuthToken } from '@/lib/wechat';
import { createSession } from '@/lib/auth';

/**
 * POST /api/auth/wx/open-login
 * 微信开放平台网页登录（PC 扫码）
 * body: { code: string, redirect?: string }
 */
export async function POST(request: Request) {
  try {
    const { code, redirect = '/' } = await request.json() as { code: string; redirect?: string };

    if (!code) {
      return NextResponse.json({ success: false, error: 'Missing code' }, { status: 400 });
    }

    const siteUrl = 'https://z.zjd.cn';

    // 1. 用 code 换 token（开放平台）
    const tokenData = await getOpenOAuthToken(code);

    // 2. 获取用户信息（直接调用微信API，不走代理）
    let wxUser = null;
    try {
      const userInfoRes = await fetch(`https://api.weixin.qq.com/sns/userinfo?access_token=${tokenData.access_token}&openid=${tokenData.openid}&lang=zh_CN`);
      const userInfoData = await userInfoRes.json() as any;
      if (!userInfoData.errcode) {
        wxUser = userInfoData;
      }
    } catch {}

    // 3. 查找已有用户（优先 open_platform 的 openid，其次 unionid）
    let user = await queryOne<{ id: number; nickname: string; role: string; status: string }>(
      'SELECT id, nickname, role, status FROM users WHERE wx_openid = ?',
      tokenData.openid
    );

    if (!user && tokenData.unionid) {
      user = await queryOne<{ id: number; nickname: string; role: string; status: string }>(
        'SELECT id, nickname, role, status FROM users WHERE wx_unionid = ?',
        tokenData.unionid
      );
      if (user) {
        await execute('UPDATE users SET wx_openid = ? WHERE id = ?', tokenData.openid, user.id);
      }
    }

    // 4. 没有已有用户 → 自动注册
    if (!user) {
      const nickname = wxUser?.nickname || `微信用户${tokenData.openid.slice(-6)}`;
      const avatarUrl = wxUser?.headimgurl || null;

      const result = await execute(
        `INSERT INTO users (wx_openid, wx_unionid, wx_nickname, wx_avatar, nickname, avatar_url, role, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 'buyer', 'active', datetime('now'), datetime('now'))`,
        tokenData.openid,
        tokenData.unionid || null,
        wxUser?.nickname || null,
        wxUser?.headimgurl || null,
        nickname,
        avatarUrl
      );

      user = {
        id: result.meta?.last_row_id || 0,
        nickname,
        role: 'buyer',
        status: 'active',
      };
    }

    if (user.status === 'banned') {
      return NextResponse.json({ success: false, error: '账号已被封禁' }, { status: 403 });
    }

    // 5. 创建 session
    const sessionId = await createSession(user.id);

    const res = NextResponse.json({
      success: true,
      user: { id: user.id, nickname: user.nickname, role: user.role },
      redirect,
    });

    res.cookies.set('user_session', sessionId, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 7 * 86400,
      path: '/',
    });

    return res;
  } catch (error: any) {
    console.error('WeChat Open Platform login error:', error);
    return NextResponse.json({ success: false, error: error.message || '微信登录失败' }, { status: 500 });
  }
}
