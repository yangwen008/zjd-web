export const runtime = 'edge';


import AssetCard from '@/components/shared/AssetCard';
import { getHotAssets, getHomepageConfig } from '@/lib/data';

const GRADIENTS = [
  'from-emerald-800 to-emerald-600',
  'from-teal-800 to-teal-600',
  'from-cyan-800 to-cyan-600',
  'from-green-800 to-green-600',
  'from-lime-800 to-lime-600',
  'from-stone-800 to-stone-600',
  'from-sky-800 to-sky-600',
  'from-rose-800 to-rose-600',
  'from-indigo-800 to-indigo-600',
];

function formatPrice(price: number | null): string {
  if (!price) return '价格面议';
  return `¥${price}万/年起`;
}

export default async function RegionsPage() {
  const [hotAssets, config] = await Promise.all([
    getHotAssets(20).catch(() => []),
    getHomepageConfig().catch(() => ({})),
  ]);

  const totalViews = hotAssets.reduce((sum, a) => sum + a.views, 0);

  return (
    <>
   
      <main className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">🔥 热点寻源大厅</h1>
            <p className="text-gray-500">实时观测全网投资商、买家的点击行为，按访问量自动加权降序推荐。</p>
            <div className="mt-4 flex items-center space-x-4 text-sm">
              <span className="text-gray-400">今日总累积浏览: <strong className="text-gray-900">{totalViews.toLocaleString()}</strong> Clicks</span>
              <span className="px-3 py-1 rounded-full bg-brand-green text-white text-xs">🔥 按点击量 ⬇️</span>
              <a href="/search?sort=price" className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs hover:bg-gray-200">💰 按起价 ⬆️</a>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {hotAssets.length > 0 ? hotAssets.map((asset, i) => (
              <AssetCard
                key={asset.id}
                rank={i + 1}
                title={asset.title}
                subtitle={asset.location || asset.asset_type || ''}
                views={asset.views}
                price={formatPrice(asset.price_year)}
                gradient={GRADIENTS[i % GRADIENTS.length]}
                href={`/asset/${asset.id}`}
              />
            )) : (
              <div className="col-span-3 text-center py-16 text-gray-400">
                <div className="text-5xl mb-4">🔥</div>
                <p className="text-lg">暂无热度数据</p>
                <p className="text-sm mt-2">请先执行 npm run db:seed 导入种子数据</p>
              </div>
            )}
          </div>
        </div>
      </main>
      
    </>
  );
}
