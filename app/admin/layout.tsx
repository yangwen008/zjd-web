'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link'; // 【修复点 2】：引入 Link 组件，解决页面刷新导致的闪烁问题

// ==========================================
// 1. 菜单配置 (V5.0 分组折叠版)
// ==========================================
const NAV_GROUPS = [
  {
    title: '工作台',
    items: [
      { icon: '', label: '运营控制台', href: '/admin' },
    ],
  },
  {
    title: '资产与业务',
    items: [
      { icon: '🏠', label: '资产审核', href: '/admin/assets' },
      { icon: '🏢', label: '大宗路演', href: '/admin/bulk-projects' },
      { icon: '💰', label: '行情数据', href: '/admin/market-data' },
      { icon: '📡', label: '基建评分', href: '/admin/infra-ratings' },
    ],
  },
  {
    title: '系统与数据',
    items: [
      { icon: '🗺️', label: '行政区划', href: '/admin/regions' },
      { icon: '🏷️', label: '资产类型', href: '/admin/asset-types' },
      { icon: '️', label: '爬虫管理', href: '/admin/scrapers' },
      { icon: '📥', label: '暂存数据', href: '/admin/staging' },
    ],
  },
  {
    title: '用户与配置',
    items: [
      { icon: '🤝', label: '合伙人管理', href: '/admin/brokers' },
      { icon: '👥', label: '用户管理', href: '/admin/users' },
      { icon: '⚙️', label: '全局配置', href: '/admin/config' },
    ],
  },
];

// ==========================================
// 2. 登录页组件
// ==========================================
function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data: any = await res.json();
      if (data.success) {
        onLogin();
      } else {
        setError(data.error || '密码错误');
      }
    } catch {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm border border-gray-100">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🔐</div>
          <h1 className="text-xl font-bold text-gray-900">宅基地管理平台</h1>
          <p className="text-sm text-gray-500 mt-1">请输入管理密码</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="管理密码"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green transition-all"
            autoFocus
          />
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-green hover:bg-brand-light text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-50 shadow-sm"
          >
            {loading ? '验证中...' : '登录'}
          </button>
        </form>
        <a href="/" className="block text-center text-sm text-gray-400 hover:text-gray-600 mt-4">
          ← 返回首页
        </a>
      </div>
    </div>
  );
}

