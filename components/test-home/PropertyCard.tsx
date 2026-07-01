import { Property } from "@/lib/test-home-data";

const CERT_LABELS: Record<string, { label: string; className: string }> = {
  certified: { label: '✅ 已确权', className: 'bg-green-500 text-white' },
  pending: { label: '⏳ 待确权', className: 'bg-yellow-500 text-white' },
  uncertified: { label: '未确权', className: 'bg-gray-500 text-white' },
};

export default function PropertyCard({ property }: { property: Property }) {
  const cert = CERT_LABELS[property.certification || 'uncertified'] || CERT_LABELS.uncertified;

  return (
    <div className="group bg-white rounded-2xl border border-gray-200 overflow-hidden card-hover">
      <div className="relative">
        <img src={property.imageUrl} alt={property.title} className="w-full h-48 object-cover image-zoom" />
        <div className="absolute top-3 left-3 flex items-center space-x-2">
          <span className="bg-[#1a4731] px-2 py-1 rounded text-xs font-medium text-white">{property.badge}</span>
          <span className={`px-2 py-1 rounded text-[11px] font-medium ${cert.className}`}>{cert.label}</span>
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-semibold text-gray-900 mb-2">{property.title}</h3>
        <div className="text-sm text-gray-500 mb-4">流转性质：{property.type}</div>
        <div className="text-xs text-gray-400 mb-4">基地基准挂牌单价</div>
        <div className="flex items-center justify-between">
          <div className="text-xl font-bold text-gray-900">{property.price}/{property.priceUnit}</div>
          <span className="bg-[#1a4731] group-hover:bg-[#2d5a45] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors inline-block">一键尽调大厅 →</span>
        </div>
      </div>
    </div>
  );
}
