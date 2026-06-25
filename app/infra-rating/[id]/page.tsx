export const runtime = 'edge';

import Link from 'next/link';
import { notFound } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import AssetCard from '@/components/shared/AssetCard';
import { getInfraRatingById, getInfraRatings, getAssets, getHomepageConfig } from '@/lib/data';
import type { Asset } from '@/lib/data';

const GRADIENTS = [
  'from-emerald-800 to-emerald-600',
  'from-teal-800 to-teal-600',
  'from-cyan-800 to-cyan-600',
  'from-green-800 to-green-600',
  'from-lime-800 to-lime-600',
  'from-stone-800 to-stone-600',
];

function formatPrice(price: number | null): string {
  if (!price) return '价格面议';
  return `¥${price}万/年起`;
}

function getScoreColor(score: number): string {
  if (score >= 90) return 'text-green-500';
  if (score >= 80) return 'text-yellow-500';
  return 'text-red-500';
}

function getBarWidth(value: number, max: number): string {
  return `${Math.min(Math.round((value / max) * 100), 100)}%`;
}

function getBarColor(value: number, thresholds: { good: number; ok: number }): string {
  if (value <= thresholds.good) return 'bg-green-400';
  if (value <= thresholds.ok) return 'bg-yellow-400';
  return 'bg-red-400';
}

// 从 region 名（如 "杭州·安吉"）中提取关键词用于模糊匹配资产
function getRegionKeywords(region: string): string[] {
  const parts = region.split('·').map((s) => s.trim());
  return parts.filter(Boolean);
}

// 用关键词匹配资产（按 city 或 district 或 title 模糊匹配）
function matchAssetsForKeywords(assets: Asset[], keywords: string[]): Asset[] {
  return assets.filter((a) => {
    const haystack = [a.title, a.city, a.district, a.location].filter(Boolean).join(' ');
    return keywords.some((kw) => haystack.includes(kw));
  });
}

