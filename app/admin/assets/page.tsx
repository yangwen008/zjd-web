'use client';

import { useState, useEffect } from 'react';

interface Asset {
  id: number;
  title: string;
  province: string | null;
  source_type: string;
  status: string;
  views: number;
}

const STATUS_LABELS: Record<string, string> = {
  approved: '已上架',
  pending: '待审核',
  rejected: '已拒绝',
  banned: '已封禁',
};

const STATUS_STYLES: Record<string, string> = {
  approved: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  rejected: 'bg-red-100 text-red-700',
  banned: 'bg-red-100 text-red-700',
};

const SOURCE_LABELS: Record<string, string> = {
  official: '官方',
  village: '村委',
  ugc: 'UGC',
};

export default function AdminAssetsPage() {
  const [filter, setFilter] = useState('all');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAssets = async (status?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status && status !== 'all') params.set('status', status);
      params.set('limit', '50');
      const res = await fetch(`/api/admin/assets?${params.toString()}`);
      const data = await res.json();
      setAssets(data.data || []);
    } catch {
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets(filter);
  }, [filter]);

  const handleAction = async (id: number, action: 'approve' | 'reject') => {
    try {
      const res = await fetch(`/api/admin/assets/${id}/${action}`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        fetchAssets(filter);
      }
    } catch {}
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">🏠 资产审核管理</h1>
        <div className="flex items-center space-x-2">
          {['all', 'pending', 'approved', 'rejected'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
                filter === f ? 'bg-brand-green text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f === 'all' ? '全部' : STATUS_LABELS[f] || f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-4 py-3 font-medium text-gray-500">ID</th>
              <th className="px-4 py-3 font-medium text-gray-500">标题</th>
              <th className="px-4 py-3 font-medium text-gray-500">区域</th>
              <th className="px-4 py-3 font-medium text-gray-500">来源</th>
              <th className="px-4 py-3 font-medium text-gray-500">浏览量</th>
              <th className="px-4 py-3 font-medium text-gray-500">状态</th>
              <th className="px-4 py-3 font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">加载中...</td></tr>
            ) : assets.length > 0 ? assets.map((asset) => (
              <tr key={asset.id} className="hover:bg-gray-50/50">
                <td className="px-4 py-3 text-gray-400">#{asset.id}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{asset.title}</td>
                <td className="px-4 py-3 text-gray-500">{asset.province || '-'}</td>
                <td className="px-4 py-3">
                  <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{SOURCE_LABELS[asset.source_type] || asset.source_type}</span>
                </td>
                <td className="px-4 py-3 text-gray-500">{asset.views.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[asset.status] || 'bg-gray-100 text-gray-600'}`}>
                    {STATUS_LABELS[asset.status] || asset.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center space-x-2">
                    <a href={`/asset/${asset.id}`} className="text-xs text-brand-green hover:underline">查看</a>
                    {asset.status === 'pending' && (
                      <>
                        <button onClick={() => handleAction(asset.id, 'approve')} className="text-xs text-green-600 hover:underline">批准</button>
                        <button onClick={() => handleAction(asset.id, 'reject')} className="text-xs text-red-500 hover:underline">拒绝</button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">暂无数据</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
