import { mockRegions } from "@/lib/test-home-data";

export default function RegionGrid() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔥</span>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">核心地点寻源区</h2>
              <p className="text-sm text-gray-500">默认按本站最热点击量、收藏量降序排列</p>
            </div>
          </div>
          <a href="#" className="text-sm text-[#1a4731] hover:underline">查看本站热度排行 →</a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockRegions.map((region) => (
            <div key={region.id} className="group relative rounded-2xl overflow-hidden card-hover cursor-pointer">
              <img src={region.imageUrl} alt={region.name} className="w-full h-64 object-cover image-zoom" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-green-500 px-2 py-0.5 rounded text-xs font-medium">{region.views.toLocaleString()} 次浏览</span>
                  <span className="bg-blue-500 px-2 py-0.5 rounded text-xs font-medium">决选量</span>
                </div>
                <h3 className="text-lg font-semibold">{region.name}（{region.subtitle}）</h3>
              </div>
              <div className="absolute top-4 left-4 bg-[#1a4731] px-2 py-1 rounded text-xs font-bold text-white">#{region.rank} 热度</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}