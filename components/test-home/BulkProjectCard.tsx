interface BulkProjectCardData {
  id: string;
  code: string;
  title: string;
  description: string;
  area: string;
  yieldRate: string;
  price: string;
  hasCertificate: boolean;
}

export default function BulkProjectCard({ project }: { project: BulkProjectCardData }) {
  return (
    <div className="group bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-200 p-6 card-hover">
      <div className="mb-4">
        <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium inline-block mb-2">{project.code}</div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">{project.title}</h3>
        <p className="text-sm text-gray-600 line-clamp-2">{project.description}</p>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="text-xs text-gray-500 mb-1">单体占地面积</div>
          <div className="font-semibold text-gray-900">{project.area}</div>
        </div>
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="text-xs text-gray-500 mb-1">年收益率交叉</div>
          <div className="font-semibold text-green-600">{project.yieldRate}</div>
        </div>
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="text-xs text-gray-500 mb-1">30年确权使用书</div>
          <div className="font-semibold text-gray-900">{project.hasCertificate ? '✓' : '-'}</div>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="text-2xl font-bold text-gray-900">{project.price}</div>
        <span className="bg-[#1a4731] group-hover:bg-[#2d5a45] text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors inline-block">申请解密尽调案 →</span>
      </div>
    </div>
  );
}