// ==========================================
// 3. 主 Layout 组件 (V5.1 浅色侧边栏 + Link 修复版)
// ==========================================
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch('/api/admin/auth')
      .then((r) => r.json())
      .then((data: any) => setAuthed(data.authenticated))
      .catch(() => setAuthed(false));
  }, []);

  useEffect(() => {
    const initialExpanded: Record<string, boolean> = {};
    NAV_GROUPS.forEach(group => {
      const isActive = group.items.some(item => 
        item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href)
      );
      if (isActive) initialExpanded[group.title] = true;
    });
    setExpandedGroups(initialExpanded);
  }, [pathname]);

  const toggleGroup = (title: string) => {
    if (collapsed) return;
    setExpandedGroups(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const getBreadcrumbs = () => {
    const crumbs = [{ name: '控制台', href: '/admin' }];
    for (const group of NAV_GROUPS) {
      const activeItem = group.items.find(item => 
        item.href === '/admin' ? pathname === '/admin' : pathname === item.href || pathname.startsWith(item.href + '/')
      );
      if (activeItem) {
        crumbs.push({ name: activeItem.label, href: activeItem.href });
        break;
      }
    }
    return crumbs;
  };

  if (authed === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 flex items-center gap-2">
          <div className="w-5 h-5 border-2 border-brand-green border-t-transparent rounded-full animate-spin"></div>
          加载中...
        </div>
      </div>
    );
  }

  if (!authed) {
    return <LoginPage onLogin={() => setAuthed(true)} />;
  }

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="fixed inset-0 z-50 flex bg-gray-50/80 font-sans text-gray-900">
      
      {/* ================= 左侧侧边栏 (🌟 改为浅色主题，对比度极高) ================= */}
      <aside className={`${collapsed ? 'w-20' : 'w-64'} bg-white text-gray-700 transition-all duration-300 ease-in-out flex flex-col shadow-lg z-20 border-r border-gray-200`}>
        {/* Logo 区 */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-gray-100">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <span className="text-xl">🏠</span>
              <span className="font-bold text-base tracking-wide text-gray-900">宅基地管理平台</span>
            </div>
          )}
          {collapsed && <span className="text-xl mx-auto">🏠</span>}
          <button 
            onClick={() => setCollapsed(!collapsed)} 
            className="text-gray-400 hover:text-gray-900 transition-colors p-1 rounded hover:bg-gray-100"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={collapsed ? 'M9 5l7 7-7 7' : 'M15 19l-7-7 7-7'} />
            </svg>
          </button>
        </div>

        {/* 菜单列表 */}
        <nav className="flex-1 py-4 space-y-1 px-3 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
          {NAV_GROUPS.map((group) => {
            const isExpanded = expandedGroups[group.title] || false;
            return (
              <div key={group.title} className="mb-2">
                {/* 分组标题 */}
                <button
                  onClick={() => toggleGroup(group.title)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-600 hover:bg-gray-50 transition-all ${collapsed ? 'justify-center' : ''}`}
                  title={collapsed ? group.title : ''}
                >
                  {!collapsed && <span>{group.title}</span>}
                  {!collapsed && (
                    <span className={`text-[10px] transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`}>▶</span>
                  )}
                </button>

                {/* 子菜单 */}
                {!collapsed && isExpanded && (
                  <div className="mt-1 space-y-1">
                    {group.items.map((item) => {
                      const isActive = item.href === '/admin' 
                        ? pathname === '/admin' 
                        : pathname === item.href || pathname.startsWith(item.href + '/');

                      return (
                        <Link // 【修复点 2】：使用 Link 替代 a 标签，实现无刷新跳转，彻底消灭页眉闪烁
                          key={item.href}
                          href={item.href}
                          className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group relative ${
                            isActive 
                              ? 'bg-brand-green/10 text-brand-green font-medium' 
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                          }`}
                        >
                          {/* Active 左侧指示条 */}
                          {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-brand-green rounded-r-full"></div>}
                          
                          {/* 图标底座 */}
                          <span className={`flex items-center justify-center w-7 h-7 rounded-md text-base transition-colors ${
                            isActive ? 'bg-brand-green/20' : 'bg-gray-100 group-hover:bg-gray-200'
                          }`}>
                            {item.icon}
                          </span>
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* 底部返回前台 */}
        <div className="p-4 border-t border-gray-100">
          <a href="/" className={`flex items-center space-x-2 text-xs text-gray-400 hover:text-gray-900 transition-colors ${collapsed ? 'justify-center' : ''}`}>
            <span>←</span>
            {!collapsed && <span>返回前台</span>}
          </a>
        </div>
      </aside>

      {/* ================= 右侧主区域 ================= */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* 顶部工具栏 (Topbar) */}
        <header className="h-16 bg-white border-b border-gray-200/60 flex items-center justify-between px-6 shadow-sm z-10">
          {/* 左侧：面包屑 */}
          <nav className="flex items-center text-sm text-gray-500">
            {breadcrumbs.map((crumb, index) => (
              <div key={crumb.href} className="flex items-center">
                {index > 0 && <span className="mx-2 text-gray-300">/</span>}
                <Link 
                  href={crumb.href}
                  className={`transition-colors ${index === breadcrumbs.length - 1 ? 'text-gray-900 font-semibold' : 'hover:text-brand-green'}`}
                >
                  {crumb.name}
                </Link>
              </div>
            ))}
          </nav>

          {/* 右侧：工具区 */}
          <div className="flex items-center gap-4">
            {/* 全局搜索框 */}
            <div className="relative hidden md:block">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
              <input 
                type="text" 
                placeholder="搜索资产、用户..." 
                className="pl-9 pr-12 py-1.5 w-64 bg-gray-100 border border-transparent rounded-lg text-sm focus:outline-none focus:bg-white focus:border-brand-green focus:ring-1 focus:ring-brand-green transition-all"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 bg-white px-1.5 py-0.5 rounded border border-gray-200">⌘K</span>
            </div>

            {/* 通知铃铛 */}
            <button className="relative p-2 text-gray-500 hover:text-brand-green hover:bg-gray-100 rounded-full transition-colors">
              <span className="text-lg">🔔</span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
            </button>

            {/* 管理员信息 */}
            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-green to-emerald-600 flex items-center justify-center text-white text-sm font-bold shadow-md">
                A
              </div>
              <div className="hidden md:block text-sm">
                <p className="font-semibold text-gray-900 leading-tight">超级管理员</p>
                <p className="text-xs text-gray-500 leading-tight">宅基地管理</p>
              </div>
              <button 
                onClick={() => {
                  document.cookie = "admin_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                  window.location.reload();
                }}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors" 
                title="退出登录"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        {/* 内容滚动区 (灰底白卡) */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
          
          {/* 极简底部版权 */}
          <div className="mt-10 pt-6 border-t border-gray-200/60 text-center text-xs text-gray-400">
            © 2026 宅基地管理平台 v8.8.2 · 乡村闲置资产数字交易所
          </div>
        </main>
      </div>
    </div>
  );
}
