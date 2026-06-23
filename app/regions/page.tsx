import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import AssetCard from '@/components/shared/AssetCard';

const HOT_ASSETS = [
  { rank: 1, title: '杭州·安吉圈', subtitle: '溪畔宅基地原矿', views: 18420, price: '¥12.8万/年起', gradient: 'from-emerald-800 to-emerald-600' },
  { rank: 2, title: '成都·都江堰', subtitle: '青城山林地茶场', views: 17120, price: '¥6.5万/年起', gradient: 'from-teal-800 to-teal-600' },
  { rank: 3, title: '大理·苍洱圈', subtitle: '传统完好白族老宅', views: 12480, price: '¥3.2万/年起', gradient: 'from-cyan-800 to-cyan-600' },
  { rank: 4, title: '丽水·缙云圈', subtitle: '景区旁极客石头房', views: 9430, price: '¥5.8万/年起', gradient: 'from-green-800 to-green-600' },
  { rank: 5, title: '桂林·阳朔圈', subtitle: '临江峰林院落', views: 8940, price: '¥4.2万/年起', gradient: 'from-lime-800 to-lime-600' },
  { rank: 6, title: '北京·延庆圈', subtitle: '长城脚下北方老院', views: 6510, price: '¥9.6万/年起', gradient: 'from-stone-800 to-stone-600' },
  { rank: 7, title: '杭州·千岛湖', subtitle: '湖畔独栋老宅', views: 5820, price: '¥8.2万/年起', gradient: 'from-sky-800 to-sky-600' },
  { rank: 8, title: '丽江·束河', subtitle: '纳西族古院落', views: 5210, price: '¥4.8万/年起', gradient: 'from-rose-800 to-rose-600' },
  { rank: 9, title: '恩施·利川', subtitle: '避暑山村民宿', views: 4680, price: '¥2.8万/年起', gradient: 'from-indigo-800 to-indigo-600' },
];

export default function RegionsPage() {
  return (
    <>
      <Navbar />
      <main className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">🔥 热点寻源大厅</h1>
            <p className="text-gray-500">实时观测全网投资商、买家的点击行为，按访问量自动加权降序推荐。</p>
            <div className="mt-4 flex items-center space-x-4 text-sm">
              <span className="text-gray-400">今日总累积浏览: <strong className="text-gray-900">142,910</strong> Clicks</span>
              <button className="px-3 py-1 rounded-full bg-brand-green text-white text-xs">🔥 按点击量 ⬇️</button>
              <button className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs hover:bg-gray-200">💰 按起价 ⬆️</button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {HOT_ASSETS.map((asset) => (
              <AssetCard key={asset.rank} {...asset} />
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
