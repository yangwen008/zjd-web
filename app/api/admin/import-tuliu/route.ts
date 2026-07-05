export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { execute, queryOne } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { writeAuditLog } from '@/lib/audit';

/**
 * POST /api/admin/import-tuliu
 * 导入土流网采集数据到 assets 表
 * 
 * Body: { items: Array<ImportItem> }
 * 
 * ImportItem:
 *   title, location, province, city, district,
 *   area_mu, price_year, price_total, lease_years,
 *   asset_type, source_url, images, description, contact_name
 */

interface ImportItem {
  title: string;
  location?: string;
  province?: string;
  city?: string;
  district?: string;
  area_mu?: number | null;
  price_year?: number | null;
  price_total?: number | null;
  lease_years?: number | null;
  asset_type?: string;
  source_url?: string;
  images?: string;
  description?: string;
  contact_name?: string;
}

export async function POST(request: Request) {
  try {
    const user = await requireRole(request, ['admin', 'superadmin']);
    const body = await request.json() as { items: ImportItem[] };
    
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ success: false, error: '缺少 items 数组' }, { status: 400 });
    }

    // 获取土流网来源账号
    const sourceAccount = await queryOne<{ user_id: number }>(
      `SELECT user_id FROM source_accounts WHERE name LIKE '%土流网%' AND enabled = 1 LIMIT 1`
    );
    const defaultUserId = sourceAccount?.user_id || user.id;

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const item of body.items) {
      try {
        // 去重：检查 source_url 是否已存在
        if (item.source_url) {
          const existing = await queryOne<{ id: number }>(
            'SELECT id FROM assets WHERE source_url = ?',
            item.source_url
          );
          if (existing) {
            skipped++;
            continue;
          }
        }

        // 去重：检查标题+省份是否已存在
        const titleDup = await queryOne<{ id: number }>(
          'SELECT id FROM assets WHERE title = ? AND province = ?',
          item.title, item.province || ''
        );
        if (titleDup) {
          skipped++;
          continue;
        }

        await execute(
          `INSERT INTO assets (
            title, description, location, province, city, district,
            area_mu, price_year, price_total, lease_years,
            asset_type, source_type, source_url, images,
            contact_name, status, user_id,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
          item.title,
          item.description || null,
          item.location || [item.province, item.city, item.district].filter(Boolean).join('/'),
          item.province || null,
          item.city || null,
          item.district || null,
          item.area_mu || null,
          item.price_year || null,
          item.price_total || null,
          item.lease_years || null,
          item.asset_type || '宅基地',
          'official',
          item.source_url || null,
          item.images || '[]',
          item.contact_name || null,
          'approved', // 土流网数据直接上架
          defaultUserId,
        );
        imported++;
      } catch (e: any) {
        errors.push(`${item.title}: ${e.message}`);
      }
    }

    // 审计日志
    await writeAuditLog({
      userId: user.id,
      userRole: user.role,
      action: 'import',
      module: 'scraper',
      targetType: 'tuliu_data',
      detail: `导入土流网数据: ${imported}条成功, ${skipped}条跳过, ${errors.length}条失败`,
      request,
    });

    return NextResponse.json({
      success: true,
      data: {
        total: body.items.length,
        imported,
        skipped,
        failed: errors.length,
        errors: errors.slice(0, 10), // 最多返回10条错误
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
