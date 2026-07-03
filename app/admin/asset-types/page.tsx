'use client';

import { useState, useEffect } from 'react';

interface AssetType { id: number; name: string; icon: string | null; description: string | null; sort_order: number; active: number; asset_count?: number; }

export default function AdminAssetTypesPage() {
  const [data, setData] = useState<AssetType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const emptyForm = { name: '', icon: '', description: '', sort_order: '0', active: true };
  const [form, setForm] = useState(emptyForm);

  const fetchData = async () => {
    setLoading(true);
    try { const res = await fetch('/api/admin/asset-types'); const d = await res.json() as any; setData(d.data || []); } catch { setData([]); } finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const show = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const handleEdit = (r: AssetType) => {
    setEditId(r.id);
    setForm({ name: r.name, icon: r.icon || '', description: r.description || '', sort_order: String(r.sort_order), active: r.active === 1 });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { show('❌ 类型名称不能为空'); return; }
    setSaving(true);
    try {
      const payload: any = { action: editId ? 'update' : 'add', ...form, sort_order: parseInt(form.sort_order) || 0, active: form.active ? 1 : 0 };
      if (editId) payload.id = editId;
      const res = await fetch('/api/admin/asset-types', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const d = await res.json() as any;
      if (d.success) { show(editId ? '✅ 已更新' : '✅ 已添加'); setShowForm(false); setEditId(null); setForm(emptyForm); fetchData(); } else show(`❌ ${d.error}`);
    } catch { show('❌ 网络错误'); } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除？如果该类型下有资产会删除失败。')) return;
    const res = await fetch('/api/admin/asset-types', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete', id }) });
    const d = await res.json() as any;
    if (d.success) { show('✅ 已删除'); fetchData(); } else show(`❌ ${d.error}`);
  };

  const handleToggle = async (id: number, active: number) => {
    await fetch('/api/admin/asset-types', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'toggle-active', id, active: active ? 0 : 1 }) });
    fetchData();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">🏷️ 资产类型管理</h1>
        <button onClick={() => { setShowForm(!showForm); setEditId(null); setForm(emptyForm); }} className="bg-brand-green hover:bg-brand-light text-white px-4 py-2 rounded-lg text-sm">{showForm ? '取消' : '+ 新增类型'}</button>
      </div>
      {msg && (
              <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
                <div className={`${msg.startsWith('✅') ? 'bg-green-600 text-white' : 'bg-red-600 text-white'} px-8 py-4 rounded-xl shadow-2xl text-sm font-medium`}>
                  {msg}
                </div>
              </div>
            )}

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
          <h2 className="font-bold text-gray-900 mb-4">{editId ? '编辑资产类型' : '新增资产类型'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div><label className="block text-xs font-medium text-gray-500 mb-1">类型名称</label><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="宅基地" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green" /></div>
            <div><label className="block text-xs font-medium text-gray-500 mb-1">图标(emoji)</label><input type="text" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="🏠" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green" /></div>
            <div><label className="block text-xs font-medium text-gray-500 mb-1">排序</label><input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green" /></div>
            <div><label className="block text-xs font-medium text-gray-500 mb-1">描述</label><input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green" /></div>
          </div>
          <div className="flex items-center space-x-3">
            <button onClick={handleSave} disabled={saving} className="bg-brand-green hover:bg-brand-light text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50">{saving ? '保存中...' : (editId ? '更新' : '添加')}</button>
            <button onClick={() => { setShowForm(false); setEditId(null); }} className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm">取消</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50 text-left">
            <th className="px-4 py-3 font-medium text-gray-500">排序</th>
            <th className="px-4 py-3 font-medium text-gray-500">图标</th>
            <th className="px-4 py-3 font-medium text-gray-500">名称</th>
            <th className="px-4 py-3 font-medium text-gray-500">描述</th>
            <th className="px-4 py-3 font-medium text-gray-500">资产数</th>
            <th className="px-4 py-3 font-medium text-gray-500">状态</th>
            <th className="px-4 py-3 font-medium text-gray-500">操作</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">加载中...</td></tr>
            : data.length > 0 ? data.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50/50">
                <td className="px-4 py-3 text-gray-500">{r.sort_order}</td>
                <td className="px-4 py-3 text-2xl">{r.icon || '📄'}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{r.name}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{r.description || '-'}</td>
                <td className="px-4 py-3 text-gray-700 font-medium">{r.asset_count || 0}</td>
                <td className="px-4 py-3">
                  <button onClick={() => handleToggle(r.id, r.active)} className={`text-xs px-2 py-0.5 rounded ${r.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{r.active ? '启用' : '禁用'}</button>
                </td>
                <td className="px-4 py-3"><div className="flex items-center space-x-2"><button onClick={() => handleEdit(r)} className="text-xs text-brand-green hover:underline">编辑</button><button onClick={() => handleDelete(r.id)} className="text-xs text-red-500 hover:underline">删除</button></div></td>
              </tr>
            )) : <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">暂无资产类型</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
