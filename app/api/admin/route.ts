// API 路由 - 管理后台
import { Hono } from 'hono';

const admin = new Hono();

// GET /api/admin/config - 获取首页配置
admin.get('/config', async (c) => {
  try {
    const db = c.env.DB;
    const { results } = await db.prepare('SELECT * FROM homepage_config').all();
    const config: Record<string, string> = {};
    results.forEach((row: { key: string; value: string }) => { config[row.key] = row.value; });
    return c.json({ success: true, data: config });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// POST /api/admin/config - 更新首页配置
admin.post('/config', async (c) => {
  try {
    const body = await c.req.json();
    const db = c.env.DB;
    
    for (const [key, value] of Object.entries(body)) {
      await db.prepare(
        'INSERT OR REPLACE INTO homepage_config (key, value, updated_at) VALUES (?, ?, datetime("now"))'
      ).bind(key, value).run();
    }
    
    return c.json({ success: true });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// GET /api/admin/assets - 获取所有资产(含待审核)
admin.get('/assets', async (c) => {
  const { status, page = '1', limit = '20' } = c.req.query();
  let sql = 'SELECT * FROM assets';
  const params: unknown[] = [];

  if (status) { sql += ' WHERE status = ?'; params.push(status); }
  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  const limitNum = Math.min(Number(limit), 50);
  params.push(limitNum, (Number(page) - 1) * limitNum);

  try {
    const db = c.env.DB;
    const { results } = await db.prepare(sql).bind(...params).all();
    return c.json({ success: true, data: results });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// POST /api/admin/assets/:id/approve - 审批资产
admin.post('/assets/:id/approve', async (c) => {
  const id = c.req.param('id');
  try {
    const db = c.env.DB;
    await db.prepare('UPDATE assets SET status = ?, updated_at = datetime("now") WHERE id = ?').bind('approved', id).run();
    return c.json({ success: true });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// POST /api/admin/assets/:id/reject - 拒绝资产
admin.post('/assets/:id/reject', async (c) => {
  const id = c.req.param('id');
  try {
    const db = c.env.DB;
    await db.prepare('UPDATE assets SET status = ?, updated_at = datetime("now") WHERE id = ?').bind('rejected', id).run();
    return c.json({ success: true });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

export default admin;