export default async function InfraDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [rating, allRatings, allAssets, config] = await Promise.all([
    getInfraRatingById(id).catch(() => null),
    getInfraRatings().catch(() => []),
    getAssets({ limit: 50 }).catch(() => []),
    getHomepageConfig().catch(() => ({})),
  ]);

  if (!rating) {
    notFound();
  }

  // 匹配该区域的资产
  const keywords = getRegionKeywords(rating.region);
  const matchedAssets = matchAssetsForKeywords(allAssets, keywords).slice(0, 6);

  // 相邻区域（排除自己）
  const peers = allRatings.filter((r) => r.id !== rating.id).slice(0, 4);

  // 当前排名
  const rank = allRatings.findIndex((r) => r.id === rating.id) + 1;

  // 综合评分计算（将各项指标转为 0-100 分）
  const signalScore = Math.max(0, 100 - rating.signal_5g_ms * 2);
  const hospitalScore = Math.max(0, 100 - rating.hospital_min * 2);
  const gridScore = rating.grid_redundancy;
  const overallScore = Math.round((signalScore + hospitalScore + gridScore) / 3);

  return (
    <>
      <Navbar />
      <main className="pt-20 pb-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="text-sm text-gray-400 mb-6">
            <Link href="/" className="hover:text-brand-green">首页</Link>
            <span className="mx-2">/</span>
            <Link href="/infra-rating" className="hover:text-brand-green">基建排行榜</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-700">{rating.region}</span>
          </div>

          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <span className="text-3xl">🛰️</span>
                <h1 className="text-3xl font-bold text-gray-900">{rating.region} · 基建硬指标详情</h1>
                <span className="bg-brand-green text-white text-sm font-bold px-3 py-1 rounded-full">
                  {rating.overall_grade}
                </span>
              </div>
              <p className="text-gray-500">全国排名第 {rank} · 综合评分 {overallScore}/100</p>
            </div>
            <div className="text-right">
              <div className={`text-5xl font-bold ${getScoreColor(overallScore)}`}>{overallScore}</div>
              <div className="text-sm text-gray-400">综合评分</div>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* 5G Signal */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">⚡</span>
                  <div>
                    <div className="font-bold text-gray-900">5G 网络延迟</div>
                    <div className="text-xs text-gray-400">数字千兆通达</div>
                  </div>
                </div>
                <div className={`text-2xl font-bold ${getScoreColor(signalScore)}`}>{rating.signal_5g_ms}ms</div>
              </div>
              <div className="bg-gray-100 rounded-full h-3 overflow-hidden mb-2">
                <div
                  className={`${getBarColor(rating.signal_5g_ms, { good: 20, ok: 40 })} h-3 rounded-full`}
                  style={{ width: getBarWidth(rating.signal_5g_ms, 60) }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>0ms (极佳)</span>
                <span>60ms (一般)</span>
              </div>
              <div className="mt-3 text-sm text-gray-500">
                {rating.signal_5g_ms <= 20 ? '🟢 5G 信号极佳，适合远程办公和直播' :
                 rating.signal_5g_ms <= 40 ? '🟡 5G 信号良好，日常使用无压力' :
                 '🔴 信号偏弱，建议确认室内覆盖'}
              </div>
            </div>

            {/* Hospital */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">🏥</span>
                  <div>
                    <div className="font-bold text-gray-900">三甲医院车程</div>
                    <div className="text-xs text-gray-400">紧急医疗响应</div>
                  </div>
                </div>
                <div className={`text-2xl font-bold ${getScoreColor(hospitalScore)}`}>{rating.hospital_min}分钟</div>
              </div>
              <div className="bg-gray-100 rounded-full h-3 overflow-hidden mb-2">
                <div
                  className={`${getBarColor(rating.hospital_min, { good: 15, ok: 30 })} h-3 rounded-full`}
                  style={{ width: getBarWidth(rating.hospital_min, 60) }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>0 分钟 (极近)</span>
                <span>60 分钟 (偏远)</span>
              </div>
              <div className="mt-3 text-sm text-gray-500">
                {rating.hospital_min <= 15 ? '🟢 医疗资源充足，急救响应快' :
                 rating.hospital_min <= 30 ? '🟡 距离适中，建议配备急救包' :
                 '🔴 距离偏远，建议配备卫星通讯设备'}
              </div>
            </div>

            {/* Grid */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">🔌</span>
                  <div>
                    <div className="font-bold text-gray-900">电网冗余度</div>
                    <div className="text-xs text-gray-400">供电稳定性</div>
                  </div>
                </div>
                <div className={`text-2xl font-bold ${getScoreColor(gridScore)}`}>{rating.grid_redundancy}%</div>
              </div>
              <div className="bg-gray-100 rounded-full h-3 overflow-hidden mb-2">
                <div
                  className={`${gridScore >= 90 ? 'bg-green-400' : gridScore >= 80 ? 'bg-yellow-400' : 'bg-red-400'} h-3 rounded-full`}
                  style={{ width: `${gridScore}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>0% (不可靠)</span>
                <span>100% (双回路)</span>
              </div>
              <div className="mt-3 text-sm text-gray-500">
                {gridScore >= 95 ? '🟢 双回路高压电备份，几乎不停电' :
                 gridScore >= 85 ? '🟡 供电稳定，偶尔有计划停电' :
                 '🔴 单回路供电，建议自备发电机'}
              </div>
            </div>
          </div>

          {/* Matched Assets */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                🏘️ {rating.region} 可流转资产 ({matchedAssets.length})
              </h2>
              <Link href={`/search?province=${encodeURIComponent(keywords[0] || '')}`} className="text-sm text-brand-green hover:underline">
                查看更多 →
              </Link>
            </div>

            {matchedAssets.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {matchedAssets.map((asset, i) => (
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
                <p>暂无{rating.region}的资产数据</p>
                <p className="text-sm mt-1">请先在后台发布或导入该区域的资产</p>
              </div>
            )}
          </div>

          {/* Peer Comparison */}
          {peers.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">📊 相邻区域对比</h2>
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th className="px-6 py-3 font-medium text-gray-500">区域</th>
                      <th className="px-6 py-3 font-medium text-gray-500">5G 延迟</th>
                      <th className="px-6 py-3 font-medium text-gray-500">医院车程</th>
                      <th className="px-6 py-3 font-medium text-gray-500">电网冗余</th>
                      <th className="px-6 py-3 font-medium text-gray-500">综合评级</th>
                      <th className="px-6 py-3 font-medium text-gray-500">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {/* 当前区域 */}
                    <tr className="bg-brand-green/5">
                      <td className="px-6 py-4 font-bold text-gray-900">📍 {rating.region}</td>
                      <td className="px-6 py-4">{rating.signal_5g_ms}ms</td>
                      <td className="px-6 py-4">{rating.hospital_min}分钟</td>
                      <td className="px-6 py-4">{rating.grid_redundancy}%</td>
                      <td className="px-6 py-4">
                        <span className="bg-brand-green text-white text-xs px-2 py-0.5 rounded font-bold">{rating.overall_grade}</span>
                      </td>
                      <td className="px-6 py-4 text-gray-400">当前</td>
                    </tr>
                    {/* 其他区域 */}
                    {peers.map((peer) => (
                      <tr key={peer.id} className="hover:bg-gray-50/50">
                        <td className="px-6 py-4 font-medium text-gray-900">{peer.region}</td>
                        <td className="px-6 py-4">{peer.signal_5g_ms}ms</td>
                        <td className="px-6 py-4">{peer.hospital_min}分钟</td>
                        <td className="px-6 py-4">{peer.grid_redundancy}%</td>
                        <td className="px-6 py-4">
                          <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded">{peer.overall_grade}</span>
                        </td>
                        <td className="px-6 py-4">
                          <Link href={`/infra-rating/${peer.id}`} className="text-brand-green hover:underline text-xs">
                            查看详情
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer config={config} />
    </>
  );
}
