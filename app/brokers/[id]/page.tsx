export const runtime = 'edge';

import Link from 'next/link';
import { notFound } from 'next/navigation';
import AssetCard from '@/components/shared/AssetCard';
import { getBrokerById, getBrokers, getAssets, getHomepageConfig } from '@/lib/data';
import type { Asset } from '@/lib/data';

const GRADIENTS = [
  'from-emerald-800 to-emerald-600',
  'from-teal-800 to-teal-600',
  'from-cyan-800 to-cyan-600',
  'from-green-800 to-green-600',
  'from-lime-800 to-lime-600',
  'from-stone-800 to-stone-600',
];

const RATING_STYLES: Record<string, { label: string; className: string }> = {
  gold: { label: '⭐ 金牌合伙人', className: 'bg-yellow-100 text-yellow-700' },
  silver: { label: '认证合伙人', className: 'bg-gray-100 text-gray-600' },
  bronze: { label: '认证合伙人', className: 'bg-orange-50 text-orange-600' },
};

function formatPrice(price: number | null): string {
  if (!price) return '价格面议';
  return `¥${price}万/年起`;
}

export default async function BrokerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [broker, allBrokers, allAssets, config] = await Promise.all([
    getBrokerById(id).catch(() => null),
    getBrokers().catch(() => []),
    getAssets({ limit: 50 }).catch(() => []),
    getHomepageConfig().catch(() => ({})),
  ]);

  if (!broker) {
    notFound();
  }

  // 匹配该合伙人的资产：通过 user_id 匹配，或通过 contact_name 模糊匹配
  const brokerAssets = allAssets.filter((a) => {
    if (a.user_id && broker.user_id && a.user_id === broker.user_id) return true;
    if (a.contact_name && broker.name && a.contact_name.includes(broker.name)) return true;
    return false;
  }).slice(0, 6);

  // 其他合伙人（排除自己）
  const peers = allBrokers.filter((b) => b.id !== broker.id).slice(0, 4);
  const ratingStyle = RATING_STYLES[broker.rating] || RATING_STYLES.bronze;

  return (
    <>
      <main className="pt-20 pb-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="text-sm text-gray-400 mb-6">
            <Link href="/" className="hover:text-brand-green">首页</Link>
            <span className="mx-2">/</span>
            <Link href="/brokers" className="hover:text-brand-green">合伙人名录</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-700">{broker.name}</span>
          </div>

          {/* Profile Header */}
          <div className="bg-white rounded-xl border border-gray-100 p-8 mb-8">
            <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
              <div className="w-20 h-20 rounded-full bg-brand-green/10 flex items-center justify-center text-4xl">
                {broker.avatar_url ? (
                  <img src={broker.avatar_url} alt={broker.name} className="w-20 h-20 rounded-full object-cover" />
                ) : '👨‍🌾'}
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900">{broker.name}</h1>
                  <span className={`text-sm px-3 py-1 rounded-full ${ratingStyle.className}`}>
                    {ratingStyle.label}
                  </span>
                </div>
                <div className="text-gray-500 mb-2">📍 {broker.region}</div>
                {broker.bio && <p className="text-gray-600 text-sm">{broker.bio}</p>}
              </div>
              <div className="bg-brand-green/5 rounded-xl p-4 text-center min-w-[160px]">
                <div className="text-sm text-gray-400 mb-1">联系方式</div>
                <div className="text-lg font-bold text-brand-green">扫码解锁</div>
                <div className="text-xs text-gray-400 mt-1">微信安全授权</div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl p-5 border border-gray-100 text-center">
              <div className="text-3xl mb-2">👀</div>
              <div className="text-2xl font-bold text-gray-900">{broker.show_count}</div>
              <div className="text-sm text-gray-400">累计带看</div>
            </div>
            <div className="bg-white rounded-xl p-5 border border-gray-100 text-center">
              <div className="text-3xl mb-2">⭐</div>
              <div className="text-2xl font-bold text-brand-green">{broker.good_rate}%</div>
              <div className="text-sm text-gray-400">好评率</div>
            </div>
            <div className="bg-white rounded-xl p-5 border border-gray-100 text-center">
              <div className="text-3xl mb-2">🏘️</div>
              <div className="text-2xl font-bold text-gray-900">{brokerAssets.length}</div>
              <div className="text-sm text-gray-400">管辖资产</div>
            </div>
            <div className="bg-white rounded-xl p-5 border border-gray-100 text-center">
              <div className="text-3xl mb-2">📅</div>
              <div className="text-2xl font-bold text-gray-900">
                {new Date(broker.created_at).getFullYear()}
              </div>
              <div className="text-sm text-gray-400">入驻年份</div>
            </div>
          </div>

          {/* Broker Assets */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                🏘️ {broker.name}管辖资产 ({brokerAssets.length})
              </h2>
            </div>

            {brokerAssets.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {brokerAssets.map((asset, i) => (
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
              <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-gray-100">
                <div className="text-4xl mb-3">🏘️</div>
                <p>暂无{broker.name}管辖的资产</p>
              </div>
            )}
          </div>

          {/* Service Tags */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 mb-8">
            <h2 className="font-bold text-gray-900 mb-4">🏷️ 服务标签</h2>
            <div className="flex flex-wrap gap-2">
              {['陪同看房', '法务鉴证', '产权核实', '村委对接', '民宿规划', '改造方案'].map((tag) => (
                <span key={tag} className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full text-sm">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Peer Comparison */}
          {peers.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">🤝 其他合伙人</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {peers.map((peer) => {
                  const peerStyle = RATING_STYLES[peer.rating] || RATING_STYLES.bronze;
                  return (
                    <Link
                      key={peer.id}
                      href={`/brokers/${peer.id}`}
                      className="bg-white rounded-xl p-5 border border-gray-100 flex items-center space-x-4 card-hover"
                    >
                      <div className="w-12 h-12 rounded-full bg-brand-green/10 flex items-center justify-center text-xl">
                        {peer.avatar_url ? (
                          <img src={peer.avatar_url} alt={peer.name} className="w-12 h-12 rounded-full object-cover" />
                        ) : '👨‍🌾'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-gray-900">{peer.name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${peerStyle.className}`}>
                            {peerStyle.label}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">
                          {peer.region} · 带看 {peer.show_count} 次 · 好评率 {peer.good_rate}%
                        </div>
                      </div>
                      <div className="text-brand-green text-sm font-medium">查看 →</div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
