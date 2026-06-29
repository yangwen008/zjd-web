export const runtime = 'edge';

import Link from 'next/link';
import { getBulkProjects, getHomepageConfig } from '@/lib/data';
import type { BulkProject } from '@/lib/data';

function getFirstImage(images: string | null): string {
  if (!images) return 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800';
  try {
    const arr = JSON.parse(images);
    return Array.isArray(arr) && arr.length > 0 ? arr[0] : 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800';
  } catch {
    return 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800';
  }
}

const CERT_BADGES: Record<string, { label: string; className: string }> = {
  certified: { label: '✅ 已确权', className: 'bg-green-100 text-green-700' },
  pending: { label: '⏳ 待确权', className: 'bg-yellow-100 text-yellow-700' },
  uncertified: { label: '未确权', className: 'bg-gray-100 text-gray-600' },
};

export default async function BulkProjectsPage() {
  const [projects, config] = await Promise.all([
    getBulkProjects({ limit: 20 }).catch(() => [] as BulkProject[]),
    getHomepageConfig().catch(() => ({})),
  ]);

  return (
    <>
      <main className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-2xl">🏢</span>
              <h1 className="text-3xl font-bold text-gray-900">大宗文旅项目及招商引资路演厅</h1>
            </div>
            <p className="text-gray-500">集约化、无历史产权争议的集体闲置资产，专供大B端连锁品牌、高资本康养集团。</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.length > 0 ? projects.map((p) => {
              const cert = CERT_BADGES[p.certification] || CERT_BADGES.uncertified;
              return (
                <Link key={p.id} href={`/bulk-projects/${p.id}`} className="block bg-white rounded-xl border border-gray-100 overflow-hidden card-hover">
                  <div className="h-48 bg-gradient-to-br from-brand-dark to-brand-green relative overflow-hidden">
                    <img src={getFirstImage(p.images)} alt={p.title} className="w-full h-full object-cover opacity-80" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute top-4 left-4 flex items-center space-x-2">
                      {p.code && <span className="bg-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-lg">{p.code}</span>}
                      <span className={`text-xs font-bold px-2 py-1 rounded ${cert.className}`}>{cert.label}</span>
                    </div>
                    <div className="absolute bottom-4 left-4 text-white">
                      <div className="text-xs opacity-80">{p.location || [p.province, p.city].filter(Boolean).join(' · ')}</div>
                      <div className="text-xl font-bold">{p.title}</div>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="grid grid-cols-3 gap-4 text-center mb-4">
                      <div>
                        <div className="text-xs text-gray-400">总面积</div>
                        <div className="font-bold text-gray-900">
                          {p.area_sqm ? `${p.area_sqm} ㎡` : (p.area_mu ? `${p.area_mu} 亩` : '-')}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">年收益率</div>
                        <div className="font-bold text-green-600">{p.yield_rate ? `${p.yield_rate}%` : '-'}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">流转期限</div>
                        <div className="font-bold text-gray-900">{p.lease_years ? `${p.lease_years}年` : '-'}</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                      <div>
                        <div className="text-xs text-gray-400">起始价</div>
                        <div className="text-lg font-bold text-gray-900">
                          {p.price_start ? `¥${p.price_start}万/年起` : '价格面议'}
                        </div>
                      </div>
                      <span className="text-sm text-brand-green font-medium">查看详情 →</span>
                    </div>
                  </div>
                </Link>
              );
            }) : (
              <div className="col-span-2 text-center py-16 text-gray-400">
                <div className="text-5xl mb-4">🏢</div>
                <p className="text-lg">暂无大宗项目数据</p>
                <p className="text-sm mt-2">请先在后台添加大宗路演项目</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
