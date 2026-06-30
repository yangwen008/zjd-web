'use client';

import { usePathname } from 'next/navigation';
import { Menu, Search, Bell, User, LogOut } from 'lucide-react';
import { adminMenuGroups } from '@/lib/admin-menu-config';

interface AdminTopbarProps {
  toggleSidebar: () => void;
  userName?: string;
}

export default function AdminTopbar({ toggleSidebar, userName = 'Admin' }: AdminTopbarProps) {
  const pathname = usePathname();

  // 简单解析面包屑
  const getBreadcrumbs = () => {
    const crumbs = [{ name: '首页', href: '/admin' }];
    
    // 遍历菜单配置找到当前路径对应的名称
    for (const group of adminMenuGroups) {
      const activeItem = group.items.find(item => 
        item.href === '/' ? pathname === '/' : pathname === item.href || pathname.startsWith(item.href + '/')
      );
      if (activeItem) {
        crumbs.push({ name: activeItem.name, href: activeItem.href });
        break;
      }
    }
    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm z-10">
      {/* 左侧：折叠按钮 + 面包屑 */}
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar}
          className="p-2 rounded-md hover:bg-gray-100 text-gray-600 transition-colors"
          title="折叠/展开侧边栏"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        <nav className="flex items-center text-sm text-gray-500">
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.href} className="flex items-center">
              {index > 0 && <span className="mx-2 text-gray-300">/</span>}
              <span className={index === breadcrumbs.length - 1 ? 'text-gray-900 font-medium' : ''}>
                {crumb.name}
              </span>
            </div>
          ))}
        </nav>
      </div>

      {/* 右侧：工具区 */}
      <div className="flex items-center gap-4">
        {/* 全局搜索框 (占位) */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="搜索资产/用户 (Cmd+K)" 
            className="pl-9 pr-4 py-1.5 w-64 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* 通知铃铛 */}
        <button className="p-2 rounded-full hover:bg-gray-100 text-gray-600 relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* 用户头像与下拉 */}
        <div className="flex items-center gap-2 pl-4 border-l border-gray-200">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="hidden md:block text-sm">
            <p className="font-medium text-gray-900">{userName}</p>
            <p className="text-xs text-gray-500">超级管理员</p>
          </div>
          <button className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500" title="退出登录">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}