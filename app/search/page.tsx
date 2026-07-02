'use client';

import { useState, useEffect, useCallback } from 'react';
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
  images: string | null;
  certification: string;
}

const GRADIENTS = [
  'from-emerald-800 to-emerald-600',
  'from-teal-800 to-teal-600',
  'from-cyan-800 to-cyan-600',
  'from-green-800 to-green-600',
  'from-lime-800 to-lime-600',
  'from-stone-800 to-stone-600',
];

import { getFirstImage } from '@/lib/image-compress';

const SOURCE_BADGES: Record<string, string> = {
  official: '官方',
  village: '村委',
  ugc: '个人',
};

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
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // 页码变化时重新搜索
  const handlePageChange = useCallback(async (newPage: number) => {
    setPage(newPage);
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (source) params.set('source', source);
      if (province) params.set('province', province);
      if (city) params.set('city', city);
      if (searchQuery) params.set('search', searchQuery);
      if (sort) params.set('sort', sort);
      params.set('limit', '30');
      params.set('page', String(newPage));
      const res = await fetch(`/api/assets?${params.toString()}`);
      const data: any = await res.json();
      setResults(data.data || []);
      setTotal(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch { setResults([]); } finally { setLoading(false); }
  }, [source, province, city, searchQuery, sort]);

  // 首次加载自动搜索（从 URL 参数或默认加载全部）
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    const s = params.get('source');
    const sortParam = params.get('sort') || '';
    if (s) setSource(s);
    if (q) setSearchQuery(q);
    if (sortParam) setSort(sortParam);

    // 构建查询参数
    const p = new URLSearchParams();
    if (s) p.set('source', s);
    if (q) p.set('search', q);
    if (sortParam) p.set('sort', sortParam);
    p.set('limit', '20');

    setSearched(true);
    setLoading(true);
    p.set('limit', '30');
    fetch(`/api/assets?${p.toString()}`)
      .then((r) => r.json())
      .then((d: any) => { setResults(d.data || []); setTotal(d.pagination?.total || 0); setTotalPages(d.pagination?.totalPages || 1); })
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
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
      if (sort) params.set('sort', sort);
      params.set('limit', '30');
      params.set('page', String(page));

      const res = await fetch(`/api/assets?${params.toString()}`);
      const data: any = await res.json();
      setResults(data.data || []);
      setTotal(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 1);
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
              <h1 className="text-xl md:text-3xl font-bold text-gray-900">资产搜索引擎</h1>
            </div>
          </div>

          {/* 统一筛选面板 */}
          <FilterPanel
            showRegion
            province={province}
            city={city}
            onProvinceChange={(v) => { setProvince(v); setPage(1); }}
            onCityChange={(v) => { setCity(v); setPage(1); }}
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
                onChange: (v) => { setSource(v); setPage(1); },
              },
            ]}
            resultCount={searched ? total : undefined}
            resultLabel="宗资产"
            className="mb-6"
          />

          {/* 搜索按钮 + 结果统计 */}
          <div className="mb-6 flex items-center justify-between">
            {searched && total > 0 && (
              <div className="text-sm text-gray-400">
                共 <strong className="text-gray-700">{total}</strong> 条结果
                {totalPages > 1 && <span>，第 {page}/{totalPages} 页</span>}
              </div>
            )}
            <button
              onClick={() => { setPage(1); handleSearch(); }}
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
                    imageUrl={getFirstImage(asset.images)}
                    badge={((asset as any).publisher_role === 'project_publisher') ? '交易所' : SOURCE_BADGES[asset.source_type]}
                    certification={asset.certification}
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

          {/* 分页 */}
          {searched && totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => handlePageChange(Math.max(1, page - 1))}
                disabled={page <= 1
                className="px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
              >
                ← 上一页
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let p: number;
                if (totalPages <= 7) {
                  p = i + 1;
                } else if (page <= 4) {
                  p = i + 1;
                } else if (page >= totalPages - 3) {
                  p = totalPages - 6 + i;
                } else {
                  p = page - 3 + i;
                }
                return (
                  <button
                    key={p}
                    onClick={() => handlePageChange(p)
                    className={`w-9 h-9 text-sm rounded-lg ${
                      page === p ? 'bg-brand-green text-white' : 'bg-white border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages
                className="px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
              >
                下一页 →
              </button>
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
