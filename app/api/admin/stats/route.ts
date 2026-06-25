export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';

export async function GET() {
  try {
    const row = await queryOne<{ total: number; today_new: number; pending: number }>(
      `SELECT 
         COUNT(*) as total,
         SUM(CASE WHEN date(created_at) = date('now') THEN 1 ELSE 0 END) as today_new,
         SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
       FROM assets`
    );
    return NextResponse.json({
      success: true,
      data: {
        total: row?.total || 0,
        todayNew: row?.today_new || 0,
        pending: row?.pending || 0,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
