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
      
      {/* 【修改1】: 移除深色背景(bg-brand-dark)和全屏高度，改为浅色渐变背景和合适的内边距 */}
      <section className="relative bg-gradient-to-b from-gray-50 to-white py-20">
        
        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
          
          {/* 【修改2】: 标题颜色从白色(text-white)改为深灰色(text-gray-900)，强调词添加斜体(italic) */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight tracking-tight">
            {title.split(/(低密度空间资产)/).map((part, i) =>
              part === '低密度空间资产' ? (
                <span key={i} className="text-brand-accent italic">{part}</span>
              ) : (
                <span key={i}>{part}</span>
              )
            )}
          </h1>
          
          {/* 【修改3】: 副标题颜色从浅灰(text-gray-300)改为更浅的灰色(text-gray-500) */}
          <p className="text-gray-500 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
            {subtitle}
          </p>

          {/* 【修改4】: 搜索框从圆角矩形(rounded-2xl)改为胶囊形(rounded-full) */}
          <div className="relative max-w-2xl mx-auto bg-white rounded-full shadow-lg border border-gray-100 p-2 flex items-center mb-8">
            <div className="flex items-center pl-4 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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
            {/* 【修改5】: 按钮也改为胶囊形(rounded-full)，并增加 margin 让它看起来像悬浮在右侧 */}
            <button
              onClick={handleSearch}
              className="bg-brand-green hover:bg-brand-light text-white px-6 py-3 rounded-full font-medium transition-colors mx-1"
            >
              智能检索
            </button>
          </div>

          {/* 【修改6】: 统计信息调整：数字改为深色(text-gray-800)，圆点统一为品牌绿(bg-brand-accent)，添加竖线分隔 */}
          <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
            <span className="inline-flex items-center gap-2">
              <span className="inline-block w-2 h-2 bg-brand-accent rounded-full"></span>
              <span>全网合规收录: <strong className="text-gray-800 font-semibold">{Number(totalAssets).toLocaleString()}</strong> 宗</span>
            </span>
            <span className="text-gray-300">|</span>
            <span className="inline-flex items-center gap-2">
              <span className="inline-block w-2 h-2 bg-brand-accent rounded-full"></span>
              <span>今日村委直营/官源提纯上新: <strong className="text-gray-800 font-semibold">{todayNew}</strong> 宗</span>
            </span>
          </div>
        </div>
      </section>
    </>
  );
}
