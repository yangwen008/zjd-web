import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '资产搜索 - zjd.cn 乡村闲置资产数字交易所',
  description: '搜索全国乡村闲置资产，包括宅基地、林地、茶园、厂房等。支持按省份、面积、价格筛选，一键找到理想资产。',
  keywords: '乡村资产搜索,宅基地搜索,闲置资产查找,农房搜索,林地搜索',
  alternates: { canonical: '/search' },
  openGraph: {
    title: '资产搜索 - zjd.cn',
    description: '搜索全国乡村闲置资产，支持多维度筛选。',
    url: 'https://zjd.cn/search',
  },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
