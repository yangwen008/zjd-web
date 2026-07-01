'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface BulkProject {
  id: number;
  title: string;
  code: string | null;
  province: string | null;
  city: string | null;
  area_mu: number | null;
  price_start: number | null;
  yield_rate: number | null;
  status: string;
  views: number;
  created_at: string;
}

const STATUS_LABELS: Record<string, string> = { approved: '已上架', pending: '待审核', rejected: '已拒绝', banned: '已封禁' };
const STATUS_STYLES: Record<string, string> = { approved: 'bg-green-100 text-green-700', pending: 'bg-yellow-100 text-yellow-700', rejected: 'bg-red-100 text-red-700', banned: 'bg-red-100 text-red-700' };

export default function BulkProjectsPage() {
  const [projects, setProjects] = useState<BulkProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const fetchProjects = () => {
    setLoading(true);
    fetch('/api/dashboard/bulk-projects')
      .then((r) => r.json())
      .then((d: any) => setProjects(d.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProjects(); }, []);

  const show = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除该项目？')) return;
    try {
      const res = await fetch('/api/dashboard/bulk-projects', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const d = await res.json() as any;
      if (d.success) { show('✅ 已删除'); fetchProjects(); }
      else show(`❌ ${d.error}`);
    } catch { show('❌ 删除失败'); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">🏢 我的大宗项目</h1>
        <Link href="/dashboard/bulk-projects/new" className="bg-brand-green hover:bg-brand-light text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          ➕ 发布新项目
        </Link>
      </div>

      {msg && <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${msg.startsWith('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{msg}</div>}

      {loading ? (
        <div className="text-center py-16 text-gray-400">加载中...</div>
      ) : projects.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <div className="text-5xl mb-4">🏢</div>
          <p className="text-lg text-gray-500">暂无大宗项目</p>
          <p className="text-sm text-gray-400 mt-1">点击右上角「发布新项目」开始</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 py-3 font-medium text-gray-500">编号</th>
                <th className="px-4 py-3 font-medium text-gray-500">标题</th>
                <th className="px-4 py-3 font-medium text-gray-500">区域</th>
                <th className="px-4 py-3 font-medium text-gray-500">起价</th>
                <th className="px-4 py-3 font-medium text-gray-500">浏览</th>
                <th className="px-4 py-3 font-medium text-gray-500">状态</th>
                <th className="px-4 py-3 font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {projects.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 text-gray-400 font-mono">{p.code || `ZJD-${p.id.toString().padStart(3, '0')}`}</td>
                  <td className="px-4 py-3 font-medium text-gray-900 max-w-[200px] truncate">{p.title}</td>
                  <td className="px-4 py-3 text-gray-500">{[p.province, p.city].filter(Boolean).join(' ')}</td>
                  <td className="px-4 py-3 text-gray-500">{p.price_start ? `¥${p.price_start}万/年` : '-'}</td>
                  <td className="px-4 py-3 text-gray-500">{p.views.toLocaleString()}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[p.status] || 'bg-gray-100 text-gray-600'}`}>{STATUS_LABELS[p.status] || p.status}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <a href={`/bulk-projects/${p.id}`} target="_blank" className="text-xs text-brand-green hover:underline">查看</a>
                      <button onClick={() => handleDelete(p.id)} className="text-xs text-red-500 hover:underline">删除</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
