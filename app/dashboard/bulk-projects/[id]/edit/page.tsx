'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import RichTextEditor from '@/components/shared/RichTextEditor';

export default function EditBulkProjectPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [user, setUser] = useState<any>(null);
  const [uploadedImages, setUploadedImages] = useState<{ preview: string; server: string }[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [uploadedVideo, setUploadedVideo] = useState<{ preview: string; server: string } | null>(null);
  const [existingVideo, setExistingVideo] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [commercialDoc, setCommercialDoc] = useState<{ name: string; url: string } | null>(null);
  const [certDoc, setCertDoc] = useState<{ name: string; url: string } | null>(null);

  const [formData, setFormData] = useState({
    title: '', code: '', description: '', province: '', city: '', district: '', location: '',
    area_mu: '', area_sqm: '', price_start: '', price_total: '', yield_rate: '',
    lease_years: '30', certification: 'uncertified', planning_use: '', commercial_plan: '',
    contact_name: '', contact_phone: '', gps_lat: '', gps_lng: '',
  });

  const [provinceList, setProvinceList] = useState<string[]>([]);
  const [cityList, setCityList] = useState<string[]>([]);
  const [districtList, setDistrictList] = useState<string[]>([]);

  // 基建配套 & 环境指标
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
  const [transport, setTransport] = useState({ highway: '', rail: '', airport: '', bus: '', metro: '' });
  const [certInfo, setCertInfo] = useState({ ownership_type: '', cert_type: '' });

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d: any) => { if (d.success) setUser(d.user); else router.push('/login'); });
  }, [router]);

  // 加载项目数据
  useEffect(() => {
    Promise.all([
      fetch(`/api/dashboard/bulk-projects`).then(r => r.json()),
      fetch('/api/regions?level=province').then(r => r.json()).catch(() => ({ data: [] })),
    ]).then(([projData, provData]: any[]) => {
      const project = (projData.data || []).find((p: any) => p.id === parseInt(projectId));
      if (!project) { router.push('/dashboard/bulk-projects'); return; }

      setFormData({
        title: project.title || '', code: project.code || '', description: project.description || '',
        province: project.province || '', city: project.city || '', district: project.district || '',
        location: project.location || '',
        area_mu: String(project.area_mu || ''), area_sqm: String(project.area_sqm || ''),
        price_start: String(project.price_start || ''), price_total: String(project.price_total || ''),
        yield_rate: String(project.yield_rate || ''), lease_years: String(project.lease_years || '30'),
        certification: project.certification || 'uncertified', planning_use: project.planning_use || '',
        commercial_plan: project.commercial_plan || '',
        contact_name: project.contact_name || '', contact_phone: project.contact_phone || '',
        gps_lat: String(project.gps_lat || ''), gps_lng: String(project.gps_lng || ''),
      });

      try { setExistingImages(project.images ? JSON.parse(project.images) : []); } catch { setExistingImages([]); }
      if (project.video_url) setExistingVideo(project.video_url);

      // 加载附件
      if (project.commercial_plan_doc) setCommercialDoc({ name: '商业计划书', url: project.commercial_plan_doc });
      if (project.cert_doc_url) setCertDoc({ name: '确权证书', url: project.cert_doc_url });

      // 加载基建数据
      if (project.infra_details) {
        try {
          const parsed = JSON.parse(project.infra_details);
          if (parsed.infra) setInfraItems(prev => prev.map(item => {
            const found = parsed.infra.find((i: any) => i.key === item.key);
            return found ? { ...item, enabled: true, status: found.status } : { ...item, enabled: false };
          }));
          if (parsed.env) setEnvItems(prev => prev.map(item => {
            const found = parsed.env.find((e: any) => e.key === item.key);
            return found ? { ...item, enabled: true, value: found.value } : { ...item, enabled: false };
          }));
        } catch {}
      }
      // 加载交通信息和权证信息
      try { if (project.transport_info) setTransport(JSON.parse(project.transport_info)); } catch {}
      try { if (project.cert_info) setCertInfo(JSON.parse(project.cert_info)); } catch {}

      setProvinceList((provData.data || []).map((p: any) => p.name));
      if (project.province) {
        fetch(`/api/regions?level=city&province=${encodeURIComponent(project.province)}`)
          .then(r => r.json())
          .then((d: any) => setCityList((d.data || []).map((c: any) => c.name)))
          .catch(() => {});
      }
    }).finally(() => setLoading(false));
  }, [projectId, router]);

  const show = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 5000); };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      const res = await fetch('/api/upload/r2', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ filename: file.name, contentType: file.type }) });
      const data: any = await res.json();
      if (!data.success) return null;
      const fd = new FormData(); fd.append('file', file);
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
      if (!file.type.startsWith('image/') || file.size > 10 * 1024 * 1024) continue;
      const preview = URL.createObjectURL(file);
      const url = await uploadFile(file);
      if (url) { newList.push({ preview, server: url }); setUploadedImages([...newList]); }
      else { URL.revokeObjectURL(preview); }
    }
    setUploading(false);
    e.target.value = '';
  };

  const removeImage = (i: number) => { setExistingImages(existingImages.filter((_, j) => j !== i)); };
  const removeNewImage = (i: number) => {
    const newList = [...uploadedImages]; URL.revokeObjectURL(newList[i].preview); newList.splice(i, 1); setUploadedImages(newList);
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/') || file.size > 100 * 1024 * 1024) { show('❌ 视频文件不能超过100MB'); return; }
    setUploading(true);
    const preview = URL.createObjectURL(file);
    const url = await uploadFile(file);
    if (url) { if (uploadedVideo) URL.revokeObjectURL(uploadedVideo.preview); setUploadedVideo({ preview, server: url }); }
    else { URL.revokeObjectURL(preview); show('❌ 视频上传失败'); }
    setUploading(false);
    e.target.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) { show('❌ 请输入项目标题'); return; }
    if (!formData.province) { show('❌ 请选择省份'); return; }

    setLoading(true);
    try {
      const allImages = [...existingImages, ...uploadedImages.map(i => i.server)];
      const res = await fetch('/api/dashboard/bulk-projects', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: parseInt(projectId),
          ...formData,
          images: JSON.stringify(allImages),
          video_url: uploadedVideo?.server || existingVideo || '',
          commercial_plan_doc: commercialDoc?.url || '',
          cert_doc_url: certDoc?.url || '',
          infra_details: JSON.stringify({ infra: infraItems.filter(i => i.enabled), env: envItems.filter(e => e.enabled) }),
          transport_info: Object.values(transport).some(v => v) ? transport : undefined,
          cert_info: Object.values(certInfo).some(v => v) ? certInfo : undefined,
        }),
      });
      const d = await res.json() as any;
      if (d.success) { show('✅ 修改已保存'); setTimeout(() => router.push('/dashboard/bulk-projects'), 1500); }
      else show(`❌ ${d.error || '保存失败'}`);
    } catch { show('❌ 网络错误'); }
    finally { setLoading(false); }
  };

  if (!user) return <div className="text-center py-16 text-gray-400">加载中...</div>;

  return (
    <div className="max-w-3xl mx-auto pb-20">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">✏️ 编辑大宗项目</h1>
        <p className="text-sm text-gray-500 mt-1">修改项目信息后保存</p>
      </div>

      {msg && <div className={`mb-4 px-4 py-3 rounded-lg text-sm sticky top-20 z-50 ${msg.startsWith('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{msg}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 基础信息 */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <h3 className="font-bold text-gray-800 border-b pb-2">📝 项目基础信息</h3>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">项目标题 *</label><input name="title" value={formData.title} onChange={handleChange} required maxLength={100} className="w-full px-3 py-2 border border-gray-200 rounded-lg" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">项目编号</label><input name="code" value={formData.code} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">规划用途</label>
              <select name="planning_use" value={formData.planning_use} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg">
                <option value="">请选择</option><option value="文旅">文旅</option><option value="康养">康养</option><option value="民宿">民宿</option><option value="农业">农业</option><option value="商业">商业</option><option value="综合">综合</option>
              </select>
            </div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">项目描述 *</label><RichTextEditor value={formData.description} onChange={(val) => setFormData({ ...formData, description: val })} placeholder="详细描述项目亮点、权属情况、周边配套等..." /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">商业计划</label>
            <RichTextEditor value={formData.commercial_plan} onChange={(val) => setFormData({ ...formData, commercial_plan: val })} placeholder="简述商业模式、预期收益、合作方式等..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">商业计划书附件</label>
            {commercialDoc ? (
              <div className="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <span className="text-green-600 text-sm">📄 {commercialDoc.name}</span>
                <button type="button" onClick={() => setCommercialDoc(null)} className="text-xs text-red-500 hover:underline">删除</button>
              </div>
            ) : (
              <label className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg border border-dashed border-gray-300 hover:border-brand-green cursor-pointer text-sm ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                <span>📎</span><span className="text-gray-600">上传商业计划书（PDF/DOC）</span>
                <input type="file" accept=".pdf,.doc,.docx" onChange={async (e) => { const file = e.target.files?.[0]; if (!file) return; setUploading(true); const url = await uploadFile(file); if (url) setCommercialDoc({ name: file.name, url }); setUploading(false); e.target.value = ''; }} className="hidden" />
              </label>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">确权证书附件</label>
            {certDoc ? (
              <div className="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <span className="text-green-600 text-sm">📋 {certDoc.name}</span>
                <button type="button" onClick={() => setCertDoc(null)} className="text-xs text-red-500 hover:underline">删除</button>
              </div>
            ) : (
              <label className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg border border-dashed border-gray-300 hover:border-brand-green cursor-pointer text-sm ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                <span>📎</span><span className="text-gray-600">上传确权证书（PDF/图片）</span>
                <input type="file" accept=".pdf,image/*" onChange={async (e) => { const file = e.target.files?.[0]; if (!file) return; setUploading(true); const url = await uploadFile(file); if (url) setCertDoc({ name: file.name, url }); setUploading(false); e.target.value = ''; }} className="hidden" />
              </label>
            )}
          </div>
        </div>

        {/* 地址 */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <h3 className="font-bold text-gray-800 border-b pb-2">📍 项目地址</h3>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="block text-xs font-medium text-gray-500 mb-1">省份 *</label>
              <select value={formData.province} onChange={e => { setFormData({ ...formData, province: e.target.value, city: '', district: '' }); fetch(`/api/regions?level=city&province=${encodeURIComponent(e.target.value)}`).then(r => r.json()).then((d: any) => setCityList((d.data || []).map((c: any) => c.name))).catch(() => {}); }} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg">
                <option value="">请选择省份</option>{provinceList.map(name => <option key={name} value={name}>{name}</option>)}
              </select>
            </div>
            <div><label className="block text-xs font-medium text-gray-500 mb-1">城市</label>
              <select value={formData.city} onChange={e => { setFormData({ ...formData, city: e.target.value, district: '' }); fetch(`/api/regions?level=district&province=${encodeURIComponent(formData.province)}&city=${encodeURIComponent(e.target.value)}`).then(r => r.json()).then((d: any) => setDistrictList((d.data || []).map((c: any) => c.name))).catch(() => {}); }} disabled={!formData.province} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg">
                <option value="">{formData.province ? '请选择城市' : '请先选择省份'}</option>{cityList.map(name => <option key={name} value={name}>{name}</option>)}
              </select>
            </div>
            <div><label className="block text-xs font-medium text-gray-500 mb-1">区县</label>
              <select value={formData.district} onChange={e => setFormData({ ...formData, district: e.target.value })} disabled={!formData.city} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg">
                <option value="">{formData.city ? '请选择区县' : '请先选择城市'}</option>{districtList.map(name => <option key={name} value={name}>{name}</option>)}
              </select>
            </div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">详细地址</label><input name="location" value={formData.location} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg" /></div>
        </div>

        {/* 价格与面积 */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <h3 className="font-bold text-gray-800 border-b pb-2">💰 价格与面积</h3>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">面积（亩）</label><input type="number" step="0.1" name="area_mu" value={formData.area_mu} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">面积（㎡）</label><input type="number" step="1" name="area_sqm" value={formData.area_sqm} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg" /></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">起拍价（万/年）</label><input type="number" step="0.1" name="price_start" value={formData.price_start} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">总价（万）</label><input type="number" step="0.1" name="price_total" value={formData.price_total} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">预期年收益率（%）</label><input type="number" step="0.1" name="yield_rate" value={formData.yield_rate} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">流转年限</label>
              <select name="lease_years" value={formData.lease_years} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg">
                <option value="20">20年</option><option value="30">30年</option><option value="50">50年</option>
              </select>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">权证状态</label>
              <select name="certification" value={formData.certification} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg">
                <option value="uncertified">未确权</option><option value="certified">已确权</option>
              </select>
            </div>
          </div>
        </div>

        {/* 基建配套 */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <h3 className="font-bold text-gray-800 border-b pb-2">⚡ 基础设施配套</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {infraItems.map((item, i) => (
              <label key={item.key} className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${item.enabled ? 'border-brand-green/30 bg-brand-green/5' : 'border-gray-200 bg-gray-50 opacity-60'}`}>
                <input type="checkbox" checked={item.enabled} onChange={() => { const arr = [...infraItems]; arr[i] = { ...arr[i], enabled: !arr[i].enabled }; setInfraItems(arr); }} className="w-4 h-4 rounded" />
                <span className="text-lg">{item.icon}</span>
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-700">{item.label}</span>
                  {item.enabled && <input type="text" value={item.status} onChange={(e) => { const arr = [...infraItems]; arr[i] = { ...arr[i], status: e.target.value }; setInfraItems(arr); }} className="block w-full text-xs text-gray-500 border-b border-dashed border-gray-300 bg-transparent outline-none mt-0.5" />}
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* 环境指标 */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <h3 className="font-bold text-gray-800 border-b pb-2">🌡️ 环境指标</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {envItems.map((item, i) => (
              <label key={item.key} className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${item.enabled ? 'border-brand-green/30 bg-brand-green/5' : 'border-gray-200 bg-gray-50 opacity-60'}`}>
                <input type="checkbox" checked={item.enabled} onChange={() => { const arr = [...envItems]; arr[i] = { ...arr[i], enabled: !arr[i].enabled }; setEnvItems(arr); }} className="w-4 h-4 rounded" />
                <div className="flex-1">
                  <div className="text-lg mb-0.5">{item.icon}</div>
                  <span className="text-xs text-gray-400">{item.label}</span>
                  {item.enabled && <input type="text" value={item.value} onChange={(e) => { const arr = [...envItems]; arr[i] = { ...arr[i], value: e.target.value }; setEnvItems(arr); }} className="block w-full text-sm font-bold text-gray-900 border-b border-dashed border-gray-300 bg-transparent outline-none mt-0.5" />}
                </div>
              </label>
            ))}
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
                <select value={(transport as any)[item.key]} onChange={(e) => setTransport({ ...transport, [item.key]: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green">
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

        {/* 图片 */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <h3 className="font-bold text-gray-800 border-b pb-2">📷 项目图片</h3>
          {(existingImages.length > 0 || uploadedImages.length > 0) && (
            <div className="grid grid-cols-4 gap-3">
              {existingImages.map((url, i) => (
                <div key={`ex-${i}`} className="relative aspect-square group">
                  <img src={url} alt="" className="w-full h-full object-cover rounded-lg border" />
                  <button type="button" onClick={() => removeImage(i)} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100">×</button>
                </div>
              ))}
              {uploadedImages.map((item, i) => (
                <div key={`new-${i}`} className="relative aspect-square group">
                  <img src={item.preview} alt="" className="w-full h-full object-cover rounded-lg border" />
                  <button type="button" onClick={() => removeNewImage(i)} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100">×</button>
                </div>
              ))}
            </div>
          )}
          <label className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg border border-dashed border-gray-300 hover:border-brand-green cursor-pointer text-sm ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
            <span>📷</span><span className="text-gray-600">{uploading ? '上传中...' : '添加图片'}</span>
            <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
          </label>

          {/* 视频 */}
          <div className="pt-4 border-t border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-2">📹 项目视频</label>
            {uploadedVideo ? (
              <div className="relative">
                <video src={uploadedVideo.preview} controls className="w-full max-h-64 rounded-lg border border-gray-200" />
                <button type="button" onClick={() => { URL.revokeObjectURL(uploadedVideo.preview); setUploadedVideo(null); }} className="absolute top-2 right-2 px-3 py-1 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600">删除视频</button>
              </div>
            ) : existingVideo ? (
              <div className="relative">
                <video src={existingVideo} controls className="w-full max-h-64 rounded-lg border border-gray-200" />
                <button type="button" onClick={() => setExistingVideo(null)} className="absolute top-2 right-2 px-3 py-1 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600">删除视频</button>
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

        {/* 联系方式 */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <h3 className="font-bold text-gray-800 border-b pb-2">📞 联系方式</h3>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">联系人</label><input name="contact_name" value={formData.contact_name} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">联系电话</label><input type="tel" name="contact_phone" value={formData.contact_phone} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg" /></div>
          </div>
        </div>

        <button type="submit" disabled={loading || uploading} className="w-full bg-brand-green text-white py-3.5 rounded-xl font-medium hover:bg-brand-light transition-colors disabled:opacity-50">
          {loading ? '保存中...' : '✅ 保存修改'}
        </button>
      </form>
    </div>
  );
}
