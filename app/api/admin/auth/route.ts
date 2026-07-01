export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { getEnv } from '@/lib/db';

const ADMIN_ID = 'admin';

function getSigningSecret(): string {
  const secret = getEnv().SIGNING_SECRET;
  if (!secret) throw new Error('SIGNING_SECRET not configured');
  return secret;
}

async function hmacSign(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * 生成 admin token: <id>.<expiry>.<hmac>
 * expiry 为 Unix 毫秒时间戳
 */
async function generateAdminToken(secret: string): Promise<string> {
  const expiry = Date.now() + 7 * 86400 * 1000; // 7天
  const message = `${ADMIN_ID}.${expiry}`;
  const signature = await hmacSign(message, secret);
  return `${ADMIN_ID}.${expiry}.${signature}`;
}

/**
 * 验证 admin token
 */
async function verifyAdminToken(token: string, secret: string): Promise<boolean> {
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [id, expiryStr, signature] = parts;
  if (id !== ADMIN_ID) return false;
  const expiry = parseInt(expiryStr, 10);
  if (isNaN(expiry) || Date.now() > expiry) return false;
  const expected = await hmacSign(`${id}.${expiry}`, secret);
  return signature === expected;
}

export async function POST(request: Request) {
  const { password } = await request.json() as { password: string };

  const env = getEnv();
  const adminPassword = env.ADMIN_PASSWORD || 'zjd2026admin';

  if (password === adminPassword) {
    const secret = getSigningSecret();
    const token = await generateAdminToken(secret);

    const res = NextResponse.json({ success: true });
    res.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 86400 * 7,
      path: '/',
    });
    return res;
  }

  return NextResponse.json({ success: false, error: '密码错误' }, { status: 401 });
}

export async function GET(request: Request) {
  try {
    const cookie = request.headers.get('cookie') || '';
    const match = cookie.match(/admin_token=([^;]+)/);
    if (!match) return NextResponse.json({ authenticated: false });

    const secret = getSigningSecret();
    const valid = await verifyAdminToken(match[1], secret);
    return NextResponse.json({ authenticated: valid });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.delete('admin_token');
  return res;
}
