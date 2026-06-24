import { NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';

// GET /api/scrape/recipes - 获取所有启用的配方
export async function GET(request: Request) {
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

  // 默认返回所有配方
  try {
    const results = await query('SELECT * FROM scrapers_recipes ORDER BY created_at DESC');
    return NextResponse.json({ success: true, recipes: results });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

// POST /api/scrape - 新增配方 / 更新状态 / 保存原始数据
export async function POST(request: Request) {
  try {
    const body: any = await request.json();
    const { action } = body;

    if (action === 'add-recipe') {
      await execute(
        `INSERT INTO scrapers_recipes (name, base_url, list_url, selectors, detail_selectors, ai_prompt, max_pages, pagination_type)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        body.name, body.base_url, body.list_url,
        JSON.stringify(body.selectors || {}),
        body.detail_selectors ? JSON.stringify(body.detail_selectors) : null,
        body.ai_prompt || null,
        body.max_pages || 10,
        body.pagination_type || 'url'
      );
      return NextResponse.json({ success: true });
    }

    if (action === 'update-status') {
      await execute(
        'UPDATE scrapers_recipes SET last_run_status = ?, last_run_at = datetime("now") WHERE id = ?',
        body.status, body.recipeId
      );
      return NextResponse.json({ success: true });
    }

    if (action === 'save-raw') {
      await execute(
        'INSERT INTO staging_raw (recipe_id, raw_data, status) VALUES (?, ?, ?)',
        body.recipeId, JSON.stringify(body.rawData), 'raw'
      );
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
