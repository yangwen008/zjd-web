'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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

export default function PublishAssetPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [user, setUser] = useState<any>(null);
  const [uploadedImages, setUploadedImages] = useState<{ preview: string; server: string }[]>([]);
  const [uploadedVideos, setUploadedVideos] = useState<{ preview: string; server: string }[]>([]);
  const [uploading, setUploading] = useState(false);

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
    gps_lat: '',
    gps_lng: '',
  });

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d: any) => {
        if (d.success) setUser(d.user);
        else router.push('/login');
      });
  }, [router]);

  const [uploadErrors, setUploadErrors] = useState<string[]>([]);

  const show = (m: string, persist?: boolean) => {
    setMsg(m);
    if (!persist) setTimeout(() => setMsg(''), 5000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // GPS 定位
  const handleGetLocation = () => {
    if (!navigator.geolocation) { show('❌ 您的浏览器不支持地理位置'); return; }
    show('📍 正在获取位置...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData({ ...formData, gps_lat: pos.coords.latitude.toFixed(6), gps_lng: pos.coords.longitude.toFixed(6) });
        show('✅ 定位成功');
      },
      () => show('❌ 获取位置失败，请检查浏览器权限'),
    );
  };

  // 通用上传函数
  const uploadFile = async (file: File): Promise<{ url: string } | null> => {
    try {
      const res = await fetch('/api/upload/r2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      });
      const data: any = await res.json();
      if (!data.success) {
        console.error('Presign failed:', data.error);
        return null;
      }

      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      const uploadRes = await fetch(data.uploadUrl, { method: 'POST', body: formDataUpload });
      const uploadData: any = await uploadRes.json();
      if (!uploadData.success) {
        console.error('Upload failed:', uploadData.error);
        return null;
      }
      return { url: uploadData.url };
    } catch (err) {
      console.error('Upload exception:', err);
      return null;
    }
  };

  // 图片上传
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    const newList = [...uploadedImages];

    for (const file of files) {
      if (!file.type.startsWith('image/')) { show(`❌ ${file.name} 不是图片`); continue; }
      if (file.size > 10 * 1024 * 1024) { show(`❌ ${file.name} 超过10MB`); continue; }

      const preview = URL.createObjectURL(file);
      const result = await uploadFile(file);
      if (result) {
        newList.push({ preview, server: result.url });
        setUploadedImages([...newList]);
        setUploadErrors((prev) => prev.filter((e) => !e.includes(file.name)));
        show(`✅ ${file.name} 上传成功`);
      } else {
        URL.revokeObjectURL(preview);
        const errMsg = `${file.name} 上传失败，请检查网络后重试`;
        setUploadErrors((prev) => [...prev, errMsg]);
        show(`❌ ${errMsg}`, true);
      }
    }
    setUploading(false);
    e.target.value = ''; // 重置 input 允许重复选择同文件
  };

  // 视频上传
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    const newList = [...uploadedVideos];

    for (const file of files) {
      if (!file.type.startsWith('video/')) { show(`❌ ${file.name} 不是视频`); continue; }
      if (file.size > 50 * 1024 * 1024) { show(`❌ ${file.name} 超过50MB`); continue; }

      const preview = URL.createObjectURL(file);
      const result = await uploadFile(file);
      if (result) {
        newList.push({ preview, server: result.url });
        setUploadedVideos([...newList]);
        show(`✅ ${file.name} 上传成功`);
      } else {
        URL.revokeObjectURL(preview);
        show(`❌ ${file.name} 上传失败，请检查网络后重试`, true);
      }
    }
    setUploading(false);
    e.target.value = '';
  };

  const removeImage = (i: number) => {
    const newList = [...uploadedImages];
    URL.revokeObjectURL(newList[i].preview);
    newList.splice(i, 1);
    setUploadedImages(newList);
  };

  const removeVideo = (i: number) => {
    const newList = [...uploadedVideos];
    URL.revokeObjectURL(newList[i].preview);
    newList.splice(i, 1);
    setUploadedVideos(newList);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { show('❌ 请先登录'); return; }
    if (!formData.title.trim()) { show('❌ 请输入资产标题'); return; }
    if (!formData.province) { show('❌ 请选择省份'); return; }
    if (!formData.area_mu || parseFloat(formData.area_mu) <= 0) { show('❌ 请输入有效面积'); return; }
    if (uploadedImages.length === 0) { show('❌ 请至少上传一张资产图片', true); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/dashboard/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: 'asset',
          ...formData,
          images: JSON.stringify(uploadedImages.map((i) => i.server)),
          video_url: uploadedVideos[0]?.server || '',
        }),
      });
      const d = await res.json() as any;
      if (d.success) {
        show('✅ 发布成功，等待管理员审核！');
        setTimeout(() => router.push('/dashboard/assets'), 1500);
      } else {
        show(`❌ ${d.error || '发布失败'}`);
      }
    } catch {
      show('❌ 网络错误');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div className="text-center py-16 text-gray-400">加载中...</div>;

  return (
    <div className="max-w-3xl mx-auto pb-20">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">🏠 发布闲置资产</h1>
        <p className="text-sm text-gray-500 mt-1">填写信息后提交审核，通过后将在前台展示</p>
      </div>

      {msg && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm sticky top-20 z-50 ${
          msg.startsWith('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>{msg}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ═══ 基础信息 ═══ */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <h3 className="font-bold text-gray-800 border-b pb-2">📝 基础信息</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">资产标题 *</label>
            <input name="title" value={formData.title} onChange={handleChange} required maxLength={80}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green"
              placeholder="如：安吉溪龙乡溪畔竹林宅基地" />
            <p className="text-xs text-gray-400 mt-1">{formData.title.length}/80</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">详细描述 *</label>
            <textarea name="description" value={formData.description} onChange={handleChange} required rows={4}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green"
              placeholder="描述资产亮点、周边环境、交通情况、适合用途等..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">资产类型 *</label>
              <select name="asset_type" value={formData.asset_type} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green">
                {ASSET_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.icon} {t.value}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">流转年限</label>
              <select name="lease_years" value={formData.lease_years} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green">
                <option value="10">10年</option>
                <option value="15">15年</option>
                <option value="20">20年</option>
                <option value="30">30年</option>
                <option value="50">50年</option>
              </select>
            </div>
          </div>
        </div>

        {/* ═══ 地址组件 ═══ */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <h3 className="font-bold text-gray-800 border-b pb-2">📍 地址信息</h3>

          <AddressSelects
            province={formData.province}
            city={formData.city}
            onProvinceChange={(v) => setFormData({ ...formData, province: v, city: '', district: '' })}
            onCityChange={(v) => setFormData({ ...formData, city: v, district: '' })}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">详细地址</label>
            <input name="address" value={formData.address} onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green"
              placeholder="如：溪龙乡xx村xx号（选填，便于精确导航）" />
          </div>

          {/* GPS */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-bold text-blue-800">🗺️ GPS 坐标</h4>
              <button type="button" onClick={handleGetLocation}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1">
                <span>📍</span><span>获取当前位置</span>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">纬度</label>
                <input name="gps_lat" value={formData.gps_lat} onChange={handleChange} placeholder="如: 30.630000"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">经度</label>
                <input name="gps_lng" value={formData.gps_lng} onChange={handleChange} placeholder="如: 119.680000"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">填写GPS坐标后，买家可在地图上精确查看地块位置</p>
          </div>
        </div>

        {/* ═══ 价格信息 ═══ */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <h3 className="font-bold text-gray-800 border-b pb-2">💰 价格信息</h3>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">面积 (亩) *</label>
              <input type="number" step="0.01" name="area_mu" value={formData.area_mu} onChange={handleChange} required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">年租金 (万)</label>
              <input type="number" step="0.1" name="price_year" value={formData.price_year} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green"
                placeholder="选填" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">总价 (万)</label>
              <input type="number" step="0.1" name="price_total" value={formData.price_total} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green"
                placeholder="选填" />
            </div>
          </div>
          <p className="text-xs text-gray-400">年租金和总价至少填一项，留空则显示「价格面议」</p>
        </div>

        {/* ═══ 多媒体 ═══ */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <h3 className="font-bold text-gray-800 border-b pb-2">📷 图片与视频</h3>

          {/* 上传错误提示 */}
          {uploadErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-red-700">⚠️ 上传失败</span>
                <button type="button" onClick={() => setUploadErrors([])} className="text-xs text-red-500 hover:text-red-700">清除</button>
              </div>
              {uploadErrors.map((err, i) => (
                <p key={i} className="text-xs text-red-600">• {err}</p>
              ))}
            </div>
          )}

          {/* 图片 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              图片上传 <span className="text-red-500">*</span>
              <span className="text-xs text-gray-400 ml-2">（至少1张，最多10张）</span>
            </label>
            <div className="flex items-center space-x-3">
              <label className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg border border-dashed border-gray-300 hover:border-brand-green cursor-pointer transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                <span className="text-lg">📷</span>
                <span className="text-sm text-gray-600">选择图片</span>
                <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
              </label>
              <span className="text-xs text-gray-400">JPG/PNG/WebP，单张 ≤ 10MB</span>
            </div>
            {uploadedImages.length === 0 && !uploading && (
              <p className="text-sm text-orange-500 mt-2">⚠️ 请至少上传一张图片，否则资产将无法通过审核</p>
            )}
            {uploadedImages.length > 0 && (
              <div className="grid grid-cols-4 gap-3 mt-3">
                {uploadedImages.map((item, i) => (
                  <div key={i} className="relative aspect-square group">
                    <img src={item.preview} alt="" className="w-full h-full object-cover rounded-lg border border-gray-200" />
                    {i === 0 && <span className="absolute top-1 left-1 bg-brand-green text-white text-[10px] px-1.5 py-0.5 rounded">封面</span>}
                    <button type="button" onClick={() => removeImage(i)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600 shadow opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 视频 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">视频上传（可选）</label>
            <div className="flex items-center space-x-3">
              <label className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg border border-dashed border-gray-300 hover:border-brand-green cursor-pointer transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                <span className="text-lg">🎥</span>
                <span className="text-sm text-gray-600">选择视频</span>
                <input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
              </label>
              <span className="text-xs text-gray-400">MP4/WebM，≤ 50MB</span>
            </div>
            {uploadedVideos.length > 0 && (
              <div className="grid grid-cols-2 gap-3 mt-3">
                {uploadedVideos.map((item, i) => (
                  <div key={i} className="relative group">
                    <video src={item.preview} controls className="w-full h-32 object-cover rounded-lg border border-gray-200" />
                    <button type="button" onClick={() => removeVideo(i)}
                      className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600 shadow opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ═══ 联系方式 ═══ */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <h3 className="font-bold text-gray-800 border-b pb-2">📞 联系方式</h3>
          <p className="text-xs text-gray-400 -mt-2">联系方式将加密存储，买家需解锁后方可查看</p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">联系人 *</label>
              <input name="contact_name" value={formData.contact_name} onChange={handleChange} required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green"
                placeholder="姓名" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">联系电话 *</label>
              <input type="tel" name="contact_phone" value={formData.contact_phone} onChange={handleChange} required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green"
                placeholder="手机号" />
            </div>
          </div>
        </div>

        {/* 提交 */}
        <button type="submit" disabled={loading || uploading}
          className="w-full bg-brand-green text-white py-3.5 rounded-xl font-medium hover:bg-brand-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base">
          {loading ? '提交中...' : uploading ? '上传中...' : '✅ 确认发布'}
        </button>
      </form>
    </div>
  );
}

// ═══ 地址二级联动（省份+城市，与搜索页 FilterPanel 同款）═══
function AddressSelects({
  province, city,
  onProvinceChange, onCityChange,
}: {
  province: string; city: string;
  onProvinceChange: (v: string) => void;
  onCityChange: (v: string) => void;
}) {
  const [provinces, setProvinces] = useState<{ name: string; emoji: string | null }[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [lp, setLp] = useState(true);
  const [lc, setLc] = useState(false);

  useEffect(() => {
    fetch('/api/regions?level=province')
      .then(r => r.json())
      .then((d: any) => setProvinces(d.data || []))
      .catch(() => {})
      .finally(() => setLp(false));
  }, []);

  useEffect(() => {
    if (!province) { setCities([]); return; }
    setLc(true);
    fetch(`/api/regions?level=city&province=${encodeURIComponent(province)}`)
      .then(r => r.json())
      .then((d: any) => setCities(d.data?.map((c: any) => c.name) || []))
      .catch(() => {})
      .finally(() => setLc(false));
  }, [province]);

  const selCls = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 outline-none focus:border-brand-green';

  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">省份 *</label>
        <select value={province} onChange={e => { onProvinceChange(e.target.value); onCityChange(''); }} disabled={lp} className={selCls}>
          <option value="">{lp ? '加载中...' : '请选择省份'}</option>
          {provinces.map(p => <option key={p.name} value={p.name}>{p.emoji ? `${p.emoji} ` : ''}{p.name}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">城市 *</label>
        <select value={city} onChange={e => onCityChange(e.target.value)} disabled={!province || lc} className={`${selCls} disabled:opacity-50`}>
          <option value="">{!province ? '请先选择省份' : lc ? '加载中...' : '请选择城市'}</option>
          {cities.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
    </div>
  );
}


