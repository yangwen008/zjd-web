export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/lib/db';
import type { Asset } from '@/lib/data';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const search = searchParams.get('search');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

  let sql = 'SELECT * FROM assets';
  const args: unknown[] = [];
  const conditions: string[] = [];

  if (status && status !== 'all') {
    conditions.push('status = ?');
    args.push(status);
  }

  if (search && search.trim()) {
    conditions.push('(title LIKE ? OR location LIKE ? OR province LIKE ? OR city LIKE ? OR asset_type LIKE ?)');
    const q = `%${search.trim()}%`;
    args.push(q, q, q, q, q);
  }

  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body as { action: string };

    if (action === 'toggle-featured') {
      const { id, featured } = body as { id: number; featured: number };
      await execute('UPDATE assets SET featured = ? WHERE id = ?', featured ? 1 : 0, id);
      return NextResponse.json({ success: true });
    }

    if (action === 'update-status') {
      const { id, status } = body as { id: number; status: string };
      if (!['approved', 'rejected', 'banned'].includes(status)) {
        return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
      }
      await execute('UPDATE assets SET status = ? WHERE id = ?', status, id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json() as any;
    const { id, title, description, province, city, district, address, area_mu, price_year, price_total, lease_years, asset_type, contact_name, contact_phone, images, video_url, status, infra_details } = body;

    if (!id) return NextResponse.json({ success: false, error: '缺少资产ID' }, { status: 400 });

    const asset = await queryOne('SELECT id FROM assets WHERE id = ?', id);
    if (!asset) return NextResponse.json({ success: false, error: '资产不存在' }, { status: 404 });

    const location = [province, city, district, address].filter(Boolean).join('');

    const fields: string[] = [];
    const args: unknown[] = [];

    if (title !== undefined) { fields.push('title = ?'); args.push(title); }
    if (description !== undefined) { fields.push('description = ?'); args.push(description || ''); }
    if (province !== undefined) { fields.push('province = ?'); args.push(province); }
    if (city !== undefined) { fields.push('city = ?'); args.push(city || ''); }
    if (district !== undefined) { fields.push('district = ?'); args.push(district || ''); }
    if (address !== undefined) { fields.push('address = ?'); args.push(address || ''); }
    fields.push('location = ?'); args.push(location);
    if (area_mu !== undefined) { fields.push('area_mu = ?'); args.push(area_mu ? parseFloat(area_mu) : null); }
    if (price_year !== undefined) { fields.push('price_year = ?'); args.push(price_year ? parseFloat(price_year) : null); }
    if (price_total !== undefined) { fields.push('price_total = ?'); args.push(price_total ? parseFloat(price_total) : null); }
    if (lease_years !== undefined) { fields.push('lease_years = ?'); args.push(lease_years ? parseInt(lease_years) : null); }
    if (asset_type !== undefined) { fields.push('asset_type = ?'); args.push(asset_type || '宅基地'); }
    if (images !== undefined) { fields.push('images = ?'); args.push(images || '[]'); }
    if (video_url !== undefined) { fields.push('video_url = ?'); args.push(video_url || null); }
    if (contact_name !== undefined) { fields.push('contact_name = ?'); args.push(contact_name || ''); }
    if (contact_phone !== undefined) { fields.push('contact_phone = ?'); args.push(contact_phone || ''); }
    if (status !== undefined) { fields.push('status = ?'); args.push(status); }
    if (infra_details !== undefined) { fields.push('infra_details = ?'); args.push(infra_details); }
    fields.push("updated_at = datetime('now')");

    args.push(id);
    await execute(`UPDATE assets SET ${fields.join(', ')} WHERE id = ?`, ...args);

    return NextResponse.json({ success: true, message: '修改已保存' });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
