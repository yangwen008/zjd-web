import { Broker } from "@/lib/test-home-data";

export default function BrokerCard({ broker }: { broker: Broker }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 card-hover">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gray-300 overflow-hidden">
            <img src={broker.avatarUrl} alt={broker.name} className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="font-semibold text-gray-900">{broker.name}</div>
            <div className="text-xs text-gray-500">{broker.region}</div>
          </div>
        </div>
        <div className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">合规实名见证</div>
      </div>
      <div className="space-y-1 text-sm mb-4">
        <div className="flex justify-between"><span className="text-gray-500">地图见证约谈率：</span><span className="font-medium">{broker.successRate}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">村集体直签线索数：</span><span className="font-medium">{broker.leads}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">地推工作电话：</span><span className="font-medium text-gray-400">{broker.phone}</span></div>
      </div>
      <button className="w-full border border-[#1a4731] text-[#1a4731] hover:bg-[#1a4731] hover:text-white py-2 rounded-lg text-sm font-medium transition-colors">查阅其管辖的样板资产 →</button>
    </div>
  );
}