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

  const siteUrl = 'https://zjd.cn';
  const callbackUrl = `${siteUrl}/wx-callback?redirect=${encodeURIComponent(redirect)}`;

  const state = crypto.randomUUID();

  const authUrl = getOAuthUrl(callbackUrl, state, 'snsapi_base');

  return NextResponse.redirect(authUrl);
}
