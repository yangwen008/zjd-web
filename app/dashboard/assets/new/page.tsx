'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface UserInfo {
  id: number;
  role: string;
  nickname: string;
  daily_quota: number;
}

export default function PublishAssetPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');
  
  // 通用表单状态
  const [formData, setFormData] = useState<any>({
    title: '', description: '', province: '', city: '', 
    area_mu: '', price_year: '', price_total: '', lease_years: '',
    asset_type: '宅基地', contact_name: '', contact_phone: '',
    images: '', // 暂用URL逗号分隔，后续可升级为R2直传
    gps_lat: '', gps_lng: '',
    // 村委专属
    org_name: '', org_license: '', 
    // 大宗专属
    yield_rate: '', commercial_plan: '',
    // 基建专属
    signal_5g_ms: '', hospital_min: '', overall_grade: 'B'
  });

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then((d: any)=> {
      if (d.success) setUser(d.user);
      else router.push('/login');
    }).finally(() => setLoading(false));
  }, [router]);

  const show = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    setMsg('');

    // 决定提交目标
    let target = 'asset';
    if (user.role === 'project_publisher') target = 'bulk';
    if (user.role === 'data_editor') target = 'infra';

    try {
      const res = await fetch('/api/dashboard/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target, ...formData }),
      });
      const d = await res.json() as any;
      if (d.success) {
        show('✅ 发布成功，等待管理员审核！');
        setTimeout(() => router.push('/dashboard/assets'), 1500);
      } else {
        show(`❌ ${d.error}`);
      }
    } catch {
      show('❌ 网络错误');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-16 text-gray-400">加载中...</div>;
  if (!user) return null;

  // 数据录入员直接引导去基建页面
  if (user.role === 'data_editor') {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-xl p-8 border border-gray-100 text-center">
        <div className="text-4xl mb-4">📡</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">数据录入员专区</h2>
        <p className="text-gray-500 mb-6">您的专属职责是维护各地区的“基建硬指标”数据，请前往基建数据管理页面进行录入。</p>
        <button onClick={() => router.push('/dashboard/infra')} className="bg-brand-green text-white px-6 py-2 rounded-lg hover:bg-brand-light">
          前往录入基建数据
        </button>
      </div>
    );
  }

  const isVillage = user.role === 'village_org';
  const isBroker = user.role === 'broker';
  const isProject = user.role === 'project_publisher';

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {isProject ? '🏢 发布大宗路演项目' : isVillage ? '🏛️ 发布村集体直发资产' : '🏠 发布闲置资产'}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {isProject ? '大型文旅/农业产业项目，将展示在“文旅大宗产业路演带”' : 
           isVillage ? '村委官方直发，需上传授权书，将展示在“村集体直发专区”' : 
           '个人/合伙人发布，将展示在“纯净一手官方原矿区”'}
        </p>
      </div>

      {msg && <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${msg.startsWith('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{msg}</div>}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 p-6 space-y-6">
        
        {/* 基础信息 (所有角色都有) */}
        <div className="space-y-4">
          <h3 className="font-bold text-gray-800 border-b pb-2">📝 基础信息</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{isProject ? '项目名称' : '资产标题'} *</label>
            <input name="title" value={formData.title} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green" placeholder={isProject ? '如：安吉余村万亩竹林康养项目' : '如：安吉深山精装宅基地'} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">详细描述 *</label>
            <textarea name="description" value={formData.description} onChange={handleChange} required rows={4} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">省份 *</label>
              <input name="province" value={formData.province} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">城市 *</label>
              <input name="city" value={formData.city} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green" />
            </div>
          </div>
        </div>

        {/* 资产属性 (普通用户/合伙人/村委) */}
        {!isProject && (
          <div className="space-y-4">
            <h3 className="font-bold text-gray-800 border-b pb-2">📐 资产属性</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">面积 (亩) *</label>
                <input type="number" step="0.01" name="area_mu" value={formData.area_mu} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">资产类型</label>
                <select name="asset_type" value={formData.asset_type} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green">
                  <option>宅基地</option><option>林地</option><option>茶园</option><option>果园</option><option>厂房</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">年租金 (万)</label>
                <input type="number" step="0.1" name="price_year" value={formData.price_year} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">总价 (万)</label>
                <input type="number" step="0.1" name="price_total" value={formData.price_total} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">流转年限</label>
                <input type="number" name="lease_years" value={formData.lease_years} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">联系人 *</label>
                <input name="contact_name" value={formData.contact_name} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">联系电话 *</label>
                <input name="contact_phone" value={formData.contact_phone} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green" />
              </div>
            </div>
            
            {/* 合伙人专属：GPS定位 */}
            {isBroker && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <h4 className="text-sm font-bold text-blue-800 mb-2">📍 合伙人专属：精准定位 (用于展示在合伙人主页附近)</h4>
                <div className="grid grid-cols-2 gap-4">
                  <input name="gps_lat" value={formData.gps_lat} onChange={handleChange} placeholder="纬度 (如: 30.5)" className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                  <input name="gps_lng" value={formData.gps_lng} onChange={handleChange} placeholder="经度 (如: 119.5)" className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
              </div>
            )}

            {/* 村委专属：授权书 */}
            {isVillage && (
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                <h4 className="text-sm font-bold text-purple-800 mb-2">🏛️ 村集体专属：资质证明 (必填)</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">发包方名称 (村委全称) *</label>
                    <input name="org_name" value={formData.org_name} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">村委授权书/确权证 URL *</label>
                    <input name="org_license" value={formData.org_license} onChange={handleChange} required placeholder="请先上传至R2或图床，填入URL" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                  </div>
                </div>
              </div>
            )}

            {/* 图片 (通用) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">图片URL (多个用逗号分隔)</label>
              <input name="images" value={formData.images} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green" placeholder="https://... , https://..." />
            </div>
          </div>
        )}

        {/* 大宗项目专属属性 */}
        {isProject && (
          <div className="space-y-4">
            <h3 className="font-bold text-gray-800 border-b pb-2">💰 商业与收益指标</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">总占地面积 (亩) *</label>
                <input type="number" step="0.1" name="area_mu" value={formData.area_mu} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">预期年收益率 (%) *</label>
                <input type="number" step="0.1" name="yield_rate" value={formData.yield_rate} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">总投资/总价 (万)</label>
                <input type="number" step="0.1" name="price_total" value={formData.price_total} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">合作年限</label>
                <input type="number" name="lease_years" value={formData.lease_years} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">商业规划书/详情</label>
              <textarea name="commercial_plan" value={formData.commercial_plan} onChange={handleChange} rows={4} className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
            </div>
          </div>
        )}

        <button type="submit" disabled={submitting} className="w-full bg-brand-green text-white py-3 rounded-xl font-medium hover:bg-brand-light transition-colors disabled:opacity-50">
          {submitting ? '提交中...' : '✅ 确认发布'}
        </button>
      </form>
    </div>
  );
}
