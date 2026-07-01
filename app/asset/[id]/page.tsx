export const runtime = 'edge';

import { getAssetById, getAssets, getHomepageConfig, incrementViews } from '@/lib/data';
import { notFound } from 'next/navigation';
// ✅ 新增：导入我们刚才创建的轮播图客户端组件
import MediaGallery from './media-gallery';
import ContactCard from '@/components/shared/ContactCard';

export default async function AssetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [asset, config] = await Promise.all([
    getAssetById(id).catch(() => null),
    getHomepageConfig().catch(() => ({})),
  ]);

  if (!asset) {
    notFound();
  }

  // 增加浏览量（异步，不阻塞渲染）
  incrementViews(asset.id).catch(() => {});

  // 获取相似推荐
  const similar = await getAssets({
    province: asset.province || undefined,
    limit: 3,
  }).catch(() => []);
  const similarFiltered = similar.filter((a) => a.id !== asset.id).slice(0, 3);

  // 解析图片列表
  let imageUrls: string[] = [];
  try {
    if (asset.images) {
      imageUrls = JSON.parse(asset.images);
    }
  } catch {}

  // 解析基建信息（从数据库读取，fallback为默认值）
  let infraItems = [
    { icon: '⚡', label: '通电', status: '已通' },
    { icon: '💧', label: '自来水', status: '已通' },
    { icon: '📶', label: '网络', status: '5G覆盖' },
    { icon: '🚽', label: '污水化粪池', status: '已建' },
    { icon: '🛣️', label: '自建路', status: '已硬化' },
    { icon: '🏗️', label: '容积率', status: '≤1.5' },
  ];
  let envItems = [
    { label: '舒适度', value: '±1级', icon: '🌡️' },
    { label: '空气质量', value: '51-100(良)', icon: '🌬️' },
    { label: '水质', value: 'II类', icon: '💧' },
    { label: '噪声指数', value: '20-40 dB', icon: '🔇' },
  ];

  // 从 infra_details JSON 覆盖
  if ((asset as any).infra_details) {
    try {
      const parsed = JSON.parse((asset as any).infra_details);
      if (parsed.infra && Array.isArray(parsed.infra) && parsed.infra.length > 0) {
        infraItems = parsed.infra.map((item: any) => ({
          icon: item.icon || '📌',
          label: item.label || '',
          status: item.status || '',
        }));
      }
      if (parsed.env && Array.isArray(parsed.env) && parsed.env.length > 0) {
        envItems = parsed.env.map((item: any) => ({
          icon: item.icon || '📌',
          label: item.label || '',
          value: item.value || '',
        }));
      }
    } catch {}
  }

  return (
    <>
     
      <main className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="text-sm text-gray-400 mb-6">
            <a href="/" className="hover:text-brand-green">首页</a>
            <span className="mx-2">/</span>
            <a href="/search" className="hover:text-brand-green">搜索</a>
            <span className="mx-2">/</span>
            <span className="text-gray-700">{asset.title}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* ✅ 修改点：使用新的 MediaGallery 组件替换原来的单图展示 */}
              <MediaGallery images={imageUrls} video={asset.video_url} />

              {/* Title */}
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-xs bg-brand-green text-white px-2 py-0.5 rounded">
                    {(asset as any).publisher_name || (asset.source_type === 'official' ? '官方原矿' : asset.source_type === 'village' ? '村委直营' : '个人发布')}
                  </span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{asset.asset_type || '资产'}</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">{asset.title}</h1>
                <p className="text-gray-500 mt-1">{asset.location || [asset.province, asset.city, asset.district].filter(Boolean).join(' · ')}</p>
              </div>

              {/* Key metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: '每年首付流转价', value: asset.price_year ? `¥${asset.price_year}万/年` : '价格面议', color: 'text-brand-green' },
                  { label: '最长流转期限', value: asset.lease_years ? `${asset.lease_years}年` : '面议', color: 'text-gray-900' },
                  { label: '地块面积', value: asset.area_mu ? `${asset.area_mu} 亩` : '-', color: 'text-gray-900' },
                  { label: '浏览量', value: asset.views.toLocaleString(), color: 'text-gray-500' },
                ].map((m) => (
                  <div key={m.label} className="bg-gray-50 rounded-xl p-4 text-center">
                    <div className="text-xs text-gray-400 mb-1">{m.label}</div>
                    <div className={`text-lg font-bold ${m.color}`}>{m.value}</div>
                  </div>
                ))}
              </div>

              {/* Description */}
              {asset.description && (
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                  <h2 className="font-bold text-gray-900 mb-3">资产描述</h2>
                  <p className="text-gray-600 text-sm leading-relaxed">{asset.description}</p>
                </div>
              )}

              {/* Infrastructure details */}
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h2 className="font-bold text-gray-900 mb-4">基础设施配套明细</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {infraItems.map((item) => (
                    <div key={item.label} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <span className="text-xl">{item.icon}</span>
                      <div>
                        <div className="text-xs text-gray-400">{item.label}</div>
                        <div className="text-sm font-medium text-gray-900">{item.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Environment */}
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h2 className="font-bold text-gray-900 mb-4">环境与产业集群</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {envItems.map((e) => (
                    <div key={e.label} className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl mb-1">{e.icon}</div>
                      <div className="text-xs text-gray-400">{e.label}</div>
                      <div className="text-sm font-bold text-gray-900">{e.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Contact + Attachments */}
              <ContactCard
                phone={asset.contact_phone}
                name={asset.contact_name}
              />

              {/* Similar assets */}
              {similarFiltered.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                  <h3 className="font-bold text-gray-900 mb-3">相似推荐</h3>
                  <div className="space-y-3">
                    {similarFiltered.map((s) => (
                      <a key={s.id} href={`/asset/${s.id}`} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-lg">🏘️</div>
                        <div>
                          <div className="text-sm font-medium text-gray-700">{s.title}</div>
                          <div className="text-xs text-gray-400">{s.area_mu ? `${s.area_mu}亩` : ''} {s.price_year ? `¥${s.price_year}万/年` : ''}</div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
    </>
  );
}