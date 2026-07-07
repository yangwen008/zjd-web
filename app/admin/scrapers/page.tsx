'use client';

import { useState, useEffect } from 'react';

interface Recipe {
  id: number; name: string; base_url: string; list_url: string; enabled: number;
  max_pages: number; pagination_type: string; selectors: string; detail_selectors: string | null;
  ai_prompt: string | null; schedule_cron: string; last_run_at: string | null; last_run_status: string;
  proxy_enabled: number; source_name?: string; scraper_type?: string; province_code?: string;
  data_count?: number;
}

interface SiteTemplate {
  name: string;
  source_name: string;
  category: string;
  base_url: string;
  list_url: string;
  scraper_type: string;
  max_pages: number;
  province_code?: string;
  description: string;
  icon: string;
}

// 预置采集站模板
const SITE_TEMPLATES: SiteTemplate[] = [
  {
    name: '四川农交所', source_name: 'cdaee', category: 'official',
    base_url: 'https://www.cdaee.com', list_url: 'https://www.cdaee.com/inteligentsearch_new',
    scraper_type: 'http_api', max_pages: 1, province_code: '253',
    description: '四川省农村产权综合交易平台，JSON API 直接采集', icon: '🏛️',
  },
  {
    name: '土流网 · 农房', source_name: 'tuliu_nongfang', category: 'commercial',
    base_url: 'https://www.tuliu.com', list_url: 'https://www.tuliu.com/nongfang/list-0-31-0/',
    scraper_type: 'playwright', max_pages: 5, province_code: '0',
    description: '全国最大土地流转平台，宅基地/农房数据约5000条', icon: '🏠',
  },
  {
    name: '土流网 · 四川农房', source_name: 'tuliu_sichuan', category: 'commercial',
    base_url: 'https://www.tuliu.com', list_url: 'https://www.tuliu.com/nongfang/list-253-31-0/',
    scraper_type: 'playwright', max_pages: 10, province_code: '253',
    description: '土流网四川省农房数据', icon: '🐼',
  },
  {
    name: '土流网 · 浙江农房', source_name: 'tuliu_zhejiang', category: 'commercial',
    base_url: 'https://www.tuliu.com', list_url: 'https://www.tuliu.com/nongfang/list-94-31-0/',
    scraper_type: 'playwright', max_pages: 10, province_code: '94',
    description: '土流网浙江省农房数据', icon: '🌊',
  },
  {
    name: '土流网 · 云南农房', source_name: 'tuliu_yunnan', category: 'commercial',
    base_url: 'https://www.tuliu.com', list_url: 'https://www.tuliu.com/nongfang/list-285-31-0/',
    scraper_type: 'playwright', max_pages: 10, province_code: '285',
    description: '土流网云南省农房数据', icon: '🌸',
  },
  {
    name: '聚土网 · 全国', source_name: 'jutubao', category: 'commercial',
    base_url: 'https://www.jutubao.com', list_url: 'https://www.jutubao.com/tudi/',
    scraper_type: 'playwright', max_pages: 5, province_code: '0',
    description: '农村土地流转平台，宅基地/农房/耕地数据', icon: '🌾',
  },
];

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  official: { label: '🏛️ 官方农交所', color: 'bg-blue-100 text-blue-700' },
  commercial: { label: '🏢 商业平台', color: 'bg-purple-100 text-purple-700' },
  custom: { label: '⚙️ 自定义', color: 'bg-gray-100 text-gray-600' },
};

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
  const [filter, setFilter] = useState<string>('all');
  const [showTemplates, setShowTemplates] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [scrapeType, setScrapeType] = useState('nongfang');
  const [scrapeProvince, setScrapeProvince] = useState('');
  const [scrapeLimit, setScrapeLimit] = useState('10');

  const emptyForm = {
    name: '', base_url: '', list_url: '', max_pages: '10', pagination_type: 'url',
    ai_prompt: '', schedule_cron: '0 3 * * *', enabled: true, proxy_enabled: false,
    selectors: '{"list":{"container":"","fields":{}}}', detail_selectors: '',
    source_name: '', scraper_type: 'playwright', province_code: '',
  };
  const [form, setForm] = useState(emptyForm);

  const fetchRecipes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/scrape?path=recipes');
      const data = await res.json() as any;
      setRecipes(data.recipes || []);
    } catch { setRecipes([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchRecipes(); }, []);

  const show = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const handleScrapeImport = async () => {
    setScraping(true);
    show('🔄 正在采集，请稍候...');
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 90000); // 90秒超时
      show('🔄 正在采集，请稍候（最多90秒）...');
      const res = await fetch('/api/admin/scrape-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'jutubao',
          type: scrapeType,
          province: scrapeProvince || undefined,
          limit: parseInt(scrapeLimit) || 10,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const data = await res.json() as any;
      if (data.success) {
        const d = data.data;
        show(`✅ 采集完成！导入 ${d.imported} 条，跳过 ${d.skipped} 条，图片 ${d.imagesUploaded} 张`);
      } else {
        show(`❌ 采集失败: ${data.error}`);
      }
    } catch (e: any) {
      if (e.name === 'AbortError') {
        show('❌ 请求超时（90秒），代理服务器响应太慢');
      } else {
        show(`❌ 网络错误: ${e.message}`);
      }
    }
    finally { setScraping(false); }
  };

  // 从模板创建
  const handleFromTemplate = (tmpl: SiteTemplate) => {
    setForm({
      name: tmpl.name,
      base_url: tmpl.base_url,
      list_url: tmpl.list_url,
      max_pages: String(tmpl.max_pages),
      pagination_type: tmpl.scraper_type === 'http_api' ? 'api' : 'url',
      ai_prompt: '',
      schedule_cron: '0 3 * * *',
      enabled: true,
      proxy_enabled: false,
      selectors: '{"list":{"container":"","fields":{}}}',
      detail_selectors: '',
      source_name: tmpl.source_name,
      scraper_type: tmpl.scraper_type,
      province_code: tmpl.province_code || '',
    });
    setShowTemplates(false);
    setShowForm(true);
    setEditId(null);
  };

  const handleEdit = (r: Recipe) => {
    setEditId(r.id);
    setForm({
      name: r.name, base_url: r.base_url, list_url: r.list_url, max_pages: String(r.max_pages),
      pagination_type: r.pagination_type, ai_prompt: r.ai_prompt || '', schedule_cron: r.schedule_cron || '0 3 * * *',
      enabled: r.enabled === 1, proxy_enabled: r.proxy_enabled === 1,
      selectors: r.selectors || '{"list":{"container":"","fields":{}}}', detail_selectors: r.detail_selectors || '',
      source_name: r.source_name || '', scraper_type: r.scraper_type || 'playwright', province_code: r.province_code || '',
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
        source_name: form.source_name || null, scraper_type: form.scraper_type || 'playwright',
        province_code: form.province_code || null,
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

  // 按分类筛选
  const filteredRecipes = filter === 'all' ? recipes : recipes.filter(r => {
    const src = r.source_name || '';
    if (filter === 'official') return src.includes('cdaee') || src.includes('nongjiao');
    if (filter === 'commercial') return src.includes('tuliu') || src.includes('jutubao');
    if (filter === 'custom') return !src.includes('cdaee') && !src.includes('tuliu') && !src.includes('jutubao');
    return true;
  });

  // 已配置的来源名称集合
  const configuredSources = new Set(recipes.map(r => r.source_name).filter(Boolean));

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🕷️ 采集站管理</h1>
          <p className="text-sm text-gray-500 mt-1">管理各平台数据采集配方，支持一键采集和定时任务</p>
        </div>
        <div className="flex items-center space-x-3">
          <button onClick={() => { setShowTemplates(!showTemplates); setShowForm(false); }} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">📦 从模板添加</button>
          <button onClick={() => { setShowForm(!showForm); setShowTemplates(false); setEditId(null); setForm(emptyForm); }} className="bg-brand-green hover:bg-brand-light text-white px-4 py-2 rounded-lg text-sm">{showForm ? '取消' : '+ 手动新增'}</button>
        </div>
      </div>

      {/* Toast */}
      {msg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className={`${msg.startsWith('✅') ? 'bg-green-600' : 'bg-red-600'} text-white px-8 py-4 rounded-xl shadow-2xl text-sm font-medium`}>
            {msg}
          </div>
        </div>
      )}

      {/* 一键采集 */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200 p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-900">⚡ 一键采集+入库</h3>
            <p className="text-xs text-gray-500 mt-1">从聚土网抓取数据，自动下载图片存入 R2，直接上架</p>
          </div>
          <div className="flex items-center space-x-3">
            <select value={scrapeType} onChange={(e) => setScrapeType(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg">
              <option value="nongfang">🏠 农房</option>
              <option value="linmumiaopu">🌲 林木苗圃地</option>
              <option value="shucailiangyou">🌾 蔬菜粮油地</option>
              <option value="guochacansang">🍵 水果茶桑地</option>
              <option value="xumufangyang">🐄 畜牧放养地</option>
              <option value="chanzhiyangzhi">🐟 水产养殖地</option>
            </select>
            <select value={scrapeProvince} onChange={(e) => setScrapeProvince(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg">
              <option value="">全国</option>
              <option value="sichuan">四川</option>
              <option value="yunnan">云南</option>
              <option value="guizhou">贵州</option>
              <option value="chongqing">重庆</option>
              <option value="guangxi">广西</option>
              <option value="hubei">湖北</option>
              <option value="hunan">湖南</option>
              <option value="guangdong">广东</option>
              <option value="zhejiang">浙江</option>
              <option value="jiangsu">江苏</option>
              <option value="anhui">安徽</option>
              <option value="fujian">福建</option>
              <option value="jiangxi">江西</option>
              <option value="shandong">山东</option>
              <option value="henan">河南</option>
              <option value="hebei">河北</option>
              <option value="beijing">北京</option>
              <option value="shanghai">上海</option>
              <option value="hainan">海南</option>
            </select>
            <select value={scrapeLimit} onChange={(e) => setScrapeLimit(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg">
              <option value="5">5条</option>
              <option value="10">10条</option>
              <option value="20">20条</option>
              <option value="50">50条</option>
            </select>
            <button
              onClick={handleScrapeImport}
              disabled={scraping}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {scraping ? '采集中...' : '⚡ 开始采集'}
            </button>
          </div>
        </div>
      </div>

      {/* 分类筛选 */}
      <div className="flex items-center space-x-2 mb-4">
        {[
          { key: 'all', label: '全部' },
          { key: 'official', label: '🏛️ 官方农交所' },
          { key: 'commercial', label: '🏢 商业平台' },
          { key: 'custom', label: '⚙️ 自定义' },
        ].map(tab => (
          <button key={tab.key} onClick={() => setFilter(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${filter === tab.key ? 'bg-brand-green text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {tab.label}
          </button>
        ))}
        <span className="text-sm text-gray-400 ml-2">共 {filteredRecipes.length} 个配方</span>
      </div>

      {/* 模板选择面板 */}
      {showTemplates && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
          <h2 className="font-bold text-gray-900 mb-4">📦 选择采集站模板</h2>
          <p className="text-sm text-gray-500 mb-4">预置配置，一键添加。已配置的站点标记为 ✅。</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SITE_TEMPLATES.map((tmpl, i) => {
              const isConfigured = configuredSources.has(tmpl.source_name);
              const cat = CATEGORY_LABELS[tmpl.category] || CATEGORY_LABELS.custom;
              return (
                <div key={i} className={`border rounded-xl p-4 transition-all cursor-pointer hover:shadow-md ${isConfigured ? 'border-green-200 bg-green-50' : 'border-gray-200 hover:border-brand-green'}`}
                  onClick={() => !isConfigured && handleFromTemplate(tmpl)}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{tmpl.icon}</span>
                      <div>
                        <div className="font-bold text-gray-900 text-sm">{tmpl.name}</div>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${cat.color}`}>{cat.label}</span>
                      </div>
                    </div>
                    {isConfigured && <span className="text-green-500 text-lg">✅</span>}
                  </div>
                  <p className="text-xs text-gray-500 mb-3">{tmpl.description}</p>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{tmpl.scraper_type === 'http_api' ? '🔗 API采集' : '🌐 浏览器采集'}</span>
                    <span>{tmpl.max_pages} 页</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 新增/编辑表单 */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
          <h2 className="font-bold text-gray-900 mb-4">{editId ? '编辑采集站' : '新增采集站'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div><label className="block text-xs font-medium text-gray-500 mb-1">站点名称 *</label><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="如：土流网·四川农房" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green" /></div>
            <div><label className="block text-xs font-medium text-gray-500 mb-1">来源标识</label><input type="text" value={form.source_name} onChange={(e) => setForm({ ...form, source_name: e.target.value })} placeholder="如：tuliu_sichuan" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green font-mono" /></div>
            <div><label className="block text-xs font-medium text-gray-500 mb-1">基础URL *</label><input type="text" value={form.base_url} onChange={(e) => setForm({ ...form, base_url: e.target.value })} placeholder="https://example.com" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green font-mono" /></div>
            <div><label className="block text-xs font-medium text-gray-500 mb-1">列表页URL *</label><input type="text" value={form.list_url} onChange={(e) => setForm({ ...form, list_url: e.target.value })} placeholder="https://example.com/list?p={page}" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green font-mono" /></div>
            <div><label className="block text-xs font-medium text-gray-500 mb-1">采集模式</label>
              <select value={form.scraper_type} onChange={(e) => setForm({ ...form, scraper_type: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green">
                <option value="playwright">🌐 浏览器渲染 (Playwright)</option>
                <option value="http_api">🔗 HTTP API (JSON)</option>
              </select>
            </div>
            <div><label className="block text-xs font-medium text-gray-500 mb-1">最大页数</label><input type="number" value={form.max_pages} onChange={(e) => setForm({ ...form, max_pages: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green" /></div>
            <div><label className="block text-xs font-medium text-gray-500 mb-1">定时表达式</label><input type="text" value={form.schedule_cron} onChange={(e) => setForm({ ...form, schedule_cron: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green font-mono" /></div>
            <div><label className="block text-xs font-medium text-gray-500 mb-1">省份代码</label><input type="text" value={form.province_code} onChange={(e) => setForm({ ...form, province_code: e.target.value })} placeholder="0=全国, 253=四川" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green font-mono" /></div>
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

      {/* 配方列表 */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50 text-left">
            <th className="px-4 py-3 font-medium text-gray-500">站点</th>
            <th className="px-4 py-3 font-medium text-gray-500">采集模式</th>
            <th className="px-4 py-3 font-medium text-gray-500">最大页数</th>
            <th className="px-4 py-3 font-medium text-gray-500">上次运行</th>
            <th className="px-4 py-3 font-medium text-gray-500">状态</th>
            <th className="px-4 py-3 font-medium text-gray-500">启用</th>
            <th className="px-4 py-3 font-medium text-gray-500">操作</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">加载中...</td></tr>
            : filteredRecipes.length > 0 ? filteredRecipes.map((r) => {
              const status = STATUS_LABELS[r.last_run_status] || STATUS_LABELS.idle;
              const cat = r.source_name?.includes('cdaee') ? CATEGORY_LABELS.official
                : r.source_name?.includes('tuliu') || r.source_name?.includes('jutubao') ? CATEGORY_LABELS.commercial
                : CATEGORY_LABELS.custom;
              return (
                <tr key={r.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${cat.color}`}>{cat.label}</span>
                      <span className="font-medium text-gray-900">{r.name}</span>
                    </div>
                    <div className="text-xs text-gray-400 font-mono mt-0.5 truncate max-w-[250px]">{r.base_url}</div>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {r.scraper_type === 'http_api' || r.pagination_type === 'api'
                      ? <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded">🔗 API</span>
                      : <span className="bg-orange-50 text-orange-600 px-2 py-0.5 rounded">🌐 浏览器</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-gray-500">{r.max_pages} 页</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{r.last_run_at ? new Date(r.last_run_at).toLocaleString('zh-CN') : '从未运行'}</td>
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
            }) : <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">
              {filter === 'all' ? '暂无采集配方，点击上方「从模板添加」开始' : '该分类下暂无配方'}
            </td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
