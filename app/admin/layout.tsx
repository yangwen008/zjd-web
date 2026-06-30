'use client';

import { useState } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminTopbar from './AdminTopbar';

// 【修复点】：明确定义接口，接收服务端传来的 userName
interface AdminLayoutClientProps {
  children: React.ReactNode;
  userName: string;
}

export default function AdminLayoutClient({ children, userName }: AdminLayoutClientProps) {
  const [collapsed, setCollapsed] = useState(false);

  const toggleSidebar = () => setCollapsed(!collapsed);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* 左侧导航 */}
      <AdminSidebar collapsed={collapsed} />

      {/* 右侧主区域 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 顶部工具栏：直接接收服务端传来的 userName */}
        <AdminTopbar toggleSidebar={toggleSidebar} userName={userName} />

        {/* 内容区 */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}