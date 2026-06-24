
'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import AssetCard from '@/components/shared/AssetCard';

interface Asset {
  id: number;
  title: string;
  location: string | null;
  area_mu: number | null;
  price_year: number | null;
  asset_type: string | null;
  source_type: string;
  views: number;
}

const GRADIENTS = [
  'from-emerald-800 to-emerald-600',
  'from-teal-800 to-teal-600',
  'from-cyan-800 to-cyan-600',
  'from-green-800 to-green-600',
  'from-lime-800 to-lime-600',
  'from-stone-800 to-stone-600',
];

function formatPrice(price: number | null): string {
  if (!price) return '价格面议';
  return `¥${price}万/年起`;
}

export default function SearchPage() {
  const [source, setSource] = useState('official');
  const [province, setProvince] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // 从 URL 参数读取初始搜索词
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    const s = params.get('source');
    if (q) setSearchQuery(q);
    if (s) setSource(s);
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    setSearched(true);
    try {
      const params = new URLSearchParams();
      if (source) params.set('source', source);
      if (province) params.set('province', province);
      if (searchQuery) params.set('search', searchQuery);
      params.set('limit', '20');

      const res = await fetch(`/api/assets?${params.toString()}`);
      const data: any = await res.json();
      setResults(data.data || []);
    } catch (err) {
      console.error('Search failed:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

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
                <select
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 outline-none focus:border-brand-green"
                >
                  <option value="">不限区域</option>
                  <option value="浙江省">浙江省</option>
                  <option value="四川省">四川省</option>
                  <option value="云南省">云南省</option>
                  <option value="贵州省">贵州省</option>
                  <option value="广西壮族自治区">广西壮族自治区</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">关键词搜索</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="输入标题、地点、类型..."
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 outline-none focus:border-brand-green"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="w-full bg-brand-green hover:bg-brand-light text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {loading ? '搜索中...' : '开始搜索'}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="flex items-center space-x-2 text-xs text-gray-400">
                <span className="w-2 h-2 bg-brand-green rounded-full pulse-dot"></span>
                <span>正在碰撞 D1 数据库清洗防线...</span>
              </div>
            </div>
          </div>

          {/* Results */}
          {searched && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.length > 0 ? (
                results.map((asset, i) => (
                  <AssetCard
                    key={asset.id}
                    rank={i + 1}
                    title={asset.title}
                    subtitle={asset.location || asset.asset_type || ''}
                    views={asset.views}
                    price={formatPrice(asset.price_year)}
                    gradient={GRADIENTS[i % GRADIENTS.length]}
                    href={`/asset/${asset.id}`}
                  />
                ))
              ) : (
                <div className="col-span-3 text-center py-16 text-gray-400">
                  <div className="text-5xl mb-4">🔍</div>
                  <p className="text-lg">{loading ? '正在搜索...' : '未找到匹配的资产'}</p>
                  <p className="text-sm mt-2">请尝试调整筛选条件或关键词</p>
                </div>
              )}
            </div>
          )}

          {!searched && (
            <div className="text-center py-16 text-gray-400">
              <div className="text-5xl mb-4">🔍</div>
              <p className="text-lg">请选择筛选条件后开始搜索</p>
              <p className="text-sm mt-2">支持多维初筛、全文检索、GIS围栏碰撞</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
