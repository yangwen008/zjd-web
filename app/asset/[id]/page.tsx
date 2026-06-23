import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function AssetDetailPage({ params }: { params: { id: string } }) {
  // 模拟数据 - 实际从D1读取
  const asset = {
    id: params.id,
    title: '杭州·安吉溪畔宅基地',
    location: '浙江省湖州市安吉县溪龙乡',
    area: '3.2 亩',
    price: '12.8 万/年',
    lease: '20年',
    type: '宅基地',
    source: '官方原矿',
    views: 18420,
  };

  return (
    <>
      <Navbar />
      <main className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="text-sm text-gray-400 mb-6">
            <a href="/" className="hover:text-brand-green">首页</a>
            <span className="mx-2">/</span>
            <a href="/search" className="hover:text-brand-green">搜索</a>
            <span className="mx-2">/</span>
            <span className="text-gray-700">{asset.title}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Image gallery placeholder */}
              <div className="bg-gray-100 rounded-2xl h-80 flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <div className="text-5xl mb-2">🏔️</div>
                  <div>4K 航拍模拟器</div>
                  <div className="text-xs mt-1">实际部署后展示实景图片</div>
                </div>
              </div>

              {/* Title */}
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-xs bg-brand-green text-white px-2 py-0.5 rounded">{asset.source}</span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{asset.type}</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">{asset.title}</h1>
                <p className="text-gray-500 mt-1">{asset.location}</p>
              </div>

              {/* Key metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: '每年首付流转价', value: asset.price, color: 'text-brand-green' },
                  { label: '最长流转期限', value: asset.lease, color: 'text-gray-900' },
                  { label: '地块面积', value: asset.area, color: 'text-gray-900' },
                  { label: '浏览量', value: asset.views.toLocaleString(), color: 'text-gray-500' },
                ].map((m) => (
                  <div key={m.label} className="bg-gray-50 rounded-xl p-4 text-center">
                    <div className="text-xs text-gray-400 mb-1">{m.label}</div>
                    <div className={`text-lg font-bold ${m.color}`}>{m.value}</div>
                  </div>
                ))}
              </div>

              {/* Infrastructure details */}
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h2 className="font-bold text-gray-900 mb-4">基础设施配套明细</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { icon: '⚡', label: '通电', status: '已通' },
                    { icon: '💧', label: '自来水', status: '已通' },
                    { icon: '📶', label: '网络', status: '5G覆盖' },
                    { icon: '🚽', label: '污水化粪池', status: '已建' },
                    { icon: '🛣️', label: '自建路', status: '已硬化' },
                    { icon: '🏗️', label: '容积率', status: '≤1.5' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <span className="text-xl">{item.icon}</span>
                      <div>
                        <div className="text-xs text-gray-400">{item.label}</div>
                        <div className="text-sm font-medium text-gray-900">{item.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Environment */}
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h2 className="font-bold text-gray-900 mb-4">环境与产业集群</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: '舒适度', value: '±1级', icon: '🌡️' },
                    { label: '空气质量', value: '51-100(良)', icon: '🌬️' },
                    { label: '水质', value: 'II类', icon: '💧' },
                    { label: '噪声指数', value: '20-40 dB', icon: '🔇' },
                  ].map((e) => (
                    <div key={e.label} className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl mb-1">{e.icon}</div>
                      <div className="text-xs text-gray-400">{e.label}</div>
                      <div className="text-sm font-bold text-gray-900">{e.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Contact card */}
              <div className="bg-white rounded-xl border border-gray-100 p-6 sticky top-24">
                <div className="text-center mb-4">
                  <div className="text-3xl mb-2">🔐</div>
                  <div className="font-bold text-gray-900">产权联系经办</div>
                  <div className="text-sm text-gray-500 mt-1">直连咨询热线</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center mb-4">
                  <div className="text-2xl font-bold text-gray-300 tracking-widest">136****8899</div>
                  <div className="text-xs text-gray-400 mt-1">微信一键安全授权解锁</div>
                </div>
                <button className="w-full bg-brand-green hover:bg-brand-light text-white py-3 rounded-xl font-medium transition-colors">
                  微信一键安全授权解锁真实电话
                </button>
                <div className="mt-4 text-xs text-gray-400 text-center">
                  地块边界GIS坐标: 已加密
                </div>
              </div>

              {/* Similar assets */}
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h3 className="font-bold text-gray-900 mb-3">相似推荐</h3>
                <div className="space-y-3">
                  {['成都·都江堰林地', '大理·苍洱白族老宅', '丽水·缙云石头房'].map((name) => (
                    <div key={name} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-lg">🏘️</div>
                      <div className="text-sm font-medium text-gray-700">{name}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
