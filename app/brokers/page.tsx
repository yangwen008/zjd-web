import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const BROKERS = [
  { name: '张大山', region: '浙江安吉', shows: 128, rate: 98, rating: 'gold', emoji: '👨‍🌾' },
  { name: '李秀英', region: '四川都江堰', shows: 86, rate: 95, rating: 'silver', emoji: '👩‍🌾' },
  { name: '王铁柱', region: '云南大理', shows: 64, rate: 97, rating: 'silver', emoji: '🧑‍🌾' },
  { name: '赵翠花', region: '丽水缙云', shows: 52, rate: 96, rating: 'bronze', emoji: '👩‍🌾' },
  { name: '刘大牛', region: '桂林阳朔', shows: 45, rate: 94, rating: 'bronze', emoji: '👨‍🌾' },
];

export default function BrokersPage() {
  return (
    <>
      <Navbar />
      <main className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-2xl">🌾</span>
              <h1 className="text-3xl font-bold text-gray-900">全国核验实名&ldquo;农房合伙人&rdquo;名录墙</h1>
            </div>
            <p className="text-gray-500">通过地面合伙人陪同签约、法务鉴证，打通乡村房产流转最后一公里。</p>
          </div>

          <div className="space-y-4">
            {BROKERS.map((b) => (
              <div key={b.name} className="bg-white rounded-xl p-5 border border-gray-100 flex items-center space-x-5 card-hover">
                <div className="w-14 h-14 rounded-full bg-brand-green/10 flex items-center justify-center text-2xl">{b.emoji}</div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-bold text-gray-900 text-lg">{b.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      b.rating === 'gold' ? 'bg-yellow-100 text-yellow-700' :
                      b.rating === 'silver' ? 'bg-gray-100 text-gray-600' :
                      'bg-orange-50 text-orange-600'
                    }`}>
                      {b.rating === 'gold' ? '⭐ 金牌合伙人' : '认证合伙人'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {b.region} · 带看 {b.shows} 次 · 好评率 {b.rate}%
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-brand-green">扫码解锁</div>
                  <div className="text-xs text-gray-400">联系方式</div>
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
