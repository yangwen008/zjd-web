'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

interface Asset {
  id: number;
  title: string;
  description: string | null;
  province: string | null;
  city: string | null;
  district: string | null;
  area_mu: number | null;
  price_year: number | null;
  price_total: number | null;
  lease_years: number | null;
  asset_type: string | null;
  source_type: string;
  contact_phone: string | null;
  contact_name: string | null;
  status: string;
  views: number;
  images: string | null;
  video_url: string | null;
  certification: string;
  featured: number;
}

const STATUS_LABELS: Record<string, string> = { approved: '已上架', pending: '待审核', rejected: '已拒绝', banned: '已封禁' };
const STATUS_STYLES: Record<string, string> = { approved: 'bg-green-100 text-green-700', pending: 'bg-yellow-100 text-yellow-700', rejected: 'bg-red-100 text-red-700', banned: 'bg-red-100 text-red-700' };
const SOURCE_LABELS: Record<string, string> = { official: '官方', village: '村委', ugc: '个人' };
const CERT_LABELS: Record<string, { label: string; className: string }> = {
  certified: { label: '✅ 已确权', className: 'bg-green-100 text-green-700' },
  pending: { label: '⏳ 待确权', className: 'bg-yellow-100 text-yellow-700' },
  uncertified: { label: '未确权', className: 'bg-gray-100 text-gray-600' },
};

