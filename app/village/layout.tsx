import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '村委直发 - z.zjd.cn 乡村闲置资产数字交易所',
  description: '村集体官方直发资产，已完成权属核查，一手信息无中间环节。宅基地、林地、集体建设用地。',
  keywords: '村委直发,村集体资产,宅基地直租,乡村一手资产',
  alternates: { canonical: '/village' },
  openGraph: {
    title: '村委直发 - z.zjd.cn',
    description: '村集体官方直发资产，一手信息无中间环节。',
    url: 'https://z.zjd.cn/village',
  },
};

export default function VillageLayout({ children }: { children: React.ReactNode }) {
  return children;
}
