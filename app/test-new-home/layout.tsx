import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "zjd.cn - 寻找被低估的低密度空间资产（测试版）",
  description: "乡村资产数字化绿色流转中枢 - 新首页测试",
};

export default function TestHomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}