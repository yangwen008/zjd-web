export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';
import { getOAuthToken, getWxUserInfo } from '@/lib/wechat';
import { createSession } from '@/lib/auth';

/**
 * GET /api/auth/wx/callback
 * 微信 OAuth 回调处理
 * - 用 code 换 token + openid + 用户信息
 * - 查 users 表：有 wx_openid → 直接登录
 * - 没有 → 自动注册新用户
 * - 写入 session cookie，跳转回原页面
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const redirect = searchParams.get('redirect') || '/';

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
      // snsapi_base 模式下拿不到用户信息，只有 openid
      wxUser = null;
    }

    // 3. 查找已有用户（优先 wx_openid，其次 unionid）
    let user = await queryOne<{ id: number; nickname: string; role: string; status: string }>(
      'SELECT id, nickname, role, status FROM users WHERE wx_openid = ?',
      tokenData.openid
    );

    // 如果有 unionid，也尝试匹配
    if (!user && tokenData.unionid) {
      user = await queryOne<{ id: number; nickname: string; role: string; status: string }>(
        'SELECT id, nickname, role, status FROM users WHERE wx_unionid = ?',
        tokenData.unionid
      );
      // 如果通过 unionid 找到了，更新 wx_openid
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

    // 5. 检查用户状态
    if (user.status === 'banned') {
      return NextResponse.redirect(`${siteUrl}/login?error=banned`);
    }

    // 6. 创建 session
    const sessionId = await createSession(user.id);

    // 7. 设置 cookie 并跳转
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
