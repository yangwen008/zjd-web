'use client';

import { useState, useEffect } from 'react';

interface Recipe {
  id: number;
  name: string;
  base_url: string;
  list_url: string;
  enabled: number;
  max_pages: number;
  selectors: string;
  last_run_at: string | null;
  last_run_status: string;
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
  const [formData, setFormData] = useState({
    name: '', base_url: '', list_url: '', max_pages: 10,
    pagination_type: 'url', ai_prompt: '',
  });
  const [saving, setSaving] = useState(false);

  const fetchRecipes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/scrape/recipes');
      const data = await res.json();
      setRecipes(data.recipes || []);
    } catch {
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRecipes(); }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/scrape/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          selectors: { list: { container: '', fields: {} } },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowForm(false);
        setFormData({ name: '', base_url: '', list_url: '', max_pages: 10, pagination_type: 'url', ai_prompt: '' });
        fetchRecipes();
      }
    } catch {}
    finally { setSaving(false); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">🛰️ 爬虫采集站管理</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-brand-green hover:bg-brand-light text-white px-4 py-2 rounded-lg text-sm"
        >
          {showForm ? '取消' : '+ 新增采集站'}
        </button>
      </div>

      {/* Recipe list */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-4 py-3 font-medium text-gray-500">站点名称</th>
              <th className="px-4 py-3 font-medium text-gray-500">采集URL</th>
              <th className="px-4 py-3 font-medium text-gray-500">最大页数</th>
              <th className="px-4 py-3 font-medium text-gray-500">上次运行</th>
              <th className="px-4 py-3 font-medium text-gray-500">状态</th>
              <th className="px-4 py-3 font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">加载中...</td></tr>
            ) : recipes.length > 0 ? recipes.map((r) => {
              const status = STATUS_LABELS[r.last_run_status] || STATUS_LABELS.idle;
              return (
                <tr key={r.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium text-gray-900">{r.name}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{r.base_url}</td>
                  <td className="px-4 py-3 text-gray-500">{r.max_pages} 页</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{r.last_run_at || '从未运行'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${status.className}`}>{status.label}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <button className="text-xs text-brand-green hover:underline">测试</button>
                      <button className="text-xs text-blue-500 hover:underline">编辑</button>
                      <button className="text-xs text-red-500 hover:underline">删除</button>
                    </div>
                  </td>
                </tr>
              );
            }) : (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">暂无采集配方</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="font-bold text-gray-900 mb-4">新增采集站配置</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">站点名称</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="如：浙江省农村产权交易中心" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">基础URL</label>
              <input type="text" value={formData.base_url} onChange={(e) => setFormData({ ...formData, base_url: e.target.value })} placeholder="https://example.com" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green font-mono" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">列表页URL</label>
              <input type="text" value={formData.list_url} onChange={(e) => setFormData({ ...formData, list_url: e.target.value })} placeholder="https://example.com/list?page={page}" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green font-mono" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">最大页数</label>
              <input type="number" value={formData.max_pages} onChange={(e) => setFormData({ ...formData, max_pages: Number(e.target.value) })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green" />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-500 mb-2">🤖 AI清洗提示词 (可选)</label>
            <textarea
              value={formData.ai_prompt}
              onChange={(e) => setFormData({ ...formData, ai_prompt: e.target.value })}
              placeholder="自定义AI提取提示词，如：提取面积、价格、产权类型、交通配套..."
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green"
            />
          </div>

          <div className="flex items-center space-x-3">
            <button onClick={handleSave} disabled={saving} className="bg-brand-green hover:bg-brand-light text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50">
              {saving ? '保存中...' : '💾 保存配方'}
            </button>
            <button onClick={() => setShowForm(false)} className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm">取消</button>
          </div>
        </div>
      )}
    </div>
  );
}
