'use client';

import { useState } from 'react';

interface InvestCardProps {
  assetId: number;
  assetType: 'asset' | 'bulk_project';
  assetTitle: string;
  investEnabled: boolean;
  totalShares: number;
  sharePrice: number;
  minShares: number;
  soldShares: number;
}

const DISCLAIMER = '本平台仅提供意向征集与信息撮合服务，不介入任何资金往来与线下交易，不承诺投资回报，参投人应自行核实资产权属并承担全部投资风险。';

export default function InvestCard({
  assetId, assetType, assetTitle, investEnabled,
  totalShares, sharePrice, minShares, soldShares,
}: InvestCardProps) {
  const [showModal, setShowModal] = useState(false);
  const [shares, setShares] = useState(minShares);
  const [notes, setNotes] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (!investEnabled) return null;

  const remaining = totalShares - soldShares;
  const isFull = remaining <= 0;
  const amount = shares * sharePrice;

  const handleSubmit = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch('/api/invest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetId,
          assetType,
          shares,
          notes: notes || undefined,
          contactName: contactName || undefined,
          contactPhone: contactPhone || undefined,
        }),
      });
      const data: any = await res.json();
      if (data.success) {
        setMsg({ text: '✅ 认购意向已提交，发布者将尽快联系您', ok: true });
        setSubmitted(true);
        setTimeout(() => setShowModal(false), 2000);
      } else {
        setMsg({ text: `❌ ${data.error}`, ok: false });
      }
    } catch {
      setMsg({ text: '❌ 网络错误', ok: false });
    } finally {
      setLoading(false);
    }
  };

  const isOver = soldShares > totalShares;
  const overPct = isOver ? Math.round(((soldShares - totalShares) / totalShares) * 100) : 0;
  const progressPct = Math.min((soldShares / totalShares) * 100, 100);

  return (
    <>
      {/* 参投卡片 */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="font-bold text-gray-900 mb-3">💰 参投认购</h3>
        <div className="text-sm text-gray-500 mb-1">
          总计 {totalShares} 份 · 每份 ¥{sharePrice}万
        </div>
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 bg-gray-100 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full transition-all ${isOver ? 'bg-orange-500' : 'bg-brand-green'}`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className={`text-xs whitespace-nowrap ${isOver ? 'text-orange-600 font-medium' : 'text-gray-500'}`}>
            {soldShares}/{totalShares}{isOver && ` (超额${overPct}%)`}
          </span>
        </div>
        <div className="text-xs text-gray-400 mb-3">
          {isOver
            ? <span className="text-orange-600">已超额认购，仍可提交意向</span>
            : <>最低起投 {minShares} 份</>
          }
        </div>
        <button
          onClick={() => { setShowModal(true); setMsg(null); setSubmitted(false); }}
          className="w-full bg-brand-green hover:bg-brand-light text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          我要参投 →
        </button>
      </div>

      {/* 参投弹窗 */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl">✕</button>
            <h3 className="text-lg font-bold text-gray-900 mb-1">参投认购</h3>
            <p className="text-sm text-gray-500 mb-4 line-clamp-1">{assetTitle}</p>

            {/* 参投进度 */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex-1 bg-gray-100 rounded-full h-2">
                <div className="bg-brand-green h-2 rounded-full" style={{ width: `${progressPct}%` }} />
              </div>
              <span className={`text-xs ${isOver ? 'text-orange-600 font-medium' : 'text-gray-500'}`}>{soldShares}/{totalShares} 份{isOver && ' · 已超额'}</span>
            </div>

            {submitted ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">✅</div>
                <p className="text-gray-700 font-medium">认购意向已提交</p>
                <p className="text-sm text-gray-400 mt-1">发布者将尽快联系您</p>
              </div>
            ) : (
              <>
                {/* 选择份数 */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">认购份数</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShares(Math.max(minShares, shares - 1))}
                      className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center text-lg hover:bg-gray-50"
                    >−</button>
                    <input
                      type="number"
                      value={shares}
                      onChange={(e) => {
                        const v = parseInt(e.target.value) || minShares;
                        setShares(Math.max(minShares, v));
                      }}
                      className="w-20 text-center text-lg font-bold border border-gray-200 rounded-lg py-2 outline-none focus:border-brand-green"
                    />
                    <button
                      onClick={() => setShares(shares + 1)}
                      className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center text-lg hover:bg-gray-50"
                    >+</button>
                    <div className="text-sm text-gray-500 ml-2">
                      = <strong className="text-gray-900">¥{amount.toFixed(1)}万</strong>
                    </div>
                  </div>
                </div>

                {/* 联系信息 */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">姓名</label>
                    <input
                      type="text"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="您的姓名"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">电话</label>
                    <input
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="联系电话"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green"
                    />
                  </div>
                </div>

                {/* 备注 */}
                <div className="mb-4">
                  <label className="block text-xs text-gray-500 mb-1">备注（选填）</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="投资意向说明..."
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green resize-none"
                  />
                </div>

                {/* 消息提示 */}
                {msg && (
                  <div className={`text-sm mb-3 px-3 py-2 rounded-lg ${msg.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {msg.text}
                  </div>
                )}

                {/* 免责声明 */}
                <div className="text-xs text-gray-400 leading-relaxed mb-4 px-1">
                  ⚠️ {DISCLAIMER}
                </div>

                {/* 提交按钮 */}
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full bg-brand-green hover:bg-brand-light text-white py-3 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {loading ? '提交中...' : '确认参投'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
