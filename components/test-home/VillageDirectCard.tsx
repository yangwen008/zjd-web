import { VillageProject } from "@/lib/test-home-data";

export default function VillageDirectCard({ project }: { project: VillageProject }) {
  return (
    <div className="group bg-white rounded-2xl overflow-hidden card-hover flex flex-col md:flex-row">
      <div className="md:w-2/5 relative">
        <img src={project.imageUrl} alt={project.title} className="w-full h-64 md:h-full object-cover image-zoom" />
        <div className="absolute top-3 left-3 bg-red-600 px-2 py-1 rounded text-xs font-bold text-white">村委官方直售</div>
      </div>
      <div className="md:w-3/5 p-6 flex flex-col justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{project.title}</h3>
          <div className="text-sm text-gray-600 mb-3"><span className="font-medium">老校方：</span>{project.contact}</div>
          <p className="text-sm text-gray-500 mb-4 line-clamp-3">{project.description}</p>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-400 mb-1">原来参考价</div>
            <div className="text-lg font-bold text-gray-900">{project.price}</div>
          </div>
          <span className="bg-[#1a4731] group-hover:bg-[#2d5a45] text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors inline-block">一键源尽调 →</span>
        </div>
      </div>
    </div>
  );
}