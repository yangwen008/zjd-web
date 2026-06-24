export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import type { Asset } from '@/lib/data';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

  let sql = 'SELECT * FROM assets';
  const args: unknown[] = [];

  if (status && status !== 'all') {
    sql += ' WHERE status = ?';
    args.push(status);
  }

  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  args.push(limit, (page - 1) * limit);

  try {
    const results = await query<Asset>(sql, ...args);
    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
