import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import type { Asset } from '@/lib/data';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const source = searchParams.get('source');
  const province = searchParams.get('province');
  const search = searchParams.get('search');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

  let sql: string;
  const args: unknown[] = [];

  if (search) {
    // FTS5 全文搜索
    sql = `SELECT assets.* FROM assets
           JOIN assets_fts ON assets.id = assets_fts.rowid
           WHERE assets.status = ? AND assets_fts MATCH ?`;
    args.push('approved', search);
    if (source) { sql += ' AND assets.source_type = ?'; args.push(source); }
    if (province) { sql += ' AND assets.province = ?'; args.push(province); }
  } else {
    sql = 'SELECT * FROM assets WHERE status = ?';
    args.push('approved');
    if (source) { sql += ' AND source_type = ?'; args.push(source); }
    if (province) { sql += ' AND province = ?'; args.push(province); }
  }

  sql += ' ORDER BY views DESC LIMIT ? OFFSET ?';
  args.push(limit, (page - 1) * limit);

  try {
    const results = await query<Asset>(sql, ...args);
    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
