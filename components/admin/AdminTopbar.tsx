'use client';

import { usePathname } from 'next/navigation';
import { adminMenuGroups } from '@/lib/admin-menu-config';

interface AdminTopbarProps {
  toggleSidebar: () => void;
  userName?: string;
}

export default function AdminTopbar({ toggleSidebar, userName = 'Admin' }: AdminTopbarProps) {
  const pathname = usePathname();

  const getBreadcrumbs = () => {
    const crumbs = [{ name: '控制台', href: '/admin' }];
    for (const group of adminMenuGroups) {
      const activeItem = group.items.find(item => 
        item.href === '/admin' ? pathname === '/admin' : pathname === item.href || pathname.startsWith(item.href + '/')
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
          className="p-2 rounded-md hover:bg-gray-100 text-gray-600 transition-colors text-xl leading-none"
          title="折叠/展开侧边栏"
        >
          ☰ {/* 纯 Unicode 汉堡菜单 */}
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
        {/* 全局搜索框 (含纯 CSS 手绘搜索图标) */}
        <div className="relative hidden md:block">
          {/* 🌟 纯 CSS 绘制的搜索图标，无需任何图标库 */}
          <div className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-gray-400 rounded-full">
             <div className="w-1.5 h-0.5 bg-gray-400 absolute rotate-45 -bottom-1 -right-1"></div>
          </div>
          <input 
            type="text" 
            placeholder="全局搜索资产/用户 (Cmd+K)" 
            className="pl-9 pr-4 py-1.5 w-64 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        {/* 通知铃铛 (使用 Unicode 字符) */}
        <button className="p-2 rounded-full hover:bg-gray-100 text-gray-600 relative text-lg leading-none">
          🔔
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
        </button>

        {/* 用户信息 */}
        <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-md">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="hidden md:block text-sm">
            <p className="font-medium text-gray-900 leading-tight">{userName}</p>
            <p className="text-xs text-gray-500 leading-tight">超级管理员</p>
          </div>
          <button className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-red-500 transition-colors text-lg leading-none" title="退出登录">
            ⏻ {/* 极客风电源符号 */}
          </button>
        </div>
      </div>
    </header>
  );
}