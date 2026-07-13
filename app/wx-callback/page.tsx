export const runtime = 'edge';

import { redirect } from 'next/navigation';

/**
 * 微信 OAuth 回调页面
 * 只负责将请求重定向到 Route Handler /api/auth/wx/callback
 * 因为 cookies 只能在 Route Handler 中设置
 */
export default async function WxCallbackPage({ searchParams }: { searchParams: Promise<{ code?: string; state?: string; redirect?: string; mode?: string }> }) {
  const params = await searchParams;
  const code = params.code;
  const redirectPath = params.redirect || '/';
  const mode = params.mode || 'login';

  if (!code) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl p-8 max-w-md text-center">
          <div className="text-4xl mb-4">❌</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">微信授权失败</h1>
          <p className="text-gray-500 mb-4">未收到授权码，请重试</p>
          <a href={mode === 'bind' ? '/dashboard/profile' : '/login'} className="text-brand-green hover:underline">返回</a>
        </div>
      </div>
    );
  }

  // 重定向到 Route Handler，由它完成 token 换取、用户注册、cookie 设置
  redirect(`/api/auth/wx/callback?code=${code}&redirect=${encodeURIComponent(redirectPath)}&mode=${mode}`);
}
