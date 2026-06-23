import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const MARKET_DATA = [
  { province: '浙江省', region: '江浙沪核心圈', emoji: '🌊', listings: 1420, price: '¥14.2 万', change: '+4.2%', bargain: '-5.4%', note: '流转速度极快' },
  { province: '四川省', region: '成渝辐射圈', emoji: '🐼', listings: 892, price: '¥7.8 万', change: '+1.8%', bargain: '-12.4%', note: '空间充足' },
  { province: '云南省', region: '滇西旅居带', emoji: '🏔️', listings: 415, price: '¥4.5 万', change: '→ 持平', bargain: '-18.2%', note: '建议抄底' },
  { province: '贵州省', region: '黔东南圈', emoji: '🌄', listings: 286, price: '¥3.2 万', change: '-1.5%', bargain: '-22.1%', note: '深度价值' },
  { province: '广西', region: '桂北旅居带', emoji: '🌿', listings: 198, price: '¥3.8 万', change: '+0.5%', bargain: '-19.5%', note: '潜力待挖' },
];

export default function MarketIndexPage() {
  return (
    <>
      <Navbar />
      <main className="pt-20 pb-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-2xl">📊</span>
              <h1 className="text-3xl font-bold text-gray-900">全国乡村土地流转价格数据终端</h1>
            </div>
            <p className="text-gray-500">由 zjd.cn 资产大脑对全国产权交易所存量底价进行全自动采集、AI 清洗和指数化提取。</p>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { title: '浙江流转均价', value: '¥14.2万/年', change: '↑ +4.2%', color: 'text-green-500' },
              { title: '四川流转均价', value: '¥7.8万/年', change: '↑ +1.8%', color: 'text-green-500' },
              { title: '全网潜在买卖比', value: '1.48 : 1', change: '⚠ 供不应求', color: 'text-orange-500' },
              { title: '散户溢价空间', value: '-12.4%', change: '💡 砍价空间大', color: 'text-blue-500' },
            ].map((m, i) => (
              <div key={i} className="bg-white rounded-xl p-5 border border-gray-100">
                <div className="text-xl font-bold text-brand-green mb-1">{m.title}</div>
                <div className="text-2xl font-bold text-gray-900">{m.value}</div>
                <div className={`text-sm mt-1 ${m.color}`}>{m.change}</div>
              </div>
            ))}
          </div>

          {/* Full table */}
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
                  {MARKET_DATA.map((row) => (
                    <tr key={row.province} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{row.emoji}</span>
                          <div>
                            <div className="font-medium text-gray-900">{row.province}</div>
                            <div className="text-xs text-gray-400">{row.region}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium">{row.listings} 宗</td>
                      <td className="px-6 py-4 font-bold">{row.price}</td>
                      <td className="px-6 py-4 font-medium">{row.change}</td>
                      <td className="px-6 py-4 text-gray-500">{row.bargain} ({row.note})</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
