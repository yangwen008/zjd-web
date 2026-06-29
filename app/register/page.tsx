'use client';

import { useState } from 'react';
import Link from 'next/link';

const ROLES = [
  { key: 'user', label: '普通用户', icon: '👤', desc: '浏览、收藏、发布闲置资产', needReview: false },
  { key: 'broker', label: '合伙人', icon: '🤝', desc: '发布房源、查看客户线索', needReview: true },
  { key: 'village_org', label: '村集体', icon: '🏛️', desc: '发布村委直发资产、查看线索', needReview: true },
];

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [nickname, setNickname] = useState('');
  const [roleApply, setRoleApply] = useState('user');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 合伙人专属字段
  const [brokerRegion, setBrokerRegion] = useState('');
  const [brokerSpecialties, setBrokerSpecialties] = useState('');
  const [brokerBio, setBrokerBio] = useState('');

  // 村集体专属字段
  const [orgName, setOrgName] = useState('');

  const selectedRole = ROLES.find((r) => r.key === roleApply);

  const handleNext = () => {
    setError('');
    if (!phone || !password || !nickname) { setError('请填写完整信息'); return; }
    if (!/^1[3-9]\d{9}$/.test(phone)) { setError('手机号格式不正确'); return; }
    if (password.length < 8) { setError('密码至少8位'); return; }
    if (password !== confirmPwd) { setError('两次密码不一致'); return; }
    setStep(2);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const body: any = { phone, password, nickname, role_apply: roleApply };

      if (roleApply === 'broker') {
        if (!brokerRegion) { setError('请填写负责区域'); setLoading(false); return; }
        body.broker_region = brokerRegion;
        body.broker_specialties = brokerSpecialties;
        body.broker_bio = brokerBio;
      }

      if (roleApply === 'village_org') {
        if (!orgName) { setError('请填写村委/机构名称'); setLoading(false); return; }
        body.org_name = orgName;
      }

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json() as any;

      if (data.success) {
        if (data.pending) {
          window.location.href = '/pending-review';
        } else {
          window.location.href = '/dashboard';
        }
      } else {
        setError(data.error || '注册失败');
      }
    } catch {
      setError('网络错误，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9F8] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-block">
              <span className="text-3xl font-black tracking-tight text-[#2C4C3B]">
                zjd<span className="text-[#D4AF37]">.cn</span>
              </span>
            </Link>
            <h1 className="text-xl font-bold text-gray-900 mt-4">注册账号</h1>
            <p className="text-sm text-gray-500 mt-1">选择身份，开始使用</p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-center space-x-4 mb-8">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center space-x-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= s ? 'bg-[#2C4C3B] text-white' : 'bg-gray-200 text-gray-500'}`}>
                  {step > s ? '✓' : s}
                </div>
                <span className={`text-sm ${step >= s ? 'text-gray-900' : 'text-gray-400'}`}>
                  {s === 1 ? '基本信息' : '选择身份'}
                </span>
                {s < 2 && <div className={`w-12 h-0.5 ${step > s ? 'bg-[#2C4C3B]' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>

          {/* Step 1: Basic info */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">手机号</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="请输入手机号" maxLength={11}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-[#2C4C3B] focus:ring-1 focus:ring-[#2C4C3B]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">昵称</label>
                <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="请输入昵称"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-[#2C4C3B] focus:ring-1 focus:ring-[#2C4C3B]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="至少8位，含大小写字母和数字"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-[#2C4C3B] focus:ring-1 focus:ring-[#2C4C3B]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">确认密码</label>
                <input type="password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} placeholder="再次输入密码"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-[#2C4C3B] focus:ring-1 focus:ring-[#2C4C3B]" />
              </div>

              {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl border border-red-200">{error}</div>}

              <button onClick={handleNext} className="w-full bg-[#2C4C3B] hover:bg-[#1E3529] text-white py-3 rounded-xl font-medium transition-colors">
                下一步
              </button>
            </div>
          )}

          {/* Step 2: Role selection */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {ROLES.map((r) => (
                  <button
                    key={r.key}
                    onClick={() => setRoleApply(r.key)}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                      roleApply === r.key
                        ? 'border-[#2C4C3B] bg-[#2C4C3B]/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-1">{r.icon}</div>
                    <div className="text-sm font-bold text-gray-900">{r.label}</div>
                    <div className="text-xs text-gray-500 mt-1">{r.desc}</div>
                    {r.needReview && <div className="text-xs text-orange-500 mt-1">需审核</div>}
                  </button>
                ))}
              </div>

              {/* Broker fields */}
              {roleApply === 'broker' && (
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">负责区域 *</label>
                    <input type="text" value={brokerRegion} onChange={(e) => setBrokerRegion(e.target.value)} placeholder="如：浙江安吉"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-[#2C4C3B]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">擅长领域</label>
                    <input type="text" value={brokerSpecialties} onChange={(e) => setBrokerSpecialties(e.target.value)} placeholder="如：宅基地、茶园、民宿改造"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-[#2C4C3B]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">个人简介</label>
                    <textarea value={brokerBio} onChange={(e) => setBrokerBio(e.target.value)} rows={2} placeholder="简单介绍您的从业经验..."
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-[#2C4C3B] resize-none" />
                  </div>
                </div>
              )}

              {/* Village fields */}
              {roleApply === 'village_org' && (
                <div className="pt-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">村委/机构名称 *</label>
                  <input type="text" value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="如：余村村委会"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-[#2C4C3B]" />
                  <p className="text-xs text-gray-400 mt-2">注册后需上传村委授权书，管理员审核通过后即可发布资产。</p>
                </div>
              )}

              {selectedRole?.needReview && (
                <div className="bg-orange-50 text-orange-700 text-sm px-4 py-3 rounded-xl border border-orange-200">
                  ⏳ {selectedRole.label}账号需要管理员审核，审核通过后即可登录使用。
                </div>
              )}

              {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl border border-red-200">{error}</div>}

              <div className="flex space-x-3">
                <button onClick={() => setStep(1)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-medium transition-colors">
                  上一步
                </button>
                <button onClick={handleSubmit} disabled={loading} className="flex-1 bg-[#2C4C3B] hover:bg-[#1E3529] text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-50">
                  {loading ? '注册中...' : '完成注册'}
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              已有账号？{' '}
              <Link href="/login" className="text-[#2C4C3B] font-medium hover:underline">
                立即登录
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
