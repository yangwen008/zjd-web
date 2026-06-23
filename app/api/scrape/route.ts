# API 路由 - 爬虫触发与管理
import { Hono } from 'hono';

const scrape = new Hono();

// GET /api/scrape/recipes - 获取所有启用的配方 (供爬虫引擎调用)
scrape.get('/recipes', async (c) => {
  try {
    const db = c.env.DB;
    const { results } = await db.prepare(
      'SELECT * FROM scrapers_recipes WHERE enabled = 1'
    ).all();
    return c.json({ success: true, recipes: results });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// POST /api/scrape/status - 更新配方运行状态
scrape.post('/status', async (c) => {
  try {
    const { recipeId, status, errorMsg } = await c.req.json();
    const db = c.env.DB;
    await db.prepare(
      'UPDATE scrapers_recipes SET last_run_status = ?, last_run_at = datetime("now") WHERE id = ?'
    ).bind(status, recipeId).run();
    return c.json({ success: true });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// POST /api/scrape/save-raw - 保存原始抓取数据
scrape.post('/save-raw', async (c) => {
  try {
    const { recipeId, rawData } = await c.req.json();
    const db = c.env.DB;
    await db.prepare(
      'INSERT INTO staging_raw (recipe_id, raw_data, status) VALUES (?, ?, ?)'
    ).bind(recipeId, JSON.stringify(rawData), 'raw').run();
    return c.json({ success: true });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// POST /api/scrape/run - 手动触发爬虫
scrape.post('/run', async (c) => {
  // 触发 GitHub Actions workflow
  return c.json({ success: true, message: 'Scrape job triggered' });
});

// POST /api/scrape/recipes - 新增配方
scrape.post('/recipes', async (c) => {
  try {
    const body = await c.req.json();
    const db = c.env.DB;
    await db.prepare(
      `INSERT INTO scrapers_recipes (name, base_url, list_url, selectors, detail_selectors, ai_prompt, max_pages, pagination_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      body.name, body.base_url, body.list_url,
      JSON.stringify(body.selectors),
      body.detail_selectors ? JSON.stringify(body.detail_selectors) : null,
      body.ai_prompt || null,
      body.max_pages || 10,
      body.pagination_type || 'url'
    ).run();
    return c.json({ success: true });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

export default scrape;
