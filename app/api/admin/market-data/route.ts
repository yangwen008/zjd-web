export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import type { MarketData } from '@/lib/data';

export async function GET() {
  try {
    const results = await query<MarketData>(
      'SELECT * FROM market_data ORDER BY median_price DESC'
    );
    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body as { action: string };

    if (action === 'add') {
      const { province, median_price, change_pct, bargain_space, total_listings } = body as {
        province: string; median_price: number; change_pct: number;
        bargain_space: number; total_listings: number;
      };
      const result = await execute(
        `INSERT INTO market_data (province, median_price, change_pct, bargain_space, total_listings, updated_at)
         VALUES (?, ?, ?, ?, ?, datetime('now'))`,
        province, median_price || 0, change_pct || 0, bargain_space || 0, total_listings || 0
      );
      return NextResponse.json({ success: true, id: result.meta.last_row_id });
    }

    if (action === 'update') {
      const { id, province, median_price, change_pct, bargain_space, total_listings } = body as {
        id: number; province: string; median_price: number; change_pct: number;
        bargain_space: number; total_listings: number;
      };
      await execute(
        `UPDATE market_data SET province = ?, median_price = ?, change_pct = ?, bargain_space = ?, total_listings = ?, updated_at = datetime('now')
         WHERE id = ?`,
        province, median_price, change_pct, bargain_space, total_listings, id
      );
      return NextResponse.json({ success: true });
    }

    if (action === 'delete') {
      const { id } = body as { id: number };
      await execute('DELETE FROM market_data WHERE id = ?', id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
