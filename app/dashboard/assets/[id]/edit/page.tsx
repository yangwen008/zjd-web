'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

const ASSET_TYPES = [
  { value: '宅基地', icon: '🏠' },
  { value: '林地', icon: '🌲' },
  { value: '茶园', icon: '🍵' },
  { value: '古宅', icon: '🏘️' },
  { value: '厂房', icon: '🏭' },
  { value: '商铺', icon: '🏪' },
  { value: '林盘', icon: '🌿' },
  { value: '古村落', icon: '🏚️' },
  { value: '民宿群', icon: '🏡' },
  { value: '果园', icon: '🍊' },
];

export default function EditAssetPage() {
  const router = useRouter();
  const params = useParams();
  const assetId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [notFound, setNotFound] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    province: '',
    city: '',
    district: '',
    address: '',
    area_mu: '',
    price_year: '',
    price_total: '',
    lease_years: '20',
    asset_type: '宅基地',
    contact_name: '',
    contact_phone: '',
  });

  const [provinceList, setProvinceList] = useState<string[]>([]);
  const [cityList, setCityList] = useState<string[]>([]);

  const show = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 5000); };

  // Load provinces
  useEffect(() => {
    fetch('/api/regions?level=province')
      .then(r => r.json())
      .then((d: any) => setProvinceList((d.data || []).map((p: any) => p.name)))
      .catch(() => {});
  }, []);

  // Load cities when province changes
  useEffect(() => {
    if (!formData.province) { setCityList([]); return; }
    fetch(`/api/regions?level=city&province=${encodeURIComponent(formData.province)}`)
      .then(r => r.json())
      .then((d: any) => setCityList((d.data || []).map((c: any) => c.name)))
      .catch(() => {});
  }, [formData.province]);

  // Load asset data
  useEffect(() => {
    fetch(`/api/dashboard/assets?id=${assetId}`)
      .then(r => r.json())
      .then((d: any) => {
        if (d.success && d.data) {
          const asset = Array.isArray(d.data) ? d.data.find((a: any) => a.id === parseInt(assetId)) : d.data;
          if (!asset) { setNotFound(true); return; }
          setFormData({
            title: asset.title || '',
            description: asset.description || '',
            province: asset.province || '',
            city: asset.city || '',
            district: asset.district || '',
            address: asset.address || '',
            area_mu: asset.area_mu?.toString() || '',
            price_year: asset.price_year?.toString() || '',
            price_total: asset.price_total?.toString() || '',
            lease_years: asset.lease_years?.toString() || '20',
            asset_type: asset.asset_type || '宅基地',
            contact_name: asset.contact_name || '',
            contact_phone: asset.contact_phone || '',
          });
        } else {
          setNotFound(true);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [assetId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) { show('❌ 请输入资产标题'); return; }
    if (!formData.province) { show('❌ 请选择省份'); return; }
    if (!formData.area_mu || parseFloat(formData.area_mu) <= 0) { show('❌ 请输入有效面积'); return; }

    setSaving(true);
    try {
      const res = await fetch('/api/dashboard/assets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: parseInt(assetId), ...formData }),
      });
      const d = await res.json() as any;
      if (d.success) {
        show('✅ 保存成功');
        setTimeout(() => router.push('/dashboard/assets'), 1500);
      } else {
        show(`❌ ${d.error || '保存失败'}`);
      }
    } catch {
      show('❌ 网络错误');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-16 text-gray-400">加载中...</div>;
  if (notFound) return (
    <div className="text-center py-16">
      <div className="text-5xl mb-4">🏚️</div>
      <p className="text-lg text-gray-500">资产不存在或无权编辑</p>
      <button onClick={() => router.push('/dashboard/assets')} className="mt-4 text-brand-green hover:underline">返回我的资产</button>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto pb-20">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">✏️ 修改资产</h1>
        <p className="text-sm text-gray-500 mt-1">修改后需重新审核</p>
      </div>

      {msg && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm sticky top-20 z-50 ${
          msg.startsWith('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>{msg}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 基础信息 */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <h3 className="font-bold text-gray-800 border-b pb-2">📝 基础信息</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">资产标题 *</label>
            <input name="title" value={formData.title} onChange={handleChange} required maxLength={80}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">详细描述</label>
            <textarea name="description" value={formData.description} onChange={handleChange} rows={4}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">资产类型</label>
              <select name="asset_type" value={formData.asset_type} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg">
                {ASSET_TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.value}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">流转年限</label>
              <select name="lease_years" value={formData.lease_years} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg">
                <option value="10">10年</option><option value="15">15年</option><option value="20">20年</option>
                <option value="30">30年</option><option value="50">50年</option>
              </select>
            </div>
          </div>
        </div>

        {/* 地址 */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <h3 className="font-bold text-gray-800 border-b pb-2">📍 地址信息</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">省份</label>
              <select value={formData.province} onChange={e => setFormData({ ...formData, province: e.target.value, city: '', district: '' })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg">
                <option value="">请选择省份</option>
                {provinceList.map(name => <option key={name} value={name}>{name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">城市</label>
              <select value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value, district: '' })}
                disabled={!formData.province}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg">
                <option value="">{formData.province ? '请选择城市' : '请先选择省份'}</option>
                {cityList.map(name => <option key={name} value={name}>{name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">详细地址</label>
            <input name="address" value={formData.address} onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green" />
          </div>
        </div>

        {/* 价格 */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <h3 className="font-bold text-gray-800 border-b pb-2">💰 价格信息</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">面积 (亩) *</label>
              <input type="number" step="0.01" name="area_mu" value={formData.area_mu} onChange={handleChange} required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">年租金 (万)</label>
              <input type="number" step="0.1" name="price_year" value={formData.price_year} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">总价 (万)</label>
              <input type="number" step="0.1" name="price_total" value={formData.price_total} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
            </div>
          </div>
        </div>

        {/* 联系方式 */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <h3 className="font-bold text-gray-800 border-b pb-2">📞 联系方式</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">联系人</label>
              <input name="contact_name" value={formData.contact_name} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">联系电话</label>
              <input type="tel" name="contact_phone" value={formData.contact_phone} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
            </div>
          </div>
        </div>

        <div className="flex space-x-3">
          <button type="button" onClick={() => router.push('/dashboard/assets')}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-medium transition-colors">
            取消
          </button>
          <button type="submit" disabled={saving}
            className="flex-1 bg-brand-green text-white py-3 rounded-xl font-medium hover:bg-brand-light transition-colors disabled:opacity-50">
            {saving ? '保存中...' : '✅ 保存修改'}
          </button>
        </div>
      </form>
    </div>
  );
}
