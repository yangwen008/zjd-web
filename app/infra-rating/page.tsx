export const runtime = 'edge';
export const revalidate = 300;

import Link from 'next/link';
import { getInfraRatings, getHomepageConfig } from '@/lib/data';

function getSignalColor(ms: number): string {
  if (ms <= 20) return 'text-green-500';
  if (ms <= 40) return 'text-yellow-500';
  return 'text-red-500';
}

function getHospitalColor(min: number): string {
  if (min <= 15) return 'text-green-500';
  if (min <= 30) return 'text-yellow-500';
  return 'text-red-500';
}

function getGridColor(pct: number): string {
  if (pct >= 95) return 'text-green-500';
  if (pct >= 90) return 'text-green-500';
  if (pct >= 85) return 'text-yellow-500';
  return 'text-red-500';
}

function getGradeBg(grade: string): string {
  if (grade.startsWith('S')) return 'bg-green-100 text-green-700';
  if (grade.startsWith('A')) return 'bg-yellow-100 text-yellow-700';
  return 'bg-gray-100 text-gray-700';
}

function getRankDisplay(rank: number): string {
  if (rank === 1) return '🥇 1';
  if (rank === 2) return '🥈 2';
  if (rank === 3) return '🥉 3';
  return String(rank);
}

function getRankColor(rank: number): string {
  if (rank === 1) return 'text-yellow-500';
  if (rank === 2) return 'text-gray-400';
  if (rank === 3) return 'text-orange-500';
  return 'text-gray-400';
}

export default async function InfraRatingPage() {
  const [ratings, config] = await Promise.all([
    getInfraRatings().catch(() => []),
    getHomepageConfig().catch(() => ({})),
  ]);

  return (
    <>
    
      <main className="pt-20 pb-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-2xl">🛰️</span>
              <h1 className="text-xl md:text-3xl font-bold text-gray-900">全国乡村新基建硬核指标排行榜</h1>
            </div>
            <p className="text-gray-500">覆盖 5G 基站抖动、新能源快充覆盖、电网冗余度，专为数字游民及投资企业提供防断电断网客观指南。</p>
          </div>

          {/* 桌面端：表格 */}
          <div className="hidden md:block bg-white rounded-xl border border-gray-100 overflow-hidden">
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
                  {ratings.length > 0 ? ratings.map((r, i) => (
                    <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className={`font-bold ${getRankColor(i + 1)}`}>{getRankDisplay(i + 1)}</span>
                      </td>
                      <td className="px-6 py-4"><Link href={`/infra-rating/${r.id}`} className="font-medium text-gray-900 hover:text-brand-green transition-colors">{r.region}</Link></td>
                      <td className="px-6 py-4"><span className={getSignalColor(r.signal_5g_ms)}>{r.signal_5g_ms}ms</span></td>
                      <td className="px-6 py-4"><span className={getHospitalColor(r.hospital_min)}>{r.hospital_min}分钟</span></td>
                      <td className="px-6 py-4"><span className={getGridColor(r.grid_redundancy)}>{r.grid_redundancy}%</span></td>
                      <td className="px-6 py-4"><span className={`${getGradeBg(r.overall_grade)} px-2 py-0.5 rounded text-xs font-bold`}>{r.overall_grade}</span></td>
                    </tr>
                  )) : (
                    <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">暂无基建数据</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 移动端：卡片 */}
          <div className="md:hidden space-y-3">
            {ratings.length > 0 ? ratings.map((r, i) => (
              <Link key={r.id} href={`/infra-rating/${r.id}`} className="block bg-white rounded-xl border border-gray-100 p-4 hover:border-brand-green/30 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`font-bold text-lg ${getRankColor(i + 1)}`}>{getRankDisplay(i + 1)}</span>
                    <span className="font-bold text-gray-900">{r.region}</span>
                  </div>
                  <span className={`${getGradeBg(r.overall_grade)} px-2 py-0.5 rounded text-xs font-bold`}>{r.overall_grade}</span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-gray-50 rounded-lg p-2">
                    <div className="text-xs text-gray-400">5G延迟</div>
                    <div className={`text-sm font-bold ${getSignalColor(r.signal_5g_ms)}`}>{r.signal_5g_ms}ms</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <div className="text-xs text-gray-400">医院车程</div>
                    <div className={`text-sm font-bold ${getHospitalColor(r.hospital_min)}`}>{r.hospital_min}分钟</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <div className="text-xs text-gray-400">电网冗余</div>
                    <div className={`text-sm font-bold ${getGridColor(r.grid_redundancy)}`}>{r.grid_redundancy}%</div>
                  </div>
                </div>
              </Link>
            )) : (
              <div className="text-center py-12 text-gray-400">暂无基建数据</div>
            )}
          </div>
        </div>
      </main>
      
    </>
  );
}
