'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import RichTextEditor from '@/components/shared/RichTextEditor';
import { compressImage, generateThumbnail, formatFileSize } from '@/lib/image-compress';

export default function BulkProjectPublishPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [user, setUser] = useState<any>(null);
  const [uploadedImages, setUploadedImages] = useState<{ preview: string; server: string; thumb?: string }[]>([]);
  const [uploadedVideo, setUploadedVideo] = useState<{ preview: string; server: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [commercialDoc, setCommercialDoc] = useState<{ name: string; url: string } | null>(null);
  const [certDoc, setCertDoc] = useState<{ name: string; url: string } | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    code: '',
    description: '',
    province: '',
    city: '',
    district: '',
    location: '',
    area_mu: '',
    area_sqm: '',
    price_start: '',
    price_total: '',
    yield_rate: '',
    lease_years: '30',
    certification: 'uncertified',
    planning_use: '',
    commercial_plan: '',
    contact_name: '',
    contact_phone: '',
    gps_lat: '',
    gps_lng: '',
    invest_enabled: false,
    invest_total_shares: '',
    invest_share_price: '',
    invest_min_shares: '1',
  });

  const [provinceList, setProvinceList] = useState<string[]>([]);
  const [cityList, setCityList] = useState<string[]>([]);

  // 基建配套 & 环境指标（默认全选）
  const [infraItems, setInfraItems] = useState([
    { key: 'electricity', icon: '⚡', label: '通电', enabled: true, status: '已通' },
    { key: 'water', icon: '💧', label: '自来水', enabled: true, status: '已通' },
    { key: 'network', icon: '📶', label: '网络', enabled: true, status: '5G覆盖' },
    { key: 'sewage', icon: '🚽', label: '污水化粪池', enabled: true, status: '已建' },
    { key: 'gas', icon: '🔥', label: '天燃气', enabled: true, status: '已通' },
    { key: 'road', icon: '🛣️', label: '自建路', enabled: true, status: '已硬化' },
    { key: 'far', icon: '🏗️', label: '容积率', enabled: true, status: '≤1.5' },
  ]);
  const [envItems, setEnvItems] = useState([
    { key: 'comfort', icon: '🌡️', label: '舒适度', enabled: true, value: '±1级' },
    { key: 'air', icon: '🌬️', label: '空气质量', enabled: true, value: '51-100(良)' },
    { key: 'water_quality', icon: '💧', label: '水质', enabled: true, value: 'II类' },
    { key: 'noise', icon: '🔇', label: '噪声指数', enabled: true, value: '20-40 dB' },
  ]);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d: any) => {
        if (d.success) setUser(d.user);
        else router.push('/login');
      });
  }, [router]);

  useEffect(() => {
    fetch('/api/regions?level=province')
      .then(r => r.json())
      .then((d: any) => setProvinceList((d.data || []).map((p: any) => p.name)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!formData.province) { setCityList([]); return; }
    fetch(`/api/regions?level=city&province=${encodeURIComponent(formData.province)}`)
      .then(r => r.json())
      .then((d: any) => setCityList((d.data || []).map((c: any) => c.name)))
      .catch(() => {});
  }, [formData.province]);

  const show = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 5000); };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    const newList = [...uploadedImages];
    for (const file of files) {
      if (!file.type.startsWith('image/') || file.size > 20 * 1024 * 1024) continue;
      try {
        const compressed = await compressImage(file, 1200, 0.8);
        const thumb = await generateThumbnail(file, 400);
        const url = await uploadFile(compressed.file);
        const thumbFile = new File([thumb.file], file.name.replace(/(\.[^.]+)$/, '_thumb$1'), { type: 'image/jpeg' });
        const thumbUrl = await uploadFile(thumbFile);
        if (url) { newList.push({ preview: URL.createObjectURL(compressed.file), server: url, thumb: thumbUrl || url }); setUploadedImages([...newList]); }
      } catch { /* skip */ }
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

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/') || file.size > 100 * 1024 * 1024) {
      show('❌ 视频文件不能超过100MB');
      return;
    }
    setUploading(true);
    const preview = URL.createObjectURL(file);
    const url = await uploadFile(file);
    if (url) {
      if (uploadedVideo) URL.revokeObjectURL(uploadedVideo.preview);
      setUploadedVideo({ preview, server: url });
    } else {
      URL.revokeObjectURL(preview);
      show('❌ 视频上传失败');
    }
    setUploading(false);
    e.target.value = '';
  };

  const removeVideo = () => {
    if (uploadedVideo) URL.revokeObjectURL(uploadedVideo.preview);
    setUploadedVideo(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { show('❌ 请先登录'); return; }
    if (!formData.title.trim()) { show('❌ 请输入项目标题'); return; }
    if (!formData.province) { show('❌ 请选择省份'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/dashboard/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: 'bulk_project',
          ...formData,
          images: JSON.stringify(uploadedImages.map((i) => ({ url: i.server, thumb: i.thumb || i.server }))),
          video_url: uploadedVideo?.server || '',
          commercial_plan_doc: commercialDoc?.url || '',
          cert_doc_url: certDoc?.url || '',
          infra_details: JSON.stringify({
            infra: infraItems.filter(i => i.enabled),
            env: envItems.filter(e => e.enabled),
          }),
        }),
      });
      const d = await res.json() as any;
      if (d.success) {
        show('✅ 发布成功，等待管理员审核！');
        setTimeout(() => router.push('/dashboard'), 1500);
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
        <h1 className="text-2xl font-bold text-gray-900">🏢 发布大宗路演项目</h1>
        <p className="text-sm text-gray-500 mt-1">填写项目信息后提交审核，通过后将在前台「大宗路演」板块展示</p>
      </div>

      {msg && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm sticky top-20 z-50 ${
          msg.startsWith('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>{msg}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 基础信息 */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <h3 className="font-bold text-gray-800 border-b pb-2">📝 项目基础信息</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">项目标题 *</label>
            <input name="title" value={formData.title} onChange={handleChange} required maxLength={100}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green"
              placeholder="如：莫干山辐射圈 · 闲置集体村办小学校舍整栋流转招商" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">项目编号</label>
              <input name="code" value={formData.code} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green"
                placeholder="如：ZJD-001（留空自动生成）" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">规划用途</label>
              <select name="planning_use" value={formData.planning_use} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green">
                <option value="">请选择</option>
                <option value="文旅">文旅</option>
                <option value="康养">康养</option>
                <option value="民宿">民宿</option>
                <option value="农业">农业</option>
                <option value="商业">商业</option>
                <option value="综合">综合</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">项目描述 *</label>
            <textarea name="description" value={formData.description} onChange={handleChange} required rows={4}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green"
              placeholder="详细描述项目亮点、权属情况、周边配套、投资回报预期等..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">商业计划（选填）</label>
            <RichTextEditor
              value={formData.commercial_plan}
              onChange={(val) => setFormData({ ...formData, commercial_plan: val })}
              placeholder="简述商业模式、预期收益、合作方式等..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">商业计划书附件（选填）</label>
            {commercialDoc ? (
              <div className="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <span className="text-green-600 text-sm">📄 {commercialDoc.name}</span>
                <button type="button" onClick={() => setCommercialDoc(null)} className="text-xs text-red-500 hover:underline">删除</button>
              </div>
            ) : (
              <label className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg border border-dashed border-gray-300 hover:border-brand-green cursor-pointer transition-colors text-sm ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                <span>📎</span>
                <span className="text-gray-600">上传商业计划书（PDF/DOC）</span>
                <input type="file" accept=".pdf,.doc,.docx" onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUploading(true);
                  const url = await uploadFile(file);
                  if (url) setCommercialDoc({ name: file.name, url });
                  setUploading(false);
                  e.target.value = '';
                }} className="hidden" />
              </label>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">确权证书附件（选填）</label>
            {certDoc ? (
              <div className="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <span className="text-green-600 text-sm">📋 {certDoc.name}</span>
                <button type="button" onClick={() => setCertDoc(null)} className="text-xs text-red-500 hover:underline">删除</button>
              </div>
            ) : (
              <label className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg border border-dashed border-gray-300 hover:border-brand-green cursor-pointer transition-colors text-sm ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                <span>📎</span>
                <span className="text-gray-600">上传确权证书（PDF/图片）</span>
                <input type="file" accept=".pdf,image/*" onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUploading(true);
                  const url = await uploadFile(file);
                  if (url) setCertDoc({ name: file.name, url });
                  setUploading(false);
                  e.target.value = '';
                }} className="hidden" />
              </label>
            )}
          </div>
        </div>

        {/* 地址 */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <h3 className="font-bold text-gray-800 border-b pb-2">📍 项目地址</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">省份 *</label>
              <select value={formData.province} onChange={e => setFormData({ ...formData, province: e.target.value, city: '', district: '' })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg">
                <option value="">请选择省份</option>
                {provinceList.map(name => <option key={name} value={name}>{name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">城市</label>
              <select value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value, district: '' })}
                disabled={!formData.province} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg">
                <option value="">{formData.province ? '请选择城市' : '请先选择省份'}</option>
                {cityList.map(name => <option key={name} value={name}>{name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">详细地址</label>
            <input name="location" value={formData.location} onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green"
              placeholder="如：浙江省湖州市德清县莫干山镇" />
          </div>
        </div>

        {/* 价格与面积 */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <h3 className="font-bold text-gray-800 border-b pb-2">💰 价格与面积</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">面积（亩）</label>
              <input type="number" step="0.1" name="area_mu" value={formData.area_mu} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">面积（㎡）</label>
              <input type="number" step="1" name="area_sqm" value={formData.area_sqm} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">起拍价（万/年）</label>
              <input type="number" step="0.1" name="price_start" value={formData.price_start} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">总价（万）</label>
              <input type="number" step="0.1" name="price_total" value={formData.price_total} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">预期年收益率（%）</label>
              <input type="number" step="0.1" name="yield_rate" value={formData.yield_rate} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">流转年限</label>
              <select name="lease_years" value={formData.lease_years} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg">
                <option value="20">20年</option>
                <option value="30">30年</option>
                <option value="50">50年</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">权证状态</label>
              <select name="certification" value={formData.certification} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg">
                <option value="uncertified">未确权</option>
                <option value="certified">已确权</option>
              </select>
            </div>
          </div>
        </div>

        {/* ═══ 基建配套 ═══ */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <h3 className="font-bold text-gray-800 border-b pb-2">⚡ 基础设施配套</h3>
          <p className="text-xs text-gray-400 -mt-2">默认全选，取消勾选表示该项不适用</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {infraItems.map((item, i) => (
              <label key={item.key} className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${item.enabled ? 'border-brand-green/30 bg-brand-green/5' : 'border-gray-200 bg-gray-50 opacity-60'}`}>
                <input type="checkbox" checked={item.enabled}
                  onChange={() => { const arr = [...infraItems]; arr[i] = { ...arr[i], enabled: !arr[i].enabled }; setInfraItems(arr); }}
                  className="w-4 h-4 rounded border-gray-300 text-brand-green focus:ring-brand-green" />
                <span className="text-lg">{item.icon}</span>
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-700">{item.label}</span>
                  {item.enabled && (
                    <input type="text" value={item.status}
                      onChange={(e) => { const arr = [...infraItems]; arr[i] = { ...arr[i], status: e.target.value }; setInfraItems(arr); }}
                      className="block w-full text-xs text-gray-500 border-b border-dashed border-gray-300 bg-transparent outline-none mt-0.5" placeholder="状态" />
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* ═══ 环境指标 ═══ */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <h3 className="font-bold text-gray-800 border-b pb-2">🌡️ 环境指标</h3>
          <p className="text-xs text-gray-400 -mt-2">默认全选，取消勾选表示该项不适用</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {envItems.map((item, i) => (
              <label key={item.key} className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${item.enabled ? 'border-brand-green/30 bg-brand-green/5' : 'border-gray-200 bg-gray-50 opacity-60'}`}>
                <input type="checkbox" checked={item.enabled}
                  onChange={() => { const arr = [...envItems]; arr[i] = { ...arr[i], enabled: !arr[i].enabled }; setEnvItems(arr); }}
                  className="w-4 h-4 rounded border-gray-300 text-brand-green focus:ring-brand-green" />
                <div className="flex-1">
                  <div className="text-lg mb-0.5">{item.icon}</div>
                  <span className="text-xs text-gray-400">{item.label}</span>
                  {item.enabled && (
                    <input type="text" value={item.value}
                      onChange={(e) => { const arr = [...envItems]; arr[i] = { ...arr[i], value: e.target.value }; setEnvItems(arr); }}
                      className="block w-full text-sm font-bold text-gray-900 border-b border-dashed border-gray-300 bg-transparent outline-none mt-0.5" placeholder="数值" />
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* 图片 */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <h3 className="font-bold text-gray-800 border-b pb-2">📷 项目图片 & 视频</h3>
          <div className="flex items-center space-x-3">
            <label className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg border border-dashed border-gray-300 hover:border-brand-green cursor-pointer transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
              <span className="text-lg">📷</span>
              <span className="text-sm text-gray-600">选择图片</span>
              <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
            </label>
            <span className="text-xs text-gray-400">JPG/PNG/WebP，单张 ≤ 10MB</span>
          </div>
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

          {/* 视频 */}
          <div className="pt-4 border-t border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-2">📹 项目视频（选填）</label>
            {uploadedVideo ? (
              <div className="relative">
                <video src={uploadedVideo.preview} controls className="w-full max-h-64 rounded-lg border border-gray-200" />
                <button type="button" onClick={removeVideo}
                  className="absolute top-2 right-2 px-3 py-1 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600">删除视频</button>
              </div>
            ) : (
              <label className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg border border-dashed border-gray-300 hover:border-brand-green cursor-pointer transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                <span className="text-lg">📹</span>
                <span className="text-sm text-gray-600">选择视频</span>
                <input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
              </label>
            )}
            <span className="text-xs text-gray-400 ml-2">MP4/WebM，≤ 100MB</span>
          </div>
        </div>

        {/* ═══ 参投设置 ═══ */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <h3 className="font-bold text-gray-800 border-b pb-2">💰 参投设置（选填）</h3>
          <p className="text-xs text-gray-400 -mt-2">开启后用户可认购该项目的部分份额</p>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.invest_enabled}
              onChange={(e) => setFormData({ ...formData, invest_enabled: e.target.checked })}
              className="w-4 h-4 text-brand-green rounded focus:ring-brand-green"
            />
            <span className="text-sm font-medium text-gray-700">开放参投</span>
          </label>

          {formData.invest_enabled && (
            <div className="grid grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">总份数</label>
                <input
                  type="number"
                  value={formData.invest_total_shares}
                  onChange={(e) => setFormData({ ...formData, invest_total_shares: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green"
                  placeholder="如 10"
                  min="2"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">每份单价（万）</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.invest_share_price}
                  onChange={(e) => setFormData({ ...formData, invest_share_price: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green"
                  placeholder="如 3.3"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">最低起投</label>
                <input
                  type="number"
                  value={formData.invest_min_shares}
                  onChange={(e) => setFormData({ ...formData, invest_min_shares: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green"
                  placeholder="1"
                  min="1"
                />
              </div>
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

        <button type="submit" disabled={loading || uploading}
          className="w-full bg-brand-green text-white py-3.5 rounded-xl font-medium hover:bg-brand-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base">
          {loading ? '提交中...' : uploading ? '上传中...' : '✅ 确认发布'}
        </button>
      </form>
    </div>
  );
}
