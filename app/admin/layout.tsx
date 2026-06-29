'use client';

import { useState, useEffect } from 'react';

const NAV_ITEMS = [
  { icon: '📊', label: '运营控制台', href: '/admin' },
  { icon: '🏠', label: '资产审核', href: '/admin/assets' },
  { icon: '🏢', label: '大宗路演', href: '/admin/bulk-projects' },
  { icon: '💰', label: '行情数据', href: '/admin/market-data' },
  { icon: '📡', label: '基建评分', href: '/admin/infra-ratings' },
  { icon: '🗺️', label: '行政区划', href: '/admin/regions' },
  { icon: '🏷️', label: '资产类型', href: '/admin/asset-types' },
  { icon: '🤝', label: '合伙人管理', href: '/admin/brokers' },
  { icon: '🕷️', label: '爬虫管理', href: '/admin/scrapers' },
  { icon: '📥', label: '暂存数据', href: '/admin/staging' },
  { icon: '⚙️', label: '全局配置', href: '/admin/config' },
];

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
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green"
            autoFocus
          />
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-green hover:bg-brand-light text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
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

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/admin/auth')
      .then((r) => r.json())
      .then((data: any) => setAuthed(data.authenticated))
      .catch(() => setAuthed(false));
  }, []);

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

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`${collapsed ? 'w-16' : 'w-56'} bg-brand-dark text-white transition-all duration-300 flex flex-col`}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
          {!collapsed && <span className="font-bold text-sm">🔧 后台管理</span>}
          <button onClick={() => setCollapsed(!collapsed)} className="text-gray-400 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={collapsed ? 'M9 5l7 7-7 7' : 'M15 19l-7-7 7-7'} />
            </svg>
          </button>
        </div>
        <nav className="flex-1 py-4 space-y-1 px-2">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <span className="text-lg">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </a>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <a href="/" className="flex items-center space-x-2 text-xs text-gray-400 hover:text-white">
            <span>←</span>
            {!collapsed && <span>返回前台</span>}
          </a>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6 overflow-auto">
        {children}
      </main>
    </div>
  );
}
