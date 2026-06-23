// API 路由 - 解锁任务 (微信扫码后异步处理)
import { Hono } from 'hono';

const unlock = new Hono();

// POST /api/unlock - 创建解锁任务
unlock.post('/', async (c) => {
  try {
    const { assetId, wechatOpenid } = await c.req.json();
    const db = c.env.DB;
    
    // 创建解锁任务
    const result = await db.prepare(
      'INSERT INTO unlock_tasks (asset_id, wechat_openid, status) VALUES (?, ?, ?)'
    ).bind(assetId, wechatOpenid, 'pending').run();
    
    const taskId = result.meta?.last_row_id;
    
    // 异步处理 (在实际部署中使用 Cloudflare Queue)
    // 这里简化为直接标记完成
    await db.prepare(
      'UPDATE unlock_tasks SET status = ?, completed_at = datetime("now") WHERE id = ?'
    ).bind('done', taskId).run();
    
    return c.json({ success: true, taskId });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// GET /api/unlock/status - 查询解锁状态 (前端轮询)
unlock.get('/status', async (c) => {
  const taskId = c.req.query('taskId');
  if (!taskId) return c.json({ success: false, error: 'taskId required' }, 400);
  
  try {
    const db = c.env.DB;
    const task = await db.prepare(
      'SELECT status, result_data FROM unlock_tasks WHERE id = ?'
    ).bind(taskId).first();
    
    if (!task) return c.json({ success: false, error: 'Not found' }, 404);
    
    return c.json({
      success: true,
      status: task.status,
      data: task.status === 'done' ? JSON.parse(task.result_data || '{}') : null,
    });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

export default unlock;
