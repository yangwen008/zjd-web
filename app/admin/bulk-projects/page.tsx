'use client';

import { useState, useEffect } from 'react';
import RichTextEditor from '@/components/shared/RichTextEditor';

interface BulkProject {
  id: number;
  title: string;
  code: string | null;
  province: string | null;
  city: string | null;
  area_mu: number | null;
  area_sqm: number | null;
  price_start: number | null;
  yield_rate: number | null;
  certification: string;
  planning_use: string | null;
  views: number;
  status: string;
  featured: number;
}

const STATUS_LABELS: Record<string, string> = {
  approved: '已上架',
  pending: '待审核',
  rejected: '已拒绝',
};

const STATUS_STYLES: Record<string, string> = {
  approved: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  rejected: 'bg-red-100 text-red-700',
};

const CERT_LABELS: Record<string, string> = {
  certified: '✅ 已确权',
  pending: '⏳ 待确权',
  uncertified: '❌ 未确权',
};

const PLANNING_USES = ['文旅', '康养', '农业', '商业', '工业', '其他'];

export default function AdminBulkProjectsPage() {
  const [projects, setProjects] = useState<BulkProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const emptyForm = {
    title: '', code: '', description: '', location: '',
    province: '', city: '', district: '',
    area_mu: '', area_sqm: '', price_total: '', price_start: '',
    yield_rate: '', lease_years: '', certification: 'uncertified',
    planning_use: '', images: '', video_url: '', commercial_plan: '',
    cert_doc_url: '', infra_details: '', transport_info: '', cert_info: '',
    gps_lat: '', gps_lng: '', contact_name: '', contact_phone: '', status: 'pending', featured: false,
  };
  const [form, setForm] = useState(emptyForm);

  const fetchProjects = async (status?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status && status !== 'all') params.set('status', status);
      params.set('limit', '50');
      const res = await fetch(`/api/admin/bulk-projects?${params.toString()}`);
      const data = await res.json() as any;
      setProjects(data.data || []);
    } catch { setProjects([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProjects(filter); }, [filter]);

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleEdit = (p: BulkProject) => {
    setEditId(p.id);
    setForm({
      title: p.title || '', code: p.code || '', description: '',
      location: '', province: p.province || '', city: p.city || '', district: '',
      area_mu: String(p.area_mu || ''), area_sqm: String(p.area_sqm || ''),
      price_total: '', price_start: String(p.price_start || ''),
      yield_rate: String(p.yield_rate || ''), lease_years: '',
      certification: p.certification || 'uncertified',
      planning_use: p.planning_use || '', images: '', video_url: '',
      commercial_plan: '', cert_doc_url: '',
      infra_details: (p as any).infra_details || '',
      transport_info: (p as any).transport_info || '', cert_info: (p as any).cert_info || '',
      gps_lat: '', gps_lng: '', contact_name: '', contact_phone: '',
      status: p.status, featured: p.featured === 1,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { showMessage('❌ 标题不能为空'); return; }
    setSaving(true);
    try {
      const payload: any = {
        action: editId ? 'update' : 'add',
        ...form,
        area_mu: form.area_mu ? parseFloat(form.area_mu) : null,
        area_sqm: form.area_sqm ? parseFloat(form.area_sqm) : null,
        price_total: form.price_total ? parseFloat(form.price_total) : null,
        price_start: form.price_start ? parseFloat(form.price_start) : null,
        yield_rate: form.yield_rate ? parseFloat(form.yield_rate) : null,
        lease_years: form.lease_years ? parseInt(form.lease_years) : null,
        gps_lat: form.gps_lat ? parseFloat(form.gps_lat) : null,
        gps_lng: form.gps_lng ? parseFloat(form.gps_lng) : null,
        infra_details: form.infra_details || null,
        transport_info: form.transport_info || null,
        cert_info: form.cert_info || null,
      };
      if (editId) payload.id = editId;

      const res = await fetch('/api/admin/bulk-projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json() as any;
      if (data.success) {
        showMessage(editId ? '✅ 已更新' : '✅ 已添加');
        setShowForm(false);
        setEditId(null);
        setForm(emptyForm);
        fetchProjects(filter);
      } else {
        showMessage(`❌ 失败: ${data.error}`);
      }
    } catch { showMessage('❌ 网络错误'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除此大宗项目？')) return;
    try {
      const res = await fetch('/api/admin/bulk-projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id }),
      });
      const data = await res.json() as any;
      if (data.success) { showMessage('✅ 已删除'); fetchProjects(filter); }
      else { showMessage(`❌ 删除失败: ${data.error}`); }
    } catch { showMessage('❌ 网络错误'); }
  };

  const handleToggleFeatured = async (id: number, featured: number) => {
    try {
      await fetch('/api/admin/bulk-projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle-featured', id, featured: featured ? 0 : 1 }),
      });
      fetchProjects(filter);
    } catch {}
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await fetch('/api/admin/bulk-projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update-status', id, status }),
      });
      fetchProjects(filter);
    } catch {}
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">🏢 大宗路演项目管理</h1>
        <button
          onClick={() => { setShowForm(!showForm); setEditId(null); setForm(emptyForm); }}
          className="bg-brand-green hover:bg-brand-light text-white px-4 py-2 rounded-lg text-sm"
        >
          {showForm ? '取消' : '+ 新增项目'}
        </button>
      </div>

      {message && (
              <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
                <div className={`${message.startsWith('✅') ? 'bg-green-600 text-white' : 'bg-red-600 text-white'} px-8 py-4 rounded-xl shadow-2xl text-sm font-medium`}>
                  {message}
                </div>
              </div>
            )}

      {/* 筛选 */}
      <div className="flex items-center space-x-2 mb-4">
        {['all', 'pending', 'approved', 'rejected'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs rounded-full transition-colors ${filter === f ? 'bg-brand-green text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {f === 'all' ? '全部' : STATUS_LABELS[f] || f}
          </button>
        ))}
      </div>

      {/* 新增/编辑表单 */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
          <h2 className="font-bold text-gray-900 mb-4">{editId ? '编辑项目' : '新增大宗路演项目'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">项目标题 *</label>
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">项目编号</label>
              <input type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="ZJD-001" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">规划用途</label>
              <select value={form.planning_use} onChange={(e) => setForm({ ...form, planning_use: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green">
                <option value="">选择用途</option>
                {PLANNING_USES.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">省份</label>
              <input type="text" value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">城市</label>
              <input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">详细地址</label>
              <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">占地面积（亩）</label>
              <input type="number" value={form.area_mu} onChange={(e) => setForm({ ...form, area_mu: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">建筑面积（㎡）</label>
              <input type="number" value={form.area_sqm} onChange={(e) => setForm({ ...form, area_sqm: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">起始价（万/年）</label>
              <input type="number" step="0.1" value={form.price_start} onChange={(e) => setForm({ ...form, price_start: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">年收益率（%）</label>
              <input type="number" step="0.01" value={form.yield_rate} onChange={(e) => setForm({ ...form, yield_rate: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">流转年限</label>
              <input type="number" value={form.lease_years} onChange={(e) => setForm({ ...form, lease_years: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">确权状态</label>
              <select value={form.certification} onChange={(e) => setForm({ ...form, certification: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green">
                <option value="certified">已确权</option>
                <option value="pending">待确权</option>
                <option value="uncertified">未确权</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">联系人</label>
              <input type="text" value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">联系电话</label>
              <input type="text" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">图片URL（JSON数组）</label>
              <input type="text" value={form.images} onChange={(e) => setForm({ ...form, images: e.target.value })} placeholder='["https://..."]' className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green" />
            </div>
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} className="rounded" />
                <span className="text-sm text-gray-700">首页推荐</span>
              </label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green">
                <option value="pending">待审核</option>
                <option value="approved">已上架</option>
                <option value="rejected">已拒绝</option>
              </select>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-500 mb-1">项目描述</label>
            <RichTextEditor value={form.description} onChange={(val) => setForm({ ...form, description: val })} placeholder="详细描述项目亮点、权属情况、周边配套等..." />
          </div>
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-500 mb-1">确权证书URL</label>
            <input type="text" value={form.cert_doc_url} onChange={(e) => setForm({ ...form, cert_doc_url: e.target.value })} placeholder="https://..." className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">交通信息 (JSON)</label>
              <textarea value={form.transport_info} onChange={(e) => setForm({ ...form, transport_info: e.target.value })} rows={3} placeholder='{"highway":"30分钟内","rail":"60分钟内","airport":"90分钟内","bus":"有直达","metro":"无地铁"}' className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green font-mono" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">权证信息 (JSON)</label>
              <textarea value={form.cert_info} onChange={(e) => setForm({ ...form, cert_info: e.target.value })} rows={3} placeholder='{"ownership_type":"集体","cert_type":"不动产权证书"}' className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-green font-mono" />
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button onClick={handleSave} disabled={saving} className="bg-brand-green hover:bg-brand-light text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50">
              {saving ? '保存中...' : (editId ? '更新' : '添加')}
            </button>
            <button onClick={() => { setShowForm(false); setEditId(null); }} className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm">取消</button>
          </div>
        </div>
      )}

      {/* 列表 */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-4 py-3 font-medium text-gray-500">ID</th>
              <th className="px-4 py-3 font-medium text-gray-500">编号</th>
              <th className="px-4 py-3 font-medium text-gray-500">标题</th>
              <th className="px-4 py-3 font-medium text-gray-500">省份</th>
              <th className="px-4 py-3 font-medium text-gray-500">收益率</th>
              <th className="px-4 py-3 font-medium text-gray-500">确权</th>
              <th className="px-4 py-3 font-medium text-gray-500">浏览</th>
              <th className="px-4 py-3 font-medium text-gray-500">状态</th>
              <th className="px-4 py-3 font-medium text-gray-500">推荐</th>
              <th className="px-4 py-3 font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={10} className="px-4 py-8 text-center text-gray-400">加载中...</td></tr>
            ) : projects.length > 0 ? projects.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50/50">
                <td className="px-4 py-3 text-gray-400">#{p.id}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.code || '-'}</td>
                <td className="px-4 py-3 font-medium text-gray-900 max-w-[200px] truncate">{p.title}</td>
                <td className="px-4 py-3 text-gray-500">{p.province || '-'}</td>
                <td className="px-4 py-3 text-green-600 font-medium">{p.yield_rate ? `${p.yield_rate}%` : '-'}</td>
                <td className="px-4 py-3 text-xs">{CERT_LABELS[p.certification] || p.certification}</td>
                <td className="px-4 py-3 text-gray-500">{p.views.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[p.status] || 'bg-gray-100 text-gray-600'}`}>
                    {STATUS_LABELS[p.status] || p.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => handleToggleFeatured(p.id, p.featured)} className="text-lg">
                    {p.featured ? '⭐' : '☆'}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center space-x-2">
                    <a href={`/bulk-projects/${p.id}`} target="_blank" className="text-xs text-brand-green hover:underline">查看</a>
                    <button onClick={() => handleEdit(p)} className="text-xs text-blue-600 hover:underline">编辑</button>
                    {p.status === 'pending' && (
                      <>
                        <button onClick={() => handleStatusChange(p.id, 'approved')} className="text-xs text-green-600 hover:underline">批准</button>
                        <button onClick={() => handleStatusChange(p.id, 'rejected')} className="text-xs text-red-500 hover:underline">拒绝</button>
                      </>
                    )}
                    <button onClick={() => handleDelete(p.id)} className="text-xs text-red-500 hover:underline">删除</button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={10} className="px-4 py-8 text-center text-gray-400">暂无大宗路演项目</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
