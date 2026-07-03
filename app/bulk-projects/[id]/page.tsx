export const runtime = 'edge';

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getBulkProjectById, getBulkProjects, incrementBulkViews } from '@/lib/data';
import type { BulkProject } from '@/lib/data';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const project = await getBulkProjectById(id).catch(() => null);
  if (!project) return { title: '大宗项目详情' };

  const siteUrl = 'https://zjd.cn';
  let imageUrl = `${siteUrl}/logo.png`;
  if (project.images) {
    try {
      const arr = JSON.parse(project.images);
      if (Array.isArray(arr) && arr.length > 0) {
        const first = arr[0];
        const rawUrl = typeof first === 'object' ? (first.url || first.thumb || '') : first;
        if (rawUrl) imageUrl = rawUrl.startsWith('http') ? rawUrl : `${siteUrl}/api/images/${rawUrl}`;
      }
    } catch {}
  }
  const desc = project.description ? project.description.replace(/<[^>]*>/g, '').substring(0, 100) : project.title;

  return {
    title: `${project.title} - zjd.cn`,
    description: desc,
    openGraph: { title: project.title, description: desc, url: `${siteUrl}/bulk-projects/${project.id}`, images: [{ url: imageUrl, width: 800, height: 600 }], type: 'website', locale: 'zh_CN' },
  };
}
import MediaGallery from '@/app/asset/[id]/media-gallery';
import ContactCard from '@/components/shared/ContactCard';
import InvestCard from '@/components/shared/InvestCard';

