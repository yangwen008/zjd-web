'use client';

import { useState } from 'react';

interface ShareButtonProps {
  title: string;
  text: string;
  url: string;
}

/**
 * 一键分享按钮（移动端优先）
 * - 支持 Web Share API 的浏览器：调用系统原生分享
 * - 不支持的：复制链接到剪贴板
 * - 微信浏览器：提示用户点击右上角 ... 分享
 */
export default function ShareButton({ title, text, url }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [showWxTip, setShowWxTip] = useState(false);

  const isWechat = typeof navigator !== 'undefined' && /micromessenger/i.test(navigator.userAgent);
  const hasShareAPI = typeof navigator !== 'undefined' && !!navigator.share;

  const handleShare = async () => {
    // 微信浏览器：提示用户用右上角分享
    if (isWechat) {
      setShowWxTip(true);
      setTimeout(() => setShowWxTip(false), 3000);
      return;
    }

    // 支持 Web Share API 的浏览器（大部分手机浏览器）
    if (hasShareAPI) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (e: any) {
        if (e.name === 'AbortError') return; // 用户取消
      }
    }

    // 降级：复制链接
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 最终降级：选中文本
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleShare}
        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 hover:border-brand-green hover:text-brand-green transition-all w-full justify-center"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        {copied ? '✅ 链接已复制' : '分享给朋友'}
      </button>

      {/* 微信内提示 */}
      {showWxTip && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg z-50 text-center">
          请点击右上角 <span className="font-bold">⋯</span> 按钮，选择「发送给朋友」或「分享到朋友圈」
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
        </div>
      )}
    </div>
  );
}
