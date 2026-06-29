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

    const body = await request.json();
    const { target } = body as { target: string };

    // ==========================================
    // 分支 1：发布普通资产 (user / broker / village_org)
    // ==========================================
    if (target === 'asset') {
      // 1. 校验必填项
      if (!body.title || !body.province || !body.area_mu) {
        return NextResponse.json({ success: false, error: '标题、省份、面积为必填项' }, { status: 400 });
      }

      // 2. 【关键修复】：处理可选字段，将 undefined 或 空字符串 转换为 null
      const price_year = body.price_year ? parseFloat(body.price_year) : null;
      const price_total = body.price_total ? parseFloat(body.price_total) : null;
      const lease_years = body.lease_years ? parseInt(body.lease_years) : null;
      const gps_lat = body.gps_lat ? parseFloat(body.gps_lat) : null;
      const gps_lng = body.gps_lng ? parseFloat(body.gps_lng) : null;
      
      // 处理图片 (转为 JSON 字符串)
      let imagesJson = '[]';
      if (body.images) {
        const urls = body.images.split(',').filter((u: string) => u.trim() !== '');
        imagesJson = JSON.stringify(urls);
      }
      
      // 处理视频 (取第一个)
      let video_url = null;
      if (body.videos) {
        const videos = body.videos.split(',').filter((v: string) => v.trim() !== '');
        video_url = videos[0] || null;
      }

      // 3. 执行插入 (所有可选字段都确保是 null 而不是 undefined)
      await execute(
        `INSERT INTO assets 
        (title, description, province, city, area_mu, price_year, price_total, lease_years, 
         asset_type, source_type, images, video_url, gps_lat, gps_lng, contact_name, contact_phone, 
         user_id, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'), datetime('now'))`,
        body.title,
        body.description || '',
        body.province,
        body.city || '',
        parseFloat(body.area_mu),
        price_year,        // ✅ 这里传的是 null 而不是 undefined
        price_total,       // ✅ 这里传的是 null 而不是 undefined
        lease_years,       // ✅ 这里传的是 null 而不是 undefined
        body.asset_type || '宅基地',
        'ugc',
        imagesJson,
        video_url,
        gps_lat,           // ✅ 这里传的是 null 而不是 undefined
        gps_lng,           // ✅ 这里传的是 null 而不是 undefined
        body.contact_name || '',
        body.contact_phone || '',
        user.id,
      );

      return NextResponse.json({ success: true, message: '发布成功，等待审核' });
    }

    return NextResponse.json({ success: false, error: '未知的发布类型' }, { status: 400 });

  } catch (error: any) {
    console.error('Publish error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
