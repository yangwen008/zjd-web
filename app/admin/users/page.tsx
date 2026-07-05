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
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    nickname: '', phone: '', real_name: '', org_name: '', bio: '',
    broker_region: '', broker_specialties: '', broker_bio: '', daily_quota: '3',
    role: '', new_password: '',
  });

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

  const openEdit = (u: User) => {
    setEditingUser(u);
    setEditForm({
      nickname: u.nickname || '',
      phone: u.phone || '',
      real_name: (u as any).real_name || '',
      org_name: u.org_name || '',
      bio: (u as any).bio || '',
      broker_region: u.broker_region || '',
      broker_specialties: u.broker_specialties || '',
      broker_bio: u.broker_bio || '',
      daily_quota: String((u as any).daily_quota || 3),
      role: u.role || 'user',
    });
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    try {
      // 更新角色
      if (editForm.role !== editingUser.role) {
        await fetch('/api/admin/users', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'update-role', id: editingUser.id, role: editForm.role }),
        });
      }
      // 更新资料
      const res = await fetch('/api/admin/users', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-profile',
          id: editingUser.id,
          nickname: editForm.nickname,
          phone: editForm.phone,
          real_name: editForm.real_name,
          org_name: editForm.org_name,
          bio: editForm.bio,
          broker_region: editForm.broker_region,
          broker_specialties: editForm.broker_specialties,
          broker_bio: editForm.broker_bio,
          daily_quota: editForm.daily_quota,
          new_password: editForm.new_password || undefined,
        }),
      });
      const d = await res.json() as any;
      if (d.success) { show('✅ 用户资料已更新'); setEditingUser(null); fetchUsers(); }
      else show(`❌ ${d.error}`);
    } catch { show('❌ 保存失败'); }
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
                      <button onClick={() => openEdit(u)} className="text-xs text-blue-600 hover:underline">编辑</button>
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

      {/* 编辑用户弹窗 */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setEditingUser(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">✏️ 编辑用户 #{editingUser.id} — {editingUser.nickname}</h2>
              <button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">昵称</label>
                <input value={editForm.nickname} onChange={(e) => setEditForm({ ...editForm, nickname: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">手机号</label>
                <input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg font-mono" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">真实姓名</label>
                <input value={editForm.real_name} onChange={(e) => setEditForm({ ...editForm, real_name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">角色</label>
                <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg">
                  {Object.entries(ROLE_LABELS).map(([key, val]) => <option key={key} value={key}>{val.icon} {val.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">机构/村委名称</label>
                <input value={editForm.org_name} onChange={(e) => setEditForm({ ...editForm, org_name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">每日发布上限</label>
                <input type="number" value={editForm.daily_quota} onChange={(e) => setEditForm({ ...editForm, daily_quota: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-500 mb-1">个人简介</label>
              <textarea value={editForm.bio} onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })} rows={2}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-500 mb-1">🔑 重置密码（留空则不修改）</label>
              <input type="text" value={editForm.new_password} onChange={(e) => setEditForm({ ...editForm, new_password: e.target.value })}
                placeholder="输入新密码，至少8位，含大小写字母和数字"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg font-mono" />
            </div>

            {/* 合伙人专属字段 */}
            {(editForm.role === 'broker' || editForm.role === 'village_org') && (
              <div className="bg-blue-50 rounded-xl p-4 mb-4 space-y-3">
                <h3 className="text-sm font-bold text-blue-800">🤝 合伙人/村集体专属信息</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">负责区域</label>
                    <input value={editForm.broker_region} onChange={(e) => setEditForm({ ...editForm, broker_region: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">擅长领域 (JSON)</label>
                    <input value={editForm.broker_specialties} onChange={(e) => setEditForm({ ...editForm, broker_specialties: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg font-mono" placeholder='["宅基地","林地"]' />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">合伙人简介</label>
                  <textarea value={editForm.broker_bio} onChange={(e) => setEditForm({ ...editForm, broker_bio: e.target.value })} rows={2}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                </div>
              </div>
            )}

            <div className="flex items-center space-x-3">
              <button onClick={handleSaveEdit}
                className="bg-brand-green hover:bg-brand-light text-white px-6 py-2 rounded-lg text-sm font-medium">💾 保存</button>
              <button onClick={() => setEditingUser(null)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-6 py-2 rounded-lg text-sm">取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
