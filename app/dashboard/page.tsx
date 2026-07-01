'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface UserInfo {
  id: number; nickname: string; role: string; role_label: string; permissions: string[];
}

interface Stats {
  totalAssets: number; approvedAssets: number; pendingAssets: number; totalViews: number;
  totalLeads: number; totalFavorites: number; totalBulk: number; totalInfra: number;
}

export default function DashboardPage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then((r) => r.json()),
      fetch('/api/dashboard/stats').then((r) => r.json()).catch(() => ({ data: null })),
    ]).then(([auth, statData]: any[]) => {
      if (auth.success) setUser(auth.user);
      if (statData?.data) setStats(statData.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-16 text-gray-400">加载中...</div>;
  if (!user) return null;

  const s = stats || { totalAssets: 0, approvedAssets: 0, pendingAssets: 0, totalViews: 0, totalLeads: 0, totalFavorites: 0, totalBulk: 0, totalInfra: 0 };

  // 根据角色显示不同统计卡片（增加 href 跳转）
  const getCards = () => {
    const cards = [
      { label: '我的发布', value: s.totalAssets, icon: '🏠', color: 'text-blue-600', bg: 'bg-blue-50', href: '/dashboard/assets' },
      { label: '已上架', value: s.approvedAssets, icon: '✅', color: 'text-green-600', bg: 'bg-green-50', href: '/dashboard/assets?status=approved' },
      { label: '审核中', value: s.pendingAssets, icon: '', color: 'text-orange-600', bg: 'bg-orange-50', href: '/dashboard/assets?status=pending' },
      { label: '总浏览量', value: s.totalViews, icon: '👀', color: 'text-purple-600', bg: 'bg-purple-50', href: '#' },
    ];
    if (['broker', 'village_org', 'admin', 'superadmin'].includes(user.role)) {
      cards.push({ label: '线索数', value: s.totalLeads, icon: '📋', color: 'text-cyan-600', bg: 'bg-cyan-50', href: '/dashboard/leads' });
    }
    if (['user', 'broker', 'village_org', 'admin', 'superadmin'].includes(user.role)) {
      cards.push({ label: '收藏数', value: s.totalFavorites, icon: '❤️', color: 'text-rose-600', bg: 'bg-rose-50', href: '/dashboard/favorites' });
    }
    if (['project_publisher', 'admin', 'superadmin'].includes(user.role)) {
      cards.push({ label: '大宗项目', value: s.totalBulk, icon: '🏢', color: 'text-yellow-600', bg: 'bg-yellow-50', href: '/dashboard/bulk-projects' });
    }
    if (['data_editor', 'admin', 'superadmin'].includes(user.role)) {
      cards.push({ label: '基建数据', value: s.totalInfra, icon: '📡', color: 'text-indigo-600', bg: 'bg-indigo-50', href: '/dashboard/infra' });
    }
    return cards;
  };

  const cards = getCards();

  // 快捷操作
  const quickActions = [
    { label: '发布新资产', desc: '发布您的闲置资产', href: '/dashboard/assets/new', icon: '➕', roles: ['user', 'broker', 'village_org', 'project_publisher', 'admin', 'superadmin'] },
    { label: '查看我的资产', desc: '管理已发布的资产', href: '/dashboard/assets', icon: '🏠', roles: ['user', 'broker', 'village_org', 'project_publisher', 'admin', 'superadmin'] },
    { label: '发布大宗项目', desc: '发布大型路演项目', href: '/dashboard/bulk-projects', icon: '🏢', roles: ['project_publisher', 'admin', 'superadmin'] },
    { label: '查看线索', desc: '跟进客户意向', href: '/dashboard/leads', icon: '📋', roles: ['broker', 'village_org', 'project_publisher', 'admin', 'superadmin'] },
    { label: '修改个人资料', desc: '更新个人信息', href: '/dashboard/profile', icon: '👤', roles: ['user', 'broker', 'village_org', 'data_editor', 'project_publisher', 'admin', 'superadmin'] },
  ].filter((a) => a.roles.includes(user.role));

  // 时间段问候
  const hour = new Date().getHours();
  const greeting = hour < 12 ? '🌞 早上好' : hour < 18 ? '️ 下午好' : '🌙 晚上好';

  return (
    <div className="max-w-5xl">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{greeting}，{user.nickname}</h1>
        <p className="text-gray-500 mt-1">
          身份：{user.role_label}
          {user.role === 'broker' && ' · 您可以发布房源、查看客户线索'}
          {user.role === 'village_org' && ' · 您可以发布村委直发资产、查看线索'}
          {user.role === 'user' && ' · 您可以发布闲置资产、收藏感兴趣的资产'}
          {user.role === 'data_editor' && ' · 您可以录入和维护基建数据'}
          {user.role === 'project_publisher' && ' · 您可以发布大宗路演项目'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className={`block ${c.bg} rounded-xl p-5 border border-gray-200/60 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer`}>
            <div className="w-12 h-12 rounded-lg bg-white/60 flex items-center justify-center text-2xl mb-2">{c.icon}</div>
            <div className="text-xs text-gray-500">{c.label}</div>
            <div className={`text-2xl font-bold ${c.color} font-mono`}>{c.value.toLocaleString()}</div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-8 shadow-sm">
        <h2 className="font-bold text-gray-900 mb-4">⚡ 快捷操作</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {quickActions.map((a) => (
            <Link key={a.href} href={a.href} className="flex items-center space-x-3 p-4 rounded-xl border border-gray-100 hover:border-brand-green/30 hover:bg-brand-green/5 hover:shadow-sm transition-all">
              <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-xl">{a.icon}</div>
              <div>
                <div className="text-sm font-medium text-gray-900">{a.label}</div>
                <div className="text-xs text-gray-500">{a.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Tips by role */}
      {user.role === 'user' && (
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
          <h3 className="font-bold text-blue-900 mb-2">💡 升级为合伙人</h3>
          <p className="text-sm text-blue-700 mb-3">如果您是专业的农房经纪人，可以申请成为合伙人，享受更多功能：</p>
          <ul className="text-sm text-blue-700 space-y-1 mb-3">
            <li>• 发布的资产会显示在合伙人主页</li>
            <li>• 查看谁解锁了您的资产联系方式</li>
            <li>• 获得金牌/银牌/铜牌认证</li>
          </ul>
          <Link href="/register" className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            申请成为合伙人
          </Link>
        </div>
      )}

      {user.role === 'broker' && (
        <div className="bg-green-50 rounded-xl p-6 border border-green-200">
          <h3 className="font-bold text-green-900 mb-2">🤝 合伙人专区</h3>
          <p className="text-sm text-green-700 mb-3">作为合伙人，您可以：</p>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• 发布您管辖区域的房源信息</li>
            <li>• 查看客户线索，及时跟进</li>
            <li>• 在个人主页展示您的专业领域和业绩</li>
          </ul>
        </div>
      )}

      {user.role === 'village_org' && (
        <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
          <h3 className="font-bold text-purple-900 mb-2">🏛️ 村集体专区</h3>
          <p className="text-sm text-purple-700 mb-3">作为村集体，您可以：</p>
          <ul className="text-sm text-purple-700 space-y-1">
            <li>• 发布村委直发资产，显示在前台 "村集体直发专区"</li>
            <li>• 上传村委授权书，增强资产可信度</li>
            <li>• 查看谁对您的资产感兴趣</li>
          </ul>
        </div>
      )}
    </div>
  );
}
