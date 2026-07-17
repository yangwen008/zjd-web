'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';

export default function WxScanLoginPage() {
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!qrRef.current) return;
    qrRef.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://res.wx.qq.com/connect/zh_CN/htmledition/js/wxLogin.js';
    script.onload = () => {
      // @ts-ignore
      if (typeof window.WxLogin !== 'undefined') {
        // @ts-ignore
        new window.WxLogin({
          self_redirect: false,
          id: 'wx_qr_container',
          appid: 'wxdf0895ffafe30943',
          scope: 'snsapi_login',
          redirect_uri: encodeURIComponent('https://z.zjd.cn/wx-open-callback'),
          state: Math.random().toString(36).substring(2),
          style: 'white',
          href: '',
        });
      }
    };
    document.head.appendChild(script);
  }, []);

  return (
    <div className="min-h-screen bg-[#F9F9F8] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
        <Link href="/" className="inline-block mb-6">
          <span className="text-3xl font-black tracking-tight text-[#2C4C3B]">
            zjd<span className="text-[#D4AF37]">.cn</span>
          </span>
        </Link>
        <h1 className="text-xl font-bold text-gray-900 mb-2">微信扫码登录</h1>
        <p className="text-sm text-gray-500 mb-6">请使用微信扫描二维码登录</p>
        <div id="wx_qr_container" ref={qrRef} className="flex justify-center min-h-[300px] items-center">
          <span className="text-gray-400 text-sm">加载中...</span>
        </div>
        <Link href="/login" className="inline-block mt-6 text-sm text-[#2C4C3B] hover:underline">
          ← 返回登录页
        </Link>
      </div>
    </div>
  );
}
