export const runtime = 'edge';
export const revalidate = 300;

import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '土地价格大盘 - zjd.cn 乡村闲置资产数字交易所',
  description: '全国各省乡村土地流转价格中位数、涨跌趋势、砍价空间。实时行情数据，助力资产定价决策。',
  keywords: '土地价格,流转行情,宅基地价格,乡村土地中位数,土地流转大盘',
  alternates: { canonical: '/market-index' },
  openGraph: {
    title: '土地价格大盘 - zjd.cn',
    description: '全国各省乡村土地流转价格实时行情。',
    url: 'https://zjd.cn/market-index',
  },
};
import { getMarketData, getHomepageConfig, getAllProvinceEmojis } from '@/lib/data';

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

function getBargainNote(space: number): string {
  if (space > -10) return '流转速度极快';
  if (space > -15) return '空间充足';
  if (space > -20) return '建议抄底';
  return '深度价值';
}

const REGION_SUBNAMES: Record<string, string> = {
  '浙江省': '江浙沪核心圈', '四川省': '成渝辐射圈', '云南省': '滇西旅居带',
  '贵州省': '黔东南圈', '广西壮族自治区': '桂北旅居带',
};

export default async function MarketIndexPage() {
  const [marketData, config, regionEmojis] = await Promise.all([
    getMarketData().catch(() => []),
    getHomepageConfig().catch(() => ({})),
    getAllProvinceEmojis().catch(() => ({} as Record<string, string>)),
  ]);

  return (
    <>
     
      <main className="pt-20 pb-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-2xl">📊</span>
              <h1 className="text-xl md:text-3xl font-bold text-gray-900">全国乡村土地流转价格数据终端</h1>
            </div>
            <p className="text-gray-500">由 zjd.cn 资产大脑对全国产权交易所存量底价进行全自动采集、AI 清洗和指数化提取。</p>
          </div>

          {marketData.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {marketData.slice(0, 2).map((m) => (
                <div key={m.province} className="bg-white rounded-xl p-5 border border-gray-100">
                  <div className="text-xl font-bold text-brand-green mb-1">{m.province}流转均价</div>
                  <div className="text-2xl font-bold text-gray-900">¥{m.median_price}万/年</div>
                  <div className={`text-sm mt-1 ${getChangeStyle(m.change_pct)}`}>{getChangeText(m.change_pct)}</div>
                </div>
              ))}
              <div className="bg-white rounded-xl p-5 border border-gray-100">
                <div className="text-xl font-bold text-brand-green mb-1">全网潜在买卖比</div>
                <div className="text-2xl font-bold text-gray-900">1.48 : 1</div>
                <div className="text-sm mt-1 text-orange-500">⚠ 供不应求</div>
              </div>
              <div className="bg-white rounded-xl p-5 border border-gray-100">
                <div className="text-xl font-bold text-brand-green mb-1">散户溢价空间</div>
                <div className="text-2xl font-bold text-gray-900">{marketData[0]?.bargain_space || '-12.4'}%</div>
                <div className="text-sm mt-1 text-blue-500">💡 砍价空间大</div>
              </div>
            </div>
          )}

          {/* 桌面端：表格 */}
          <div className="hidden md:block bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">省级行政细分流速与交易深度</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-6 py-3 font-medium text-gray-500">省级行政区域</th>
                    <th className="px-6 py-3 font-medium text-gray-500">官方存量挂牌</th>
                    <th className="px-6 py-3 font-medium text-gray-500">租金中位数</th>
                    <th className="px-6 py-3 font-medium text-gray-500">环比涨跌</th>
                    <th className="px-6 py-3 font-medium text-gray-500">砍价空间</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {marketData.length > 0 ? marketData.map((row) => (
                    <tr key={row.province} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{regionEmojis[row.province] || '📍'}</span>
                          <div>
                            <Link href={`/market-index/${encodeURIComponent(row.province)}`} className="font-medium text-gray-900 hover:text-brand-green transition-colors">{row.province}</Link>
                            <div className="text-xs text-gray-400">{REGION_SUBNAMES[row.province] || ''}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium">{row.total_listings.toLocaleString()} 宗</td>
                      <td className="px-6 py-4 font-bold">¥{row.median_price} 万</td>
                      <td className="px-6 py-4"><span className={`font-medium ${getChangeStyle(row.change_pct)}`}>{getChangeText(row.change_pct)}</span></td>
                      <td className="px-6 py-4 text-gray-500">{row.bargain_space}% ({getBargainNote(row.bargain_space)})</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">暂无行情数据</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 移动端：卡片 */}
          <div className="md:hidden space-y-3">
            <div className="px-4 py-3">
              <h2 className="font-bold text-gray-900 text-sm">省级行政细分流速与交易深度</h2>
            </div>
            {marketData.length > 0 ? marketData.map((row) => (
              <Link key={row.province} href={`/market-index/${encodeURIComponent(row.province)}`} className="block bg-white rounded-xl border border-gray-100 p-4 hover:border-brand-green/30 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{regionEmojis[row.province] || '📍'}</span>
                    <div>
                      <div className="font-bold text-gray-900">{row.province}</div>
                      <div className="text-xs text-gray-400">{REGION_SUBNAMES[row.province] || ''}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-brand-green">¥{row.median_price}万/年</div>
                    <div className={`text-xs ${getChangeStyle(row.change_pct)}`}>{getChangeText(row.change_pct)}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-lg p-2 text-center">
                    <div className="text-xs text-gray-400">官方存量</div>
                    <div className="text-sm font-bold text-gray-900">{row.total_listings.toLocaleString()} 宗</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2 text-center">
                    <div className="text-xs text-gray-400">砍价空间</div>
                    <div className="text-sm font-bold text-gray-500">{row.bargain_space}%</div>
                  </div>
                </div>
              </Link>
            )) : (
              <div className="text-center py-12 text-gray-400">暂无行情数据</div>
            )}
          </div>
        </div>
      </main>
     
    </>
  );
}
