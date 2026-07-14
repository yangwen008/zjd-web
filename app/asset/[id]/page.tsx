export const runtime = 'edge';
export const revalidate = 60; // 1分钟缓存

import type { Metadata } from 'next';
import { getAssetById, getAssets, getHomepageConfig, incrementViews } from '@/lib/data';
import { notFound } from 'next/navigation';
import MediaGallery from './media-gallery';
import ContactCard from '@/components/shared/ContactCard';
import BookingButton from '@/components/shared/BookingButton';
import ShareButton from '@/components/shared/ShareButton';
import InvestCard from '@/components/shared/InvestCard';

// ========== 动态 OG 元数据 (微信/百度爬虫抓取用) ==========
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const asset = await getAssetById(id).catch(() => null);
  if (!asset) return { title: '资产详情' };

  const siteUrl = 'https://zjd.cn';

  // OG 图片：优先用 R2 本地图片，外链图片微信爬虫无法访问则用 logo 兜底
  let imageUrl = `${siteUrl}/logo-share.jpg`;
  if (asset.images) {
    try {
      const arr = JSON.parse(asset.images);
      if (Array.isArray(arr) && arr.length > 0) {
        const first = arr[0];
        const rawUrl = typeof first === 'object' ? (first.url || first.thumb || '') : first;
        if (rawUrl && rawUrl.startsWith('/api/images/')) {
          imageUrl = `${siteUrl}${rawUrl}`;
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
    alternates: { canonical: `/asset/${asset.id}` },
    openGraph: {
      title: asset.title,
      description: desc,
      url: `${siteUrl}/asset/${asset.id}`,
      images: [{ url: imageUrl, width: 800, height: 600 }],
      type: 'website',
      locale: 'zh_CN',
    },
    other: {
      'itemprop:name': asset.title,
      'itemprop:description': desc,
      'itemprop:image': imageUrl,
    },
    twitter: {
      card: 'summary_large_image',
      title: asset.title,
      description: desc,
      images: [imageUrl],
    },
  };
}

// ========== 主页面组件 (Server Component) ==========
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

  // 解析图片列表（兼容 {url,thumb} 新格式和纯字符串旧格式）
  let imageUrls: string[] = [];
  try {
    if (asset.images) {
      const parsed = JSON.parse(asset.images);
      if (Array.isArray(parsed)) {
        imageUrls = parsed.map((item: any) => {
          if (typeof item === 'string') return item;
          if (typeof item === 'object' && item) return item.url || item.thumb || '';
          return '';
        }).filter(Boolean);
      }
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
          icon: item.icon || '',
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

  // ========== 微信 JSSDK 分享数据准备 ==========
  const siteUrl = 'https://zjd.cn';
  const firstImageRaw = imageUrls.length > 0 ? imageUrls[0] : '';
  let shareImage = `${siteUrl}/logo-share.jpg`;
  if (firstImageRaw) {
    if (firstImageRaw.startsWith('/api/images/')) shareImage = `${siteUrl}${firstImageRaw}`;
    else if (firstImageRaw.startsWith('http')) shareImage = firstImageRaw;
  }

  const shareConfig = {
    title: asset.title || '宅基地交易所',
    desc: asset.description 
      ? asset.description.replace(/<[^>]*>/g, '').substring(0, 100)
      : `${asset.province || ''}·${asset.city || ''} ${asset.area_mu || ''}亩优质资产`,
    imgUrl: shareImage,
    link: `${siteUrl}/asset/${asset.id}`,
  };

  // JSON-LD 结构化数据
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'RealEstate',
    name: asset.title,
    description: asset.description?.replace(/<[^>]*>/g, '').substring(0, 200),
    url: `${siteUrl}/asset/${asset.id}`,
    image: shareImage,
    address: {
      '@type': 'PostalAddress',
      addressLocality: asset.city || '',
      addressRegion: asset.province || '',
      streetAddress: asset.address || '',
    },
    ...(asset.area_mu ? { floorSize: { '@type': 'QuantitativeValue', value: asset.area_mu, unitText: '亩' } } : {}),
    ...(asset.price_year ? { price: { '@type': 'MonetaryAmount', value: asset.price_year, currency: 'CNY', description: '万元/年' } } : {}),
    offers: {
      '@type': 'Offer',
      price: asset.price_year || 0,
      priceCurrency: 'CNY',
      availability: 'https://schema.org/InStock',
    },
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: '首页', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: '搜索', item: `${siteUrl}/search` },
      { '@type': 'ListItem', position: 3, name: asset.title, item: `${siteUrl}/asset/${asset.id}` },
    ],
  };

  return (
    <>
      {/* 👇 微信 JSSDK 分享配置（内联脚本，完美兼容 Server Component，不影响任何原有功能） */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              // 仅在微信手机端浏览器中执行，绝不干扰 PC 端登录
              if (!/micromessenger/i.test(navigator.userAgent) || !/mobile/i.test(navigator.userAgent)) return;
              const config = ${JSON.stringify(shareConfig)};
              const currentUrl = window.location.href.split('#')[0];
              
              const loadWx = () => {
                if (window.wx) initWx();
                else {
                  const s = document.createElement('script');
                  s.src = 'https://res.wx.qq.com/open/js/jweixin-1.6.0.js';
                  s.onload = initWx;
                  document.head.appendChild(s);
                }
              };

              const initWx = async () => {
                try {
                  // 调用您部署好的国内代理服务器
                  const res = await fetch('http://112.44.232.181:8443/jssdk?url=' + encodeURIComponent(currentUrl));
                  const data = await res.json();
                  if (!data.success || !data.data) return;
                  
                  window.wx.config({
                    debug: false, // 调试时可改为 true，微信会弹出 config:ok
                    appId: data.data.appId,
                    timestamp: data.data.timestamp,
                    nonceStr: data.data.nonceStr,
                    signature: data.data.signature,
                    jsApiList: ['updateAppMessageShareConfig', 'updateTimelineShareData'],
                  });
                  
                  window.wx.ready(() => {
                    window.wx.updateAppMessageShareConfig({ 
                      title: config.title, 
                      desc: config.desc, 
                      link: config.link, 
                      imgUrl: config.imgUrl 
                    });
                    window.wx.updateTimelineShareData({ 
                      title: config.title, 
                      link: config.link, 
                      imgUrl: config.imgUrl 
                    });
                  });
                } catch(e) { console.error('Wx SDK Error', e); }
              };
              loadWx();
            })();
          `,
        }}
      />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      
      <div className="min-h-screen bg-gray-50">
        {/* 顶部标题栏 */}
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">{asset.title}</h1>
              <div className="flex gap-2">
                {/* 👇 修复点：补充了缺失的 text 属性 */}
                <ShareButton 
                  url={`${siteUrl}/asset/${asset.id}`}
                  title={asset.title}
                  text={asset.title}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 图片轮播 */}
        <MediaGallery images={imageUrls} videoUrl={asset.video_url} />

        {/* 主要内容区 */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 左侧：资产详情 */}
            <div className="lg:col-span-2 space-y-6">
              {/* 基本信息 */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">基本信息</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-500">面积：</span>
                    <span className="font-medium">{asset.area_mu}亩</span>
                  </div>
                  <div>
                    <span className="text-gray-500">价格：</span>
                    <span className="font-medium text-red-600">{asset.price_year}万/年</span>
                  </div>
                  <div>
                    <span className="text-gray-500">地点：</span>
                    <span className="font-medium">{asset.province}{asset.city}{asset.district}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">类型：</span>
                    <span className="font-medium">{asset.asset_type}</span>
                  </div>
                </div>
              </div>

              {/* 基建配套 */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">基建配套</h2>
                <div className="grid grid-cols-3 gap-4">
                  {infraItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-2xl">{item.icon}</span>
                      <div>
                        <div className="text-sm text-gray-600">{item.label}</div>
                        <div className="text-sm font-medium text-green-600">{item.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 环境指标 */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">环境指标</h2>
                <div className="grid grid-cols-2 gap-4">
                  {envItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-2xl">{item.icon}</span>
                      <div>
                        <div className="text-sm text-gray-600">{item.label}</div>
                        <div className="text-sm font-medium">{item.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 资产描述 */}
              {asset.description && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold mb-4">资产描述</h2>
                  <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: asset.description }} />
                </div>
              )}
            </div>

            {/* 右侧：联系与操作 */}
            <div className="space-y-6">
              <ContactCard 
                assetId={asset.id}
                contactName={asset.contact_name || ''}
                contactPhone={asset.contact_phone || ''}
                contactWechat={asset.contact_wechat || ''}
              />
              <BookingButton assetId={asset.id} assetTitle={asset.title} />
            </div>
          </div>

          {/* 相似推荐 */}
          {similarFiltered.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold mb-6">相似推荐</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {similarFiltered.map((item) => (
                  <div key={item.id} className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="h-48 bg-gray-200">
                      {item.images && (
                        <img 
                          src={JSON.parse(item.images)[0]?.url || JSON.parse(item.images)[0]?.thumb} 
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold mb-2">{item.title}</h3>
                      <div className="text-sm text-gray-600">
                        {item.province}{item.city} {item.area_mu}亩
                      </div>
                      <div className="mt-2 text-red-600 font-bold">{item.price_year}万/年</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
