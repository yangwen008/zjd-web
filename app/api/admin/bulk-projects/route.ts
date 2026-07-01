export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const province = searchParams.get('province');
  const search = searchParams.get('search');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

  let sql = 'SELECT * FROM bulk_projects';
  const args: unknown[] = [];

  if (status && status !== 'all') {
    sql += ' WHERE status = ?';
    args.push(status);
  }

  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  args.push(limit, (page - 1) * limit);

  try {
    const results = await query(sql, ...args);
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
      const {
        title, code, description, location, province, city, district,
        area_mu, area_sqm, price_total, price_start, yield_rate, lease_years,
        certification, planning_use, images, video_url, commercial_plan,
        cert_doc_url, gps_lat, gps_lng, contact_name, contact_phone,
        status, featured, user_id,
      } = body as Record<string, unknown>;

      const result = await execute(
        `INSERT INTO bulk_projects (
          title, code, description, location, province, city, district,
          area_mu, area_sqm, price_total, price_start, yield_rate, lease_years,
          certification, planning_use, images, video_url, commercial_plan,
          cert_doc_url, gps_lat, gps_lng, contact_name, contact_phone,
          status, featured, user_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        title, code || null, description || null, location || null,
        province || null, city || null, district || null,
        area_mu || null, area_sqm || null, price_total || null, price_start || null,
        yield_rate || null, lease_years || null,
        certification || 'uncertified', planning_use || null,
        images || null, video_url || null, commercial_plan || null,
        cert_doc_url || null, gps_lat || null, gps_lng || null,
        contact_name || null, contact_phone || null,
        status || 'pending', featured ? 1 : 0, user_id || null
      );
      return NextResponse.json({ success: true, id: result.meta.last_row_id });
    }

    if (action === 'update') {
      const {
        id, title, code, description, location, province, city, district,
        area_mu, area_sqm, price_total, price_start, yield_rate, lease_years,
        certification, planning_use, images, video_url, commercial_plan,
        cert_doc_url, infra_details, gps_lat, gps_lng, contact_name, contact_phone,
        status, featured,
      } = body as Record<string, unknown>;

      await execute(
        `UPDATE bulk_projects SET
          title = ?, code = ?, description = ?, location = ?, province = ?, city = ?, district = ?,
          area_mu = ?, area_sqm = ?, price_total = ?, price_start = ?, yield_rate = ?, lease_years = ?,
          certification = ?, planning_use = ?, images = ?, video_url = ?, commercial_plan = ?,
          cert_doc_url = ?, infra_details = ?, gps_lat = ?, gps_lng = ?, contact_name = ?, contact_phone = ?,
          status = ?, featured = ?, updated_at = datetime('now')
        WHERE id = ?`,
        title, code, description, location, province, city, district,
        area_mu, area_sqm, price_total, price_start, yield_rate, lease_years,
        certification, planning_use, images, video_url, commercial_plan,
        cert_doc_url, infra_details || null, gps_lat, gps_lng, contact_name, contact_phone,
        status, featured ? 1 : 0, id
      );
      return NextResponse.json({ success: true });
    }

    if (action === 'delete') {
      const { id } = body as { id: number };
      await execute('DELETE FROM bulk_projects WHERE id = ?', id);
      return NextResponse.json({ success: true });
    }

    if (action === 'toggle-featured') {
      const { id, featured } = body as { id: number; featured: number };
      await execute('UPDATE bulk_projects SET featured = ?, updated_at = datetime("now") WHERE id = ?', featured ? 1 : 0, id);
      return NextResponse.json({ success: true });
    }

    if (action === 'update-status') {
      const { id, status } = body as { id: number; status: string };
      if (!['approved', 'rejected', 'pending'].includes(status)) {
        return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
      }
      await execute('UPDATE bulk_projects SET status = ?, updated_at = datetime("now") WHERE id = ?', status, id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
