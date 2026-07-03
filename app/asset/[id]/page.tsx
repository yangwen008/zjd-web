export const runtime = 'edge';
export const revalidate = 60; // 1分钟缓存

import type { Metadata } from 'next';
import { getAssetById, getAssets, getHomepageConfig, incrementViews } from '@/lib/data';
import { notFound } from 'next/navigation';
import MediaGallery from './media-gallery';
import ContactCard from '@/components/shared/ContactCard';
import BookingButton from '@/components/shared/BookingButton';
import WxShareConfig from '@/components/shared/WxShareConfig';
import ShareButton from '@/components/shared/ShareButton';
import InvestCard from '@/components/shared/InvestCard';

// 动态 OG 元数据 - 微信分享抓取用
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const asset = await getAssetById(id).catch(() => null);
  if (!asset) return { title: '资产详情' };

  const siteUrl = 'https://zjd.cn';

  // 取资产第一张图片作为 OG 图片，无图时用 logo
  let imageUrl = `${siteUrl}/logo.png`;
  if (asset.images) {
    try {
      const arr = JSON.parse(asset.images);
      if (Array.isArray(arr) && arr.length > 0) {
        const first = arr[0];
        const rawUrl = typeof first === 'object' ? (first.url || first.thumb || '') : first;
        if (rawUrl) {
          imageUrl = rawUrl.startsWith('http') ? rawUrl : `${siteUrl}/api/images/${rawUrl}`;
        }
      }
    } catch {}
  }

  const desc = asset.description
    ? asset.description.replace(/<[^>]*>/g, '').substring(0, 100)
    : `${asset.province || ''}·${asset.city || ''} ${asset.area_mu || ''}亩 ${asset.price_year ? asset.price_year + '万/年' : '面议'}`;

  return {
    title: `${asset.title} - zjd.cn`,
    description: desc,
    openGraph: {
      title: asset.title,
      description: desc,
      url: `${siteUrl}/asset/${asset.id}`,
      images: [{ url: imageUrl, width: 800, height: 600 }],
      type: 'website',
      locale: 'zh_CN',
    },
    twitter: {
      card: 'summary_large_image',
      title: asset.title,
      description: desc,
      images: [imageUrl],
    },
  };
}

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

  const siteUrl = 'https://zjd.cn';
  // 取第一张图片的原始 URL（兼容 {url,thumb} 和纯字符串格式）
  const firstImageRaw = imageUrls.length > 0
    ? (typeof imageUrls[0] === 'object' ? (imageUrls[0] as any).url || (imageUrls[0] as any).thumb || '' : imageUrls[0])
    : '';
  // 绝对 URL 直接用，相对路径走代理
  const shareImage = firstImageRaw
    ? (firstImageRaw.startsWith('http') ? firstImageRaw : `${siteUrl}/api/images/${firstImageRaw}`)
    : '';

  return (
    <>
      <WxShareConfig
        title={asset.title}
        desc={asset.description || `${asset.province || ''}·${asset.city || ''} ${asset.area_mu || ''}亩 ${asset.price_year ? asset.price_year + '万/年' : '面议'}`}
        link={`${siteUrl}/asset/${asset.id}`}
        imgUrl={shareImage || `${siteUrl}/logo.png`
      />
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" style={{ alignItems: 'start' }}>
            {/* Main content */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* ✅ 修改点：使用新的 MediaGallery 组件替换原来的单图展示 */}
              <MediaGallery images={imageUrls} video={asset.video_url} />

              {/* Title */}
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-xs bg-brand-green text-white px-2 py-0.5 rounded">
                    {((asset as any).publisher_role === 'project_publisher') ? '交易所' : (asset.source_type === 'official' ? '官方原矿' : asset.source_type === 'village' ? '村委直营' : '个人发布')}
                  </span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{asset.asset_type || '资产'}</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">{asset.title}</h1>
                <p className="text-gray-500 mt-1">{asset.location || [asset.province, asset.city, asset.district].filter(Boolean).join(' · ')}</p>
                {asset.user_id && (
                  <a href={`/publisher/${asset.user_id}`} className="inline-flex items-center gap-2 mt-2 text-sm text-gray-500 hover:text-brand-green transition-colors">
                    {(asset as any).publisher_avatar ? (
                      <img src={(asset as any).publisher_avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
                    ) : (
                      <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-400">{(asset as any).publisher_name?.charAt(0) || '?'}</span>
                    )}
                    <span>{(asset as any).publisher_name || '平台'}</span>
                    <span className="text-xs text-gray-300">· 查看资料 →</span>
                  </a>
                )}
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
                  <div className="text-gray-600 text-sm leading-relaxed prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: asset.description }} />
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
            <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
              {/* 预约带看 */}
              <BookingButton assetId={asset.id} assetTitle={asset.title} />

              {/* 参投认购 */}
              <InvestCard
                assetId={asset.id}
                assetType="asset"
                assetTitle={asset.title}
                investEnabled={!!asset.invest_enabled}
                totalShares={asset.invest_total_shares || 0}
                sharePrice={asset.invest_share_price || 0}
                minShares={asset.invest_min_shares || 1}
                soldShares={asset.invest_sold_shares || 0}
              />

              {/* 一键分享 */}
              <ShareButton
                title={asset.title}
                text={`${asset.province || ''}·${asset.city || ''} ${asset.area_mu || ''}亩 ${asset.price_year ? asset.price_year + '万/年' : '面议'}`}
                url={`https://zjd.cn/asset/${asset.id}`}
              />

              {/* Contact + Attachments */}
              <ContactCard
                phone={asset.contact_phone}
                name={asset.contact_name}
              />

              {/* 发布者信息 */}
              {asset.user_id && (
                <a href={`/publisher/${asset.user_id}`} className="block bg-white rounded-xl border border-gray-100 p-5 card-hover">
                  <div className="flex items-center space-x-3">
                    {(asset as any).publisher_avatar ? (
                      <img src={(asset as any).publisher_avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-lg font-bold text-gray-400">
                        {(asset as any).publisher_name?.charAt(0) || '?'}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">{(asset as any).publisher_name || '平台'}</span>
                        {((asset as any).publisher_role === 'project_publisher') && (
                          <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">交易所</span>
                        )}
                        {((asset as any).publisher_role === 'village_org') && (
                          <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">村集体</span>
                        )}
                        {((asset as any).publisher_role === 'broker') && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">合伙人</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">查看发布者资料 →</div>
                    </div>
                  </div>
                </a>
              )}

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