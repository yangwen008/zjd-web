export const runtime = 'edge';

import Link from 'next/link';
import { notFound } from 'next/navigation';
import AssetCard from '@/components/shared/AssetCard';
import { getMarketDataByProvince, getAssetsByProvince, getHomepageConfig } from '@/lib/data';

const GRADIENTS = [
  'from-emerald-800 to-emerald-600',
  'from-teal-800 to-teal-600',
  'from-cyan-800 to-cyan-600',
  'from-green-800 to-green-600',
  'from-lime-800 to-lime-600',
  'from-stone-800 to-stone-600',
];

const REGION_EMOJIS: Record<string, string> = {
  '浙江省': '🌊', '四川省': '🐼', '云南省': '🏔️',
  '贵州省': '🌄', '广西壮族自治区': '🌿', '北京市': '🏛️', '湖北省': '🌸',
};

function formatPrice(price: number | null): string {
  if (!price) return '价格面议';
  return `¥${price}万/年起`;
}

function getChangeStyle(pct: number): string {
  if (pct > 0) return 'text-green-500';
  if (pct < 0) return 'text-red-500';
  return 'text-gray-400';
}

function getChangeText(pct: number): string {
  if (pct > 0) return `↑ +${pct}%`;
  if (pct < 0) return `↓ ${pct}%`;
  return '→ 持平';
}

export default async function ProvinceMarketPage({ params }: { params: Promise<{ province: string }> }) {
  const { province } = await params;
  const decodedProvince = decodeURIComponent(province);

  const [marketData, assets, config] = await Promise.all([
    getMarketDataByProvince(decodedProvince).catch(() => null),
    getAssetsByProvince(decodedProvince, 12).catch(() => []),
    getHomepageConfig().catch(() => ({})),
  ]);

  if (!marketData) {
    notFound();
  }

  const emoji = REGION_EMOJIS[decodedProvince] || '📍';

  return (
    <>
      <main className="pt-20 pb-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="text-sm text-gray-400 mb-6">
            <Link href="/" className="hover:text-brand-green">首页</Link>
            <span className="mx-2">/</span>
            <Link href="/market-index" className="hover:text-brand-green">流转大盘</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-700">{decodedProvince}</span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-2">
              <span className="text-3xl">{emoji}</span>
              <h1 className="text-3xl font-bold text-gray-900">{decodedProvince} · 流转行情详情</h1>
            </div>
            <p className="text-gray-500">基于全网产权交易所实时采集数据，AI 清洗后指数化呈现。</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl p-5 border border-gray-100">
              <div className="text-sm text-gray-400 mb-1">流转均价</div>
              <div className="text-2xl font-bold text-brand-green">¥{marketData.median_price}万/年</div>
              <div className={`text-sm mt-1 font-medium ${getChangeStyle(marketData.change_pct)}`}>
                {getChangeText(marketData.change_pct)}
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 border border-gray-100">
              <div className="text-sm text-gray-400 mb-1">官方存量挂牌</div>
              <div className="text-2xl font-bold text-gray-900">{marketData.total_listings.toLocaleString()} 宗</div>
              <div className="text-sm mt-1 text-gray-400">在售资产</div>
            </div>
            <div className="bg-white rounded-xl p-5 border border-gray-100">
              <div className="text-sm text-gray-400 mb-1">散户砍价空间</div>
              <div className="text-2xl font-bold text-blue-500">{marketData.bargain_space}%</div>
              <div className="text-sm mt-1 text-gray-400">
                {marketData.bargain_space > -10 ? '流转速度极快' : marketData.bargain_space > -15 ? '空间充足' : '建议抄底'}
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 border border-gray-100">
              <div className="text-sm text-gray-400 mb-1">本站收录</div>
              <div className="text-2xl font-bold text-gray-900">{assets.length} 宗</div>
              <div className="text-sm mt-1 text-gray-400">可查看详情</div>
            </div>
          </div>

          {/* Price Bar */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 mb-8">
            <h2 className="font-bold text-gray-900 mb-4">价格区间分布</h2>
            <div className="space-y-3">
              {[
                { label: '3万以下/年', range: '低价入门', color: 'bg-green-400' },
                { label: '3-8万/年', range: '主力区间', color: 'bg-blue-400' },
                { label: '8-15万/年', range: '品质之选', color: 'bg-yellow-400' },
                { label: '15万以上/年', range: '高端稀缺', color: 'bg-red-400' },
              ].map((tier) => {
                const count = assets.filter((a) => {
                  const p = a.price_year || 0;
                  if (tier.label.startsWith('3万以下')) return p < 3;
                  if (tier.label.startsWith('3-8')) return p >= 3 && p < 8;
                  if (tier.label.startsWith('8-15')) return p >= 8 && p < 15;
                  return p >= 15;
                }).length;
                const pct = assets.length > 0 ? Math.round((count / assets.length) * 100) : 0;
                return (
                  <div key={tier.label} className="flex items-center space-x-3">
                    <div className="w-28 text-sm text-gray-600">{tier.label}</div>
                    <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                      <div className={`${tier.color} h-4 rounded-full transition-all`} style={{ width: `${Math.max(pct, 2)}%` }}></div>
                    </div>
                    <div className="w-20 text-sm text-gray-500 text-right">{count} 宗 ({pct}%)</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Asset List */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {decodedProvince}可流转资产 · {assets.length} 宗
            </h2>
          </div>

          {assets.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {assets.map((asset, i) => (
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
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400 bg-white rounded-xl border border-gray-100">
              <div className="text-5xl mb-4">📊</div>
              <p className="text-lg">暂无{decodedProvince}的资产数据</p>
              <p className="text-sm mt-2">请先在后台发布或导入资产</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
