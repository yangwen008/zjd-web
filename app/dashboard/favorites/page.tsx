'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Fav {
  id: number; asset_id: number; asset_title: string; asset_province: string; created_at: string;
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

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">❤️ 我的收藏</h1>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50 text-left">
            <th className="px-4 py-3 font-medium text-gray-500">资产标题</th>
            <th className="px-4 py-3 font-medium text-gray-500">区域</th>
            <th className="px-4 py-3 font-medium text-gray-500">收藏时间</th>
            <th className="px-4 py-3 font-medium text-gray-500">操作</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">加载中...</td></tr>
            : favs.length > 0 ? favs.map((fav) => (
              <tr key={fav.id} className="hover:bg-gray-50/50">
                <td className="px-4 py-3 font-medium text-gray-900">{fav.asset_title}</td>
                <td className="px-4 py-3 text-gray-500">{fav.asset_province || '-'}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">{fav.created_at?.substring(0, 16)}</td>
                <td className="px-4 py-3"><Link href={`/asset/${fav.asset_id}`} className="text-xs text-brand-green hover:underline">查看</Link></td>
              </tr>
            )) : <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">暂无收藏</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}