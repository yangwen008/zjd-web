'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function WxBindCallbackPage() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') || 'register';
  const code = searchParams.get('code');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('正在处理微信授权...');

  useEffect(() => {
    if (!code) {
      setStatus('error');
      setMessage('授权参数缺失，请重试');
      return;
    }

    const doBind = async () => {
      try {
        if (mode === 'register') {
          // 注册模式：获取 openid，存到 sessionStorage，跳回注册页
          const res = await fetch(`/api/auth/wx/bind/callback?code=${code}&mode=register`);
          const data = await res.json() as any;

          if (data.success && data.openid) {
            sessionStorage.setItem('wx_bind_openid', data.openid);
            sessionStorage.setItem('wx_bind_nickname', data.nickname || '');
            sessionStorage.setItem('wx_bind_avatar', data.avatar || '');
            setStatus('success');
            setMessage('微信授权成功！正在返回注册页...');
            setTimeout(() => {
              window.location.href = '/register?wx=1';
            }, 1000);
          } else {
            setStatus('error');
            setMessage(data.error || '微信授权失败');
          }
        } else {
          // 绑定模式：已登录用户绑定微信
          const res = await fetch(`/api/auth/wx/bind/callback?code=${code}&mode=bind`);
          const data = await res.json() as any;

          if (data.success) {
            setStatus('success');
            setMessage('微信绑定成功！正在返回个人中心...');
            setTimeout(() => {
              window.location.href = '/dashboard/profile';
            }, 1500);
          } else {
            setStatus('error');
            setMessage(data.error || '绑定失败');
          }
        }
      } catch {
        setStatus('error');
        setMessage('网络错误，请稍后再试');
      }
    };

    doBind();
  }, [code, mode]);

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
            <a
              href={mode === 'register' ? '/register' : '/dashboard/profile'}
              className="inline-block mt-4 text-sm text-[#2C4C3B] hover:underline"
            >
              返回重试
            </a>
          </>
        )}
      </div>
    </div>
  );
}
