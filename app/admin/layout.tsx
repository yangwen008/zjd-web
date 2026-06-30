'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

// ==========================================
// 1. 菜单配置 (V3.0 分组折叠版 - 纯字母图标)
// ==========================================
const NAV_GROUPS = [
  {
    title: '工作台',
    letter: 'W',
    color: 'bg-blue-500/20 text-blue-400',
    items: [
      { name: '数据大盘', href: '/admin', letter: 'D', color: 'bg-blue-500/10 text-blue-300' },
      { name: '大宗撮合池', href: '/admin/deals', letter: 'M', color: 'bg-purple-500/10 text-purple-300' },
    ],
  },
  {
    title: '资产运营',
    letter: 'A',
    color: 'bg-emerald-500/20 text-emerald-400',
    items: [
      { name: '资产审核', href: '/admin/assets', letter: 'A', color: 'bg-emerald-500/10 text-emerald-300' },
      { name: '线索/意向', href: '/admin/leads', letter: 'L', color: 'bg-cyan-500/10 text-cyan-300' },
    ],
  },
  {
    title: '用户与渠道',
    letter: 'U',
    color: 'bg-amber-500/20 text-amber-400',
    items: [
      { name: '全量用户', href: '/admin/users', letter: 'U', color: 'bg-amber-500/10 text-amber-300' },
      { name: '大宗认证', href: '/admin/vip-audit', letter: 'V', color: 'bg-rose-500/10 text-rose-300' },
      { name: '合伙人绩效', href: '/admin/partners', letter: 'P', color: 'bg-indigo-500/10 text-indigo-300' },
    ],
  },
  {
    title: '数据与爬虫',
    letter: 'D',
    color: 'bg-orange-500/20 text-orange-400',
    items: [
      { name: '爬虫任务', href: '/admin/scrapers', letter: 'S', color: 'bg-slate-500/10 text-slate-300' },
      { name: '原始数据池', href: '/admin/raw-data', letter: 'R', color: 'bg-orange-500/10 text-orange-300' },
      { name: 'AI 清洗日志', href: '/admin/ai-logs', letter: 'I', color: 'bg-pink-500/10 text-pink-300' },
    ],
  },
  {
    title: '系统设置',
    letter: 'S',
    color: 'bg-gray-500/20 text-gray-400',
    items: [
      { name: '数据字典', href: '/admin/dict', letter: 'T', color: 'bg-teal-500/10 text-teal-300' },
      { name: 'R2/API 配置', href: '/admin/config', letter: 'C', color: 'bg-lime-500/10 text-lime-300' },
      { name: '操作审计', href: '/admin/logs', letter: 'G', color: 'bg-gray-500/10 text-gray-300' },
    ],
  },
];

// ==========================================
// 2. 登录页组件 (完全保留您的原始逻辑)
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
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🔐</div>
          <h1 className="text-xl font-bold text-gray-900">后台管理</h1>
          <p className="text-sm text-gray-500 mt-1">请输入管理密码</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="管理密码"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
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
// 3. 主 Layout 组件 (集成所有高级 UI)
// ==========================================
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // 检查登录状态 (保留您的原始逻辑)
  useEffect(() => {
    fetch('/api/admin/auth')
      .then((r) => r.json())
      .then((data: any) => setAuthed(data.authenticated))
      .catch(() => setAuthed(false));
  }, []);

  // 根据当前路由，自动展开对应的菜单分组
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

  // 计算面包屑
  const getBreadcrumbs = () => {
    const crumbs = [{ name: '控制台', href: '/admin' }];
    for (const group of NAV_GROUPS) {
      const activeItem = group.items.find(item => 
        item.href === '/admin' ? pathname === '/admin' : pathname === item.href || pathname.startsWith(item.href + '/')
      );
      if (activeItem) {
        crumbs.push({ name: activeItem.name, href: activeItem.href });
        break;
      }
    }
    return crumbs;
  };

  if (authed === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400">加载中...</div>
      </div>
    );
  }

  if (!authed) {
    return <LoginPage onLogin={() => setAuthed(true)} />;
  }

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* ================= 左侧侧边栏 ================= */}
      <aside className={`${collapsed ? 'w-16' : 'w-64'} bg-slate-900 text-white transition-all duration-300 flex flex-col shadow-lg`}>
        {/* Logo 区 */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
          {!collapsed && <span className="font-bold text-lg tracking-wide">金禾 Admin</span>}
          <button onClick={() => setCollapsed(!collapsed)} className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={collapsed ? 'M9 5l7 7-7 7' : 'M15 19l-7-7 7-7'} />
            </svg>
          </button>
        </div>

        {/* 菜单列表 */}
        <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
          {NAV_GROUPS.map((group) => {
            const isExpanded = expandedGroups[group.title] || false;
            return (
              <div key={group.title} className="mb-2">
                {/* 分组标题 */}
                <button
                  onClick={() => toggleGroup(group.title)}
                  className={`w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-800 transition-colors ${collapsed ? 'justify-center' : ''}`}
                  title={collapsed ? group.title : ''}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${group.color}`}>
                      {group.letter}
                    </div>
                    {!collapsed && <span className="text-sm font-medium text-slate-200">{group.title}</span>}
                  </div>
                  {!collapsed && (
                    <span className={`text-slate-500 text-xs transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>▶</span>
                  )}
                </button>

                {/* 子菜单 */}
                {!collapsed && isExpanded && (
                  <div className="mt-1 ml-3 space-y-1 border-l border-slate-800 pl-2">
                    {group.items.map((item) => {
                      const isActive = item.href === '/admin' 
                        ? pathname === '/admin' 
                        : pathname === item.href || pathname.startsWith(item.href + '/');

                      return (
                        <a
                          key={item.href}
                          href={item.href}
                          className={`flex items-center gap-3 px-2 py-1.5 rounded-md text-sm transition-all ${
                            isActive 
                              ? 'bg-slate-800 text-white border-l-2 border-blue-500 -ml-[9px] pl-[11px]' 
                              : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${item.color}`}>
                            {item.letter}
                          </div>
                          <span>{item.name}</span>
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* 底部返回前台 */}
        <div className="p-4 border-t border-slate-800">
          <a href="/" className={`flex items-center gap-2 text-xs text-slate-400 hover:text-white ${collapsed ? 'justify-center' : ''}`}>
            <span>←</span>
            {!collapsed && <span>返回前台</span>}
          </a>
        </div>
      </aside>

      {/* ================= 右侧主区域 ================= */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 顶部工具栏 */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm z-10">
          {/* 左侧：面包屑 */}
          <nav className="flex items-center text-sm text-gray-500">
            {breadcrumbs.map((crumb, index) => (
              <div key={crumb.href} className="flex items-center">
                {index > 0 && <span className="mx-2 text-gray-300">/</span>}
                <span className={index === breadcrumbs.length - 1 ? 'text-gray-900 font-medium' : ''}>
                  {crumb.name}
                </span>
              </div>
            ))}
          </nav>

          {/* 右侧：用户信息 */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-md">
              A
            </div>
            <div className="hidden md:block text-sm">
              <p className="font-medium text-gray-900 leading-tight">超级管理员</p>
              <p className="text-xs text-gray-500 leading-tight">金禾计划</p>
            </div>
            <button 
              onClick={() => {
                // 简单的退出逻辑：清除 cookie 并刷新
                document.cookie = "admin_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                window.location.reload();
              }}
              className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-red-500 transition-colors text-lg leading-none" 
              title="退出登录"
            >
              ⏻
            </button>
          </div>
        </header>

        {/* 内容区 */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
