'use client';
import { useState, useEffect } from 'react';

interface StagingItem {
  id: number;
  recipe_id: number;
  raw_html: string | null;
  raw_data: string | null; 
  status: string;
  error_msg: string | null;
  created_at: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  raw: { label: '待清洗', color: 'bg-yellow-100 text-yellow-700' },
  cleaned: { label: '已清洗', color: 'bg-blue-100 text-blue-700' },
  imported: { label: '已入库', color: 'bg-green-100 text-green-700' },
  error: { label: '异常', color: 'bg-red-100 text-red-700' },
};

export default function AdminStagingPage() {
  const [items, setItems] = useState<StagingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('raw');
  const [msg, setMsg] = useState('');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  
  // 三栏工作台状态
  const [activeItem, setActiveItem] = useState<StagingItem | null>(null);
  const [editedData, setEditedData] = useState('');

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('status', filter);
      params.set('limit', '50');
      const res = await fetch(`/api/admin/staging?${params.toString()}`);
      const d = await res.json() as any;
      setItems(d.data || []);
    } catch { setItems([]); } finally { setLoading(false); }
  };

  useEffect(() => { fetchItems(); }, [filter]);

  const show = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const toggleSelect = (id: number) => {
    setSelected(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };
  const toggleAll = () => {
    if (selected.size === items.length) setSelected(new Set());
    else setSelected(new Set(items.map(i => i.id)));
  };

  const handleBatchClean = async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) { show('❌ 请先选择数据'); return; }
    show(`🔄 正在 AI 清洗 ${ids.length} 条...`);
    try {
      const res = await fetch('/api/admin/staging', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'clean', ids }) });
      const d = await res.json() as any;
      if (d.success) show(`✅ 清洗完成：${d.data.cleaned} 成功，${d.data.errors} 失败`);
      else show(`❌ ${d.error}`);
    } catch { show('❌ 操作失败'); }
    setSelected(new Set());
    fetchItems();
  };

  const handleBatchDelete = async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) { show('❌ 请先选择数据'); return; }
    if (!confirm(`确定删除 ${ids.length} 条数据？`)) return;
    await fetch('/api/admin/staging', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete', ids }) });
    show(`✅ 已删除 ${ids.length} 条`);
    setSelected(new Set());
    fetchItems();
  };

  const handleBatchAiRename = async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) { show('❌ 请先选择数据'); return; }
    show(`✏️ 正在 AI 重写 ${ids.length} 条标题...`);
    try {
      const res = await fetch('/api/admin/staging', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'ai-rename', ids }) });
      const d = await res.json() as any;
      if (d.success) show(`✅ 标题重写完成：${d.data.renamed} 条成功`);
      else show(`❌ ${d.error}`);
    } catch { show('❌ 操作失败'); }
    setSelected(new Set());
    fetchItems();
  };

  const handleOpen = (item: StagingItem) => {
    setActiveItem(item);
    // 尝试格式化 JSON 以便阅读
    try {
      setEditedData(JSON.stringify(JSON.parse(item.raw_data || '{}'), null, 2));
    } catch {
      setEditedData(item.raw_data || '{}');
    }
  };

  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState('');

  const handleAction = async (action: string) => {
    if (!activeItem) return;
    try {
      const body: any = { action, id: activeItem.id };
      if (action === 'delete') {
        body.ids = [activeItem.id];
        delete body.id;
      }
      if (action === 'import') {
        try { body.asset = JSON.parse(editedData); } 
        catch { show('❌ JSON 格式错误，请检查'); return; }
        setImporting(true);
        setImportProgress('正在入库，下载图片中...');
      }
      if (action === 'update-data') {
        try { JSON.parse(editedData); body.data = editedData; } 
        catch { show('❌ JSON 格式错误，请检查'); return; }
      }
      
      const res = await fetch('/api/admin/staging', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await res.json() as any;
      setImporting(false);
      setImportProgress('');
      if (d.success) {
        const msgMap: Record<string, string> = {
          'import': `✅ 入库完成：${d.imported || 0} 条`,
          'retry': '✅ 已重置为待清洗状态',
          'delete': '✅ 已丢弃',
          'update-data': '✅ 已保存修改'
        };
        show(msgMap[action] || '✅ 操作成功');
        if (action !== 'update-data') setActiveItem(null);
        fetchItems();
      } else {
        show(`❌ ${d.error}`);
      }
    } catch {
      setImporting(false);
      setImportProgress('');
      show('❌ 操作失败');
    }
  };

  // ==========================================
  // 视图 1：三栏数据清洗工作台
  // ==========================================
  if (activeItem) {
    let parsedData: any = {};
    let parsedArray: any[] = [];
    try {
      const parsed = JSON.parse(editedData);
      if (Array.isArray(parsed)) { parsedArray = parsed; parsedData = parsed[0] || {}; }
      else { parsedData = parsed; parsedArray = [parsed]; }
    } catch {}
    const statusInfo = STATUS_LABELS[activeItem.status] || STATUS_LABELS.raw;

    return (
      <div className="h-[calc(100vh-7rem)] flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">📥 数据清洗工作台</h1>
            <p className="text-sm text-gray-500 mt-1">ID #{activeItem.id} · 当前状态：
              <span className={`ml-1 text-xs px-2 py-0.5 rounded-full ${statusInfo.color}`}>{statusInfo.label}</span>
            </p>
          </div>
          <button onClick={() => setActiveItem(null)} className="px-4 py-2 text-sm bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">
            ← 返回列表
          </button>
        </div>
        
        {msg && (
              <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
                <div className={`${msg.startsWith('✅') ? 'bg-green-600 text-white' : 'bg-red-600 text-white'} px-8 py-4 rounded-xl shadow-2xl text-sm font-medium`}>
                  {msg}
                </div>
              </div>
            )}

        <div className="flex-1 grid grid-cols-3 gap-4 min-h-0">
          {/* 左栏：原始数据 */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col overflow-hidden">
            <h3 className="font-bold text-gray-700 mb-3 text-sm flex items-center">📄 原始抓取数据</h3>
            <div className="flex-1 overflow-auto bg-gray-50 rounded-lg p-3 text-xs font-mono text-gray-600 whitespace-pre-wrap border border-gray-100">
              {activeItem.raw_html || activeItem.raw_data || '无原始数据'}
            </div>
            {activeItem.error_msg && (
              <div className="mt-2 p-2 bg-red-50 text-red-600 text-xs rounded border border-red-100">
                ⚠️ 错误信息: {activeItem.error_msg}
              </div>
            )}
          </div>

          {/* 中栏：JSON 编辑器 */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col overflow-hidden">
            <h3 className="font-bold text-gray-700 mb-3 text-sm flex items-center">✏️ 结构化数据 (JSON)</h3>
            <textarea
              value={editedData}
              onChange={(e) => setEditedData(e.target.value)}
              className="flex-1 w-full p-3 text-xs font-mono bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green resize-none"
              spellCheck={false}
            />
          </div>

          {/* 右栏：预览与操作 */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col overflow-hidden">
            <h3 className="font-bold text-gray-700 mb-3 text-sm flex items-center">👁️ 入库预览 {parsedArray.length > 1 && <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">共 {parsedArray.length} 条</span>}</h3>
            <div className="flex-1 overflow-auto space-y-3 text-sm bg-gray-50 rounded-lg p-3 border border-gray-100">
              <div className="flex"><span className="text-gray-500 w-16 flex-shrink-0">标题:</span> <span className="font-medium text-gray-900">{parsedData.title || '-'}</span></div>
              <div className="flex"><span className="text-gray-500 w-16 flex-shrink-0">区域:</span> <span>{[parsedData.province, parsedData.city].filter(Boolean).join(' ') || '-'}</span></div>
              <div className="flex"><span className="text-gray-500 w-16 flex-shrink-0">面积:</span> <span>{parsedData.area_mu ? `${parsedData.area_mu} 亩` : '-'}</span></div>
              <div className="flex"><span className="text-gray-500 w-16 flex-shrink-0">价格:</span> <span>{parsedData.price_year ? `${parsedData.price_year} 万/年` : parsedData.price_total ? `${parsedData.price_total} 万` : '-'}</span></div>
              <div className="pt-2 border-t border-gray-200">
                <span className="text-gray-500 text-xs">图片预览:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {((parsedData.images || []).length > 0 ? parsedData.images : parsedData._images || []).slice(0, 4).map((url: string, i: number) => (
                    <img key={i} src={url.startsWith('http') ? url : `https://www.cdaee.com${url}`} alt="" className="w-16 h-16 object-cover rounded border border-gray-200" />
                  ))}
                  {((parsedData.images || []).length === 0 && (parsedData._images || []).length === 0) && <span className="text-gray-400 text-xs">无图片</span>}
                </div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-2">
              <button onClick={() => handleAction('retry')} className="px-3 py-2 text-xs bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors">🔄 重新清洗</button>
              <button onClick={() => handleAction('delete')} className="px-3 py-2 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors">🗑️ 丢弃数据</button>
              <button onClick={() => handleAction('update-data')} className="col-span-2 px-3 py-2 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors">💾 仅保存修改</button>
              <button onClick={() => handleAction('import')} disabled={importing} className="col-span-2 px-3 py-2.5 text-sm bg-brand-green text-white rounded-lg hover:bg-brand-light font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                {importing ? `⏳ ${importProgress || '入库中...'}` : `✅ ${parsedArray.length > 1 ? `批量入库 (${parsedArray.length}条)` : '修正并入库'}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 视图 2：列表视图 (完全对齐 mimo 的表格风格)
  // ==========================================
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">📥 暂存数据清洗</h1>
      </div>
      
      {msg && (
              <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
                <div className={`${msg.startsWith('✅') ? 'bg-green-600 text-white' : 'bg-red-600 text-white'} px-8 py-4 rounded-xl shadow-2xl text-sm font-medium`}>
                  {msg}
                </div>
              </div>
            )}

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
        {Object.entries(STATUS_LABELS).map(([key, val]) => (
          <button 
            key={key} 
            onClick={() => setFilter(key)} 
            className={`px-3 py-1.5 text-xs rounded-full transition-colors ${filter === key ? 'bg-brand-green text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {val.label}
          </button>
        ))}
        </div>
        {selected.size > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500">已选 {selected.size} 条</span>
            <button onClick={handleBatchClean} className="px-3 py-1.5 text-xs bg-blue-500 text-white rounded-lg hover:bg-blue-600">🤖 批量 AI 清洗</button>
            <button onClick={handleBatchAiRename} className="px-3 py-1.5 text-xs bg-purple-500 text-white rounded-lg hover:bg-purple-600">✏️ AI 重写标题</button>
            <button onClick={handleBatchDelete} className="px-3 py-1.5 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600">🗑️ 批量删除</button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-4 py-3 font-medium text-gray-500 w-8"><input type="checkbox" checked={selected.size === items.length && items.length > 0} onChange={toggleAll} className="rounded" /></th>
              <th className="px-4 py-3 font-medium text-gray-500">ID</th>
              <th className="px-4 py-3 font-medium text-gray-500">配方ID</th>
              <th className="px-4 py-3 font-medium text-gray-500">状态</th>
              <th className="px-4 py-3 font-medium text-gray-500">错误信息</th>
              <th className="px-4 py-3 font-medium text-gray-500">抓取时间</th>
              <th className="px-4 py-3 font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">加载中...</td></tr>
            ) : items.length > 0 ? items.map((item) => {
              const statusInfo = STATUS_LABELS[item.status] || STATUS_LABELS.raw;
              return (
                <tr key={item.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3"><input type="checkbox" checked={selected.has(item.id)} onChange={() => toggleSelect(item.id)} className="rounded" /></td>
                  <td className="px-4 py-3 text-gray-400">#{item.id}</td>
                  <td className="px-4 py-3 text-gray-500">{item.recipe_id}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusInfo.color}`}>{statusInfo.label}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-red-500 max-w-[200px] truncate">{item.error_msg || '-'}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{item.created_at?.substring(0, 16)}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleOpen(item)} className="text-xs text-brand-green hover:underline font-medium">
                      处理 / 查看
                    </button>
                  </td>
                </tr>
              );
            }) : (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">暂无数据</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
