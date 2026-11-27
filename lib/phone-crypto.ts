// lib/phone-crypto.ts — 电话号码静态加密 (AES-256-GCM)
//
// 解决"contact_phone 名义加密实际明文存储"的技术债：
//   - 写入时 encryptPhone()：加密后存库，格式 enc:v1:<base64url(iv||ciphertext)>
//   - 展示时 maskPhone()：脱敏 138****5678，公开接口/页面只出脱敏号
//   - 解锁时 decryptPhone()：登录 + 记线索后才出完整号码（/api/unlock）
//
// 密钥派生：HKDF-SHA256(PHONE_ENC_SECRET || SIGNING_SECRET, info='zjd/phone/v1')
//   - 可选环境变量 PHONE_ENC_SECRET 独立管理；缺省回退 SIGNING_SECRET
//   - ⚠️ 轮换密钥前需先解密重加密存量数据，否则旧数据解密失败
// 兼容性：decryptPhone 对非 enc: 前缀的历史明文直接透传；encryptPhone 幂等（已加密不再重复加密）
// 未配置任何密钥时（本地开发）：保持明文透传并打警告，不阻断业务

const ENC_PREFIX = 'enc:v1:';

function getSecret(): string {
  const env = process.env as Record<string, string | undefined>;
  return env.PHONE_ENC_SECRET || env.SIGNING_SECRET || '';
}

function b64urlEncode(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(s: string): Uint8Array {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

let cachedKey: CryptoKey | null = null;

async function getAesKey(): Promise<CryptoKey | null> {
  const secret = getSecret();
  if (!secret) {
    console.warn('[phone-crypto] PHONE_ENC_SECRET/SIGNING_SECRET 未配置，电话将以明文存储（仅限本地开发）');
    return null;
  }
  if (cachedKey) return cachedKey;

  const keyMaterial = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret), 'HKDF', false, ['deriveKey']
  );
  cachedKey = await crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(0), info: new TextEncoder().encode('zjd/phone/v1') },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
  return cachedKey;
}

/** 加密电话号码。空值/已加密值原样返回（幂等）。 */
export async function encryptPhone(phone: string | null | undefined): Promise<string | null> {
  if (phone === null || phone === undefined) return null;
  const v = String(phone).trim();
  if (!v) return '';
  if (v.startsWith(ENC_PREFIX)) return v;

  const key = await getAesKey();
  if (!key) return v; // 无密钥：明文透传

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv }, key, new TextEncoder().encode(v)
  ));
  const out = new Uint8Array(iv.length + ct.length);
  out.set(iv, 0);
  out.set(ct, iv.length);
  return ENC_PREFIX + b64urlEncode(out);
}

/** 解密电话号码。明文历史数据透传；解密失败返回原值（保数据，不覆盖丢失）。 */
export async function decryptPhone(phone: string | null | undefined): Promise<string | null> {
  if (phone === null || phone === undefined) return null;
  const v = String(phone);
  if (!v) return '';
  if (!v.startsWith(ENC_PREFIX)) return v; // 历史明文

  try {
    const key = await getAesKey();
    if (!key) return v;
    const raw = b64urlDecode(v.slice(ENC_PREFIX.length));
    const iv = raw.slice(0, 12);
    const ct = raw.slice(12);
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
    return new TextDecoder().decode(pt);
  } catch (err) {
    console.error('[phone-crypto] 解密失败（密钥不匹配？）:', err);
    return v;
  }
}

/** 电话脱敏：138****5678。加密值先解密再脱敏；解密失败返回 ****。 */
export async function maskPhone(phone: string | null | undefined): Promise<string | null> {
  if (phone === null || phone === undefined) return null;
  const raw = String(phone);
  if (!raw) return '';

  let v = raw;
  if (raw.startsWith(ENC_PREFIX)) {
    const dec = await decryptPhone(raw);
    if (!dec || dec.startsWith(ENC_PREFIX)) return '****'; // 解密失败不泄露
    v = dec;
  }

  const digits = v.replace(/\D/g, '');
  if (digits.length === 11) {
    return v.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
  }
  if (digits.length >= 7) {
    return digits.slice(0, 3) + '****' + digits.slice(-2);
  }
  return '***';
}

/** 批量脱敏行数据中的 contact_phone */
export async function maskRow<T extends { contact_phone?: string | null }>(row: T): Promise<T> {
  return { ...row, contact_phone: await maskPhone(row.contact_phone) } as T;
}

/** 批量解密行数据中的 contact_phone */
export async function decryptRows<T extends { contact_phone?: string | null }>(rows: T[]): Promise<T[]> {
  return Promise.all(rows.map(async (r) => ({
    ...r,
    contact_phone: r.contact_phone !== undefined ? await decryptPhone(r.contact_phone) : r.contact_phone,
  } as T)));
}
