// API 路由 - 资产相关
import { Hono } from 'hono';

const assets = new Hono();

// GET /api/assets - 获取资产列表
assets.get('/', async (c) => {
  const { source, province, area_min, area_max, price_min, price_max, page = '1', limit = '20' } = c.req.query();
  
  let sql = 'SELECT id, title, location, area_mu, price_year, asset_type, source_type, views, images, status FROM assets WHERE status = ?';
  const params: unknown[] = ['approved'];

  if (source) { sql += ' AND source_type = ?'; params.push(source); }
  if (province) { sql += ' AND province = ?'; params.push(province); }
  if (area_min) { sql += ' AND area_mu >= ?'; params.push(Number(area_min)); }
  if (area_max) { sql += ' AND area_mu <= ?'; params.push(Number(area_max)); }
  if (price_min) { sql += ' AND price_year >= ?'; params.push(Number(price_min)); }
  if (price_max) { sql += ' AND price_year <= ?'; params.push(Number(price_max)); }

  sql += ' ORDER BY views DESC LIMIT ? OFFSET ?';
  const limitNum = Math.min(Number(limit), 50);
  const offset = (Number(page) - 1) * limitNum;
  params.push(limitNum, offset);

  try {
    const db = c.env.DB;
    const { results } = await db.prepare(sql).bind(...params).all();
    return c.json({ success: true, data: results });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// GET /api/assets/:id - 获取资产详情
assets.get('/:id', async (c) => {
  const id = c.req.param('id');
  try {
    const db = c.env.DB;
    const asset = await db.prepare('SELECT * FROM assets WHERE id = ? AND status = ?').bind(id, 'approved').first();
    if (!asset) return c.json({ success: false, error: 'Not found' }, 404);
    
    // 增加浏览量
    await db.prepare('UPDATE assets SET views = views + 1 WHERE id = ?').bind(id).run();
    
    return c.json({ success: true, data: asset });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

export default assets;
