'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface UserInfo {
  id: number;
  nickname: string;
  phone: string;
  role: string;
  role_label: string;
  avatar_url: string | null;
  permissions: string[];
}

const MENU_ITEMS = [
  { icon: '📊', label: '我的概览', href: '/dashboard', roles: ['user', 'broker', 'village_org', 'data_editor', 'project_publisher', 'admin', 'superadmin'] },
  { icon: '🏠', label: '我的资产', href: '/dashboard/assets', roles: ['user', 'broker', 'village_org', 'admin', 'superadmin'] },
  { icon: '➕', label: '发布资产', href: '/dashboard/assets/new', roles: ['user', 'broker', 'village_org', 'admin', 'superadmin'] },
  { divider: true, roles: ['broker', 'village_org', 'admin', 'superadmin'] },
  { icon: '📋', label: '我的线索', href: '/dashboard/leads', roles: ['broker', 'village_org', 'admin', 'superadmin'] },
  { divider: true, roles: ['project_publisher', 'admin', 'superadmin'] },
  { icon: '🏢', label: '大宗项目', href: '/dashboard/bulk-projects', roles: ['project_publisher', 'admin', 'superadmin'] },
  { divider: true, roles: ['data_editor', 'admin', 'superadmin'] },
  { icon: '📡', label: '基建数据', href: '/dashboard/infra', roles: ['data_editor', 'admin', 'superadmin'] },
  { divider: true, roles: ['user', 'broker', 'village_org', 'admin', 'superadmin'] },
  { icon: '❤️', label: '我的收藏', href: '/dashboard/favorites', roles: ['user', 'broker', 'village_org', 'admin', 'superadmin'] },
  { icon: '👤', label: '个人资料', href: '/dashboard/profile', roles: ['user', 'broker', 'village_org', 'data_editor', 'project_publisher', 'admin', 'superadmin'] },
];

const ROLE_BADGES: Record<string, { label: string; color: string }> = {
  user: { label: '普通用户', color: 'bg-gray-100 text-gray-600' },
  broker: { label: '合伙人', color: 'bg-blue-100 text-blue-600' },
  village_org: { label: '村集体', color: 'bg-purple-100 text-purple-600' },
  data_editor: { label: '数据录入员', color: 'bg-green-100 text-green-600' },
  project_publisher: { label: '项目发布者', color: 'bg-yellow-100 text-yellow-600' },
  admin: { label: '平台运营', color: 'bg-red-100 text-red-600' },
  superadmin: { label: '超级管理员', color: 'bg-red-100 text-red-600' },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d: any) => {
        if (d.success) setUser(d.user);
        else window.location.href = '/login';
      })
      .catch(() => { window.location.href = '/login'; })
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F9F8] flex items-center justify-center">
        <div className="text-gray-400">加载中...</div>
      </div>
    );
  }

  if (!user) return null;

  const badge = ROLE_BADGES[user.role] || ROLE_BADGES.user;
  const visibleMenus = MENU_ITEMS.filter((item) => item.roles?.includes(user.role));

  return (
    <div className="min-h-screen bg-[#F9F9F8] flex pt-16">
      {/* Sidebar */}
      <aside className={`${collapsed ? 'w-16' : 'w-56'} bg-white border-r border-gray-100 transition-all duration-300 flex flex-col fixed top-16 bottom-0 left-0 z-30`}>
        {/* User info */}
        <div className="p-4 border-b border-gray-100">
          {!collapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-brand-green/10 flex items-center justify-center text-lg flex-shrink-0">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.nickname} className="w-10 h-10 rounded-full object-cover" />
                ) : '👤'}
              </div>
              <div className="min-w-0">
                <div className="font-bold text-gray-900 text-sm truncate">{user.nickname}</div>
                <span className={`text-xs px-1.5 py-0.5 rounded ${badge.color}`}>{badge.label}</span>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="flex justify-center">
              <div className="w-8 h-8 rounded-full bg-brand-green/10 flex items-center justify-center text-sm">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.nickname} className="w-8 h-8 rounded-full object-cover" />
                ) : '👤'}
              </div>
            </div>
          )}
        </div>

        {/* Menu */}
        <nav className="flex-1 py-2 overflow-y-auto">
          {visibleMenus.map((item, i) => {
            if ('divider' in item && item.divider) {
              return <div key={`div-${i}`} className="my-2 border-t border-gray-100 mx-3" />;
            }
            if (!('href' in item)) return null;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href!}
                className={`flex items-center space-x-3 px-4 py-2.5 text-sm transition-colors ${
                  isActive
                    ? 'bg-brand-green/10 text-brand-green font-medium border-r-2 border-brand-green'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className="text-base flex-shrink-0">{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t border-gray-100 space-y-1">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center py-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            {collapsed ? '→' : '← 收起'}
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 py-2 text-xs text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <span>🚪</span>
            {!collapsed && <span>退出登录</span>}
          </button>
          <Link
            href="/"
            className="flex items-center justify-center space-x-2 py-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            <span>←</span>
            {!collapsed && <span>返回前台</span>}
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className={`flex-1 ${collapsed ? 'ml-16' : 'ml-56'} transition-all duration-300 p-6`}>
        {children}
      </main>
    </div>
  );
}
