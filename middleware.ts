import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ADMIN_ID = 'admin';

async function hmacSign(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 保护 admin API 路由（auth 除外）
  if (pathname.startsWith('/api/admin') && !pathname.startsWith('/api/admin/auth')) {
    const token = request.cookies.get('admin_token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    try {
      const secret = (process.env as any).SIGNING_SECRET || '';
      const valid = await verifyAdminToken(token, secret);
      if (!valid) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }
    } catch {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
  }

  // 保护 /dashboard 路由（用户后台）
  if (pathname.startsWith('/dashboard')) {
    const session = request.cookies.get('user_session')?.value;
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // 保护 /api/dashboard 路由
  if (pathname.startsWith('/api/dashboard')) {
    const session = request.cookies.get('user_session')?.value;
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*', '/dashboard/:path*', '/api/dashboard/:path*'],
};
