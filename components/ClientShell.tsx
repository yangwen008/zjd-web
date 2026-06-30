'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function ClientShell({ config, children }: { config: any; children: React.ReactNode }) {
  const pathname = usePathname();
  
  // 【核心逻辑升级】：如果是 Admin 或 Dashboard 后台路径，坚决不渲染 Navbar 和 Footer
  const isBackend = pathname.startsWith('/admin') || pathname.startsWith('/dashboard');

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
