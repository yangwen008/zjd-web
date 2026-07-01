export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
    }

    // ✅ 修复点：加上 : any，解决 TypeScript 类型报错
    const body: any = await request.json();
    const { target } = body as { target: string };

    // ==========================================
    // 分支 1：发布普通资产 (user / broker / village_org)
    // ==========================================
    if (target === 'asset') {
      // 1. 校验必填项
      if (!body.title || !body.province || !body.area_mu) {
        return NextResponse.json({ success: false, error: '标题、省份、面积为必填项' }, { status: 400 });
      }

      // 2. 处理可选字段，undefined/空字符串 → null
      const price_year = body.price_year ? parseFloat(body.price_year) : null;
      const price_total = body.price_total ? parseFloat(body.price_total) : null;
      const lease_years = body.lease_years ? parseInt(body.lease_years) : null;
      const gps_lat = body.gps_lat ? parseFloat(body.gps_lat) : null;
      const gps_lng = body.gps_lng ? parseFloat(body.gps_lng) : null;

      // 3. 拼接 location 字段（省+市+区+详细地址）
      const location = [body.province, body.city, body.district, body.address].filter(Boolean).join('');

      // 4. 处理图片（兼容 JSON 数组和逗号分隔字符串）
      let imagesJson = '[]';
      if (body.images) {
        if (typeof body.images === 'string' && body.images.startsWith('[')) {
          imagesJson = body.images; // 已经是 JSON 数组
        } else if (typeof body.images === 'string') {
          const urls = body.images.split(',').filter((u: string) => u.trim() !== '');
          imagesJson = JSON.stringify(urls);
        }
      }

      // 5. 视频URL
      const video_url = body.video_url || null;

      // 5.5 基建详情JSON
      const infra_details = body.infra_details || null;

      // 6. source_type 按角色动态设置
      let sourceType = 'ugc';
      if (user.role === 'admin' || user.role === 'superadmin') {
        sourceType = body.source_type || 'official';
      } else if (user.role === 'village_org') {
        sourceType = 'village';
      }

      // 7. 执行插入
      await execute(
        `INSERT INTO assets
        (title, description, location, province, city, district, address, area_mu, price_year, price_total, lease_years,
         asset_type, source_type, images, video_url, infra_details, gps_lat, gps_lng, contact_name, contact_phone,
         user_id, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'), datetime('now'))`,
        body.title,
        body.description || '',
        location,
        body.province,
        body.city || '',
        body.district || '',
        body.address || '',
        parseFloat(body.area_mu),
        price_year,
        price_total,
        lease_years,
        body.asset_type || '宅基地',
        sourceType,
        imagesJson,
        video_url,
        infra_details,
        gps_lat,
        gps_lng,
        body.contact_name || '',
        body.contact_phone || '',
        user.id,
      );

      return NextResponse.json({ success: true, message: '发布成功，等待审核' });
    }

    // ==========================================
    // 分支 2：发布大宗路演项目 (project_publisher / admin / superadmin)
    // ==========================================
    if (target === 'bulk_project') {
      // 权限校验
      const allowedRoles = ['project_publisher', 'admin', 'superadmin'];
      if (!allowedRoles.includes(user.role)) {
        return NextResponse.json({ success: false, error: '无权发布大宗项目' }, { status: 403 });
      }

      if (!body.title || !body.province) {
        return NextResponse.json({ success: false, error: '标题和省份为必填项' }, { status: 400 });
      }

      const location = [body.province, body.city, body.district, body.location].filter(Boolean).join('');

      let imagesJson = '[]';
      if (body.images) {
        if (typeof body.images === 'string' && body.images.startsWith('[')) {
          imagesJson = body.images;
        } else if (typeof body.images === 'string') {
          const urls = body.images.split(',').filter((u: string) => u.trim() !== '');
          imagesJson = JSON.stringify(urls);
        }
      }

      await execute(
        `INSERT INTO bulk_projects
        (title, code, description, location, province, city, district, area_mu, area_sqm, price_total, price_start,
         yield_rate, lease_years, certification, planning_use, images, commercial_plan, gps_lat, gps_lng,
         contact_name, contact_phone, user_id, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'), datetime('now'))`,
        body.title,
        body.code || null,
        body.description || '',
        location,
        body.province,
        body.city || '',
        body.district || '',
        body.area_mu ? parseFloat(body.area_mu) : null,
        body.area_sqm ? parseFloat(body.area_sqm) : null,
        body.price_total ? parseFloat(body.price_total) : null,
        body.price_start ? parseFloat(body.price_start) : null,
        body.yield_rate ? parseFloat(body.yield_rate) : null,
        body.lease_years ? parseInt(body.lease_years) : null,
        body.certification || 'uncertified',
        body.planning_use || null,
        imagesJson,
        body.commercial_plan || null,
        body.gps_lat ? parseFloat(body.gps_lat) : null,
        body.gps_lng ? parseFloat(body.gps_lng) : null,
        body.contact_name || '',
        body.contact_phone || '',
        user.id,
      );

      return NextResponse.json({ success: true, message: '大宗项目发布成功，等待审核' });
    }

    return NextResponse.json({ success: false, error: '未知的发布类型' }, { status: 400 });

  } catch (error: any) {
    console.error('Publish error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
