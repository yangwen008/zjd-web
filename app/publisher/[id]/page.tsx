export const runtime = 'edge';
export const revalidate = 300;

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPublisherProfile, getPublisherAssets, getPublisherAssetCount, getBulkProjects, type Asset, type BulkProject } from '@/lib/data';
import Pagination from '@/components/shared/Pagination';

const ROLE_LABELS: Record<string, string> = {
  user: '个人用户',
  broker: '认证合伙人',
  village_org: '村集体',
  data_editor: '数据录入员',
  project_publisher: '交易所/机构',
  admin: '平台运营',
  superadmin: '超级管理员',
};

const ROLE_COLORS: Record<string, string> = {
  user: 'bg-gray-100 text-gray-700',
  broker: 'bg-blue-100 text-blue-700',
  village_org: 'bg-red-100 text-red-700',
  project_publisher: 'bg-yellow-100 text-yellow-700',
  admin: 'bg-purple-100 text-purple-700',
  superadmin: 'bg-purple-100 text-purple-700',
};

function getFirstImage(images: string | null): string {
  if (!images) return 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=600&h=400&fit=crop';
  try {
    const arr = JSON.parse(images);
    if (Array.isArray(arr) && arr.length > 0) {
      const first = arr[0];
      return typeof first === 'object' && first.thumb ? first.thumb : (typeof first === 'object' ? first.url : first);
    }
    return 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=600&h=400&fit=crop';
  } catch {
    return 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=600&h=400&fit=crop';
  }
}

function formatPrice(price: number | null): string {
  if (!price) return '价格面议';
  return `¥${price}万/年`;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const publisher = await getPublisherProfile(id).catch(() => null);
  if (!publisher) return { title: '发布者资料' };
  return {
    title: `${publisher.nickname} - 发布者资料 | zjd.cn`,
    description: publisher.bio || publisher.broker_bio || publisher.org_name || `${publisher.nickname}的发布者主页`,
  };
}

