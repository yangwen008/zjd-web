export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { deleteSession } from '@/lib/auth';

export async function POST(request: Request) {
  const cookie = request.headers.get('cookie') || '';
  const match = cookie.match(/user_session=([^;]+)/);

  if (match) {
    await deleteSession(match[1]);
  }

  const res = NextResponse.json({ success: true });
  res.cookies.delete('user_session');
  return res;
}
