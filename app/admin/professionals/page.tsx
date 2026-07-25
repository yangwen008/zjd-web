'use client';

import { useState, useEffect } from 'react';

interface Professional {
  id: number;
  prof_type: string;
  name: string;
  org_name: string | null;
  phone: string | null;
  bio: string | null;
  license_no: string | null;
  qualification: string | null;
  province: string | null;
  city: string | null;
  service_areas: string | null;
  services: string | null;
  pricing_model: string;
  price_min: number | null;
  price_max: number | null;
  rating: number;
  review_count: number;
  order_count: number;
  verified: number;
  status: string;
  created_at: string;
}

const TYPE_TABS = [
  { key: '', label: '全部' },
  { key: 'notary', label: '📋 公证处' },
  { key: 'lawyer', label: '⚖️ 律师' },
  { key: 'fengshui', label: '🏔️ 风水师' },
];

const EMPTY_FORM: Record<string, unknown> = {
  prof_type: 'notary', name: '', org_name: '', phone: '', bio: '',
  license_no: '', qualification: '', province: '', city: '', district: '',
  service_areas: '[]', services: '[]', pricing_model: 'negotiable',
  price_min: '', price_max: '', verified: false, status: 'active',
};

export default function AdminProfessionalsPage() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeType) params.set('type', activeType);
      const res = await fetch(`/api/admin/professionals?${params.toString()}`);
      const data = await res.json();
      if (data.success) setProfessionals(data.data || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [activeType]);

  const handleEdit = (p: Professional) => {
    setEditingId(p.id);
    setForm({
      prof_type: p.prof_type, name: p.name, org_name: p.org_name || '', phone: p.phone || '',
      bio: p.bio || '', license_no: p.license_no || '', qualification: p.qualification || '',
      province: p.province || '', city: p.city || '', district: '',
      service_areas: p.service_areas || '[]', services: p.services || '[]',
      pricing_model: p.pricing_model, price_min: p.price_min || '', price_max: p.price_max || '',
      verified: p.verified === 1, status: p.status,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name) { setMessage('❌ 名称不能为空'); return; }
    setSaving(true);
    try {
      const body = { ...form, id: editingId || undefined };
      const res = await fetch('/api/admin/professionals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(editingId ? '✅ 更新成功' : '✅ 新增成功');
        setShowForm(false);
        setEditingId(null);
        setForm({ ...EMPTY_FORM });
        fetchData();
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch { setMessage('❌ 网络错误'); }
    finally { setSaving(false); setTimeout(() => setMessage(''), 3000); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除此服务商？')) return;
    try {
      await fetch(`/api/admin/professionals?id=${id}`, { method: 'DELETE' });
      fetchData();
    } catch {}
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">🛡️ 服务商管理</h1>
        <button
          onClick={() => { setEditingId(null); setForm({ ...EMPTY_FORM }); setShowForm(true); }}
          className="bg-brand-green hover:bg-brand-light text-white px-4 py-2 rounded-lg text-sm"
        >
          ➕ 新增服务商
        </button>
      </div>

      {message && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${message.startsWith('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message}
        </div>
      )}

      {/* Type filter */}
      <div className="flex gap-2 mb-4">
        {TYPE_TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveType(t.key)}
            className={`px-3 py-1.5 rounded-lg text-sm ${activeType === t.key ? 'bg-brand-green text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 py-3 font-medium text-gray-500">类型</th>
                <th className="px-4 py-3 font-medium text-gray-500">姓名</th>
                <th className="px-4 py-3 font-medium text-gray-500">所属机构</th>
                <th className="px-4 py-3 font-medium text-gray-500">地区</th>
                <th className="px-4 py-3 font-medium text-gray-500">评分</th>
                <th className="px-4 py-3 font-medium text-gray-500">订单</th>
                <th className="px-4 py-3 font-medium text-gray-500">认证</th>
                <th className="px-4 py-3 font-medium text-gray-500">状态</th>
                <th className="px-4 py-3 font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">加载中...</td></tr>
              ) : professionals.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">暂无数据</td></tr>
              ) : professionals.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      p.prof_type === 'notary' ? 'bg-blue-50 text-blue-700' :
                      p.prof_type === 'lawyer' ? 'bg-amber-50 text-amber-700' :
                      'bg-emerald-50 text-emerald-700'
                    }`}>
                      {TYPE_TABS.find(t => t.key === p.prof_type)?.label || p.prof_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-gray-500">{p.org_name || '-'}</td>
                  <td className="px-4 py-3 text-gray-500">{p.province}{p.city ? `·${p.city}` : ''}</td>
                  <td className="px-4 py-3">⭐ {p.rating}</td>
                  <td className="px-4 py-3">{p.order_count}</td>
                  <td className="px-4 py-3">
                    {p.verified === 1 ? (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">已认证</span>
                    ) : (
                      <span className="text-xs text-gray-400">未认证</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {p.status === 'active' ? '活跃' : '停用'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleEdit(p)} className="text-brand-green hover:underline text-xs mr-2">编辑</button>
                    <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:underline text-xs">删除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-4">{editingId ? '编辑服务商' : '新增服务商'}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">类型 *</label>
                <select value={String(form.prof_type)} onChange={e => setForm(f => ({ ...f, prof_type: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm">
                  <option value="notary">公证处</option>
                  <option value="lawyer">律师</option>
                  <option value="fengshui">风水师</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">姓名 *</label>
                <input type="text" value={String(form.name)} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">所属机构</label>
                <input type="text" value={String(form.org_name)} onChange={e => setForm(f => ({ ...f, org_name: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">联系电话</label>
                <input type="text" value={String(form.phone)} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">省份</label>
                <input type="text" value={String(form.province)} onChange={e => setForm(f => ({ ...f, province: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">城市</label>
                <input type="text" value={String(form.city)} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">执业证号</label>
                <input type="text" value={String(form.license_no)} onChange={e => setForm(f => ({ ...f, license_no: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">资质等级</label>
                <input type="text" value={String(form.qualification)} onChange={e => setForm(f => ({ ...f, qualification: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-gray-500 mb-1">简介</label>
                <textarea value={String(form.bio)} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} rows={3} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-gray-500 mb-1">服务项目 (JSON)</label>
                <textarea value={String(form.services)} onChange={e => setForm(f => ({ ...f, services: e.target.value }))} rows={3} className="w-full px-3 py-2 border rounded-lg text-sm font-mono text-xs" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-gray-500 mb-1">服务区域 (JSON)</label>
                <textarea value={String(form.service_areas)} onChange={e => setForm(f => ({ ...f, service_areas: e.target.value }))} rows={2} className="w-full px-3 py-2 border rounded-lg text-sm font-mono text-xs" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">最低价格</label>
                <input type="number" value={String(form.price_min)} onChange={e => setForm(f => ({ ...f, price_min: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">最高价格</label>
                <input type="number" value={String(form.price_max)} onChange={e => setForm(f => ({ ...f, price_max: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={!!form.verified} onChange={e => setForm(f => ({ ...f, verified: e.target.checked }))} />
                  <span className="text-sm">平台认证</span>
                </label>
                <select value={String(form.status)} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="px-3 py-2 border rounded-lg text-sm">
                  <option value="active">活跃</option>
                  <option value="inactive">停用</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleSave} disabled={saving} className="bg-brand-green hover:bg-brand-light text-white px-6 py-2 rounded-lg text-sm disabled:opacity-50">
                {saving ? '保存中...' : '保存'}
              </button>
              <button onClick={() => setShowForm(false)} className="px-6 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
