'use client';

import { useState, useEffect } from 'react';

interface Region { id: number; code: string; name: string; level: string; parent_code: string | null; province: string | null; city: string | null; emoji: string | null; lat: number | null; lng: number | null; sort_order: number; active: number; }

const LEVEL_LABELS: Record<string, { label: string; icon: string }> = {
  province: { label: '省级', icon: '🌍' },
  city: { label: '市级', icon: '🏙️' },
  district: { label: '区县', icon: '📍' },
};

export default function AdminRegionsPage() {
  const [data, setData] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLevel, setFilterLevel] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const emptyForm = { code: '', name: '', level: 'province', parent_code: '', province: '', city: '', emoji: '', lat: '', lng: '', sort_order: '0', active: true };
  const [form, setForm] = useState(emptyForm);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterLevel) params.set('level', filterLevel);
      const res = await fetch(`/api/admin/regions?${params.toString()}`);
      const d = await res.json() as any;
      setData(d.data || []);
    } catch { setData([]); } finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, [filterLevel]);

  const show = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const handleEdit = (r: Region) => {
    setEditId(r.id);
    setForm({ code: r.code, name: r.name, level: r.level, parent_code: r.parent_code || '', province: r.province || '', city: r.city || '', emoji: r.emoji || '', lat: r.lat != null ? String(r.lat) : '', lng: r.lng != null ? String(r.lng) : '', sort_order: String(r.sort_order), active: r.active === 1 });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.code.trim() || !form.name.trim()) { show('❌ 代码和名称不能为空'); return; }
    setSaving(true);
    try {
      const payload: any = { action: editId ? 'update' : 'add', ...form, lat: form.lat ? parseFloat(form.lat) : null, lng: form.lng ? parseFloat(form.lng) : null, sort_order: parseInt(form.sort_order) || 0, active: form.active ? 1 : 0 };
      if (editId) payload.id = editId;
      const res = await fetch('/api/admin/regions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const d = await res.json() as any;
      if (d.success) { show(editId ? '✅ 已更新' : '✅ 已添加'); setShowForm(false); setEditId(null); setForm(emptyForm); fetchData(); } else show(`❌ ${d.error}`);
    } catch { show('❌ 网络错误'); } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除？如果有子区域会删除失败。')) return;
    const res = await fetch('/api/admin/regions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete', id }) });
    const d = await res.json() as any;
    if (d.success) { show('✅ 已删除'); fetchData(); } else show(`❌ ${d.error}`);
  };

  const handleToggle = async (id: number, active: number) => {
    await fetch('/api/admin/regions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'toggle-active', id, active: active ? 0 : 1 }) });
    fetchData();
  };

  // Build tree structure
  const provinces = data.filter((r) => r.level === 'province');
  const cities = data.filter((r) => r.level === 'city');
  const districts = data.filter((r) => r.level === 'district');

  const renderTree = () => {
    if (filterLevel) {
      // Flat list when filtering
      return data.map((r) => (
        <div key={r.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 border-b border-gray-50">
          <div className="flex items-center space-x-3">
            <span className="text-lg">{r.emoji || LEVEL_LABELS[r.level]?.icon || '📍'}</span>
            <div>
              <div className="font-medium text-gray-900">{r.name} <span className="text-xs text-gray-400 font-mono">({r.code})</span></div>
              <div className="text-xs text-gray-400">{r.province || ''} {r.city ? `· ${r.city}` : ''}</div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={() => handleToggle(r.id, r.active)} className={`text-xs px-2 py-0.5 rounded ${r.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{r.active ? '启用' : '禁用'}</button>
            <button onClick={() => handleEdit(r)} className="text-xs text-brand-green hover:underline">编辑</button>
            <button onClick={() => handleDelete(r.id)} className="text-xs text-red-500 hover:underline">删除</button>
          </div>
        </div>
      ));
    }

    // Tree view
    return provinces.map((p) => (
      <div key={p.id}>
        <div className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 border-b border-gray-50 bg-gray-50/50">
          <div className="flex items-center space-x-3">
            <span className="text-lg">{p.emoji || '🌍'}</span>
            <div><div className="font-bold text-gray-900">{p.name} <span className="text-xs text-gray-400 font-mono font-normal">({p.code})</span></div></div>
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={() => { setForm({ ...emptyForm, level: 'city', parent_code: p.code, province: p.name }); setShowForm(true); setEditId(null); }} className="text-xs text-blue-500 hover:underline">➕ 市级</button>
            <button onClick={() => handleToggle(p.id, p.active)} className={`text-xs px-2 py-0.5 rounded ${p.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{p.active ? '启用' : '禁用'}</button>
            <button onClick={() => handleEdit(p)} className="text-xs text-brand-green hover:underline">编辑</button>
          </div>
        </div>
        {cities.filter((c) => c.parent_code === p.code).map((c) => (
          <div key={c.id}>
            <div className="flex items-center justify-between pl-12 pr-4 py-2.5 hover:bg-gray-50 border-b border-gray-50">
              <div className="flex items-center space-x-3">
                <span className="text-sm">🏙️</span>
                <div><div className="font-medium text-gray-800 text-sm">{c.name} <span className="text-xs text-gray-400 font-mono">({c.code})</span></div></div>
              </div>
              <div className="flex items-center space-x-2">
                <button onClick={() => { setForm({ ...emptyForm, level: 'district', parent_code: c.code, province: c.province || '', city: c.name }); setShowForm(true); setEditId(null); }} className="text-xs text-blue-500 hover:underline">➕ 区县</button>
                <button onClick={() => handleToggle(c.id, c.active)} className={`text-xs px-2 py-0.5 rounded ${c.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{c.active ? '启用' : '禁用'}</button>
                <button onClick={() => handleEdit(c)} className="text-xs text-brand-green hover:underline">编辑</button>
              </div>
            </div>
            {districts.filter((d) => d.parent_code === c.code).map((d) => (
              <div key={d.id} className="flex items-center justify-between pl-20 pr-4 py-2 hover:bg-gray-50 border-b border-gray-50">
                <div className="flex items-center space-x-3">
                  <span className="text-sm">📍</span>
                  <div><div className="text-sm text-gray-700">{d.name} <span className="text-xs text-gray-400 font-mono">({d.code})</span></div></div>
                </div>
                <div className="flex items-center space-x-2">
                  <button onClick={() => handleToggle(d.id, d.active)} className={`text-xs px-2 py-0.5 rounded ${d.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{d.active ? '启用' : '禁用'}</button>
                  <button onClick={() => handleEdit(d)} className="text-xs text-brand-green hover:underline">编辑</button>
                  <button onClick={() => handleDelete(d.id)} className="text-xs text-red-500 hover:underline">删除</button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    ));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">🗺️ 行政区划管理</h1>
        <button onClick={() => { setShowForm(!showForm); setEditId(null); setForm(emptyForm); }} className="bg-brand-green hover:bg-brand-light text-white px-4 py-2 rounded-lg text-sm">{showForm ? '取消' : '+ 新增区划'}</button>
      </div>
      {msg && (
              <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
                <div className={`${msg.startsWith('✅') ? 'bg-green-600 text-white' : 'bg-red-600 text-white'} px-8 py-4 rounded-xl shadow-2xl text-sm font-medium`}>
                  {msg}
                </div>
              </div>
            )}

      <div className="flex items-center space-x-2 mb-4">
        {[{ key: '', label: '树形视图' }, { key: 'province', label: '省级' }, { key: 'city', label: '市级' }, { key: 'district', label: '区县' }].map((f) => (
          <button key={f.key} onClick={() => setFilterLevel(f.key)} className={`px-3 py-1.5 text-xs rounded-full transition-colors ${filterLevel === f.key ? 'bg-brand-green text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{f.label}</button>
        ))}
        <span className="text-xs text-gray-400">共 {data.length} 条</span>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
          <h2 className="font-bold text-gray-900 mb-4">{editId ? '编辑区划' : '新增区划'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div><label className="block text-xs font-medium text-gray-500 mb-1">行政区划代码</label><input type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="330000" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green" /></div>
            <div><label className="block text-xs font-medium text-gray-500 mb-1">名称</label><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green" /></div>
            <div><label className="block text-xs font-medium text-gray-500 mb-1">级别</label><select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green"><option value="province">省级</option><option value="city">市级</option><option value="district">区县</option></select></div>
            <div><label className="block text-xs font-medium text-gray-500 mb-1">上级代码</label><input type="text" value={form.parent_code} onChange={(e) => setForm({ ...form, parent_code: e.target.value })} placeholder="省级留空" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green" /></div>
            <div><label className="block text-xs font-medium text-gray-500 mb-1">所属省份</label><input type="text" value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green" /></div>
            <div><label className="block text-xs font-medium text-gray-500 mb-1">所属城市</label><input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green" /></div>
            <div><label className="block text-xs font-medium text-gray-500 mb-1">Emoji</label><input type="text" value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} placeholder="🌊" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green" /></div>
            <div><label className="block text-xs font-medium text-gray-500 mb-1">排序</label><input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green" /></div>
          </div>
          <div className="flex items-center space-x-3">
            <button onClick={handleSave} disabled={saving} className="bg-brand-green hover:bg-brand-light text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50">{saving ? '保存中...' : (editId ? '更新' : '添加')}</button>
            <button onClick={() => { setShowForm(false); setEditId(null); }} className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm">取消</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? <div className="px-4 py-8 text-center text-gray-400">加载中...</div> : data.length > 0 ? renderTree() : <div className="px-4 py-8 text-center text-gray-400">暂无行政区划数据</div>}
      </div>
    </div>
  );
}
