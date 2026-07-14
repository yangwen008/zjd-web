import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '大宗路演 - zjd.cn 乡村闲置资产数字交易所',
  description: '乡村大宗资产项目路演，包含文旅项目、产业园区、整村流转等大额资产。支持参投认购。',
  keywords: '乡村大宗资产,文旅项目路演,整村流转,乡村产业投资',
  alternates: { canonical: '/bulk-projects' },
  openGraph: {
    title: '大宗路演 - zjd.cn',
    description: '乡村大宗资产项目路演，支持参投认购。',
    url: 'https://zjd.cn/bulk-projects',
  },
};

export default function BulkProjectsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
