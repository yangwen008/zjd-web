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
];

function formatPrice(price: number | null): string {
  if (!price) return '价格面议';
  return `¥${price}万/年起`;
}

export default function SearchPage() {
  const [source, setSource] = useState('');
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // 从 URL 参数读取初始搜索词并自动搜索
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    const s = params.get('source');
    if (s) setSource(s);
    if (q) {
      setSearchQuery(q);
      // 延迟触发搜索，等 state 更新
      setTimeout(() => {
        const p = new URLSearchParams();
        if (s) p.set('source', s);
        p.set('search', q);
        p.set('limit', '20');
        setSearched(true);
        setLoading(true);
        fetch(`/api/assets?${p.toString()}`)
          .then((r) => r.json())
          .then((d: any) => setResults(d.data || []))
          .catch(() => setResults([]))
          .finally(() => setLoading(false));
      }, 0);
    }
  }, []);

  const handleSearch = async (query?: string) => {
    const q = query || searchQuery;
    setLoading(true);
    setSearched(true);
    try {
      const params = new URLSearchParams();
      if (source) params.set('source', source);
      if (province) params.set('province', province);
      if (city) params.set('city', city);
      if (q) params.set('search', q);
      params.set('limit', '20');

      const res = await fetch(`/api/assets?${params.toString()}`);
      const data: any = await res.json();
      setResults(data.data || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <main className="pt-20 pb-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-2xl">🔍</span>
              <h1 className="text-3xl font-bold text-gray-900">资产搜索引擎</h1>
            </div>
          </div>

          {/* 统一筛选面板 */}
          <FilterPanel
            showRegion
            province={province}
            city={city}
            onProvinceChange={setProvince}
            onCityChange={setCity}
            showSearch
            searchValue={searchQuery}
            onSearchChange={(q) => { setSearchQuery(q); if (q) handleSearch(q); }}
            searchPlaceholder="输入标题、地点、类型..."
            filterGroups={[
              {
                label: '资产来源',
                options: [
                  { key: 'official', label: '⚖️ 官方' },
                  { key: 'village', label: '🏛️ 村委' },
                  { key: 'ugc', label: '👤 UGC' },
                ],
                value: source,
                onChange: (v) => { setSource(v); },
              },
            ]}
            resultCount={searched ? results.length : undefined}
            resultLabel="宗资产"
            className="mb-6"
          />

          {/* 搜索按钮 */}
          <div className="mb-6 flex justify-end">
            <button
              onClick={() => handleSearch()}
              disabled={loading}
              className="bg-brand-green hover:bg-brand-light text-white px-8 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {loading ? '搜索中...' : '开始搜索'}
            </button>
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
              <p className="text-sm mt-2">支持多维初筛、全文检索</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
