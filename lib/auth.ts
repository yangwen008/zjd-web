// lib/auth.ts — 认证与权限工具库
import { query, queryOne, execute } from './db';

// ============ 类型定义 ============

export interface User {
  id: number;
  openid: string | null;
  nickname: string;
  avatar_url: string | null;
  phone: string | null;
  role: string;
  status: string;
  real_name: string | null;
  org_name: string | null;
  org_license: string | null;
  verified: number;
  daily_quota: number;
  password_hash: string | null;
  role_apply: string | null;
  broker_region: string | null;
  broker_specialties: string | null;
  broker_bio: string | null;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  user_id: number;
  expires_at: string;
  created_at: string;
}

// ============ 密码工具 ============

// ============ 密码工具 (PBKDF2 + salt，兼容旧 SHA-256) ============

const PBKDF2_ITERATIONS = 100000;
const SALT_BYTES = 16;
const HASH_BYTES = 32;

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

async function pbkdf2Hash(password: string, saltHex: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']
  );
  const salt = fromHex(saltHex);
  const hashBuffer = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial, HASH_BYTES * 8
  );
  return toHex(hashBuffer);
}

/**
 * 哈希密码。格式: pbkdf2:sha256:<iterations>:<salt_hex>:<hash_hex>
 * 兼容旧的纯 SHA-256 哈希（verifyPassword 会自动处理）
 */
export async function hashPassword(password: string): Promise<string> {
  const saltBytes = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const saltHex = toHex(saltBytes.buffer);
  const hashHex = await pbkdf2Hash(password, saltHex);
  return `pbkdf2:sha256:${PBKDF2_ITERATIONS}:${saltHex}:${hashHex}`;
}

/**
 * 验证密码。自动识别 PBKDF2 格式和旧 SHA-256 格式。
 * 旧格式验证通过后会返回 true，调用方可选择升级哈希。
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (hash.startsWith('pbkdf2:')) {
    const parts = hash.split(':');
    if (parts.length !== 5) return false;
    const [, , iterations, saltHex, expectedHash] = parts;
    const keyMaterial = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']
    );
    const hashBuffer = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: fromHex(saltHex), iterations: parseInt(iterations), hash: 'SHA-256' },
      keyMaterial, HASH_BYTES * 8
    );
    return toHex(hashBuffer) === expectedHash;
  }
  // 旧格式: 纯 SHA-256 (无 salt)
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const legacyHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  return legacyHash === hash;
}

/**
 * 检查哈希是否为旧格式（需要升级）
 */
export function isLegacyHash(hash: string): boolean {
  return !hash.startsWith('pbkdf2:');
}

export function validatePassword(password: string): { valid: boolean; reason?: string } {
  if (password.length < 8) return { valid: false, reason: '密码至少8位' };
  if (!/[A-Z]/.test(password)) return { valid: false, reason: '密码需包含大写字母' };
  if (!/[a-z]/.test(password)) return { valid: false, reason: '密码需包含小写字母' };
  if (!/[0-9]/.test(password)) return { valid: false, reason: '密码需包含数字' };
  return { valid: true };
}

// ============ 登录锁定 ============

const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 30;

export async function checkLoginAttempts(phone: string): Promise<{ allowed: boolean; remaining: number }> {
  const record = await queryOne<{ attempts: number; locked_until: string | null }>(
    'SELECT attempts, locked_until FROM login_attempts WHERE phone = ?',
    phone
  );

  if (record?.locked_until && new Date(record.locked_until) > new Date()) {
    return { allowed: false, remaining: 0 };
  }

  const attempts = record?.attempts || 0;
  return { allowed: attempts < MAX_ATTEMPTS, remaining: MAX_ATTEMPTS - attempts };
}

export async function recordLoginAttempt(phone: string, success: boolean): Promise<void> {
  if (success) {
    await execute('DELETE FROM login_attempts WHERE phone = ?', phone);
  } else {
    const record = await queryOne<{ attempts: number }>('SELECT attempts FROM login_attempts WHERE phone = ?', phone);
    const attempts = (record?.attempts || 0) + 1;
    const lockedUntil = attempts >= MAX_ATTEMPTS
      ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000).toISOString()
      : null;

    await execute(
      'INSERT OR REPLACE INTO login_attempts (phone, attempts, locked_until, updated_at) VALUES (?, ?, ?, datetime("now"))',
      phone, attempts, lockedUntil
    );
  }
}

