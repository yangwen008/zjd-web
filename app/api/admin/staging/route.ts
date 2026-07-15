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

        // 处理采集到的图片：下载并上传到 R2
        let imagesJson = '[]';
        const rawImages = a._images as string[] | undefined;
        if (rawImages && rawImages.length > 0) {
          const uploadedUrls: string[] = [];
          for (const imgUrl of rawImages.slice(0, 8)) {
            try {
              const imgRes = await fetch(imgUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://www.cdaee.com/' },
                signal: AbortSignal.timeout(8000),
              });
              if (imgRes.ok) {
                const ct = imgRes.headers.get('content-type') || '';
                if (ct.startsWith('image/')) {
                  const buffer = await imgRes.arrayBuffer();
                  if (buffer.byteLength < 5 * 1024 * 1024) {
                    const ext = ct.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
                    const key = `scraped/${Date.now()}-${Math.random().toString(36).substring(2, 6)}.${ext}`;
                    const env = getEnv();
                    await env.R2.put(key, buffer, { httpMetadata: { contentType: ct } });
                    uploadedUrls.push(`/api/images/${key}`);
                  }
                }
              }
            } catch { /* 单张图片失败不影响整体 */ }
          }
          if (uploadedUrls.length > 0) imagesJson = JSON.stringify(uploadedUrls);
        }

        await execute(
          `INSERT INTO assets (title, description, location, province, city, district, area_mu, price_year, lease_years, asset_type, source_type, source_url, images, contact_name, contact_phone, certification, user_id, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
          a.title || 'Untitled', a.description || null, a.location || null,
          a.province || null, a.city || null, a.district || null,
          a.area_mu || null, a.price_year || null, a.lease_years || null,
          a.asset_type || '种植', a.source_type || 'official', a.source_url || null,
          imagesJson,
          a.contact_name || null, a.contact_phone || null, a.certification || 'uncertified',
          userId, status
        );
        imported++;
      }

      await execute("UPDATE staging_raw SET status = 'imported' WHERE id = ?", id);
      return NextResponse.json({ success: true, imported });
    }

    if (action === 'ai-rename') {
      // AI 批量重写标题
      const { ids } = body as { ids: number[] };
      if (!ids || ids.length === 0) return NextResponse.json({ success: false, error: '缺少ids' }, { status: 400 });

      const env = getEnv();
      const apiKey = env.GEMINI_API_KEY;
      if (!apiKey) return NextResponse.json({ success: false, error: 'GEMINI_API_KEY 未配置' }, { status: 500 });

      // 读取暂存记录
      const records = await query<{ id: number; raw_data: string }>(
        `SELECT id, raw_data FROM staging_raw WHERE id IN (${ids.map(() => '?').join(',')})`,
        ...ids
      );

      let renamed = 0;
      let errors = 0;

      // 按批次处理（每批最多20条）
      for (let i = 0; i < records.length; i += 20) {
        const batch = records.slice(i, i + 20);
        const items: { id: number; idx: number; title: string; location: string; area_mu: number | null; asset_type: string; description: string }[] = [];

        for (const record of batch) {
          try {
            const data = JSON.parse(record.raw_data);
            const arr = Array.isArray(data) ? data : [data];
            for (let j = 0; j < arr.length; j++) {
              const a = arr[j];
              if (a.title) {
                items.push({
                  id: record.id,
                  idx: j,
                  title: a.title,
                  location: a.location || '',
                  area_mu: a.area_mu || null,
                  asset_type: a.asset_type || '',
                  description: (a.description || '').substring(0, 150),
                });
              }
            }
          } catch { /* 跳过解析失败的 */ }
        }

        if (items.length === 0) continue;

        // 构建 prompt
        const lines = items.map((item, idx) =>
          `[${idx}] 标题: ${item.title}\n    地点: ${item.location}\n    面积: ${item.area_mu || '-'}亩 | 类型: ${item.asset_type}\n    内容: ${item.description}`
        ).join('\n\n');

        const prompt = `你是乡村资产标题优化专家。请根据以下资产信息，为每条资产重新生成一个简洁、有吸引力的标题。

要求：
1. 标题要包含地点+资产类型+核心亮点
2. 长度控制在15-30字
3. 保留关键数据（面积、价格等）
4. 去掉"公告"、"项目"、"流转"等冗余后缀
5. 风格：专业但不枯燥

请严格按格式返回，每行一条：
[序号] 新标题

资产列表：
${lines}`;

        try {
          const aiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { maxOutputTokens: 2048, temperature: 0.3 },
              }),
            }
          );

          if (!aiRes.ok) { errors += items.length; continue; }

          const aiData = await aiRes.json() as any;
          const text = aiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

          // 解析新标题
          const titleMap = new Map<number, string>();
          const matches = text.matchAll(/\[(\d+)\]\s*(.+)/g);
          for (const m of matches) {
            const idx = parseInt(m[1]);
            const newTitle = m[2].trim();
            if (idx >= 0 && idx < items.length && newTitle) {
              titleMap.set(idx, newTitle);
            }
          }

          // 回写到暂存记录
          const recordUpdates = new Map<number, string>(); // recordId -> updated raw_data
          for (const [idx, newTitle] of titleMap) {
            const item = items[idx];
            if (!recordUpdates.has(item.id)) {
              const record = batch.find(r => r.id === item.id);
              if (record) recordUpdates.set(item.id, record.raw_data);
            }
            const rawData = recordUpdates.get(item.id);
            if (rawData) {
              const data = JSON.parse(rawData);
              const arr = Array.isArray(data) ? data : [data];
              if (arr[item.idx]) {
                arr[item.idx]._originalTitle = arr[item.idx].title;
                arr[item.idx].title = newTitle;
                renamed++;
              }
              recordUpdates.set(item.id, JSON.stringify(arr));
            }
          }

          // 批量更新数据库
          for (const [recordId, newData] of recordUpdates) {
            await execute('UPDATE staging_raw SET raw_data = ? WHERE id = ?', newData, recordId);
          }
        } catch {
          errors += items.length;
        }
      }

      return NextResponse.json({ success: true, data: { renamed, errors, total: records.length } });
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
