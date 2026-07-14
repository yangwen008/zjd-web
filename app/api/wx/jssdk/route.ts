export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { getJSSDKSignature } from '@/lib/wechat';

/**
 * GET /api/wx/jssdk?url=xxx
 * 返回 JSSDK 签名，供前端 wx.config() 使用
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ success: false, error: 'url parameter required' }, { status: 400 });
  }

  try {
    const signature = await getJSSDKSignature(url);
    return NextResponse.json({ success: true, data: signature });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
