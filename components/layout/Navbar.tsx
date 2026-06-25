'use client';

import { useState } from 'react';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { href: '/regions', label: '🔥 热点寻源' },
    { href: '/market-index', label: '📊 流转大盘' },
    { href: '/search', label: '🔍 资产搜索' },
    { href: '/bulk-projects', label: '🏢 大宗路演' },
    { href: '/infra-rating', label: '🛰️ 隐居基建' },
    { href: '/brokers', label: '🌾 金牌合伙人' },
  ];

  return (
    // 【修改1】：背景改为极深的纯粹墨绿色（去掉透明度），边框稍微明显一点，增加质感
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0d1611] border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Logo 区域 */}
        <a href="/" className="flex items-center space-x-3 cursor-pointer">
          {/* 【修改2】：图标背景改为淡金色透明，图标本身改为金色 */}
          <div className="w-8 h-8 rounded-lg bg-[#c9a84c]/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-[#c9a84c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex items-baseline">
            {/* 【修改3】：zjd.cn 改为高级的金色，字号稍微加大加粗 */}
            <span className="text-[#c9a84c] font-bold text-xl tracking-tight">zjd.cn</span>
            <span className="text-gray-500 text-xs ml-2 font-medium">金禾计划 v8.8.1</span>
          </div>
        </a>

        {/* Desktop Nav (桌面端菜单) */}
        <div className="hidden md:flex items-center space-x-1">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              // 【修改4】：菜单文字改为浅灰，hover 时变白，背景加上极淡的白色过渡，字体加粗一点点
              className="px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-md transition-all font-medium"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Right (右侧区域) */}
        <div className="flex items-center space-x-4">
          <a href="/admin" className="hidden sm:block text-xs text-gray-500 hover:text-white transition-colors font-medium">
            后台管理
          </a>
          
          {/* 【修改5】：登录按钮改为高级的“白色描边”样式，hover 时反色（白底深绿字），极具质感 */}
          <button className="border border-white/30 text-white text-sm px-5 py-2 rounded-full hover:bg-white hover:text-[#0d1611] transition-all flex items-center space-x-1.5 font-medium">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM12.503 18.115c-.126 0-.251-.013-.376-.013-1.093 0-2.14.222-3.104.621l-1.662.973a.244.244 0 01-.121.04.22.22 0 01-.217-.221c0-.051.02-.102.035-.152l.285-1.079a.438.438 0 00-.156-.487C5.57 16.406 4.5 14.66 4.5 12.744c0-3.194 3.03-5.786 6.766-5.786 3.735 0 6.765 2.592 6.765 5.786s-3.03 5.371-5.528 5.371z" />
            </svg>
            <span>微信安全登录</span>
          </button>

          {/* Mobile menu button (移动端菜单按钮) */}
          <button
            className="md:hidden text-white"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu (移动端下拉菜单) */}
      {menuOpen && (
        // 【修改6】：移动端背景也统一为极深墨绿色
        <div className="md:hidden bg-[#0d1611] border-t border-white/10 px-4 py-3 space-y-1">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="block px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-md font-medium"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
}
