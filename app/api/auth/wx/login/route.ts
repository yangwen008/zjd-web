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

  // 回调地址必须是微信后台配置的授权域名下的完整 URL
  const siteUrl = 'https://zjd.cn';
  const callbackUrl = `${siteUrl}/wx-callback?redirect=${encodeURIComponent(redirect)}`;

  // 生成防 CSRF state
  const state = crypto.randomUUID();

  const authUrl = getOAuthUrl(callbackUrl, state, 'snsapi_userinfo');

  return NextResponse.redirect(authUrl);
}
