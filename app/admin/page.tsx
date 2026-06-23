'use client';

import { useState } from 'react';

export default function AdminDashboard() {
  const [config, setConfig] = useState({
    company_name: '绵阳网安科技有限公司',
    company_phone: '13696266999',
    company_email: 'contact@zjd.cn',
    icp_number: '蜀ICP备16015085号-5',
    police_record: '',
    footer_about: '乡村闲置资产数字交易所。全网多源产权低频提纯，让技术重归山川。',
    hero_title: '寻找被低估的低密度空间资产',
    hero_subtitle: '乡村资产数字化绿色流转中枢。全网多源产权低频提纯，一键交叉碰撞，让技术重归山川。',
    total_assets: '104281',
    today_new: '142',
  });

  const handleSave = async (section: string) => {
    // 实际调用 API 保存到 D1
    alert(`${section} 配置已保存！`);
  };

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">📊 运营控制台</h1>

      {/* Stats overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: '总资产数', value: '104,281', icon: '🏠', color: 'text-brand-green' },
          { label: '今日新增', value: '142', icon: '📈', color: 'text-green-500' },
          { label: '待审核', value: '23', icon: '⏳', color: 'text-orange-500' },
          { label: '活跃用户', value: '1,892', icon: '👥', color: 'text-blue-500' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-5 border border-gray-100">
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className="text-xs text-gray-400">{s.label}</div>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Company info */}
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
                value={config[field.key as keyof typeof config]}
                onChange={(e) => setConfig({ ...config, [field.key]: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green"
              />
            </div>
          ))}
        </div>
        <button
          onClick={() => handleSave('公司信息')}
          className="mt-4 bg-brand-green hover:bg-brand-light text-white px-4 py-2 rounded-lg text-sm"
        >
          同步更新至 D1 数据库
        </button>
      </div>

      {/* Footer config */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <h2 className="font-bold text-gray-900 mb-4">页脚配置</h2>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">关于我们文案</label>
          <textarea
            value={config.footer_about}
            onChange={(e) => setConfig({ ...config, footer_about: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green"
          />
        </div>
        <button
          onClick={() => handleSave('页脚')}
          className="mt-4 bg-brand-green hover:bg-brand-light text-white px-4 py-2 rounded-lg text-sm"
        >
          同步更新至 D1 数据库
        </button>
      </div>

      {/* Homepage config */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <h2 className="font-bold text-gray-900 mb-4">首页配置</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Hero 大标题</label>
            <input
              type="text"
              value={config.hero_title}
              onChange={(e) => setConfig({ ...config, hero_title: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Hero 副标题</label>
            <input
              type="text"
              value={config.hero_subtitle}
              onChange={(e) => setConfig({ ...config, hero_subtitle: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">总收录数 (可手动微调)</label>
              <input
                type="text"
                value={config.total_assets}
                onChange={(e) => setConfig({ ...config, total_assets: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">今日上新数 (可手动微调)</label>
              <input
                type="text"
                value={config.today_new}
                onChange={(e) => setConfig({ ...config, today_new: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green"
              />
            </div>
          </div>
        </div>
        <button
          onClick={() => handleSave('首页')}
          className="mt-4 bg-brand-green hover:bg-brand-light text-white px-4 py-2 rounded-lg text-sm"
        >
          同步更新至 D1 数据库
        </button>
      </div>
    </div>
  );
}
