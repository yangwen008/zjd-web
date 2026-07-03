'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import AssetCard from '@/components/shared/AssetCard';
import FilterPanel from '@/components/shared/FilterPanel';
import { getFirstImage } from '@/lib/image-compress';

// ============ 类型定义 ============

interface SearchResult {
  type: 'asset' | 'broker' | 'bulk_project';
  id: number;
  title: string;
  subtitle: string;
  location: string | null;
  province: string | null;
  city: string | null;
  image: string | null;
  price: string | null;
  badge: string | null;
  views: number;
  score: number;
  extra: Record<string, unknown>;
}

interface GeoInfo {
  detected: string;
  province: string;
  city: string;
  country: string;
}

// ============ 常量 ============

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

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop';

// ============ 合伙人卡片（复用 AssetCard 风格）============

function BrokerCardStyled({ item, rank }: { item: SearchResult; rank: number }) {
  const extra = item.extra;
  const ratingLabel = extra.rating === 'gold' ? '🥇 金牌' : extra.rating === 'silver' ? '🥈 银牌' : '🥉 铜牌';
  const specialties = (extra.specialties as string[]) || [];
  const gradient = GRADIENTS[rank % GRADIENTS.length];

  return (
    <Link href={`/brokers/${item.id}`} className="block group">
      <div className={`relative rounded-xl overflow-hidden bg-gradient-to-br ${gradient} p-5 text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`}>
        {/* 排名徽章 */}
        {rank <= 3 && (
          <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-sm font-bold">
            {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
          </div>
        )}
        <div className="flex items-center gap-4 mb-3">
          <div className="w-14 h-14 rounded-full overflow-hidden bg-white/20 flex-shrink-0 border-2 border-white/30">
            <img src={item.image || DEFAULT_AVATAR} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg truncate">{item.title}</h3>
            <p className="text-sm text-white/80">{item.subtitle}</p>
          </div>
        </div>
        {specialties.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {specialties.slice(0, 3).map((s, i) => (
              <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm">{s}</span>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/90">{item.price}</span>
          <span className="text-white/70 text-xs">🤝 合伙人</span>
        </div>
      </div>
    </Link>
  );
}

// ============ 大宗卡片（复用 AssetCard 风格）============

function BulkCardStyled({ item, rank }: { item: SearchResult; rank: number }) {
  const extra = item.extra;
  const gradient = GRADIENTS[(rank + 3) % GRADIENTS.length];

  return (
    <Link href={`/bulk-projects/${item.id}`} className="block group">
      <div className={`relative rounded-xl overflow-hidden bg-gradient-to-br ${gradient} p-5 text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`}>
        {/* 排名徽章 */}
        {rank <= 3 && (
          <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-sm font-bold">
            {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
          </div>
        )}
        <div className="flex items-start justify-between mb-2">
          <div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm mb-2 inline-block">🏢 大宗路演</span>
            {extra.code && <span className="ml-2 text-xs text-white/60 font-mono">{String(extra.code)}</span>}
          </div>
          {extra.certification === 'certified' && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-green-400/30">✓ 已确权</span>
          )}
        </div>
        <h3 className="font-bold text-lg mb-1 line-clamp-2">{item.title}</h3>
        <p className="text-sm text-white/70 mb-3 line-clamp-1">{item.location || item.subtitle}</p>
        <div className="flex items-center justify-between text-sm">
          <span className="font-bold text-lg">{item.price}</span>
          <div className="flex gap-3 text-white/70 text-xs">
            {extra.area_mu != null && <span>{String(extra.area_mu)}亩</span>}
            {extra.yield_rate != null && <span className="text-green-200">{String(extra.yield_rate)}%</span>}
            <span>👁 {item.views.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ============ 主页面 ============

export default function SmartSearchPage() {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [geo, setGeo] = useState<GeoInfo | null>(null);

  // 统计各类型数量
  const typeCounts = results.reduce((acc, r) => {
    acc[r.type] = (acc[r.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // 搜索函数
  const doSearch = useCallback(async (q: string, type: string, p: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (type) params.set('type', type);
      params.set('page', String(p));
      params.set('limit', '30');

      const res = await fetch(`/api/smart-search?${params.toString()}`);
      const data: any = await res.json();

      if (data.success) {
        setResults(data.data || []);
        setTotal(data.pagination?.total || 0);
        setTotalPages(data.pagination?.totalPages || 1);
        if (data.geo) setGeo(data.geo);
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // 首次加载
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q') || '';
    if (q) setQuery(q);
    setSearched(true);
    doSearch(q, '', 1);
  }, [doSearch]);

  // 搜索按钮
  const handleSearch = (p?: number) => {
    const currentPage = p ?? page;
    if (p) setPage(p);
    setSearched(true);
    doSearch(query, typeFilter, currentPage);
  };

  // 类型切换
  const handleTypeChange = (type: string) => {
    setTypeFilter(type);
    setPage(1);
    setSearched(true);
    doSearch(query, type, 1);
  };

  // 翻页
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    doSearch(query, typeFilter, newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 渲染单个结果卡片
  const renderCard = (item: SearchResult, index: number) => {
    const rank = (page - 1) * 30 + index + 1;

    if (item.type === 'broker') {
      return <BrokerCardStyled key={`broker-${item.id}`} item={item} rank={rank} />;
    }
    if (item.type === 'bulk_project') {
      return <BulkCardStyled key={`bulk-${item.id}`} item={item} rank={rank} />;
    }

    // asset — 使用热点寻源同款 AssetCard
    const extra = item.extra;
    return (
      <AssetCard
        key={`asset-${item.id}`}
        rank={rank}
        title={item.title}
        subtitle={item.location || (extra.asset_type as string) || ''}
        views={item.views}
        price={item.price || '价格面议'}
        gradient={GRADIENTS[index % GRADIENTS.length]}
        imageUrl={item.image}
        badge={item.badge || undefined}
        certification={extra.certification as string}
        href={`/asset/${item.id}`}
      />
    );
  };

  return (
    <main className="pt-20 pb-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* 标题 */}
        <div className="mb-6">
          <h1 className="text-xl md:text-3xl font-bold text-gray-900 mb-2">🔍 智能检索</h1>
          <p className="text-gray-500">
            全站内容联合搜索，输入城市名优先展示本地资产、合伙人、大宗项目。
            {geo && geo.detected && geo.detected !== '未知' && (
              <span className="ml-2 text-green-600 font-medium">📍 已定位：{geo.detected}，本地内容优先</span>
            )}
          </p>
        </div>

        {/* 搜索筛选面板（复用 FilterPanel） */}
        <FilterPanel
          showRegion={false}
          showSearch
          searchValue={query}
          onSearchChange={setQuery}
          searchPlaceholder="搜索资产、合伙人、大宗项目… 输入城市名优先展示本地内容"
          filterGroups={[
            {
              label: '内容类型',
              options: [
                { key: '', label: '🔍 全部' },
                { key: 'asset', label: '🏠 资产' },
                { key: 'broker', label: '🤝 合伙人' },
                { key: 'bulk_project', label: '🏢 大宗' },
              ],
              value: typeFilter,
              onChange: (v) => handleTypeChange(v),
            },
          ]}
          resultCount={searched ? total : undefined}
          resultLabel="条结果"
          className="mb-3"
        />

        {/* 搜索按钮 + 结果统计 */}
        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center flex-wrap gap-2 text-sm">
            {searched && total > 0 && (
              <>
                <span className="text-gray-400">
                  共 <strong className="text-gray-700">{total}</strong> 条结果
                  {totalPages > 1 && <>，第 {page}/{totalPages} 页</>}
                </span>
                {/* 类型统计 */}
                {typeFilter === '' && (
                  <>
                    <span className="text-gray-300">|</span>
                    {typeCounts.asset && <span className="text-xs text-gray-400">🏠 {typeCounts.asset} 资产</span>}
                    {typeCounts.broker && <span className="text-xs text-gray-400">🤝 {typeCounts.broker} 合伙人</span>}
                    {typeCounts.bulk_project && <span className="text-xs text-gray-400">🏢 {typeCounts.bulk_project} 大宗</span>}
                  </>
                )}
              </>
            )}
          </div>

          <button
            onClick={() => handleSearch(1)}
            disabled={loading}
            className="bg-brand-green hover:bg-brand-light text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {loading ? '搜索中...' : '🔍 智能检索'}
          </button>
        </div>

        {/* 结果列表 */}
        {searched && (
          loading ? (
            <div className="text-center py-16 text-gray-400">
              <div className="w-8 h-8 border-2 border-brand-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p>搜索中...</p>
            </div>
          ) : results.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.map((item, i) => renderCard(item, i))}
              </div>

              {/* 分页 */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => handlePageChange(Math.max(1, page - 1))}
                    disabled={page <= 1}
                    className="px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
                  >← 上一页</button>
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    let p: number;
                    if (totalPages <= 7) p = i + 1;
                    else if (page <= 4) p = i + 1;
                    else if (page >= totalPages - 3) p = totalPages - 6 + i;
                    else p = page - 3 + i;
                    return (
                      <button key={p} onClick={() => handlePageChange(p)} className={`w-9 h-9 text-sm rounded-lg ${page === p ? 'bg-brand-green text-white' : 'bg-white border border-gray-200 hover:bg-gray-50'}`}>{p}</button>
                    );
                  })}
                  <button
                    onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
                    disabled={page >= totalPages}
                    className="px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
                  >下一页 →</button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16 text-gray-400">
              <div className="text-5xl mb-4">🔍</div>
              <p className="text-lg">未找到匹配的结果</p>
              <p className="text-sm mt-2">请尝试调整关键词</p>
            </div>
          )
        )}
      </div>
    </main>
  );
}
