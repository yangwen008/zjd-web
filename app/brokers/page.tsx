import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { getBrokers, getHomepageConfig } from '@/lib/data';

const RATING_STYLES: Record<string, { label: string; className: string }> = {
  gold: { label: '⭐ 金牌合伙人', className: 'bg-yellow-100 text-yellow-700' },
  silver: { label: '认证合伙人', className: 'bg-gray-100 text-gray-600' },
  bronze: { label: '认证合伙人', className: 'bg-orange-50 text-orange-600' },
};

export default async function BrokersPage() {
  const [brokers, config] = await Promise.all([
    getBrokers().catch(() => []),
    getHomepageConfig().catch(() => ({})),
  ]);

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
            {brokers.length > 0 ? brokers.map((b) => {
              const ratingStyle = RATING_STYLES[b.rating] || RATING_STYLES.bronze;
              return (
                <div key={b.id} className="bg-white rounded-xl p-5 border border-gray-100 flex items-center space-x-5 card-hover">
                  <div className="w-14 h-14 rounded-full bg-brand-green/10 flex items-center justify-center text-2xl">
                    {b.avatar_url ? (
                      <img src={b.avatar_url} alt={b.name} className="w-14 h-14 rounded-full object-cover" />
                    ) : '👨‍🌾'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-bold text-gray-900 text-lg">{b.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${ratingStyle.className}`}>
                        {ratingStyle.label}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {b.region} · 带看 {b.show_count} 次 · 好评率 {b.good_rate}%
                    </div>
                    {b.bio && <div className="text-xs text-gray-400 mt-1">{b.bio}</div>}
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-brand-green">扫码解锁</div>
                    <div className="text-xs text-gray-400">联系方式</div>
                  </div>
                </div>
              );
            }) : (
              <div className="text-center py-16 text-gray-400">
                <div className="text-5xl mb-4">🌾</div>
                <p className="text-lg">暂无合伙人数据</p>
                <p className="text-sm mt-2">请先执行 npm run db:seed 导入种子数据</p>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer config={config} />
    </>
  );
}
