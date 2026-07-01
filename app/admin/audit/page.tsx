'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface PendingAsset {
  id: number;
  title: string;
  description: string | null;
  location: string | null;
  province: string | null;
  city: string | null;
  district: string | null;
  area_mu: number | null;
  price_year: number | null;
  price_total: number | null;
  lease_years: number | null;
  asset_type: string | null;
  source_type: string;
  images: string | null;
  video_url: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  certification: string;
  featured: number;
  views: number;
  created_at: string;
}

interface PendingBulk {
  id: number;
  title: string;
  code: string | null;
  description: string | null;
  province: string | null;
  created_at: string;
}

interface PendingUser {
  id: number;
  nickname: string;
  phone: string;
  role_apply: string;
  apply_reason: string | null;
  created_at: string;
}

export default function AdminAuditPage() {
  const [assets, setAssets] = useState<PendingAsset[]>([]);
  const [bulk, setBulk] = useState<PendingBulk[]>([]);
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'asset' | 'bulk' | 'user'>('all');
  const [previewAsset, setPreviewAsset] = useState<PendingAsset | null>(null);
  const [previewBulk, setPreviewBulk] = useState<PendingBulk | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [assetRes, bulkRes, userRes] = await Promise.all([
          fetch('/api/admin/assets?status=pending&limit=50').then(r => r.json()).catch(() => ({ data: [] })),
          fetch('/api/admin/bulk-projects?status=pending&limit=50').then(r => r.json()).catch(() => ({ data: [] })),
          fetch('/api/admin/users?status=pending&limit=50').then(r => r.json()).catch(() => ({ data: [] })),
        ]);
        setAssets((assetRes as any).data || []);
        setBulk((bulkRes as any).data || []);
        setUsers(((userRes as any).data || []).filter((u: PendingUser) => u.role_apply));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalPending = assets.length + bulk.length + users.length;

  const SOURCE_LABELS: Record<string, string> = { official: '官方', village: '村委', ugc: '个人' };

  const ROLE_LABELS: Record<string, string> = {
    broker: '合伙人',
    village_org: '村集体',
    project_publisher: '大宗用户',
  };

  const handleApproveAsset = async (id: number) => {
    await fetch('/api/admin/assets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update-status', id, status: 'approved' }),
    });
    setAssets(prev => prev.filter(a => a.id !== id));
  };

  const handleRejectAsset = async (id: number) => {
    await fetch('/api/admin/assets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update-status', id, status: 'rejected' }),
    });
    setAssets(prev => prev.filter(a => a.id !== id));
  };

  const handleApproveBulk = async (id: number) => {
    await fetch('/api/admin/bulk-projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update-status', id, status: 'approved' }),
    });
    setBulk(prev => prev.filter(b => b.id !== id));
  };

  const handleRejectBulk = async (id: number) => {
    await fetch('/api/admin/bulk-projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update-status', id, status: 'rejected' }),
    });
    setBulk(prev => prev.filter(b => b.id !== id));
  };

  const handleApproveUser = async (id: number) => {
    await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve', id }),
    });
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  const handleRejectUser = async (id: number) => {
    await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reject', id }),
    });
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-brand-green border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-2 text-gray-400">加载中...</span>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">📋 审核中心</h1>
        <span className="text-sm text-gray-500">共 {totalPending} 项待审核</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'all' as const, label: '全部', count: totalPending },
          { key: 'asset' as const, label: '资产', count: assets.length },
          { key: 'bulk' as const, label: '大宗项目', count: bulk.length },
          { key: 'user' as const, label: '用户角色', count: users.length },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-brand-green text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-brand-green'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {totalPending === 0 && (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-4">✅</div>
          <p className="text-lg">暂无待审核内容</p>
        </div>
      )}

      {/* Pending Assets */}
      {(activeTab === 'all' || activeTab === 'asset') && assets.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span>🏠</span> 待审核资产 <span className="text-sm font-normal text-gray-400">({assets.length})</span>
          </h2>
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-3 font-medium text-gray-500">ID</th>
                  <th className="px-4 py-3 font-medium text-gray-500">标题</th>
                  <th className="px-4 py-3 font-medium text-gray-500">来源</th>
                  <th className="px-4 py-3 font-medium text-gray-500">省份</th>
                  <th className="px-4 py-3 font-medium text-gray-500">类型</th>
                  <th className="px-4 py-3 font-medium text-gray-500">提交时间</th>
                  <th className="px-4 py-3 font-medium text-gray-500">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {assets.map(asset => (
                  <tr key={asset.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-gray-400">#{asset.id}</td>
                    <td className="px-4 py-3 font-medium">
                      <Link href={`/asset/${asset.id}`} className="hover:text-brand-green" target="_blank">{asset.title}</Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{SOURCE_LABELS[asset.source_type] || asset.source_type}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{asset.province || '-'}</td>
                    <td className="px-4 py-3 text-gray-500">{asset.asset_type || '-'}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{asset.created_at}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => setPreviewAsset(asset)} className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs hover:bg-blue-100">查看</button>
                        <button onClick={() => handleApproveAsset(asset.id)} className="px-3 py-1 bg-green-50 text-green-600 rounded-lg text-xs hover:bg-green-100">通过</button>
                        <button onClick={() => handleRejectAsset(asset.id)} className="px-3 py-1 bg-red-50 text-red-600 rounded-lg text-xs hover:bg-red-100">拒绝</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pending Bulk Projects */}
      {(activeTab === 'all' || activeTab === 'bulk') && bulk.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span>🏢</span> 待审核大宗项目 <span className="text-sm font-normal text-gray-400">({bulk.length})</span>
          </h2>
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-3 font-medium text-gray-500">编号</th>
                  <th className="px-4 py-3 font-medium text-gray-500">标题</th>
                  <th className="px-4 py-3 font-medium text-gray-500">省份</th>
                  <th className="px-4 py-3 font-medium text-gray-500">提交时间</th>
                  <th className="px-4 py-3 font-medium text-gray-500">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {bulk.map(bp => (
                  <tr key={bp.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-gray-400">{bp.code || `#${bp.id}`}</td>
                    <td className="px-4 py-3 font-medium">
                      <Link href={`/bulk-projects/${bp.id}`} className="hover:text-brand-green" target="_blank">{bp.title}</Link>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{bp.province || '-'}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{bp.created_at}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => setPreviewBulk(bp)} className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs hover:bg-blue-100">查看</button>
                        <button onClick={() => handleApproveBulk(bp.id)} className="px-3 py-1 bg-green-50 text-green-600 rounded-lg text-xs hover:bg-green-100">通过</button>
                        <button onClick={() => handleRejectBulk(bp.id)} className="px-3 py-1 bg-red-50 text-red-600 rounded-lg text-xs hover:bg-red-100">拒绝</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pending Users */}
      {(activeTab === 'all' || activeTab === 'user') && users.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span>👤</span> 待审核用户角色 <span className="text-sm font-normal text-gray-400">({users.length})</span>
          </h2>
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-3 font-medium text-gray-500">ID</th>
                  <th className="px-4 py-3 font-medium text-gray-500">昵称</th>
                  <th className="px-4 py-3 font-medium text-gray-500">手机号</th>
                  <th className="px-4 py-3 font-medium text-gray-500">申请角色</th>
                  <th className="px-4 py-3 font-medium text-gray-500">申请理由</th>
                  <th className="px-4 py-3 font-medium text-gray-500">注册时间</th>
                  <th className="px-4 py-3 font-medium text-gray-500">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-gray-400">#{user.id}</td>
                    <td className="px-4 py-3 font-medium">{user.nickname}</td>
                    <td className="px-4 py-3 text-gray-500">{user.phone}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">{ROLE_LABELS[user.role_apply] || user.role_apply}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs max-w-[200px] truncate">{user.apply_reason || '-'}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{user.created_at}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => handleApproveUser(user.id)} className="px-3 py-1 bg-green-50 text-green-600 rounded-lg text-xs hover:bg-green-100">通过</button>
                        <button onClick={() => handleRejectUser(user.id)} className="px-3 py-1 bg-red-50 text-red-600 rounded-lg text-xs hover:bg-red-100">拒绝</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    {/* 资产详情预览弹窗 */}
    {previewAsset && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setPreviewAsset(null)}>
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">📋 资产详情 #{previewAsset.id}</h2>
            <button onClick={() => setPreviewAsset(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
          </div>
          <div className="p-6 space-y-4">
            {/* 图片 */}
            {previewAsset.images && (() => {
              try {
                const imgs = JSON.parse(previewAsset.images);
                if (Array.isArray(imgs) && imgs.length > 0) {
                  return (
                    <div className="grid grid-cols-2 gap-2">
                      {imgs.slice(0, 4).map((img: any, i: number) => (
                        <img key={i} src={typeof img === 'object' ? img.url : img} alt="" className="w-full h-32 object-cover rounded-lg" />
                      ))}
                    </div>
                  );
                }
              } catch {}
              return null;
            })()}

            <div><span className="text-xs text-gray-400">标题</span><div className="font-bold text-lg">{previewAsset.title}</div></div>
            <div className="grid grid-cols-2 gap-4">
              <div><span className="text-xs text-gray-400">来源</span><div>{SOURCE_LABELS[previewAsset.source_type] || previewAsset.source_type}</div></div>
              <div><span className="text-xs text-gray-400">类型</span><div>{previewAsset.asset_type || '-'}</div></div>
              <div><span className="text-xs text-gray-400">省份</span><div>{previewAsset.province || '-'}</div></div>
              <div><span className="text-xs text-gray-400">城市</span><div>{previewAsset.city || '-'}</div></div>
              <div><span className="text-xs text-gray-400">面积</span><div>{previewAsset.area_mu ? `${previewAsset.area_mu}亩` : '-'}</div></div>
              <div><span className="text-xs text-gray-400">年租金</span><div>{previewAsset.price_year ? `¥${previewAsset.price_year}万` : '-'}</div></div>
              <div><span className="text-xs text-gray-400">流转年限</span><div>{previewAsset.lease_years ? `${previewAsset.lease_years}年` : '-'}</div></div>
              <div><span className="text-xs text-gray-400">确权</span><div>{previewAsset.certification === 'certified' ? '✅ 已确权' : previewAsset.certification === 'pending' ? '⏳ 待确权' : '未确权'}</div></div>
            </div>
            {previewAsset.description && <div><span className="text-xs text-gray-400">描述</span><div className="text-sm text-gray-700 mt-1">{previewAsset.description}</div></div>}
            <div className="grid grid-cols-2 gap-4">
              <div><span className="text-xs text-gray-400">联系人</span><div>{previewAsset.contact_name || '-'}</div></div>
              <div><span className="text-xs text-gray-400">联系电话</span><div>{previewAsset.contact_phone || '-'}</div></div>
            </div>
            <div className="flex gap-3 pt-4 border-t">
              <button onClick={() => { handleApproveAsset(previewAsset.id); setPreviewAsset(null); }} className="flex-1 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">✅ 通过</button>
              <button onClick={() => { handleRejectAsset(previewAsset.id); setPreviewAsset(null); }} className="flex-1 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">❌ 拒绝</button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* 大宗项目详情预览弹窗 */}
    {previewBulk && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setPreviewBulk(null)}>
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">🏢 大宗项目详情 #{previewBulk.id}</h2>
            <button onClick={() => setPreviewBulk(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
          </div>
          <div className="p-6 space-y-4">
            <div><span className="text-xs text-gray-400">标题</span><div className="font-bold text-lg">{previewBulk.title}</div></div>
            {previewBulk.code && <div><span className="text-xs text-gray-400">编号</span><div>{previewBulk.code}</div></div>}
            <div className="grid grid-cols-2 gap-4">
              <div><span className="text-xs text-gray-400">省份</span><div>{previewBulk.province || '-'}</div></div>
            </div>
            {previewBulk.description && <div><span className="text-xs text-gray-400">描述</span><div className="text-sm text-gray-700 mt-1">{previewBulk.description}</div></div>}
            <div className="flex gap-3 pt-4 border-t">
              <button onClick={() => { handleApproveBulk(previewBulk.id); setPreviewBulk(null); }} className="flex-1 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">✅ 通过</button>
              <button onClick={() => { handleRejectBulk(previewBulk.id); setPreviewBulk(null); }} className="flex-1 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">❌ 拒绝</button>
            </div>
          </div>
        </div>
      </div>
    )}
  </>
  );
}