function getFirstImage(images: string | null): string {
  if (!images) return 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800';
  try {
    const arr = JSON.parse(images);
    return Array.isArray(arr) && arr.length > 0 ? arr[0] : 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800';
  } catch { return 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800'; }
}

function getAllImages(images: string | null): string[] {
  if (!images) return [];
  try { return JSON.parse(images); } catch { return []; }
}

const CERT_LABELS: Record<string, { label: string; className: string }> = {
  certified: { label: '✅ 已确权', className: 'bg-green-100 text-green-700' },
  pending: { label: '⏳ 待确权', className: 'bg-yellow-100 text-yellow-700' },
  uncertified: { label: '❌ 未确权', className: 'bg-red-100 text-red-700' },
};

export default async function BulkProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [project, allProjects] = await Promise.all([
    getBulkProjectById(id).catch(() => null),
    getBulkProjects({ limit: 6 }).catch(() => [] as BulkProject[]),
  ]);

  if (!project) { notFound(); }

  incrementBulkViews(project.id).catch(() => {});

  const images = getAllImages(project.images);
  const cert = CERT_LABELS[project.certification] || CERT_LABELS.uncertified;
  const similar = allProjects.filter((p) => p.id !== project.id).slice(0, 3);

  return (
    <main className="pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="text-sm text-gray-400 mb-6">
          <Link href="/" className="hover:text-brand-green">首页</Link>
          <span className="mx-2">/</span>
          <Link href="/bulk-projects" className="hover:text-brand-green">大宗路演</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-700">{project.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" style={{ alignItems: 'start' }}>
          {/* Main */}
          <div className="lg:col-span-2 space-y-6">
            {/* Media Gallery */}
            <MediaGallery images={images} video={project.video_url} />

            {/* Title */}
            <div>
              <div className="flex items-center space-x-2 mb-2">
                {project.code && <span className="bg-yellow-500 text-white text-xs font-bold px-2 py-0.5 rounded">{project.code}</span>}
                <span className={`text-xs px-2 py-0.5 rounded ${cert.className}`}>{cert.label}</span>
                {project.planning_use && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{project.planning_use}</span>}
              </div>
              <h1 className="text-2xl font-bold text-gray-900">{project.title}</h1>
              <p className="text-gray-500 mt-1">{project.location || [project.province, project.city, project.district].filter(Boolean).join(' · ')}</p>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: '占地面积', value: project.area_mu ? `${project.area_mu} 亩` : '-', color: 'text-gray-900' },
                { label: '建筑面积', value: project.area_sqm ? `${project.area_sqm} ㎡` : '-', color: 'text-gray-900' },
                { label: '年收益率', value: project.yield_rate ? `${project.yield_rate}%` : '-', color: 'text-green-600' },
                { label: '流转年限', value: project.lease_years ? `${project.lease_years} 年` : '-', color: 'text-gray-900' },
              ].map((m) => (
                <div key={m.label} className="bg-gray-50 rounded-xl p-4 text-center">
                  <div className="text-xs text-gray-400 mb-1">{m.label}</div>
                  <div className={`text-lg font-bold ${m.color}`}>{m.value}</div>
                </div>
              ))}
            </div>

            {/* Description */}
            {project.description && (
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h2 className="font-bold text-gray-900 mb-3">项目描述</h2>
                <div className="text-gray-600 text-sm leading-relaxed prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: project.description }} />
              </div>
            )}

            {/* Commercial Plan */}
            {project.commercial_plan && (
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h2 className="font-bold text-gray-900 mb-3">商业计划书</h2>
                <div
                  className="text-gray-600 text-sm leading-relaxed"
                  style={{ lineHeight: '1.8' }}
                  dangerouslySetInnerHTML={{ __html: project.commercial_plan }}
                />
              </div>
            )}

            {/* Infra from database */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="font-bold text-gray-900 mb-4">基础设施配套</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {(() => {
                  let infraList = [
                    { icon: '⚡', label: '通电', status: '已通' },
                    { icon: '💧', label: '自来水', status: '已通' },
                    { icon: '📶', label: '网络', status: '5G覆盖' },
                    { icon: '🚽', label: '污水化粪池', status: '已建' },
                    { icon: '🔥', label: '天燃气', status: '已通' },
                    { icon: '🛣️', label: '自建路', status: '已硬化' },
                    { icon: '🏗️', label: '容积率', status: '≤1.5' },
                  ];
                  if (project.infra_details) {
                    try {
                      const parsed = JSON.parse(project.infra_details);
                      if (parsed.infra && Array.isArray(parsed.infra) && parsed.infra.length > 0) {
                        infraList = parsed.infra.map((item: any) => ({ icon: item.icon || '📌', label: item.label || '', status: item.status || '' }));
                      }
                    } catch {}
                  }
                  return infraList.map((item) => (
                    <div key={item.label} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <span className="text-xl">{item.icon}</span>
                      <div>
                        <div className="text-xs text-gray-400">{item.label}</div>
                        <div className="text-sm font-medium text-gray-900">{item.status}</div>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>

            {/* Environment from database */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="font-bold text-gray-900 mb-4">环境指标</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(() => {
                  let envList = [
                    { label: '舒适度', value: '±1级', icon: '🌡️' },
                    { label: '空气质量', value: '51-100(良)', icon: '🌬️' },
                    { label: '水质', value: 'II类', icon: '💧' },
                    { label: '噪声指数', value: '20-40 dB', icon: '🔇' },
                  ];
                  if (project.infra_details) {
                    try {
                      const parsed = JSON.parse(project.infra_details);
                      if (parsed.env && Array.isArray(parsed.env) && parsed.env.length > 0) {
                        envList = parsed.env.map((item: any) => ({ icon: item.icon || '📌', label: item.label || '', value: item.value || '' }));
                      }
                    } catch {}
                  }
                  return envList.map((e) => (
                    <div key={e.label} className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl mb-1">{e.icon}</div>
                      <div className="text-xs text-gray-400">{e.label}</div>
                      <div className="text-sm font-bold text-gray-900">{e.value}</div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            {/* Price card */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="text-center mb-4">
                <div className="text-xs text-gray-400 mb-1">起始价格</div>
                <div className="text-3xl font-bold text-brand-green">
                  {project.price_start ? `¥${project.price_start}万/年起` : '价格面议'}
                </div>
                {project.price_total && (
                  <div className="text-sm text-gray-500 mt-1">总价 ¥{project.price_total}万</div>
                )}
              </div>
              <div className="text-xs text-gray-400 text-center">
                浏览量: {project.views.toLocaleString()}
              </div>
            </div>

            {/* 参投认购 */}
            <InvestCard
              assetId={project.id}
              assetType="bulk_project"
              assetTitle={project.title}
              investEnabled={!!(project as any).invest_enabled}
              totalShares={(project as any).invest_total_shares || 0}
              sharePrice={(project as any).invest_share_price || 0}
              minShares={(project as any).invest_min_shares || 1}
              soldShares={(project as any).invest_sold_shares || 0}
            />

            {/* Contact + Attachments */}
            <ContactCard
              phone={project.contact_phone}
              name={project.contact_name}
              attachments={[
                { label: '商业计划书', icon: '📄', url: (project as any).commercial_plan_doc || null, type: 'doc' },
                { label: '确权证书', icon: '📋', url: project.cert_doc_url || null, type: 'cert' },
              ]}
            />

            {/* 发布者信息 */}
            {project.user_id && (
              <a href={`/publisher/${project.user_id}`} className="block bg-white rounded-xl border border-gray-100 p-5 card-hover">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-lg font-bold text-gray-400">
                    {(project as any).publisher_name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900">{(project as any).publisher_name || '平台'}</span>
                      {((project as any).publisher_role === 'project_publisher') && (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">交易所</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">查看发布者资料 →</div>
                  </div>
                </div>
              </a>
            )}

            {/* Similar */}
            {similar.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h3 className="font-bold text-gray-900 mb-3">相似推荐</h3>
                <div className="space-y-3">
                  {similar.map((s) => (
                    <Link key={s.id} href={`/bulk-projects/${s.id}`} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-lg overflow-hidden">
                        <img src={getFirstImage(s.images)} alt={s.title} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-700">{s.title}</div>
                        <div className="text-xs text-gray-400">
                          {s.area_sqm ? `${s.area_sqm}㎡` : ''} {s.price_start ? `¥${s.price_start}万/年起` : ''}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
