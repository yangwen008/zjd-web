interface AssetCardProps {
  rank: number;
  title: string;
  subtitle: string;
  views: number;
  price: string;
  gradient: string;
  imageUrl?: string;
  href?: string;
  badge?: string;
}

export default function AssetCard({ rank, title, subtitle, views, price, gradient, imageUrl, href, badge }: AssetCardProps) {
  const Wrapper = href ? 'a' : 'div';
  const wrapperProps = href ? { href } : {};

  return (
    <Wrapper
      {...wrapperProps}
      className="group relative h-52 rounded-2xl overflow-hidden card-hover cursor-pointer block"
    >
      {/* 背景：优先图片，fallback渐变 */}
      {imageUrl ? (
        <img src={imageUrl} alt={title} className="absolute inset-0 w-full h-full object-cover image-zoom" />
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`}></div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

      {/* 左上角标签 */}
      <div className="absolute top-4 left-4 z-10 flex items-center space-x-2">
        {badge ? (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-brand-green text-white shadow-lg">
            {badge}
          </span>
        ) : (
          rank <= 3 && (
            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${
              rank === 1 ? 'bg-yellow-500' : rank === 2 ? 'bg-gray-400' : 'bg-orange-700'
            } text-white shadow-lg`}>
              {rank === 1 ? '🥇 TOP 1' : rank === 2 ? '🥈 TOP 2' : '🥉 TOP 3'}
            </span>
          )
        )}
      </div>

      {/* 底部信息 */}
      <div className="absolute bottom-0 inset-x-0 p-5 text-white">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold text-lg">{title}</h3>
          <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{subtitle}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-300">{views.toLocaleString()} 次浏览</span>
          <span className="text-yellow-400 font-bold">{price}</span>
        </div>
      </div>
    </Wrapper>
  );
}
