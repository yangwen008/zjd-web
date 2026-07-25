'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Professional {
  id: number;
  prof_type: string;
  name: string;
  org_name: string | null;
  phone: string | null;
  bio: string | null;
  license_no: string | null;
  qualification: string | null;
  province: string | null;
  city: string | null;
  service_areas: string | null;
  services: string | null;
  pricing_model: string;
  price_min: number | null;
  price_max: number | null;
  rating: number;
  review_count: number;
  order_count: number;
  verified: number;
}

interface ServiceItem {
  name: string;
  price: string;
  duration: string;
}

interface Review {
  id: number;
  service_name: string;
  review_rating: number;
  review_text: string | null;
  created_at: string;
  user_nickname?: string;
}

const TYPE_LABELS: Record<string, string> = { notary: '公证处', lawyer: '律师', fengshui: '风水师' };
const TYPE_ICONS: Record<string, string> = { notary: '📋', lawyer: '⚖️', fengshui: '🏔️' };

function parseJson<T>(json: string | null, fallback: T): T {
  if (!json) return fallback;
  try { return JSON.parse(json); } catch { return fallback; }
}

export default function ProfessionalDetailPage() {
  const params = useParams();
  const id = params?.id;

  const [data, setData] = useState<Professional | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBooking, setShowBooking] = useState(false);
  const [selectedService, setSelectedService] = useState('');
  const [bookingForm, setBookingForm] = useState({ contact_name: '', contact_phone: '', notes: '' });
  const [bookingStatus, setBookingStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [bookingMsg, setBookingMsg] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/professionals/${id}`)
      .then(r => r.json())
      .then((d: any) => {
        if (d.success) {
          setData(d.data);
          setReviews(d.reviews || []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleBook = async () => {
    if (!selectedService) { setBookingMsg('请选择服务项目'); return; }
    setBookingStatus('loading');
    try {
      const res = await fetch('/api/professionals/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          professional_id: data?.id,
          service_name: selectedService,
          ...bookingForm,
        }),
      });
      const d: any = await res.json();
      if (d.success) {
        setBookingStatus('success');
        setBookingMsg('预约成功！服务商将尽快联系您。');
        setTimeout(() => { setShowBooking(false); setBookingStatus('idle'); }, 2000);
      } else {
        setBookingStatus('error');
        setBookingMsg(d.error || '预约失败');
      }
    } catch {
      setBookingStatus('error');
      setBookingMsg('网络错误');
    }
  };

  if (loading) {
    return <main className="pt-20 pb-16 bg-gray-50 min-h-screen"><div className="text-center py-16 text-gray-400">加载中...</div></main>;
  }

  if (!data) {
    return <main className="pt-20 pb-16 bg-gray-50 min-h-screen"><div className="text-center py-16 text-gray-400">服务商不存在</div></main>;
  }

  const services = parseJson<ServiceItem[]>(data.services, []);
  const serviceAreas = parseJson<string[]>(data.service_areas, []);

  return (
    <main className="pt-20 pb-16 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-400 mb-6">
          <Link href="/" className="hover:text-gray-600">首页</Link>
          <span className="mx-2">/</span>
          <Link href="/services" className="hover:text-gray-600">交易服务中心</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-700">{data.name}</span>
        </nav>

        {/* Header Card */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden mb-6">
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-brand-green/10 flex items-center justify-center text-3xl flex-shrink-0">
                {TYPE_ICONS[data.prof_type] || '👤'}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold text-gray-900">{data.name}</h1>
                  {data.verified === 1 && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">平台认证</span>
                  )}
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                    {TYPE_LABELS[data.prof_type]}
                  </span>
                </div>
                {data.org_name && <p className="text-gray-600 mb-1">{data.org_name}</p>}
                {data.qualification && <p className="text-sm text-gray-500">{data.qualification}</p>}
                {data.license_no && <p className="text-sm text-gray-400">执业证号：{data.license_no}</p>}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-500">⭐ {data.rating.toFixed(1)}</div>
                <div className="text-xs text-gray-400">综合评分</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{data.review_count}</div>
                <div className="text-xs text-gray-400">用户评价</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{data.order_count}</div>
                <div className="text-xs text-gray-400">服务次数</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-brand-green">
                  {data.price_min && data.price_max ? `¥${data.price_min}-${data.price_max}` : '面议'}
                </div>
                <div className="text-xs text-gray-400">价格范围</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
          <h2 className="font-bold text-gray-900 mb-3">📝 个人简介</h2>
          <p className="text-gray-600 leading-relaxed">{data.bio || '暂无简介'}</p>
        </div>

        {/* Service Areas */}
        {serviceAreas.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
            <h2 className="font-bold text-gray-900 mb-3">📍 服务区域</h2>
            <div className="flex flex-wrap gap-2">
              {serviceAreas.map((area, i) => (
                <span key={i} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">{area}</span>
              ))}
            </div>
          </div>
        )}

        {/* Services */}
        {services.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
            <h2 className="font-bold text-gray-900 mb-4">🛎️ 服务项目</h2>
            <div className="space-y-3">
              {services.map((s, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div>
                    <div className="font-medium text-gray-900">{s.name}</div>
                    <div className="text-sm text-gray-500">预计 {s.duration}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-brand-green">{s.price}</div>
                    <button
                      onClick={() => { setSelectedService(s.name); setShowBooking(true); }}
                      className="text-xs text-brand-green hover:underline mt-1"
                    >
                      立即预约 →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reviews */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
          <h2 className="font-bold text-gray-900 mb-4">💬 用户评价 ({data.review_count})</h2>
          {reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map(r => (
                <div key={r.id} className="border-b border-gray-50 pb-4 last:border-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-yellow-500">{'⭐'.repeat(r.review_rating || 5)}</span>
                    <span className="text-sm text-gray-500">{r.user_nickname || '匿名用户'}</span>
                    <span className="text-xs text-gray-400">{r.created_at?.slice(0, 10)}</span>
                  </div>
                  <p className="text-sm text-gray-600">{r.review_text || '好评'}</p>
                  <p className="text-xs text-gray-400 mt-1">服务：{r.service_name}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">暂无评价</p>
          )}
        </div>

        {/* Contact / Book Button */}
        <div className="sticky bottom-4 z-10">
          <button
            onClick={() => setShowBooking(true)}
            className="w-full bg-brand-green hover:bg-brand-light text-white py-4 rounded-xl font-bold text-lg shadow-lg transition-colors"
          >
            📞 预约咨询
          </button>
        </div>

        {/* Booking Modal */}
        {showBooking && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setShowBooking(false)}>
            <div className="bg-white rounded-t-2xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">预约 {data.name}</h3>
                <button onClick={() => setShowBooking(false)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>

              {/* Service selector */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">选择服务项目</label>
                <select
                  value={selectedService}
                  onChange={e => setSelectedService(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                >
                  <option value="">请选择...</option>
                  {services.map((s, i) => (
                    <option key={i} value={s.name}>{s.name} — {s.price}</option>
                  ))}
                </select>
              </div>

              {/* Contact info */}
              <div className="space-y-3 mb-4">
                <input
                  type="text"
                  placeholder="您的姓名"
                  value={bookingForm.contact_name}
                  onChange={e => setBookingForm(f => ({ ...f, contact_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                />
                <input
                  type="tel"
                  placeholder="您的手机号"
                  value={bookingForm.contact_phone}
                  onChange={e => setBookingForm(f => ({ ...f, contact_phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                />
                <textarea
                  placeholder="补充说明（选填）"
                  value={bookingForm.notes}
                  onChange={e => setBookingForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                />
              </div>

              {/* Status message */}
              {bookingMsg && (
                <div className={`mb-4 px-3 py-2 rounded-lg text-sm ${
                  bookingStatus === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  {bookingMsg}
                </div>
              )}

              <button
                onClick={handleBook}
                disabled={bookingStatus === 'loading'}
                className="w-full bg-brand-green hover:bg-brand-light text-white py-3 rounded-xl font-bold disabled:opacity-50"
              >
                {bookingStatus === 'loading' ? '提交中...' : '确认预约'}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
