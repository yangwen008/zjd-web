import type { Metadata } from 'next';
import './globals.css';
import { getHomepageConfig } from '@/lib/data';

export async function generateMetadata(): Promise<Metadata> {
  try {
    const config = await getHomepageConfig();
    return {
      title: 'zjd.cn - 乡村闲置资产数字交易所',
      description: config.footer_about || '乡村资产数字化绿色流转中枢。全网多源产权低频提纯，一键交叉碰撞，让技术重归山川。',
      keywords: '乡村资产,闲置资产,宅基地,农房,流转,数字交易所',
    };
  } catch {
    return {
      title: 'zjd.cn - 乡村闲置资产数字交易所',
      description: '乡村资产数字化绿色流转中枢。',
    };
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="bg-white text-gray-800 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
