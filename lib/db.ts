// D1 数据库连接工具
// 在 Cloudflare Workers 中通过 env.DB 访问 D1

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
  meta: { duration: number; changes: number };
}

// 本地开发用的模拟DB (实际部署时由Cloudflare注入)
let db: D1Database | null = null;

export function setDB(database: D1Database) {
  db = database;
}

export function getDB(): D1Database {
  if (!db) throw new Error('Database not initialized. Call setDB() first.');
  return db;
}

// 便捷查询方法
export async function query<T = unknown>(sql: string, ...params: unknown[]): Promise<T[]> {
  const database = getDB();
  const stmt = database.prepare(sql).bind(...params);
  const { results } = await stmt.all<T>();
  return results;
}

export async function queryOne<T = unknown>(sql: string, ...params: unknown[]): Promise<T | null> {
  const database = getDB();
  const stmt = database.prepare(sql).bind(...params);
  return await stmt.first<T>();
}

export async function execute(sql: string, ...params: unknown[]): Promise<D1Result> {
  const database = getDB();
  const stmt = database.prepare(sql).bind(...params);
  return await stmt.run();
}
