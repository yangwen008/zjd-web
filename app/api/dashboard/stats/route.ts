export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { cookies } from 'next/headers';

async function getCurrentUserId(): Promise<number | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('user_session')?.value;
  if (!sessionId) return null;

  const session = await query<{ user_id: number }>(
    'SELECT user_id FROM user_sessions WHERE id = ? AND expires_at > datetime("now")',
    sessionId
  );
  return session[0]?.user_id || null;
}

export async function GET(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    const results = await query(
      `SELECT * FROM assets WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`,
      userId,
      limit
    );

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
