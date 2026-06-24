export const runtime = 'edge';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import AssetCard from '@/components/shared/AssetCard';
import HeroSection from '@/components/shared/HeroSection';
import { getHotAssets, getMarketData, getHomepageConfig, getAssetsBySource } from '@/lib/data';
import type { Asset, MarketData } from '@/lib/data';

// 格式化价格显示
function formatPrice(price: number | null): string {
  if (!price) return '价格面议';
  return `¥${price}万/年起`;
}

// 资产卡片渐变色映射
const GRADIENTS = [
  'from-emerald-800 to-emerald-600',
  'from-teal-800 to-teal-600',
  'from-cyan-800 to-cyan-600',
  'from-green-800 to-green-600',
  'from-lime-800 to-lime-600',
  'from-stone-800 to-stone-600',
  'from-sky-800 to-sky-600',
  'from-rose-800 to-rose-600',
];

// 行情数据样式
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

function getBargainColor(space: number): string {
  if (space > -10) return 'text-red-400';
  if (space > -15) return 'text-orange-400';
  return 'text-blue-500';
}

function getBargainNote(space: number): string {
  if (space > -10) return '流转速度极快';
  if (space > -15) return '空间充足';
  return '建议抄底';
}

function getBarWidth(space: number): string {
  return `${Math.min(Math.abs(space) * 5, 100)}%`;
}

function getBarColor(space: number): string {
  if (space > -10) return 'bg-red-400';
  if (space > -15) return 'bg-orange-400';
  return 'bg-blue-400';
}

const REGION_EMOJIS: Record<string, string> = {
  '浙江省': '🌊',
  '四川省': '🐼',
  '云南省': '🏔️',
  '贵州省': '🌄',
  '广西壮族自治区': '🌿',
  '广西': '🌿',
};

const FEATURES = [
  { emoji: '⚖️', badge: 'OFFICIAL', badgeColor: 'text-brand-green', bgColor: 'bg-brand-green/10', hoverBg: 'hover:bg-brand-green/20', title: '纯净一手官方原矿区', desc: '进入原矿搜索引擎', href: '/search?source=official' },
  { emoji: '🏛️', badge: 'VILLAGE DIRECT', badgeColor: 'text-amber-600', bgColor: 'bg-amber-50', hoverBg: 'hover:bg-amber-100', title: '村集体直发专区', desc: '查看所有村委直发', href: '/search?source=village' },
  { emoji: '🏢', badge: 'BULK ROADSHOW', badgeColor: 'text-blue-600', bgColor: 'bg-blue-50', hoverBg: 'hover:bg-blue-100', title: '文旅大宗产业路演带', desc: '进入独立路演大厅', href: '/bulk-projects' },
  { emoji: '🛰️', badge: 'INFRASTRUCTURE', badgeColor: 'text-purple-600', bgColor: 'bg-purple-50', hoverBg: 'hover:bg-purple-100', title: '数字化隐居基建硬指标', desc: '查看全国基建指数大表', href: '/infra-rating' },
  { emoji: '🌾', badge: 'BROKERS', badgeColor: 'text-green-600', bgColor: 'bg-green-50', hoverBg: 'hover:bg-green-100', title: '本地金牌合伙人联播网', desc: '查看全网合伙人名册', href: '/brokers' },
];

