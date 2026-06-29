import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 保护 /admin 路由（管理员后台）
  if (pathname.startsWith('/admin') && !pathname.startsWith('/api/admin')) {
    const token = request.cookies.get('admin_token')?.value;
    if (token !== 'authenticated') {
      // admin layout.tsx 中的客户端组件会处理登录 UI
    }
  }

  // 保护 admin API 路由（auth 除外）
  if (pathname.startsWith('/api/admin') && !pathname.startsWith('/api/admin/auth')) {
    const token = request.cookies.get('admin_token')?.value;
    if (token !== 'authenticated') {
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
