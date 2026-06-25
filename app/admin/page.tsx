'use client';

import { useState, useEffect } from 'react';

// Homepage section config fields
const SECTION_FIELDS: Record<string, { label: string; fields: { key: string; label: string; type: 'text' | 'number'; placeholder: string; min?: number; max?: number }[] }> = {
  hero: {
    label: 'Hero 横幅',
    fields: [
      { key: 'hero_title', label: '大标题', type: 'text', placeholder: '中国矿产资源资产交易平台' },
      { key: 'hero_subtitle', label: '副标题', type: 'text', placeholder: '专业、透明、高效的矿产资源交易服务' },
      { key: 'total_assets', label: '总收录数 (手动微调)', type: 'text', placeholder: '自动计算' },
      { key: 'today_new', label: '今日上新 (手动微调)', type: 'text', placeholder: '自动计算' },
    ],
  },
  regions: {
    label: '热点寻源',
    fields: [
      { key: 'section_regions_title', label: '标题', type: 'text', placeholder: '热点寻源' },
      { key: 'section_regions_subtitle', label: '副标题', type: 'text', placeholder: '按省份浏览优质矿产资源' },
      { key: 'section_regions_count', label: '显示数量', type: 'number', placeholder: '8', min: 1, max: 12 },
    ],
  },
  market: {
    label: '行情数据',
    fields: [
      { key: 'section_market_title', label: '标题', type: 'text', placeholder: '行情数据' },
      { key: 'section_market_subtitle', label: '副标题', type: 'text', placeholder: '各省份矿产资源行情概览' },
    ],
  },
  official: {
    label: '官方原矿',
    fields: [
      { key: 'section_official_title', label: '标题', type: 'text', placeholder: '官方原矿' },
      { key: 'section_official_subtitle', label: '副标题', type: 'text', placeholder: '政府及国企发布的矿产资源' },
      { key: 'section_official_count', label: '显示数量', type: 'number', placeholder: '6', min: 1, max: 12 },
    ],
  },
  village: {
    label: '村委直发',
    fields: [
      { key: 'section_village_title', label: '标题', type: 'text', placeholder: '村委直发' },
      { key: 'section_village_subtitle', label: '副标题', type: 'text', placeholder: '村委会直接发布的资源信息' },
      { key: 'section_village_count', label: '显示数量', type: 'number', placeholder: '6', min: 1, max: 12 },
    ],
  },
  bulk: {
    label: '大宗路演',
    fields: [
      { key: 'section_bulk_title', label: '标题', type: 'text', placeholder: '大宗路演' },
      { key: 'section_bulk_subtitle', label: '副标题', type: 'text', placeholder: '大型矿产项目路演推荐' },
      { key: 'section_bulk_count', label: '显示数量', type: 'number', placeholder: '6', min: 1, max: 12 },
    ],
  },
  infra: {
    label: '基建指标',
    fields: [
      { key: 'section_infra_title', label: '标题', type: 'text', placeholder: '基建指标' },
      { key: 'section_infra_subtitle', label: '副标题', type: 'text', placeholder: '矿区基础设施评分数据' },
      { key: 'section_infra_count', label: '显示数量', type: 'number', placeholder: '6', min: 1, max: 12 },
    ],
  },
  brokers: {
    label: '合伙人',
    fields: [
      { key: 'section_brokers_title', label: '标题', type: 'text', placeholder: '合伙人' },
      { key: 'section_brokers_subtitle', label: '副标题', type: 'text', placeholder: '专业矿产经纪人为您服务' },
      { key: 'section_brokers_count', label: '显示数量', type: 'number', placeholder: '6', min: 1, max: 12 },
    ],
  },
};

