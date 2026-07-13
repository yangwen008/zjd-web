export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { getOAuthUrl } from '@/lib/wechat';

/**
 * GET /api/auth/wx/bind
 * 生成微信 OAuth 授权 URL（用于绑定场景）
 * query: mode = 'register' | 'bind'
 *   - register: 注册流程中绑定，回调到 /wx-bind-callback
 *   - bind: 已登录用户绑定，回调到 /wx-bind-callback
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode') || 'register';

  const siteUrl = 'https://zjd.cn';
  const callbackUrl = `${siteUrl}/wx-bind-callback?mode=${mode}`;

  const state = crypto.randomUUID();

  const authUrl = getOAuthUrl(callbackUrl, state, 'snsapi_userinfo');

  return NextResponse.redirect(authUrl);
}
