'use client';

import { useState, useEffect } from 'react';
import UserEditForm, { UserInfo } from '@/components/shared/UserEditForm';

export default function ProfilePage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetch('/api/dashboard/profile')
      .then((r) => r.json())
      .then((d: any) => {
        if (d.success) setUser(d.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const show = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const handleSave = async (data: Record<string, any>) => {
    const res = await fetch('/api/dashboard/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const d = await res.json() as any;
    if (d.success) show('✅ 已保存');
    else show(`❌ ${d.error}`);
  };

  if (loading) return <div className="text-center py-16 text-gray-400">加载中...</div>;
  if (!user) return null;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">👤 个人资料</h1>

      {msg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className={`${msg.startsWith('✅') ? 'bg-green-600 text-white' : 'bg-red-600 text-white'} px-8 py-4 rounded-xl shadow-2xl text-sm font-medium`}>
            {msg}
          </div>
        </div>
      )}

      <UserEditForm
        user={user}
        mode="self"
        onSave={handleSave}
        onCancel={() => {}}
        showMsg={show}
      />

      {/* Permissions */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mt-6">
        <h2 className="font-bold text-gray-900 mb-4">🔑 我的权限</h2>
        <div className="flex flex-wrap gap-2">
          {(user.permissions || []).map((p) => (
            <span key={p} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{p}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
