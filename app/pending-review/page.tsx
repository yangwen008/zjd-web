import Link from 'next/link';

export default function PendingReviewPage() {
  return (
    <div className="min-h-screen bg-[#F9F9F8] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="text-6xl mb-4">⏳</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">账号审核中</h1>
        <p className="text-gray-500 mb-6">
          您的账号正在等待管理员审核，审核通常在 1-3 个工作日内完成。
          <br />
          审核结果将通过短信通知您。
        </p>
        <div className="bg-gray-50 rounded-xl p-4 mb-6 text-sm text-gray-600">
          如有疑问，请联系：<strong className="text-[#2C4C3B]">13696266999</strong>
        </div>
        <Link
          href="/"
          className="inline-block bg-[#2C4C3B] hover:bg-[#1E3529] text-white px-8 py-3 rounded-xl font-medium transition-colors"
        >
          返回首页
        </Link>
      </div>
    </div>
  );
}
