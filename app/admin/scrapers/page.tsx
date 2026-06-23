'use client';

import { useState } from 'react';

const MOCK_RECIPES = [
  { id: 1, name: '浙江省农村产权交易中心', url: 'zjncq.cn', fields: 12, status: 'success', lastRun: '2026-06-23 03:00' },
  { id: 2, name: '四川省产权交易所', url: 'cdpre.cn', fields: 10, status: 'running', lastRun: '2026-06-23 03:05' },
  { id: 3, name: '云南省公共资源交易', url: 'ynpee.cn', fields: 8, status: 'failed', lastRun: '2026-06-22 03:00' },
];

export default function AdminScrapersPage() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">🛰️ 爬虫采集站管理</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-brand-green hover:bg-brand-light text-white px-4 py-2 rounded-lg text-sm"
        >
          + 新增采集站
        </button>
      </div>

      {/* Recipe list */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-4 py-3 font-medium text-gray-500">站点名称</th>
              <th className="px-4 py-3 font-medium text-gray-500">采集URL</th>
              <th className="px-4 py-3 font-medium text-gray-500">配方字段数</th>
              <th className="px-4 py-3 font-medium text-gray-500">上次运行</th>
              <th className="px-4 py-3 font-medium text-gray-500">状态</th>
              <th className="px-4 py-3 font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {MOCK_RECIPES.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50/50">
                <td className="px-4 py-3 font-medium text-gray-900">{r.name}</td>
                <td className="px-4 py-3 text-gray-500 font-mono text-xs">{r.url}</td>
                <td className="px-4 py-3 text-gray-500">{r.fields} 个字段</td>
                <td className="px-4 py-3 text-gray-400 text-xs">{r.lastRun}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    r.status === 'success' ? 'bg-green-100 text-green-700' :
                    r.status === 'running' ? 'bg-blue-100 text-blue-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {r.status === 'success' ? '✅ 成功' : r.status === 'running' ? '🔄 运行中' : '❌ 失败'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center space-x-2">
                    <button className="text-xs text-brand-green hover:underline">测试</button>
                    <button className="text-xs text-blue-500 hover:underline">编辑</button>
                    <button className="text-xs text-red-500 hover:underline">删除</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="font-bold text-gray-900 mb-4">新增采集站配置</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">站点名称</label>
              <input type="text" placeholder="如：浙江省农村产权交易中心" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">列表页URL</label>
              <input type="text" placeholder="https://example.com/list?page={page}" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green font-mono" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">最大页数</label>
              <input type="number" defaultValue={10} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">翻页方式</label>
              <select className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green">
                <option>URL参数</option>
                <option>点击下一页</option>
                <option>无限滚动</option>
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-500 mb-2">📋 列表页字段映射</label>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              {['标题', '详情链接', '面积', '价格', '地点'].map((field) => (
                <div key={field} className="flex items-center space-x-3">
                  <span className="text-xs text-gray-500 w-16">{field}</span>
                  <input type="text" placeholder="//xpath/selector" className="flex-1 px-2 py-1.5 text-xs border border-gray-200 rounded font-mono" />
                </div>
              ))}
            </div>
            <button className="mt-2 text-xs text-brand-green hover:underline">+ 添加字段</button>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-500 mb-2">🤖 AI清洗设置</label>
            <textarea
              placeholder="自定义AI提取提示词，如：提取面积、价格、产权类型、交通配套..."
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green"
            />
          </div>

          <div className="flex items-center space-x-3">
            <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">🧪 测试抓取</button>
            <button className="bg-brand-green hover:bg-brand-light text-white px-4 py-2 rounded-lg text-sm">💾 保存配方</button>
            <button className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm">取消</button>
          </div>
        </div>
      )}
    </div>
  );
}
