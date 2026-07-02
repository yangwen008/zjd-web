'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { getFirstImage } from '@/lib/image-compress';

interface Asset {
  id: number;
  title: string;
  description: string | null;
  location: string | null;
  province: string | null;
  city: string | null;
  area_mu: number | null;
  price_year: number | null;
  lease_years: number | null;
  asset_type: string | null;
  source_type: string;
  views: number;
  images: string | null;
  contact_name: string | null;
  certification: string;
}

function formatPrice(price: number | null): string {
  if (!price) return '价格面议';
  return `¥${price}万/年`;
}

export default function VillagePage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchAssets = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('source', 'village');
      params.set('page', String(p));
      params.set('limit', '30');
      const res = await fetch(`/api/assets?${params.toString()}`);
      const data: any = await res.json();
      setAssets(data.data || []);
      setTotal(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch {
      setAssets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssets(page);
  }, [page, fetchAssets]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <main className="pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-2">
            <span className="bg-red-600 text-white px-2 py-1 rounded text-xs font-bold">VILLAGE DIRECT</span>
            <span className="text-2xl">🏛️</span>
            <h1 className="text-xl md:text-3xl font-bold text-gray-900">村集体直发专区</h1>
          </div>
          <p className="text-gray-500">村委官方直售，已完成确权排查，产权清晰、流转合规。</p>
        </div>

        {/* 结果统计 */}
        {total > 0 && (
          <div className="mb-6 text-sm text-gray-400">
            共 <strong className="text-gray-700">{total}</strong> 宗村委直发资产
            {totalPages > 1 && <span>，第 {page}/{totalPages} 页</span>}
          </div>
        )}

        {loading ? (
          <div className="text-center py-16 text-gray-400">
            <div className="w-8 h-8 border-2 border-brand-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p>加载中...</p>
          </div>
        ) : assets.length > 0 ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {assets.map((asset) => {
                const imageUrl = getFirstImage(asset.images);
                return (
                  <Link key={asset.id} href={`/asset/${asset.id}`} className="group bg-white rounded-2xl overflow-hidden card-hover flex flex-col md:flex-row border border-gray-100">
                    <div className="md:w-2/5 relative">
                      <img src={imageUrl} alt={asset.title} className="w-full h-64 md:h-full object-cover image-zoom" />
                      <div className="absolute top-3 left-3 bg-red-600 px-2 py-1 rounded text-xs font-bold text-white">村委官方直售</div>
                      {asset.certification === 'certified' && (
                        <div className="absolute top-3 right-3 bg-green-600 px-2 py-1 rounded text-xs font-bold text-white">✅ 已确权</div>
                      )}
                    </div>
                    <div className="md:w-3/5 p-6 flex flex-col justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-brand-green transition-colors">{asset.title}</h3>
                        <div className="text-sm text-gray-500 mb-2">{asset.location || [asset.province, asset.city].filter(Boolean).join(' · ')}</div>
                        {asset.contact_name && (
                          <div className="text-sm text-gray-600 mb-3"><span className="font-medium">联系人：</span>{asset.contact_name}</div>
                        )}
                        <p className="text-sm text-gray-500 mb-4 line-clamp-3">{asset.description || '村委直发，产权清晰，流转合规。'}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs text-gray-400 mb-1">年租金</div>
                          <div className="text-lg font-bold text-gray-900">{formatPrice(asset.price_year)}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-400">{asset.area_mu ? `${asset.area_mu}亩` : ''} {asset.lease_years ? `· ${asset.lease_years}年期` : ''}</div>
                          <div className="text-xs text-gray-400 mt-1">{asset.views.toLocaleString()} 次浏览</div>
                        </div>
                        <span className="bg-[#1a4731] group-hover:bg-[#2d5a45] text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors inline-block">查看详情 →</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* 分页 */}
            {totalPages > 1 && (
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
                      onClick={() => handlePageChange(p)}
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
                  disabled={page >= totalPages}
                  className="px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
                >
                  下一页 →
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-4">🏛️</div>
            <p className="text-lg">暂无村委直发资产</p>
            <p className="text-sm mt-2">请稍后再来查看</p>
          </div>
        )}
      </div>
    </main>
  );
}
