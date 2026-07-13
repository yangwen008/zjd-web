export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import type { Broker } from '@/lib/data';

export async function GET() {
  try {
    // 1. brokers 表中已有记录
    const brokerRows = await query<Broker>(
      `SELECT * FROM brokers ORDER BY CASE rating WHEN 'gold' THEN 1 WHEN 'silver' THEN 2 ELSE 3 END, show_count DESC`
    );

    // 2. users 表中 role=broker 但不在 brokers 表中的用户（注册后未被录入）
    const existingUserIds = brokerRows.map((b) => b.user_id).filter(Boolean);
    let orphanQuery = `SELECT id, nickname, phone, broker_region, broker_specialties, broker_bio, avatar_url, created_at FROM users WHERE role = 'broker' AND status = 'active'`;
    if (existingUserIds.length > 0) {
      orphanQuery += ` AND id NOT IN (${existingUserIds.join(',')})`;
    }
    const orphanUsers = await query<any>(orphanQuery);

    // 3. 将孤立用户转为 broker 格式，追加到列表前面
    const orphanBrokers: Broker[] = orphanUsers.map((u: any) => ({
      id: 0, // 标记为未入库
      user_id: u.id,
      name: u.nickname || '未命名',
      region: u.broker_region || '',
      province: null,
      city: null,
      bio: u.broker_bio || '',
      specialties: u.broker_specialties || '[]',
      rating: 'bronze',
      show_count: 0,
      good_rate: 0,
      phone_encrypted: u.phone || null,
      avatar_url: u.avatar_url || null,
      status: 'pending_import',
      created_at: u.created_at,
    }));

    return NextResponse.json({ success: true, data: [...orphanBrokers, ...brokerRows] });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body as { action: string };

    if (action === 'add') {
      const { name, region, province, city, bio, specialties, rating, show_count, good_rate, phone, avatar_url, user_id } = body as {
        name: string; region: string; province: string; city: string;
        bio: string; specialties: string; rating: string;
        show_count: number; good_rate: number; phone: string; avatar_url: string; user_id?: number;
      };
      const result = await execute(
        `INSERT INTO brokers (user_id, name, region, province, city, bio, specialties, rating, show_count, good_rate, phone_encrypted, avatar_url, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', datetime('now'))`,
        user_id || null, name, region || '', province || '', city || '', bio || '',
        specialties || '[]', rating || 'bronze',
        show_count || 0, good_rate || 0, phone || '', avatar_url || ''
      );
      return NextResponse.json({ success: true, id: result.meta.last_row_id });
    }

    if (action === 'update') {
      const { id, name, region, province, city, bio, specialties, rating, show_count, good_rate, phone, avatar_url } = body as {
        id: number; name: string; region: string; province: string; city: string;
        bio: string; specialties: string; rating: string;
        show_count: number; good_rate: number; phone: string; avatar_url: string;
      };
      await execute(
        `UPDATE brokers SET name = ?, region = ?, province = ?, city = ?, bio = ?, specialties = ?, rating = ?, show_count = ?, good_rate = ?, phone_encrypted = ?, avatar_url = ?
         WHERE id = ?`,
        name, region, province || '', city || '', bio, specialties || '[]',
        rating, show_count, good_rate, phone, avatar_url, id
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
