import AdminLayoutClient from '@/components/admin/AdminLayoutClient';

export const metadata = {
  title: '金禾计划 - Admin 控制台',
};

// 【架构师修正】：
// 彻底移除服务端鉴权逻辑，完全交由客户端组件 (AdminLayoutClient) 处理。
// 这与 app/dashboard/layout.tsx 的架构保持完全一致，杜绝任何 import 报错。
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}