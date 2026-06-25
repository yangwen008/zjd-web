// D1 数据库连接工具
// 在 @cloudflare/next-on-pages 环境中，D1 通过 process.env.DB 绑定

// Cloudflare 环境类型声明
export interface CloudflareEnv {
  DB: D1Database;
  R2: R2Bucket;
  GEMINI_API_KEY: string;
  SITE_URL: string;
  ADMIN_PASSWORD: string;
  SIGNING_SECRET: string;
}

// D1 类型定义
export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch(statements: D1PreparedStatement[]): Promise<D1Result[]>;
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T>;
  all<T = unknown>(): Promise<{ results: T[] }>;
  run(): Promise<D1Result>;
}

export interface D1Result {
  success: boolean;
  meta: { duration: number; changes: number; last_row_id?: number };
}

// 获取 D1 实例
export function getDB(): D1Database {
  const db = (process.env as unknown as CloudflareEnv).DB;
  if (!db) {
    throw new Error(
      'D1 database binding "DB" not found. ' +
      'Ensure wrangler.toml has [[d1_databases]] binding = "DB" and you are running in Cloudflare Pages environment.'
    );
  }
  return db;
}

// 获取环境变量
export function getEnv(): CloudflareEnv {
  return process.env as unknown as CloudflareEnv;
}

// 便捷查询方法 - 返回多行
export async function query<T = unknown>(sql: string, ...params: unknown[]): Promise<T[]> {
  const db = getDB();
  const stmt = db.prepare(sql).bind(...params);
  const { results } = await stmt.all<T>();
  return results;
}

// 便捷查询方法 - 返回单行
export async function queryOne<T = unknown>(sql: string, ...params: unknown[]): Promise<T | null> {
  const db = getDB();
  const stmt = db.prepare(sql).bind(...params);
  return await stmt.first<T>();
}

// 便捷执行方法 - INSERT/UPDATE/DELETE
export async function execute(sql: string, ...params: unknown[]): Promise<D1Result> {
  const db = getDB();
  const stmt = db.prepare(sql).bind(...params);
  return await stmt.run();
}

// 批量执行
export async function batch(statements: Array<{ sql: string; params: unknown[] }>): Promise<D1Result[]> {
  const db = getDB();
  const stmts = statements.map(({ sql, params }) => db.prepare(sql).bind(...params));
  return await db.batch(stmts);
}
