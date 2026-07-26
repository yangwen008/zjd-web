export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';
import { createSession } from '@/lib/auth';

/**
 * POST /api/auth/wx/mini-login
 * 微信小程序登录：用 wx.login() 的 code 换取 openid，自动创建/匹配用户
 */
export async function POST(request: Request) {
  try {
    const { code } = await request.json() as { code: string };

    if (!code) {
      return NextResponse.json({ success: false, error: '缺少 code' }, { status: 400 });
    }

    const appId = (process.env as Record<string, string>).WX_MINI_APPID || (process.env as Record<string, string>).WX_APPID || '';
    const appSecret = (process.env as Record<string, string>).WX_MINI_APPSECRET || (process.env as Record<string, string>).WX_APPSECRET || '';

    if (!appId || !appSecret) {
      return NextResponse.json({ success: false, error: '小程序未配置 AppID/AppSecret' }, { status: 500 });
    }

    // 1. 用 code 换取 openid + session_key
    const wxUrl = `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${appSecret}&js_code=${code}&grant_type=authorization_code`;
    const wxRes = await fetch(wxUrl);
    const wxData = await wxRes.json() as {
      openid?: string;
      session_key?: string;
      unionid?: string;
      errcode?: number;
      errmsg?: string;
    };

    if (!wxData.openid) {
      console.error('jscode2session failed:', wxData);
      return NextResponse.json({
        success: false,
        error: `微信登录失败: ${wxData.errmsg || '未知错误'} (${wxData.errcode || ''})`
      }, { status: 400 });
    }

    const openid = wxData.openid;
    const unionid = wxData.unionid || null;

    // 2. 查找已有用户（优先 wx_openid，其次 openid）
    let user = await queryOne<{ id: number; nickname: string; role: string; avatar_url: string | null; phone: string | null }>(
      'SELECT id, nickname, role, avatar_url, phone FROM users WHERE wx_openid = ? OR openid = ? LIMIT 1',
      openid, openid
    );

    // 3. 自动创建新用户
    if (!user) {
      const result = await execute(
        `INSERT INTO users (openid, wx_openid, wx_unionid, nickname, role, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'buyer', 'active', datetime('now'), datetime('now'))`,
        openid, openid, unionid, '微信用户'
      );
      const userId = result.meta?.last_row_id || 0;
      user = { id: userId, nickname: '微信用户', role: 'buyer', avatar_url: null, phone: null };
    }

    // 4. 创建 session
    const sessionId = await createSession(user.id);

    // 5. 返回 token + 用户信息
    const res = NextResponse.json({
      success: true,
      token: sessionId,
      user: {
        id: user.id,
        nickname: user.nickname,
        role: user.role,
        avatar_url: user.avatar_url,
        phone: user.phone,
      },
    });

    // 同时设置 cookie（H5 兼容）
    res.cookies.set('user_session', sessionId, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 86400,
      path: '/',
    });

    return res;
  } catch (error) {
    console.error('mini-login error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
