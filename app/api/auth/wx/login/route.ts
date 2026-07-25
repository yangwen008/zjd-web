export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { getOAuthUrl } from '@/lib/wechat';

/**
 * GET /api/auth/wx/login
 * 生成微信 OAuth 授权 URL 并跳转
 * query: redirect (可选，授权后跳回的页面路径)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const redirect = searchParams.get('redirect') || '/';
  const mode = searchParams.get('mode') || '';

  const siteUrl = 'https://z.zjd.cn';
  // mode=register 时，回调到注册页并携带 openid 等数据
  const callbackRedirect = mode === 'register' ? `/register?wx=1` : redirect;
  const callbackUrl = `${siteUrl}/wx-callback?redirect=${encodeURIComponent(callbackRedirect)}&mode=${mode}`;

  const state = crypto.randomUUID();

  const authUrl = getOAuthUrl(callbackUrl, state, 'snsapi_userinfo');

  return NextResponse.redirect(authUrl);
}
