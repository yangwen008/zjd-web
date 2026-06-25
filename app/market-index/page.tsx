export const runtime = 'edge';

import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';import { getMarketData, getHomepageConfig } from '@/lib/data';

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

const REGION_EMOJIS: Record<string, string> = {
  '浙江省': '🌊', '四川省': '🐼', '云南省': '🏔️',
  '贵州省': '🌄', '广西壮族自治区': '🌿', '广西': '🌿',
};

const REGION_SUBNAMES: Record<string, string> = {
  '浙江省': '江浙沪核心圈', '四川省': '成渝辐射圈', '云南省': '滇西旅居带',
  '贵州省': '黔东南圈', '广西壮族自治区': '桂北旅居带', '广西': '桂北旅居带',
};

export default async function MarketIndexPage() {
  const [marketData, config] = await Promise.all([
    getMarketData().catch(() => []),
    getHomepageConfig().catch(() => ({})),
  ]);

  return (
    <>
     
      <main className="pt-20 pb-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-2xl">📊</span>
              <h1 className="text-3xl font-bold text-gray-900">全国乡村土地流转价格数据终端</h1>
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

          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
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
                    <tr key={row.province} className="hover:bg-gray-50/50 cursor-pointer" onClick={() => window.location.href=`/market-index/${encodeURIComponent(row.province)}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{REGION_EMOJIS[row.province] || '📍'}</span>
                          <div>
                            <div className="font-medium text-gray-900">{row.province}</div>
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
        </div>
      </main>
     
    </>
  );
}
