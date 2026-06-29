// lib/rate-limit.ts — 频率限制工具库
import { queryOne, execute } from './db';

interface RateLimitConfig {
  window: number;  // 窗口时间（秒）
  max: number;     // 最大次数
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  'auth.login':        { window: 300,  max: 10 },
  'auth.register':     { window: 3600, max: 5 },
  'asset.create':      { window: 3600, max: 20 },
  'asset.update':      { window: 300,  max: 30 },
  'bulk.create':       { window: 3600, max: 5 },
  'api.general':       { window: 60,   max: 100 },
};

export async function checkRateLimit(key: string, ip: string): Promise<{ allowed: boolean; remaining: number; resetAt: string }> {
  const config = RATE_LIMITS[key] || RATE_LIMITS['api.general'];
  const fullKey = `${key}:${ip}`;

  const record = await queryOne<{ count: number; window_start: string }>(
    'SELECT count, window_start FROM rate_limits WHERE key = ? AND ip = ?',
    fullKey, ip
  );

  const now = Date.now();

  if (!record || now - new Date(record.window_start).getTime() > config.window * 1000) {
    // 新窗口
    const windowStart = new Date().toISOString();
    await execute(
      'INSERT OR REPLACE INTO rate_limits (key, ip, count, window_start) VALUES (?, ?, 1, ?)',
      fullKey, ip, windowStart
    );
    return { allowed: true, remaining: config.max - 1, resetAt: new Date(now + config.window * 1000).toISOString() };
  }

  if (record.count >= config.max) {
    const resetAt = new Date(new Date(record.window_start).getTime() + config.window * 1000).toISOString();
    return { allowed: false, remaining: 0, resetAt };
  }

  await execute('UPDATE rate_limits SET count = count + 1 WHERE key = ? AND ip = ?', fullKey, ip);
  return { allowed: true, remaining: config.max - record.count - 1, resetAt: new Date(new Date(record.window_start).getTime() + config.window * 1000).toISOString() };
}

export async function checkAndEnforceRateLimit(key: string, request: Request): Promise<void> {
  const ip = request.headers.get('cf-connecting-ip') ||
             request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

  const result = await checkRateLimit(key, ip);
  if (!result.allowed) {
    throw new Error(`Rate limit exceeded. Try again after ${result.resetAt}`);
  }
}
