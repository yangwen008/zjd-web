'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Asset {
  id: number;
  title: string;
  images: string | null;
  source_type: string;
  views: number;
  location: string | null;
  province: string | null;
  city: string | null;
  price_year: number | null;
  area_mu: number | null;
}

interface BulkProject {
  id: number;
  title: string;
  location: string | null;
  province: string | null;
  city: string | null;
  price_start: number | null;
  area_sqm: number | null;
  area_mu: number | null;
}

interface Props {
  assets: Asset[];
  bulkProjects: BulkProject[];
}

const TABS = [
  { key: 'assets', label: '在架资产', icon: '🏘️' },
  { key: 'bulk', label: '大宗项目', icon: '🏢' },
] as const;

type TabKey = typeof TABS[number]['key'];

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

export default function PublisherContentTabs({ assets, bulkProjects }: Props) {
  // 默认选中有内容的第一个 tab
  const defaultTab: TabKey = assets.length > 0 ? 'assets' : bulkProjects.length > 0 ? 'bulk' : 'assets';
  const [activeTab, setActiveTab] = useState<TabKey>(defaultTab);

  return (
    <div className="space-y-6">
      {/* Tab 栏 */}
      <div className="flex items-center space-x-1 bg-gray-100 rounded-xl p-1">
        {TABS.map((tab) => {
          const count = tab.key === 'assets' ? assets.length : bulkProjects.length;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                isActive ? 'bg-brand-green/10 text-brand-green' : 'bg-gray-200 text-gray-500'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 资产列表 */}
      {activeTab === 'assets' && (
        assets.length > 0 ? (
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
        )
      )}

      {/* 大宗项目 */}
      {activeTab === 'bulk' && (
        bulkProjects.length > 0 ? (
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
        ) : (
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-3">📭</div>
            <p>暂无大宗项目</p>
          </div>
        )
      )}
    </div>
  );
}