export default async function PublisherPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ page?: string }> }) {
  const { id } = await params;
  const { page: pageParam } = await searchParams;
  const publisher = await getPublisherProfile(id).catch(() => null);
  if (!publisher) notFound();

  const specialties: string[] = (() => {
    try { return publisher.broker_specialties ? JSON.parse(publisher.broker_specialties) : []; }
    catch { return []; }
  })();

  // 分页参数
  const PAGE_SIZE = 12;
  const currentPage = Math.max(1, parseInt(pageParam || '1', 10));
  const offset = (currentPage - 1) * PAGE_SIZE;

  // 获取该发布者的资产（分页）和大宗项目
  const [assets, totalAssets, bulkProjects] = await Promise.all([
    getPublisherAssets(publisher.id, PAGE_SIZE, offset).catch(() => [] as Asset[]),
    getPublisherAssetCount(publisher.id).catch(() => 0),
    getBulkProjects({ status: 'approved', limit: 50 }).then(
      (all) => all.filter((p) => p.user_id === publisher.id)
    ).catch(() => [] as BulkProject[]),
  ]);

  const totalPages = Math.ceil(totalAssets / PAGE_SIZE);

  const roleLabel = ROLE_LABELS[publisher.role] || publisher.role;
  const roleColor = ROLE_COLORS[publisher.role] || 'bg-gray-100 text-gray-700';

  return (
    <main className="pt-20 pb-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="text-sm text-gray-400 mb-6">
          <a href="/" className="hover:text-brand-green">首页</a>
          <span className="mx-2">/</span>
          <span className="text-gray-700">发布者资料</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧：发布者信息 */}
          <div className="lg:col-span-1 space-y-6">
            {/* 基本信息卡片 */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
                  {publisher.avatar_url ? (
                    <img src={publisher.avatar_url} alt={publisher.nickname} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl text-gray-400">
                      {publisher.nickname.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{publisher.nickname}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded ${roleColor}`}>{roleLabel}</span>
                    {publisher.verified === 1 && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">✅ 已认证</span>
                    )}
                  </div>
                </div>
              </div>

              {/* 机构信息 */}
              {publisher.org_name && (
                <div className="mb-3">
                  <div className="text-xs text-gray-400 mb-1">所属机构</div>
                  <div className="text-sm font-medium text-gray-900">{publisher.org_name}</div>
                </div>
              )}

              {/* 合伙人信息 */}
              {publisher.broker_region && (
                <div className="mb-3">
                  <div className="text-xs text-gray-400 mb-1">负责区域</div>
                  <div className="text-sm text-gray-700">{publisher.broker_region}</div>
                </div>
              )}

              {specialties.length > 0 && (
                <div className="mb-3">
                  <div className="text-xs text-gray-400 mb-1">擅长领域</div>
                  <div className="flex flex-wrap gap-1.5">
                    {specialties.map((s) => (
                      <span key={s} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* 简介 */}
              {(publisher.bio || publisher.broker_bio) && (
                <div className="mb-3">
                  <div className="text-xs text-gray-400 mb-1">{publisher.role === 'broker' ? '个人简介' : '机构介绍'}</div>
                  <p className="text-sm text-gray-600 leading-relaxed">{publisher.bio || publisher.broker_bio}</p>
                </div>
              )}

              {/* 入驻时间 */}
              <div className="text-xs text-gray-400 mt-4 pt-3 border-t border-gray-100">
                入驻时间：{publisher.created_at?.split('T')[0] || publisher.created_at?.split(' ')[0] || '未知'}
              </div>
            </div>

            {/* 营业执照/资质证书 */}
            {publisher.org_license && (
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h2 className="font-bold text-gray-900 mb-3">📋 资质证书</h2>
                <div className="rounded-lg overflow-hidden border border-gray-100">
                  <img
                    src={publisher.org_license.startsWith('http') ? `/api/images/${publisher.org_license}` : publisher.org_license}
                    alt="资质证书"
                    className="w-full h-auto"
                  />
                </div>
              </div>
            )}

            {/* 数据统计 */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="font-bold text-gray-900 mb-4">📊 发布数据</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-brand-green">{publisher.asset_count}</div>
                  <div className="text-xs text-gray-400 mt-1">在架资产</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{publisher.total_views.toLocaleString()}</div>
                  <div className="text-xs text-gray-400 mt-1">总浏览量</div>
                </div>
              </div>
            </div>
          </div>

          {/* 右侧：发布的资产 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 资产列表 */}
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4">🏘️ 发布的资产 <span className="text-sm font-normal text-gray-400">（共 {totalAssets} 个）</span></h2>
              {assets.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {assets.map((asset) => (
                    <Link key={asset.id} href={`/asset/${asset.id}`} className="bg-white rounded-xl border border-gray-100 overflow-hidden card-hover">
                      <div className="h-40 relative overflow-hidden">
                        <img src={getFirstImage(asset.images)} alt={asset.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                        <div className="absolute top-3 left-3">
                          <span className="text-xs bg-white/90 text-gray-700 px-2 py-0.5 rounded">
                            {asset.source_type === 'official' ? '官方' : asset.source_type === 'village' ? '村委' : '个人'}
                          </span>
                        </div>
                        <div className="absolute bottom-3 right-3">
                          <span className="text-xs bg-black/50 text-white px-2 py-0.5 rounded">{asset.views.toLocaleString()} 浏览</span>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-gray-900 text-sm mb-1 line-clamp-1">{asset.title}</h3>
                        <p className="text-xs text-gray-400 mb-2">{asset.location || [asset.province, asset.city].filter(Boolean).join(' · ')}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-brand-green">{formatPrice(asset.price_year)}</span>
                          <span className="text-xs text-gray-400">{asset.area_mu ? `${asset.area_mu}亩` : ''}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <div className="text-4xl mb-3">📭</div>
                  <p>暂无在架资产</p>
                </div>
              )}

              {/* 分页栏 */}
              <Pagination currentPage={currentPage} totalPages={totalPages} basePath={`/publisher/${id}`} />
            </div>

            {/* 大宗项目 */}
            {bulkProjects.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4">🏢 大宗项目</h2>
                <div className="space-y-4">
                  {bulkProjects.map((bp) => (
                    <Link key={bp.id} href={`/bulk-projects/${bp.id}`} className="block bg-white rounded-xl border border-gray-100 p-4 card-hover">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-gray-900 text-sm mb-1">{bp.title}</h3>
                          <p className="text-xs text-gray-400">{bp.location || [bp.province, bp.city].filter(Boolean).join(' · ')}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-brand-green">{bp.price_start ? `¥${bp.price_start}万/年起` : '价格面议'}</div>
                          <div className="text-xs text-gray-400">{bp.area_sqm ? `${bp.area_sqm}㎡` : bp.area_mu ? `${bp.area_mu}亩` : ''}</div>
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
