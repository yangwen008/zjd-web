export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { execute, queryOne, query } from '@/lib/db';

const CDAEE_API = 'https://www.cdaee.com/inteligentsearch_new/rest/esinteligentsearch/getFullTextDataNew';
const DETAIL_BASE = 'https://www.cdaee.com';
const PAGE_SIZE = 20;

// 资源分类号
const CATEGORY_NUM = '018003001';

async function fetchPage(pageNum: number, pageSize: number) {
  const param = {
    token: '', pn: pageNum * pageSize, rn: pageSize,
    sdt: '', edt: '', wd: '', inc_wd: '', exc_wd: '', fields: '',
    cnum: '001',
    sort: '{"webdate":"0","id":"0"}',
    cl: 500, terminal: '',
    condition: [{
      fieldName: 'categorynum', equal: CATEGORY_NUM,
      notEqual: null, equalList: null,
      notEqualList: ['018003001007', '018003001010'],
      isLike: true, likeType: 2,
    }],
    time: [], highlights: '', statistics: null, unionCondition: null,
    accuracy: '', noParticiple: '1', searchRange: [], noWd: true,
  };

  const res = await fetch(CDAEE_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Referer': 'https://www.cdaee.com/nccq/jyxx/018003/resource_assets.html',
      'Origin': 'https://www.cdaee.com',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
    body: JSON.stringify(param),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json() as any;
  if (data.error) throw new Error(data.error);
  return data.result;
}

function parseAddress(xmdz: string) {
  if (!xmdz) return { province: '', city: '', district: '' };
  const parts = xmdz.split('/').map(s => s.trim());
  return { province: parts[0] || '', city: parts[1] || '', district: parts[2] || '' };
}

function transformRecord(record: any) {
  const addr = parseAddress(record.xmdz);

  let priceYear = null;
  if (record.gpjg && parseFloat(record.gpjg) > 0) {
    const price = parseFloat(record.gpjg);
    const unit = record.gpjgdw || '';
    if (unit.includes('万元')) { priceYear = price; }
    else if (unit.includes('元/亩')) {
      const area = parseFloat(record.tdmj) || 1;
      priceYear = Math.round((price * area) / 10000 * 100) / 100;
    } else { priceYear = Math.round(price / 10000 * 100) / 100; }
  }

  let leaseYears = null;
  if (record.zcqx && parseInt(record.zcqx) > 0) leaseYears = parseInt(record.zcqx);
  else if (record.zcqxmonth && parseInt(record.zcqxmonth) > 0) leaseYears = Math.round(parseInt(record.zcqxmonth) / 12);

  let assetType = '种植';
  const title = (record.customtitle || record.title || '').toLowerCase();
  if (title.includes('宅基地') || title.includes('住房') || title.includes('农房')) assetType = '宅基地';
  else if (title.includes('林地') || title.includes('林木')) assetType = '林地';
  else if (title.includes('茶园') || title.includes('茶山')) assetType = '茶园';
  else if (title.includes('古宅') || title.includes('老宅')) assetType = '古宅';
  else if (title.includes('厂房') || title.includes('加工房')) assetType = '厂房';
  else if (title.includes('商铺') || title.includes('商业')) assetType = '商铺';
  else if (title.includes('民宿')) assetType = '民宿群';
  else if (title.includes('果园')) assetType = '果园';
  else if (title.includes('土地') || title.includes('耕地') || title.includes('农田')) assetType = '种植';

  return {
    title: record.customtitle || record.title || 'Untitled',
    description: (record.content || '').substring(0, 500).trim(),
    location: record.xmdz ? record.xmdz.replace(/\//g, ' ') : '',
    province: addr.province, city: addr.city, district: addr.district,
    area_mu: parseFloat(record.tdmj) || null,
    price_year: priceYear, lease_years: leaseYears,
    asset_type: assetType, source_type: 'official',
    source_url: record.linkurl ? `${DETAIL_BASE}${record.linkurl}` : '',
    contact_name: null, contact_phone: null, certification: 'uncertified',
  };
}

// POST /api/scrape/run — 直接运行采集（无需 GitHub Actions）
export async function POST(request: Request) {
  try {
    const { recipeId, pages = 1 } = await request.json() as { recipeId?: number; pages?: number };
    const maxPages = Math.min(pages || 1, 5);

    // 查找配方（如果指定了）
    let recipeName = '系统内置采集器';
    if (recipeId) {
      const recipe = await queryOne<{ name: string }>('SELECT name FROM scrapers_recipes WHERE id = ?', recipeId);
      if (recipe) recipeName = recipe.name;
    }

    // 获取或创建系统配方 ID
    let sysRecipe = await queryOne<{ id: number }>(
      "SELECT id FROM scrapers_recipes WHERE name = '系统内置采集器' LIMIT 1"
    );
    if (!sysRecipe) {
      const result = await execute(
        `INSERT INTO scrapers_recipes (name, base_url, list_url, selectors, enabled, max_pages, pagination_type, schedule_cron)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        '系统内置采集器', 'https://www.cdaee.com', 'https://www.cdaee.com/inteligentsearch_new',
        '{}', 1, 10, 'api', '0 3 * * *'
      );
      sysRecipe = { id: result.meta?.last_row_id || 0 };
    }

    // 更新配方状态为运行中
    await execute(
      'UPDATE scrapers_recipes SET last_run_status = ?, last_run_at = datetime("now") WHERE id = ?',
      'running', sysRecipe.id
    );

    let totalItems = 0;
    let errors = 0;

    for (let page = 0; page < maxPages; page++) {
      try {
        const result = await fetchPage(page, PAGE_SIZE);
        const records = result.records || [];
        const items = records.map(transformRecord);

        if (items.length > 0) {
          await execute(
            'INSERT INTO staging_raw (recipe_id, raw_data, status) VALUES (?, ?, ?)',
            sysRecipe.id, JSON.stringify(items), 'raw'
          );
          totalItems += items.length;
        }

        // 间隔
        if (page < maxPages - 1) {
          await new Promise(r => setTimeout(r, 500));
        }
      } catch (e: any) {
        errors++;
        console.error(`Page ${page + 1} failed:`, e.message);
      }
    }

    // 更新配方状态
    await execute(
      'UPDATE scrapers_recipes SET last_run_status = ? WHERE id = ?',
      errors > 0 ? 'failed' : 'success', sysRecipe.id
    );

    return NextResponse.json({
      success: true,
      itemCount: totalItems,
      errors,
      message: `采集完成，${totalItems} 条数据已保存到暂存区`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || String(error) }, { status: 500 });
  }
}
