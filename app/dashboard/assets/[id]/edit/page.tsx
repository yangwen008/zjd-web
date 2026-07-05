'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import RichTextEditor from '@/components/shared/RichTextEditor';

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
  { value: '种植', icon: '🌾' },
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
    certification: 'uncertified',
    contact_name: '',
    contact_phone: '',
  });

  const [transport, setTransport] = useState({ highway: '', rail: '', airport: '', bus: '', metro: '' });
  const [certInfo, setCertInfo] = useState({ ownership_type: '', cert_type: '' });

  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [existingVideo, setExistingVideo] = useState<string | null>(null);
  const [newImages, setNewImages] = useState<{ preview: string; server: string }[]>([]);
  const [newVideo, setNewVideo] = useState<{ preview: string; server: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [provinceList, setProvinceList] = useState<string[]>([]);
  const [cityList, setCityList] = useState<string[]>([]);
  const [districtList, setDistrictList] = useState<string[]>([]);

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
    if (!formData.province) { setCityList([]); setDistrictList([]); return; }
    fetch(`/api/regions?level=city&province=${encodeURIComponent(formData.province)}`)
      .then(r => r.json())
      .then((d: any) => setCityList((d.data || []).map((c: any) => c.name)))
      .catch(() => {});
  }, [formData.province]);

  useEffect(() => {
    if (!formData.province || !formData.city) { setDistrictList([]); return; }
    fetch(`/api/regions?level=district&province=${encodeURIComponent(formData.province)}&city=${encodeURIComponent(formData.city)}`)
      .then(r => r.json())
      .then((d: any) => setDistrictList((d.data || []).map((c: any) => c.name)))
      .catch(() => {});
  }, [formData.province, formData.city]);

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
            certification: asset.certification || 'uncertified',
            contact_name: asset.contact_name || '',
            contact_phone: asset.contact_phone || '',
          });
          // 加载交通信息和权证信息
          try { if (asset.transport_info) setTransport(JSON.parse(asset.transport_info)); } catch {}
          try { if (asset.cert_info) setCertInfo(JSON.parse(asset.cert_info)); } catch {}
          // 加载已有图片
          try {
            const imgs = asset.images ? JSON.parse(asset.images) : [];
            setExistingImages(Array.isArray(imgs) ? imgs : []);
          } catch { setExistingImages([]); }
          setExistingVideo(asset.video_url || null);
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

  // 上传文件
  const uploadFile = async (file: File): Promise<{ url: string } | null> => {
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
      return upData.success ? { url: upData.url } : null;
    } catch { return null; }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    const list = [...newImages];
    for (const file of files) {
      if (!file.type.startsWith('image/') || file.size > 10 * 1024 * 1024) continue;
      const preview = URL.createObjectURL(file);
      const result = await uploadFile(file);
      if (result) { list.push({ preview, server: result.url }); setNewImages([...list]); }
      else { URL.revokeObjectURL(preview); show(`❌ ${file.name} 上传失败`); }
    }
    setUploading(false);
    e.target.value = '';
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/') || file.size > 50 * 1024 * 1024) { show('❌ 视频格式或大小不符'); return; }
    setUploading(true);
    const preview = URL.createObjectURL(file);
    const result = await uploadFile(file);
    if (result) { setNewVideo({ preview, server: result.url }); }
    else { URL.revokeObjectURL(preview); show('❌ 视频上传失败'); }
    setUploading(false);
    e.target.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) { show('❌ 请输入资产标题'); return; }
    if (!formData.province) { show('❌ 请选择省份'); return; }
    if (!formData.area_mu || parseFloat(formData.area_mu) <= 0) { show('❌ 请输入有效面积'); return; }

    setSaving(true);
    try {
      const allImages = [...existingImages, ...newImages.map(i => i.server)];
      const videoUrl = newVideo ? newVideo.server : existingVideo || '';

      const res = await fetch('/api/dashboard/assets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: parseInt(assetId), ...formData, images: JSON.stringify(allImages), video_url: videoUrl, transport_info: Object.values(transport).some(v => v) ? transport : undefined, cert_info: Object.values(certInfo).some(v => v) ? certInfo : undefined }),
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
            <RichTextEditor
              value={formData.description}
              onChange={(val) => setFormData({ ...formData, description: val })}
              placeholder="描述资产亮点、周边环境、交通情况、适合用途等..."
            />
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
          <div className="grid grid-cols-3 gap-3">
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
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">区县</label>
              <select value={formData.district} onChange={e => setFormData({ ...formData, district: e.target.value })}
                disabled={!formData.city}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg">
                <option value="">{formData.city ? '请选择区县' : '请先选择城市'}</option>
                {districtList.map(name => <option key={name} value={name}>{name}</option>)}
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

        {/* 图片与视频 */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <h3 className="font-bold text-gray-800 border-b pb-2">📷 图片与视频</h3>

          {/* 已有图片 */}
          {existingImages.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">当前图片（点击×移除）</label>
              <div className="grid grid-cols-4 gap-3">
                {existingImages.map((url, i) => (
                  <div key={i} className="relative aspect-square group">
                    <img src={url} alt="" className="w-full h-full object-cover rounded-lg border border-gray-200" />
                    <button type="button" onClick={() => setExistingImages(existingImages.filter((_, j) => j !== i))}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600 shadow opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 新增图片 */}
          {newImages.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">新增图片</label>
              <div className="grid grid-cols-4 gap-3">
                {newImages.map((item, i) => (
                  <div key={i} className="relative aspect-square group">
                    <img src={item.preview} alt="" className="w-full h-full object-cover rounded-lg border border-gray-200" />
                    <button type="button" onClick={() => { URL.revokeObjectURL(item.preview); setNewImages(newImages.filter((_, j) => j !== i)); }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600 shadow opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center space-x-3">
            <label className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg border border-dashed border-gray-300 hover:border-brand-green cursor-pointer transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
              <span className="text-lg">📷</span>
              <span className="text-sm text-gray-600">添加图片</span>
              <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
            </label>
            <span className="text-xs text-gray-400">JPG/PNG/WebP，单张 ≤ 10MB</span>
          </div>

          {/* 视频 */}
          {(existingVideo || newVideo) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">视频</label>
              <div className="relative w-64">
                <video src={newVideo?.preview || existingVideo || ''} controls className="w-full h-36 object-cover rounded-lg border border-gray-200" />
                <button type="button" onClick={() => { if (newVideo) URL.revokeObjectURL(newVideo.preview); setNewVideo(null); setExistingVideo(null); }}
                  className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600 shadow">×</button>
              </div>
            </div>
          )}
          {!existingVideo && !newVideo && (
            <div className="flex items-center space-x-3">
              <label className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg border border-dashed border-gray-300 hover:border-brand-green cursor-pointer transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                <span className="text-lg">🎥</span>
                <span className="text-sm text-gray-600">添加视频</span>
                <input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
              </label>
              <span className="text-xs text-gray-400">MP4/WebM，≤ 50MB</span>
            </div>
          )}
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

        {/* 交通信息 */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <h3 className="font-bold text-gray-800 border-b pb-2">🚗 交通信息</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: 'highway', icon: '🚗', label: '距高速出口', options: ['15分钟内', '30分钟内', '60分钟内', '60分钟以上'] },
              { key: 'rail', icon: '🚄', label: '距高铁站', options: ['15分钟内', '30分钟内', '60分钟内', '60分钟以上'] },
              { key: 'airport', icon: '✈️', label: '距机场', options: ['30分钟内', '60分钟内', '90分钟内', '90分钟以上'] },
              { key: 'bus', icon: '🚌', label: '公交', options: ['有直达', '需转车', '无公交'] },
              { key: 'metro', icon: '🚇', label: '地铁', options: ['有站点', '规划中', '无地铁'] },
            ].map((item) => (
              <div key={item.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{item.icon} {item.label}</label>
                <select
                  value={(transport as any)[item.key]}
                  onChange={(e) => setTransport({ ...transport, [item.key]: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green"
                >
                  <option value="">请选择</option>
                  {item.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>

        {/* 权证信息 */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <h3 className="font-bold text-gray-800 border-b pb-2">📋 权证信息</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">权属类型</label>
              <select value={certInfo.ownership_type} onChange={(e) => setCertInfo({ ...certInfo, ownership_type: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg">
                <option value="">请选择</option>
                <option value="集体">集体</option>
                <option value="国有">国有</option>
                <option value="个人">个人</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">权证类型</label>
              <select value={certInfo.cert_type} onChange={(e) => setCertInfo({ ...certInfo, cert_type: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg">
                <option value="">请选择</option>
                <option value="不动产权证书">不动产权证书</option>
                <option value="宅基地使用权证">宅基地使用权证</option>
                <option value="土地承包经营权证">土地承包经营权证</option>
                <option value="暂无">暂无</option>
              </select>
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
