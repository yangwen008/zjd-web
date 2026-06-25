import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
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
  getFeaturedAssets,
  getInfraRatings,
  getBrokers,
  getHomepageConfig,
  getConfigValue,
  getConfigCount,
  type Asset,
  type MarketData,
  type InfraRating,
  type Broker
} from "@/lib/data";

export const runtime = 'edge';

// --- 原版辅助函数与字典（用于行情表格） ---
const REGION_EMOJIS: Record<string, string> = {
  '浙江省': '🌊',
  '四川省': '🐼',
  '云南省': '🏔️',
  '贵州省': '🌄',
  '广西壮族自治区': '🌿',
  '广西': '🌿',
};

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

// 格式化图片URL
function getFirstImage(images: string | null): string {
  if (!images) return 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=600&h=400&fit=crop';
  try {
    const arr = JSON.parse(images);
    return Array.isArray(arr) && arr.length > 0 ? arr[0] : 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=600&h=400&fit=crop';
  } catch {
    return 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=600&h=400&fit=crop';
  }
}

// 转换资产数据为PropertyCard格式
function toPropertyFormat(asset: Asset) {
  return {
    id: asset.id.toString(),
    title: asset.title,
    price: formatPrice(asset.price_year),
    priceUnit: '年',
    location: asset.province ? `${asset.province}·${asset.city || ''}` : '全国',
    type: `${asset.lease_years || 20}年期${asset.asset_type || '宅基地'}使用权`,
    imageUrl: getFirstImage(asset.images),
    badge: asset.source_type === 'official' ? '一手官方资源' : 
           asset.source_type === 'village' ? '村委直发' : '用户上传'
  };
}

// 转换资产数据为VillageDirectCard格式
function toVillageFormat(asset: Asset) {
  return {
    id: asset.id.toString(),
    title: asset.title,
    contact: asset.contact_name || '村委负责人',
    description: asset.description || '【村委官方直招】已完成林地及基本农田交叉排查。',
    price: formatPrice(asset.price_year) + '/年',
    imageUrl: getFirstImage(asset.images)
  };
}

