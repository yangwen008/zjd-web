// 工具函数

import { query, queryOne, type D1Database } from './db';

// 加密电话号码 (简单遮罩)
export function maskPhone(phone: string): string {
  if (!phone || phone.length < 7) return '****';
  return phone.substring(0, 3) + '****' + phone.substring(phone.length - 4);
}

// Haversine 公式计算两点距离 (km)
export function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// 格式化数字
export function formatNumber(num: number): string {
  return num.toLocaleString('zh-CN');
}

// 格式化价格
export function formatPrice(price: number): string {
  if (price >= 10000) {
    return (price / 10000).toFixed(1) + '万';
  }
  return price.toFixed(1) + '万';
}

// 生成随机ID
export function generateId(): string {
  return crypto.randomUUID();
}

// AES-GCM 加密 (用于电话号码)
export async function encryptData(data: string, key: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  
  // 将 key 转为固定 256-bit：先 hash 再截取
  const keyHash = await crypto.subtle.digest('SHA-256', encoder.encode(key));
  const cryptoKey = await crypto.subtle.importKey(
    'raw', keyHash, { name: 'AES-GCM' }, false, ['encrypt']
  );
  
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv }, cryptoKey, dataBuffer
  );
  
  const result = new Uint8Array(iv.length + new Uint8Array(encrypted).length);
  result.set(iv);
  result.set(new Uint8Array(encrypted), iv.length);
  
  return btoa(String.fromCharCode(...result));
}

// AES-GCM 解密
export async function decryptData(encryptedStr: string, key: string): Promise<string> {
  const encoder = new TextEncoder();
  
  const keyHash = await crypto.subtle.digest('SHA-256', encoder.encode(key));
  const cryptoKey = await crypto.subtle.importKey(
    'raw', keyHash, { name: 'AES-GCM' }, false, ['decrypt']
  );
  
  const data = Uint8Array.from(atob(encryptedStr), c => c.charCodeAt(0));
  const iv = data.slice(0, 12);
  const encrypted = data.slice(12);
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv }, cryptoKey, encrypted
  );
  
  return new TextDecoder().decode(decrypted);
}

// HMAC-SHA256 签名
async function hmacSign(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

// 验证 HMAC 签名
async function hmacVerify(message: string, signature: string, secret: string): Promise<boolean> {
  const expected = await hmacSign(message, secret);
  return expected === signature;
}

// 签名URL生成 (R2防盗链) — 真正的 HMAC 签名
export async function generateSignedUrl(
  objectKey: string,
  signingSecret: string,
  expiresInMinutes: number = 10
): Promise<string> {
  const expires = Date.now() + expiresInMinutes * 60 * 1000;
  const payload = `${objectKey}:${expires}`;
  const signature = await hmacSign(payload, signingSecret);
  return `/api/images/${objectKey}?expires=${expires}&sig=${encodeURIComponent(signature)}`;
}

// 验证签名URL
export async function verifySignedUrl(
  objectKey: string,
  expires: string,
  sig: string,
  signingSecret: string
): Promise<boolean> {
  // 检查过期
  if (Date.now() > parseInt(expires, 10)) return false;
  
  const payload = `${objectKey}:${expires}`;
  return hmacVerify(payload, decodeURIComponent(sig), signingSecret);
}

// 验证Referer —— 严格匹配
export function validateReferer(referer: string | null): boolean {
  if (!referer) return false;
  try {
    const url = new URL(referer);
    // 精确匹配主域名和 pages.dev 子域名
    return (
      url.hostname === 'zjd.cn' ||
      url.hostname === 'www.zjd.cn' ||
      url.hostname.endsWith('.zjd-web.pages.dev') ||
      url.hostname === 'zjd-web.pages.dev'
    );
  } catch {
    return false;
  }
}

// 每日发布配额检查
export async function checkDailyQuota(
  userId: number,
  maxQuota: number
): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0];
  const result = await queryOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM assets WHERE user_id = ? AND date(created_at) = ?',
    userId, today
  );
  return (result?.count || 0) < maxQuota;
}

// GPS围栏去重
export async function checkGPSDuplicate(
  lat: number,
  lng: number,
  radiusKm: number = 0.5
): Promise<boolean> {
  // 粗筛：矩形范围
  const latRange = radiusKm / 111;
  const lngRange = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));
  
  const results = await query<{ gps_lat: number; gps_lng: number }>(
    `SELECT gps_lat, gps_lng FROM assets 
     WHERE gps_lat BETWEEN ? AND ? 
     AND gps_lng BETWEEN ? AND ?
     AND status != 'rejected'`,
    lat - latRange, lat + latRange, lng - lngRange, lng + lngRange
  );
  
  // 精筛：Haversine
  for (const row of results) {
    if (row.gps_lat && row.gps_lng) {
      const dist = haversineDistance(lat, lng, row.gps_lat, row.gps_lng);
      if (dist < radiusKm) return true;
    }
  }
  
  return false;
}
