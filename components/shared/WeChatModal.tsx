'use client';

export default function WeChatModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  const roles = [
    { icon: '👤', label: '高净值买家', selected: true },
    { icon: '🏛️', label: '政府/村集体G端', selected: false },
    { icon: '🤝', label: '金牌合伙人B端', selected: false },
    { icon: '🏢', label: '文旅机构大B端', selected: false },
  ];

  return (
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-brand-dark p-6 text-center relative">
            <button onClick={onClose} className="absolute top-4 right-4 text-white/60 hover:text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="text-3xl mb-2">🔐</div>
            <div className="text-white font-bold text-lg">微信一键扫码注册入驻</div>
            <div className="text-gray-400 text-xs mt-1">全免大盘。绑定微信即可实时解除高斯精确物理防抄锁。</div>
          </div>

          {/* Body */}
          <div className="p-6">
            <div className="text-xs font-medium text-gray-500 mb-3">第一步：选择您的平台身份</div>
            <div className="grid grid-cols-2 gap-2 mb-6">
              {roles.map((role) => (
                <button
                  key={role.label}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${
                    role.selected
                      ? 'border-brand-green bg-brand-green/5'
                      : 'border-gray-200 hover:border-brand-green/50'
                  }`}
                >
                  <div className="text-2xl mb-1">{role.icon}</div>
                  <div className="text-xs font-bold text-gray-900">{role.label}</div>
                </button>
              ))}
            </div>

            <div className="text-xs font-medium text-gray-500 mb-3">第二步：点击扫码框仿真绑定</div>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-brand-green/50 transition-colors">
              <div className="text-5xl mb-3">📱</div>
              <div className="text-sm text-gray-500">💡 点击此处一键完成模拟微信扫码</div>
            </div>

            <div className="mt-4 text-center text-xs text-gray-400">
              已安全接入 2026 个人合规数据隐私链
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
