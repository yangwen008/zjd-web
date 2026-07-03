export const runtime = 'edge';
export const revalidate = 300;

import type { Metadata, Viewport } from 'next';
import './globals.css';
import { getHomepageConfig } from '@/lib/data';

// 引入我们新建的路由守卫组件
import ClientShell from '@/components/ClientShell';

export async function generateMetadata(): Promise<Metadata> {
  try {
    const config = await getHomepageConfig();
    return {
      title: 'zjd.cn - 乡村闲置资产数字交易所',
      description: config.footer_about || '乡村资产数字化绿色流转中枢。全网多源产权低频提纯，一键交叉碰撞，让技术重归山川。',
      keywords: '乡村资产,闲置资产,宅基地,农房,流转,数字交易所',
      icons: {
        icon: '/favicon.ico',
      },
      openGraph: {
        title: 'zjd.cn - 乡村闲置资产数字交易所',
        description: config.footer_about || '乡村资产数字化绿色流转中枢。',
        type: 'website',
        locale: 'zh_CN',
        images: [{ url: 'https://zjd.cn/logo.png', width: 512, height: 512 }],
      },
      twitter: {
        card: 'summary_large_image',
        title: 'zjd.cn - 乡村闲置资产数字交易所',
        description: config.footer_about || '乡村资产数字化绿色流转中枢。',
        images: ['https://zjd.cn/logo.png'],
      },
    };
  } catch {
    return {
      title: 'zjd.cn - 乡村闲置资产数字交易所',
      description: '乡村资产数字化绿色流转中枢。',
      openGraph: {
        title: 'zjd.cn - 乡村闲置资产数字交易所',
        description: '乡村资产数字化绿色流转中枢。',
        images: [{ url: 'https://zjd.cn/logo.png', width: 512, height: 512 }],
      },
    };
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // 【修复点】：使用 `as any` 替代 `as Record<string, any>`，彻底防止复制时尖括号被吞导致 TS 报错！
  const config = await getHomepageConfig().catch(() => ({} as any));

  return (
    <html lang="zh-CN">
      <body className="bg-[#F9F9F8] text-gray-900 antialiased">
        {/* 用 ClientShell 包裹，实现前台/后台的 Navbar 和 Footer 物理隔离 */}
        <ClientShell config={config}>
          {children}
        </ClientShell>
      </body>
    </html>
  );
}
