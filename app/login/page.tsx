'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    setIsMobile(/Android|iPhone|iPad|iPod|Mobile/i.test(ua));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });
      const data = await res.json() as any;

      if (data.success) {
        window.location.href = '/dashboard';
      } else if (data.pending) {
        window.location.href = '/pending-review';
      } else {
        setError(data.error || '登录失败');
      }
    } catch {
      setError('网络错误，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9F8] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-block">
              <span className="text-3xl font-black tracking-tight text-[#2C4C3B]">
                zjd<span className="text-[#D4AF37]">.cn</span>
              </span>
            </Link>
            <h1 className="text-xl font-bold text-gray-900 mt-4">安全登录</h1>
            <p className="text-sm text-gray-500 mt-1">登录后管理您的资产和数据</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">手机号</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="请输入手机号"
                maxLength={11}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-[#2C4C3B] focus:ring-1 focus:ring-[#2C4C3B] transition-colors"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-[#2C4C3B] focus:ring-1 focus:ring-[#2C4C3B] transition-colors"
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl border border-red-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2C4C3B] hover:bg-[#1E3529] text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              还没有账号？{' '}
              <Link href="/register" className="text-[#2C4C3B] font-medium hover:underline">
                立即注册
              </Link>
            </p>
          </div>

          {/* 微信登录 - 根据设备显示不同按钮 */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            {isMobile ? (
              /* 手机端：微信授权登录 */
              <a
                href="/api/auth/wx/login?redirect=/"
                className="w-full flex items-center justify-center space-x-2 py-3 border border-green-200 rounded-xl hover:bg-green-50 transition-colors"
              >
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178A1.17 1.17 0 014.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178 1.17 1.17 0 01-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 01.598.082l1.584.926a.272.272 0 00.14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 01-.023-.156.49.49 0 01.201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-7.062-6.122zm-2.18 2.769c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.97-.982z"/>
                </svg>
                <span className="text-sm text-green-700 font-medium">微信一键登录</span>
              </a>
            ) : (
              /* PC端：微信扫码登录 */
              <a
                href="/wx-scan-login"
                className="w-full flex items-center justify-center space-x-2 py-3 border border-green-200 rounded-xl hover:bg-green-50 transition-colors"
              >
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 3h6v2H5v4H3V3zm12 0h6v6h-2V5h-4V3zM3 15h2v4h4v2H3v-6zm16 0h2v6h-6v-2h4v-4z"/>
                </svg>
                <span className="text-sm text-green-700 font-medium">微信扫码登录</span>
              </a>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          登录即表示同意《用户协议》和《隐私政策》</p>
      </div>
    </div>
  );
}
