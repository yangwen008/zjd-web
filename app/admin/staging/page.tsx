'use client';

import { useState, useEffect } from 'react';

interface StagingRow {
  id: number; recipe_id: number; recipe_name: string | null;
  raw_html: string | null; raw_data: string | null;
  status: string; error_msg: string | null; created_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: string }> = {
  raw: { label: '原始', className: 'bg-gray-100 text-gray-700', icon: '📋' },
  cleaned: { label: '已清洗', className: 'bg-blue-100 text-blue-700', icon: '🤖' },
  imported: { label: '已导入', className: 'bg-green-100 text-green-700', icon: '✅' },
  error: { label: '错误', className: 'bg-red-100 text-red-700', icon: '❌' },
};

export default function AdminStagingPage() {
  const [data, setData] = useState<StagingRow[]>([]);
  const [stats, setStats] = useState({ raw: 0, cleaned: 0, imported: 0, error: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [cleaning, setCleaning] = useState(false);
  const [msg, setMsg] = useState('');

  // Active row for detail view
  const [activeRow, setActiveRow] = useState<StagingRow | null>(null);
  const [editJson, setEditJson] = useState('');
  const [importing, setImporting] = useState(false);

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
    if (activeRow && selected.has(activeRow.id)) setActiveRow(null);
  };

  const handleRetry = async (id: number) => {
    await fetch('/api/admin/staging', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'retry', id }) });
    fetchStats(); fetchData();
  };

  const handleRowClick = (row: StagingRow) => {
    if (activeRow?.id === row.id) { setActiveRow(null); return; }
    setActiveRow(row);
    // Prepare JSON editor content
    try {
      const parsed = JSON.parse(row.raw_data || '{}');
      setEditJson(JSON.stringify(parsed, null, 2));
    } catch {
      setEditJson(row.raw_data || '{}');
    }
  };

  const handleCleanSingle = async (id: number) => {
    setCleaning(true);
    try {
      const res = await fetch('/api/admin/staging', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'clean', ids: [id] }) });
      const d = await res.json() as any;
      if (d.success) {
        show(`✅ AI清洗完成`);
        fetchStats(); fetchData();
        // Refresh active row
        const updated = data.find((r) => r.id === id);
        if (updated) {
          const refreshed = { ...updated, status: 'cleaned' };
          setActiveRow(refreshed);
          try { setEditJson(JSON.stringify(JSON.parse(refreshed.raw_data || '{}'), null, 2)); } catch { setEditJson(refreshed.raw_data || '{}'); }
        }
      } else show(`❌ ${d.error}`);
    } catch { show('❌ 网络错误'); } finally { setCleaning(false); }
  };

  const handleImport = async () => {
    if (!activeRow) return;
    setImporting(true);
    try {
      let asset: Record<string, unknown>;
      try { asset = JSON.parse(editJson); } catch { show('❌ JSON格式错误'); setImporting(false); return; }

      const res = await fetch('/api/admin/staging', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'import', id: activeRow.id, asset }) });
      const d = await res.json() as any;
      if (d.success) { show('✅ 已导入到资产表'); setActiveRow(null); fetchStats(); fetchData(); } else show(`❌ ${d.error}`);
    } catch { show('❌ 导入失败'); } finally { setImporting(false); }
  };

  const renderRawPreview = (row: StagingRow) => {
    if (row.raw_html) {
      return (
        <div className="relative w-full h-full">
          <iframe
            srcDoc={row.raw_html}
            className="w-full h-full border-0 rounded"
            sandbox="allow-same-origin"
            title="Raw HTML Preview"
          />
        </div>
      );
    }
    // If no raw_html, show raw_data as formatted text
    try {
      const parsed = JSON.parse(row.raw_data || '{}');
      return <pre className="text-xs text-gray-700 whitespace-pre-wrap p-4 overflow-auto h-full">{JSON.stringify(parsed, null, 2)}</pre>;
    } catch {
      return <pre className="text-xs text-gray-700 whitespace-pre-wrap p-4 overflow-auto h-full">{row.raw_data || '(无数据)'}</pre>;
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h1 className="text-2xl font-bold text-gray-900">📥 暂存数据管理</h1>
        <div className="flex items-center space-x-2">
          {selected.size > 0 && (
            <>
              <button onClick={handleClean} disabled={cleaning} className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm disabled:opacity-50">{cleaning ? 'AI清洗中...' : `🤖 批量AI清洗 (${selected.size})`}</button>
              <button onClick={handleDelete} className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm">🗑️ 删除 ({selected.size})</button>
            </>
          )}
        </div>
      </div>

      {msg && <div className={`mb-3 px-4 py-2 rounded-lg text-sm flex-shrink-0 ${msg.startsWith('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{msg}</div>}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-4 flex-shrink-0">
        {[
          { label: '原始', value: stats.raw, color: 'text-gray-900', bg: 'bg-gray-50', key: 'raw' },
          { label: '已清洗', value: stats.cleaned, color: 'text-blue-600', bg: 'bg-blue-50', key: 'cleaned' },
          { label: '已导入', value: stats.imported, color: 'text-green-600', bg: 'bg-green-50', key: 'imported' },
          { label: '错误', value: stats.error, color: 'text-red-600', bg: 'bg-red-50', key: 'error' },
        ].map((s) => (
          <button key={s.key} onClick={() => setFilter(filter === s.key ? 'all' : s.key)} className={`${s.bg} rounded-xl p-3 text-center transition-all ${filter === s.key ? 'ring-2 ring-brand-green' : 'hover:ring-1 hover:ring-gray-300'}`}>
            <div className="text-xs text-gray-500">{s.label}</div>
            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
          </button>
        ))}
      </div>

      {/* Main Content: List + Detail */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Left: List */}
        <div className={`${activeRow ? 'w-1/3' : 'w-full'} transition-all duration-300 bg-white rounded-xl border border-gray-100 overflow-hidden flex flex-col`}>
          <div className="px-4 py-2 border-b border-gray-100 bg-gray-50 text-xs text-gray-500 flex items-center justify-between flex-shrink-0">
            <span>共 {data.length} 条</span>
            <label className="flex items-center space-x-1 cursor-pointer">
              <input type="checkbox" onChange={selectAll} checked={data.filter(r => r.status === 'raw').length > 0 && selected.size === data.filter(r => r.status === 'raw').length} className="rounded" />
              <span>全选raw</span>
            </label>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? <div className="p-4 text-center text-gray-400">加载中...</div>
            : data.length > 0 ? data.map((r) => {
              const st = STATUS_CONFIG[r.status] || STATUS_CONFIG.raw;
              const isActive = activeRow?.id === r.id;
              let preview = '';
              try { preview = JSON.stringify(JSON.parse(r.raw_data || '{}')).substring(0, 60); } catch { preview = (r.raw_data || '').substring(0, 60); }

              return (
                <div key={r.id} onClick={() => handleRowClick(r)} className={`px-4 py-3 border-b border-gray-50 cursor-pointer transition-colors ${isActive ? 'bg-brand-green/5 border-l-2 border-l-brand-green' : 'hover:bg-gray-50'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      {r.status === 'raw' && <input type="checkbox" checked={selected.has(r.id)} onChange={(e) => { e.stopPropagation(); toggleSelect(r.id); }} onClick={(e) => e.stopPropagation()} />}
                      <span className="font-mono text-xs text-gray-400">#{r.id}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${st.className}`}>{st.icon} {st.label}</span>
                    </div>
                    <span className="text-xs text-gray-400">{r.created_at?.substring(0, 10)}</span>
                  </div>
                  <div className="text-xs text-gray-500 truncate">{r.recipe_name || '未知配方'}</div>
                  <div className="text-xs text-gray-400 font-mono truncate mt-1">{preview}...</div>
                  {r.error_msg && <div className="text-xs text-red-500 truncate mt-1">⚠️ {r.error_msg}</div>}
                </div>
              );
            }) : <div className="p-4 text-center text-gray-400">暂无数据</div>}
          </div>
        </div>

        {/* Right: Detail Panel (three-column when active) */}
        {activeRow && (
          <div className="w-2/3 flex flex-col gap-4 min-h-0">
            {/* Top Row: Raw Preview + JSON Editor */}
            <div className="flex-1 flex gap-4 min-h-0">
              {/* Column 1: Raw Data Preview */}
              <div className="flex-1 bg-white rounded-xl border border-gray-100 overflow-hidden flex flex-col">
                <div className="px-4 py-2 border-b border-gray-100 bg-gray-50 flex items-center justify-between flex-shrink-0">
                  <span className="text-xs font-medium text-gray-600">📋 原始数据</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${STATUS_CONFIG[activeRow.status]?.className}`}>
                    {STATUS_CONFIG[activeRow.status]?.label}
                  </span>
                </div>
                <div className="flex-1 overflow-auto">
                  {renderRawPreview(activeRow)}
                </div>
              </div>

              {/* Column 2: AI JSON Editor */}
              <div className="flex-1 bg-white rounded-xl border border-gray-100 overflow-hidden flex flex-col">
                <div className="px-4 py-2 border-b border-gray-100 bg-blue-50 flex items-center justify-between flex-shrink-0">
                  <span className="text-xs font-medium text-blue-700">🤖 AI提取数据（可编辑）</span>
                  <div className="flex items-center space-x-2">
                    {activeRow.status === 'raw' && (
                      <button onClick={() => handleCleanSingle(activeRow.id)} disabled={cleaning} className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded disabled:opacity-50">
                        {cleaning ? '清洗中...' : '🤖 AI清洗'}
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex-1 overflow-auto">
                  <textarea
                    value={editJson}
                    onChange={(e) => setEditJson(e.target.value)}
                    className="w-full h-full p-4 text-xs font-mono text-gray-800 resize-none outline-none bg-white"
                    spellCheck={false}
                  />
                </div>
              </div>
            </div>

            {/* Bottom: Import Preview + Actions */}
            <div className="bg-white rounded-xl border border-gray-100 p-4 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">入库预览：</span>
                    {(() => {
                      try {
                        const parsed = JSON.parse(editJson);
                        return (
                          <span className="ml-2">
                            <span className="text-gray-900 font-medium">{parsed.title || '(无标题)'}</span>
                            {parsed.province && <span className="text-gray-400 ml-2">{parsed.province} · {parsed.city || ''}</span>}
                            {parsed.price_year && <span className="text-green-600 ml-2">¥{parsed.price_year}万/年</span>}
                            {parsed.area_mu && <span className="text-gray-500 ml-2">{parsed.area_mu}亩</span>}
                          </span>
                        );
                      } catch {
                        return <span className="text-red-500 ml-2">JSON 格式错误，请修正</span>;
                      }
                    })()}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {activeRow.status === 'raw' && (
                    <button onClick={() => handleCleanSingle(activeRow.id)} disabled={cleaning} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50">
                      {cleaning ? 'AI清洗中...' : '🤖 重新AI清洗'}
                    </button>
                  )}
                  {(activeRow.status === 'cleaned' || activeRow.status === 'raw') && (
                    <button onClick={handleImport} disabled={importing} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50">
                      {importing ? '导入中...' : '✅ 修正并入库'}
                    </button>
                  )}
                  {activeRow.status === 'error' && (
                    <button onClick={() => handleRetry(activeRow.id)} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm">
                      🔄 重试
                    </button>
                  )}
                  <button onClick={() => setActiveRow(null)} className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm">关闭</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