export default async function HomePage() {
  // 并行查询所有数据
  const [hotAssets, marketData, config] = await Promise.all([
    getHotAssets(6).catch(() => [] as Asset[]),
    getMarketData().catch(() => [] as MarketData[]),
    getHomepageConfig().catch(() => ({} as Record<string, string>)),
  ]);

  const totalAssets = config.total_assets || '0';
  const todayNew = config.today_new || '0';

  return (
    <>
      <Navbar />

      {/* Hero */}
      <HeroSection
        title={config.hero_title || '寻找被低估的低密度空间资产'}
        subtitle={config.hero_subtitle || '乡村资产数字化绿色流转中枢。全网多源产权低频提纯，一键交叉碰撞，让技术重归山川。'}
        totalAssets={totalAssets}
        todayNew={todayNew}
      />

      {/* Hot Assets */}
      <section id="hot" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-2xl">🔥</span>
              <h2 className="text-2xl font-bold text-gray-900">核心热点寻源区</h2>
            </div>
            <p className="text-sm text-gray-500">默认按本站最热点击量、收藏爆款降序排列</p>
          </div>
          <a href="/regions" className="text-sm text-brand-green hover:text-brand-light flex items-center space-x-1">
            <span>查看本站热度排行</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </a>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {hotAssets.length > 0 ? (
            hotAssets.map((asset, i) => (
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
            ))
          ) : (
            // 无数据时的占位
            <div className="col-span-3 text-center py-12 text-gray-400">
              <div className="text-4xl mb-3">🌾</div>
              <p>数据加载中...请先执行 npm run db:seed 导入种子数据</p>
            </div>
          )}
        </div>
      </section>

      {/* Market Index */}
      <section id="market" className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-2xl">📊</span>
                <h2 className="text-2xl font-bold text-gray-900">流转行情看板</h2>
              </div>
              <p className="text-sm text-gray-500">点击进入独立二级行情数据终端</p>
            </div>
            <a href="/market-index" className="text-sm text-brand-green hover:text-brand-light flex items-center space-x-1">
              <span>进入完整数据终端</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </a>
          </div>

          {/* Metric cards */}
          {marketData.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {marketData.slice(0, 2).map((m) => (
                <div key={m.province} className="bg-white rounded-xl p-5 border border-gray-100 card-hover">
                  <div className="text-xs text-gray-500 mb-1">2026 实时指数</div>
                  <div className="text-xl font-bold text-brand-green">{m.province}流转均价</div>
                  <div className="text-2xl font-bold text-gray-900 mt-1">
                    ¥{m.median_price}<span className="text-sm font-normal text-gray-500">万/年</span>
                  </div>
                  <div className={`text-sm mt-1 ${getChangeStyle(m.change_pct)}`}>{getChangeText(m.change_pct)}</div>
                </div>
              ))}
              <div className="bg-white rounded-xl p-5 border border-gray-100 card-hover">
                <div className="text-xs text-gray-500 mb-1">供需指标</div>
                <div className="text-xl font-bold text-brand-green">全网潜在买卖比</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">1.48<span className="text-sm font-normal text-gray-500">: 1</span></div>
                <div className="text-sm mt-1 text-orange-500">⚠ 供不应求</div>
              </div>
              <div className="bg-white rounded-xl p-5 border border-gray-100 card-hover">
                <div className="text-xs text-gray-500 mb-1">散户指标</div>
                <div className="text-xl font-bold text-brand-green">散户溢价空间</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">{marketData[0]?.bargain_space || '-12.4'}<span className="text-sm font-normal text-gray-500">%</span></div>
                <div className="text-sm mt-1 text-blue-500">💡 砍价空间大</div>
              </div>
            </div>
          )}

          {/* Market table */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">省级行政细分流速与交易深度</h3>
              <div className="flex items-center space-x-1 text-xs text-green-500">
                <span className="w-2 h-2 bg-green-500 rounded-full pulse-dot"></span>
                <span>CONNECTED</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-6 py-3 font-medium text-gray-500">省级行政区域</th>
                    <th className="px-6 py-3 font-medium text-gray-500">官方存量挂牌</th>
                    <th className="px-6 py-3 font-medium text-gray-500">租金中位数 (年)</th>
                    <th className="px-6 py-3 font-medium text-gray-500">环比本周涨跌</th>
                    <th className="px-6 py-3 font-medium text-gray-500">散户民间砍价空间</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {marketData.length > 0 ? marketData.map((row) => (
                    <tr key={row.province} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{REGION_EMOJIS[row.province] || '📍'}</span>
                          <div>
                            <div className="font-medium text-gray-900">{row.province}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium">{row.total_listings.toLocaleString()} 宗</td>
                      <td className="px-6 py-4 font-bold text-gray-900">¥{row.median_price} 万</td>
                      <td className="px-6 py-4"><span className={`font-medium ${getChangeStyle(row.change_pct)}`}>{getChangeText(row.change_pct)}</span></td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-gray-100 rounded-full h-2 max-w-[100px]">
                            <div className={`${getBarColor(row.bargain_space)} h-2 rounded-full`} style={{ width: getBarWidth(row.bargain_space) }}></div>
                          </div>
                          <span className={`${getBargainColor(row.bargain_space)} text-xs font-medium`}>{row.bargain_space}% ({getBargainNote(row.bargain_space)})</span>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">暂无行情数据</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Data Security + Feature Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-gradient-to-r from-brand-dark to-brand-green rounded-2xl p-8 mb-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10 flex items-start space-x-4">
            <div className="text-4xl">🛡️</div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">数据安全装甲</h3>
              <p className="text-gray-300 text-sm leading-relaxed max-w-2xl">
                为死守平台的数据资产护城河，防范竞争同行恶意&quot;抄底白嫖&quot;，系统<strong className="text-yellow-400">永久封锁任何离线下载 Excel/CAD 的通道</strong>。所有的深度比对分析、GIS 交叉校验流程必须在平台内无缝完成。
              </p>
              <button className="mt-4 bg-white/10 hover:bg-white/20 text-white text-sm px-4 py-2 rounded-lg border border-white/20 transition-all">
                批量导出 (测试防盗墙)
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {FEATURES.map((f) => (
            <a key={f.badge} href={f.href} className={`group bg-white rounded-xl p-6 border border-gray-100 card-hover text-center`}>
              <div className={`w-14 h-14 mx-auto mb-4 rounded-xl ${f.bgColor} flex items-center justify-center ${f.hoverBg} transition-colors`}>
                <span className="text-2xl">{f.emoji}</span>
              </div>
              <div className={`text-xs font-bold ${f.badgeColor} uppercase tracking-wider mb-1`}>{f.badge}</div>
              <div className="font-bold text-gray-900 mb-1">{f.title}</div>
              <div className="text-xs text-gray-400">{f.desc}</div>
            </a>
          ))}
        </div>
      </section>

      <Footer config={config} />
    </>
  );
}
