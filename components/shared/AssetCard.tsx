interface AssetCardProps {
  rank: number;
  title: string;
  subtitle: string;
  views: number;
  price: string;
  gradient: string;
  href?: string;
}

export default function AssetCard({ rank, title, subtitle, views, price, gradient, href }: AssetCardProps) {
  const getBadge = () => {
    if (rank === 1) return { bg: 'bg-yellow-500', text: '🥇 TOP 1' };
    if (rank === 2) return { bg: 'bg-gray-400', text: '🥈 TOP 2' };
    if (rank === 3) return { bg: 'bg-orange-700', text: '🥉 TOP 3' };
    return { bg: 'bg-white/20', text: `TOP ${rank}` };
  };

  const badge = getBadge();
  const Wrapper = href ? 'a' : 'div';
  const wrapperProps = href ? { href } : {};

  return (
    <Wrapper
      {...wrapperProps}
      className="group relative h-52 rounded-2xl overflow-hidden card-hover cursor-pointer block"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`}></div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

      <div className="absolute top-4 left-4 z-10">
        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${badge.bg} text-white shadow-lg`}>
          {badge.text}
        </span>
      </div>

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
