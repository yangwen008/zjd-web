'use client';
import { useState, useEffect } from 'react';

interface UserInfo {
  id: number;
  nickname: string;
  role: string;
  avatar_url: string | null;
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d: any) => { if (d.success) setUser(d.user); })
      .catch(() => {})
      .finally(() => setAuthChecked(true));
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    window.location.href = '/';
  };

  const navLinks = [
    { href: '/regions', label: '🔥 热点寻源' },
    { href: '/search?source=village', label: '🏛️ 村委直发' },
    { href: '/market-index', label: '📊 流转大盘' },
    { href: '/bulk-projects', label: '🏢 大宗路演' },
    { href: '/infra-rating', label: '🛰️ 隐居基建' },
    { href: '/brokers', label: '🌾 金牌合伙人' },
  ];

  const roleDashboardLabel: Record<string, string> = {
    admin: '管理后台',
    superadmin: '管理后台',
  };

  return (
    <nav className="sticky top-0 z-40 backdrop-blur-md bg-[#F9F9F8]/90 border-b border-gray-100 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Logo */}
        <a href="/" className="flex items-center space-x-3 cursor-pointer">
          <span className="text-2xl font-black tracking-tight text-[#2C4C3B]">
            zjd<span className="text-[#D4AF37]">.cn</span>
          </span>
          <span className="text-xs bg-[#2C4C3B]/10 text-[#2C4C3B] px-2.5 py-0.5 rounded-full font-bold">
            宅基地交易所
          </span>
        </a>

        {/* Desktop Nav */}
        <div className="hidden lg:flex space-x-6 text-sm font-semibold text-gray-600">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="hover:text-[#2C4C3B] transition-all py-1 font-medium">
              {link.label}
            </a>
          ))}
        </div>

        {/* Right */}
        <div className="flex items-center space-x-3">
          
          {authChecked ? (
            user ? (
              /* 已登录：头像+昵称+下拉 */
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-brand-green/10 flex items-center justify-center text-sm border border-brand-green/20 overflow-hidden">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                    ) : '👤'}
                  </div>
                  <span className="text-sm font-medium text-gray-700 hidden sm:block max-w-[100px] truncate">{user.nickname}</span>
                  <svg className={`w-4 h-4 text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl border border-gray-100 shadow-lg py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-50">
                      <p className="text-sm font-medium text-gray-900 truncate">{user.nickname}</p>
                      <p className="text-xs text-gray-500">{roleDashboardLabel[user.role] || '用户中心'}</p>
                    </div>
                    <a href="/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-brand-green transition-colors"
                      onClick={() => setUserMenuOpen(false)}>
                      📊 {roleDashboardLabel[user.role] || '用户中心'}
                    </a>
                    <a href="/dashboard/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-brand-green transition-colors"
                      onClick={() => setUserMenuOpen(false)}>
                      👤 个人资料
                    </a>
                    {(user.role === 'admin' || user.role === 'superadmin') && (
                      <a href="/admin" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-brand-green transition-colors"
                        onClick={() => setUserMenuOpen(false)}>
                        ⚙️ 管理后台
                      </a>
                    )}
                    <div className="border-t border-gray-50 my-1"></div>
                    <button onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors">
                      🚪 退出登录
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* 未登录：登录+注册 */
              <div className="flex items-center space-x-2">
                <a href="/login" className="text-sm text-gray-600 hover:text-[#2C4C3B] font-medium transition-colors px-3 py-1.5">
                  登录
                </a>
                <a href="/register" className="bg-[#2C4C3B] text-white text-sm px-4 py-2 rounded-lg font-semibold hover:bg-[#1E3529] transition-all">
                  注册
                </a>
              </div>
            )
          ) : (
            /* 加载中：占位，防止闪现 */
            <div className="w-24 h-8 bg-gray-100 rounded-lg animate-pulse"></div>
          )}

          {/* Mobile menu button */}
          <button className="lg:hidden text-gray-600 ml-2" onClick={() => setMenuOpen(!menuOpen)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden bg-[#F9F9F8] border-t border-gray-100 px-4 py-3 space-y-1">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="block px-3 py-2 text-sm text-gray-600 hover:text-[#2C4C3B] font-medium"
              onClick={() => setMenuOpen(false)}>
              {link.label}
            </a>
          ))}
          <div className="border-t border-gray-100 mt-2 pt-2">
            {user ? (
              <>
                <a href="/dashboard" className="block px-3 py-2 text-sm text-gray-700 hover:text-[#2C4C3B] font-medium"
                  onClick={() => setMenuOpen(false)}>
                  👤 {user.nickname}
                </a>
                <button onClick={handleLogout} className="block w-full text-left px-3 py-2 text-sm text-red-500">
                  🚪 退出登录
                </button>
              </>
            ) : (
              <>
                <a href="/login" className="block px-3 py-2 text-sm text-gray-600 hover:text-[#2C4C3B] font-medium"
                  onClick={() => setMenuOpen(false)}>
                  登录
                </a>
                <a href="/register" className="block px-3 py-2 text-sm text-brand-green font-medium"
                  onClick={() => setMenuOpen(false)}>
                  注册
                </a>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
