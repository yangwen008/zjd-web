export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { getOpenJSSDKSignature } from '@/lib/wechat';

/**
 * GET /api/wx/jssdk?url=xxx
 * 使用开放平台网站应用 AppID 生成 JSSDK 签名
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ success: false, error: 'url parameter required' }, { status: 400 });
  }

  try {
    const signature = await getOpenJSSDKSignature(url);
    return NextResponse.json({ success: true, data: signature });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
