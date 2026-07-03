'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
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

const TYPE_TABS = [
  { key: '', label: '🔍 全部', desc: '资产 + 合伙人 + 大宗' },
  { key: 'asset', label: '🏠 资产', desc: '宅基地、林地、茶园等' },
  { key: 'broker', label: '🤝 合伙人', desc: '本地金牌农房合伙人' },
  { key: 'bulk_project', label: '🏢 大宗', desc: '文旅大宗产业路演' },
];

const BADGE_STYLES: Record<string, string> = {
  '官方': 'bg-emerald-600 text-white',
  '村委': 'bg-red-600 text-white',
  '交易所': 'bg-yellow-600 text-white',
  '个人': 'bg-gray-500 text-white',
  '合伙人': 'bg-blue-600 text-white',
  '大宗': 'bg-orange-600 text-white',
};

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=400&h=300&fit=crop';
const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop';

// ============ 卡片组件 ============

function AssetResultCard({ item }: { item: SearchResult }) {
  const extra = item.extra;
  return (
    <Link href={`/asset/${item.id}`} className="block group">
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
        {/* 图片 */}
        <div className="relative h-48 overflow-hidden bg-gray-100">
          <img
            src={item.image || DEFAULT_IMAGE}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          {/* 标签 */}
          <div className="absolute top-3 left-3 flex gap-1.5">
            {item.badge && (
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${BADGE_STYLES[item.badge] || 'bg-gray-500 text-white'}`}>
                {item.badge}
              </span>
            )}
            {extra.certification === 'certified' && (
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-green-500 text-white">✓ 已确权</span>
            )}
          </div>
          {/* 浏览量 */}
          <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
            👁 {item.views.toLocaleString()}
          </div>
        </div>
        {/* 内容 */}
        <div className="p-4">
          <h3 className="font-bold text-gray-900 mb-1 line-clamp-1 group-hover:text-[#1a4731] transition-colors">
            {item.title}
          </h3>
          <p className="text-xs text-gray-400 mb-2">{item.subtitle}</p>
          {item.location && (
            <p className="text-xs text-gray-500 mb-3 flex items-center gap-1">
              📍 {item.location}
            </p>
          )}
          <div className="flex items-center justify-between">
            <span className="text-[#1a4731] font-bold text-lg">{item.price}</span>
            {extra.area_mu && (
              <span className="text-xs text-gray-400">{extra.area_mu}亩</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

function BrokerResultCard({ item }: { item: SearchResult }) {
  const extra = item.extra;
  const ratingLabel = extra.rating === 'gold' ? '🥇 金牌' : extra.rating === 'silver' ? '🥈 银牌' : '🥉 铜牌';
  const specialties = (extra.specialties as string[]) || [];

  return (
    <Link href={`/brokers/${item.id}`} className="block group">
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
        <div className="p-5">
          {/* 头像 + 基本信息 */}
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
              <img
                src={item.image || DEFAULT_AVATAR}
                alt={item.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-gray-900 truncate group-hover:text-[#1a4731] transition-colors">
                  {item.title}
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200 flex-shrink-0">
                  {ratingLabel}
                </span>
              </div>
              <p className="text-sm text-gray-500">{item.subtitle}</p>
            </div>
          </div>

          {/* 擅长领域标签 */}
          {specialties.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {specialties.slice(0, 4).map((s, i) => (
                <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                  {s}
                </span>
              ))}
            </div>
          )}

          {/* 统计 */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">{item.price}</span>
            {item.location && (
              <span className="text-xs text-gray-400">📍 {item.location}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

function BulkResultCard({ item }: { item: SearchResult }) {
  const extra = item.extra;
  return (
    <Link href={`/bulk-projects/${item.id}`} className="block group">
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
        {/* 图片 */}
        <div className="relative h-48 overflow-hidden bg-gray-100">
          <img
            src={item.image || DEFAULT_IMAGE}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute top-3 left-3 flex gap-1.5">
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-orange-600 text-white">大宗路演</span>
            {extra.certification === 'certified' && (
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-green-500 text-white">✓ 已确权</span>
            )}
          </div>
          {extra.code && (
            <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-0.5 rounded font-mono">
              {extra.code}
            </div>
          )}
          <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
            👁 {item.views.toLocaleString()}
          </div>
        </div>
        {/* 内容 */}
        <div className="p-4">
          <h3 className="font-bold text-gray-900 mb-1 line-clamp-1 group-hover:text-[#1a4731] transition-colors">
            {item.title}
          </h3>
          <p className="text-xs text-gray-400 mb-2">{item.subtitle}</p>
          {item.location && (
            <p className="text-xs text-gray-500 mb-3 flex items-center gap-1">
              📍 {item.location}
            </p>
          )}
          <div className="flex items-center justify-between">
            <span className="text-[#1a4731] font-bold text-lg">{item.price}</span>
            <div className="flex gap-2 text-xs text-gray-400">
              {extra.area_mu && <span>{extra.area_mu}亩</span>}
              {extra.yield_rate && <span className="text-green-600">{extra.yield_rate}%收益</span>}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function ResultCard({ item }: { item: SearchResult }) {
  switch (item.type) {
    case 'broker': return <BrokerResultCard item={item} />;
    case 'bulk_project': return <BulkResultCard item={item} />;
    default: return <AssetResultCard item={item} />;
  }
}

// ============ 主页面 ============

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [province, setProvince] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [geo, setGeo] = useState<GeoInfo | null>(null);
  const [geoLoading, setGeoLoading] = useState(true);

  // 统计各类型数量
  const typeCounts = results.reduce((acc, r) => {
    acc[r.type] = (acc[r.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // 搜索函数
  const doSearch = useCallback(async (q: string, type: string, p: number, prov: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (type) params.set('type', type);
      if (prov) params.set('province', prov);
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

  // 首次加载：从URL参数 + 自动搜索
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q') || '';
    const t = params.get('type') || '';
    const s = params.get('source') || '';

    if (q) setQuery(q);
    // 兼容旧的 source 参数
    if (s && !t) {
      const sourceMap: Record<string, string> = { official: 'asset', village: 'asset', ugc: 'asset' };
      setTypeFilter(sourceMap[s] || '');
    }
    if (t) setTypeFilter(t);

    setSearched(true);
    doSearch(q, t || (s ? 'asset' : ''), 1, '');
  }, [doSearch]);

  // 搜索按钮
  const handleSearch = (resetPage?: number) => {
    const p = resetPage ?? page;
    if (resetPage) setPage(resetPage);
    setSearched(true);
    doSearch(query, typeFilter, p, province);
  };

  // 类型切换
  const handleTypeChange = (type: string) => {
    setTypeFilter(type);
    setPage(1);
    setSearched(true);
    doSearch(query, type, 1, province);
  };

  // 翻页
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    doSearch(query, typeFilter, newPage, province);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <main className="pt-20 pb-16 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* 标题 + 地理位置提示 */}
        <div className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🔍</span>
              <h1 className="text-xl md:text-3xl font-bold text-gray-900">智能检索</h1>
            </div>
            {geo && geo.detected && geo.detected !== '未知' && (
              <div className="flex items-center gap-2 text-sm bg-green-50 text-green-700 px-3 py-1.5 rounded-full border border-green-200">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span>已定位：<strong>{geo.detected}</strong></span>
                <span className="text-green-500">· 本地内容优先展示</span>
              </div>
            )}
          </div>
        </div>

        {/* 搜索框 */}
        <div className="mb-6">
          <div className="flex rounded-xl shadow-lg border border-gray-200 overflow-hidden bg-white max-w-4xl">
            <div className="flex-1 flex items-center px-5 py-3">
              <svg className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch(1)}
                placeholder="搜索资产、合伙人、大宗项目… 输入城市名优先展示本地内容"
                className="w-full outline-none text-gray-700 placeholder-gray-400 bg-transparent text-base"
              />
            </div>
            <button
              onClick={() => handleSearch(1)}
              disabled={loading}
              className="bg-[#1a4731] hover:bg-[#2d5a45] text-white px-8 py-3 font-medium transition-colors disabled:opacity-50"
            >
              {loading ? '搜索中...' : '智能检索'}
            </button>
          </div>
        </div>

        {/* 类型标签页 */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {TYPE_TABS.map(tab => {
              const isActive = typeFilter === tab.key;
              const count = tab.key ? (typeCounts[tab.key] || 0) : total;
              return (
                <button
                  key={tab.key}
                  onClick={() => handleTypeChange(tab.key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-[#1a4731] text-white shadow-md'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {tab.label}
                  {searched && <span className="ml-1.5 text-xs opacity-75">({count})</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* 结果统计 + 排序提示 */}
        {searched && (
          <div className="mb-4 flex items-center justify-between text-sm text-gray-500">
            <div>
              共 <strong className="text-gray-700">{total}</strong> 条结果
              {totalPages > 1 && <span>，第 {page}/{totalPages} 页</span>}
            </div>
            {geo && geo.province && (
              <div className="text-xs text-gray-400">
                📍 {geo.province}内容已置顶 · 按相关度+地理位置综合排序
              </div>
            )}
          </div>
        )}

        {/* 搜索结果 */}
        {searched && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.length > 0 ? (
              results.map((item, i) => (
                <ResultCard key={`${item.type}-${item.id}`} item={item} />
              ))
            ) : (
              <div className="col-span-3 text-center py-16 text-gray-400">
                <div className="text-5xl mb-4">🔍</div>
                <p className="text-lg">{loading ? '正在搜索...' : '未找到匹配的结果'}</p>
                <p className="text-sm mt-2">请尝试调整关键词或筛选条件</p>
              </div>
            )}
          </div>
        )}

        {/* 分页 */}
        {searched && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => handlePageChange(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
            >
              ← 上一页
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let p: number;
              if (totalPages <= 7) p = i + 1;
              else if (page <= 4) p = i + 1;
              else if (page >= totalPages - 3) p = totalPages - 6 + i;
              else p = page - 3 + i;
              return (
                <button
                  key={p}
                  onClick={() => handlePageChange(p)}
                  className={`w-9 h-9 text-sm rounded-lg ${
                    page === p ? 'bg-[#1a4731] text-white' : 'bg-white border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
            >
              下一页 →
            </button>
          </div>
        )}

        {/* 未搜索时的引导 */}
        {!searched && (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-lg">输入关键词开始智能检索</p>
            <p className="text-sm mt-2">搜索资产、合伙人、大宗项目，本地内容优先展示</p>
          </div>
        )}
      </div>
    </main>
  );
}
