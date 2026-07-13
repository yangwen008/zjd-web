'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import RegionSelector from '@/components/shared/RegionSelector';

const ROLES = [
  { key: 'user', label: '普通用户', icon: '👤', desc: '浏览、收藏、发布闲置资产', needReview: false },
  { key: 'broker', label: '合伙人', icon: '🤝', desc: '发布房源、查看客户线索', needReview: true },
  { key: 'village_org', label: '村集体', icon: '🏛️', desc: '发布村委直发资产、查看线索', needReview: true, needLicense: true },
  { key: 'project_publisher', label: '大宗用户', icon: '🏢', desc: '发布大宗路演项目', needReview: true },
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

  // 微信绑定状态
  const [wxOpenid, setWxOpenid] = useState('');
  const [wxNickname, setWxNickname] = useState('');
  const [wxAvatar, setWxAvatar] = useState('');

  // 合伙人专属字段
  const [brokerProvince, setBrokerProvince] = useState('');
  const [brokerCity, setBrokerCity] = useState('');
  const [brokerSpecialties, setBrokerSpecialties] = useState('');
  const [brokerBio, setBrokerBio] = useState('');

  // 村集体专属字段
  const [orgName, setOrgName] = useState('');

  const selectedRole = ROLES.find((r) => r.key === roleApply);

  // 从 URL 参数恢复微信绑定数据（从 wx-callback 跳回时带的）
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('wx') === '1') {
      const openid = params.get('openid') || '';
      const nick = params.get('nickname') || '';
      const avatar = params.get('avatar') || '';
      if (openid) {
        setWxOpenid(openid);
        setWxNickname(nick);
        setWxAvatar(avatar);
        if (nick && !nickname) setNickname(nick);
        // 清理 URL 参数，避免刷新重复
        window.history.replaceState({}, '', '/register');
        // 直接跳到填写资料步骤
        setStep(3);
      }
    }
  }, []);

  const handleNext = () => {
    setError('');
    setStep(2); // 进入微信绑定步骤
  };

  const handleSkipWx = () => {
    setError('');
    setStep(3); // 跳过微信绑定
  };

  const handleBindWx = () => {
    // 跳转微信授权，回调到 /wx-callback?mode=register
    window.location.href = '/api/auth/wx/login?mode=register';
  };

  const handleBack = () => {
    setError('');
    if (step === 3) {
      setStep(2);
    } else {
      setStep(1);
    }
  };

  const validateAndSubmit = () => {
    setError('');
    if (!phone || !password || !nickname) { setError('请填写完整信息'); return; }
    if (!/^1[3-9]\d{9}$/.test(phone)) { setError('手机号格式不正确'); return; }
    if (password.length < 8) { setError('密码至少8位'); return; }
    if (!/[A-Z]/.test(password)) { setError('密码需包含大写字母'); return; }
    if (!/[a-z]/.test(password)) { setError('密码需包含小写字母'); return; }
    if (!/[0-9]/.test(password)) { setError('密码需包含数字'); return; }
    if (password !== confirmPwd) { setError('两次密码不一致'); return; }
    handleSubmit();
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const body: any = { phone, password, nickname, role_apply: roleApply };

      if (wxOpenid) {
        body.wx_openid = wxOpenid;
        if (wxNickname) body.wx_nickname = wxNickname;
        if (wxAvatar) body.wx_avatar = wxAvatar;
      }

      if (roleApply === 'broker') {
        if (!brokerProvince) { setError('请选择负责区域'); setLoading(false); return; }
        body.broker_region = brokerProvince + (brokerCity ? `·${brokerCity}` : '');
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
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center space-x-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= s ? 'bg-[#2C4C3B] text-white' : 'bg-gray-200 text-gray-500'}`}>
                  {step > s ? '✓' : s}
                </div>
                <span className={`text-sm ${step >= s ? 'text-gray-900' : 'text-gray-400'}`}>
                  {s === 1 ? '选择身份' : s === 2 ? '绑定微信' : '填写信息'}
                </span>
                {s < 3 && <div className={`w-12 h-0.5 ${step > s ? 'bg-[#2C4C3B]' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>

          {/* Step 1: Role selection */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
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

              {selectedRole?.needReview && (
                <div className="bg-orange-50 text-orange-700 text-sm px-4 py-3 rounded-xl border border-orange-200">
                  ⏳ {selectedRole.label}账号需要管理员审核，审核通过后即可登录使用。
                </div>
              )}

              <button onClick={handleNext} className="w-full bg-[#2C4C3B] hover:bg-[#1E3529] text-white py-3 rounded-xl font-medium transition-colors">
                下一步
              </button>
            </div>
          )}

          {/* Step 2: WeChat binding */}
          {step === 2 && (
            <div className="space-y-4">
              {wxOpenid ? (
                // 已绑定微信（从回调跳回）
                <div className="text-center py-4">
                  <div className="text-5xl mb-4">✅</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">微信已绑定</h3>
                  <div className="flex items-center justify-center gap-3 mb-4">
                    {wxAvatar && <img src={wxAvatar} alt="" className="w-12 h-12 rounded-full" />}
                    <span className="text-gray-700 font-medium">{wxNickname || '微信用户'}</span>
                  </div>
                  <p className="text-sm text-gray-500">注册后可直接用微信扫码登录</p>
                </div>
              ) : (
                // 未绑定微信
                <div className="text-center py-4">
                  <div className="text-5xl mb-4">🔗</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">绑定微信（可选）</h3>
                  <p className="text-sm text-gray-500 mb-6">绑定后可直接用微信扫码登录，无需输入密码</p>

                  <button
                    onClick={handleBindWx}
                    className="w-full bg-[#07C160] hover:bg-[#06AE56] text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178A1.17 1.17 0 014.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178 1.17 1.17 0 01-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 01.598.082l1.584.926a.272.272 0 00.14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 01-.023-.156.49.49 0 01.201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-7.062-6.122zm-2.18 2.769c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.97-.982z"/>
                    </svg>
                    微信一键绑定
                  </button>

                  <p className="text-xs text-gray-400 mt-3">PC 端将显示二维码，手机端直接拉起微信</p>

                  <button
                    onClick={handleSkipWx}
                    className="w-full mt-4 bg-gray-100 hover:bg-gray-200 text-gray-600 py-3 rounded-xl font-medium transition-colors"
                  >
                    暂不绑定，跳过
                  </button>
                </div>
              )}

              <div className="flex space-x-3">
                <button onClick={handleBack} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-medium transition-colors">
                  上一步
                </button>
                <button onClick={() => setStep(3)} className="flex-1 bg-[#2C4C3B] hover:bg-[#1E3529] text-white py-3 rounded-xl font-medium transition-colors">
                  下一步
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Basic info */}
          {step === 3 && (
            <div className="space-y-4">
              {/* 微信绑定状态提示 */}
              {wxOpenid && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2">
                  {wxAvatar && <img src={wxAvatar} alt="" className="w-6 h-6 rounded-full" />}
                  <span className="text-sm text-green-700">✅ 微信已绑定：{wxNickname || '微信用户'}</span>
                </div>
              )}

              {/* 基本信息 */}
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

              {/* 角色专属字段 */}
              {roleApply === 'broker' && (
                <div className="space-y-3 pt-2 border-t border-gray-100">
                  <p className="text-sm font-medium text-gray-700">🤝 合伙人信息</p>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">负责区域 *</label>
                    <RegionSelector
                      province={brokerProvince}
                      city={brokerCity}
                      district=""
                      onProvinceChange={setBrokerProvince}
                      onCityChange={setBrokerCity}
                      onDistrictChange={() => {}}
                      showDistrict={false}
                    />
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

              {roleApply === 'village_org' && (
                <div className="space-y-3 pt-2 border-t border-gray-100">
                  <p className="text-sm font-medium text-gray-700">🏛️ 村集体信息</p>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">村委/机构名称 *</label>
                    <input type="text" value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="如：余村村委会"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-[#2C4C3B]" />
                  </div>
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                    <p className="text-xs text-blue-700">📋 注册后需上传村委授权书，管理员审核通过后即可发布「村委直发」资产。</p>
                  </div>
                </div>
              )}

              {roleApply === 'project_publisher' && (
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-sm font-medium text-gray-700 mb-2">🏢 大宗项目信息</p>
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                    <p className="text-xs text-blue-700">📋 审核通过后，您可以在用户后台发布大宗路演项目（含面积、收益率、商业计划等专属字段）。</p>
                  </div>
                </div>
              )}

              {selectedRole?.needReview && (
                <div className="bg-orange-50 text-orange-700 text-sm px-4 py-3 rounded-xl border border-orange-200">
                  ⏳ {selectedRole.label}账号需要管理员审核，审核通过后即可登录使用。
                </div>
              )}

              {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl border border-red-200">{error}</div>}

              <div className="flex space-x-3">
                <button onClick={handleBack} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-medium transition-colors">
                  上一步
                </button>
                <button onClick={validateAndSubmit} disabled={loading} className="flex-1 bg-[#2C4C3B] hover:bg-[#1E3529] text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-50">
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
