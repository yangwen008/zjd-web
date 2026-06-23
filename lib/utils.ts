// 工具函数

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
  return Math.random().toString(36).substring(2, 15);
}

// 简单加密 (用于电话号码)
export async function encryptData(data: string, key: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const keyBuffer = encoder.encode(key);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw', keyBuffer, { name: 'AES-GCM' }, false, ['encrypt']
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

// 解密
export async function decryptData(encryptedStr: string, key: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyBuffer = encoder.encode(key);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw', keyBuffer, { name: 'AES-GCM' }, false, ['decrypt']
  );
  
  const data = Uint8Array.from(atob(encryptedStr), c => c.charCodeAt(0));
  const iv = data.slice(0, 12);
  const encrypted = data.slice(12);
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv }, cryptoKey, encrypted
  );
  
  return new TextDecoder().decode(decrypted);
}

// 签名URL生成 (R2防盗链)
export async function generateSignedUrl(
  objectKey: string,
  expiresInMinutes: number = 10
): Promise<string> {
  const expires = Date.now() + expiresInMinutes * 60 * 1000;
  const payload = `${objectKey}:${expires}`;
  // 简化版，实际需要用HMAC签名
  const signature = btoa(payload);
  return `/api/images/${objectKey}?expires=${expires}&sig=${signature}`;
}

// 验证Referer
export function validateReferer(referer: string | null): boolean {
  if (!referer) return false;
  return referer.includes('zjd.cn');
}

// 每日发布配额检查
export async function checkDailyQuota(
  userId: number,
  maxQuota: number,
  db: { prepare: (sql: string) => { bind: (...args: unknown[]) => { first: () => Promise<{ count: number }> } } }
): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0];
  const result = await db
    .prepare('SELECT COUNT(*) as count FROM assets WHERE user_id = ? AND date(created_at) = ?')
    .bind(userId, today)
    .first();
  return (result?.count || 0) < maxQuota;
}

// GPS围栏去重
export async function checkGPSDuplicate(
  lat: number,
  lng: number,
  radiusKm: number = 0.5,
  db: { prepare: (sql: string) => { bind: (...args: unknown[]) => { all: () => Promise<{ results: Array<{ gps_lat: number; gps_lng: number }> }> } } }
): Promise<boolean> {
  // 粗筛：矩形范围
  const latRange = radiusKm / 111;
  const lngRange = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));
  
  const results = await db
    .prepare(
      `SELECT gps_lat, gps_lng FROM assets 
       WHERE gps_lat BETWEEN ? AND ? 
       AND gps_lng BETWEEN ? AND ?
       AND status != 'rejected'`
    )
    .bind(lat - latRange, lat + latRange, lng - lngRange, lng + lngRange)
    .all();
  
  // 精筛：Haversine
  for (const row of results.results) {
    if (row.gps_lat && row.gps_lng) {
      const dist = haversineDistance(lat, lng, row.gps_lat, row.gps_lng);
      if (dist < radiusKm) return true;
    }
  }
  
  return false;
}
