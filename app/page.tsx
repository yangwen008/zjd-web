'use client';

import { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import AssetCard from '@/components/shared/AssetCard';
import WeChatModal from '@/components/shared/WeChatModal';

// 模拟数据 - 实际从D1读取
const HOT_ASSETS = [
  { rank: 1, title: '杭州·安吉圈', subtitle: '溪畔宅基地原矿', views: 18420, price: '¥12.8万/年起', gradient: 'from-emerald-800 to-emerald-600' },
  { rank: 2, title: '成都·都江堰', subtitle: '青城山林地茶场', views: 17120, price: '¥6.5万/年起', gradient: 'from-teal-800 to-teal-600' },
  { rank: 3, title: '大理·苍洱圈', subtitle: '传统完好白族老宅', views: 12480, price: '¥3.2万/年起', gradient: 'from-cyan-800 to-cyan-600' },
  { rank: 4, title: '丽水·缙云圈', subtitle: '景区旁极客石头房', views: 9430, price: '¥5.8万/年起', gradient: 'from-green-800 to-green-600' },
  { rank: 5, title: '桂林·阳朔圈', subtitle: '临江峰林院落', views: 8940, price: '¥4.2万/年起', gradient: 'from-lime-800 to-lime-600' },
  { rank: 6, title: '北京·延庆圈', subtitle: '长城脚下北方老院', views: 6510, price: '¥9.6万/年起', gradient: 'from-stone-800 to-stone-600' },
];

const MARKET_DATA = [
  { province: '浙江省', region: '江浙沪核心圈', emoji: '🌊', listings: 1420, price: '¥14.2 万', change: '+4.2%', changeColor: 'text-green-500', bargain: '-5.4%', bargainColor: 'text-red-400', barWidth: '27%', barColor: 'bg-red-400', note: '流转速度极快' },
  { province: '四川省', region: '成渝辐射圈', emoji: '🐼', listings: 892, price: '¥7.8 万', change: '+1.8%', changeColor: 'text-green-500', bargain: '-12.4%', bargainColor: 'text-orange-400', barWidth: '62%', barColor: 'bg-orange-400', note: '空间充足' },
  { province: '云南省', region: '滇西旅居带', emoji: '🏔️', listings: 415, price: '¥4.5 万', change: '→ 持平', changeColor: 'text-gray-400', bargain: '-18.2%', bargainColor: 'text-blue-500', barWidth: '91%', barColor: 'bg-blue-400', note: '建议抄底' },
];

const FEATURES = [
  { emoji: '⚖️', badge: 'OFFICIAL', badgeColor: 'text-brand-green', bgColor: 'bg-brand-green/10', hoverBg: 'hover:bg-brand-green/20', title: '纯净一手官方原矿区', desc: '进入原矿搜索引擎', href: '/search?source=official' },
  { emoji: '🏛️', badge: 'VILLAGE DIRECT', badgeColor: 'text-amber-600', bgColor: 'bg-amber-50', hoverBg: 'hover:bg-amber-100', title: '村集体直发专区', desc: '查看所有村委直发', href: '/search?source=village' },
  { emoji: '🏢', badge: 'BULK ROADSHOW', badgeColor: 'text-blue-600', bgColor: 'bg-blue-50', hoverBg: 'hover:bg-blue-100', title: '文旅大宗产业路演带', desc: '进入独立路演大厅', href: '/bulk-projects' },
  { emoji: '🛰️', badge: 'INFRASTRUCTURE', badgeColor: 'text-purple-600', bgColor: 'bg-purple-50', hoverBg: 'hover:bg-purple-100', title: '数字化隐居基建硬指标', desc: '查看全国基建指数大表', href: '/infra-rating' },
  { emoji: '🌾', badge: 'BROKERS', badgeColor: 'text-green-600', bgColor: 'bg-green-50', hoverBg: 'hover:bg-green-100', title: '本地金牌合伙人联播网', desc: '查看全网合伙人名册', href: '/brokers' },
];

export default function HomePage() {
  const [wechatOpen, setWechatOpen] = useState(false);

  return (
    <>
      <Navbar />
      <WeChatModal isOpen={wechatOpen} onClose={() => setWechatOpen(false)} />

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center pt-16 bg-brand-dark">
        <div className="absolute inset-0 hero-gradient"></div>
        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center py-20">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight tracking-tight">
            寻找被低估的<br />
            <span className="text-brand-accent">低密度空间资产</span>
          </h1>
          <p className="text-gray-300 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
            乡村资产数字化绿色流转中枢。全网多源产权低频提纯，一键交叉碰撞，让技术重归山川。
          </p>

          {/* Search */}
          <div className="relative max-w-2xl mx-auto bg-white rounded-2xl shadow-2xl p-2 flex items-center mb-6">
            <div className="flex items-center pl-4 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input type="text" placeholder="搜索区域、资产类型、关键词..." className="flex-1 px-4 py-3 text-gray-700 text-base outline-none bg-transparent" />
            <button className="bg-brand-green hover:bg-brand-light text-white px-6 py-3 rounded-xl font-medium transition-colors">
              智能检索
            </button>
          </div>

          <div className="flex items-center justify-center space-x-2 text-xs text-gray-400 font-mono">
            <span className="inline-block w-2 h-2 bg-green-400 rounded-full pulse-dot"></span>
            <span>全网合规收录: <strong className="text-white">104,281</strong> 宗</span>
            <span className="text-gray-600">|</span>
            <span>今日村委直营/官源提纯上新: <strong className="text-green-400">142</strong> 宗</span>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent"></div>
      </section>

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
          {HOT_ASSETS.map((asset) => (
            <AssetCard key={asset.rank} {...asset} />
          ))}
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: '2026 实时指数', title: '浙江流转均价', value: '¥14.2', unit: '万/年', change: '↑ +4.2%', changeColor: 'text-green-500' },
              { label: '2026 实时指数', title: '四川流转均价', value: '¥7.8', unit: '万/年', change: '↑ +1.8%', changeColor: 'text-green-500' },
              { label: '供需指标', title: '全网潜在买卖比', value: '1.48', unit: ': 1', change: '⚠ 供不应求', changeColor: 'text-orange-500' },
              { label: '散户指标', title: '散户溢价空间', value: '-12.4', unit: '%', change: '💡 砍价空间大', changeColor: 'text-blue-500' },
            ].map((m, i) => (
              <div key={i} className="bg-white rounded-xl p-5 border border-gray-100 card-hover">
                <div className="text-xs text-gray-500 mb-1">{m.label}</div>
                <div className="text-xl font-bold text-brand-green">{m.title}</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  {m.value}<span className="text-sm font-normal text-gray-500">{m.unit}</span>
                </div>
                <div className={`text-sm mt-1 ${m.changeColor}`}>{m.change}</div>
              </div>
            ))}
          </div>

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
                  {MARKET_DATA.map((row) => (
                    <tr key={row.province} className="hover:bg-gray-50/50 transition-colors">
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
                      <td className="px-6 py-4 font-bold text-gray-900">{row.price}</td>
                      <td className="px-6 py-4"><span className={`font-medium ${row.changeColor}`}>{row.change}</span></td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-gray-100 rounded-full h-2 max-w-[100px]">
                            <div className={`${row.barColor} h-2 rounded-full`} style={{ width: row.barWidth }}></div>
                          </div>
                          <span className={`${row.bargainColor} text-xs font-medium`}>{row.bargain} ({row.note})</span>
                        </div>
                      </td>
                    </tr>
                  ))}
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

      <Footer />
    </>
  );
}
