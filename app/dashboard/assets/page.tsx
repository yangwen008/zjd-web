'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Asset {
  id: number; title: string; province: string | null; area_mu: number | null;
  price_year: number | null; status: string; views: number; created_at: string; images: string | null;
  source_type: string; user_id: number | null;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  approved: { label: '已上架', color: 'bg-green-100 text-green-700' },
  pending: { label: '审核中', color: 'bg-yellow-100 text-yellow-700' },
  rejected: { label: '已拒绝', color: 'bg-red-100 text-red-700' },
  banned: { label: '已封禁', color: 'bg-red-100 text-red-700' },
};

const SOURCE_LABELS: Record<string, string> = {
  official: '🏛️ 官方',
  village: '🏛️ 村委',
  ugC: '👤 UGC',
};

export default function MyAssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState<'mine' | 'all'>('mine');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // 检查用户角色
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d: any) => {
        if (d.success && ['admin', 'superadmin'].includes(d.user?.role)) {
          setIsAdmin(true);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const url = scope === 'all' ? '/api/dashboard/assets?scope=all&limit=100' : '/api/dashboard/assets';
    fetch(url)
      .then((r) => r.json())
      .then((d: any) => { if (d.success) setAssets(d.data || []); })
      .finally(() => setLoading(false));
  }, [scope]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900">🏠 我的资产</h1>
          {isAdmin && (
            <div className="flex bg-gray-100 rounded-lg p-0.5 text-sm">
              <button
                onClick={() => setScope('mine')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${scope === 'mine' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                我的
              </button>
              <button
                onClick={() => setScope('all')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${scope === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                全站
              </button>
            </div>
          )}
        </div>
        <Link href="/dashboard/assets/new" className="bg-brand-green text-white px-4 py-2 rounded-lg hover:bg-brand-light transition-colors text-sm">
          ➕ 发布新资产
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50 text-left">
            <th className="px-4 py-3 font-medium text-gray-500">标题</th>
            {scope === 'all' && <th className="px-4 py-3 font-medium text-gray-500">来源</th>}
            <th className="px-4 py-3 font-medium text-gray-500">区域</th>
            <th className="px-4 py-3 font-medium text-gray-500">面积/价格</th>
            <th className="px-4 py-3 font-medium text-gray-500">浏览</th>
            <th className="px-4 py-3 font-medium text-gray-500">状态</th>
            <th className="px-4 py-3 font-medium text-gray-500">发布时间</th>
            <th className="px-4 py-3 font-medium text-gray-500">操作</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">加载中...</td></tr>
            : assets.length > 0 ? assets.map((asset) => {
              const status = STATUS_LABELS[asset.status] || STATUS_LABELS.pending;
              return (
                <tr key={asset.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium text-gray-900 max-w-[200px] truncate">
                    <Link href={`/asset/${asset.id}`} className="hover:text-brand-green">{asset.title}</Link>
                  </td>
                  {scope === 'all' && (
                    <td className="px-4 py-3 text-xs">{SOURCE_LABELS[asset.source_type] || asset.source_type}</td>
                  )}
                  <td className="px-4 py-3 text-gray-500">{asset.province || '-'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {asset.area_mu ? `${asset.area_mu}亩` : '-'}
                    {asset.price_year ? ` / ${asset.price_year}万/年` : ''}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{asset.views.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${status.color}`}>{status.label}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{asset.created_at?.substring(0, 16)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <Link href={`/asset/${asset.id}`} className="text-xs text-blue-600 hover:underline">查看</Link>
                      <Link href={`/dashboard/assets/${asset.id}/edit`} className="text-xs text-brand-green hover:underline">修改</Link>
                    </div>
                  </td>
                </tr>
              );
            }) : <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">暂无资产，<Link href="/dashboard/assets/new" className="text-brand-green hover:underline">去发布</Link></td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
