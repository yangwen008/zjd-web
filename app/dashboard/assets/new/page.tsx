'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Asset {
  id: number;
  title: string;
  province: string | null;
  area_mu: number | null;
  price_year: number | null;
  status: string;
  views: number;
  created_at: string;
  images: string | null;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  approved: { label: '已上架', color: 'bg-green-100 text-green-700' },
  pending: { label: '审核中', color: 'bg-yellow-100 text-yellow-700' },
  rejected: { label: '已拒绝', color: 'bg-red-100 text-red-700' },
  banned: { label: '已封禁', color: 'bg-red-100 text-red-700' },
};

export default function MyAssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/assets')
      .then((r) => r.json())
      .then((d: any) => {
        if (d.success) setAssets(d.data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">🏠 我的资产</h1>
        <Link
          href="/dashboard/assets/new"
          className="bg-brand-green text-white px-4 py-2 rounded-lg hover:bg-brand-light transition-colors"
        >
          ➕ 发布新资产
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-4 py-3 font-medium text-gray-500">封面</th>
              <th className="px-4 py-3 font-medium text-gray-500">标题</th>
              <th className="px-4 py-3 font-medium text-gray-500">区域</th>
              <th className="px-4 py-3 font-medium text-gray-500">面积</th>
              <th className="px-4 py-3 font-medium text-gray-500">价格</th>
              <th className="px-4 py-3 font-medium text-gray-500">浏览量</th>
              <th className="px-4 py-3 font-medium text-gray-500">状态</th>
              <th className="px-4 py-3 font-medium text-gray-500">发布时间</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                  加载中...
                </td>
              </tr>
            ) : assets.length > 0 ? (
              assets.map((asset) => {
                const status = STATUS_LABELS[asset.status] || STATUS_LABELS.pending;
                const firstImage = asset.images ? JSON.parse(asset.images)[0] : null;

                return (
                  <tr key={asset.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      {firstImage ? (
                        <img
                          src={firstImage}
                          alt=""
                          className="w-16 h-12 object-cover rounded border border-gray-200"
                        />
                      ) : (
                        <div className="w-16 h-12 bg-gray-100 rounded border border-gray-200" />
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900 max-w-[200px] truncate">
                      {asset.title}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{asset.province || '-'}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {asset.area_mu ? `${asset.area_mu}亩` : '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {asset.price_year ? `${asset.price_year}万/年` : '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{asset.views.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {asset.created_at?.substring(0, 16)}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                  暂无资产，快去发布第一个吧！
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
