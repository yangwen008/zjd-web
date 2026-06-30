import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminLayoutClient from '@/components/admin/AdminLayoutClient';

export const metadata = {
  title: '金禾计划 - Admin 控制台',
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 【服务端安全防线 1】：使用 Next.js 15 原生 API 读取 Cookie
  // 完美契合您 middleware.ts 中的 admin_token 校验逻辑
  const cookieStore = await cookies();
  const adminToken = cookieStore.get('admin_token');

  // 【服务端安全防线 2】：如果没有 token 或 token 不正确，直接服务端重定向！
  // 此时 Admin 的侧边栏、菜单等 HTML 根本不会发送给浏览器，杜绝菜单泄露！
  if (!adminToken || adminToken.value !== 'authenticated') {
    redirect('/admin/login'); // 如果没有登录页，可以改成 redirect('/')
  }

  // 【服务端安全防线 3】：只有合法 Admin 才能看到下面的客户端骨架
  // 这里我们可以安全地传入一个 Mock 用户名，或者后续从 Cookie/Token 中解析真实用户名
  return (
    <AdminLayoutClient userName="超级管理员">
      {children}
    </AdminLayoutClient>
  );
}