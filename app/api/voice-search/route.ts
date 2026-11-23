export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// ============ 小程序语音搜索 ============
// POST { text: string, province?: string, city?: string }
// GET  ?text=xxx
// 返回 { success, data: { reply: string, assets: [...] } }
//
// 规则解析自然语言（省份/类型/价格/面积），D1 检索，生成语音式回复。
// 不依赖 AI，零成本、低延迟；后续可平滑升级为 Gemini 意图解析。

interface ParsedQuery {
  province?: string;
  city?: string;
  types: string[];
  priceMin?: number;
  priceMax?: number;
  areaMin?: number;
  areaMax?: number;
  tokens: string[];
}

interface RegionRow {
  name: string;
  level: string;
  province: string | null;
  city: string | null;
}

// 内置资产类型兜底（asset_types 表为空时使用）
const BUILTIN_TYPES = [
  '宅基地', '林地', '耕地', '茶园', '果园', '鱼塘', '厂房', '古宅',
  '民宿', '仓库', '荒地', '草地', '养殖场', '加工厂', '商铺', '住宅',
];

// 中文数字映射（语音转写中少量出现）
const CN_NUM: Record<string, number> = {
  '零': 0, '一': 1, '二': 2, '两': 2, '三': 3, '四': 4, '五': 5,
  '六': 6, '七': 7, '八': 8, '九': 9, '十': 10, '半': 0.5,
};

function parseNum(s: string): number | null {
  if (!s) return null;
  if (/^\d+(\.\d+)?$/.test(s)) return parseFloat(s);
  // 简单中文数字：十、十五、二十、二十三、半
  if (s === '半') return 0.5;
  if (s === '十') return 10;
  const m = s.match(/^([零一二两三四五六七八九])?十([零一二三四五六七八九])?$/);
  if (m) {
    const tens = m[1] ? CN_NUM[m[1]] : 1;
    const ones = m[2] ? CN_NUM[m[2]] : 0;
    return tens * 10 + ones;
  }
  if (s in CN_NUM) return CN_NUM[s];
  return null;
}

// 省市名称后缀（用于简称匹配："四川"能命中"四川省"）
const REGION_SUFFIX_RE = /(维吾尔自治区|壮族自治区|回族自治区|特别行政区|自治区|省|市)$/;

function regionShortName(name: string): string {
  return name.replace(REGION_SUFFIX_RE, '');
}

async function loadRegions(): Promise<RegionRow[]> {
  try {
    return await query<RegionRow>(
      "SELECT name, level, province, city FROM regions WHERE active = 1 AND level IN ('province','city')"
    );
  } catch {
    return [];
  }
}

async function loadAssetTypes(): Promise<string[]> {
  try {
    const rows = await query<{ name: string }>('SELECT name FROM asset_types WHERE active = 1');
    if (rows.length > 0) return rows.map(r => r.name);
  } catch {}
  return BUILTIN_TYPES;
}

async function parseText(raw: string): Promise<ParsedQuery> {
  let text = raw.trim();
  const result: ParsedQuery = { types: [], tokens: [] };

  // ---- 1. 地名匹配（长名优先，先市后省，避免"吉林省"被"吉林"抢） ----
  const regions = await loadRegions();
  regions.sort((a, b) => b.name.length - a.name.length);
  for (const r of regions) {
    if (r.name.length < 2) continue;
    const shortName = regionShortName(r.name);
    const hitShort = shortName.length >= 2 && shortName !== r.name && text.includes(shortName);
    if (text.includes(r.name) || hitShort) {
      if (r.level === 'city' && !result.city) {
        result.city = r.name;
        result.province = r.province || result.province;
      } else if (r.level === 'province' && !result.province) {
        result.province = r.name;
      }
      text = text.split(r.name).join(' ');
      if (hitShort) text = text.split(shortName).join(' ');
    }
    if (result.province && result.city) break;
  }

  // ---- 2. 资产类型匹配 ----
  const types = await loadAssetTypes();
  for (const t of types) {
    if (t.length >= 2 && text.includes(t)) {
      if (!result.types.includes(t)) result.types.push(t);
      text = text.split(t).join(' ');
    }
  }

  // ---- 3. 价格（万元/年） ----
  const priceRange = text.match(/(\d+(?:\.\d+)?|[零一二两三四五六七八九十半]+)\s*万?\s*[-~到至]\s*(\d+(?:\.\d+)?|[零一二两三四五六七八九十半]+)\s*万/);
  const priceBelow = text.match(/(\d+(?:\.\d+)?|[零一二两三四五六七八九十半]+)\s*万\s*(?:以内|以下|之内|内)/);
  const priceAbove = text.match(/(\d+(?:\.\d+)?|[零一二两三四五六七八九十半]+)\s*万\s*(?:以上|起|多)/);
  const priceCmp = text.match(/(?:不超过|低于|小于)\s*(\d+(?:\.\d+)?)\s*万/);
  if (priceRange) {
    result.priceMin = parseNum(priceRange[1]) ?? undefined;
    result.priceMax = parseNum(priceRange[2]) ?? undefined;
    text = text.replace(priceRange[0], ' ');
  } else if (priceBelow) {
    result.priceMax = parseNum(priceBelow[1]) ?? undefined;
    text = text.replace(priceBelow[0], ' ');
  } else if (priceAbove) {
    result.priceMin = parseNum(priceAbove[1]) ?? undefined;
    text = text.replace(priceAbove[0], ' ');
  } else if (priceCmp) {
    result.priceMax = parseNum(priceCmp[1]) ?? undefined;
    text = text.replace(priceCmp[0], ' ');
  }

  // ---- 4. 面积（亩） ----
  const areaRange = text.match(/(\d+(?:\.\d+)?|[零一二两三四五六七八九十半]+)\s*亩?\s*[-~到至]\s*(\d+(?:\.\d+)?|[零一二两三四五六七八九十半]+)\s*亩/);
  const areaAbove = text.match(/(\d+(?:\.\d+)?|[零一二两三四五六七八九十半]+)\s*亩\s*(?:以上|起|多)/);
  const areaBelow = text.match(/(\d+(?:\.\d+)?|[零一二两三四五六七八九十半]+)\s*亩\s*(?:以内|以下|之内|内)/);
  if (areaRange) {
    result.areaMin = parseNum(areaRange[1]) ?? undefined;
    result.areaMax = parseNum(areaRange[2]) ?? undefined;
    text = text.replace(areaRange[0], ' ');
  } else if (areaAbove) {
    result.areaMin = parseNum(areaAbove[1]) ?? undefined;
    text = text.replace(areaAbove[0], ' ');
  } else if (areaBelow) {
    result.areaMax = parseNum(areaBelow[1]) ?? undefined;
    text = text.replace(areaBelow[0], ' ');
  }

  // ---- 5. 剩余文本切关键词 ----
  result.tokens = text
    .split(/[\s,，、;；。.!?？！:：]+/)
    .map(t => t.trim())
    .filter(t => t.length >= 1);

  return result;
}

