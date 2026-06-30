'use client';

import { usePathname } from 'next/navigation';
// 引入您原有的组件（路径完全照抄您的 layout.tsx）
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function ClientShell({ config, children }: { config: any; children: React.ReactNode }) {
  const pathname = usePathname();
  
  // 【核心逻辑】：如果是后台路径，坚决不渲染 Navbar 和 Footer
  const isAdmin = pathname.startsWith('/admin');

  return (
    <>
      {!isAdmin && <Navbar />}
      {children}
      {!isAdmin && <Footer config={config} />}
    </>
  );
}