// components/test-home/MarketStats.tsx

interface MarketDataItem {
  province: string;
  median_price: number;
  change_pct: number;
  bargain_space?: number;
  total_listings?: number;
}

interface MarketStatsProps {
  marketData?: MarketDataItem[];
}

export default function MarketStats({ marketData = [] }: MarketStatsProps) {
  // 如果没有数据，显示默认占位
  const displayData = marketData.length > 0 ? marketData : [
    { province: "浙江省", median_price: 14.2, change_pct: 4.2 },
    { province: "四川省", median_price: 7.48, change_pct: 1.8 },
  ];

  const stats = [
    { 
      label: "浙江流转均价", 
      value: `¥${displayData[0]?.median_price || 14.2}万/年`, 
      change: `+${displayData[0]?.change_pct || 4.2}%`, 
      color: "text-green-600" 
    },
    { 
      label: "四川流转均价", 
      value: `¥${displayData[1]?.median_price || 7.48}万/年`, 
      change: `+${displayData[1]?.change_pct || 1.8}%`, 
      color: "text-green-600" 
    },
    { 
      label: "全网潜在买卖比", 
      value: "1.48 : 1", 
      change: "供不应求", 
      color: "text-red-600" 
    },
    { 
      label: "散户溢价空间", 
      value: "-12.4%", 
      change: "砍价空间大", 
      color: "text-orange-600" 
    },
  ];

  return (
    <section className="py-12 bg-gray-50 border-y border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-[#1a4731]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
            <span className="text-sm font-medium text-gray-700">首页数据概醒目 · 点击进入二级独立行情数据终端 →</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="bg-gray-200 px-2 py-1 rounded">2026</span>
            <span>实时刷新</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl p-4 shadow-sm">
              <div className="text-sm text-gray-600 mb-1">{stat.label}</div>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className={`text-sm mt-1 font-medium ${stat.color}`}>{stat.change}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
