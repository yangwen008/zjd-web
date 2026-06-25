import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 保护 /admin 路由（页面路由，非 API）
  if (pathname.startsWith('/admin') && !pathname.startsWith('/api/admin')) {
    const token = request.cookies.get('admin_token')?.value;
    if (token !== 'authenticated') {
      // 未登录时，admin layout.tsx 中的客户端组件会处理登录 UI
      // 这里不做强制跳转，因为 admin 是 SPA 式的客户端认证
      // 但可以在 header 中传递认证状态
    }
  }

  // 保护 admin API 路由（auth 除外）
  if (pathname.startsWith('/api/admin') && !pathname.startsWith('/api/admin/auth')) {
    const token = request.cookies.get('admin_token')?.value;
    if (token !== 'authenticated') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
