'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface Professional {
  id: number;
  prof_type: string;
  name: string;
  org_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  province: string | null;
  city: string | null;
  services: string | null;
  pricing_model: string;
  price_min: number | null;
  price_max: number | null;
  rating: number;
  review_count: number;
  order_count: number;
  verified: number;
}

interface ServiceItem {
  name: string;
  price: string;
  duration: string;
}

const TYPE_TABS = [
  { key: '', label: '全部', icon: '🏢' },
  { key: 'notary', label: '公证处', icon: '📋' },
  { key: 'lawyer', label: '律师', icon: '⚖️' },
  { key: 'fengshui', label: '风水师', icon: '🏔️' },
];

const TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  notary: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  lawyer: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  fengshui: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
};

function parseServices(json: string | null): ServiceItem[] {
  if (!json) return [];
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

function PriceRange({ min, max }: { min: number | null; max: number | null }) {
  if (!min && !max) return <span className="text-gray-400">价格面议</span>;
  if (min && max && min !== max) return <span>¥{min}-{max}元</span>;
  if (min) return <span>¥{min}元起</span>;
  return <span>¥{max}元以内</span>;
}

export default function ServicesPage() {
  const [activeType, setActiveType] = useState('');
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [province, setProvince] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('rating');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeType) params.set('type', activeType);
      if (province) params.set('province', province);
      if (search) params.set('search', search);
      params.set('sort', sort);
      params.set('page', String(page));
      params.set('limit', '20');

      const res = await fetch(`/api/professionals?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setProfessionals(data.data || []);
        setTotal(data.pagination?.total || 0);
      }
    } catch { setProfessionals([]); }
    finally { setLoading(false); }
  }, [activeType, province, search, sort, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    fetch('/api/professionals?stats=1')
      .then(r => r.json())
      .then(d => { if (d.success) setStats(d.stats); })
      .catch(() => {});
  }, []);

  return (
    <main className="pt-20 pb-16 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            🛡️ 交易服务中心
          </h1>
          <p className="text-gray-500">专业公证、法律咨询、风水勘察，为您的乡村资产交易保驾护航</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {TYPE_TABS.slice(1).map(t => (
            <button
              key={t.key}
              onClick={() => { setActiveType(activeType === t.key ? '' : t.key); setPage(1); }}
              className={`bg-white rounded-xl p-4 border transition-all text-left ${
                activeType === t.key ? 'border-brand-green shadow-md' : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              <div className="text-2xl mb-1">{t.icon}</div>
              <div className="text-sm text-gray-500">{t.label}</div>
              <div className="text-xl font-bold text-gray-900">{stats[t.key] || 0}</div>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6 flex flex-wrap gap-3 items-center">
          {/* Type Tabs */}
          <div className="flex gap-1">
            {TYPE_TABS.map(t => (
              <button
                key={t.key}
                onClick={() => { setActiveType(t.key); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeType === t.key
                    ? 'bg-brand-green text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t.icon} {t.label}
                {t.key && stats[t.key] !== undefined && (
                  <span className="ml-1 text-xs opacity-70">({stats[t.key]})</span>
                )}
              </button>
            ))}
          </div>

          <div className="flex-1" />

          {/* Sort */}
          <select
            value={sort}
            onChange={e => { setSort(e.target.value); setPage(1); }}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white"
          >
            <option value="rating">评分最高</option>
            <option value="order_count">服务最多</option>
            <option value="price_min">价格最低</option>
          </select>

          {/* Search */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { setPage(1); fetchData(); } }}
              placeholder="搜索服务商..."
              className="pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg w-48"
            />
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-16 text-gray-400">加载中...</div>
        ) : professionals.length > 0 ? (
          <>
            <div className="text-sm text-gray-400 mb-4">
              共 <strong className="text-gray-700">{total}</strong> 位服务商
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {professionals.map(p => {
                const colors = TYPE_COLORS[p.prof_type] || TYPE_COLORS.notary;
                const services = parseServices(p.services);
                const typeLabel = TYPE_TABS.find(t => t.key === p.prof_type);

                return (
                  <Link
                    key={p.id}
                    href={`/services/${p.id}`}
                    className="bg-white rounded-xl border border-gray-100 hover:border-brand-green hover:shadow-lg transition-all overflow-hidden group"
                  >
                    {/* Top section */}
                    <div className="p-5">
                      <div className="flex items-start gap-3 mb-3">
                        {/* Avatar */}
                        <div className={`w-12 h-12 rounded-full ${colors.bg} flex items-center justify-center text-xl flex-shrink-0`}>
                          {typeLabel?.icon || '👤'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-gray-900 truncate">{p.name}</h3>
                            {p.verified === 1 && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">已认证</span>
                            )}
                          </div>
                          {p.org_name && (
                            <p className="text-xs text-gray-500 truncate">{p.org_name}</p>
                          )}
                        </div>
                      </div>

                      {/* Bio */}
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {p.bio || '暂无简介'}
                      </p>

                      {/* Services preview */}
                      {services.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {services.slice(0, 3).map((s, i) => (
                            <span key={i} className={`text-xs px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                              {s.name}
                            </span>
                          ))}
                          {services.length > 3 && (
                            <span className="text-xs text-gray-400">+{services.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Bottom section */}
                    <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-yellow-500">⭐ {p.rating.toFixed(1)}</span>
                        <span className="text-gray-400">{p.review_count} 评价</span>
                        <span className="text-gray-400">{p.order_count} 单</span>
                      </div>
                      <div className="text-sm font-medium text-brand-green">
                        <PriceRange min={p.price_min} max={p.price_max} />
                      </div>
                    </div>

                    {/* Location */}
                    <div className="px-5 py-2 text-xs text-gray-400 flex items-center gap-1">
                      📍 {p.province}{p.city ? `·${p.city}` : ''}
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Pagination */}
            {Math.ceil(total / 20) > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page <= 1}
                  className="px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
                >
                  ← 上一页
                </button>
                <span className="px-3 py-2 text-sm text-gray-500">
                  {page} / {Math.ceil(total / 20)}
                </span>
                <button
                  onClick={() => setPage(Math.min(Math.ceil(total / 20), page + 1))}
                  disabled={page >= Math.ceil(total / 20)}
                  className="px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
                >
                  下一页 →
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-lg">暂无匹配的服务商</p>
            <p className="text-sm mt-2">请尝试调整筛选条件</p>
          </div>
        )}
      </div>
    </main>
  );
}
