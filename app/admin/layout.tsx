import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import AdminLayoutClient from '@/components/admin/AdminLayoutClient';

// 【重要适配点】：
// 这里需要调用您项目中现有的鉴权逻辑。
// 假设您有一个 lib/auth.ts 导出了 getUser 或类似函数。
// 如果没有，我下面写了一个基于 Cookie 的简单 Mock 逻辑，保证代码能跑。
import { getUserFromCookie } from '@/lib/auth'; // <-- 请根据您实际的鉴权函数修改这里

export const metadata = {
  title: '金禾计划 - Admin 控制台',
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. 获取当前用户信息 (Server Component 中获取)
  // 注意：请确保您的 getUserFromCookie 或类似函数能正确解析出 role
  const user = await getUserFromCookie(); 

  // 2. 权限拦截：如果不是 admin 或 superadmin，直接踢回首页或登录页
  if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
    // 您可以根据需要 redirect('/login') 或 redirect('/')
    redirect('/?error=unauthorized'); 
  }

  // 3. 渲染客户端外壳，传入用户名用于 Topbar 显示
  return (
    <AdminLayoutClient userName={user.name || user.email || 'Admin'}>
      {children}
    </AdminLayoutClient>
  );
}