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
    <section className="bg-gradient-to-b from-gray-50 to-white py-20">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">
          寻找被低估的 <span className="text-[#1a4731] italic">低密度空间资产</span>
        </h1>
        <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
          乡村资产数字化绿色流转中枢。全网多源产权低频提纯，一键交叉碰撞，让技术重归山川。
        </p>
        
        <div className="max-w-2xl mx-auto mb-6">
          <div className="flex bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="flex-1 flex items-center px-6 py-4">
              <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              <input 
                type="text" 
                placeholder="输入你想隐居的城市、地块特色或寻找本地合伙人..." 
                className="w-full outline-none text-gray-700 placeholder-gray-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
              />
            </div>
            <button 
              onClick={handleSearch}
              className="bg-[#1a4731] hover:bg-[#2d5a45] text-white px-8 py-4 font-medium transition-colors"
            >
              智能检索
            </button>
          </div>
        </div>

        <div className="flex justify-center gap-8 text-sm text-gray-600">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            全网合规收录：<strong className="text-[#1a4731]">{totalAssets}</strong> 宗
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            今日村委直售/官派提纯上新：<strong className="text-[#1a4731]">{todayNew}</strong> 宗
          </span>
        </div>
      </div>
    </section>
  );
}
