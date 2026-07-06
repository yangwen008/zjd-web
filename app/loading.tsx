/**
 * 首页加载骨架屏
 * Next.js 自动在 SSR 期间显示此组件
 */
export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero 骨架 */}
      <div className="bg-gradient-to-b from-[#1a4731] to-[#2d5a45] py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="animate-pulse">
            <div className="h-10 bg-white/20 rounded w-96 mx-auto mb-4" />
            <div className="h-6 bg-white/20 rounded w-64 mx-auto mb-8" />
            <div className="h-12 bg-white/20 rounded-full w-full max-w-xl mx-auto" />
          </div>
        </div>
      </div>

      {/* 板块骨架 */}
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="animate-pulse mb-8">
              <div className="h-6 bg-gray-200 rounded w-48" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="bg-gray-100 rounded-xl overflow-hidden">
                  <div className="h-48 bg-gray-200 animate-pulse" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                    <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
                    <div className="h-5 bg-gray-200 rounded w-1/3 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
