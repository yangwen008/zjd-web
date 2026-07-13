'use client';

import { useState, useEffect } from 'react';
import { compressImage, generateThumbnail, formatFileSize } from '@/lib/image-compress';
import RichTextEditor from '@/components/shared/RichTextEditor';

/* ─── Types ─── */

export interface BulkProjectEditFormProps {
  mode: 'create' | 'edit';
  projectId?: number;
  initialData?: Record<string, any>;
  onSubmit: (data: Record<string, any>) => Promise<void>;
  onCancel?: () => void;
  showMsg: (msg: string, persist?: boolean) => void;
}

/* ─── Constants ─── */

const PLANNING_USES = [
  { value: '文旅', icon: '🎭' },
  { value: '康养', icon: '🏥' },
  { value: '民宿', icon: '🏡' },
  { value: '农业', icon: '🌾' },
  { value: '商业', icon: '🏪' },
  { value: '综合', icon: '🏢' },
];

const TRANSPORT_OPTIONS: Record<string, { icon: string; label: string; options: string[] }> = {
  highway: { icon: '🚗', label: '距高速出口', options: ['15分钟内', '30分钟内', '60分钟内', '60分钟以上'] },
  rail:    { icon: '🚄', label: '距高铁站',   options: ['15分钟内', '30分钟内', '60分钟内', '60分钟以上'] },
  airport: { icon: '✈️', label: '距机场',     options: ['30分钟内', '60分钟内', '90分钟内', '90分钟以上'] },
  bus:     { icon: '🚌', label: '公交',       options: ['有直达', '需转车', '无公交'] },
  metro:   { icon: '🚇', label: '地铁',       options: ['有站点', '规划中', '无地铁'] },
};

const CERTIFICATION_OPTIONS = [
  { key: 'uncertified', label: '❌ 未确权', desc: '暂无权属证明' },
  { key: 'pending',     label: '⏳ 待确权', desc: '权属确认中' },
  { key: 'certified',   label: '✅ 已确权', desc: '已完成权属登记' },
];

const OWNERSHIP_TYPES = ['集体', '国有', '个人'];
const CERT_TYPES = ['不动产权证书', '宅基地使用权证', '土地承包经营权证', '暂无'];

const DEFAULT_INFRA = [
  { key: 'electricity', icon: '⚡', label: '通电',       enabled: true, status: '已通' },
  { key: 'water',       icon: '💧', label: '自来水',     enabled: true, status: '已通' },
  { key: 'network',     icon: '📶', label: '网络',       enabled: true, status: '5G覆盖' },
  { key: 'sewage',      icon: '🚽', label: '污水化粪池', enabled: true, status: '已建' },
  { key: 'gas',         icon: '🔥', label: '天燃气',     enabled: true, status: '已通' },
  { key: 'road',        icon: '🛣️', label: '自建路',     enabled: true, status: '已硬化' },
  { key: 'far',         icon: '🏗️', label: '容积率',     enabled: true, status: '≤1.5' },
];

const DEFAULT_ENV = [
  { key: 'comfort',       icon: '🌡️', label: '舒适度',   enabled: true, value: '±1级' },
  { key: 'air',           icon: '🌬️', label: '空气质量', enabled: true, value: '51-100(良)' },
  { key: 'water_quality', icon: '💧', label: '水质',     enabled: true, value: 'II类' },
  { key: 'noise',         icon: '🔇', label: '噪声指数', enabled: true, value: '20-40 dB' },
];

/* ─── Component ─── */