// ============ Session 管理 ============

const SESSION_EXPIRY_DAYS = 7;

export async function createSession(userId: number): Promise<string> {
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_EXPIRY_DAYS * 86400000).toISOString();

  await execute(
    'INSERT INTO user_sessions (id, user_id, expires_at) VALUES (?, ?, ?)',
    sessionId, userId, expiresAt
  );

  // 更新最后登录时间
  await execute('UPDATE users SET last_login_at = datetime("now") WHERE id = ?', userId);

  return sessionId;
}

export async function getSessionUser(sessionId: string): Promise<User | null> {
  const session = await queryOne<Session>(
    'SELECT * FROM user_sessions WHERE id = ? AND expires_at > datetime("now")',
    sessionId
  );
  if (!session) return null;

  const user = await queryOne<User>('SELECT * FROM users WHERE id = ? AND status = ?', session.user_id, 'active');
  return user || null;
}

export async function deleteSession(sessionId: string): Promise<void> {
  await execute('DELETE FROM user_sessions WHERE id = ?', sessionId);
}

// ============ 权限系统 ============

export async function getUserPermissions(userId: number): Promise<string[]> {
  const user = await queryOne<{ role: string }>('SELECT role FROM users WHERE id = ?', userId);
  if (!user) return [];

  const perms = await query<{ permission: string }>(
    'SELECT permission FROM role_permissions WHERE role = ?',
    user.role
  );
  return perms.map((p) => p.permission);
}

export async function hasPermission(userId: number, permission: string): Promise<boolean> {
  const perms = await getUserPermissions(userId);
  return perms.includes(permission);
}

export async function hasAnyPermission(userId: number, permissions: string[]): Promise<boolean> {
  const perms = await getUserPermissions(userId);
  return permissions.some((p) => perms.includes(p));
}

// ============ 请求认证 ============

export async function getUserFromRequest(request: Request): Promise<User | null> {
  const cookie = request.headers.get('cookie') || '';
  const match = cookie.match(/user_session=([^;]+)/);
  if (!match) return null;
  return getSessionUser(match[1]);
}

export async function requireAuth(request: Request): Promise<User> {
  const user = await getUserFromRequest(request);
  if (!user) throw new Error('Unauthorized');
  return user;
}

export async function requirePermission(request: Request, permission: string): Promise<User> {
  const user = await requireAuth(request);
  if (!(await hasPermission(user.id, permission))) throw new Error('Forbidden');
  return user;
}

export async function requireRole(request: Request, roles: string[]): Promise<User> {
  const user = await requireAuth(request);
  if (!roles.includes(user.role)) throw new Error('Forbidden');
  return user;
}

// ============ 登录日志 ============

export async function logLoginEvent(params: {
  phone: string;
  userId?: number;
  success: boolean;
  ip: string;
  userAgent: string;
  reason?: string;
}): Promise<void> {
  await execute(
    'INSERT INTO login_logs (phone, user_id, success, ip_address, user_agent, reason, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime("now"))',
    params.phone, params.userId || null, params.success ? 1 : 0, params.ip, params.userAgent, params.reason || null
  );
}

// ============ 角色工具 ============

export const ROLE_LABELS: Record<string, string> = {
  user: '普通用户',
  broker: '合伙人',
  village_org: '村集体',
  data_editor: '数据录入员',
  project_publisher: '项目发布者',
  admin: '平台运营',
  superadmin: '超级管理员',
};

export const ROLE_LEVELS: Record<string, number> = {
  user: 10,
  broker: 20,
  village_org: 20,
  data_editor: 15,
  project_publisher: 25,
  admin: 50,
  superadmin: 100,
};

export function canManageRole(managerRole: string, targetRole: string): boolean {
  return (ROLE_LEVELS[managerRole] || 0) > (ROLE_LEVELS[targetRole] || 0);
}
