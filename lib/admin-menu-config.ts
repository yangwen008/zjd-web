// 彻底移除 lucide-react，采用 Vercel/Linear 风格的 Letter Avatar 系统

export interface MenuItem {
  name: string;
  href: string;
  letter: string; // 首字母
  color: string;  // Tailwind 颜色类 (背景透明+文字高亮)
}

export interface MenuGroup {
  title: string;
  letter: string;
  color: string;
  items: MenuItem[];
}

// V3.0 规划的全量分组折叠菜单 (配色经过精心挑选，在深色背景下极具质感)
export const adminMenuGroups: MenuGroup[] = [
  {
    title: '工作台',
    letter: 'W',
    color: 'bg-blue-500/20 text-blue-400',
    items: [
      { name: '数据大盘', href: '/admin', letter: 'D', color: 'bg-blue-500/10 text-blue-300' },
      { name: '大宗撮合池', href: '/admin/deals', letter: 'M', color: 'bg-purple-500/10 text-purple-300' },
    ],
  },
  {
    title: '资产运营',
    letter: 'A',
    color: 'bg-emerald-500/20 text-emerald-400',
    items: [
      { name: '资产审核', href: '/admin/assets', letter: 'A', color: 'bg-emerald-500/10 text-emerald-300' },
      { name: '线索/意向', href: '/admin/leads', letter: 'L', color: 'bg-cyan-500/10 text-cyan-300' },
    ],
  },
  {
    title: '用户与渠道',
    letter: 'U',
    color: 'bg-amber-500/20 text-amber-400',
    items: [
      { name: '全量用户', href: '/admin/users', letter: 'U', color: 'bg-amber-500/10 text-amber-300' },
      { name: '大宗认证', href: '/admin/vip-audit', letter: 'V', color: 'bg-rose-500/10 text-rose-300' },
      { name: '合伙人绩效', href: '/admin/partners', letter: 'P', color: 'bg-indigo-500/10 text-indigo-300' },
    ],
  },
  {
    title: '数据与爬虫',
    letter: 'D',
    color: 'bg-orange-500/20 text-orange-400',
    items: [
      { name: '爬虫任务', href: '/admin/scrapers', letter: 'S', color: 'bg-slate-500/10 text-slate-300' },
      { name: '原始数据池', href: '/admin/raw-data', letter: 'R', color: 'bg-orange-500/10 text-orange-300' },
      { name: 'AI 清洗日志', href: '/admin/ai-logs', letter: 'I', color: 'bg-pink-500/10 text-pink-300' },
    ],
  },
  {
    title: '系统设置',
    letter: 'S',
    color: 'bg-gray-500/20 text-gray-400',
    items: [
      { name: '数据字典', href: '/admin/dict', letter: 'T', color: 'bg-teal-500/10 text-teal-300' },
      { name: 'R2/API 配置', href: '/admin/config', letter: 'C', color: 'bg-lime-500/10 text-lime-300' },
      { name: '操作审计', href: '/admin/logs', letter: 'G', color: 'bg-gray-500/10 text-gray-300' },
    ],
  },
];