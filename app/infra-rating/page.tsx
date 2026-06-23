import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const RATINGS = [
  { rank: 1, region: '杭州·安吉', signal: '12ms', signalColor: 'text-green-500', hospital: '8分钟', hospitalColor: 'text-green-500', grid: '98%', gridColor: 'text-green-500', grade: 'S+', gradeBg: 'bg-green-100 text-green-700' },
  { rank: 2, region: '成都·都江堰', signal: '18ms', signalColor: 'text-green-500', hospital: '12分钟', hospitalColor: 'text-green-500', grid: '95%', gridColor: 'text-green-500', grade: 'S', gradeBg: 'bg-green-100 text-green-700' },
  { rank: 3, region: '大理·苍洱', signal: '35ms', signalColor: 'text-yellow-500', hospital: '25分钟', hospitalColor: 'text-yellow-500', grid: '92%', gridColor: 'text-green-500', grade: 'A+', gradeBg: 'bg-yellow-100 text-yellow-700' },
  { rank: 4, region: '丽水·缙云', signal: '42ms', signalColor: 'text-yellow-500', hospital: '30分钟', hospitalColor: 'text-yellow-500', grid: '88%', gridColor: 'text-yellow-500', grade: 'A', gradeBg: 'bg-yellow-100 text-yellow-700' },
  { rank: 5, region: '桂林·阳朔', signal: '48ms', signalColor: 'text-yellow-500', hospital: '35分钟', hospitalColor: 'text-yellow-500', grid: '85%', gridColor: 'text-yellow-500', grade: 'A-', gradeBg: 'bg-yellow-100 text-yellow-700' },
  { rank: 6, region: '北京·延庆', signal: '15ms', signalColor: 'text-green-500', hospital: '10分钟', hospitalColor: 'text-green-500', grid: '96%', gridColor: 'text-green-500', grade: 'S', gradeBg: 'bg-green-100 text-green-700' },
];

export default function InfraRatingPage() {
  return (
    <>
      <Navbar />
      <main className="pt-20 pb-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-2xl">🛰️</span>
              <h1 className="text-3xl font-bold text-gray-900">全国乡村新基建硬核指标排行榜</h1>
            </div>
            <p className="text-gray-500">覆盖 5G 基站抖动、新能源快充覆盖、电网冗余度，专为数字游民及投资企业提供防断电断网客观指南。</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-6 py-3 font-medium text-gray-500">排名</th>
                    <th className="px-6 py-3 font-medium text-gray-500">片区</th>
                    <th className="px-6 py-3 font-medium text-gray-500">5G延迟</th>
                    <th className="px-6 py-3 font-medium text-gray-500">医院车程</th>
                    <th className="px-6 py-3 font-medium text-gray-500">电网冗余</th>
                    <th className="px-6 py-3 font-medium text-gray-500">综合评分</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {RATINGS.map((r) => (
                    <tr key={r.rank} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className={`font-bold ${r.rank <= 3 ? (r.rank === 1 ? 'text-yellow-500' : r.rank === 2 ? 'text-gray-400' : 'text-orange-500') : 'text-gray-400'}`}>
                          {r.rank === 1 ? '🥇 1' : r.rank === 2 ? '🥈 2' : r.rank === 3 ? '🥉 3' : r.rank}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">{r.region}</td>
                      <td className="px-6 py-4"><span className={r.signalColor}>{r.signal}</span></td>
                      <td className="px-6 py-4"><span className={r.hospitalColor}>{r.hospital}</span></td>
                      <td className="px-6 py-4"><span className={r.gridColor}>{r.grid}</span></td>
                      <td className="px-6 py-4"><span className={`${r.gradeBg} px-2 py-0.5 rounded text-xs font-bold`}>{r.grade}</span></td>
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
