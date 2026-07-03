'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Investment {
  id: number;
  asset_id: number;
  asset_type: string;
  shares: number;
  amount: number;
  status: string;
  notes: string | null;
  created_at: string;
  asset_title: string;
  asset_images: string;
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pending: { label: '待联系', className: 'bg-yellow-100 text-yellow-700' },
  contacted: { label: '已沟通', className: 'bg-blue-100 text-blue-700' },
  signed: { label: '已签约', className: 'bg-green-100 text-green-700' },
  withdrawn: { label: '已退出', className: 'bg-gray-100 text-gray-500' },
};

function getFirstImage(images: string | null): string {
  if (!images) return 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=200&h=200&fit=crop';
  try {
    const arr = JSON.parse(images);
    if (Array.isArray(arr) && arr.length > 0) {
      const first = arr[0];
      return typeof first === 'object' && first.thumb ? first.thumb : (typeof first === 'object' ? first.url : first);
    }
    return 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=200&h=200&fit=crop';
  } catch {
    return 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=200&h=200&fit=crop';
  }
}

export default function MyInvestmentsPage() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/invest')
      .then((r) => r.json())
      .then((d: any) => setInvestments(d.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-brand-green border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">💰 我的参投</h1>
        <span className="text-sm text-gray-400">共 {investments.length} 条记录</span>
      </div>

      {investments.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-lg">暂无参投记录</p>
          <p className="text-sm mt-2">浏览资产详情页，对感兴趣的资产提交认购意向</p>
          <Link href="/search" className="inline-block mt-4 text-sm text-brand-green hover:underline">去浏览资产 →</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {investments.map((inv) => {
            const status = STATUS_LABELS[inv.status] || STATUS_LABELS.pending;
            const detailHref = inv.asset_type === 'bulk_project'
              ? `/bulk-projects/${inv.asset_id}`
              : `/asset/${inv.asset_id}`;
            return (
              <div key={inv.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4 card-hover">
                <Link href={detailHref} className="flex-shrink-0">
                  <img
                    src={getFirstImage(inv.asset_images)}
                    alt={inv.asset_title}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={detailHref} className="font-medium text-gray-900 hover:text-brand-green transition-colors line-clamp-1">
                    {inv.asset_title || '资产已下架'}
                  </Link>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                    <span>认购 <strong className="text-gray-900">{inv.shares}</strong> 份</span>
                    <span>·</span>
                    <span>¥<strong className="text-gray-900">{inv.amount?.toFixed(1)}</strong>万</span>
                    <span>·</span>
                    <span className="text-xs text-gray-400">{inv.created_at?.split('T')[0] || inv.created_at?.split(' ')[0]}</span>
                  </div>
                  {inv.notes && <p className="text-xs text-gray-400 mt-1 line-clamp-1">备注：{inv.notes}</p>}
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${status.className}`}>
                  {status.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
