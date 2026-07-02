'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import FilterPanel from '@/components/shared/FilterPanel';

interface Broker {
  id: number;
  name: string;
  region: string;
  province: string | null;
  city: string | null;
  bio: string | null;
  specialties: string | null;
  rating: string;
  show_count: number;
  good_rate: number;
  avatar_url: string | null;
  status: string;
  created_at: string;
}

const RATING_STYLES: Record<string, { label: string; className: string }> = {
  gold: { label: '⭐ 金牌', className: 'bg-yellow-100 text-yellow-700' },
  silver: { label: '🥈 银牌', className: 'bg-gray-100 text-gray-600' },
  bronze: { label: '🥉 铜牌', className: 'bg-orange-50 text-orange-600' },
};

function parseSpecialties(json: string | null): string[] {
  if (!json) return [];
  try { return JSON.parse(json); } catch { return []; }
}

export default function BrokersPage() {
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // 筛选状态
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [rating, setRating] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'show_count' | 'good_rate' | 'rating'>('show_count');
  const [page, setPage] = useState(1);

  // 省份/城市列表
  const [provinces, setProvinces] = useState<{ name: string; emoji: string | null; broker_count: number }[]>([]);
  const [cities, setCities] = useState<string[]>([]);

  // 加载省份列表
  useEffect(() => {
    fetch('/api/brokers?action=provinces')
      .then((r) => r.json())
      .then((d: any) => setProvinces(d.data || []))
      .catch(() => {});
  }, []);

  // 省份变化时加载城市
  useEffect(() => {
    if (!province) { setCities([]); setCity(''); return; }
    fetch(`/api/brokers?action=cities&province=${encodeURIComponent(province)}`)
      .then((r) => r.json())
      .then((d: any) => setCities(d.data || []))
      .catch(() => {});
    setCity('');
  }, [province]);

  // 查询数据
  const fetchBrokers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (province) params.set('province', province);
      if (city) params.set('city', city);
      if (rating) params.set('rating', rating);
      if (search) params.set('search', search);
      params.set('sort', sort);
      params.set('page', String(page));
      params.set('limit', '20');

      const res = await fetch(`/api/brokers?${params.toString()}`);
      const data = await res.json() as any;
      setBrokers(data.data || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch {
      setBrokers([]);
    } finally {
      setLoading(false);
    }
  }, [province, city, rating, search, sort, page]);

  useEffect(() => { fetchBrokers(); }, [fetchBrokers]);

  // 搜索防抖
  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  return (
    <main className="pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-2xl">🌾</span>
          <h1 className="text-xl md:text-3xl font-bold text-gray-900">全国核验实名&ldquo;农房合伙人&rdquo;名录墙</h1>
        </div>
        <p className="text-gray-500">通过地面合伙人陪同签约、法务鉴证，打通乡村房产流转最后一公里。</p>
        <p className="text-sm text-gray-400 mt-1">共 {total.toLocaleString()} 位合伙人</p>
      </div>

      {/* 筛选面板 */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* 省份 */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">省份</label>
            <select
              value={province}
              onChange={(e) => { setProvince(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 outline-none focus:border-brand-green"
            >
              <option value="">全部省份</option>
              {provinces.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.emoji ? `${p.emoji} ` : ''}{p.name}{p.broker_count > 0 ? ` (${p.broker_count})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* 城市 */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">城市</label>
            <select
              value={city}
              onChange={(e) => { setCity(e.target.value); setPage(1); }}
              disabled={!province}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 outline-none focus:border-brand-green disabled:opacity-50"
            >
              <option value="">{province ? '全部城市' : '请先选择省份'}</option>
              {cities.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* 评级 */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">评级</label>
            <div className="flex gap-2">
              {[
                { key: '', label: '全部' },
                { key: 'gold', label: '⭐金牌' },
                { key: 'silver', label: '🥈银牌' },
                { key: 'bronze', label: '🥉铜牌' },
              ].map((r) => (
                <button
                  key={r.key}
                  onClick={() => { setRating(r.key); setPage(1); }}
                  className={`px-2 py-1.5 text-xs rounded-lg transition-colors ${
                    rating === r.key ? 'bg-brand-green text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* 搜索 */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">搜索</label>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="姓名、区域、简介..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 outline-none focus:border-brand-green"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className="w-2 h-2 bg-brand-green rounded-full"></span>
            <span>
              {province ? `${province}` : '全国'}
              {city ? ` · ${city}` : ''}
              {rating ? ` · ${RATING_STYLES[rating]?.label || rating}` : ''}
              {search ? ` · 搜索"${search}"` : ''}
              {' → '}{total} 位合伙人
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-400">排序：</span>
            {[
              { key: 'show_count' as const, label: '带看量↓' },
              { key: 'good_rate' as const, label: '好评率↓' },
              { key: 'rating' as const, label: '评级↓' },
            ].map((s) => (
              <button
                key={s.key}
                onClick={() => { setSort(s.key); setPage(1); }}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  sort === s.key ? 'bg-brand-green text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 列表 */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">加载中...</div>
      ) : brokers.length > 0 ? (
        <div className="space-y-3">
          {brokers.map((b) => {
            const ratingStyle = RATING_STYLES[b.rating] || RATING_STYLES.bronze;
            const specs = parseSpecialties(b.specialties);
            return (
              <Link
                key={b.id}
                href={`/brokers/${b.id}`}
                className="block bg-white rounded-xl p-5 border border-gray-100 hover:border-brand-green/30 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-brand-green/10 flex items-center justify-center text-xl md:text-2xl flex-shrink-0">
                    {b.avatar_url ? (
                      <img src={b.avatar_url} alt={b.name} className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover" />
                    ) : '👨‍🌾'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mb-1">
                      <span className="font-bold text-gray-900 text-base md:text-lg">{b.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${ratingStyle.className}`}>
                        {ratingStyle.label}
                      </span>
                      <span className="text-xs text-gray-400">📍 {b.region}</span>
                    </div>
                    <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs md:text-sm text-gray-500 mb-1">
                      <span>带看 <strong className="text-gray-700">{b.show_count}</strong> 次</span>
                      <span>好评率 <strong className="text-brand-green">{b.good_rate}%</strong></span>
                      <span className="hidden sm:inline">入驻 {new Date(b.created_at).getFullYear()}</span>
                    </div>
                    {b.bio && <div className="text-xs text-gray-400 line-clamp-2">{b.bio}</div>}
                    {specs.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {specs.slice(0, 3).map((s) => (
                          <span key={s} className="bg-brand-green/10 text-brand-green text-xs px-2 py-0.5 rounded-full">{s}</span>
                        ))}
                        {specs.length > 3 && <span className="text-xs text-gray-400">+{specs.length - 3}</span>}
                      </div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0 hidden sm:block">
                    <div className="text-sm font-bold text-brand-green">查看主页 →</div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400 bg-white rounded-xl border border-gray-100">
          <div className="text-5xl mb-4">🌾</div>
          <p className="text-lg">未找到匹配的合伙人</p>
          <p className="text-sm mt-2">请尝试调整筛选条件</p>
        </div>
      )}

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
          >
            ← 上一页
          </button>
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            const p = i + 1;
            return (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-9 h-9 text-sm rounded-lg ${
                  page === p ? 'bg-brand-green text-white' : 'bg-white border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {p}
              </button>
            );
          })}
          {totalPages > 7 && <span className="text-gray-400">...</span>}
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
          >
            下一页 →
          </button>
        </div>
      )}
      </div>
    </main>
  );
}
