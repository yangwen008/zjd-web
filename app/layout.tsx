export const runtime = 'edge';

import type { Metadata, Viewport } from 'next';
import './globals.css';
import { getHomepageConfig } from '@/lib/data';

// 【修改点 1】：引入我们新建的 ClientShell
import ClientShell from '@/components/ClientShell';

export async function generateMetadata(): Promise<Metadata> {
  // ... 这里保持您原来的代码完全不变 ...
  try {
    const config = await getHomepageConfig();
    return {
      title: 'zjd.cn - 乡村闲置资产数字交易所',
      description: config.footer_about || '乡村资产数字化绿色流转中枢。全网多源产权低频提纯，一键交叉碰撞，让技术重归山川。',
      // ... 其他保持不变
    };
  } catch {
    return {
      title: 'zjd.cn - 乡村闲置资产数字交易所',
      description: '乡村资产数字化绿色流转中枢。',
    };
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const config = await getHomepageConfig().catch(() => ({} as Record));

  return (
    <html lang="zh-CN">
      <body className="bg-[#F9F9F8] text-gray-900 antialiased">
        {/* 【修改点 2】：用 ClientShell 包裹 children，把 config 传进去 */}
        <ClientShell config={config}>
          {children}
        </ClientShell>
      </body>
    </html>
  );
}
