'use client';

import { useState, useEffect } from 'react';

/**
 * 收藏按钮组件
 * 用于资产详情页侧边栏
 */
export default function FavoriteButton({ assetId }: { assetId: number }) {
  const [isFav, setIsFav] = useState(false);
  const [loading, setLoading] = useState(false);

  // 检查是否已收藏
  useEffect(() => {
    fetch('/api/dashboard/favorites')
      .then(r => r.json())
      .then((data: any) => {
        if (data.success && data.data) {
          const found = data.data.some((f: any) => f.id === assetId || f.asset_id === assetId);
          setIsFav(found);
        }
      })
      .catch(() => {});
  }, [assetId]);

  const toggle = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch('/api/dashboard/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId: assetId }),
      });
      const data: any = await res.json();
      if (data.success) {
        setIsFav(!isFav);
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all border ${
        isFav
          ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
          : 'bg-white border-gray-200 text-gray-700 hover:border-red-300 hover:text-red-500'
      }`}
    >
      <span className="text-lg">{isFav ? '❤️' : '🤍'}</span>
      <span>{isFav ? '已收藏' : '收藏'}</span>
    </button>
  );
}
