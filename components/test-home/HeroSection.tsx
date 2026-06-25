"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface HeroSectionProps {
  totalAssets?: string;
  todayNew?: string;
}

export default function HeroSection({ totalAssets = '104,281', todayNew = '142' }: HeroSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    // 1. 增加上下间距 py-16 -> py-20
    <section className="bg-gradient-to-b from-gray-50 to-white py-20">
      <div className="max-w-6xl mx-auto px-4 text-center">
        
        {/* 2. 增加标题下边距 mb-4 -> mb-6，强调词颜色改为更亮的品牌绿 #4a8c6a */}
        <h1 className="text-5xl md:text-6xl text-gray-900 mb-6">
          寻找被低估的 <span className="text-[#4a8c6a] italic">低密度空间资产</span>
        </h1>
        
        {/* 3. 副标题颜色变浅 text-gray-600 -> text-gray-500，修复无效类名 max-w-1xl -> max-w-2xl */}
        <p className="text-lg text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
          乡村资产数字化绿色流转中枢。全网多源产权低频提纯，一键交叉碰撞，让技术重归山川。
        </p>
        
        <div className="max-w-2xl mx-auto mb-8">
          {/* 4. 搜索框变成胶囊形 rounded-2xl -> rounded-full，边框变浅 */}
          <div className="flex bg-white rounded-full shadow-lg border border-gray-100 overflow-hidden">
            <div className="flex-1 flex items-center px-6 py-4">
              <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              <input 
                type="text" 
                placeholder="输入你想隐居的城市、地块特色或寻找本地合伙人..." 
                className="w-full outline-none text-gray-700 placeholder-gray-400 bg-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
              />
            </div>
            {/* 5. 按钮也变成胶囊形，颜色改为深绿 #2C4C3B，增加内边距让它悬浮在右侧 */}
            <button 
              onClick={handleSearch}
              className="bg-[#2C4C3B] hover:bg-[#1a4731] text-white px-8 py-3 font-medium transition-colors rounded-full mx-2 my-2"
            >
              智能检索
            </button>
          </div>
        </div>

        {/* 6. 统计信息：文字变浅，数字变深灰加粗，圆点统一为绿色，中间加竖线 */}
        <div className="flex justify-center items-center gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-[#4a8c6a] rounded-full"></span>
            全网合规收录：<strong className="text-gray-800 font-semibold">{totalAssets}</strong> 宗
          </span>
          <span className="text-gray-300">|</span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-[#4a8c6a] rounded-full"></span>
            今日村委直售/官派提纯上新：<strong className="text-gray-800 font-semibold">{todayNew}</strong> 宗
          </span>
        </div>
      </div>
    </section>
  );
}
