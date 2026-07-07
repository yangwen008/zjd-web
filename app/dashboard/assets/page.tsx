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
  official: '官方',
  village: '村委',
  ugc: '个人',
};

export default function MyAssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState<'mine' | 'all'>('mine');
  const [isAdmin, setIsAdmin] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 12;

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

  // 搜索或切换范围时重置到第1页
  useEffect(() => { setPage(1); }, [scope, search]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (scope === 'all') params.set('scope', 'all');
    if (search.trim()) params.set('search', search.trim());
    params.set('page', String(page));
    params.set('limit', String(PAGE_SIZE));
    const url = `/api/dashboard/assets?${params.toString()}`;
    fetch(url)
      .then((r) => r.json())
      .then((d: any) => {
        if (d.success) {
          setAssets(d.data || []);
          if (d.pagination) {
            setTotalPages(d.pagination.totalPages || 1);
            setTotal(d.pagination.total || 0);
          }
        }
      })
      .finally(() => setLoading(false));
  }, [scope, search, page]);

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

      {/* 搜索栏 */}
      <div className="mb-4 flex items-center space-x-3">
        <div className="flex-1 relative">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜索资产标题、地点..."
            className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white outline-none focus:border-brand-green"
          />
          <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        {search && <button onClick={() => setSearch('')} className="px-3 py-2.5 text-sm text-gray-500 hover:text-gray-700">清除</button>}
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

      {/* 分页栏 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-1">
          <span className="text-sm text-gray-500">共 {total} 条，第 {page}/{totalPages} 页</span>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setPage(1)}
              disabled={page <= 1}
              className="px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >首页</button>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >上一页</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
              .reduce<(number | string)[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...');
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                typeof p === 'string' ? (
                  <span key={`gap-${i}`} className="px-1 text-gray-400">...</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`px-3 py-1.5 text-sm border rounded-lg transition-colors ${p === page ? 'bg-brand-green text-white border-brand-green' : 'border-gray-200 hover:bg-gray-50'}`}
                  >{p}</button>
                )
              )}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >下一页</button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={page >= totalPages}
              className="px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >末页</button>
          </div>
        </div>
      )}
    </div>
  );
}
