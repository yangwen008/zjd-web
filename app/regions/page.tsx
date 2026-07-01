'use client';

import { useState, useEffect } from 'react';
import AssetCard from '@/components/shared/AssetCard';
import FilterPanel from '@/components/shared/FilterPanel';

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
  'from-sky-800 to-sky-600',
  'from-rose-800 to-rose-600',
  'from-indigo-800 to-indigo-600',
];

function formatPrice(price: number | null): string {
  if (!price) return '价格面议';
  return `¥${price}万/年起`;
}

export default function RegionsPage() {
  // 搜索筛选状态
  const [source, setSource] = useState('');
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // 热门排行状态
  const [hotAssets, setHotAssets] = useState<Asset[]>([]);
  const [hotLoading, setHotLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'views' | 'price'>('views');

  // 加载热门资产
  useEffect(() => {
    fetch(`/api/assets?limit=20${sortBy === 'price' ? '&sort=price' : ''}`)
      .then((r) => r.json())
      .then((d: any) => setHotAssets(d.data || []))
      .catch(() => {})
      .finally(() => setHotLoading(false));
  }, [sortBy]);

  const handleSearch = async () => {
    setLoading(true);
    setSearched(true);
    try {
      const params = new URLSearchParams();
      if (source) params.set('source', source);
      if (province) params.set('province', province);
      if (city) params.set('city', city);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      params.set('limit', '30');

      const res = await fetch(`/api/assets?${params.toString()}`);
      const data: any = await res.json();
      setResults(data.data || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const totalViews = hotAssets.reduce((sum, a) => sum + a.views, 0);
  const displayAssets = searched ? results : hotAssets;

  return (
    <main className="pt-20 pb-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* 标题 */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🔥 热点寻源大厅</h1>
          <p className="text-gray-500">实时观测全网投资商、买家的点击行为，按访问量自动加权降序推荐。支持多维筛选、全文检索。</p>
        </div>

        {/* 搜索筛选面板 */}
        <FilterPanel
          showRegion
          province={province}
          city={city}
          onProvinceChange={(v) => { setProvince(v); setCity(''); }}
          onCityChange={setCity}
          showSearch
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="输入标题、地点、类型..."
          filterGroups={[
            {
              label: '资产来源',
              options: [
                { key: '', label: '全部' },
                { key: 'official', label: '⚖️ 官方' },
                { key: 'village', label: '🏛️ 村委' },
                { key: 'ugc', label: '👤 UGC' },
              ],
              value: source,
              onChange: setSource,
            },
          ]}
          resultCount={searched ? results.length : hotAssets.length}
          resultLabel="宗资产"
          className="mb-3"
        />

        {/* 排序 + 搜索按钮 */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm">
            {!searched ? (
              <>
                <span className="text-gray-400">今日总浏览: <strong className="text-gray-900">{totalViews.toLocaleString()}</strong></span>
                <span className="text-gray-300">|</span>
                <button
                  onClick={() => setSortBy('views')}
                  className={`px-3 py-1 rounded-full text-xs transition-colors ${sortBy === 'views' ? 'bg-brand-green text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  🔥 按点击量
                </button>
                <button
                  onClick={() => setSortBy('price')}
                  className={`px-3 py-1 rounded-full text-xs transition-colors ${sortBy === 'price' ? 'bg-brand-green text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  💰 按起价
                </button>
              </>
            ) : (
              <button
                onClick={() => { setSearched(false); setSource(''); setProvince(''); setCity(''); setSearchQuery(''); }}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ← 清除筛选，回到热门排行
              </button>
            )}
          </div>

          <button
            onClick={handleSearch}
            disabled={loading}
            className="bg-brand-green hover:bg-brand-light text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {loading ? '搜索中...' : '🔍 搜索'}
          </button>
        </div>

        {/* 资产列表 */}
        {searched ? (
          // 搜索结果
          results.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((asset, i) => (
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
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400">
              <div className="text-5xl mb-4">🔍</div>
              <p className="text-lg">{loading ? '正在搜索...' : '未找到匹配的资产'}</p>
              <p className="text-sm mt-2">请尝试调整筛选条件或关键词</p>
            </div>
          )
        ) : (
          // 热门排行
          hotLoading ? (
            <div className="text-center py-16 text-gray-400">
              <div className="w-8 h-8 border-2 border-brand-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p>加载中...</p>
            </div>
          ) : hotAssets.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {hotAssets.map((asset, i) => (
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
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400">
              <div className="text-5xl mb-4">🔥</div>
              <p className="text-lg">暂无热度数据</p>
            </div>
          )
        )}
      </div>
    </main>
  );
}
