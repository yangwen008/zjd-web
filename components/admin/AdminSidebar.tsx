'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { adminMenuGroups } from '@/lib/admin-menu-config';

// 内置极简 cn 函数，杜绝任何外部依赖冲突
function cn(...classes: (string | undefined | boolean)[]) {
  return classes.filter(Boolean).join(' ');
}

interface AdminSidebarProps {
  collapsed: boolean;
}

export default function AdminSidebar({ collapsed }: AdminSidebarProps) {
  const pathname = usePathname();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const initialExpanded: Record<string, boolean> = {};
    adminMenuGroups.forEach(group => {
      const isActive = group.items.some(item => 
        item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href)
      );
      if (isActive) initialExpanded[group.title] = true;
    });
    setExpandedGroups(initialExpanded);
  }, [pathname]);

  const toggleGroup = (title: string) => {
    if (collapsed) return;
    setExpandedGroups(prev => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <aside 
      className={cn(
        "h-screen bg-slate-900 text-slate-300 flex flex-col transition-all duration-300 ease-in-out shadow-lg z-20 border-r border-slate-800",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo 区域 */}
      <div className="h-16 flex items-center justify-center border-b border-slate-800 px-4">
        {collapsed ? (
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-600/30">
            Z
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-600/30">
              Z
            </div>
            <h1 className="text-lg font-bold text-white tracking-wide">金禾 Admin</h1>
          </div>
        )}
      </div>

      {/* 菜单列表 */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {adminMenuGroups.map((group) => {
          const isExpanded = expandedGroups[group.title] || false;

          return (
            <div key={group.title} className="mb-2">
              {/* 分组标题 */}
              <button
                onClick={() => toggleGroup(group.title)}
                className={cn(
                  "w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/50 transition-colors",
                  collapsed && "justify-center"
                )}
                title={collapsed ? group.title : ''}
              >
                <div className="flex items-center gap-3">
                  {/* 分组字母图标 */}
                  <div className={cn("w-6 h-6 rounded flex items-center justify-center text-xs font-bold", group.color)}>
                    {group.letter}
                  </div>
                  {!collapsed && <span className="text-sm font-medium text-slate-200">{group.title}</span>}
                </div>
                {!collapsed && (
                  <span className={cn(
                    "text-slate-500 text-xs transition-transform duration-200",
                    isExpanded && "rotate-90"
                  )}>
                    ▶
                  </span>
                )}
              </button>

              {/* 子菜单 */}
              {!collapsed && isExpanded && (
                <div className="mt-1 ml-3 space-y-1 border-l border-slate-800 pl-2">
                  {group.items.map((item) => {
                    const isActive = item.href === '/admin' 
                      ? pathname === '/admin' 
                      : pathname === item.href || pathname.startsWith(item.href + '/');

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 px-2 py-1.5 rounded-md text-sm transition-all",
                          isActive 
                            ? "bg-slate-800 text-white border-l-2 border-blue-500 -ml-[9px] pl-[11px]" 
                            : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                        )}
                      >
                        {/* 子菜单字母图标 */}
                        <div className={cn("w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold", item.color)}>
                          {item.letter}
                        </div>
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

      {/* 底部版本 */}
      {!collapsed && (
        <div className="p-4 text-xs text-slate-600 border-t border-slate-800 text-center font-mono">
          v8.8.2 Edge-Native
        </div>
      )}
    </aside>
  );
}