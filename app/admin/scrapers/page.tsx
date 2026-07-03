'use client';

import { useState, useEffect } from 'react';

interface Recipe {
  id: number; name: string; base_url: string; list_url: string; enabled: number;
  max_pages: number; pagination_type: string; selectors: string; detail_selectors: string | null;
  ai_prompt: string | null; schedule_cron: string; last_run_at: string | null; last_run_status: string;
  proxy_enabled: number;
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  success: { label: '✅ 成功', className: 'bg-green-100 text-green-700' },
  running: { label: '🔄 运行中', className: 'bg-blue-100 text-blue-700' },
  failed: { label: '❌ 失败', className: 'bg-red-100 text-red-700' },
  idle: { label: '⏸ 待机', className: 'bg-gray-100 text-gray-600' },
};

export default function AdminScrapersPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const emptyForm = {
    name: '', base_url: '', list_url: '', max_pages: '10', pagination_type: 'url',
    ai_prompt: '', schedule_cron: '0 3 * * *', enabled: true, proxy_enabled: false,
    selectors: '{"list":{"container":"","fields":{}}}', detail_selectors: '',
  };
  const [form, setForm] = useState(emptyForm);

  const fetchRecipes = async () => {
    setLoading(true);
    try { const res = await fetch('/api/scrape?path=recipes'); const data = await res.json() as any; setRecipes(data.recipes || []); } catch { setRecipes([]); } finally { setLoading(false); }
  };
  useEffect(() => { fetchRecipes(); }, []);

  const show = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const handleEdit = (r: Recipe) => {
    setEditId(r.id);
    setForm({
      name: r.name, base_url: r.base_url, list_url: r.list_url, max_pages: String(r.max_pages),
      pagination_type: r.pagination_type, ai_prompt: r.ai_prompt || '', schedule_cron: r.schedule_cron || '0 3 * * *',
      enabled: r.enabled === 1, proxy_enabled: r.proxy_enabled === 1,
      selectors: r.selectors || '{"list":{"container":"","fields":{}}}', detail_selectors: r.detail_selectors || '',
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.base_url.trim() || !form.list_url.trim()) { show('❌ 名称、基础URL、列表页URL不能为空'); return; }
    setSaving(true);
    try {
      let selectorsObj = {};
      let detailObj = null;
      try { selectorsObj = JSON.parse(form.selectors); } catch { show('❌ 选择器JSON格式错误'); setSaving(false); return; }
      if (form.detail_selectors) { try { detailObj = JSON.parse(form.detail_selectors); } catch { show('❌ 详情选择器JSON格式错误'); setSaving(false); return; } }

      const payload: any = {
        action: 'add-recipe', name: form.name, base_url: form.base_url, list_url: form.list_url,
        max_pages: parseInt(form.max_pages) || 10, pagination_type: form.pagination_type,
        ai_prompt: form.ai_prompt || null, schedule_cron: form.schedule_cron,
        selectors: selectorsObj, detail_selectors: detailObj,
        enabled: form.enabled, proxy_enabled: form.proxy_enabled,
      };
      if (editId) payload.id = editId;

      const res = await fetch('/api/scrape', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const d = await res.json() as any;
      if (d.success) { show('✅ 配方已保存'); setShowForm(false); setEditId(null); setForm(emptyForm); fetchRecipes(); } else show(`❌ ${d.error}`);
    } catch { show('❌ 网络错误'); } finally { setSaving(false); }
  };

  const handleToggle = async (id: number, currentEnabled: number) => {
    await fetch('/api/scrape', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'toggle-enabled', recipeId: id, enabled: currentEnabled ? 0 : 1 }) });
    fetchRecipes();
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`确定删除配方「${name}」？`)) return;
    await fetch('/api/scrape', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete-recipe', recipeId: id }) });
    show('✅ 已删除');
    fetchRecipes();
  };

  const handleRunNow = async (id: number, name: string) => {
    show(`🔄 正在执行「${name}」...`);
    try {
      const res = await fetch('/api/scrape/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ recipeId: id }) });
      const d = await res.json() as any;
      if (d.success) show(`✅ 执行完成，采集 ${d.itemCount || 0} 条数据`);
      else show(`❌ ${d.error}`);
    } catch { show('❌ 执行失败'); }
    fetchRecipes();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">🕷️ 爬虫采集站管理</h1>
        <button onClick={() => { setShowForm(!showForm); setEditId(null); setForm(emptyForm); }} className="bg-brand-green hover:bg-brand-light text-white px-4 py-2 rounded-lg text-sm">{showForm ? '取消' : '+ 新增采集站'}</button>
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
          <h2 className="font-bold text-gray-900 mb-4">{editId ? '编辑采集站' : '新增采集站配置'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div><label className="block text-xs font-medium text-gray-500 mb-1">站点名称</label><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="浙江省农村产权交易中心" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green" /></div>
            <div><label className="block text-xs font-medium text-gray-500 mb-1">基础URL</label><input type="text" value={form.base_url} onChange={(e) => setForm({ ...form, base_url: e.target.value })} placeholder="https://example.com" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green font-mono" /></div>
            <div><label className="block text-xs font-medium text-gray-500 mb-1">列表页URL ({'{page}'} 占位符)</label><input type="text" value={form.list_url} onChange={(e) => setForm({ ...form, list_url: e.target.value })} placeholder="https://example.com/list?page={page}" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green font-mono" /></div>
            <div><label className="block text-xs font-medium text-gray-500 mb-1">最大页数</label><input type="number" value={form.max_pages} onChange={(e) => setForm({ ...form, max_pages: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green" /></div>
            <div><label className="block text-xs font-medium text-gray-500 mb-1">翻页方式</label><select value={form.pagination_type} onChange={(e) => setForm({ ...form, pagination_type: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green"><option value="url">URL翻页</option><option value="scroll">滚动加载</option></select></div>
            <div><label className="block text-xs font-medium text-gray-500 mb-1">定时表达式</label><input type="text" value={form.schedule_cron} onChange={(e) => setForm({ ...form, schedule_cron: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green font-mono" /></div>
          </div>
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-500 mb-1">CSS 选择器 (JSON)</label>
            <textarea value={form.selectors} onChange={(e) => setForm({ ...form, selectors: e.target.value })} rows={4} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green font-mono" />
          </div>
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-500 mb-1">详情页选择器 (JSON, 可选)</label>
            <textarea value={form.detail_selectors} onChange={(e) => setForm({ ...form, detail_selectors: e.target.value })} rows={3} placeholder='{"link_field":"link","fields":{"description":".content"}}' className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green font-mono" />
          </div>
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-500 mb-2">🤖 AI清洗提示词 (可选)</label>
            <textarea value={form.ai_prompt} onChange={(e) => setForm({ ...form, ai_prompt: e.target.value })} rows={3} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green" />
          </div>
          <div className="flex items-center space-x-3">
            <button onClick={handleSave} disabled={saving} className="bg-brand-green hover:bg-brand-light text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50">{saving ? '保存中...' : '💾 保存配方'}</button>
            <button onClick={() => { setShowForm(false); setEditId(null); }} className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm">取消</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50 text-left">
            <th className="px-4 py-3 font-medium text-gray-500">站点名称</th>
            <th className="px-4 py-3 font-medium text-gray-500">采集URL</th>
            <th className="px-4 py-3 font-medium text-gray-500">最大页数</th>
            <th className="px-4 py-3 font-medium text-gray-500">上次运行</th>
            <th className="px-4 py-3 font-medium text-gray-500">状态</th>
            <th className="px-4 py-3 font-medium text-gray-500">启用</th>
            <th className="px-4 py-3 font-medium text-gray-500">操作</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">加载中...</td></tr>
            : recipes.length > 0 ? recipes.map((r) => {
              const status = STATUS_LABELS[r.last_run_status] || STATUS_LABELS.idle;
              return (
                <tr key={r.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium text-gray-900">{r.name}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs max-w-[200px] truncate">{r.base_url}</td>
                  <td className="px-4 py-3 text-gray-500">{r.max_pages} 页</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{r.last_run_at || '从未运行'}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${status.className}`}>{status.label}</span></td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleToggle(r.id, r.enabled)} className={`w-10 h-5 rounded-full relative transition-colors ${r.enabled ? 'bg-green-400' : 'bg-gray-300'}`}>
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${r.enabled ? 'left-5' : 'left-0.5'}`} />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <button onClick={() => handleEdit(r)} className="text-xs text-brand-green hover:underline">编辑</button>
                      <button onClick={() => handleRunNow(r.id, r.name)} className="text-xs text-blue-500 hover:underline">立即执行</button>
                      <button onClick={() => handleDelete(r.id, r.name)} className="text-xs text-red-500 hover:underline">删除</button>
                    </div>
                  </td>
                </tr>
              );
            }) : <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">暂无采集配方</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
