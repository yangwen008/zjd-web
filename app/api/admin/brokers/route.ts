export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import type { Broker } from '@/lib/data';

export async function GET() {
  try {
    const results = await query<Broker>(
      `SELECT * FROM brokers ORDER BY CASE rating WHEN 'gold' THEN 1 WHEN 'silver' THEN 2 ELSE 3 END, show_count DESC`
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
      const { name, region, bio, rating, show_count, good_rate, phone, avatar_url } = body as {
        name: string; region: string; bio: string; rating: string;
        show_count: number; good_rate: number; phone: string; avatar_url: string;
      };
      const result = await execute(
        `INSERT INTO brokers (name, region, bio, rating, show_count, good_rate, phone_encrypted, avatar_url, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', datetime('now'))`,
        name, region || '', bio || '', rating || 'bronze',
        show_count || 0, good_rate || 0, phone || '', avatar_url || ''
      );
      return NextResponse.json({ success: true, id: result.meta.last_row_id });
    }

    if (action === 'update') {
      const { id, name, region, bio, rating, show_count, good_rate, phone, avatar_url } = body as {
        id: number; name: string; region: string; bio: string; rating: string;
        show_count: number; good_rate: number; phone: string; avatar_url: string;
      };
      await execute(
        `UPDATE brokers SET name = ?, region = ?, bio = ?, rating = ?, show_count = ?, good_rate = ?, phone_encrypted = ?, avatar_url = ?
         WHERE id = ?`,
        name, region, bio, rating, show_count, good_rate, phone, avatar_url, id
      );
      return NextResponse.json({ success: true });
    }

    if (action === 'delete') {
      const { id } = body as { id: number };
      await execute('DELETE FROM brokers WHERE id = ?', id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
