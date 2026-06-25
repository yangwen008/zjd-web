export const runtime = 'edge';


import { getAssetsBySource, getHomepageConfig } from '@/lib/data';

export default async function BulkProjectsPage() {
  const [projects, config] = await Promise.all([
    getAssetsBySource('official', 10).catch(() => []),
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
            {projects.length > 0 ? projects.map((p) => (
              <div key={p.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden card-hover">
                <div className="h-48 bg-gradient-to-br from-brand-dark to-brand-green relative">
                  <div className="absolute top-4 left-4 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-lg">
                    {p.source_type === 'village' ? '🏛️ 村委直营' : '⚖️ 官方原矿'}
                  </div>
                  <div className="absolute bottom-4 left-4 text-white">
                    <div className="text-xs opacity-80">{p.location || p.province}</div>
                    <div className="text-xl font-bold">{p.title}</div>
                  </div>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-3 gap-4 text-center mb-4">
                    <div>
                      <div className="text-xs text-gray-400">总面积</div>
                      <div className="font-bold text-gray-900">{p.area_mu ? `${p.area_mu} 亩` : '-'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">年租金</div>
                      <div className="font-bold text-brand-green">{p.price_year ? `¥${p.price_year}万` : '-'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">流转期限</div>
                      <div className="font-bold text-gray-900">{p.lease_years ? `${p.lease_years}年` : '-'}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-50">
                    <span>{p.description?.substring(0, 30) || '优质资产'}</span>
                    <span>{p.views.toLocaleString()} 次浏览</span>
                  </div>
                </div>
              </div>
            )) : (
              <div className="col-span-2 text-center py-16 text-gray-400">
                <div className="text-5xl mb-4">🏢</div>
                <p className="text-lg">暂无大宗项目数据</p>
                <p className="text-sm mt-2">请先执行 npm run db:seed 导入种子数据</p>
              </div>
            )}
          </div>
        </div>
      </main>
    
    </>
  );
}
