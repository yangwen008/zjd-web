'use client';

import { useState } from 'react';

/* ───────── Types ───────── */

export interface UserInfo {
  id: number;
  nickname: string;
  phone: string | null;
  role: string;
  role_label?: string;
  avatar_url: string | null;
  verified?: number;
  permissions?: string[];
  broker_region?: string | null;
  broker_specialties?: string | null;
  broker_bio?: string | null;
  org_name?: string | null;
  org_license?: string | null;
  bio?: string | null;
  real_name?: string | null;
  daily_quota?: number;
  wx_openid?: string | null;
  wx_nickname?: string | null;
  wx_avatar?: string | null;
}

export interface UserEditFormProps {
  user: UserInfo;
  /** self = 用户自己编辑, admin = 管理员编辑他人 */
  mode: 'self' | 'admin';
  onSave: (data: Record<string, any>) => Promise<void>;
  onCancel: () => void;
  showMsg: (msg: string) => void;
}

/* ───────── Constants ───────── */

const ROLE_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  user: { label: '普通用户', icon: '👤', color: 'bg-gray-100 text-gray-700' },
  broker: { label: '合伙人', icon: '🤝', color: 'bg-blue-100 text-blue-700' },
  village_org: { label: '村集体', icon: '🏛️', color: 'bg-purple-100 text-purple-700' },
  data_editor: { label: '数据录入员', icon: '📊', color: 'bg-green-100 text-green-700' },
  project_publisher: { label: '项目发布者', icon: '🏢', color: 'bg-yellow-100 text-yellow-700' },
  admin: { label: '平台运营', icon: '🔧', color: 'bg-red-100 text-red-700' },
  superadmin: { label: '超级管理员', icon: '👑', color: 'bg-red-100 text-red-700' },
};

const BROKER_ROLES = new Set(['broker', 'village_org']);
const ORG_ROLES = new Set(['village_org', 'broker', 'project_publisher']);
const BIO_ROLES = new Set(['village_org', 'project_publisher']);

/* ───────── Component ───────── */

