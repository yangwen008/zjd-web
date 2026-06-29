'use client';
import { useState, useEffect, useRef } from 'react';
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
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 通用表单状态
  const [formData, setFormData] = useState<any>({
    title: '', description: '', province: '', city: '', 
    area_mu: '', price_year: '', price_total: '', lease_years: '',
    asset_type: '宅基地', contact_name: '', contact_phone: '',
    images: '', // URL逗号分隔
    videos: '', // URL逗号分隔
    gps_lat: '', gps_lng: '',
    // 村委专属
    org_name: '', org_license: '', 
    // 大宗专属
    yield_rate: '', commercial_plan: '',
  });

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.success) setUser(d.user);
      else router.push('/login');
    }).finally(() => setLoading(false));
  }, [router]);

  const show = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 5000); };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 获取地理位置
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      show('❌ 您的浏览器不支持地理位置');
      return;
    }

    show('📍 正在获取位置...');
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setFormData({
          ...formData,
          gps_lat: latitude.toFixed(6),
          gps_lng: longitude.toFixed(6)
        });
        show(`✅ 定位成功：${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      },
      (error) => {
        let errorMsg = '❌ 获取位置失败';
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = '❌ 用户拒绝了地理位置请求';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = '❌ 位置信息不可用';
            break;
          case error.TIMEOUT:
            errorMsg = '❌ 获取位置超时';
            break;
        }
        show(errorMsg);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // 处理文件上传
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const field = type === 'image' ? 'images' : 'videos';
    const currentUrls = formData[field] ? formData[field].split(',').filter(Boolean) : [];
    
    setUploadingFiles(prev => [...prev, ...Array.from(files).map(f => f.name)]);

    for (const file of files) {
      try {
        // 验证文件类型
        if (type === 'image') {
          if (!file.type.startsWith('image/')) {
            show(`❌ ${file.name} 不是图片文件`);
            continue;
          }
        } else {
          if (!file.type.startsWith('video/')) {
            show(`❌ ${file.name} 不是视频文件`);
            continue;
          }
        }

        // 验证文件大小 (图片最大 10MB, 视频最大 50MB)
        const maxSize = type === 'image' ? 10 * 1024 * 1024 : 50 * 1024 * 1024;
        if (file.size > maxSize) {
          show(`❌ ${file.name} 超过大小限制`);
          continue;
        }

        // 获取上传 URL
        const res = await fetch('/api/upload/r2', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: file.name,
            contentType: file.type
          }),
        });

        const data: any = await res.json();
        if (!data.success) {
          show(`❌ ${file.name} 上传失败: ${data.error}`);
          continue;
        }

        // 直接上传到 R2
        const formDataUpload = new FormData();
        formDataUpload.append('file', file);
        
        const uploadRes = await fetch(data.uploadUrl, {
          method: 'POST',
          body: formDataUpload,
        });

        const uploadData: any = await uploadRes.json();
        if (!uploadData.success) {
          show(`❌ ${file.name} 上传失败`);
          continue;
        }

        // 更新表单
        currentUrls.push(uploadData.url);
        setFormData({ ...formData, [field]: currentUrls.join(',') });
        show(`✅ ${file.name} 上传成功`);

      } catch (error) {
        show(`❌ ${file.name} 上传出错`);
      } finally {
        setUploadingFiles(prev => prev.filter(name => name !== file.name));
      }
    }

    // 清空 input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    setMsg('');

    // 决定提交目标
    let target = 'asset';
    if (user.role === 'project_publisher') target = 'bulk';

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

  const isVillage = user.role === 'village_org';
  const isProject = user.role === 'project_publisher';

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {isProject ? '🏢 发布大宗路演项目' : isVillage ? '🏛️ 发布村集体直发资产' : '🏠 发布闲置资产'}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {isProject ? '大型文旅/农业产业项目，将展示在"文旅大宗产业路演带"' : 
           isVillage ? '村委官方直发，需上传授权书，将展示在"村集体直发专区"' : 
           '个人/合伙人发布，将展示在"纯净一手官方原矿区"'}
        </p>
      </div>

      {msg && <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${msg.startsWith('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{msg}</div>}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 p-6 space-y-6">
        
        {/* 基础信息 */}
        <div className="space-y-4">
          <h3 className="font-bold text-gray-800 border-b pb-2">📝 基础信息</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{isProject ? '项目名称' : '资产标题'} *</label>
            <input name="title" value={formData.title} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green" />
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

        {/* 资产属性 */}
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
            
            {/* GPS 定位 */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
              <h4 className="text-sm font-bold text-blue-800 mb-2">📍 精确定位 (用于展示在地图上)</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">纬度</label>
                  <input name="gps_lat" value={formData.gps_lat} onChange={handleChange} placeholder="如: 30.5" className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">经度</label>
                  <input name="gps_lng" value={formData.gps_lng} onChange={handleChange} placeholder="如: 119.5" className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
              </div>
              <button 
                type="button" 
                onClick={handleGetLocation}
                className="mt-2 flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                <span className="text-lg">➕</span>
                <span>获取当前位置</span>
              </button>
            </div>

            {/* 村委专属 */}
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

            {/* 图片上传 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">📷 图片上传</label>
              <div className="space-y-2">
                <input 
                  type="file" 
                  ref={fileInputRef}
                  accept="image/*" 
                  multiple 
                  onChange={(e) => handleFileUpload(e, 'image')}
                  disabled={uploadingFiles.length > 0}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-brand-green file:text-white hover:file:bg-brand-light"
                />
                <p className="text-xs text-gray-500">支持 JPG、PNG、GIF 格式，单张不超过 10MB</p>
                {uploadingFiles.length > 0 && (
                  <div className="text-sm text-blue-600">
                    上传中: {uploadingFiles.join(', ')}
                  </div>
                )}
                {formData.images && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.images.split(',').map((url: string, i: number) => (
                      <div key={i} className="relative">
                        <img src={url} alt="" className="w-20 h-20 object-cover rounded border border-gray-200" />
                        <button
                          type="button"
                          onClick={() => {
                            const urls = formData.images.split(',').filter((_: string, idx: number) => idx !== i);
                            setFormData({ ...formData, images: urls.join(',') });
                          }}
                          className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 视频上传 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">🎥 视频上传 (可选)</label>
              <div className="space-y-2">
                <input 
                  type="file" 
                  accept="video/*" 
                  multiple 
                  onChange={(e) => handleFileUpload(e, 'video')}
                  disabled={uploadingFiles.length > 0}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-brand-green file:text-white hover:file:bg-brand-light"
                />
                <p className="text-xs text-gray-500">支持 MP4、WebM 格式，单个不超过 50MB</p>
                {formData.videos && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.videos.split(',').map((url: string, i: number) => (
                      <div key={i} className="relative">
                        <video src={url} className="w-32 h-20 object-cover rounded border border-gray-200" controls />
                        <button
                          type="button"
                          onClick={() => {
                            const urls = formData.videos.split(',').filter((_: string, idx: number) => idx !== i);
                            setFormData({ ...formData, videos: urls.join(',') });
                          }}
                          className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 大宗项目专属 */}
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
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">商业规划书/详情</label>
              <textarea name="commercial_plan" value={formData.commercial_plan} onChange={handleChange} rows={4} className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
            </div>
          </div>
        )}

        <button 
          type="submit" 
          disabled={submitting || uploadingFiles.length > 0} 
          className="w-full bg-brand-green text-white py-3 rounded-xl font-medium hover:bg-brand-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? '提交中...' : uploadingFiles.length > 0 ? '文件上传中...' : '✅ 确认发布'}
        </button>
      </form>
    </div>
  );
}
