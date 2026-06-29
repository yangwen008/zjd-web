'use client';
import { useState, useEffect } from 'react';

interface Lead {
  id: number; asset_title: string; user_nickname: string; unlock_type: string; created_at: string;
}

export default function MyLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/leads')
      .then((r) => r.json())
      .then((d: any) => { if (d.success) setLeads(d.data || []); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">📋 我的线索</h1>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50 text-left">
            <th className="px-4 py-3 font-medium text-gray-500">资产标题</th>
            <th className="px-4 py-3 font-medium text-gray-500">感兴趣用户</th>
            <th className="px-4 py-3 font-medium text-gray-500">解锁方式</th>
            <th className="px-4 py-3 font-medium text-gray-500">时间</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">加载中...</td></tr>
            : leads.length > 0 ? leads.map((lead) => (
              <tr key={lead.id} className="hover:bg-gray-50/50">
                <td className="px-4 py-3 font-medium text-gray-900">{lead.asset_title}</td>
                <td className="px-4 py-3 text-gray-500">{lead.user_nickname || '匿名'}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{lead.unlock_type === 'phone' ? '📱 电话' : '其他'}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">{lead.created_at?.substring(0, 16)}</td>
              </tr>
            )) : <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">暂无线索</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}