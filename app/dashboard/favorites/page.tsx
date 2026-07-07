'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Fav {
  id: number; asset_id: number; asset_title: string; asset_province: string;
  price_year: number | null; area_mu: number | null; images: string | null; created_at: string;
}

function getFirstImage(images: string | null): string | null {
  if (!images) return null;
  try {
    const arr = JSON.parse(images);
    if (!Array.isArray(arr) || arr.length === 0) return null;
    const first = arr[0];
    if (typeof first === 'object' && first.thumb) return first.thumb;
    return typeof first === 'object' ? first.url : first;
  } catch { return null; }
}

export default function FavoritesPage() {
  const [favs, setFavs] = useState<Fav[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/favorites')
      .then((r) => r.json())
      .then((d: any) => { if (d.success) setFavs(d.data || []); })
      .finally(() => setLoading(false));
  }, []);

  const handleRemove = async (assetId: number) => {
    const res = await fetch('/api/dashboard/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assetId }),
    });
    const d = await res.json() as any;
    if (d.success && !d.favorited) {
      setFavs((prev) => prev.filter((f) => f.asset_id !== assetId));
    }
  };

  if (loading) return <div className="text-center py-16 text-gray-400">加载中...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">❤️ 我的收藏</h1>

      {favs.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400">
          <div className="text-5xl mb-4">❤️</div>
          <p className="text-lg">暂无收藏</p>
          <p className="text-sm mt-2">浏览资产时点击收藏按钮即可添加</p>
          <Link href="/search" className="inline-block mt-4 text-brand-green hover:underline text-sm">去搜索资产 →</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {favs.map((fav) => {
            const img = getFirstImage(fav.images);
            return (
              <div key={fav.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center space-x-4">
                <div className="w-16 h-16 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                  {img ? (
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">🏘️</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/asset/${fav.asset_id}`} className="text-sm font-medium text-gray-900 hover:text-brand-green truncate block">
                    {fav.asset_title}
                  </Link>
                  <div className="text-xs text-gray-400 mt-1">
                    {fav.asset_province || '-'}
                    {fav.area_mu ? ` · ${fav.area_mu}亩` : ''}
                    {fav.price_year ? ` · ¥${fav.price_year}万/年` : ''}
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(fav.asset_id)}
                  className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                >
                  取消
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
