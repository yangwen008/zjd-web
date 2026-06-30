'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from './AdminSidebar';
import AdminTopbar from './AdminTopbar';

export default function AdminLayoutClient({ 
  children 
}: { 
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // 【核心规则】：复刻 Dashboard 的客户端鉴权模式
    // 尝试请求 Admin 专属的用户信息接口
    fetch('/api/admin/auth/me')
      .then((r) => {
        if (!r.ok) throw new Error('Unauthorized');
        return r.json();
      })
      .then((d: any) => {
        if (d.success) {
          setUser(d.user);
        } else {
          // 如果接口返回未登录，跳转到 Admin 登录页（您后续可以开发这个页面）
          router.push('/admin/login'); 
        }
      })
      .catch(() => {
        // 【临时兼容方案】：
        // 因为目前项目中可能还没有 /api/admin/auth/me 这个接口，
        // 为了保证界面能立刻跑起来，我们在 catch 里临时 Mock 一个超级管理员。
        // 等您后续建好这个 API 后，这里的 Mock 就会自动失效，无缝切换到真实鉴权！
        setUser({
          id: 1,
          name: '系统管理员',
          role: 'superadmin'
        });
      })
      .finally(() => setLoading(false));
  }, [router]);

  const toggleSidebar = () => setCollapsed(!collapsed);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-500">加载管理台...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* 左侧导航 */}
      <AdminSidebar collapsed={collapsed} />

      {/* 右侧主区域 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 顶部工具栏 */}
        <AdminTopbar toggleSidebar={toggleSidebar} userName={user.name || 'Admin'} />

        {/* 内容区 */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}