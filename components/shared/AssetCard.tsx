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
  certification?: string;
}

const CERT_LABELS: Record<string, { label: string; className: string }> = {
  certified: { label: '✅ 已确权', className: 'bg-green-500/90 text-white' },
  pending: { label: '⏳ 待确权', className: 'bg-yellow-500/90 text-white' },
  uncertified: { label: '未确权', className: 'bg-gray-500/70 text-white' },
};

export default function AssetCard({ rank, title, subtitle, views, price, gradient, imageUrl, href, badge, certification }: AssetCardProps) {
  const Wrapper = href ? 'a' : 'div';
  const wrapperProps = href ? { href } : {};
  const cert = CERT_LABELS[certification || 'uncertified'] || CERT_LABELS.uncertified;

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

      {/* 左上角：来源标签 + 确权标签 */}
      <div className="absolute top-4 left-4 z-10 flex items-center space-x-2">
        {badge && (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-brand-green text-white shadow-lg">
            {badge}
          </span>
        )}
        <span className={`inline-flex items-center px-2 py-1 rounded-lg text-[11px] font-medium ${cert.className} shadow`}>
          {cert.label}
        </span>
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
