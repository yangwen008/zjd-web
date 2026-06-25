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
    // zjd.cn 使用浅灰白背景 + 毛玻璃效果
    <nav className="sticky top-0 z-40 backdrop-blur-md bg-[#F9F9F8]/90 border-b border-gray-100 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Logo 区域 */}
        <a href="/" className="flex items-center space-x-3 cursor-pointer">
          {/* zjd 用深绿，.cn 用金色 */}
          <span className="text-2xl font-black tracking-tight text-[#2C4C3B]">
            zjd<span className="text-[#D4AF37]">.cn</span>
          </span>
          <span className="text-xs bg-[#2C4C3B]/10 text-[#2C4C3B] px-2.5 py-0.5 rounded-full font-bold">
            宅基地计划 v8.8.1
          </span>
        </a>

        {/* Desktop Nav */}
        <div className="hidden lg:flex space-x-8 text-sm font-semibold text-gray-600">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="hover:text-[#2C4C3B] transition-all py-1 font-medium"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Right */}
        <div className="flex items-center space-x-4">
          <a href="/admin" className="hidden sm:block text-xs text-gray-400 hover:text-gray-600 transition-colors font-medium">
            后台管理
          </a>
          
          {/* 登录按钮 - 深绿色实心 */}
          <button className="bg-[#2C4C3B] text-white text-sm px-5 py-2.5 rounded-lg font-semibold shadow-sm flex items-center space-x-2 hover:bg-[#1E3529] transition-all">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM12.503 18.115c-.126 0-.251-.013-.376-.013-1.093 0-2.14.222-3.104.621l-1.662.973a.244.244 0 01-.121.04.22.22 0 01-.217-.221c0-.051.02-.102.035-.152l.285-1.079a.438.438 0 00-.156-.487C5.57 16.406 4.5 14.66 4.5 12.744c0-3.194 3.03-5.786 6.766-5.786 3.735 0 6.765 2.592 6.765 5.786s-3.03 5.371-5.528 5.371z" />
            </svg>
            <span>微信安全登录</span>
          </button>

          {/* Mobile menu button */}
          <button
            className="lg:hidden text-gray-600"
            onClick={() => setMenuOpen(!menuOpen)}
          >
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
            <a
              key={link.href}
              href={link.href}
              className="block px-3 py-2 text-sm text-gray-600 hover:text-[#2C4C3B] font-medium"
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
