export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const scope = searchParams.get('scope');
    const id = searchParams.get('id');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    // 查单条
    if (id) {
      const asset = await queryOne('SELECT * FROM assets WHERE id = ?', parseInt(id));
      if (!asset) return NextResponse.json({ success: false, error: '资产不存在' }, { status: 404 });
      if ((asset as any).user_id !== user.id && !['admin', 'superadmin'].includes(user.role)) {
        return NextResponse.json({ success: false, error: '无权查看' }, { status: 403 });
      }
      return NextResponse.json({ success: true, data: asset });
    }

    let sql = 'SELECT * FROM assets';
    const args: unknown[] = [];

    if (scope === 'all' && ['admin', 'superadmin'].includes(user.role)) {
      sql += ' ORDER BY created_at DESC LIMIT ?';
      args.push(limit);
    } else {
      sql += ' WHERE user_id = ? ORDER BY created_at DESC LIMIT ?';
      args.push(user.id, limit);
    }

    const results = await query(sql, ...args);
    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });

    const body = await request.json() as any;
    const { id, title, description, province, city, district, address, area_mu, price_year, price_total, lease_years, asset_type, contact_name, contact_phone, images, video_url } = body;

    if (!id) return NextResponse.json({ success: false, error: '缺少资产ID' }, { status: 400 });

    const asset = await queryOne<{ user_id: number }>('SELECT user_id FROM assets WHERE id = ?', id);
    if (!asset) return NextResponse.json({ success: false, error: '资产不存在' }, { status: 404 });
    if (asset.user_id !== user.id && !['admin', 'superadmin'].includes(user.role)) {
      return NextResponse.json({ success: false, error: '无权修改' }, { status: 403 });
    }

    const location = [province, city, district, address].filter(Boolean).join('');

    await execute(
      `UPDATE assets SET
        title = ?, description = ?, location = ?, province = ?, city = ?, district = ?, address = ?,
        area_mu = ?, price_year = ?, price_total = ?, lease_years = ?, asset_type = ?,
        images = ?, video_url = ?, contact_name = ?, contact_phone = ?, status = 'pending', updated_at = datetime('now')
       WHERE id = ?`,
      title, description || '', location, province, city || '', district || '', address || '',
      area_mu ? parseFloat(area_mu) : null, price_year ? parseFloat(price_year) : null,
      price_total ? parseFloat(price_total) : null, lease_years ? parseInt(lease_years) : null,
      asset_type || '宅基地', images || '[]', video_url || null, contact_name || '', contact_phone || '', id
    );

    return NextResponse.json({ success: true, message: '修改成功，需重新审核' });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
