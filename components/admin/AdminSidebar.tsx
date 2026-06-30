'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { adminMenuGroups, MenuGroup } from '@/lib/admin-menu-config';
import { cn } from '@/lib/utils'; // 如果您没有 cn 工具函数，请看下方说明

// 如果您项目中没有 lib/utils.ts 和 cn 函数，请将下面的 cn 替换为简单的字符串拼接：
// const cn = (...classes: string[]) => classes.filter(Boolean).join(' ');
function cn(...classes: (string | undefined | boolean)[]) {
  return classes.filter(Boolean).join(' ');
}

interface AdminSidebarProps {
  collapsed: boolean;
}

export default function AdminSidebar({ collapsed }: AdminSidebarProps) {
  const pathname = usePathname();
  // 记录哪些分组是展开的，默认展开当前路由所在的分组
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // 初始化时，自动展开当前页所在的菜单组
  useEffect(() => {
    const initialExpanded: Record<string, boolean> = {};
    adminMenuGroups.forEach(group => {
      const isActive = group.items.some(item => 
        item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
      );
      if (isActive) initialExpanded[group.title] = true;
    });
    setExpandedGroups(initialExpanded);
  }, [pathname]);

  const toggleGroup = (title: string) => {
    if (collapsed) return; // 侧边栏收起时，不响应分组点击
    setExpandedGroups(prev => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <aside 
      className={cn(
        "h-screen bg-slate-900 text-slate-300 flex flex-col transition-all duration-300 ease-in-out shadow-lg z-20",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo 区域 */}
      <div className="h-16 flex items-center justify-center border-b border-slate-700 px-4">
        {collapsed ? (
          <span className="text-2xl font-bold text-blue-400">Z</span>
        ) : (
          <h1 className="text-xl font-bold text-white tracking-wide">金禾 Admin</h1>
        )}
      </div>

      {/* 菜单列表 */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1 scrollbar-thin scrollbar-thumb-slate-700">
        {adminMenuGroups.map((group) => {
          const isExpanded = expandedGroups[group.title] || false;
          const GroupIcon = group.icon;

          return (
            <div key={group.title} className="mb-2">
              {/* 分组标题 */}
              <button
                onClick={() => toggleGroup(group.title)}
                className={cn(
                  "w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-800 transition-colors",
                  collapsed && "justify-center"
                )}
                title={collapsed ? group.title : ''}
              >
                <div className="flex items-center gap-3">
                  <GroupIcon className="w-5 h-5 text-slate-400" />
                  {!collapsed && <span className="text-sm font-medium text-slate-200">{group.title}</span>}
                </div>
                {!collapsed && (
                  isExpanded ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />
                )}
              </button>

              {/* 子菜单 */}
              {!collapsed && isExpanded && (
                <div className="mt-1 ml-4 space-y-1 border-l border-slate-700 pl-2">
                  {group.items.map((item) => {
                    const ItemIcon = item.icon;
                    // 精确匹配或前缀匹配（处理 /admin 和 /admin/assets 的情况）
                    const isActive = item.href === '/' 
                      ? pathname === '/' 
                      : pathname === item.href || pathname.startsWith(item.href + '/');

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all",
                          isActive 
                            ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" 
                            : "text-slate-400 hover:bg-slate-800 hover:text-white"
                        )}
                      >
                        <ItemIcon className="w-4 h-4" />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* 底部版权/版本 */}
      {!collapsed && (
        <div className="p-4 text-xs text-slate-500 border-t border-slate-700 text-center">
          v8.8.2 Edge-Native
        </div>
      )}
    </aside>
  );
}