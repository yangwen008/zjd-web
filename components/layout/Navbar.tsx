'use client';

import { useState } from 'react';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { href: '#hot', label: '🔥 热点寻源' },
    { href: '/market-index', label: '📊 流转大盘' },
    { href: '/search', label: '🔍 资产搜索' },
    { href: '/bulk-projects', label: '🏢 大宗路演' },
    { href: '/infra-rating', label: '🛰️ 隐居基建' },
    { href: '/brokers', label: '🌾 金牌合伙人' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-brand-dark/95 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center space-x-3 cursor-pointer">
          <div className="w-8 h-8 rounded-lg bg-brand-green flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <span className="text-white font-bold text-lg tracking-tight">zjd.cn</span>
            <span className="text-gray-400 text-xs ml-1">金禾计划 v8.8.1</span>
          </div>
        </a>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center space-x-1">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-all"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Right */}
        <div className="flex items-center space-x-3">
          <a href="/admin" className="hidden sm:block text-xs text-gray-400 hover:text-white transition-colors">
            后台管理
          </a>
          <button className="bg-brand-green hover:bg-brand-light text-white text-sm px-4 py-2 rounded-full transition-all flex items-center space-x-1.5">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM12.503 18.115c-.126 0-.251-.013-.376-.013-1.093 0-2.14.222-3.104.621l-1.662.973a.244.244 0 01-.121.04.22.22 0 01-.217-.221c0-.051.02-.102.035-.152l.285-1.079a.438.438 0 00-.156-.487C5.57 16.406 4.5 14.66 4.5 12.744c0-3.194 3.03-5.786 6.766-5.786 3.735 0 6.765 2.592 6.765 5.786s-3.03 5.371-5.528 5.371z" />
            </svg>
            <span>微信安全登录</span>
          </button>
          {/* Mobile menu button */}
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

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-brand-dark border-t border-white/10 px-4 py-3 space-y-1">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="block px-3 py-2 text-sm text-gray-300 hover:text-white rounded-lg"
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
