import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'zjd.cn - 乡村闲置资产数字交易所',
  description: '乡村资产数字化绿色流转中枢。全网多源产权低频提纯，一键交叉碰撞，让技术重归山川。',
  keywords: '乡村资产,闲置资产,宅基地,农房,流转,数字交易所',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="bg-white text-gray-800 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
