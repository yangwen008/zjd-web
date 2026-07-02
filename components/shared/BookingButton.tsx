'use client';

import { useState, useEffect } from 'react';

interface BookingButtonProps {
  assetId: number;
  assetTitle: string;
}

export default function BookingButton({ assetId, assetTitle }: BookingButtonProps) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [checking, setChecking] = useState(true);
  const [booked, setBooked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', notes: '' });
  const [error, setError] = useState('');

  // 检查登录态 + 是否已预约
  useEffect(() => {
    const check = async () => {
      try {
        // 检查登录
        const meRes = await fetch('/api/auth/me');
        const meData = await meRes.json();
        if (!meData.success) {
          setLoggedIn(false);
          return;
        }
        setLoggedIn(true);

        // 预填表单
        if (meData.user?.nickname) setForm(f => ({ ...f, name: meData.user.nickname }));
        if (meData.user?.phone) setForm(f => ({ ...f, phone: meData.user.phone }));

        // 检查是否已预约
        const bookRes = await fetch(`/api/appointments?assetId=${assetId}`);
        const bookData = await bookRes.json();
        if (bookData.success && bookData.data) {
          setBooked(true);
        }
      } catch {
        // ignore
      } finally {
        setChecking(false);
      }
    };
    check();
  }, [assetId]);

  // 提交预约
  const handleBook = async () => {
    if (!form.name.trim()) { setError('请输入姓名'); return; }
    if (!form.phone.trim() || !/^1[3-9]\d{9}$/.test(form.phone)) { setError('请输入正确的手机号'); return; }

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetId,
          contactName: form.name,
          contactPhone: form.phone,
          notes: form.notes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBooked(true);
        setShowForm(false);
      } else {
        setError(data.error || '预约失败');
      }
    } catch {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="bg-gray-50 rounded-xl p-4 text-center">
        <div className="text-sm text-gray-400">加载中...</div>
      </div>
    );
  }

  // 已预约状态
  if (booked) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
        <div className="text-2xl mb-1">✅</div>
        <div className="font-bold text-green-700">已预约带看</div>
        <div className="text-xs text-green-600 mt-1">资产所有者将尽快与您联系</div>
      </div>
    );
  }

  // 未登录
  if (!loggedIn) {
    return (
      <a
        href={`/login?redirect=${encodeURIComponent(`/asset/${assetId}`)}`}
        className="block w-full bg-brand-green hover:bg-brand-light text-white py-3 rounded-xl font-medium transition-colors text-center"
      >
        登录后预约带看
      </a>
    );
  }

  // 弹出表单
  if (showForm) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <div className="font-bold text-gray-900 text-sm">📅 预约带看</div>

        <input
          type="text"
          placeholder="您的姓名"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-green"
        />
        <input
          type="tel"
          placeholder="联系电话"
          value={form.phone}
          onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-green"
        />
        <textarea
          placeholder="备注（可选，如期望带看时间）"
          value={form.notes}
          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          rows={2}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-green resize-none"
        />

        {error && <div className="text-xs text-red-500">{error}</div>}

        <div className="flex gap-2">
          <button
            onClick={() => setShowForm(false)}
            className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
          >
            取消
          </button>
          <button
            onClick={handleBook}
            disabled={loading}
            className="flex-1 py-2 bg-brand-green hover:bg-brand-light text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {loading ? '提交中...' : '确认预约'}
          </button>
        </div>
      </div>
    );
  }

  // 默认按钮
  return (
    <button
      onClick={() => setShowForm(true)}
      className="w-full bg-brand-green hover:bg-brand-light text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
    >
      <span>📅</span>
      <span>预约带看</span>
    </button>
  );
}
