'use client';

import { useState, useEffect } from 'react';

interface User {
  id: number; nickname: string; phone: string | null; role: string; status: string;
  role_apply: string | null; apply_reason: string | null; broker_region: string | null;
  broker_specialties: string | null; broker_bio: string | null; org_name: string | null;
  verified: number; last_login_at: string | null; created_at: string;
}

const ROLE_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  user: { label: '普通用户', icon: '👤', color: 'bg-gray-100 text-gray-700' },
  broker: { label: '合伙人', icon: '🤝', color: 'bg-blue-100 text-blue-700' },
  village_org: { label: '村集体', icon: '🏛️', color: 'bg-purple-100 text-purple-700' },
  data_editor: { label: '数据录入员', icon: '📊', color: 'bg-green-100 text-green-700' },
  project_publisher: { label: '项目发布者', icon: '🏢', color: 'bg-yellow-100 text-yellow-700' },
  admin: { label: '平台运营', icon: '🔧', color: 'bg-red-100 text-red-700' },
  superadmin: { label: '超级管理员', icon: '👑', color: 'bg-red-100 text-red-700' },
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: '正常', color: 'bg-green-100 text-green-700' },
  pending: { label: '待审核', color: 'bg-yellow-100 text-yellow-700' },
  banned: { label: '已封禁', color: 'bg-red-100 text-red-700' },
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('');
  const [msg, setMsg] = useState('');
  const [reviewId, setReviewId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('status', filter);
      if (roleFilter) params.set('role', roleFilter);
      params.set('limit', '50');
      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const d = await res.json() as any;
      setUsers(d.data || []);
    } catch { setUsers([]); } finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, [filter, roleFilter]);

  const show = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const handleApprove = async (id: number) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', id }),
      });
      const d = await res.json() as any;
      if (d.success) { show('✅ 已通过审核'); fetchUsers(); } else show(`❌ ${d.error}`);
    } catch { show('❌ 操作失败'); }
  };

  const handleReject = async (id: number) => {
    if (!rejectReason.trim()) { show('请填写拒绝原因'); return; }
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', id, reason: rejectReason }),
      });
      const d = await res.json() as any;
      if (d.success) { show('✅ 已拒绝'); setReviewId(null); setRejectReason(''); fetchUsers(); } else show(`❌ ${d.error}`);
    } catch { show('❌ 操作失败'); }
  };

  const handleBan = async (id: number) => {
    if (!confirm('确定封禁此用户？')) return;
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ban', id }),
      });
      const d = await res.json() as any;
      if (d.success) { show('✅ 已封禁'); fetchUsers(); } else show(`❌ ${d.error}`);
    } catch { show('❌ 操作失败'); }
  };

  const handleUnban = async (id: number) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unban', id }),
      });
      const d = await res.json() as any;
      if (d.success) { show('✅ 已解封'); fetchUsers(); } else show(`❌ ${d.error}`);
    } catch { show('❌ 操作失败'); }
  };

  const pendingCount = users.filter((u) => u.status === 'pending').length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">👥 用户管理</h1>
          {pendingCount > 0 && <p className="text-sm text-orange-500 mt-1">⏳ {pendingCount} 个用户待审核</p>}
        </div>
      </div>

      {msg && (
              <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
                <div className={`${msg.startsWith('✅') ? 'bg-green-600 text-white' : 'bg-red-600 text-white'} px-8 py-4 rounded-xl shadow-2xl text-sm font-medium`}>
                  {msg}
                </div>
              </div>
            )}

      {/* 筛选 */}
      <div className="flex items-center space-x-4 mb-4">
        <div className="flex items-center space-x-2">
          {[{ key: 'all', label: '全部' }, { key: 'pending', label: '待审核' }, { key: 'active', label: '正常' }, { key: 'banned', label: '已封禁' }].map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)} className={`px-3 py-1.5 text-xs rounded-full transition-colors ${filter === f.key ? 'bg-brand-green text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {f.label} {f.key === 'pending' && pendingCount > 0 && <span className="ml-1 bg-orange-400 text-white rounded-full px-1.5 text-xs">{pendingCount}</span>}
            </button>
          ))}
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg outline-none">
          <option value="">所有角色</option>
          {Object.entries(ROLE_LABELS).map(([key, val]) => <option key={key} value={key}>{val.icon} {val.label}</option>)}
        </select>
      </div>

      {/* 列表 */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50 text-left">
            <th className="px-4 py-3 font-medium text-gray-500">ID</th>
            <th className="px-4 py-3 font-medium text-gray-500">昵称</th>
            <th className="px-4 py-3 font-medium text-gray-500">手机号</th>
            <th className="px-4 py-3 font-medium text-gray-500">角色</th>
            <th className="px-4 py-3 font-medium text-gray-500">状态</th>
            <th className="px-4 py-3 font-medium text-gray-500">申请信息</th>
            <th className="px-4 py-3 font-medium text-gray-500">注册时间</th>
            <th className="px-4 py-3 font-medium text-gray-500">操作</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">加载中...</td></tr>
            : users.length > 0 ? users.map((u) => {
              const role = ROLE_LABELS[u.role] || ROLE_LABELS.user;
              const status = STATUS_LABELS[u.status] || STATUS_LABELS.active;
              const isReviewing = reviewId === u.id;

              return (
                <tr key={u.id} className={`hover:bg-gray-50/50 ${u.status === 'pending' ? 'bg-yellow-50/30' : ''}`}>
                  <td className="px-4 py-3 text-gray-400">#{u.id}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{u.nickname}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{u.phone || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${role.color}`}>{role.icon} {role.label}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${status.color}`}>{status.label}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 max-w-[200px]">
                    {u.role_apply && <div>申请: {ROLE_LABELS[u.role_apply]?.label || u.role_apply}</div>}
                    {u.broker_region && <div>区域: {u.broker_region}</div>}
                    {u.org_name && <div>机构: {u.org_name}</div>}
                    {u.apply_reason && <div className="truncate">理由: {u.apply_reason}</div>}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{u.created_at?.substring(0, 16)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      {u.status === 'pending' && (
                        <>
                          <button onClick={() => handleApprove(u.id)} className="text-xs text-green-600 hover:underline font-medium">✓ 通过</button>
                          <button onClick={() => setReviewId(isReviewing ? null : u.id)} className="text-xs text-red-500 hover:underline">✗ 拒绝</button>
                        </>
                      )}
                      {u.status === 'active' && (
                        <button onClick={() => handleBan(u.id)} className="text-xs text-red-500 hover:underline">封禁</button>
                      )}
                      {u.status === 'banned' && (
                        <button onClick={() => handleUnban(u.id)} className="text-xs text-green-600 hover:underline">解封</button>
                      )}
                    </div>
                    {/* 拒绝原因输入 */}
                    {isReviewing && (
                      <div className="mt-2 flex items-center space-x-2">
                        <input type="text" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="拒绝原因" className="px-2 py-1 text-xs border border-red-200 rounded outline-none w-40" />
                        <button onClick={() => handleReject(u.id)} className="text-xs bg-red-500 text-white px-2 py-1 rounded">确认拒绝</button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            }) : <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">暂无用户</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
