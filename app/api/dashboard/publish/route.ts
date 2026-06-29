export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/lib/db';
import { checkDailyQuota, checkGPSDuplicate, encryptData } from '@/lib/utils';
import { cookies } from 'next/headers';

// 辅助函数：从 Cookie 获取当前登录用户
async function getCurrentUser(request: Request) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('user_session')?.value;
  if (!sessionId) return null;

  const session = await queryOne<{ user_id: number; expires_at: string }>(
    'SELECT user_id, expires_at FROM user_sessions WHERE id = ?', sessionId
  );
  if (!session || new Date(session.expires_at) < new Date()) return null;

  const user = await queryOne<{ id: number; role: string; status: string; daily_quota: number }>(
    'SELECT id, role, status, daily_quota FROM users WHERE id = ?', session.user_id
  );
  if (!user || user.status !== 'active') return null;
  
  return user;
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return NextResponse.json({ success: false, error: '未登录或登录已过期' }, { status: 401 });

    const body: any = await request.json();
    const { target } = body as { target: string };

    // ==========================================
    // 分支 1：发布普通资产 (user / broker / village_org)
    // ==========================================
    if (target === 'asset') {
      // 1. 校验每日配额
      const hasQuota = await checkDailyQuota(user.id, user.daily_quota || 3);
      if (!hasQuota) return NextResponse.json({ success: false, error: `今日发布次数已达上限 (${user.daily_quota}次)` }, { status: 429 });

      // 2. 校验 GPS 去重 (如果有经纬度)
      if (body.gps_lat && body.gps_lng) {
        const isDup = await checkGPSDuplicate(parseFloat(body.gps_lat), parseFloat(body.gps_lng), 0.5);
        if (isDup) return NextResponse.json({ success: false, error: '0.5公里内已有相似资产，请勿重复发布' }, { status: 400 });
      }

      // 3. 角色权限与字段校验
      let sourceType = 'ugc';
      if (user.role === 'village_org') {
        if (!body.org_license) return NextResponse.json({ success: false, error: '村集体发布必须上传授权书' }, { status: 400 });
        sourceType = 'village';
      } else if (user.role !== 'user' && user.role !== 'broker' && user.role !== 'admin') {
        return NextResponse.json({ success: false, error: '无权发布此类资产' }, { status: 403 });
      }

      // 4. 加密联系电话
      let encryptedPhone = body.contact_phone;
      if (body.contact_phone) {
        encryptedPhone = await encryptData(body.contact_phone, process.env.SIGNING_SECRET || 'default_secret');
      }

      // 5. 处理图片 JSON
      let imagesJson = '[]';
      if (body.images) {
        const urls = body.images.split(',').map((s: string) => s.trim()).filter(Boolean);
        imagesJson = JSON.stringify(urls);
      }

      // 6. 写入 assets 表
      await execute(
        `INSERT INTO assets (title, description, province, city, area_mu, price_year, price_total, lease_years, asset_type, source_type, images, gps_lat, gps_lng, contact_name, contact_phone, user_id, status, org_name, org_license)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
        body.title, body.description, body.province, body.city, body.area_mu, body.price_year, body.price_total, 
        body.lease_years, body.asset_type, sourceType, imagesJson, body.gps_lat, body.gps_lng, 
        body.contact_name, encryptedPhone, user.id, body.org_name, body.org_license
      );

      return NextResponse.json({ success: true, message: '资产发布成功，等待审核' });
    }

    // ==========================================
    // 分支 2：发布大宗路演项目 (project_publisher / admin)
    // ==========================================
    if (target === 'bulk') {
      if (!['project_publisher', 'admin', 'superadmin'].includes(user.role)) {
        return NextResponse.json({ success: false, error: '无权发布大宗项目' }, { status: 403 });
      }

      await execute(
        `INSERT INTO bulk_projects (title, description, province, city, area_mu, price_total, yield_rate, lease_years, commercial_plan, user_id, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
        body.title, body.description, body.province, body.city, body.area_mu, body.price_total, 
        body.yield_rate, body.lease_years, body.commercial_plan, user.id
      );

      return NextResponse.json({ success: true, message: '大宗项目发布成功，等待审核' });
    }

    return NextResponse.json({ success: false, error: '未知的发布目标' }, { status: 400 });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
