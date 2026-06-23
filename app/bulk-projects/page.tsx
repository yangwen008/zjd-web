import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const PROJECTS = [
  { title: '青城山康养综合体项目', location: '四川省 · 都江堰市', area: '280 亩', price: '¥180万', lease: '20年', badge: '🏛️ 村委直营', badgeColor: 'bg-yellow-500', gradient: 'from-brand-dark to-brand-green',承接: '康养文旅集团', views: 4210 },
  { title: '苍洱片区古村落群整体活化', location: '云南省 · 大理市', area: '560 亩', price: '¥320万', lease: '30年', badge: '⚖️ 官方原矿', badgeColor: 'bg-blue-500', gradient: 'from-teal-800 to-teal-600', 承接: '云南省文旅投', views: 3890 },
];

export default function BulkProjectsPage() {
  return (
    <>
      <Navbar />
      <main className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-2xl">🏢</span>
              <h1 className="text-3xl font-bold text-gray-900">大宗文旅项目及招商引资路演厅</h1>
            </div>
            <p className="text-gray-500">集约化、无历史产权争议的集体闲置资产，专供大B端连锁品牌、高资本康养集团。</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {PROJECTS.map((p, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden card-hover">
                <div className={`h-48 bg-gradient-to-br ${p.gradient} relative`}>
                  <div className={`absolute top-4 left-4 ${p.badge} text-white text-xs font-bold px-3 py-1 rounded-lg`}>
                    {p.badge}
                  </div>
                  <div className="absolute bottom-4 left-4 text-white">
                    <div className="text-xs opacity-80">{p.location}</div>
                    <div className="text-xl font-bold">{p.title}</div>
                  </div>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-3 gap-4 text-center mb-4">
                    <div>
                      <div className="text-xs text-gray-400">总面积</div>
                      <div className="font-bold text-gray-900">{p.area}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">年租金</div>
                      <div className="font-bold text-brand-green">{p.price}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">流转期限</div>
                      <div className="font-bold text-gray-900">{p.lease}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-50">
                    <span>已承接: {p.承接}</span>
                    <span>{p.views.toLocaleString()} 次浏览</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
