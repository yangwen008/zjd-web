'use client';

import { useState, useEffect } from 'react';

interface StagingRow {
  id: number; recipe_id: number; recipe_name: string | null; raw_data: string | null;
  status: string; error_msg: string | null; created_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  raw: { label: '原始', className: 'bg-gray-100 text-gray-700' },
  cleaned: { label: '已清洗', className: 'bg-blue-100 text-blue-700' },
  imported: { label: '已导入', className: 'bg-green-100 text-green-700' },
  error: { label: '错误', className: 'bg-red-100 text-red-700' },
};

export default function AdminStagingPage() {
  const [data, setData] = useState<StagingRow[]>([]);
  const [stats, setStats] = useState({ raw: 0, cleaned: 0, imported: 0, error: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [cleaning, setCleaning] = useState(false);
  const [msg, setMsg] = useState('');
  const [previewId, setPreviewId] = useState<number | null>(null);
  const [previewData, setPreviewData] = useState<string>('');

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/staging', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'stats' }) });
      const d = await res.json() as any;
      if (d.success) setStats(d.data);
    } catch {}
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('status', filter);
      params.set('limit', '50');
      const res = await fetch(`/api/admin/staging?${params.toString()}`);
      const d = await res.json() as any;
      setData(d.data || []);
    } catch { setData([]); } finally { setLoading(false); }
  };

  useEffect(() => { fetchStats(); fetchData(); }, [filter]);

  const show = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const toggleSelect = (id: number) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const selectAll = () => {
    const rawIds = data.filter((r) => r.status === 'raw').map((r) => r.id);
    selected.size === rawIds.length ? setSelected(new Set()) : setSelected(new Set(rawIds));
  };

  const handleClean = async () => {
    if (selected.size === 0) { show('❌ 请先选择要清洗的数据'); return; }
    setCleaning(true);
    try {
      const res = await fetch('/api/admin/staging', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'clean', ids: Array.from(selected) }) });
      const d = await res.json() as any;
      if (d.success) { show(`✅ 清洗完成：${d.data.cleaned} 成功，${d.data.errors} 失败`); setSelected(new Set()); fetchStats(); fetchData(); }
      else show(`❌ ${d.error}`);
    } catch { show('❌ 网络错误'); } finally { setCleaning(false); }
  };

  const handleDelete = async () => {
    if (selected.size === 0) { show('❌ 请先选择'); return; }
    if (!confirm(`确定删除 ${selected.size} 条数据？`)) return;
    await fetch('/api/admin/staging', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete', ids: Array.from(selected) }) });
    setSelected(new Set()); fetchStats(); fetchData();
  };

  const handleRetry = async (id: number) => {
    await fetch('/api/admin/staging', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'retry', id }) });
    fetchStats(); fetchData();
  };

  const handlePreview = (row: StagingRow) => {
    setPreviewId(previewId === row.id ? null : row.id);
    try {
      const parsed = JSON.parse(row.raw_data || '{}');
      setPreviewData(JSON.stringify(parsed, null, 2));
    } catch { setPreviewData(row.raw_data || '(空)'); }
  };

  const handleImport = async (id: number) => {
    try {
      const row = data.find((r) => r.id === id);
      if (!row?.raw_data) return;
      const asset = JSON.parse(row.raw_data);
      const res = await fetch('/api/admin/staging', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'import', id, asset }) });
      const d = await res.json() as any;
      if (d.success) { show('✅ 已导入到资产表'); fetchStats(); fetchData(); } else show(`❌ ${d.error}`);
    } catch { show('❌ 数据解析失败'); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">📥 暂存数据管理</h1>
        <div className="flex items-center space-x-2">
          {selected.size > 0 && (
            <>
              <button onClick={handleClean} disabled={cleaning} className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm disabled:opacity-50">{cleaning ? 'AI清洗中...' : `🤖 AI清洗 (${selected.size})`}</button>
              <button onClick={handleDelete} className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm">🗑️ 删除 ({selected.size})</button>
            </>
          )}
        </div>
      </div>

      {msg && <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${msg.startsWith('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{msg}</div>}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: '原始数据', value: stats.raw, color: 'text-gray-900', bg: 'bg-gray-50' },
          { label: '已清洗', value: stats.cleaned, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: '已导入', value: stats.imported, color: 'text-green-600', bg: 'bg-green-50' },
          { label: '错误', value: stats.error, color: 'text-red-600', bg: 'bg-red-50' },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-xl p-4 text-center`}>
            <div className="text-xs text-gray-500">{s.label}</div>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center space-x-2 mb-4">
        {[{ key: 'all', label: '全部' }, { key: 'raw', label: '原始' }, { key: 'cleaned', label: '已清洗' }, { key: 'imported', label: '已导入' }, { key: 'error', label: '错误' }].map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)} className={`px-3 py-1.5 text-xs rounded-full transition-colors ${filter === f.key ? 'bg-brand-green text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{f.label}</button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50 text-left">
            <th className="px-4 py-3 w-10"><input type="checkbox" onChange={selectAll} checked={data.filter(r => r.status === 'raw').length > 0 && selected.size === data.filter(r => r.status === 'raw').length} /></th>
            <th className="px-4 py-3 font-medium text-gray-500">ID</th>
            <th className="px-4 py-3 font-medium text-gray-500">配方</th>
            <th className="px-4 py-3 font-medium text-gray-500">数据预览</th>
            <th className="px-4 py-3 font-medium text-gray-500">状态</th>
            <th className="px-4 py-3 font-medium text-gray-500">时间</th>
            <th className="px-4 py-3 font-medium text-gray-500">操作</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">加载中...</td></tr>
            : data.length > 0 ? data.map((r) => {
              const st = STATUS_CONFIG[r.status] || STATUS_CONFIG.raw;
              let preview = '';
              try { preview = JSON.stringify(JSON.parse(r.raw_data || '{}')).substring(0, 80); } catch { preview = (r.raw_data || '').substring(0, 80); }

              return (
                <tr key={r.id} className={`hover:bg-gray-50/50 ${previewId === r.id ? 'bg-blue-50/30' : ''}`}>
                  <td className="px-4 py-3">{r.status === 'raw' && <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleSelect(r.id)} />}</td>
                  <td className="px-4 py-3 text-gray-400 font-mono">#{r.id}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{r.recipe_name || '-'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs font-mono max-w-[300px] truncate">{preview}...</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${st.className}`}>{st.label}</span>
                    {r.error_msg && <div className="text-xs text-red-500 mt-1 max-w-[200px] truncate">{r.error_msg}</div>}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{r.created_at}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <button onClick={() => handlePreview(r)} className="text-xs text-blue-500 hover:underline">{previewId === r.id ? '收起' : '预览'}</button>
                      {r.status === 'cleaned' && <button onClick={() => handleImport(r.id)} className="text-xs text-green-600 hover:underline">导入</button>}
                      {r.status === 'error' && <button onClick={() => handleRetry(r.id)} className="text-xs text-orange-500 hover:underline">重试</button>}
                    </div>
                  </td>
                </tr>
              );
            }) : <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">暂无暂存数据</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Preview Panel */}
      {previewId && (
        <div className="mt-4 bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="font-bold text-gray-900 mb-3">📄 数据预览 #{previewId}</h3>
          <pre className="bg-gray-50 rounded-lg p-4 text-xs text-gray-700 overflow-auto max-h-96 whitespace-pre-wrap">{previewData}</pre>
        </div>
      )}
    </div>
  );
}
