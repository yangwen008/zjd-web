export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/lib/db';

// 简单鉴权：检查 Bearer token 或 admin cookie
function isAuthorized(request: Request): boolean {
  // 检查 admin cookie
  const cookie = request.headers.get('cookie') || '';
  if (cookie.includes('admin_token=')) return true;
  // 检查 Bearer token（GitHub Actions 调用）
  const auth = request.headers.get('authorization') || '';
  if (auth.startsWith('Bearer ')) return true;
  return false;
}

// GET /api/scrape
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path');

  if (path === 'recipes') {
    try {
      const results = await query('SELECT * FROM scrapers_recipes WHERE enabled = 1');
      return NextResponse.json({ success: true, recipes: results });
    } catch (error) {
      return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
  }

  try {
    const results = await query('SELECT * FROM scrapers_recipes ORDER BY created_at DESC');
    return NextResponse.json({ success: true, recipes: results });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

// POST /api/scrape
export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body: any = await request.json();
    const { action } = body;

    if (action === 'add-recipe') {
      // 新增或更新配方
      if (body.id) {
        // 更新已有配方
        await execute(
          `UPDATE scrapers_recipes SET name=?, base_url=?, list_url=?, selectors=?, detail_selectors=?,
           ai_prompt=?, max_pages=?, pagination_type=?, schedule_cron=?, enabled=?, proxy_enabled=?, updated_at=datetime('now')
           WHERE id=?`,
          body.name, body.base_url, body.list_url,
          JSON.stringify(body.selectors || {}),
          body.detail_selectors ? JSON.stringify(body.detail_selectors) : null,
          body.ai_prompt || null,
          body.max_pages || 10,
          body.pagination_type || 'url',
          body.schedule_cron || '0 3 * * *',
          body.enabled !== false ? 1 : 0,
          body.proxy_enabled ? 1 : 0,
          body.id
        );
      } else {
        // 新增配方
        await execute(
          `INSERT INTO scrapers_recipes (name, base_url, list_url, selectors, detail_selectors, ai_prompt, max_pages, pagination_type, schedule_cron, enabled, proxy_enabled)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          body.name, body.base_url, body.list_url,
          JSON.stringify(body.selectors || {}),
          body.detail_selectors ? JSON.stringify(body.detail_selectors) : null,
          body.ai_prompt || null,
          body.max_pages || 10,
          body.pagination_type || 'url',
          body.schedule_cron || '0 3 * * *',
          body.enabled !== false ? 1 : 0,
          body.proxy_enabled ? 1 : 0
        );
      }
      return NextResponse.json({ success: true });
    }

    if (action === 'update-status') {
      await execute(
        'UPDATE scrapers_recipes SET last_run_status = ?, last_run_at = datetime("now") WHERE id = ?',
        body.status, body.recipeId
      );
      return NextResponse.json({ success: true });
    }

    if (action === 'toggle-enabled') {
      await execute(
        'UPDATE scrapers_recipes SET enabled = ?, updated_at = datetime("now") WHERE id = ?',
        body.enabled ? 1 : 0, body.recipeId
      );
      return NextResponse.json({ success: true });
    }

    if (action === 'save-raw') {
      // 保存原始数据（带去重：同一 recipe 的相同数据不重复插入）
      const rawDataStr = JSON.stringify(body.rawData);
      const existing = await queryOne<{ id: number }>(
        'SELECT id FROM staging_raw WHERE recipe_id = ? AND raw_data = ? LIMIT 1',
        body.recipeId, rawDataStr
      );
      if (existing) {
        return NextResponse.json({ success: true, skipped: true, message: 'Data already exists' });
      }
      await execute(
        'INSERT INTO staging_raw (recipe_id, raw_data, status) VALUES (?, ?, ?)',
        body.recipeId, rawDataStr, 'raw'
      );
      return NextResponse.json({ success: true });
    }

    if (action === 'delete-recipe') {
      await execute('DELETE FROM scrapers_recipes WHERE id = ?', body.recipeId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
