'use client';

import { useState, useEffect } from 'react';

interface MarketRow {
  id: number; province: string; median_price: number; change_pct: number; bargain_space: number; total_listings: number;
}

function getChangeStyle(pct: number) { return pct > 0 ? 'text-green-600' : pct < 0 ? 'text-red-600' : 'text-gray-400'; }
function getChangeText(pct: number) { return pct > 0 ? `↑ +${pct}%` : pct < 0 ? `↓ ${pct}%` : '→ 持平'; }
function getBarColor(space: number) { return space > -10 ? 'bg-red-400' : space > -15 ? 'bg-orange-400' : 'bg-blue-400'; }

export default function AdminMarketDataPage() {
  const [data, setData] = useState<MarketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({ province: '', median_price: '', change_pct: '', bargain_space: '', total_listings: '' });

  const fetchData = async () => {
    setLoading(true);
    try { const res = await fetch('/api/admin/market-data'); const d = await res.json() as any; setData(d.data || []); } catch { setData([]); } finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const show = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const handleEdit = (r: MarketRow) => {
    setEditId(r.id);
    setForm({ province: r.province, median_price: String(r.median_price), change_pct: String(r.change_pct), bargain_space: String(r.bargain_space), total_listings: String(r.total_listings) });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.province.trim()) { show('❌ 省份不能为空'); return; }
    setSaving(true);
    try {
      const payload: any = { action: editId ? 'update' : 'add', ...form, median_price: parseFloat(form.median_price) || 0, change_pct: parseFloat(form.change_pct) || 0, bargain_space: parseFloat(form.bargain_space) || 0, total_listings: parseInt(form.total_listings) || 0 };
      if (editId) payload.id = editId;
      const res = await fetch('/api/admin/market-data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const d = await res.json() as any;
      if (d.success) { show(editId ? '✅ 已更新' : '✅ 已添加'); setShowForm(false); setEditId(null); setForm({ province: '', median_price: '', change_pct: '', bargain_space: '', total_listings: '' }); fetchData(); } else show(`❌ ${d.error}`);
    } catch { show('❌ 网络错误'); } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除？')) return;
    await fetch('/api/admin/market-data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete', id }) });
    fetchData();
  };

  // Chart calculations
  const maxPrice = Math.max(...data.map((d) => d.median_price), 1);
  const maxListings = Math.max(...data.map((d) => d.total_listings), 1);
  const totalListings = data.reduce((s, d) => s + d.total_listings, 0);
  const avgPrice = data.length > 0 ? (data.reduce((s, d) => s + d.median_price, 0) / data.length).toFixed(1) : '0';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">💰 行情数据管理</h1>
        <button onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ province: '', median_price: '', change_pct: '', bargain_space: '', total_listings: '' }); }} className="bg-brand-green hover:bg-brand-light text-white px-4 py-2 rounded-lg text-sm">{showForm ? '取消' : '+ 新增省份'}</button>
      </div>
      {msg && <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${msg.startsWith('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{msg}</div>}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: '覆盖省份', value: `${data.length} 省`, color: 'text-gray-900' },
          { label: '全网挂牌总量', value: totalListings.toLocaleString() + ' 宗', color: 'text-blue-600' },
          { label: '全国均价', value: `¥${avgPrice}万/年`, color: 'text-green-600' },
          { label: '最高均价', value: `¥${maxPrice}万/年`, color: 'text-yellow-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="text-xs text-gray-500 mb-1">{s.label}</div>
            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      {data.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Price Bar Chart */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="font-bold text-gray-900 mb-4 text-sm">📊 各省流转均价（万/年）</h3>
            <div className="space-y-3">
              {[...data].sort((a, b) => b.median_price - a.median_price).map((d) => (
                <div key={d.id} className="flex items-center space-x-3">
                  <div className="w-24 text-xs text-gray-600 text-right truncate">{d.province}</div>
                  <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden relative">
                    <div className="bg-gradient-to-r from-brand-green to-brand-accent h-6 rounded-full transition-all flex items-center justify-end pr-2" style={{ width: `${Math.max((d.median_price / maxPrice) * 100, 8)}%` }}>
                      <span className="text-xs text-white font-bold">¥{d.median_price}</span>
                    </div>
                  </div>
                  <div className={`w-16 text-xs font-medium text-right ${getChangeStyle(d.change_pct)}`}>
                    {getChangeText(d.change_pct)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Listings + Bargain Space */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="font-bold text-gray-900 mb-4 text-sm">📊 挂牌量 & 砍价空间</h3>
            <div className="space-y-3">
              {[...data].sort((a, b) => b.total_listings - a.total_listings).map((d) => (
                <div key={d.id} className="flex items-center space-x-3">
                  <div className="w-24 text-xs text-gray-600 text-right truncate">{d.province}</div>
                  <div className="flex-1 flex items-center space-x-2">
                    <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                      <div className="bg-blue-400 h-4 rounded-full transition-all" style={{ width: `${Math.max((d.total_listings / maxListings) * 100, 4)}%` }} />
                    </div>
                    <span className="text-xs text-gray-700 font-medium w-16 text-right">{d.total_listings}宗</span>
                  </div>
                  <div className="w-28 flex items-center space-x-1">
                    <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div className={`${getBarColor(d.bargain_space)} h-3 rounded-full`} style={{ width: `${Math.min(Math.abs(d.bargain_space) * 5, 100)}%` }} />
                    </div>
                    <span className="text-xs text-gray-500 w-12 text-right">{d.bargain_space}%</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-end space-x-4 mt-4 text-xs text-gray-400">
              <span className="flex items-center space-x-1"><span className="w-3 h-3 bg-blue-400 rounded-full" /><span>挂牌量</span></span>
              <span className="flex items-center space-x-1"><span className="w-3 h-3 bg-red-400 rounded-full" /><span>砍价空间</span></span>
            </div>
          </div>
        </div>
      )}

      {/* Edit Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
          <h2 className="font-bold text-gray-900 mb-4">{editId ? '编辑行情数据' : '新增省份行情'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            <div><label className="block text-xs font-medium text-gray-500 mb-1">省份</label><input type="text" value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green" /></div>
            <div><label className="block text-xs font-medium text-gray-500 mb-1">租金中位数(万/年)</label><input type="number" step="0.1" value={form.median_price} onChange={(e) => setForm({ ...form, median_price: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green" /></div>
            <div><label className="block text-xs font-medium text-gray-500 mb-1">环比涨跌(%)</label><input type="number" step="0.1" value={form.change_pct} onChange={(e) => setForm({ ...form, change_pct: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green" /></div>
            <div><label className="block text-xs font-medium text-gray-500 mb-1">砍价空间(%)</label><input type="number" step="0.1" value={form.bargain_space} onChange={(e) => setForm({ ...form, bargain_space: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green" /></div>
            <div><label className="block text-xs font-medium text-gray-500 mb-1">挂牌数</label><input type="number" value={form.total_listings} onChange={(e) => setForm({ ...form, total_listings: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green" /></div>
          </div>
          <div className="flex items-center space-x-3">
            <button onClick={handleSave} disabled={saving} className="bg-brand-green hover:bg-brand-light text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50">{saving ? '保存中...' : (editId ? '更新' : '添加')}</button>
            <button onClick={() => { setShowForm(false); setEditId(null); }} className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm">取消</button>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50 text-left">
            <th className="px-4 py-3 font-medium text-gray-500">省份</th>
            <th className="px-4 py-3 font-medium text-gray-500">挂牌数</th>
            <th className="px-4 py-3 font-medium text-gray-500">中位数</th>
            <th className="px-4 py-3 font-medium text-gray-500">环比涨跌</th>
            <th className="px-4 py-3 font-medium text-gray-500">砍价空间</th>
            <th className="px-4 py-3 font-medium text-gray-500">操作</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">加载中...</td></tr>
            : data.length > 0 ? data.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50/50">
                <td className="px-4 py-3 font-medium text-gray-900">{r.province}</td>
                <td className="px-4 py-3">{r.total_listings?.toLocaleString()} 宗</td>
                <td className="px-4 py-3 font-bold">¥{r.median_price} 万</td>
                <td className="px-4 py-3"><span className={`font-medium ${getChangeStyle(r.change_pct)}`}>{getChangeText(r.change_pct)}</span></td>
                <td className="px-4 py-3 text-gray-500">{r.bargain_space}%</td>
                <td className="px-4 py-3"><div className="flex items-center space-x-2"><button onClick={() => handleEdit(r)} className="text-xs text-brand-green hover:underline">编辑</button><button onClick={() => handleDelete(r.id)} className="text-xs text-red-500 hover:underline">删除</button></div></td>
              </tr>
            )) : <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">暂无行情数据</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
