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
  { icon: '', label: '发布资产', href: '/dashboard/assets/new', roles: ['user', 'broker', 'village_org', 'admin', 'superadmin'] },
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

// 获取当前页面标题的辅助函数
const getPageTitle = (pathname: string) => {
  const item = MENU_ITEMS.find(m => 'href' in m && m.href === pathname);
  return item && 'label' in item ? item.label : '我的概览';
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false); // 控制用户下拉菜单
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
        <div className="text-gray-400 flex items-center gap-2">
          <div className="w-5 h-5 border-2 border-brand-green border-t-transparent rounded-full animate-spin"></div>
          加载中...
        </div>
      </div>
    );
  }

  if (!user) return null;

  const badge = ROLE_BADGES[user.role] || ROLE_BADGES.user;
  const visibleMenus = MENU_ITEMS.filter((item) => item.roles?.includes(user.role));
  const pageTitle = getPageTitle(pathname);

  return (
    // 整体容器：去掉 pt-16，顶天立地
    <div className="min-h-screen bg-[#F9F9F8] flex">
      
      {/* ================= 左侧 Sidebar ================= */}
      <aside className={`${collapsed ? 'w-16' : 'w-56'} bg-white border-r border-gray-100 transition-all duration-300 flex flex-col fixed top-0 bottom-0 left-0 z-30 h-screen`}>
        {/* User info */}
        <div className="h-16 flex items-center px-4 border-b border-gray-100">
          {!collapsed && (
            <div className="flex items-center space-x-3 w-full truncate">
              <div className="w-8 h-8 rounded-full bg-brand-green/10 flex items-center justify-center text-sm flex-shrink-0 border border-brand-green/20">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.nickname} className="w-8 h-8 rounded-full object-cover" />
                ) : '👤'}
              </div>
              <div className="min-w-0">
                <div className="font-bold text-gray-900 text-sm truncate">{user.nickname}</div>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="flex justify-center w-full">
              <div className="w-8 h-8 rounded-full bg-brand-green/10 flex items-center justify-center text-sm border border-brand-green/20">
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
                className={`relative flex items-center space-x-3 px-4 py-2.5 text-sm transition-colors ${
                  isActive
                    ? 'bg-brand-green/5 text-brand-green font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-brand-green rounded-r-full"></div>}
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
          <Link
            href="/"
            className="flex items-center justify-center space-x-2 py-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            <span>←</span>
            {!collapsed && <span>返回前台</span>}
          </Link>
        </div>
      </aside>

      {/* ================= 右侧主区域 (包含 Topbar 和 Content) ================= */}
      <div className={`flex-1 flex flex-col min-h-screen ${collapsed ? 'ml-16' : 'ml-56'} transition-all duration-300`}>
        
        {/* 🌟 新增：Dashboard 专属 Topbar (页眉) */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-20 shadow-sm">
          {/* 左侧：品牌 Logo + 当前页面标题 */}
          <div className="flex items-center gap-6">
            {/* 品牌 Logo (柔和风格) */}
            <Link href="/dashboard" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-brand-green flex items-center justify-center text-white font-bold text-sm shadow-sm group-hover:shadow-md transition-all">
                z
              </div>
              <span className="font-bold text-gray-800 text-base tracking-tight hidden sm:block">宅基地计划</span>
            </Link>
            
            {/* 分隔线 */}
            <div className="h-5 w-px bg-gray-200 hidden sm:block"></div>
            
            {/* 当前页面标题 */}
            <h2 className="text-sm font-medium text-gray-600 hidden sm:block">{pageTitle}</h2>
          </div>

          {/* 右侧：通知 + 用户菜单 */}
          <div className="flex items-center gap-4">
            {/* 通知铃铛 */}
            <button className="relative p-2 text-gray-400 hover:text-brand-green hover:bg-brand-green/5 rounded-full transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
            </button>

            {/* 用户头像与下拉菜单 */}
            <div className="relative">
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 pl-3 pr-1 py-1 rounded-full hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200"
              >
                <div className="w-7 h-7 rounded-full bg-brand-green/10 flex items-center justify-center text-xs border border-brand-green/20">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.nickname} className="w-7 h-7 rounded-full object-cover" />
                  ) : '👤'}
                </div>
                <span className="text-sm font-medium text-gray-700 hidden sm:block">{user.nickname}</span>
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* 下拉菜单内容 */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl border border-gray-100 shadow-lg py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-2 border-b border-gray-50">
                    <p className="text-sm font-medium text-gray-900 truncate">{user.nickname}</p>
                    <p className="text-xs text-gray-500 truncate">{user.role_label}</p>
                  </div>
                  <Link 
                    href="/dashboard/profile" 
                    onClick={() => setShowUserMenu(false)}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-brand-green transition-colors"
                  >
                    👤 个人资料
                  </Link>
                  <Link 
                    href="/dashboard" 
                    onClick={() => setShowUserMenu(false)}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-brand-green transition-colors"
                  >
                    📊 我的概览
                  </Link>
                  <div className="border-t border-gray-50 my-1"></div>
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                  >
                    🚪 退出登录
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* 内容滚动区 */}
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
