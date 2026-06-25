export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { getEnv } from '@/lib/db';

export async function POST(request: Request) {
  const { password } = await request.json() as { password: string };

  // 从环境变量读取管理员密码，不再硬编码
  const env = getEnv();
  const adminPassword = env.ADMIN_PASSWORD || 'zjd2026admin';

  if (password === adminPassword) {
    const res = NextResponse.json({ success: true });
    res.cookies.set('admin_token', 'authenticated', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 86400 * 7, // 7 days
      path: '/',
    });
    return res;
  }

  return NextResponse.json({ success: false, error: '密码错误' }, { status: 401 });
}

export async function GET(request: Request) {
  const cookie = request.headers.get('cookie') || '';
  const isAuth = cookie.includes('admin_token=authenticated');
  return NextResponse.json({ authenticated: isAuth });
}

export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.delete('admin_token');
  return res;
}
