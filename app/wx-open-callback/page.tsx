'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function WxOpenCallbackPage() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('正在处理微信登录...');

  useEffect(() => {
    if (!code) {
      setStatus('error');
      setMessage('授权参数缺失，请重试');
      return;
    }

    const doLogin = async () => {
      try {
        const res = await fetch('/api/auth/wx/open-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, redirect: '/' }),
        });
        const data = await res.json() as any;

        if (data.success) {
          setStatus('success');
          setMessage(`登录成功！欢迎回来，${data.user?.nickname || '用户'}`);
          setTimeout(() => {
            window.location.href = data.redirect || '/dashboard';
          }, 1000);
        } else {
          setStatus('error');
          setMessage(data.error || '登录失败');
        }
      } catch {
        setStatus('error');
        setMessage('网络错误，请稍后再试');
      }
    };

    doLogin();
  }, [code]);

  return (
    <div className="min-h-screen bg-[#F9F9F8] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
        {status === 'loading' && (
          <>
            <div className="text-4xl mb-4">⏳</div>
            <p className="text-gray-600">{message}</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="text-4xl mb-4">✅</div>
            <p className="text-green-600 font-medium">{message}</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="text-4xl mb-4">❌</div>
            <p className="text-red-600 font-medium">{message}</p>
            <a href="/login" className="inline-block mt-4 text-sm text-[#2C4C3B] hover:underline">
              返回登录页
            </a>
          </>
        )}
      </div>
    </div>
  );
}
