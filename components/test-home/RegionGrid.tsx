import Link from "next/link";

// components/test-home/RegionGrid.tsx

interface Region {
  id: string;
  rank: number;
  name: string;
  subtitle: string;
  views: number;
  imageUrl: string;
}

interface RegionGridProps {
  regions?: Region[];
  title?: string;
  subtitle?: string;
}

export default function RegionGrid({ regions = [], title, subtitle }: RegionGridProps) {
  // 如果没有数据，显示默认占位
  const displayRegions = regions.length > 0 ? regions : [
    { id: "1", rank: 1, name: "杭州·安吉园", subtitle: "溪畔宅基地原矿", views: 11420, imageUrl: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=600&h=400&fit=crop" },
    { id: "2", rank: 2, name: "成都·都江堰青城山", subtitle: "林地茶场", views: 17120, imageUrl: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&h=400&fit=crop" },
    { id: "3", rank: 3, name: "大理·苍洱园", subtitle: "传统完好白族老宅", views: 12400, imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop" },
    { id: "4", rank: 4, name: "丽水·缙云园", subtitle: "景区旁极客石头房", views: 9450, imageUrl: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600&h=400&fit=crop" },
    { id: "5", rank: 5, name: "桂林·阳朔园", subtitle: "临江峰林院落", views: 8900, imageUrl: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&h=400&fit=crop" },
    { id: "6", rank: 6, name: "北京·延庆园", subtitle: "长城脚下北方老院", views: 6610, imageUrl: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600&h=400&fit=crop" },
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔥</span>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{title || '核心地点寻源区'}</h2>
              <p className="hidden md:block text-sm text-gray-500">{subtitle || '默认按本站最热点击量、收藏量降序排列'}</p>
            </div>
          </div>
          
          {/* 【修复点】：将 <a href="#"> 改为 Next.js 的 <Link href="/regions">，并统一品牌绿色 */}
          <Link href="/regions" className="text-sm text-[#2C4C3B] font-bold hover:underline">
            查看本站热度排行 →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayRegions.map((region) => (
            <Link key={region.id} href={`/asset/${region.id}`} className="group relative rounded-2xl overflow-hidden card-hover cursor-pointer block">
              <img src={region.imageUrl} alt={region.name} className="w-full h-64 object-cover image-zoom pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white pointer-events-none">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-green-500 px-2 py-0.5 rounded text-xs font-medium">{region.views.toLocaleString()} 次浏览</span>
                  <span className="bg-blue-500 px-2 py-0.5 rounded text-xs font-medium">决选量</span>
                </div>
                <h3 className="text-lg font-semibold">{region.name}（{region.subtitle}）</h3>
              </div>
              {/* 顺便把这里的颜色也统一为品牌绿 */}
              <div className="absolute top-4 left-4 bg-[#2C4C3B] px-2 py-1 rounded text-xs font-bold text-white pointer-events-none">#{region.rank} 热度</div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
