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
    const search = searchParams.get('search');
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const limit = Math.min(parseInt(searchParams.get('limit') || '12'), 50);
    const offset = (page - 1) * limit;

    // 查单条
    if (id) {
      const asset = await queryOne('SELECT * FROM assets WHERE id = ?', parseInt(id));
      if (!asset) return NextResponse.json({ success: false, error: '资产不存在' }, { status: 404 });
      if ((asset as any).user_id !== user.id && !['admin', 'superadmin'].includes(user.role)) {
        return NextResponse.json({ success: false, error: '无权查看' }, { status: 403 });
      }
      return NextResponse.json({ success: true, data: asset });
    }

    const isAdmin = ['admin', 'superadmin'].includes(user.role);
    const isAll = scope === 'all' && isAdmin;

    let whereSql = '';
    const args: unknown[] = [];
    const conditions: string[] = [];

    if (!isAll) {
      conditions.push('user_id = ?');
      args.push(user.id);
    }

    if (search && search.trim()) {
      conditions.push('(title LIKE ? OR location LIKE ? OR province LIKE ? OR city LIKE ?)');
      const q = `%${search.trim()}%`;
      args.push(q, q, q, q);
    }

    if (conditions.length > 0) {
      whereSql = ' WHERE ' + conditions.join(' AND ');
    }

    // 查询总数
    const countRow = await queryOne<{ total: number }>(`SELECT COUNT(*) as total FROM assets${whereSql}`, ...args);
    const total = countRow?.total || 0;

    // 查询当前页数据
    const dataArgs = [...args, limit, offset];
    const results = await query(`SELECT * FROM assets${whereSql} ORDER BY created_at DESC LIMIT ? OFFSET ?`, ...dataArgs);

    return NextResponse.json({
      success: true,
      data: results,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
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
