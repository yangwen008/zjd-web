'use client';

import Link from 'next/link';

interface Props {
  currentPage: number;
  totalPages: number;
  /** 生成页码 URL 的基础路径，如 /publisher/17 */
  basePath: string;
}

export default function Pagination({ currentPage, totalPages, basePath }: Props) {
  if (totalPages <= 1) return null;

  // 生成页码数组，最多显示 7 个页码
  const pages: (number | '...')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push('...');
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  const buildUrl = (p: number) => `${basePath}?page=${p}`;

  return (
    <nav className="flex items-center justify-center space-x-1 mt-8">
      {/* 上一页 */}
      {currentPage > 1 ? (
        <Link
          href={buildUrl(currentPage - 1)}
          className="px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          ← 上一页
        </Link>
      ) : (
        <span className="px-3 py-2 text-sm text-gray-300 bg-gray-50 border border-gray-100 rounded-lg cursor-not-allowed">
          ← 上一页
        </span>
      )}

      {/* 页码 */}
      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`dots-${i}`} className="px-2 py-2 text-sm text-gray-400">...</span>
        ) : p === currentPage ? (
          <span
            key={p}
            className="px-3 py-2 text-sm font-medium text-white bg-brand-green rounded-lg"
          >
            {p}
          </span>
        ) : (
          <Link
            key={p}
            href={buildUrl(p)}
            className="px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {p}
          </Link>
        )
      )}

      {/* 下一页 */}
      {currentPage < totalPages ? (
        <Link
          href={buildUrl(currentPage + 1)}
          className="px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          下一页 →
        </Link>
      ) : (
        <span className="px-3 py-2 text-sm text-gray-300 bg-gray-50 border border-gray-100 rounded-lg cursor-not-allowed">
          下一页 →
        </span>
      )}
    </nav>
  );
}
