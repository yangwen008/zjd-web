'use client';

import { useState } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminTopbar from './AdminTopbar';

export default function AdminLayoutClient({ 
  children, 
  userName 
}: { 
  children: React.ReactNode;
  userName?: string;
}) {
  const [collapsed, setCollapsed] = useState(false);

  const toggleSidebar = () => setCollapsed(!collapsed);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* 左侧导航 */}
      <AdminSidebar collapsed={collapsed} />

      {/* 右侧主区域 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 顶部工具栏 */}
        <AdminTopbar toggleSidebar={toggleSidebar} userName={userName} />

        {/* 内容区 */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* 这里就是各个 admin 页面的 children */}
          {children}
        </main>
      </div>
    </div>
  );
}