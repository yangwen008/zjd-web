import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="text-6xl mb-4">🏚️</div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
        <p className="text-gray-500 mb-6">
          这块地还没被收录，或者已经被流转了。
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/search"
            className="bg-[#1a4731] hover:bg-[#2d5a45] text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            搜索资产
          </Link>
          <Link
            href="/"
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}
