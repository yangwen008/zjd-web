'use client';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="text-6xl mb-4">😵</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">出了点问题</h1>
        <p className="text-gray-500 mb-6">
          页面加载时遇到了错误，请稍后再试。
        </p>
        {process.env.NODE_ENV === 'development' && (
          <pre className="text-left text-xs bg-gray-100 rounded-lg p-4 mb-4 overflow-auto max-h-40 text-red-600">
            {error.message}
          </pre>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="bg-[#1a4731] hover:bg-[#2d5a45] text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            重试
          </button>
          <a
            href="/"
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            返回首页
          </a>
        </div>
      </div>
    </div>
  );
}
