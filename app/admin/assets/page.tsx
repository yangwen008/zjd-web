'use client';

import { useState } from 'react';

const MOCK_ASSETS = [
  { id: 1, title: '杭州·安吉溪畔宅基地', region: '浙江', source: '官方', status: 'approved', views: 18420 },
  { id: 2, title: '成都·都江堰青城山林地', region: '四川', source: '官方', status: 'approved', views: 17120 },
  { id: 3, title: '大理·苍洱白族老宅', region: '云南', source: '村委', status: 'pending', views: 12480 },
  { id: 4, title: '丽水·缙云石头房', region: '浙江', source: 'UGC', status: 'pending', views: 9430 },
  { id: 5, title: '桂林·阳朔临江院落', region: '广西', source: '官方', status: 'rejected', views: 8940 },
];

export default function AdminAssetsPage() {
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all' ? MOCK_ASSETS : MOCK_ASSETS.filter((a) => a.status === filter);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">🏠 资产审核管理</h1>
        <div className="flex items-center space-x-2">
          {['all', 'pending', 'approved', 'rejected'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
                filter === f ? 'bg-brand-green text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f === 'all' ? '全部' : f === 'pending' ? '待审核' : f === 'approved' ? '已上架' : '已拒绝'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-4 py-3 font-medium text-gray-500">ID</th>
              <th className="px-4 py-3 font-medium text-gray-500">标题</th>
              <th className="px-4 py-3 font-medium text-gray-500">区域</th>
              <th className="px-4 py-3 font-medium text-gray-500">来源</th>
              <th className="px-4 py-3 font-medium text-gray-500">浏览量</th>
              <th className="px-4 py-3 font-medium text-gray-500">状态</th>
              <th className="px-4 py-3 font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((asset) => (
              <tr key={asset.id} className="hover:bg-gray-50/50">
                <td className="px-4 py-3 text-gray-400">#{asset.id}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{asset.title}</td>
                <td className="px-4 py-3 text-gray-500">{asset.region}</td>
                <td className="px-4 py-3">
                  <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{asset.source}</span>
                </td>
                <td className="px-4 py-3 text-gray-500">{asset.views.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    asset.status === 'approved' ? 'bg-green-100 text-green-700' :
                    asset.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {asset.status === 'approved' ? '已上架' : asset.status === 'pending' ? '待审核' : '已拒绝'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center space-x-2">
                    <button className="text-xs text-brand-green hover:underline">编辑</button>
                    {asset.status === 'pending' && (
                      <>
                        <button className="text-xs text-green-600 hover:underline">批准</button>
                        <button className="text-xs text-red-500 hover:underline">拒绝</button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