export default function AdminDashboard() {
  const [config, setConfig] = useState<Record<string, string>>({
    company_name: '', company_phone: '', company_email: '',
    icp_number: '', police_record: '', footer_about: '',
    hero_title: '', hero_subtitle: '', total_assets: '', today_new: '',
  });
  const [stats, setStats] = useState({ total: 0, todayNew: 0, pending: 0 });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    // Load config
    fetch('/api/admin/config')
      .then((r) => r.json())
      .then((data: any) => {
        if (data.success) setConfig((prev) => ({ ...prev, ...data.data }));
      })
      .catch(() => {});

    // Load stats
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then((data: any) => {
        if (data.success) setStats(data.data);
      })
      .catch(() => {});
  }, []);

  const handleSave = async (section: string) => {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const data: any = await res.json();
      if (data.success) {
        setMessage(`✅ ${section} 配置已保存并同步至 D1`);
      } else {
        setMessage(`❌ 保存失败: ${data.error}`);
      }
    } catch {
      setMessage('❌ 网络错误');
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const updateConfig = (key: string, value: string) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">📊 运营控制台</h1>

      {message && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${message.startsWith('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message}
        </div>
      )}

      {/* A. Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: '总资产数', value: stats.total.toLocaleString(), icon: '🏠', color: 'text-brand-green' },
          { label: '今日新增', value: stats.todayNew.toString(), icon: '📈', color: 'text-green-500' },
          { label: '待审核', value: stats.pending.toString(), icon: '⏳', color: 'text-orange-500' },
          { label: '活跃用户', value: '—', icon: '👥', color: 'text-blue-500' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-5 border border-gray-100">
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className="text-xs text-gray-400">{s.label}</div>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* B. Company Info */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <h2 className="font-bold text-gray-900 mb-4">公司信息</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: 'company_name', label: '公司主体名称' },
            { key: 'company_phone', label: '全国服务热线' },
            { key: 'company_email', label: '官方合作邮箱' },
            { key: 'icp_number', label: '工信部 ICP 备案号' },
            { key: 'police_record', label: '公安备案号' },
          ].map((field) => (
            <div key={field.key}>
              <label className="block text-xs font-medium text-gray-500 mb-1">{field.label}</label>
              <input
                type="text"
                value={config[field.key] || ''}
                onChange={(e) => updateConfig(field.key, e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green"
              />
            </div>
          ))}
        </div>
        <button
          onClick={() => handleSave('公司信息')}
          disabled={saving}
          className="mt-4 bg-brand-green hover:bg-brand-light text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
        >
          {saving ? '保存中...' : '同步更新至 D1 数据库'}
        </button>
      </div>

      {/* C. Homepage Section Config */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <h2 className="font-bold text-gray-900 mb-4">首页板块配置</h2>
        <p className="text-xs text-gray-400 mb-4">配置首页各板块的标题、副标题和显示数量。留空则使用默认值。</p>

        <div className="space-y-3">
          {Object.entries(SECTION_FIELDS).map(([sectionKey, section]) => (
            <div key={sectionKey} className="border border-gray-100 rounded-lg">
              <button
                onClick={() => setActiveSection(activeSection === sectionKey ? null : sectionKey)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <span>{section.label}</span>
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform ${activeSection === sectionKey ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {activeSection === sectionKey && (
                <div className="px-4 pb-4 pt-1 space-y-3 border-t border-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {section.fields.map((field) => (
                      <div key={field.key}>
                        <label className="block text-xs font-medium text-gray-500 mb-1">{field.label}</label>
                        <input
                          type={field.type === 'number' ? 'number' : 'text'}
                          value={config[field.key] || ''}
                          placeholder={field.placeholder}
                          min={field.min}
                          max={field.max}
                          onChange={(e) => updateConfig(field.key, e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green"
                        />
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => handleSave(section.label)}
                    disabled={saving}
                    className="bg-brand-green hover:bg-brand-light text-white px-3 py-1.5 rounded-lg text-xs disabled:opacity-50"
                  >
                    {saving ? '保存中...' : '保存'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* D. Footer Config */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <h2 className="font-bold text-gray-900 mb-4">页脚配置</h2>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">关于我们文案</label>
          <textarea
            value={config.footer_about || ''}
            onChange={(e) => updateConfig('footer_about', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green"
          />
        </div>
        <button
          onClick={() => handleSave('页脚')}
          disabled={saving}
          className="mt-4 bg-brand-green hover:bg-brand-light text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
        >
          {saving ? '保存中...' : '同步更新至 D1 数据库'}
        </button>
      </div>
    </div>
  );
}
