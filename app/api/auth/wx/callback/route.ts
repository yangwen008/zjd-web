export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';
import { getOAuthToken, getWxUserInfo } from '@/lib/wechat';
import { createSession, getUserFromRequest } from '@/lib/auth';

/**
 * GET /api/auth/wx/callback
 * 微信 OAuth 回调处理
 * - mode=login: 登录/自动注册（原有逻辑）
 * - mode=register: 注册绑定，把 openid 存入 sessionStorage，跳回注册页
 * - mode=bind: 已登录用户绑定微信
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const redirect = searchParams.get('redirect') || '/';
  const mode = searchParams.get('mode') || 'login';

  if (!code) {
    return NextResponse.json({ success: false, error: 'Missing code parameter' }, { status: 400 });
  }

  const siteUrl = 'https://zjd.cn';

  try {
    // 1. 用 code 换 token
    const tokenData = await getOAuthToken(code);

    // 2. 获取用户信息
    let wxUser;
    try {
      wxUser = await getWxUserInfo(tokenData.access_token, tokenData.openid);
    } catch {
      wxUser = null;
    }

    // ========== 注册模式 ==========
    if (mode === 'register') {
      // 检查 openid 是否已被绑定
      const existing = await queryOne<{ id: number }>(
        'SELECT id FROM users WHERE wx_openid = ?',
        tokenData.openid
      );

      if (existing) {
        // 已绑定，提示直接登录
        return NextResponse.redirect(`${siteUrl}/login?error=wx_already_bound`);
      }

      // 把 openid 信息通过 URL 参数传回注册页（sessionStorage 在 SSR 中不可用）
      const params = new URLSearchParams({
        wx: '1',
        openid: tokenData.openid,
        nickname: wxUser?.nickname || '',
        avatar: wxUser?.headimgurl || '',
      });
      return NextResponse.redirect(`${siteUrl}/register?${params.toString()}`);
    }

    // ========== 绑定模式 ==========
    if (mode === 'bind') {
      const user = await getUserFromRequest(request);
      if (!user) {
        return NextResponse.redirect(`${siteUrl}/login?error=not_logged_in`);
      }

      // 检查该微信是否已被其他账号绑定
      const existing = await queryOne<{ id: number; nickname: string }>(
        'SELECT id, nickname FROM users WHERE wx_openid = ? AND id != ?',
        tokenData.openid, user.id
      );

      if (existing) {
        return NextResponse.redirect(`${siteUrl}/dashboard/profile?error=wx_bound_other`);
      }

      // 绑定
      await execute(
        `UPDATE users SET wx_openid = ?, wx_unionid = COALESCE(?, wx_unionid),
         wx_nickname = COALESCE(?, wx_nickname), wx_avatar = COALESCE(?, wx_avatar),
         avatar_url = COALESCE(NULLIF(?, ''), avatar_url),
         updated_at = datetime('now')
         WHERE id = ?`,
        tokenData.openid,
        tokenData.unionid || null,
        wxUser?.nickname || null,
        wxUser?.headimgurl || null,
        wxUser?.headimgurl || null,
        user.id
      );

      return NextResponse.redirect(`${siteUrl}/dashboard/profile?success=wx_bound`);
    }

    // ========== 登录模式（原有逻辑） ==========
    // 3. 查找已有用户
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
        `INSERT INTO users (wx_openid, wx_unionid, nickname, avatar_url, role, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'buyer', 'active', datetime('now'), datetime('now'))`,
        tokenData.openid,
        tokenData.unionid || null,
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
      return NextResponse.redirect(`${siteUrl}/login?error=banned`);
    }

    // 5. 创建 session
    const sessionId = await createSession(user.id);

    const res = NextResponse.redirect(`${siteUrl}${redirect}`);
    res.cookies.set('user_session', sessionId, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 7 * 86400,
      path: '/',
    });

    return res;
  } catch (error) {
    console.error('WeChat OAuth callback error:', error);
    return NextResponse.redirect(`${siteUrl}/login?error=wx_failed`);
  }
}
