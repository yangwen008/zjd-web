'use client';
import { useState, useEffect } from 'react';

interface Lead {
  id: number;
  asset_id: number;
  asset_title: string;
  user_nickname: string;
  unlock_type: string;
  notes: string | null;
  created_at: string;
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

  // 解析预约带看的 notes 字段
  function parseNotes(notes: string | null): { name?: string; phone?: string; note?: string } {
    if (!notes) return {};
    try {
      const parsed = JSON.parse(notes);
      return {
        name: parsed.name || parsed.contact_name,
        phone: parsed.phone || parsed.contact_phone,
        note: parsed.note || parsed.notes,
      };
    } catch {
      return { note: notes };
    }
  }

  function getTypeBadge(type: string) {
    switch (type) {
      case 'appointment':
        return { icon: '📅', label: '预约带看', color: 'bg-green-100 text-green-700' };
      case 'phone':
        return { icon: '📱', label: '电话解锁', color: 'bg-blue-100 text-blue-700' };
      default:
        return { icon: '🔗', label: type, color: 'bg-gray-100 text-gray-700' };
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">📋 我的线索</h1>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-4 py-3 font-medium text-gray-500">类型</th>
              <th className="px-4 py-3 font-medium text-gray-500">资产标题</th>
              <th className="px-4 py-3 font-medium text-gray-500">感兴趣用户</th>
              <th className="px-4 py-3 font-medium text-gray-500">联系电话</th>
              <th className="px-4 py-3 font-medium text-gray-500">备注</th>
              <th className="px-4 py-3 font-medium text-gray-500">时间</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">加载中...</td></tr>
            ) : leads.length > 0 ? leads.map((lead) => {
              const badge = getTypeBadge(lead.unlock_type);
              const parsed = parseNotes(lead.notes);
              return (
                <tr key={lead.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
                      <span>{badge.icon}</span>
                      <span>{badge.label}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <a href={`/asset/${lead.asset_id}`} className="font-medium text-gray-900 hover:text-brand-green hover:underline">
                      {lead.asset_title}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{parsed.name || lead.user_nickname || '匿名'}</td>
                  <td className="px-4 py-3">
                    {parsed.phone ? (
                      <a href={`tel:${parsed.phone}`} className="text-brand-green font-medium hover:underline">
                        {parsed.phone}
                      </a>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs max-w-[200px] truncate">{parsed.note || '-'}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{lead.created_at?.substring(0, 16)}</td>
                </tr>
              );
            }) : (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">暂无线索</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