export default function AdminAssetsPage() {
  const searchParams = useSearchParams();
  // 【修复点 2】：将默认筛选状态从 'all' 改为 'pending'，让审核员一进来只看到待审核资产
  const [filter, setFilter] = useState(searchParams.get('status') || 'all');
  const [sourceFilter, setSourceFilter] = useState(searchParams.get('source') || '');
  const [search, setSearch] = useState('');

  // 监听 URL 参数变化（侧边栏跳转时同步）
  useEffect(() => {
    setFilter(searchParams.get('status') || 'all');
    setSourceFilter(searchParams.get('source') || '');
  }, [searchParams]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [formData, setFormData] = useState<Partial<Asset>>({});
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<{ preview: string; server: string }[]>([]);
  const [existingVideo, setExistingVideo] = useState<string | null>(null);
  const [newVideo, setNewVideo] = useState<{ preview: string; server: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [provinceList, setProvinceList] = useState<string[]>([]);
  const [cityList, setCityList] = useState<string[]>([]);
  const [msg, setMsg] = useState('');
  const [editInfra, setEditInfra] = useState<any[]>([]);
  const [editEnv, setEditEnv] = useState<any[]>([]);

  const fetchAssets = async (status?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status && status !== 'all') params.set('status', status);
      if (sourceFilter) params.set('source', sourceFilter);
      if (search.trim()) params.set('search', search.trim());
      params.set('limit', '50');
      const res = await fetch(`/api/admin/assets?${params.toString()}`);
      const data: any = await res.json();
      setAssets(data.data || []);
    } catch { setAssets([]); } finally { setLoading(false); }
  };

  useEffect(() => { fetchAssets(filter); }, [filter, sourceFilter]);

  const show = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const handleAction = async (id: number, action: 'approve' | 'reject') => {
    try {
      const res = await fetch(`/api/admin/assets/${id}/${action}`, { method: 'POST' });
      const data: any = await res.json();
      if (data.success) { show(`✅ 已${action === 'approve' ? '批准' : '拒绝'}`); fetchAssets(filter); }
      else { show(`❌ ${data.error}`); }
    } catch { show(' 操作失败'); }
  };

  const openEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setFormData(asset);
    try {
      const imgs = asset.images ? JSON.parse(asset.images as any) : [];
      setExistingImages(Array.isArray(imgs) ? imgs : []);
    } catch { setExistingImages([]); }
    setNewImages([]);
    setExistingVideo(asset.video_url || null);
    setNewVideo(null);
    // 解析基建信息
    try {
      const parsed = (asset as any).infra_details ? JSON.parse((asset as any).infra_details) : null;
      setEditInfra(parsed?.infra || []);
      setEditEnv(parsed?.env || []);
    } catch { setEditInfra([]); setEditEnv([]); }
    // 加载地址数据
    fetch('/api/regions?level=province').then(r => r.json()).then((d: any) => setProvinceList((d.data || []).map((p: any) => p.name))).catch(() => {});
    if (asset.province) {
      fetch(`/api/regions?level=city&province=${encodeURIComponent(asset.province)}`).then(r => r.json()).then((d: any) => setCityList((d.data || []).map((c: any) => c.name))).catch(() => {});
    }
  };

  const handleSaveEdit = async () => {
    if (!editingAsset) return;
    const allImages = [...existingImages, ...newImages.map(i => i.server)];
    const videoUrl = newVideo ? newVideo.server : existingVideo || null;
    try {
      const res = await fetch(`/api/admin/assets`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, id: editingAsset.id, images: JSON.stringify(allImages), video_url: videoUrl, infra_details: JSON.stringify({ infra: editInfra, env: editEnv }) }),
      });
      const data: any = await res.json();
      if (data.success) { show('✅ 修改已保存'); setEditingAsset(null); fetchAssets(filter); }
      else { show(`❌ ${data.error}`); }
    } catch { show('❌ 保存失败'); }
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

  const handleAdminVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/') || file.size > 50 * 1024 * 1024) { show('❌ 视频格式或大小不符'); return; }
    setUploading(true);
    const preview = URL.createObjectURL(file);
    const url = await uploadFile(file);
    if (url) { setNewVideo({ preview, server: url }); }
    else { URL.revokeObjectURL(preview); show('❌ 视频上传失败'); }
    setUploading(false);
    e.target.value = '';
  };

  const handleAdminImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    const list = [...newImages];
    for (const file of files) {
      if (!file.type.startsWith('image/') || file.size > 10 * 1024 * 1024) continue;
      const preview = URL.createObjectURL(file);
      const url = await uploadFile(file);
      if (url) { list.push({ preview, server: url }); setNewImages([...list]); }
      else { URL.revokeObjectURL(preview); }
    }
    setUploading(false);
    e.target.value = '';
  };

  const toggleFeatured = async (id: number, featured: number) => {
    try {
      await fetch('/api/admin/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle-featured', id, featured: featured ? 0 : 1 }),
      });
      setAssets(assets.map(a => a.id === id ? { ...a, featured: featured ? 0 : 1 } : a));
    } catch { show('操作失败'); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">🏠 资产管理</h1>
        <div className="flex items-center space-x-2">
          {['all', 'pending', 'approved', 'rejected'].map((f) => (
            <button key={f} onClick={() => { setFilter(f); fetchAssets(f); }} className={`px-3 py-1.5 text-xs rounded-full transition-colors ${filter === f ? 'bg-brand-green text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {f === 'all' ? '全部' : STATUS_LABELS[f] || f}
            </button>
          ))}
        </div>
      </div>
      {/* 来源筛选 */}
      <div className="flex items-center space-x-2 mb-4">
        <span className="text-xs text-gray-400">来源：</span>
        {[{ key: '', label: '全部' }, { key: 'official', label: '⚖️ 官方' }, { key: 'village', label: '🏛️ 村委' }, { key: 'ugc', label: '👤 个人' }].map((s) => (
          <button key={s.key} onClick={() => { setSourceFilter(s.key); }} className={`px-3 py-1 text-xs rounded-full transition-colors ${sourceFilter === s.key ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {s.label}
          </button>
        ))}
      </div>
      
      {msg && <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${msg.startsWith('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{msg}</div>}

      {/* 搜索栏 */}
      <div className="mb-4 flex items-center space-x-3">
        <div className="flex-1 relative">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') fetchAssets(filter); }}
            placeholder="搜索资产标题、地点、类型..."
            className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white outline-none focus:border-brand-green"
          />
          <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <button onClick={() => fetchAssets(filter)} className="px-4 py-2.5 bg-brand-green text-white text-sm rounded-lg hover:bg-brand-light transition-colors">搜索</button>
        {search && <button onClick={() => { setSearch(''); fetchAssets(filter); }} className="px-3 py-2.5 text-sm text-gray-500 hover:text-gray-700">清除</button>}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead> <tr className="bg-gray-50 text-left">
            <th className="px-4 py-3 font-medium text-gray-500">ID</th>
            <th className="px-4 py-3 font-medium text-gray-500">标题</th>
            <th className="px-4 py-3 font-medium text-gray-500">区域</th>
            <th className="px-4 py-3 font-medium text-gray-500">来源</th>
            <th className="px-4 py-3 font-medium text-gray-500">确权</th>
            <th className="px-4 py-3 font-medium text-gray-500">推荐</th>
            <th className="px-4 py-3 font-medium text-gray-500">浏览量</th>
            <th className="px-4 py-3 font-medium text-gray-500">状态</th>
            <th className="px-4 py-3 font-medium text-gray-500">操作</th>
          </tr> </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">加载中...</td></tr>
            : assets.length > 0 ? assets.map((asset) => (
              <tr key={asset.id} className="hover:bg-gray-50/50">
                <td className="px-4 py-3 text-gray-400">#{asset.id}</td>
                <td className="px-4 py-3 font-medium text-gray-900 max-w-[200px] truncate">{asset.title}</td>
                <td className="px-4 py-3 text-gray-500">{asset.province || '-'}</td>
                <td className="px-4 py-3"><span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{SOURCE_LABELS[asset.source_type] || asset.source_type}</span></td>
                <td className="px-4 py-3">{(() => { const c = CERT_LABELS[(asset as any).certification || 'uncertified'] || CERT_LABELS.uncertified; return <span className={`text-xs px-2 py-0.5 rounded ${c.className}`}>{c.label}</span>; })()}</td>
                <td className="px-4 py-3 text-center">{asset.featured ? <span className="text-yellow-500">★</span> : <span className="text-gray-300">-</span>}</td>
                <td className="px-4 py-3 text-gray-500">{asset.views.toLocaleString()}</td>
                <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[asset.status] || 'bg-gray-100 text-gray-600'}`}>{STATUS_LABELS[asset.status] || asset.status}</span></td>
                <td className="px-4 py-3">
                  <div className="flex items-center space-x-2">
                    <button onClick={() => toggleFeatured(asset.id, asset.featured)} className={`text-xs hover:underline ${asset.featured ? 'text-yellow-500' : 'text-gray-400'}`}>{asset.featured ? '★ 推荐' : '☆ 推荐'}</button>
                    <a href={`/asset/${asset.id}`} target="_blank" className="text-xs text-brand-green hover:underline">查看</a>
                    <button onClick={() => openEdit(asset)} className="text-xs text-blue-600 hover:underline">编辑</button>
                    {asset.status === 'pending' && (
                      <>
                        <button onClick={() => handleAction(asset.id, 'approve')} className="text-xs text-green-600 hover:underline">批准</button>
                        <button onClick={() => handleAction(asset.id, 'reject')} className="text-xs text-red-500 hover:underline">拒绝</button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            )) : <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">暂无数据</td></tr>}
          </tbody>
        </table>
      </div>

      {/* 编辑 Modal */}
      {editingAsset && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">✏️ 编辑资产 #{editingAsset.id}</h2>
              <button onClick={() => setEditingAsset(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">标题</label><input type="text" value={formData.title || ''} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">省份</label>
                  <select value={formData.province || ''} onChange={e => { setFormData({...formData, province: e.target.value, city: '', district: ''}); fetch(`/api/regions?level=city&province=${encodeURIComponent(e.target.value)}`).then(r=>r.json()).then((d:any)=>setCityList((d.data||[]).map((c:any)=>c.name))).catch(()=>{}); }} className="w-full px-3 py-2 border border-gray-200 rounded-lg">
                    <option value="">请选择省份</option>
                    {provinceList.map(name => <option key={name} value={name}>{name}</option>)}
                  </select>
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">城市</label>
                  <select value={formData.city || ''} onChange={e => setFormData({...formData, city: e.target.value})} disabled={!formData.province} className="w-full px-3 py-2 border border-gray-200 rounded-lg">
                    <option value="">{formData.province ? '请选择城市' : '请先选择省份'}</option>
                    {cityList.map(name => <option key={name} value={name}>{name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">面积(亩)</label><input type="number" step="0.1" value={formData.area_mu || ''} onChange={(e) => setFormData({...formData, area_mu: parseFloat(e.target.value)})} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">年租金(万)</label><input type="number" step="0.1" value={formData.price_year || ''} onChange={(e) => setFormData({...formData, price_year: parseFloat(e.target.value)})} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">流转年限</label><input type="number" value={formData.lease_years || ''} onChange={(e) => setFormData({...formData, lease_years: parseInt(e.target.value)})} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green" /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">资产类型</label><input type="text" value={formData.asset_type || ''} onChange={(e) => setFormData({...formData, asset_type: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">描述</label><textarea value={formData.description || ''} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">确权状态</label>
                <select value={(formData as any).certification || 'uncertified'} onChange={(e) => setFormData({...formData, certification: e.target.value} as any)} className="w-full px-3 py-2 border border-gray-200 rounded-lg">
                  <option value="uncertified">❌ 未确权</option>
                  <option value="pending">⏳ 待确权</option>
                  <option value="certified">✅ 已确权</option>
                </select>
              </div>

              {/* 图片管理 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">图片</label>
                {(existingImages.length > 0 || newImages.length > 0) && (
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    {existingImages.map((url, i) => (
                      <div key={`ex-${i}`} className="relative aspect-square group">
                        <img src={url} alt="" className="w-full h-full object-cover rounded-lg border" />
                        <button type="button" onClick={() => setExistingImages(existingImages.filter((_,j)=>j!==i))} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100">×</button>
                      </div>
                    ))}
                    {newImages.map((item, i) => (
                      <div key={`new-${i}`} className="relative aspect-square group">
                        <img src={item.preview} alt="" className="w-full h-full object-cover rounded-lg border" />
                        <button type="button" onClick={() => { URL.revokeObjectURL(item.preview); setNewImages(newImages.filter((_,j)=>j!==i)); }} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100">×</button>
                      </div>
                    ))}
                  </div>
                )}
                <label className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 hover:border-brand-green cursor-pointer text-sm ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                  <span>📷 添加图片</span>
                  <input type="file" accept="image/*" multiple onChange={handleAdminImageUpload} className="hidden" />
                </label>
              </div>

              {/* 视频管理 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">视频</label>
                {(existingVideo || newVideo) ? (
                  <div className="relative w-64">
                    <video src={newVideo?.preview || existingVideo || ''} controls className="w-full h-36 object-cover rounded-lg border" />
                    <button type="button" onClick={() => { if (newVideo) URL.revokeObjectURL(newVideo.preview); setNewVideo(null); setExistingVideo(null); }}
                      className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600">×</button>
                  </div>
                ) : (
                  <label className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 hover:border-brand-green cursor-pointer text-sm ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                    <span>🎥 添加视频</span>
                    <input type="file" accept="video/*" onChange={handleAdminVideoUpload} className="hidden" />
                  </label>
                )}
              </div>

              {/* 基建配套编辑 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">基建配套 & 环境指标</label>
                <div className="grid grid-cols-3 gap-2">
                  {editInfra.map((item: any, i: number) => (
                    <label key={i} className="flex items-center space-x-2 p-2 rounded border border-gray-200 text-xs">
                      <input type="checkbox" checked={true} onChange={() => setEditInfra(editInfra.filter((_: any, j: number) => j !== i))} className="rounded" />
                      <span>{item.icon}</span>
                      <span>{item.label}: {item.status}</span>
                    </label>
                  ))}
                  {editEnv.map((item: any, i: number) => (
                    <label key={`env-${i}`} className="flex items-center space-x-2 p-2 rounded border border-gray-200 text-xs">
                      <input type="checkbox" checked={true} onChange={() => setEditEnv(editEnv.filter((_: any, j: number) => j !== i))} className="rounded" />
                      <span>{item.icon}</span>
                      <span>{item.label}: {item.value}</span>
                    </label>
                  ))}
                </div>
                {editInfra.length === 0 && editEnv.length === 0 && <p className="text-xs text-gray-400 mt-1">暂无基建/环境数据</p>}
              </div>

              <div><label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
                <select value={formData.status || 'pending'} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green">
                  <option value="pending">待审核</option> <option value="approved">已上架</option> <option value="rejected">已拒绝</option> <option value="banned">已封禁</option>
                </select>
              </div>
            </div>
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-100 px-6 py-4 flex justify-end space-x-3">
              <button onClick={() => setEditingAsset(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">取消</button>
              <button onClick={handleSaveEdit} className="px-4 py-2 text-sm bg-brand-green text-white rounded-lg hover:bg-brand-light font-medium">保存修改</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
