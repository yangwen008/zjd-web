'use client';

import { useState } from 'react';
import WeChatModal from './WeChatModal';

interface HeroSectionProps {
  title: string;
  subtitle: string;
  totalAssets: string;
  todayNew: string;
}

export default function HeroSection({ title, subtitle, totalAssets, todayNew }: HeroSectionProps) {
  const [wechatOpen, setWechatOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = () => {
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <>
      <WeChatModal isOpen={wechatOpen} onClose={() => setWechatOpen(false)} />

      <section className="relative min-h-screen flex items-center justify-center pt-16 bg-brand-dark">
        <div className="absolute inset-0 hero-gradient"></div>
        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center py-20">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight tracking-tight">
            {title.split(/(低密度空间资产)/).map((part, i) =>
              part === '低密度空间资产' ? (
                <span key={i} className="text-brand-accent">{part}</span>
              ) : (
                <span key={i}>{part}</span>
              )
            )}
          </h1>
          <p className="text-gray-300 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
            {subtitle}
          </p>

          {/* Search */}
          <div className="relative max-w-2xl mx-auto bg-white rounded-2xl shadow-2xl p-2 flex items-center mb-6">
            <div className="flex items-center pl-4 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="搜索区域、资产类型、关键词..."
              className="flex-1 px-4 py-3 text-gray-700 text-base outline-none bg-transparent"
            />
            <button
              onClick={handleSearch}
              className="bg-brand-green hover:bg-brand-light text-white px-6 py-3 rounded-xl font-medium transition-colors"
            >
              智能检索
            </button>
          </div>

          <div className="flex items-center justify-center space-x-2 text-xs text-gray-400 font-mono">
            <span className="inline-block w-2 h-2 bg-green-400 rounded-full pulse-dot"></span>
            <span>全网合规收录: <strong className="text-white">{Number(totalAssets).toLocaleString()}</strong> 宗</span>
            <span className="text-gray-600">|</span>
            <span>今日村委直营/官源提纯上新: <strong className="text-green-400">{todayNew}</strong> 宗</span>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent"></div>
      </section>
    </>
  );
}