export default function BulkProjectEditForm({
  mode,
  projectId,
  initialData,
  onSubmit,
  onCancel,
  showMsg,
}: BulkProjectEditFormProps) {
  const isEdit = mode === 'edit';

  /* ── Loading / uploading ── */
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  /* ── Form state ── */
  const [formData, setFormData] = useState({
    title: '',
    code: '',
    description: '',
    planning_use: '',
    commercial_plan: '',
    province: '',
    city: '',
    district: '',
    location: '',
    area_mu: '',
    area_sqm: '',
    price_total: '',
    price_start: '',
    yield_rate: '',
    lease_years: '30',
    certification: 'uncertified',
    contact_name: '',
    contact_phone: '',
    gps_lat: '',
    gps_lng: '',
    invest_enabled: false,
    invest_total_shares: '',
    invest_share_price: '',
    invest_min_shares: '1',
  });

  /* ── Sub-sections ── */
  const [transport, setTransport] = useState({
    highway: '', rail: '', airport: '', bus: '', metro: '',
  });

  const [certInfo, setCertInfo] = useState({
    ownership_type: '', cert_type: '',
  });

  const [infraItems, setInfraItems] = useState(() =>
    DEFAULT_INFRA.map((d) => ({ ...d }))
  );
  const [envItems, setEnvItems] = useState(() =>
    DEFAULT_ENV.map((d) => ({ ...d }))
  );

  /* ── Media state ── */
  // existing = already on server (edit mode); new = freshly uploaded
  const [existingImages, setExistingImages] = useState<{ url: string; thumb?: string }[]>([]);
  const [newImages, setNewImages] = useState<{ preview: string; server: string; thumb?: string }[]>([]);
  const [existingVideo, setExistingVideo] = useState<string | null>(null);
  const [newVideo, setNewVideo] = useState<{ preview: string; server: string } | null>(null);

  /* ── File attachments ── */
  const [commercialDoc, setCommercialDoc] = useState<{ name: string; url: string } | null>(null);
  const [certDoc, setCertDoc] = useState<{ name: string; url: string } | null>(null);

  /* ── Region data ── */
  const [provinceList, setProvinceList] = useState<string[]>([]);
  const [cityList, setCityList] = useState<string[]>([]);
  const [districtList, setDistrictList] = useState<string[]>([]);

  /* ════════════════════════════════════════════
     Data loading
     ════════════════════════════════════════════ */

  // Load provinces
  useEffect(() => {
    fetch('/api/regions?level=province')
      .then((r) => r.json())
      .then((d: any) => setProvinceList((d.data || []).map((p: any) => p.name)))
      .catch(() => {});
  }, []);

  // Load cities when province changes
  useEffect(() => {
    if (!formData.province) {
      setCityList([]);
      setDistrictList([]);
      return;
    }
    fetch(`/api/regions?level=city&province=${encodeURIComponent(formData.province)}`)
      .then((r) => r.json())
      .then((d: any) => setCityList((d.data || []).map((c: any) => c.name)))
      .catch(() => {});
  }, [formData.province]);

  // Load districts when city changes
  useEffect(() => {
    if (!formData.province || !formData.city) {
      setDistrictList([]);
      return;
    }
    fetch(`/api/regions?level=district&province=${encodeURIComponent(formData.province)}&city=${encodeURIComponent(formData.city)}`)
      .then((r) => r.json())
      .then((d: any) => setDistrictList((d.data || []).map((c: any) => c.name)))
      .catch(() => {});
  }, [formData.province, formData.city]);

  // Pre-fill form from initialData (edit mode)
  useEffect(() => {
    if (!initialData) return;

    setFormData({
      title: initialData.title || '',
      code: initialData.code || '',
      description: initialData.description || '',
      planning_use: initialData.planning_use || '',
      commercial_plan: initialData.commercial_plan || '',
      province: initialData.province || '',
      city: initialData.city || '',
      district: initialData.district || '',
      location: initialData.location || '',
      area_mu: initialData.area_mu?.toString() || '',
      area_sqm: initialData.area_sqm?.toString() || '',
      price_total: initialData.price_total?.toString() || '',
      price_start: initialData.price_start?.toString() || '',
      yield_rate: initialData.yield_rate?.toString() || '',
      lease_years: initialData.lease_years?.toString() || '30',
      certification: initialData.certification || 'uncertified',
      contact_name: initialData.contact_name || '',
      contact_phone: initialData.contact_phone || '',
      gps_lat: initialData.gps_lat?.toString() || '',
      gps_lng: initialData.gps_lng?.toString() || '',
      invest_enabled: !!initialData.invest_enabled,
      invest_total_shares: initialData.invest_total_shares?.toString() || '',
      invest_share_price: initialData.invest_share_price?.toString() || '',
      invest_min_shares: initialData.invest_min_shares?.toString() || '1',
    });

    // Transport & cert info
    try {
      if (initialData.transport_info) {
        setTransport(
          typeof initialData.transport_info === 'string'
            ? JSON.parse(initialData.transport_info)
            : initialData.transport_info
        );
      }
    } catch {}
    try {
      if (initialData.cert_info) {
        setCertInfo(
          typeof initialData.cert_info === 'string'
            ? JSON.parse(initialData.cert_info)
            : initialData.cert_info
        );
      }
    } catch {}

    // Infra details
    try {
      if (initialData.infra_details) {
        const parsed =
          typeof initialData.infra_details === 'string'
            ? JSON.parse(initialData.infra_details)
            : initialData.infra_details;
        if (parsed.infra && Array.isArray(parsed.infra)) {
          setInfraItems(
            DEFAULT_INFRA.map((d) => {
              const found = parsed.infra.find((x: any) => x.key === d.key);
              return found
                ? { ...d, enabled: true, status: found.status || d.status }
                : { ...d, enabled: false };
            })
          );
        }
        if (parsed.env && Array.isArray(parsed.env)) {
          setEnvItems(
            DEFAULT_ENV.map((d) => {
              const found = parsed.env.find((x: any) => x.key === d.key);
              return found
                ? { ...d, enabled: true, value: found.value || d.value }
                : { ...d, enabled: false };
            })
          );
        }
      }
    } catch {}

    // Images
    try {
      if (initialData.images) {
        const imgs =
          typeof initialData.images === 'string'
            ? JSON.parse(initialData.images)
            : initialData.images;
        if (Array.isArray(imgs)) {
          setExistingImages(
            imgs.map((item: any) =>
              typeof item === 'string'
                ? { url: item }
                : { url: item.url, thumb: item.thumb }
            )
          );
        }
      }
    } catch {
      setExistingImages([]);
    }

    // Video
    setExistingVideo(initialData.video_url || null);

    // File attachments
    if (initialData.commercial_plan_doc) {
      setCommercialDoc({ name: '商业计划书', url: initialData.commercial_plan_doc });
    }
    if (initialData.cert_doc_url) {
      setCertDoc({ name: '确权证书', url: initialData.cert_doc_url });
    }
  }, [initialData]);

  /* ════════════════════════════════════════════
     Helpers
     ════════════════════════════════════════════ */

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Haversine distance (km)
  const haversine = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  // GPS location
  const handleGetLocation = () => {
    if (!navigator.geolocation) { showMsg('❌ 您的浏览器不支持地理位置'); return; }
    showMsg('📍 正在获取位置...');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setFormData((prev) => ({ ...prev, gps_lat: lat.toFixed(6), gps_lng: lng.toFixed(6) }));

        try {
          const provRes = await fetch('/api/regions?level=province');
          const provData: any = await provRes.json();
          const provinces: { name: string; lat: number; lng: number }[] = provData.data || [];
          let nearestProv = provinces[0];
          let minDist = Infinity;
          for (const p of provinces) {
            if (p.lat && p.lng) {
              const d = haversine(lat, lng, p.lat, p.lng);
              if (d < minDist) { minDist = d; nearestProv = p; }
            }
          }

          const cityRes = await fetch(`/api/regions?level=city&province=${encodeURIComponent(nearestProv.name)}`);
          const cityData: any = await cityRes.json();
          const cities: { name: string; lat: number; lng: number }[] = cityData.data || [];
          let nearestCity = '';
          let minCityDist = Infinity;
          for (const c of cities) {
            if (c.lat && c.lng) {
              const d = haversine(lat, lng, c.lat, c.lng);
              if (d < minCityDist) { minCityDist = d; nearestCity = c.name; }
            }
          }

          setFormData((prev) => ({
            ...prev,
            gps_lat: lat.toFixed(6),
            gps_lng: lng.toFixed(6),
            province: nearestProv.name,
            city: nearestCity,
            district: '',
          }));

          setProvinceList(provinces.map((p) => p.name));
          if (nearestCity) setCityList(cities.map((c) => c.name));

          showMsg(`✅ 定位成功：${nearestProv.name} ${nearestCity}`);
        } catch {
          showMsg('✅ GPS已获取，省市匹配失败，请手动选择');
        }
      },
      () => showMsg('❌ 获取位置失败，请检查浏览器权限')
    );
  };

  /* ════════════════════════════════════════════
     File upload (R2)
     ════════════════════════════════════════════ */

  const uploadFile = async (file: File): Promise<string | null> => {
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
      const fd = new FormData();
      fd.append('file', file);
      const uploadRes = await fetch(data.uploadUrl, { method: 'POST', body: fd });
      const uploadData: any = await uploadRes.json();
      if (!uploadData.success) {
        console.error('Upload failed:', uploadData.error);
        return null;
      }
      return uploadData.url;
    } catch (err) {
      console.error('Upload exception:', err);
      return null;
    }
  };

  // Image upload with compression + thumbnail
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    const list = [...newImages];

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        showMsg(`❌ ${file.name} 不是图片`);
        continue;
      }
      if (file.size > 20 * 1024 * 1024) {
        showMsg(`❌ ${file.name} 超过20MB`);
        continue;
      }

      try {
        const compressed = await compressImage(file, 1200, 0.8);
        const thumb = await generateThumbnail(file, 400);

        const url = await uploadFile(compressed.file);
        const thumbFile = new File(
          [thumb.file],
          file.name.replace(/(\.[^.]+)$/, '_thumb$1'),
          { type: 'image/jpeg' }
        );
        const thumbUrl = await uploadFile(thumbFile);

        if (url) {
          list.push({
            preview: URL.createObjectURL(compressed.file),
            server: url,
            thumb: thumbUrl || url,
          });
          setNewImages([...list]);
          showMsg(`✅ ${file.name} 上传成功 (${formatFileSize(file.size)} → ${compressed.sizeKB}KB)`);
        } else {
          showMsg(`❌ ${file.name} 上传失败，请检查网络后重试`, true);
        }
      } catch {
        showMsg(`❌ ${file.name} 压缩失败`);
      }
    }
    setUploading(false);
    e.target.value = '';
  };

  // Video upload
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      showMsg(`❌ ${file.name} 不是视频`);
      e.target.value = '';
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      showMsg('❌ 视频文件不能超过100MB');
      e.target.value = '';
      return;
    }

    setUploading(true);
    const preview = URL.createObjectURL(file);
    const url = await uploadFile(file);
    if (url) {
      if (newVideo) URL.revokeObjectURL(newVideo.preview);
      setNewVideo({ preview, server: url });
      showMsg(`✅ ${file.name} 上传成功`);
    } else {
      URL.revokeObjectURL(preview);
      showMsg(`❌ ${file.name} 上传失败，请检查网络后重试`, true);
    }
    setUploading(false);
    e.target.value = '';
  };

  // Generic file upload (for documents)
  const handleDocUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (doc: { name: string; url: string } | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await uploadFile(file);
    if (url) {
      setter({ name: file.name, url });
      showMsg(`✅ ${file.name} 上传成功`);
    } else {
      showMsg(`❌ ${file.name} 上传失败`, true);
    }
    setUploading(false);
    e.target.value = '';
  };

  /* ── Image / video removal ── */

  const removeExistingImage = (i: number) => {
    setExistingImages((prev) => prev.filter((_, j) => j !== i));
  };

  const removeNewImage = (i: number) => {
    setNewImages((prev) => {
      const copy = [...prev];
      URL.revokeObjectURL(copy[i].preview);
      copy.splice(i, 1);
      return copy;
    });
  };

  const removeVideo = () => {
    if (newVideo) URL.revokeObjectURL(newVideo.preview);
    setNewVideo(null);
    setExistingVideo(null);
  };

  /* ════════════════════════════════════════════
     Submit
     ════════════════════════════════════════════ */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      showMsg('❌ 请输入项目标题');
      return;
    }
    if (!formData.province) {
      showMsg('❌ 请选择省份');
      return;
    }

    const allImages = [
      ...existingImages.map((img) => ({ url: img.url, thumb: img.thumb || img.url })),
      ...newImages.map((img) => ({ url: img.server, thumb: img.thumb || img.server })),
    ];

    const videoUrl = newVideo ? newVideo.server : existingVideo || '';

    setLoading(true);
    try {
      await onSubmit({
        ...formData,
        images: JSON.stringify(allImages),
        video_url: videoUrl,
        commercial_plan_doc: commercialDoc?.url || '',
        cert_doc_url: certDoc?.url || '',
        invest_enabled: formData.invest_enabled,
        invest_total_shares: formData.invest_total_shares || undefined,
        invest_share_price: formData.invest_share_price || undefined,
        invest_min_shares: formData.invest_min_shares || '1',
        infra_details: JSON.stringify({
          infra: infraItems.filter((i) => i.enabled),
          env: envItems.filter((e) => e.enabled),
        }),
        transport_info: Object.values(transport).some((v) => v) ? transport : undefined,
        cert_info: Object.values(certInfo).some((v) => v) ? certInfo : undefined,
        ...(isEdit && projectId ? { id: projectId } : {}),
      });
    } catch (err: any) {
      showMsg(`❌ ${err?.message || '提交失败'}`);
    } finally {
      setLoading(false);
    }
  };

  /* ── Derived ── */
  const allImageCount = existingImages.length + newImages.length;
  const hasVideo = !!existingVideo || !!newVideo;

  /* ════════════════════════════════════════════
     Render
     ════════════════════════════════════════════ */

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ═══════════════════════════════════════════
          1. 基础信息
         ═══════════════════════════════════════════ */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
        <h3 className="font-bold text-gray-800 border-b pb-2">📝 项目基础信息</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">项目标题 *</label>
          <input
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            maxLength={100}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green"
            placeholder="如：莫干山辐射圈 · 闲置集体村办小学校舍整栋流转招商"
          />
          <p className="text-xs text-gray-400 mt-1">{formData.title.length}/100</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">项目编号</label>
            <input
              name="code"
              value={formData.code}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green"
              placeholder="如：ZJD-001（留空自动生成）"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">规划用途</label>
            <select
              name="planning_use"
              value={formData.planning_use}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green"
            >
              <option value="">请选择</option>
              {PLANNING_USES.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.icon} {u.value}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">项目描述 *</label>
          <RichTextEditor
            value={formData.description}
            onChange={(val) => setFormData((prev) => ({ ...prev, description: val }))}
            placeholder="详细描述项目亮点、权属情况、周边配套、投资回报预期等..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">商业计划（选填）</label>
          <RichTextEditor
            value={formData.commercial_plan}
            onChange={(val) => setFormData((prev) => ({ ...prev, commercial_plan: val }))}
            placeholder="简述商业模式、预期收益、合作方式等..."
          />
        </div>

        {/* 商业计划书附件 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">商业计划书附件（选填）</label>
          {commercialDoc ? (
            <div className="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <span className="text-green-600 text-sm">📄 {commercialDoc.name}</span>
              <button
                type="button"
                onClick={() => setCommercialDoc(null)}
                className="text-xs text-red-500 hover:underline"
              >
                删除
              </button>
            </div>
          ) : (
            <label
              className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg border border-dashed border-gray-300 hover:border-brand-green cursor-pointer transition-colors text-sm ${
                uploading ? 'opacity-50 pointer-events-none' : ''
              }`}
            >
              <span>📎</span>
              <span className="text-gray-600">上传商业计划书（PDF/DOC）</span>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => handleDocUpload(e, setCommercialDoc)}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* 确权证书附件 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">确权证书附件（选填）</label>
          {certDoc ? (
            <div className="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <span className="text-green-600 text-sm">📋 {certDoc.name}</span>
              <button
                type="button"
                onClick={() => setCertDoc(null)}
                className="text-xs text-red-500 hover:underline"
              >
                删除
              </button>
            </div>
          ) : (
            <label
              className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg border border-dashed border-gray-300 hover:border-brand-green cursor-pointer transition-colors text-sm ${
                uploading ? 'opacity-50 pointer-events-none' : ''
              }`}
            >
              <span>📎</span>
              <span className="text-gray-600">上传确权证书（PDF/图片）</span>
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => handleDocUpload(e, setCertDoc)}
                className="hidden"
              />
            </label>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          2. 地址信息
         ═══════════════════════════════════════════ */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
        <h3 className="font-bold text-gray-800 border-b pb-2">📍 项目地址</h3>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">省份 *</label>
            <select
              value={formData.province}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  province: e.target.value,
                  city: '',
                  district: '',
                }))
              }
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
            >
              <option value="">请选择省份</option>
              {provinceList.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">城市</label>
            <select
              value={formData.city}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, city: e.target.value, district: '' }))
              }
              disabled={!formData.province}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
            >
              <option value="">{formData.province ? '请选择城市' : '请先选择省份'}</option>
              {cityList.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">区县</label>
            <select
              value={formData.district}
              onChange={(e) => setFormData((prev) => ({ ...prev, district: e.target.value }))}
              disabled={!formData.city}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
            >
              <option value="">{formData.city ? '请选择区县' : '请先选择城市'}</option>
              {districtList.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">详细地址</label>
          <input
            name="location"
            value={formData.location}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green"
            placeholder="如：浙江省湖州市德清县莫干山镇"
          />
        </div>

        {/* GPS */}
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-bold text-blue-800">🗺️ GPS 坐标</h4>
            <button
              type="button"
              onClick={handleGetLocation}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1"
            >
              <span>📍</span><span>获取当前位置</span>
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">纬度</label>
              <input
                name="gps_lat"
                value={formData.gps_lat}
                onChange={handleChange}
                placeholder="如: 30.630000"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">经度</label>
              <input
                name="gps_lng"
                value={formData.gps_lng}
                onChange={handleChange}
                placeholder="如: 119.680000"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">填写GPS坐标后，买家可在地图上精确查看地块位置</p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          3. 面积信息
         ═══════════════════════════════════════════ */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
        <h3 className="font-bold text-gray-800 border-b pb-2">📐 面积信息</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">面积（亩）</label>
            <input
              type="number"
              step="0.1"
              name="area_mu"
              value={formData.area_mu}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">面积（㎡）</label>
            <input
              type="number"
              step="1"
              name="area_sqm"
              value={formData.area_sqm}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green"
              placeholder="0"
            />
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          4. 价格信息
         ═══════════════════════════════════════════ */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
        <h3 className="font-bold text-gray-800 border-b pb-2">💰 价格信息</h3>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">总价（万）</label>
            <input
              type="number"
              step="0.1"
              name="price_total"
              value={formData.price_total}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green"
              placeholder="选填"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">起拍价（万/年）</label>
            <input
              type="number"
              step="0.1"
              name="price_start"
              value={formData.price_start}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green"
              placeholder="选填"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">预期年收益率（%）</label>
            <input
              type="number"
              step="0.1"
              name="yield_rate"
              value={formData.yield_rate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green"
              placeholder="选填"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">流转年限</label>
          <select
            name="lease_years"
            value={formData.lease_years}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green"
          >
            <option value="10">10年</option>
            <option value="15">15年</option>
            <option value="20">20年</option>
            <option value="30">30年</option>
            <option value="50">50年</option>
          </select>
        </div>
        <p className="text-xs text-gray-400">总价和起拍价至少填一项，留空则显示「价格面议」</p>
      </div>

      {/* ═══════════════════════════════════════════
          5. 参投设置
         ═══════════════════════════════════════════ */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
        <h3 className="font-bold text-gray-800 border-b pb-2">📊 参投设置</h3>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.invest_enabled}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, invest_enabled: e.target.checked }))
            }
            className="w-4 h-4 text-brand-green rounded focus:ring-brand-green"
          />
          <span className="text-sm font-medium text-gray-700">开放参投</span>
          <span className="text-xs text-gray-400">用户可认购部分份额</span>
        </label>

        {formData.invest_enabled && (
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">总份数</label>
              <input
                type="number"
                value={formData.invest_total_shares}
                onChange={(e) => {
                  const shares = e.target.value;
                  const ps = parseFloat(formData.price_start);
                  const s = parseInt(shares);
                  setFormData((prev) => ({
                    ...prev,
                    invest_total_shares: shares,
                    invest_share_price:
                      ps > 0 && s > 0 ? (ps / s).toFixed(2) : prev.invest_share_price,
                  }));
                }}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green"
                placeholder="如 10"
                min="2"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">每份单价（万）</label>
              <input
                type="number"
                step="0.01"
                value={formData.invest_share_price}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, invest_share_price: e.target.value }))
                }
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green"
                placeholder="自动计算"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">最低起投</label>
              <input
                type="number"
                value={formData.invest_min_shares}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, invest_min_shares: e.target.value }))
                }
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green"
                placeholder="1"
                min="1"
              />
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════
          6 & 7. 图片与视频上传
         ═══════════════════════════════════════════ */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
        <h3 className="font-bold text-gray-800 border-b pb-2">📷 项目图片 & 视频</h3>

        {/* ── Images ── */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            图片上传
            <span className="text-xs text-gray-400 ml-2">
              （最多10张，自动压缩至1200px + 400px缩略图）
            </span>
          </label>

          {/* Existing images (edit mode) */}
          {existingImages.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-2">已有图片（点击×移除）</p>
              <div className="grid grid-cols-4 gap-3">
                {existingImages.map((img, i) => (
                  <div key={`ex-${i}`} className="relative aspect-square group">
                    <img
                      src={img.thumb || img.url}
                      alt=""
                      className="w-full h-full object-cover rounded-lg border border-gray-200"
                    />
                    {i === 0 && newImages.length === 0 && (
                      <span className="absolute top-1 left-1 bg-brand-green text-white text-[10px] px-1.5 py-0.5 rounded">
                        封面
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeExistingImage(i)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600 shadow opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New images */}
          {newImages.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-2">新增图片</p>
              <div className="grid grid-cols-4 gap-3">
                {newImages.map((img, i) => (
                  <div key={`new-${i}`} className="relative aspect-square group">
                    <img
                      src={img.preview}
                      alt=""
                      className="w-full h-full object-cover rounded-lg border border-gray-200"
                    />
                    {i === 0 && existingImages.length === 0 && (
                      <span className="absolute top-1 left-1 bg-brand-green text-white text-[10px] px-1.5 py-0.5 rounded">
                        封面
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeNewImage(i)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600 shadow opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center space-x-3">
            <label
              className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg border border-dashed border-gray-300 hover:border-brand-green cursor-pointer transition-colors ${
                uploading ? 'opacity-50 pointer-events-none' : ''
              }`}
            >
              <span className="text-lg">📷</span>
              <span className="text-sm text-gray-600">
                {uploading ? '上传中...' : isEdit ? '添加图片' : '选择图片'}
              </span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
            <span className="text-xs text-gray-400">JPG/PNG/WebP，单张 ≤ 20MB</span>
          </div>
        </div>

        {/* ── Video ── */}
        <div className="border-t border-gray-100 pt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            📹 项目视频（选填，单个）
          </label>

          {hasVideo ? (
            <div className="relative w-64">
              <video
                src={newVideo?.preview || existingVideo || ''}
                controls
                className="w-full h-36 object-cover rounded-lg border border-gray-200"
              />
              <button
                type="button"
                onClick={removeVideo}
                className="absolute top-2 right-2 px-3 py-1 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600"
              >
                删除视频
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <label
                className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg border border-dashed border-gray-300 hover:border-brand-green cursor-pointer transition-colors ${
                  uploading ? 'opacity-50 pointer-events-none' : ''
                }`}
              >
                <span className="text-lg">📹</span>
                <span className="text-sm text-gray-600">选择视频</span>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  className="hidden"
                />
              </label>
              <span className="text-xs text-gray-400">MP4/WebM，≤ 100MB</span>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          8. 基建配套
         ═══════════════════════════════════════════ */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
        <h3 className="font-bold text-gray-800 border-b pb-2">⚡ 基础设施配套</h3>
        <p className="text-xs text-gray-400 -mt-2">默认全选，取消勾选表示该项不适用</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {infraItems.map((item, i) => (
            <label
              key={item.key}
              className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                item.enabled
                  ? 'border-brand-green/30 bg-brand-green/5'
                  : 'border-gray-200 bg-gray-50 opacity-60'
              }`}
            >
              <input
                type="checkbox"
                checked={item.enabled}
                onChange={() => {
                  setInfraItems((prev) => {
                    const arr = [...prev];
                    arr[i] = { ...arr[i], enabled: !arr[i].enabled };
                    return arr;
                  });
                }}
                className="w-4 h-4 rounded border-gray-300 text-brand-green focus:ring-brand-green"
              />
              <span className="text-lg">{item.icon}</span>
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-700">{item.label}</span>
                {item.enabled && (
                  <input
                    type="text"
                    value={item.status}
                    onChange={(e) => {
                      setInfraItems((prev) => {
                        const arr = [...prev];
                        arr[i] = { ...arr[i], status: e.target.value };
                        return arr;
                      });
                    }}
                    className="block w-full text-xs text-gray-500 border-b border-dashed border-gray-300 bg-transparent outline-none mt-0.5"
                    placeholder="状态"
                  />
                )}
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          9. 环境指标
         ═══════════════════════════════════════════ */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
        <h3 className="font-bold text-gray-800 border-b pb-2">🌡️ 环境指标</h3>
        <p className="text-xs text-gray-400 -mt-2">默认全选，取消勾选表示该项不适用</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {envItems.map((item, i) => (
            <label
              key={item.key}
              className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                item.enabled
                  ? 'border-brand-green/30 bg-brand-green/5'
                  : 'border-gray-200 bg-gray-50 opacity-60'
              }`}
            >
              <input
                type="checkbox"
                checked={item.enabled}
                onChange={() => {
                  setEnvItems((prev) => {
                    const arr = [...prev];
                    arr[i] = { ...arr[i], enabled: !arr[i].enabled };
                    return arr;
                  });
                }}
                className="w-4 h-4 rounded border-gray-300 text-brand-green focus:ring-brand-green"
              />
              <div className="flex-1">
                <div className="text-lg mb-0.5">{item.icon}</div>
                <span className="text-xs text-gray-400">{item.label}</span>
                {item.enabled && (
                  <input
                    type="text"
                    value={item.value}
                    onChange={(e) => {
                      setEnvItems((prev) => {
                        const arr = [...prev];
                        arr[i] = { ...arr[i], value: e.target.value };
                        return arr;
                      });
                    }}
                    className="block w-full text-sm font-bold text-gray-900 border-b border-dashed border-gray-300 bg-transparent outline-none mt-0.5"
                    placeholder="数值"
                  />
                )}
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          10. 交通信息
         ═══════════════════════════════════════════ */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
        <h3 className="font-bold text-gray-800 border-b pb-2">🚗 交通信息</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(TRANSPORT_OPTIONS).map(([key, cfg]) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {cfg.icon} {cfg.label}
              </label>
              <select
                value={(transport as any)[key]}
                onChange={(e) =>
                  setTransport((prev) => ({ ...prev, [key]: e.target.value }))
                }
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green"
              >
                <option value="">请选择</option>
                {cfg.options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          11. 权证信息
         ═══════════════════════════════════════════ */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
        <h3 className="font-bold text-gray-800 border-b pb-2">📋 权证信息</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">权属类型</label>
            <select
              value={certInfo.ownership_type}
              onChange={(e) =>
                setCertInfo((prev) => ({ ...prev, ownership_type: e.target.value }))
              }
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green"
            >
              <option value="">请选择</option>
              {OWNERSHIP_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">权证类型</label>
            <select
              value={certInfo.cert_type}
              onChange={(e) =>
                setCertInfo((prev) => ({ ...prev, cert_type: e.target.value }))
              }
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green"
            >
              <option value="">请选择</option>
              {CERT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          12. 确权状态（三选一卡片）
         ═══════════════════════════════════════════ */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
        <h3 className="font-bold text-gray-800 border-b pb-2">📋 确权状态</h3>
        <div className="grid grid-cols-3 gap-3">
          {CERTIFICATION_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() =>
                setFormData((prev) => ({ ...prev, certification: opt.key }))
              }
              className={`p-4 rounded-lg border-2 text-left transition-colors ${
                formData.certification === opt.key
                  ? 'border-brand-green bg-brand-green/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-sm font-medium">{opt.label}</div>
              <div className="text-xs text-gray-400 mt-1">{opt.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          13. 联系方式
         ═══════════════════════════════════════════ */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
        <h3 className="font-bold text-gray-800 border-b pb-2">📞 联系方式</h3>
        <p className="text-xs text-gray-400 -mt-2">联系方式将加密存储，买家需解锁后方可查看</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">联系人</label>
            <input
              name="contact_name"
              value={formData.contact_name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green"
              placeholder="姓名"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">联系电话</label>
            <input
              type="tel"
              name="contact_phone"
              value={formData.contact_phone}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green"
              placeholder="手机号"
            />
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          Actions
         ═══════════════════════════════════════════ */}
      <div className="flex space-x-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-medium transition-colors"
          >
            取消
          </button>
        )}
        <button
          type="submit"
          disabled={loading || uploading}
          className="flex-1 bg-brand-green text-white py-3.5 rounded-xl font-medium hover:bg-brand-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base"
        >
          {loading ? '提交中...' : uploading ? '上传中...' : isEdit ? '✅ 保存修改' : '✅ 确认发布'}
        </button>
      </div>
    </form>
  );
}
