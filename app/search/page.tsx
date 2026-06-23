'use client';

import { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function SearchPage() {
  const [source, setSource] = useState('official');

  return (
    <>
      <Navbar />
      <main className="pt-20 pb-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-2xl">🔍</span>
              <h1 className="text-3xl font-bold text-gray-900">资产搜索引擎</h1>
            </div>
          </div>

          {/* Filter panel */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">资产来源性质</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'official', label: '⚖️ 一手官方官源' },
                    { key: 'village', label: '🏛️ 村集体直发' },
                    { key: 'ugc', label: '👤 经纪人 UGC' },
                  ].map((s) => (
                    <button
                      key={s.key}
                      onClick={() => setSource(s.key)}
                      className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
                        source === s.key
                          ? 'bg-brand-green text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">目标区域</label>
                <select className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 outline-none focus:border-brand-green">
                  <option>不限区域</option>
                  <option>浙江省</option>
                  <option>四川省</option>
                  <option>云南省</option>
                  <option>贵州省</option>
                  <option>广西壮族自治区</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">面积范围</label>
                <select className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 outline-none focus:border-brand-green">
                  <option>不限面积</option>
                  <option>1亩以下 / 精品小院</option>
                  <option>1-5亩 / 庄园起步</option>
                  <option>5亩以上 / 产业基地</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">首付租金区间 (年)</label>
                <select className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 outline-none focus:border-brand-green">
                  <option>不限租金范围</option>
                  <option>¥6万以下 / 低预算隐居</option>
                  <option>¥6万 - ¥12万 / 中端度假</option>
                  <option>¥12万以上 / 奢野改造</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="flex items-center space-x-2 text-xs text-gray-400">
                <span className="w-2 h-2 bg-brand-green rounded-full pulse-dot"></span>
                <span>正在碰撞 D1 数据库清洗防线...</span>
              </div>
              <button className="bg-brand-green hover:bg-brand-light text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors">
                开始搜索
              </button>
            </div>
          </div>

          {/* Results placeholder */}
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-lg">请选择筛选条件后开始搜索</p>
            <p className="text-sm mt-2">支持多维初筛、全文检索、GIS围栏碰撞</p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