function buildReply(pq: ParsedQuery, count: number, rows: Array<{ price_year: number | null; area_mu: number | null }>): string {
  if (count === 0) {
    return '暂时没找到符合条件的资产，换个说法试试？比如：「四川 茶园 10亩以上 3万以内」';
  }

  const parts: string[] = [];
  const where = [pq.province, pq.city].filter(Boolean).join('');
  const typeStr = pq.types.length > 0 ? pq.types.join('/') : '';

  let head = '为您找到 ' + count + ' 宗';
  if (where) head += where;
  if (typeStr) head += typeStr;
  head += '资产';
  parts.push(head);

  const prices = rows.map(r => r.price_year).filter((v): v is number => v != null && v > 0);
  if (prices.length > 0) {
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    parts.push(min === max ? `年租金 ${min} 万` : `年租金 ${min}~${max} 万`);
  }

  const areas = rows.map(r => r.area_mu).filter((v): v is number => v != null && v > 0);
  if (areas.length > 0 && areas.length <= count) {
    const min = Math.min(...areas);
    const max = Math.max(...areas);
    parts.push(min === max ? `面积 ${min} 亩` : `面积 ${min}~${max} 亩`);
  }

  parts.push('看看下面有没有合适的 👇');
  return parts.join('，');
}

async function doSearch(rawText: string, provinceOverride?: string, cityOverride?: string) {
  const pq = await parseText(rawText);
  if (provinceOverride && !pq.province) pq.province = provinceOverride;
  if (cityOverride && !pq.city) pq.city = cityOverride;

  const where: string[] = ["status = 'approved'"];
  const args: unknown[] = [];

  if (pq.province) {
    where.push('province = ?');
    args.push(pq.province);
  }
  if (pq.city) {
    where.push('city = ?');
    args.push(pq.city);
  }
  if (pq.types.length > 0) {
    where.push('(' + pq.types.map(() => 'asset_type LIKE ?').join(' OR ') + ')');
    pq.types.forEach(t => args.push(`%${t}%`));
  }
  if (pq.priceMax != null) {
    where.push('price_year IS NOT NULL AND price_year <= ?');
    args.push(pq.priceMax);
  }
  if (pq.priceMin != null) {
    where.push('price_year IS NOT NULL AND price_year >= ?');
    args.push(pq.priceMin);
  }
  if (pq.areaMin != null) {
    where.push('area_mu IS NOT NULL AND area_mu >= ?');
    args.push(pq.areaMin);
  }
  if (pq.areaMax != null) {
    where.push('area_mu IS NOT NULL AND area_mu <= ?');
    args.push(pq.areaMax);
  }
  for (const token of pq.tokens) {
    where.push('(title LIKE ? OR description LIKE ? OR location LIKE ? OR asset_type LIKE ? OR address LIKE ?)');
    args.push(`%${token}%`, `%${token}%`, `%${token}%`, `%${token}%`, `%${token}%`);
  }

  const rows = await query<any>(
    `SELECT id, title, images, price_year, price_total, province, city, district, location, area_mu, asset_type, views
     FROM assets
     WHERE ${where.join(' AND ')}
     ORDER BY featured DESC, views DESC
     LIMIT 10`,
    ...args
  );

  return {
    reply: buildReply(pq, rows.length, rows),
    assets: rows,
    parsed: {
      province: pq.province || null,
      city: pq.city || null,
      types: pq.types,
      priceMin: pq.priceMin ?? null,
      priceMax: pq.priceMax ?? null,
      areaMin: pq.areaMin ?? null,
      areaMax: pq.areaMax ?? null,
    },
  };
}

// ============ Handler ============

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      text?: string;
      province?: string;
      city?: string;
    };
    const text = (body.text || '').trim();
    if (!text) {
      return NextResponse.json({ success: false, error: 'text is required' }, { status: 400 });
    }
    const data = await doSearch(text, body.province, body.city);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const text = (searchParams.get('text') || '').trim();
  if (!text) {
    return NextResponse.json({ success: false, error: 'text is required' }, { status: 400 });
  }
  try {
    const data = await doSearch(text, searchParams.get('province') || undefined, searchParams.get('city') || undefined);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
