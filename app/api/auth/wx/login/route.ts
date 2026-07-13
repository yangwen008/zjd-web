export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { getOAuthUrl } from '@/lib/wechat';

/**
 * GET /api/auth/wx/login
 * 生成微信 OAuth 授权 URL 并跳转
 * query: redirect (可选，授权后跳回的页面路径)
 *        mode (可选，login=登录, register=注册绑定, bind=已有用户绑定)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const redirect = searchParams.get('redirect') || '/';
  const mode = searchParams.get('mode') || 'login';

  const siteUrl = 'https://zjd.cn';
  // 所有模式都走同一个回调，通过 mode 参数区分
  const callbackUrl = `${siteUrl}/wx-callback?redirect=${encodeURIComponent(redirect)}&mode=${mode}`;

  const state = crypto.randomUUID();
  const authUrl = getOAuthUrl(callbackUrl, state, 'snsapi_base');

  return NextResponse.redirect(authUrl);
}
