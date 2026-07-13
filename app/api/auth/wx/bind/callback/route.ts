export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';
import { getOAuthToken, getWxUserInfo } from '@/lib/wechat';
import { getUserFromRequest } from '@/lib/auth';

/**
 * GET /api/auth/wx/bind/callback
 * 微信绑定回调处理
 * - mode=register: 获取 openid/nickname/avatar 返回给前端（不创建用户）
 * - mode=bind: 已登录用户绑定 wx_openid
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const mode = searchParams.get('mode') || 'register';

  if (!code) {
    return NextResponse.json({ success: false, error: 'Missing code' }, { status: 400 });
  }

  try {
    // 1. 用 code 换 token
    const tokenData = await getOAuthToken(code);

    // 2. 获取用户信息
    let wxUser = null;
    try {
      wxUser = await getWxUserInfo(tokenData.access_token, tokenData.openid);
    } catch {
      // snsapi_base 模式下拿不到用户信息
    }

    if (mode === 'register') {
      // 注册模式：检查 openid 是否已被绑定
      const existing = await queryOne<{ id: number }>(
        'SELECT id FROM users WHERE wx_openid = ?',
        tokenData.openid
      );

      if (existing) {
        return NextResponse.json({
          success: false,
          error: '该微信已绑定其他账号，请直接用微信登录',
        });
      }

      return NextResponse.json({
        success: true,
        openid: tokenData.openid,
        nickname: wxUser?.nickname || '',
        avatar: wxUser?.headimgurl || '',
      });
    }

    // 绑定模式：已登录用户绑定微信
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: '请先登录' }, { status: 401 });
    }

    // 检查该微信是否已被其他账号绑定
    const existing = await queryOne<{ id: number; nickname: string }>(
      'SELECT id, nickname FROM users WHERE wx_openid = ? AND id != ?',
      tokenData.openid, user.id
    );

    if (existing) {
      return NextResponse.json({
        success: false,
        error: `该微信已绑定账号「${existing.nickname}」，请先解绑后再操作`,
      });
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

    return NextResponse.json({ success: true, message: '微信绑定成功' });
  } catch (error) {
    console.error('WeChat bind callback error:', error);
    return NextResponse.json({ success: false, error: '微信授权失败，请重试' }, { status: 500 });
  }
}
