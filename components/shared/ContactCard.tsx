'use client';

import { useState, useEffect } from 'react';

interface ContactCardProps {
  phone?: string | null;
  name?: string | null;
  attachments?: {
    label: string;
    icon: string;
    url: string | null;
    type?: 'doc' | 'cert';
  }[];
}

export default function ContactCard({ phone, name, attachments = [] }: ContactCardProps) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => setLoggedIn(d.success))
      .catch(() => setLoggedIn(false))
      .finally(() => setChecking(false));
  }, []);

  // 电话脱敏显示
  const maskedPhone = phone ? phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : '****';

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 sticky top-24">
      {/* 联系方式 */}
      <div className="text-center mb-4">
        <div className="text-3xl mb-2">🔐</div>
        <div className="font-bold text-gray-900">产权联系经办</div>
        {name && <div className="text-sm text-gray-500 mt-1">{name}</div>}
      </div>

      <div className="bg-gray-50 rounded-lg p-4 text-center mb-4">
        <div className="text-2xl font-bold text-gray-300 tracking-widest">
          {loggedIn ? (phone || '暂无') : maskedPhone}
        </div>
        <div className="text-xs text-gray-400 mt-1">
          {loggedIn ? '已解锁' : '登录后查看完整号码'}
        </div>
      </div>

      {!loggedIn && !checking && (
        <a
          href="/login"
          className="block w-full bg-brand-green hover:bg-brand-light text-white py-3 rounded-xl font-medium transition-colors text-center"
        >
          登录查看联系方式
        </a>
      )}

      {/* 附件列表 */}
      {attachments.length > 0 && (
        <div className="mt-6 space-y-2">
          <div className="text-xs font-medium text-gray-500 mb-2">项目附件</div>
          {attachments.map((att, i) => (
            att.url ? (
              loggedIn ? (
                <a
                  key={i}
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span>{att.icon}</span>
                  <span className="text-sm text-gray-700">{att.label}</span>
                  <span className="text-xs text-brand-green ml-auto">点击查看</span>
                </a>
              ) : (
                <a
                  key={i}
                  href="/login"
                  className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span>{att.icon}</span>
                  <span className="text-sm text-gray-700">{att.label}</span>
                  <span className="text-xs text-orange-500 ml-auto">登录后查看</span>
                </a>
              )
            ) : (
              <div key={i} className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg opacity-50">
                <span>{att.icon}</span>
                <span className="text-sm text-gray-400">{att.label}（未上传）</span>
              </div>
            )
          ))}
        </div>
      )}

      {checking && (
        <div className="text-center text-xs text-gray-400 mt-4">检查登录状态...</div>
      )}
    </div>
  );
}
