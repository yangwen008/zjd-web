// R2 对象存储工具
// 在 @cloudflare/next-on-pages 环境中，R2 通过 process.env.R2 绑定

import type { CloudflareEnv } from './db';

// 获取 R2 实例
export function getR2(): R2Bucket {
  const r2 = (process.env as unknown as CloudflareEnv).R2;
  if (!r2) {
    throw new Error(
      'R2 bucket binding "R2" not found. ' +
      'Ensure wrangler.toml has [[r2_buckets]] binding = "R2" and you are running in Cloudflare Pages environment.'
    );
  }
  return r2;
}

// 上传文件到 R2
export async function uploadToR2(
  env: CloudflareEnv,
  key: string,
  buffer: ArrayBuffer,
  contentType: string
): Promise<void> {
  await env.R2.put(key, buffer, {
    httpMetadata: { contentType },
  });
}

// 获取 R2 公开访问 URL
// TODO: 将占位域名替换为实际配置的 R2 公开域名
export function getR2PublicUrl(key: string): string {
  return `https://pub-placeholder.r2.dev/${key}`;
}
