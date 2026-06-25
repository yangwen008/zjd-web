export const runtime = 'edge';

import type { Metadata, Viewport } from 'next';
import './globals.css';
import { getHomepageConfig } from '@/lib/data';

// 【新增1】：引入全局导航栏和全局页脚组件
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

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
      },
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

// 【修改1】：加上 async，使其成为异步服务端组件，以便在内部获取数据库数据
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  
  // 【新增2】：在这里获取全局配置，并传递给底部的 Footer 组件
  const config = await getHomepageConfig().catch(() => ({} as Record<string, string>));

  return (
    <html lang="zh-CN">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      
      {/* 【修改2】：将 bg-white 改为 zjd.cn 专属的全局浅灰白背景 #F9F9F8 */}
      <body className="bg-[#F9F9F8] text-gray-800 font-sans antialiased">
        
        {/* 【新增3】：全局挂载导航栏，所有页面顶部都会自动显示 */}
        <Navbar />
        
        {/* 页面主体内容（首页、二级页等） */}
        {children}
        
        {/* 【新增4】：全局挂载页脚，并传入 config 数据。
            这意味着：无论用户在哪个页面，底部都会显示同一个页脚；
            并且，当您在后台修改了公司名、电话等信息后，全站页脚会自动同步更新！ */}
        <Footer config={config} />
        
      </body>
    </html>
  );
}
