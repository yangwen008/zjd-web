'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface PendingAsset {
  id: number;
  title: string;
  province: string | null;
  asset_type: string | null;
  source_type: string;
  created_at: string;
}

interface PendingBulk {
  id: number;
  title: string;
  code: string | null;
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
    <div>
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
                      <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{asset.source_type}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{asset.province || '-'}</td>
                    <td className="px-4 py-3 text-gray-500">{asset.asset_type || '-'}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{asset.created_at}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
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
    </div>
  );
}
