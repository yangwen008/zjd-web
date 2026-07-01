'use client';

import { useState, useEffect } from 'react';

interface UserInfo {
  id: number; nickname: string; phone: string; role: string; role_label: string;
  avatar_url: string | null; verified: number; permissions: string[];
  broker_region?: string; broker_specialties?: string; broker_bio?: string;
  org_name?: string; org_license?: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [msg, setMsg] = useState('');

  // 基本信息
  const [nickname, setNickname] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // 合伙人专属
  const [brokerRegion, setBrokerRegion] = useState('');
  const [brokerSpecialties, setBrokerSpecialties] = useState('');
  const [brokerBio, setBrokerBio] = useState('');

  // 村集体/机构专属
  const [orgName, setOrgName] = useState('');
  const [orgLicense, setOrgLicense] = useState('');

  useEffect(() => {
    fetch('/api/dashboard/profile')
      .then((r) => r.json())
      .then((d: any) => {
        if (d.success) {
          const u = d.data;
          setUser(u);
          setNickname(u.nickname || '');
          setAvatarUrl(u.avatar_url || '');
          setBrokerRegion(u.broker_region || '');
          setBrokerSpecialties(u.broker_specialties || '');
          setBrokerBio(u.broker_bio || '');
          setOrgName(u.org_name || '');
          setOrgLicense(u.org_license || '');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const show = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      const res = await fetch('/api/upload/r2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      });
      const data: any = await res.json();
      if (!data.success) return null;
      const fd = new FormData();
      fd.append('file', file);
      const upRes = await fetch(data.uploadUrl, { method: 'POST', body: fd });
      const upData: any = await upRes.json();
      return upData.success ? upData.url : null;
    } catch { return null; }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { show('❌ 请选择图片文件'); return; }
    if (file.size > 5 * 1024 * 1024) { show('❌ 头像不能超过5MB'); return; }
    setUploadingAvatar(true);
    const url = await uploadFile(file);
    if (url) {
      setAvatarUrl(url);
      show('✅ 头像已上传，请点击「保存修改」');
    } else {
      show('❌ 上传失败，请重试');
    }
    setUploadingAvatar(false);
    e.target.value = '';
  };

  const handleLicenseUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { show('❌ 文件不能超过10MB'); return; }
    setUploading(true);
    const url = await uploadFile(file);
    if (url) {
      setOrgLicense(url);
      show('✅ 上传成功，请点击「保存修改」');
    } else {
      show('❌ 上传失败，请重试');
    }
    setUploading(false);
    e.target.value = '';
  };

  const handleSave = async () => {
    if (!nickname.trim()) { show('❌ 昵称不能为空'); return; }
    setSaving(true);
    try {
      const body: any = { nickname, avatar_url: avatarUrl };

      // 合伙人字段
      if (user?.role === 'broker') {
        body.broker_region = brokerRegion;
        body.broker_specialties = brokerSpecialties;
        body.broker_bio = brokerBio;
      }

      // 村集体/大宗用户/合伙人 — 机构信息
      if (['village_org', 'broker', 'project_publisher'].includes(user?.role || '')) {
        body.org_name = orgName;
        body.org_license = orgLicense;
      }

      const res = await fetch('/api/dashboard/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await res.json() as any;
      if (d.success) show('✅ 已保存');
      else show(`❌ ${d.error}`);
    } catch { show('❌ 保存失败'); } finally { setSaving(false); }
  };

  if (loading) return <div className="text-center py-16 text-gray-400">加载中...</div>;
  if (!user) return null;

  const needsLicense = ['village_org', 'broker', 'project_publisher'].includes(user.role);
  const licenseLabel = user.role === 'village_org' ? '村委授权书' : '营业执照';
  const licenseHint = user.role === 'village_org'
    ? '上传村委盖章的授权书，管理员审核通过后即可发布「村委直发」资产'
    : '上传营业执照扫描件，有助于提升账号可信度和审核通过率';

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">👤 个人资料</h1>

      {msg && <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${msg.startsWith('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{msg}</div>}

      {/* Profile card */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative group">
            <div className="w-20 h-20 rounded-full bg-brand-green/10 flex items-center justify-center text-3xl overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt={nickname} className="w-20 h-20 rounded-full object-cover" />
              ) : '👤'}
            </div>
            <label className={`absolute inset-0 rounded-full bg-black/40 flex items-center justify-center text-white text-xs font-medium cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity ${uploadingAvatar ? '!opacity-100' : ''}`}>
              {uploadingAvatar ? '上传中' : '更换'}
              <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            </label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">头像</label>
            <div className="flex items-center space-x-3">
              <label className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg border border-dashed border-gray-300 hover:border-brand-green cursor-pointer transition-colors text-sm ${uploadingAvatar ? 'opacity-50 pointer-events-none' : ''}`}>
                <span>📤</span>
                <span className="text-gray-600">{uploadingAvatar ? '上传中...' : '上传头像图片'}</span>
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
              </label>
              {avatarUrl && !uploadingAvatar && <span className="text-xs text-green-600">✅ 已设置</span>}
            </div>
            <p className="text-xs text-gray-400 mt-1">支持 JPG/PNG/WebP，≤ 5MB，或粘贴图片链接：</p>
            <input type="text" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..."
              className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-brand-green text-sm mt-1" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">手机号</label>
            <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-500">{user.phone}（不可修改）</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">角色</label>
            <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-500">{user.role_label}</div>
          </div>
        </div>
      </div>

      {/* 合伙人专属 */}
      {user.role === 'broker' && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
          <h2 className="font-bold text-gray-900 mb-4">🤝 合伙人信息</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">负责区域</label>
              <input type="text" value={brokerRegion} onChange={(e) => setBrokerRegion(e.target.value)} placeholder="如：浙江安吉"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-brand-green" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">擅长领域</label>
              <input type="text" value={brokerSpecialties} onChange={(e) => setBrokerSpecialties(e.target.value)} placeholder="如：宅基地、茶园、民宿改造"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-brand-green" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">个人简介</label>
              <textarea value={brokerBio} onChange={(e) => setBrokerBio(e.target.value)} rows={3}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-brand-green resize-none"
                placeholder="简单介绍您的从业经验..." />
            </div>
          </div>
        </div>
      )}

      {/* 机构信息（村集体/合伙人/大宗用户） */}
      {needsLicense && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
          <h2 className="font-bold text-gray-900 mb-4">
            {user.role === 'village_org' ? '🏛️ 村集体信息' : user.role === 'project_publisher' ? '🏢 机构信息' : '📋 资质信息'}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {user.role === 'village_org' ? '村委/机构名称' : '机构/公司名称'}
              </label>
              <input type="text" value={orgName} onChange={(e) => setOrgName(e.target.value)}
                placeholder={user.role === 'village_org' ? '如：余村村委会' : '如：xx文旅发展有限公司'}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-brand-green" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{licenseLabel}</label>
              {orgLicense ? (
                <div className="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <span className="text-green-600 text-sm">✅ 已上传</span>
                  <a href={orgLicense} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-green hover:underline">查看文件</a>
                  <button type="button" onClick={() => setOrgLicense('')} className="text-sm text-red-500 hover:underline">删除</button>
                </div>
              ) : (
                <div>
                  <label className={`inline-flex items-center space-x-2 px-4 py-3 rounded-lg border border-dashed border-gray-300 hover:border-brand-green cursor-pointer transition-colors w-full justify-center ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                    <span className="text-lg">📤</span>
                    <span className="text-sm text-gray-600">{uploading ? '上传中...' : `点击上传${licenseLabel}`}</span>
                    <input type="file" accept="image/*,.pdf" onChange={handleLicenseUpload} className="hidden" />
                  </label>
                  <p className="text-xs text-gray-400 mt-2">支持 JPG/PNG/PDF，≤ 10MB</p>
                </div>
              )}
              <p className="text-xs text-gray-400 mt-2">{licenseHint}</p>
            </div>
          </div>
        </div>
      )}

      {/* Password */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <h2 className="font-bold text-gray-900 mb-4">🔒 修改密码</h2>
        <p className="text-sm text-gray-500 mb-4">修改密码后需要重新登录。</p>
        <button onClick={() => show('密码修改功能即将上线')} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2.5 rounded-xl text-sm font-medium transition-colors">
          修改密码
        </button>
      </div>

      {/* Save button */}
      <button onClick={handleSave} disabled={saving || uploading} className="w-full bg-brand-green hover:bg-brand-light text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-50">
        {saving ? '保存中...' : '保存修改'}
      </button>

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
