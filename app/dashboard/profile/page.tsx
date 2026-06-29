'use client';

import { useState, useEffect } from 'react';

interface UserInfo {
  id: number; nickname: string; phone: string; role: string; role_label: string;
  avatar_url: string | null; verified: number; permissions: string[];
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [nickname, setNickname] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d: any) => {
        if (d.success) {
          setUser(d.user);
          setNickname(d.user.nickname);
          setAvatarUrl(d.user.avatar_url || '');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const show = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const handleSave = async () => {
    if (!nickname.trim()) { show('❌ 昵称不能为空'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/dashboard/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname, avatar_url: avatarUrl }),
      });
      const d = await res.json() as any;
      if (d.success) show('✅ 已保存');
      else show(`❌ ${d.error}`);
    } catch { show('❌ 保存失败'); } finally { setSaving(false); }
  };

  const handleChangePassword = async () => {
    // TODO: implement password change
    show('密码修改功能即将上线');
  };

  if (loading) return <div className="text-center py-16 text-gray-400">加载中...</div>;
  if (!user) return null;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">👤 个人资料</h1>

      {msg && <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${msg.startsWith('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{msg}</div>}

      {/* Profile card */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-20 h-20 rounded-full bg-brand-green/10 flex items-center justify-center text-3xl">
            {avatarUrl ? (
              <img src={avatarUrl} alt={nickname} className="w-20 h-20 rounded-full object-cover" />
            ) : '👤'}
          </div>
          <div>
            <div className="text-xl font-bold text-gray-900">{user.nickname}</div>
            <div className="text-sm text-gray-500">{user.role_label}</div>
            {user.verified ? (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full mt-1 inline-block">✓ 已认证</span>
            ) : (
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full mt-1 inline-block">未认证</span>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">昵称</label>
            <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-brand-green" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">头像URL</label>
            <input type="text" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-brand-green" />
            <p className="text-xs text-gray-400 mt-1">输入图片链接，或上传到图床后粘贴地址</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">手机号</label>
            <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-500">{user.phone}（不可修改）</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">角色</label>
            <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-500">{user.role_label}</div>
          </div>

          <button onClick={handleSave} disabled={saving} className="w-full bg-brand-green hover:bg-brand-light text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-50">
            {saving ? '保存中...' : '保存修改'}
          </button>
        </div>
      </div>

      {/* Password */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <h2 className="font-bold text-gray-900 mb-4">🔒 修改密码</h2>
        <p className="text-sm text-gray-500 mb-4">修改密码后需要重新登录。</p>
        <button onClick={handleChangePassword} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2.5 rounded-xl text-sm font-medium transition-colors">
          修改密码
        </button>
      </div>

      {/* Permissions */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h2 className="font-bold text-gray-900 mb-4">🔑 我的权限</h2>
        <div className="flex flex-wrap gap-2">
          {user.permissions.map((p) => (
            <span key={p} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{p}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
