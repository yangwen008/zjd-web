import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '热点寻源榜 - z.zjd.cn 乡村闲置资产数字交易所',
  description: '按省份浏览乡村资产热门区域，发现最具流转价值的乡村资产。实时更新浏览量排行。',
  keywords: '乡村资产热点,宅基地热门区域,乡村资产排行,流转热点',
  alternates: { canonical: '/regions' },
  openGraph: {
    title: '热点寻源榜 - z.zjd.cn',
    description: '按省份浏览乡村资产热门区域，发现最具流转价值的资产。',
    url: 'https://z.zjd.cn/regions',
  },
};

export default function RegionsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
