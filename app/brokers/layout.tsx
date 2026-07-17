import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '合伙人名册 - z.zjd.cn 乡村闲置资产数字交易所',
  description: '全国乡村资产合伙人名册，金牌合伙人提供专业带看、评估、撮合服务。按省份筛选本地合伙人。',
  keywords: '乡村资产合伙人,农房经纪人,宅基地中介,乡村资产代理',
  alternates: { canonical: '/brokers' },
  openGraph: {
    title: '合伙人名册 - z.zjd.cn',
    description: '全国乡村资产合伙人名册，专业带看评估服务。',
    url: 'https://z.zjd.cn/brokers',
  },
};

export default function BrokersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
