// Cloudflare 环境类型声明
// 在 @cloudflare/next-on-pages 中，DB 通过 process.env 注入

export interface CloudflareEnv {
  DB: D1Database;
  R2: R2Bucket;
  GEMINI_API_KEY: string;
  SITE_URL: string;
}

// D1 类型 (Cloudflare Workers API)
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

// 获取 DB 实例 (Server Components 中使用)
export function getCloudflareDB(): D1Database {
  // @cloudflare/next-on-pages 将 D1 绑定注入到 process.env
  const db = (process.env as unknown as CloudflareEnv).DB;
  if (!db) {
    throw new Error('D1 database binding not found. Ensure DB is configured in wrangler.toml');
  }
  return db;
}