export default function UserEditForm({ user, mode, onSave, onCancel, showMsg }: UserEditFormProps) {
  /* ── form state ── */
  const [nickname, setNickname] = useState(user.nickname || '');
  const [realName, setRealName] = useState(user.real_name || '');
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url || '');
  const [bio, setBio] = useState(user.bio || '');

  // broker
  const [brokerRegion, setBrokerRegion] = useState(user.broker_region || '');
  const [brokerSpecialties, setBrokerSpecialties] = useState(user.broker_specialties || '');
  const [brokerBio, setBrokerBio] = useState(user.broker_bio || '');

  // org
  const [orgName, setOrgName] = useState(user.org_name || '');
  const [orgLicense, setOrgLicense] = useState(user.org_license || '');

  // admin-only
  const [role, setRole] = useState(user.role || 'user');
  const [dailyQuota, setDailyQuota] = useState(String(user.daily_quota ?? 3));
  const [newPassword, setNewPassword] = useState('');

  // upload state
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingLicense, setUploadingLicense] = useState(false);
  const [saving, setSaving] = useState(false);

  /* ── derived flags ── */
  const currentRole = mode === 'admin' ? role : user.role;
  const isBrokerRole = BROKER_ROLES.has(currentRole);
  const needsLicense = ORG_ROLES.has(currentRole);
  const needsBio = BIO_ROLES.has(currentRole);

  const licenseLabel =
    currentRole === 'village_org' ? '村委授权书' : '营业执照';
  const licenseHint =
    currentRole === 'village_org'
      ? '上传村委盖章的授权书，管理员审核通过后即可发布「村委直发」资产'
      : '上传营业执照扫描件，有助于提升账号可信度和审核通过率';

  /* ── upload helper ── */
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
    } catch {
      return null;
    }
  };

  /* ── handlers ── */
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { showMsg('❌ 请选择图片文件'); return; }
    if (file.size > 5 * 1024 * 1024) { showMsg('❌ 头像不能超过5MB'); return; }
    setUploadingAvatar(true);
    const url = await uploadFile(file);
    if (url) { setAvatarUrl(url); showMsg('✅ 头像已上传，请保存'); }
    else { showMsg('❌ 上传失败，请重试'); }
    setUploadingAvatar(false);
    e.target.value = '';
  };

  const handleLicenseUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { showMsg('❌ 文件不能超过10MB'); return; }
    setUploadingLicense(true);
    const url = await uploadFile(file);
    if (url) { setOrgLicense(url); showMsg('✅ 上传成功，请保存'); }
    else { showMsg('❌ 上传失败，请重试'); }
    setUploadingLicense(false);
    e.target.value = '';
  };

  const handleSave = async () => {
    if (!nickname.trim()) { showMsg('❌ 昵称不能为空'); return; }
    setSaving(true);
    try {
      const body: Record<string, any> = {
        nickname,
        real_name: realName,
        avatar_url: avatarUrl,
      };

      if (isBrokerRole) {
        body.broker_region = brokerRegion;
        body.broker_specialties = brokerSpecialties;
        body.broker_bio = brokerBio;
      }

      if (needsLicense) {
        body.org_name = orgName;
        body.org_license = orgLicense;
      }

      if (needsBio) {
        body.bio = bio;
      }

      // admin-only fields
      if (mode === 'admin') {
        body.role = role;
        body.daily_quota = dailyQuota;
        if (newPassword.trim()) body.new_password = newPassword.trim();
      }

      await onSave(body);
    } catch {
      showMsg('❌ 保存失败');
    } finally {
      setSaving(false);
    }
  };

  /* ── render ── */
  return (
    <div className="space-y-6">
      {/* ─── 头像 & 基本信息卡片 ─── */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h2 className="font-bold text-gray-900 mb-5">👤 基本信息</h2>

        {/* 头像 */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative group">
            <div className="w-20 h-20 rounded-full bg-brand-green/10 flex items-center justify-center text-3xl overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt={nickname} className="w-20 h-20 rounded-full object-cover" />
              ) : (
                '👤'
              )}
            </div>
            <label
              className={`absolute inset-0 rounded-full bg-black/40 flex items-center justify-center text-white text-xs font-medium cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity ${
                uploadingAvatar ? '!opacity-100' : ''
              }`}
            >
              {uploadingAvatar ? '上传中' : '更换'}
              <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            </label>
          </div>
          <div>
            <div className="text-xl font-bold text-gray-900">{user.nickname}</div>
            {mode === 'self' && user.role_label && (
              <div className="text-sm text-gray-500">{user.role_label}</div>
            )}
            {user.verified ? (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full mt-1 inline-block">✓ 已认证</span>
            ) : (
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full mt-1 inline-block">未认证</span>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {/* 昵称 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">昵称</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-brand-green"
            />
          </div>

          {/* 手机号 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">手机号</label>
            <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-500">
              {user.phone || '未绑定'}（不可修改）
            </div>
          </div>

          {/* 微信绑定 */}
          {mode === 'self' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">微信</label>
              {user.wx_openid ? (
                <div className="px-4 py-3 bg-green-50 rounded-xl flex items-center gap-3">
                  {user.wx_avatar && <img src={user.wx_avatar} alt="" className="w-8 h-8 rounded-full" />}
                  <span className="text-green-700 font-medium">✅ 已绑定：{user.wx_nickname || '微信用户'}</span>
                </div>
              ) : (
                <a
                  href="/api/auth/wx/login?mode=bind"
                  className="flex items-center gap-2 px-4 py-3 bg-[#07C160] hover:bg-[#06AE56] text-white rounded-xl transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178A1.17 1.17 0 014.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178 1.17 1.17 0 01-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 01.598.082l1.584.926a.272.272 0 00.14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 01-.023-.156.49.49 0 01.201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-7.062-6.122zm-2.18 2.769c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.97-.982z"/>
                  </svg>
                  绑定微信
                </a>
              )}
            </div>
          )}

          {/* 真实姓名 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">真实姓名</label>
            <input
              type="text"
              value={realName}
              onChange={(e) => setRealName(e.target.value)}
              placeholder="请输入真实姓名"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-brand-green"
            />
          </div>

          {/* 头像 URL 手动输入 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">头像链接</label>
            <div className="flex items-center space-x-3 mb-1">
              <label
                className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg border border-dashed border-gray-300 hover:border-brand-green cursor-pointer transition-colors text-sm ${
                  uploadingAvatar ? 'opacity-50 pointer-events-none' : ''
                }`}
              >
                <span>📤</span>
                <span className="text-gray-600">{uploadingAvatar ? '上传中...' : '上传头像图片'}</span>
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
              </label>
              {avatarUrl && !uploadingAvatar && (
                <span className="text-xs text-green-600">✅ 已设置</span>
              )}
            </div>
            <input
              type="text"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-brand-green text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">支持 JPG/PNG/WebP，≤ 5MB</p>
          </div>
        </div>
      </div>

      {/* ─── 角色选择 (admin-only) ─── */}
      {mode === 'admin' && (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="font-bold text-gray-900 mb-4">🏷️ 角色与配额</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">角色</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-brand-green"
              >
                {Object.entries(ROLE_LABELS).map(([key, val]) => (
                  <option key={key} value={key}>
                    {val.icon} {val.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">每日发布上限</label>
              <input
                type="number"
                min="0"
                value={dailyQuota}
                onChange={(e) => setDailyQuota(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-brand-green"
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── 合伙人专属 ─── */}
      {isBrokerRole && (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="font-bold text-gray-900 mb-4">🤝 合伙人信息</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">负责区域</label>
              <input
                type="text"
                value={brokerRegion}
                onChange={(e) => setBrokerRegion(e.target.value)}
                placeholder="如：浙江安吉"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-brand-green"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">擅长领域</label>
              <input
                type="text"
                value={brokerSpecialties}
                onChange={(e) => setBrokerSpecialties(e.target.value)}
                placeholder='如：宅基地、茶园、民宿改造'
                className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-brand-green"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">个人简介</label>
              <textarea
                value={brokerBio}
                onChange={(e) => setBrokerBio(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-brand-green resize-none"
                placeholder="简单介绍您的从业经验..."
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── 机构信息 ─── */}
      {needsLicense && (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="font-bold text-gray-900 mb-4">
            {currentRole === 'village_org'
              ? '🏛️ 村集体信息'
              : currentRole === 'project_publisher'
                ? '🏢 机构信息'
                : '📋 资质信息'}
          </h2>
          <div className="space-y-4">
            {/* 机构/村委介绍 */}
            {needsBio && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {currentRole === 'village_org' ? '村委介绍' : '机构介绍'}
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-brand-green resize-none"
                  placeholder={
                    currentRole === 'village_org'
                      ? '介绍村委基本情况、管辖范围、可流转资产概况等...'
                      : '介绍公司/机构背景、主营业务、成功案例等...'
                  }
                />
                <p className="text-xs text-gray-400 mt-1">将展示在您的发布者主页，帮助买家了解您</p>
              </div>
            )}

            {/* 机构名称 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {currentRole === 'village_org' ? '村委/机构名称' : '机构/公司名称'}
              </label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder={currentRole === 'village_org' ? '如：余村村委会' : '如：xx文旅发展有限公司'}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-brand-green"
              />
            </div>

            {/* 营业执照/授权书上传 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{licenseLabel}</label>
              {orgLicense ? (
                <div className="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <span className="text-green-600 text-sm">✅ 已上传</span>
                  <a
                    href={orgLicense}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-brand-green hover:underline"
                  >
                    查看文件
                  </a>
                  <button
                    type="button"
                    onClick={() => setOrgLicense('')}
                    className="text-sm text-red-500 hover:underline"
                  >
                    删除
                  </button>
                </div>
              ) : (
                <div>
                  <label
                    className={`inline-flex items-center space-x-2 px-4 py-3 rounded-lg border border-dashed border-gray-300 hover:border-brand-green cursor-pointer transition-colors w-full justify-center ${
                      uploadingLicense ? 'opacity-50 pointer-events-none' : ''
                    }`}
                  >
                    <span className="text-lg">📤</span>
                    <span className="text-sm text-gray-600">
                      {uploadingLicense ? '上传中...' : `点击上传${licenseLabel}`}
                    </span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleLicenseUpload}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-gray-400 mt-2">支持 JPG/PNG/PDF，≤ 10MB</p>
                </div>
              )}
              <p className="text-xs text-gray-400 mt-2">{licenseHint}</p>
            </div>
          </div>
        </div>
      )}

      {/* ─── 密码重置 (admin-only) ─── */}
      {mode === 'admin' && (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="font-bold text-gray-900 mb-2">🔒 重置密码</h2>
          <p className="text-sm text-gray-500 mb-4">留空则不修改密码。</p>
          <input
            type="text"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="输入新密码，至少8位"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-brand-green font-mono text-sm"
          />
        </div>
      )}

      {/* ─── 操作按钮 ─── */}
      <div className="flex items-center space-x-3">
        <button
          onClick={handleSave}
          disabled={saving || uploadingAvatar || uploadingLicense}
          className="bg-brand-green hover:bg-brand-light text-white px-8 py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
        >
          {saving ? '保存中...' : '💾 保存'}
        </button>
        <button
          onClick={onCancel}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-8 py-3 rounded-xl font-medium transition-colors"
        >
          取消
        </button>
      </div>
    </div>
  );
}
