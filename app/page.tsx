import Link from "next/link";
import HeroSection from "@/components/test-home/HeroSection";
import RegionGrid from "@/components/test-home/RegionGrid";
import MarketStats from "@/components/test-home/MarketStats";
import PropertyCard from "@/components/test-home/PropertyCard";
import VillageDirectCard from "@/components/test-home/VillageDirectCard";
import BulkProjectCard from "@/components/test-home/BulkProjectCard";
import InfraRatingCard from "@/components/test-home/InfraRatingCard";
import BrokerCard from "@/components/test-home/BrokerCard";
import CTASection from "@/components/test-home/CTASection";

import { 
  getHotAssets, 
  getMarketData, 
  getAssetsBySource, 
  getLatestAssets,
  getFeaturedBulkProjects,
  getInfraRatings,
  getBrokers,
  getHomepageConfig,
  getConfigValue,
  getConfigCount,
  type Asset,
  type MarketData,
  type InfraRating,
  type Broker,
  type BulkProject
} from "@/lib/data";

export const runtime = 'edge';

// --- 原版辅助函数与字典（用于行情表格） ---
function getRegionEmojis(config: Record<string, string>): Record<string, string> {
  try {
    return JSON.parse(getConfigValue(config, 'region_emojis') || '{}');
  } catch {
    return {};
  }
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

// 格式化价格
function formatPrice(price: number | null): string {
  if (!price) return '面议';
  return `${price}万`;
}

// 格式化图片URL（fallback 从 config 读取）
function getFirstImage(images: string | null, defaultImage: string): string {
  if (!images) return defaultImage;
  try {
    const arr = JSON.parse(images);
    if (!Array.isArray(arr) || arr.length === 0) return defaultImage;
    const first = arr[0];
    // 兼容新格式 { url, thumb } 和旧格式纯字符串
    if (typeof first === 'object' && first.thumb) return first.thumb;
    return typeof first === 'object' ? first.url : first;
  } catch {
    return defaultImage;
  }
}

// 转换资产数据为PropertyCard格式
function toPropertyFormat(asset: Asset, defaultImage: string) {
  return {
    id: asset.id.toString(),
    title: asset.title,
    price: formatPrice(asset.price_year),
    priceUnit: '年',
    location: asset.province ? `${asset.province}·${asset.city || ''}` : '全国',
    type: `${asset.lease_years || 20}年期${asset.asset_type || '宅基地'}使用权`,
    imageUrl: getFirstImage(asset.images, defaultImage),
    badge: asset.source_type === 'official' ? '官方' : 
           asset.source_type === 'village' ? '村委' : '个人',
    certification: (asset as any).certification || 'uncertified',
  };
}

// 转换资产数据为VillageDirectCard格式
function toVillageFormat(asset: Asset, defaultImage: string) {
  return {
    id: asset.id.toString(),
    title: asset.title,
    contact: asset.contact_name || '村委负责人',
    description: asset.description || '【村委官方直招】已完成林地及基本农田交叉排查。',
    price: formatPrice(asset.price_year) + '/年',
    imageUrl: getFirstImage(asset.images, defaultImage)
  };
}

// 转换 BulkProject 数据为 BulkProjectCard 格式
function toBulkFormat(bp: BulkProject) {
  return {
    id: bp.id.toString(),
    code: bp.code || `ZJD-${bp.id.toString().padStart(3, '0')}`,
    title: bp.title,
    description: bp.description || '包含完整空间、宽敞院落。权属已归属乡村经济合作社。',
    area: bp.area_sqm ? `约${bp.area_sqm}㎡` : (bp.area_mu ? `约${Math.round(bp.area_mu * 666.7)}㎡` : '-'),
    yieldRate: bp.yield_rate ? `${bp.yield_rate}%` : '-',
    price: bp.price_start ? `¥${bp.price_start}万/年起` : '价格面议',
    hasCertificate: bp.certification === 'certified',
  };
}

// 转换基建数据
function toInfraFormat(infra: InfraRating) {
  return {
    id: infra.id.toString(),
    region: infra.region,
    score: infra.signal_5g_ms < 50 ? 9.5 : infra.signal_5g_ms < 100 ? 8.8 : 7.2,
    internet: `${infra.signal_5g_ms}ms 5G延迟`,
    medical: `${infra.hospital_min}分钟到三甲医院`,
    power: infra.grid_redundancy > 1 ? '双回路高压电备份' : '单回路供电'
  };
}

// 转换合伙人数据
function toBrokerFormat(broker: Broker, defaultAvatar: string) {
  return {
    id: broker.id.toString(),
    name: broker.name,
    region: broker.region || '全国',
    avatarUrl: broker.avatar_url || defaultAvatar,
    successRate: `${Math.round(broker.good_rate * 100)}%`,
    leads: `${broker.show_count} 宗`,
    phone: broker.phone_encrypted || '138****0000'
  };
}

// --- 主页面（异步服务端组件） ---
export default async function HomePage() {
  // 并行查询所有数据
  const [hotAssets, marketData, latestAssets, officialAssets, villageAssets, bulkProjectsData, infraRatings, brokers, config] = await Promise.all([
    getHotAssets(6).catch(() => [] as Asset[]),
    getMarketData().catch(() => [] as MarketData[]),
    getLatestAssets(getConfigCount({}, 'section_latest_count', 6)).catch(() => [] as Asset[]),
    getAssetsBySource('official', 6).catch(() => [] as Asset[]),
    getAssetsBySource('village', 2).catch(() => [] as Asset[]),
    getFeaturedBulkProjects(2).catch(() => [] as BulkProject[]),
    getInfraRatings().catch(() => [] as InfraRating[]),
    getBrokers(3).catch(() => [] as Broker[]),
    getHomepageConfig().catch(() => ({} as Record<string, string>)),
  ]);

  // 从 config 读取图片 fallback
  const defaultImage = getConfigValue(config, 'default_image');
  const defaultAvatar = getConfigValue(config, 'default_avatar');
  const regionEmojis = getRegionEmojis(config);

  // 转换数据格式
  const regions = hotAssets.map((asset, i) => ({
    id: asset.id.toString(),
    rank: i + 1,
    name: asset.title.split('·')[0] || asset.title,
    subtitle: asset.asset_type || '宅基地',
    views: asset.views,
    imageUrl: getFirstImage(asset.images, defaultImage)
  }));

  const properties = officialAssets.map(a => toPropertyFormat(a, defaultImage));
  const villageProjects = villageAssets.map(a => toVillageFormat(a, defaultImage));
  const bulkProjects = bulkProjectsData.map(bp => toBulkFormat(bp));
  const infraRatingsFormatted = infraRatings.map(toInfraFormat);
  const brokersFormatted = brokers.map(b => toBrokerFormat(b, defaultAvatar));

  const totalAssets = getConfigValue(config, 'total_assets');
  const todayNew = getConfigValue(config, 'today_new');

  return (
    <div className="min-h-screen bg-gray-50">
      <style dangerouslySetInnerHTML={{ __html: `
        .card-hover { transition: all 0.3s ease; }
        .card-hover:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(0,0,0,0.1); }
        .image-zoom { transition: transform 0.5s ease; }
        .group:hover .image-zoom { transform: scale(1.1); }
      `}} />

      <main>
        <HeroSection totalAssets={totalAssets} todayNew={todayNew} />
        <RegionGrid regions={regions} title={getConfigValue(config, 'section_regions_title')} subtitle={getConfigValue(config, 'section_regions_subtitle')} />

        {/* 最新发布（所有来源混合） */}
        {latestAssets.length > 0 && (
          <section className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🆕</span>
                  <h2 className="text-2xl font-bold text-gray-900">{getConfigValue(config, 'section_latest_title')}</h2>
                </div>
                <Link href="/search?sort=newest" className="text-sm text-[#1a4731] hover:underline font-medium">{getConfigValue(config, 'section_latest_subtitle')} →</Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {latestAssets.map((a) => {
                  const badge = a.source_type === 'official' ? '官方' : a.source_type === 'village' ? '村委' : '个人';
                  return (
                    <Link key={a.id} href={`/asset/${a.id}`} className="block">
                      <PropertyCard property={toPropertyFormat(a, defaultImage)} />
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        <MarketStats marketData={marketData} />
        
        {/* 行情数据详细表格（动态） */}
        <section className="bg-gray-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-900">{getConfigValue(config, 'section_market_title')}</h3>
                <div className="flex items-center space-x-1 text-xs text-green-500">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
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
                            <span className="text-lg">{regionEmojis[row.province] || '📍'}</span>
                            <div>
                              <div className="font-medium text-gray-900">{row.province}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium">{row.total_listings?.toLocaleString() || 0} 宗</td>
                        <td className="px-6 py-4 font-bold text-gray-900">¥{row.median_price} 万</td>
                        <td className="px-6 py-4">
                          <span className={`font-medium ${getChangeStyle(row.change_pct)}`}>
                            {getChangeText(row.change_pct)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <div className="flex-1 bg-gray-100 rounded-full h-2 max-w-[100px]">
                              <div 
                                className={`${getBarColor(row.bargain_space)} h-2 rounded-full`} 
                                style={{ width: getBarWidth(row.bargain_space) }}
                              ></div>
                            </div>
                            <span className={`${getBargainColor(row.bargain_space)} text-xs font-medium`}>
                              {row.bargain_space}% ({getBargainNote(row.bargain_space)})
                            </span>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-gray-400">暂无行情数据</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
        
        {/* 官方原矿区 */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <span className="bg-[#1a4731] text-white px-2 py-1 rounded text-xs font-bold">OFFICIAL</span>
                <span className="text-2xl">🏛️</span>
                <h2 className="text-2xl font-bold text-gray-900">{getConfigValue(config, 'section_official_title')}</h2>
              </div>
              <Link href="/search?source=official" className="text-sm text-[#1a4731] hover:underline font-medium">{getConfigValue(config, 'section_official_subtitle')} →</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((p) => (
                <Link key={p.id} href={`/asset/${p.id}`} className="block">
                  <PropertyCard property={p} />
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* 村集体直发专区 */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <span className="bg-red-600 text-white px-2 py-1 rounded text-xs font-bold">VILLAGE DIRECT</span>
                <span className="text-2xl">🏛️</span>
                <h2 className="text-2xl font-bold text-gray-900">{getConfigValue(config, 'section_village_title')}</h2>
              </div>
              <Link href="/search?source=village" className="text-sm text-[#1a4731] hover:underline font-medium">{getConfigValue(config, 'section_village_subtitle')} →</Link>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {villageProjects.map((p) => (
                <Link key={p.id} href={`/asset/${p.id}`} className="block">
                  <VillageDirectCard project={p} />
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* 文旅大宗产业路演带 */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <span className="bg-yellow-600 text-white px-2 py-1 rounded text-xs font-bold">BULK ROADSHOW</span>
                <span className="text-2xl">🎪</span>
                <h2 className="text-2xl font-bold text-gray-900">{getConfigValue(config, 'section_bulk_title')}</h2>
              </div>
              <Link href="/bulk-projects" className="text-sm text-[#1a4731] hover:underline font-medium">{getConfigValue(config, 'section_bulk_subtitle')} →</Link>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {bulkProjects.map((p) => (
                <Link key={p.id} href={`/bulk-projects/${p.id}`} className="block">
                  <BulkProjectCard project={p} />
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* 数字化隐居基建硬指标 */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <span className="bg-[#1a4731] text-white px-2 py-1 rounded text-xs font-bold">INFRASTRUCTURE</span>
                <span className="text-2xl">📡</span>
                <h2 className="text-2xl font-bold text-gray-900">{getConfigValue(config, 'section_infra_title')}</h2>
              </div>
              <Link href="/infra-rating" className="text-sm text-[#1a4731] hover:underline font-medium">{getConfigValue(config, 'section_infra_subtitle')} →</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {infraRatingsFormatted.map((i) => (
                <Link key={i.id} href="/infra-rating" className="block">
                  <InfraRatingCard infra={i} />
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* 本地金牌合伙人联播网 */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <span className="bg-[#1a4731] text-white px-2 py-1 rounded text-xs font-bold">BROKERS</span>
                <span className="text-2xl">🤝</span>
                <h2 className="text-2xl font-bold text-gray-900">{getConfigValue(config, 'section_brokers_title')}</h2>
              </div>
              <Link href="/brokers" className="text-sm text-[#1a4731] hover:underline font-medium">{getConfigValue(config, 'section_brokers_subtitle')} →</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {brokersFormatted.map((b) => (
                <Link key={b.id} href="/brokers" className="block">
                  <BrokerCard broker={b} />
                </Link>
              ))}
            </div>
          </div>
        </section>

        <CTASection />
      </main>
    </div>
  );
}
