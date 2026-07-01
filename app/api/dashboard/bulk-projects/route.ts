export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// GET: 获取当前用户的大宗项目列表
export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });

    // admin/superadmin 可看全部，其他角色只看自己的
    const isAdmin = ['admin', 'superadmin'].includes(user.role);
    const sql = isAdmin
      ? 'SELECT * FROM bulk_projects ORDER BY created_at DESC LIMIT 50'
      : 'SELECT * FROM bulk_projects WHERE user_id = ? ORDER BY created_at DESC LIMIT 50';

    const results = isAdmin
      ? await query(sql)
      : await query(sql, user.id);

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

// DELETE: 删除大宗项目（仅自己的或管理员）
export async function DELETE(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });

    const { id } = await request.json() as { id: number };
    if (!id) return NextResponse.json({ success: false, error: '缺少项目ID' }, { status: 400 });

    const isAdmin = ['admin', 'superadmin'].includes(user.role);
    if (isAdmin) {
      await execute('DELETE FROM bulk_projects WHERE id = ?', id);
    } else {
      await execute('DELETE FROM bulk_projects WHERE id = ? AND user_id = ?', id, user.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

// PUT: 更新大宗项目（仅自己的或管理员）
export async function PUT(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });

    const body = await request.json() as any;
    const { id } = body;
    if (!id) return NextResponse.json({ success: false, error: '缺少项目ID' }, { status: 400 });

    const isAdmin = ['admin', 'superadmin'].includes(user.role);

    // 权限检查：非管理员只能编辑自己的
    if (!isAdmin) {
      const existing = await query('SELECT user_id FROM bulk_projects WHERE id = ?', id) as any[];
      if (!existing.length || existing[0].user_id !== user.id) {
        return NextResponse.json({ success: false, error: '无权编辑此项目' }, { status: 403 });
      }
    }

    const location = [body.province, body.city, body.district, body.location].filter(Boolean).join('');

    let imagesJson = '[]';
    if (body.images) {
      if (typeof body.images === 'string' && body.images.startsWith('[')) imagesJson = body.images;
      else if (typeof body.images === 'string') imagesJson = JSON.stringify(body.images.split(',').filter((u: string) => u.trim() !== ''));
    }

    await execute(
      `UPDATE bulk_projects SET
        title = ?, code = ?, description = ?, location = ?, province = ?, city = ?, district = ?,
        area_mu = ?, area_sqm = ?, price_total = ?, price_start = ?, yield_rate = ?, lease_years = ?,
        certification = ?, planning_use = ?, images = ?, commercial_plan = ?, commercial_plan_doc = ?, infra_details = ?,
        gps_lat = ?, gps_lng = ?, contact_name = ?, contact_phone = ?, updated_at = datetime('now')
      WHERE id = ?`,
      body.title, body.code || null, body.description || '', location,
      body.province, body.city || '', body.district || '',
      body.area_mu ? parseFloat(body.area_mu) : null,
      body.area_sqm ? parseFloat(body.area_sqm) : null,
      body.price_total ? parseFloat(body.price_total) : null,
      body.price_start ? parseFloat(body.price_start) : null,
      body.yield_rate ? parseFloat(body.yield_rate) : null,
      body.lease_years ? parseInt(body.lease_years) : null,
      body.certification || 'uncertified',
      body.planning_use || null, imagesJson,
      body.commercial_plan || null, body.commercial_plan_doc || null, body.infra_details || null,
      body.gps_lat ? parseFloat(body.gps_lat) : null,
      body.gps_lng ? parseFloat(body.gps_lng) : null,
      body.contact_name || '', body.contact_phone || '',
      id
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
