'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function ClientShell({ config, children }: { config: any; children: React.ReactNode }) {
  const pathname = usePathname();
  
  // 【核心逻辑升级】：如果是 Admin 或 Dashboard 后台路径，坚决不渲染 Navbar 和 Footer
  const isBackend = pathname.startsWith('/admin') || pathname.startsWith('/dashboard');

  // 百度自动推送：每次页面访问时把 URL 推送给百度
  useEffect(() => {
    if (isBackend) return;
    try {
      const bp = (window as any).baidu_push_urls = (window as any).baidu_push_urls || [];
      bp.push(location.href);
      if (!document.getElementById('baidu-push')) {
        const s = document.createElement('script');
        s.id = 'baidu-push';
        s.src = 'https://zz.bdstatic.com/linksubmit/push.js';
        s.async = true;
        document.body.appendChild(s);
      }
    } catch {}
  }, [pathname, isBackend]);

  if (isBackend) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      {children}
      <Footer config={config} />
    </>
  );
}
