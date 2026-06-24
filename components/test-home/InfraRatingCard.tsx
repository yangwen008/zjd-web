import { InfraRating } from "@/lib/test-home-data";

export default function InfraRatingCard({ infra }: { infra: InfraRating }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 card-hover">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">{infra.region}</h3>
        <div className="bg-green-100 text-green-700 px-2 py-1 rounded text-sm font-bold">{infra.score}</div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm"><span className="text-gray-500">数字千兆通达：</span><span className="font-medium text-gray-900">{infra.internet}</span></div>
        <div className="flex justify-between text-sm"><span className="text-gray-500">紧急医疗响应：</span><span className="font-medium text-gray-900">{infra.medical}</span></div>
        <div className="flex justify-between text-sm"><span className="text-gray-500">供电冗余备份：</span><span className="font-medium text-gray-900">{infra.power}</span></div>
      </div>
      <button className="w-full bg-[#1a4731] hover:bg-[#2d5a45] text-white py-2 rounded-lg text-sm font-medium transition-colors">一键下钻算详情 →</button>
    </div>
  );
}