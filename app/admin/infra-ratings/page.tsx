'use client';

import { useState, useEffect } from 'react';

interface InfraRating {
  id: number; region: string; province: string | null; city: string | null;
  signal_5g_ms: number; hospital_min: number; grid_redundancy: number; overall_grade: string;
}

const GRADES = ['S+', 'S', 'A+', 'A', 'A-', 'B+', 'B', 'C'];

export default function AdminInfraRatingsPage() {
  const [data, setData] = useState<InfraRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const emptyForm = { region: '', province: '', city: '', signal_5g_ms: '', hospital_min: '', grid_redundancy: '', overall_grade: 'A' };
  const [form, setForm] = useState(emptyForm);

  const fetchData = async () => {
    setLoading(true);
    try { const res = await fetch('/api/admin/infra-ratings'); const d = await res.json() as any; setData(d.data || []); } catch { setData([]); } finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const show = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const handleEdit = (r: InfraRating) => {
    setEditId(r.id);
    setForm({ region: r.region, province: r.province || '', city: r.city || '', signal_5g_ms: String(r.signal_5g_ms), hospital_min: String(r.hospital_min), grid_redundancy: String(r.grid_redundancy), overall_grade: r.overall_grade });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.region.trim()) { show('❌ 区域名称不能为空'); return; }
    setSaving(true);
    try {
      const payload: any = { action: editId ? 'update' : 'add', ...form, signal_5g_ms: parseInt(form.signal_5g_ms) || 0, hospital_min: parseInt(form.hospital_min) || 0, grid_redundancy: parseInt(form.grid_redundancy) || 0 };
      if (editId) payload.id = editId;
      const res = await fetch('/api/admin/infra-ratings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const d = await res.json() as any;
      if (d.success) { show(editId ? '✅ 已更新' : '✅ 已添加'); setShowForm(false); setEditId(null); setForm(emptyForm); fetchData(); } else show(`❌ ${d.error}`);
    } catch { show('❌ 网络错误'); } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除？')) return;
    await fetch('/api/admin/infra-ratings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete', id }) });
    fetchData();
  };

  const getColor = (v: number, thresholds: { good: number; ok: number }, invert = false) => {
    if (invert) return v <= thresholds.good ? 'text-green-600' : v <= thresholds.ok ? 'text-yellow-600' : 'text-red-600';
    return v >= thresholds.good ? 'text-green-600' : v >= thresholds.ok ? 'text-yellow-600' : 'text-red-600';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">📡 基建评分管理</h1>
        <button onClick={() => { setShowForm(!showForm); setEditId(null); setForm(emptyForm); }} className="bg-brand-green hover:bg-brand-light text-white px-4 py-2 rounded-lg text-sm">{showForm ? '取消' : '+ 新增区域'}</button>
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
          <h2 className="font-bold text-gray-900 mb-4">{editId ? '编辑基建评分' : '新增区域基建评分'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div><label className="block text-xs font-medium text-gray-500 mb-1">区域名称</label><input type="text" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} placeholder="杭州·安吉" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green" /></div>
            <div><label className="block text-xs font-medium text-gray-500 mb-1">省份</label><input type="text" value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green" /></div>
            <div><label className="block text-xs font-medium text-gray-500 mb-1">城市</label><input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green" /></div>
            <div><label className="block text-xs font-medium text-gray-500 mb-1">综合评级</label><select value={form.overall_grade} onChange={(e) => setForm({ ...form, overall_grade: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green">{GRADES.map((g) => <option key={g} value={g}>{g}</option>)}</select></div>
            <div><label className="block text-xs font-medium text-gray-500 mb-1">5G延迟(ms)</label><input type="number" value={form.signal_5g_ms} onChange={(e) => setForm({ ...form, signal_5g_ms: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green" /></div>
            <div><label className="block text-xs font-medium text-gray-500 mb-1">医院车程(分钟)</label><input type="number" value={form.hospital_min} onChange={(e) => setForm({ ...form, hospital_min: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green" /></div>
            <div><label className="block text-xs font-medium text-gray-500 mb-1">电网冗余(%)</label><input type="number" value={form.grid_redundancy} onChange={(e) => setForm({ ...form, grid_redundancy: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green" /></div>
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
            <th className="px-4 py-3 font-medium text-gray-500">排名</th>
            <th className="px-4 py-3 font-medium text-gray-500">区域</th>
            <th className="px-4 py-3 font-medium text-gray-500">省份</th>
            <th className="px-4 py-3 font-medium text-gray-500">5G延迟</th>
            <th className="px-4 py-3 font-medium text-gray-500">医院车程</th>
            <th className="px-4 py-3 font-medium text-gray-500">电网冗余</th>
            <th className="px-4 py-3 font-medium text-gray-500">评级</th>
            <th className="px-4 py-3 font-medium text-gray-500">操作</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">加载中...</td></tr>
            : data.length > 0 ? data.map((r, i) => (
              <tr key={r.id} className="hover:bg-gray-50/50">
                <td className="px-4 py-3 font-bold text-gray-400">{i === 1 ? '🥈' : i === 2 ? '🥉' : i === 0 ? '🥇' : ''} {i + 1}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{r.region}</td>
                <td className="px-4 py-3 text-gray-500">{r.province || '-'}</td>
                <td className={`px-4 py-3 font-medium ${getColor(r.signal_5g_ms, { good: 20, ok: 40 }, true)}`}>{r.signal_5g_ms}ms</td>
                <td className={`px-4 py-3 font-medium ${getColor(r.hospital_min, { good: 15, ok: 30 }, true)}`}>{r.hospital_min}分钟</td>
                <td className={`px-4 py-3 font-medium ${getColor(r.grid_redundancy, { good: 95, ok: 85 })}`}>{r.grid_redundancy}%</td>
                <td className="px-4 py-3"><span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-bold">{r.overall_grade}</span></td>
                <td className="px-4 py-3"><div className="flex items-center space-x-2"><button onClick={() => handleEdit(r)} className="text-xs text-brand-green hover:underline">编辑</button><button onClick={() => handleDelete(r.id)} className="text-xs text-red-500 hover:underline">删除</button></div></td>
              </tr>
            )) : <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">暂无基建数据</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