// 转换资产数据为BulkProjectCard格式
function toBulkFormat(asset: Asset) {
  return {
    id: asset.id.toString(),
    code: `ZJD-${asset.id.toString().padStart(3, '0')}`,
    title: asset.title,
    description: asset.description || '包含完整空间、宽敞院落。权属已归属乡村经济合作社。',
    area: asset.area_mu ? `约${Math.round(asset.area_mu * 666.7)}㎡` : '约1000㎡',
    yieldRate: '6.80%',
    price: formatPrice(asset.price_year) + '/年起',
    hasCertificate: true
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
function toBrokerFormat(broker: Broker) {
  return {
    id: broker.id.toString(),
    name: broker.name,
    region: broker.region || '全国',
    avatarUrl: broker.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    successRate: `${Math.round(broker.good_rate * 100)}%`,
    leads: `${broker.show_count} 宗`,
    phone: broker.phone_encrypted || '138****0000'
  };
}

// --- 全新高大上页脚 ---
function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <div>
            <div className="text-2xl font-bold text-[#1a4731] mb-3">zjd.cn</div>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              zjd.cn 是由绵阳网安科技有限公司倾力打造的乡村闲置资产数字交易所。我们通过分布式低频智能采矿与大模型型价值清洗，将零散、非结构化的民间资产重塑为具备高依托信用、完美基建指标、完全穿透地理边界的数字化绿色大宗资产。
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-gray-400 hover:text-[#1a4731] transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/></svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-[#1a4731] transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/></svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-[#1a4731] transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/></svg>
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-4">流转大厅</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link href="/regions" className="hover:text-[#1a4731] transition-colors flex items-center gap-2"><span>🔥</span> 热点寻源榜</Link></li>
              <li><Link href="/market-index" className="hover:text-[#1a4731] transition-colors flex items-center gap-2"><span>📊</span> 土地价格大盘</Link></li>
              <li><Link href="/search" className="hover:text-[#1a4731] transition-colors flex items-center gap-2"><span>🔍</span> 官方原矿检索</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-4">双边生态</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link href="/bulk-projects" className="hover:text-[#1a4731] transition-colors flex items-center gap-2"><span>🎪</span> 大宗项目路演</Link></li>
              <li><Link href="/infra-rating" className="hover:text-[#1a4731] transition-colors flex items-center gap-2"><span>🏘️</span> 隐居新基建指标</Link></li>
              <li><Link href="/brokers" className="hover:text-[#1a4731] transition-colors flex items-center gap-2"><span>🤝</span> 地陪合伙人名册</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-4">合作与法务通道</h4>
            <ul className="space-y-2 text-sm text-gray-600 mb-4">
              <li><span className="text-gray-500">合作热线：</span><strong className="text-gray-900">13696266999</strong></li>
              <li><span className="text-gray-500">企业邮箱：</span><strong className="text-gray-900">cooperate@zjd.cn</strong></li>
            </ul>
            <div className="p-3 bg-gray-100 rounded-lg text-xs text-gray-500 leading-relaxed">
              【合规与演绎隔离声明】本平台展示的所有官方产权信息均通过合法公开手段采集，前端呈现的拼凑在新积木上属于"演绎再创作作品"。本店铺坚持共享求真，交易双方须线下验证产权真实性。
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
            <div>© 2026 绵阳网安科技有限公司 版权所有</div>
            <div className="flex gap-6">
              <span>蜀ICP备16015085号-5</span>
              <span>蜀公网安备 51070302000888号</span>
            </div>
            <div className="flex gap-6">
              <a href="#" className="hover:text-[#1a4731] transition-colors">《平台数据隐私保护白皮书》</a>
              <a href="#" className="hover:text-[#1a4731] transition-colors">《免责声明4.0》</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

// --- 主页面（异步服务端组件） ---
export default async function HomePage() {
   // 1. 【修复Bug】：必须先单独获取 config，因为后面的请求参数依赖它
  const config = await getHomepageConfig().catch(() => ({} as Record<string, string>));

  // 2. 拿到 config 后，再并行查询其他所有数据（注意左侧解构去掉了 config）
  const [hotAssets, marketData, officialAssets, villageAssets, bulkAssets, infraRatings, brokers] = await Promise.all([
    getHotAssets(getConfigCount(config, 'section_regions_count', 6)).catch(() => [] as Asset[]),
    getMarketData().catch(() => [] as MarketData[]),
    getAssetsBySource('official', getConfigCount(config, 'section_official_count', 6)).catch(() => [] as Asset[]),
    getAssetsBySource('village', getConfigCount(config, 'section_village_count', 2)).catch(() => [] as Asset[]),
    getFeaturedAssets(getConfigCount(config, 'section_bulk_count', 2)).catch(() => [] as Asset[]),
    getInfraRatings().catch(() => [] as InfraRating[]),
    getBrokers(getConfigCount(config, 'section_brokers_count', 3)).catch(() => [] as Broker[]),
  ]);

  // 转换数据格式
  const regions = hotAssets.map((asset, i) => ({
    id: asset.id.toString(),
    rank: i + 1,
    name: asset.title.split('·')[0] || asset.title,
    subtitle: asset.asset_type || '宅基地',
    views: asset.views,
    imageUrl: getFirstImage(asset.images)
  }));

  const properties = officialAssets.map(toPropertyFormat);
  const villageProjects = villageAssets.map(toVillageFormat);
  const bulkProjects = bulkAssets.map(toBulkFormat);
  const infraRatingsFormatted = infraRatings.map(toInfraFormat);
  const brokersFormatted = brokers.map(toBrokerFormat);

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

      <Navbar />
      
      <main>
        <HeroSection totalAssets={totalAssets} todayNew={todayNew} />
        <RegionGrid regions={regions} title={getConfigValue(config, 'section_regions_title')} subtitle={getConfigValue(config, 'section_regions_subtitle')} />
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
                            <span className="text-lg">{REGION_EMOJIS[row.province] || '📍'}</span>
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
                <Link key={p.id} href={`/asset/${p.id}`} className="block">
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

      <Footer />
    </div>
  );
}
