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
  user_id?: number; // Admin 查看时需要知道是谁发布的
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
  const [userRole, setUserRole] = useState('');
  const [isAdminView, setIsAdminView] = useState(false); // Admin 专属：是否查看全站

  useEffect(() => {
    // 1. 获取当前用户角色
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d: any) => {
        if (d.success) setUserRole(d.user.role);
      });

    // 2. 加载资产数据
    fetchAssets(false);
  }, []);

  const fetchAssets = async (all: boolean) => {
    setLoading(true);
    const params = new URLSearchParams();
    // 如果是 Admin 且开启了全站查看，传 scope=all
    if (all && ['admin', 'superadmin'].includes(userRole)) {
      params.set('scope', 'all');
    }
    params.set('limit', '50');

    try {
      const res = await fetch(`/api/dashboard/assets?${params.toString()}`);
      const d = await res.json() as any;
      if (d.success) setAssets(d.data || []);
    } catch {
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  // 切换查看范围
  const toggleScope = () => {
    const newVal = !isAdminView;
    setIsAdminView(newVal);
    fetchAssets(newVal);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          🏠 {isAdminView ? '全站资产管理' : '我的资产'}
        </h1>
        <div className="flex items-center space-x-3">
          {/* Admin 专属：切换查看范围按钮 */}
          {['admin', 'superadmin'].includes(userRole) && (
            <button
              onClick={toggleScope}
              className={`px-3 py-1.5 text-xs rounded-full transition-colors border ${
                isAdminView
                  ? 'bg-purple-100 text-purple-700 border-purple-200'
                  : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
              }`}
            >
              {isAdminView ? '👁️ 正在查看：全站资产' : '👁️ 正在查看：我的资产'}
            </button>
          )}
          <Link
            href="/dashboard/assets/new"
            className="bg-brand-green text-white px-4 py-2 rounded-lg hover:bg-brand-light transition-colors text-sm"
          >
            ➕ 发布新资产
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-4 py-3 font-medium text-gray-500">封面</th>
              <th className="px-4 py-3 font-medium text-gray-500">标题</th>
              <th className="px-4 py-3 font-medium text-gray-500">区域</th>
              <th className="px-4 py-3 font-medium text-gray-500">面积/价格</th>
              <th className="px-4 py-3 font-medium text-gray-500">浏览</th>
              <th className="px-4 py-3 font-medium text-gray-500">状态</th>
              <th className="px-4 py-3 font-medium text-gray-500">发布时间</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  加载中...
                </td>
              </tr>
            ) : assets.length > 0 ? (
              assets.map((asset) => {
                const status = STATUS_LABELS[asset.status] || STATUS_LABELS.pending;
                // 安全解析图片 JSON
                let firstImage = null;
                try {
                  if (asset.images) {
                    const imgs = JSON.parse(asset.images);
                    if (Array.isArray(imgs) && imgs.length > 0) firstImage = imgs[0];
                  }
                } catch {}

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
                        <div className="w-16 h-12 bg-gray-100 rounded border border-gray-200 flex items-center justify-center text-gray-300 text-xs">
                          无图
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900 max-w-[200px] truncate">
                      {asset.title}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{asset.province || '-'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {asset.area_mu ? `${asset.area_mu}亩` : '-'}
                      {asset.price_year ? ` / ${asset.price_year}万` : ''}
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
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  {isAdminView ? '全站暂无资产数据' : '暂无资产，快去发布第一个吧！'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
