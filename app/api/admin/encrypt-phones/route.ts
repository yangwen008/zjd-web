export const runtime = 'edge';

// POST /api/admin/encrypt-phones — 存量电话明文→密文 一次性迁移（幂等，可重复执行）
// 背景：contact_phone 上线加密后，历史数据仍是明文。本接口分批回填加密。
// 用法：POST { limit?: number }（默认每批 50），重复调用直到 remaining = 0。
// 迁移对象：assets.contact_phone / bulk_projects.contact_phone / unlock_tasks.result_data.contact_phone
// 注意：如配置了 PHONE_ENC_SECRET，请在设置后一次性跑完本迁移，避免新旧密钥混用。

import { NextResponse } from 'next/server';
import { query, execute, batch } from '@/lib/db';
import { encryptPhone } from '@/lib/phone-crypto';

const ENC_LIKE = "enc:v1:%";

async function migrateColumn(table: 'assets' | 'bulk_projects', limit: number) {
  const rows = await query<{ id: number; contact_phone: string }>(
    `SELECT id, contact_phone FROM ${table}
     WHERE contact_phone IS NOT NULL AND contact_phone != '' AND contact_phone NOT LIKE ?
     LIMIT ?`,
    ENC_LIKE, limit
  );

  if (rows.length > 0) {
    const stmts = [];
    for (const r of rows) {
      const enc = await encryptPhone(r.contact_phone);
      stmts.push({ sql: `UPDATE ${table} SET contact_phone = ? WHERE id = ?`, params: [enc, r.id] });
    }
    await batch(stmts);
  }

  const remain = await query<{ c: number }>(
    `SELECT COUNT(*) as c FROM ${table}
     WHERE contact_phone IS NOT NULL AND contact_phone != '' AND contact_phone NOT LIKE ?`,
    ENC_LIKE
  );
  return { migrated: rows.length, remaining: remain[0]?.c || 0 };
}

async function migrateUnlockTasks(limit: number) {
  // 只扫未迁移过的记录：既没有 enc: 密文也没有 _enc_migrated 标记
  const scanWhere = `result_data IS NOT NULL AND result_data != ''
     AND result_data NOT LIKE ? AND result_data NOT LIKE ?`;
  const rows = await query<{ id: number; result_data: string }>(
    `SELECT id, result_data FROM unlock_tasks WHERE ${scanWhere} LIMIT ?`,
    `%${ENC_LIKE}%`, '%"_enc_migrated"%', limit
  );

  let migrated = 0;
  for (const r of rows) {
    try {
      const data = JSON.parse(r.result_data);
      if (data && typeof data.contact_phone === 'string' && data.contact_phone && !data.contact_phone.startsWith('enc:v1:')) {
        data.contact_phone = await encryptPhone(data.contact_phone);
        migrated++;
      }
      data._enc_migrated = 1; // 标记已处理，避免反复扫描
      await execute('UPDATE unlock_tasks SET result_data = ? WHERE id = ?', JSON.stringify(data), r.id);
    } catch {
      // JSON 损坏：包裹保存原文并标记跳过
      await execute('UPDATE unlock_tasks SET result_data = ? WHERE id = ?',
        JSON.stringify({ _enc_migrated: 1, raw: r.result_data }), r.id);
    }
  }

  const remain = await query<{ c: number }>(
    `SELECT COUNT(*) as c FROM unlock_tasks WHERE ${scanWhere}`,
    `%${ENC_LIKE}%`, '%"_enc_migrated"%'
  );
  return { migrated, remaining: remain[0]?.c || 0 };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const limit = Math.min(Math.max(parseInt(String(body.limit)) || 50, 1), 200);

    const assets = await migrateColumn('assets', limit);
    const bulk = await migrateColumn('bulk_projects', limit);
    const tasks = await migrateUnlockTasks(limit);

    return NextResponse.json({
      success: true,
      assets,
      bulk_projects: bulk,
      unlock_tasks: tasks,
      done: assets.remaining === 0 && bulk.remaining === 0 && tasks.remaining === 0,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
