export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/lib/db';
import { getEnv } from '@/lib/db';
import { findOrCreateSourceAccount } from '@/lib/source-account';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const recipeId = searchParams.get('recipe_id');
  const status = searchParams.get('status');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

  let sql = 'SELECT sr.*, scr.name as recipe_name FROM staging_raw sr LEFT JOIN scrapers_recipes scr ON sr.recipe_id = scr.id';
  const args: unknown[] = [];
  const conditions: string[] = [];

  if (recipeId) { conditions.push('sr.recipe_id = ?'); args.push(recipeId); }
  if (status && status !== 'all') { conditions.push('sr.status = ?'); args.push(status); }
  if (conditions.length > 0) sql += ' WHERE ' + conditions.join(' AND ');

  // Count
  const countSql = sql.replace(/SELECT sr\.\*, scr\.name as recipe_name/, 'SELECT COUNT(*) as count');
  const total = await queryOne<{ count: number }>(countSql, ...args);

  sql += ' ORDER BY sr.created_at DESC LIMIT ? OFFSET ?';
  args.push(limit, (page - 1) * limit);

  try {
    const results = await query(sql, ...args);
    return NextResponse.json({
      success: true,
      data: results,
      pagination: { page, limit, total: total?.count || 0, totalPages: Math.ceil((total?.count || 0) / limit) },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body as { action: string };

    if (action === 'stats') {
      const stats = await queryOne<{ raw: number; cleaned: number; imported: number; error: number }>(
        `SELECT
           SUM(CASE WHEN status='raw' THEN 1 ELSE 0 END) as raw,
           SUM(CASE WHEN status='cleaned' THEN 1 ELSE 0 END) as cleaned,
           SUM(CASE WHEN status='imported' THEN 1 ELSE 0 END) as imported,
           SUM(CASE WHEN status='error' THEN 1 ELSE 0 END) as error
         FROM staging_raw`
      );
      return NextResponse.json({ success: true, data: stats || { raw: 0, cleaned: 0, imported: 0, error: 0 } });
    }

    if (action === 'clean') {
      const { ids } = body as { ids: number[] };
      if (!ids || ids.length === 0) return NextResponse.json({ success: false, error: 'No IDs provided' }, { status: 400 });

      const env = getEnv();
      const apiKey = env.GEMINI_API_KEY;
      if (!apiKey) return NextResponse.json({ success: false, error: 'GEMINI_API_KEY not configured' }, { status: 500 });

      let cleaned = 0;
      let errors = 0;

      for (const id of ids) {
        try {
          const row = await queryOne<{ raw_data: string; recipe_id: number }>('SELECT raw_data, recipe_id FROM staging_raw WHERE id = ? AND status = ?', id, 'raw');
          if (!row) continue;

          const recipe = await queryOne<{ ai_prompt: string }>('SELECT ai_prompt FROM scrapers_recipes WHERE id = ?', row.recipe_id);
          const rawData = row.raw_data || '';

          const prompt = (recipe?.ai_prompt || '从以下数据中提取乡村资产信息，返回JSON：title, location, area_mu, price_year, asset_type, description, contact_name, contact_phone') + '\n\n数据：\n' + rawData.substring(0, 6000);

          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { maxOutputTokens: 2048, temperature: 0.1 },
              }),
            }
          );

          if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);

          const data = await response.json() as any;
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (!jsonMatch) throw new Error('AI返回格式异常');

          const extracted = JSON.parse(jsonMatch[0]);
          await execute('UPDATE staging_raw SET status = ?, raw_data = ? WHERE id = ?', 'cleaned', JSON.stringify(extracted), id);
          cleaned++;
        } catch (e: any) {
          await execute('UPDATE staging_raw SET status = ?, error_msg = ? WHERE id = ?', 'error', e.message || 'Unknown error', id);
          errors++;
        }
      }

      return NextResponse.json({ success: true, data: { cleaned, errors } });
    }

    if (action === 'update-data') {
      const { id, data } = body as { id: number; data: string };
      await execute('UPDATE staging_raw SET raw_data = ? WHERE id = ?', data, id);
      return NextResponse.json({ success: true });
    }

    if (action === 'import') {
      const b = body as { id: number; asset?: Record<string, unknown> | Record<string, unknown>[]; data?: string };
      let rawAsset = b.asset || JSON.parse(b.data || '{}');
      const { id } = b;
      const staging = await queryOne<{ status: string }>('SELECT status FROM staging_raw WHERE id = ?', id);
      if (!staging) return NextResponse.json({ success: false, error: 'Staging record not found' }, { status: 404 });

      // 支持单条或数组批量入库
      const assets = Array.isArray(rawAsset) ? rawAsset : [rawAsset];
      let imported = 0;

      for (const asset of assets) {
        const a = asset as Record<string, unknown>;
        if (!a.title) continue;

        // 自动匹配来源账号
        const source = await findOrCreateSourceAccount({
          province: a.province as string || undefined,
          city: a.city as string || undefined,
        });
        const userId = source?.user_id || null;
        const status = source?.auto_approve ? 'approved' : 'pending';

        await execute(
          `INSERT INTO assets (title, description, location, province, city, district, area_mu, price_year, lease_years, asset_type, source_type, source_url, contact_name, contact_phone, certification, user_id, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
          a.title || 'Untitled', a.description || null, a.location || null,
          a.province || null, a.city || null, a.district || null,
          a.area_mu || null, a.price_year || null, a.lease_years || null,
          a.asset_type || '种植', a.source_type || 'official', a.source_url || null,
          a.contact_name || null, a.contact_phone || null, a.certification || 'uncertified',
          userId, status
        );
        imported++;
      }

      await execute("UPDATE staging_raw SET status = 'imported' WHERE id = ?", id);
      return NextResponse.json({ success: true, imported });
    }

    if (action === 'delete') {
      const { ids } = body as { ids: number[] };
      if (!ids || ids.length === 0) return NextResponse.json({ success: false, error: 'No IDs' }, { status: 400 });
      for (const id of ids) {
        await execute('DELETE FROM staging_raw WHERE id = ?', id);
      }
      return NextResponse.json({ success: true });
    }

    if (action === 'retry') {
      const { id } = body as { id: number };
      await execute("UPDATE staging_raw SET status = 'raw', error_msg = NULL WHERE id = ?", id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
