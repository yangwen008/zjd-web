import { 
  LayoutDashboard, Building2, Users, Spider, Settings, 
  FileText, UserCheck, Handshake, Globe, Database, Cpu, 
  Shield, Key, ScrollText 
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export interface MenuItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

export interface MenuGroup {
  title: string;
  icon: LucideIcon;
  items: MenuItem[];
}

// V3.0 规划的全量分组折叠菜单
export const adminMenuGroups: MenuGroup[] = [
  {
    title: '工作台',
    icon: LayoutDashboard,
    items: [
      { name: '数据大盘', href: '/admin', icon: LayoutDashboard },
      { name: '大宗撮合池', href: '/admin/deals', icon: Handshake },
    ],
  },
  {
    title: '资产运营',
    icon: Building2,
    items: [
      { name: '资产审核', href: '/admin/assets', icon: FileText },
      { name: '线索/意向管理', href: '/admin/leads', icon: UserCheck },
    ],
  },
  {
    title: '用户与渠道',
    icon: Users,
    items: [
      { name: '全量用户管理', href: '/admin/users', icon: Users },
      { name: '大宗认证审核', href: '/admin/vip-audit', icon: Shield },
      { name: '合伙人/村委绩效', href: '/admin/partners', icon: Globe },
    ],
  },
  {
    title: '数据与爬虫',
    icon: Spider,
    items: [
      { name: '爬虫任务配置', href: '/admin/scrapers', icon: Spider },
      { name: '原始数据池', href: '/admin/raw-data', icon: Database },
      { name: 'AI 清洗日志', href: '/admin/ai-logs', icon: Cpu },
    ],
  },
  {
    title: '系统设置',
    icon: Settings,
    items: [
      { name: '数据字典', href: '/admin/dict', icon: ScrollText },
      { name: 'R2/API 配置', href: '/admin/config', icon: Key },
      { name: '操作审计日志', href: '/admin/logs', icon: Shield },
    ],
  },
];