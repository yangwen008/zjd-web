'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PublishAssetPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [user, setUser] = useState<any>(null);
  // preview: 本地blob预览, server: 服务端返回的永久URL
  const [uploadedImages, setUploadedImages] = useState<{ preview: string; server: string }[]>([]);
  const [uploadedVideos, setUploadedVideos] = useState<{ preview: string; server: string }[]>([]);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    province: '',
    city: '',
    area_mu: '',
    price_year: '',
    price_total: '',
    lease_years: '',
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
        show(`✅ 定位成功`);
      },
      (error) => {
        show('❌ 获取位置失败');
      }
    );
  };

  // 处理图片上传
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newImages = [...uploadedImages];

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        show(`❌ ${file.name} 不是图片文件`);
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        show(`❌ ${file.name} 超过10MB限制`);
        continue;
      }

      const previewUrl = URL.createObjectURL(file);
      try {
        const res = await fetch('/api/upload/r2', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: file.name, contentType: file.type }),
        });

        const data: any = await res.json();
        if (!data.success) {
          URL.revokeObjectURL(previewUrl);
          show(`❌ ${file.name} 获取上传URL失败`);
          continue;
        }

        const formDataUpload = new FormData();
        formDataUpload.append('file', file);
        const uploadRes = await fetch(data.uploadUrl, { method: 'POST', body: formDataUpload });
        const uploadData: any = await uploadRes.json();

        if (!uploadData.success) {
          URL.revokeObjectURL(previewUrl);
          show(`❌ ${file.name} 上传失败`);
          continue;
        }

        // 保存 preview + server URL
        newImages.push({ preview: previewUrl, server: uploadData.url });
        setUploadedImages(newImages);
        show(`✅ ${file.name} 上传成功`);
      } catch (err) {
        URL.revokeObjectURL(previewUrl);
        show(`❌ ${file.name} 上传出错`);
      }
    }
    setUploading(false);
  };

  // 处理视频上传
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newVideos = [...uploadedVideos];

    for (const file of files) {
      if (!file.type.startsWith('video/')) {
        show(`❌ ${file.name} 不是视频文件`);
        continue;
      }
      if (file.size > 50 * 1024 * 1024) {
        show(`❌ ${file.name} 超过50MB限制`);
        continue;
      }

      const previewUrl = URL.createObjectURL(file);
      try {
        const res = await fetch('/api/upload/r2', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: file.name, contentType: file.type }),
        });

        const data: any = await res.json();
        if (!data.success) {
          URL.revokeObjectURL(previewUrl);
          show(`❌ ${file.name} 获取上传URL失败`);
          continue;
        }

        const formDataUpload = new FormData();
        formDataUpload.append('file', file);
        const uploadRes = await fetch(data.uploadUrl, { method: 'POST', body: formDataUpload });
        const uploadData: any = await uploadRes.json();

        if (!uploadData.success) {
          URL.revokeObjectURL(previewUrl);
          show(`❌ ${file.name} 上传失败`);
          continue;
        }

        newVideos.push({ preview: previewUrl, server: uploadData.url });
        setUploadedVideos(newVideos);
        show(`✅ ${file.name} 上传成功`);
      } catch (err) {
        URL.revokeObjectURL(previewUrl);
        show(`❌ ${file.name} 上传出错`);
      }
    }
    setUploading(false);
  };

  // 删除图片
  const removeImage = (index: number) => {
    const newImages = [...uploadedImages];
    URL.revokeObjectURL(newImages[index].preview);
    newImages.splice(index, 1);
    setUploadedImages(newImages);
  };

  // 删除视频
  const removeVideo = (index: number) => {
    const newVideos = [...uploadedVideos];
    URL.revokeObjectURL(newVideos[index].preview);
    newVideos.splice(index, 1);
    setUploadedVideos(newVideos);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      show('❌ 请先登录');
      return;
    }

    // 验证必填字段
    if (!formData.title.trim()) {
      show('❌ 请输入资产标题');
      return;
    }
    if (!formData.province.trim()) {
      show('❌ 请选择省份');
      return;
    }
    if (!formData.area_mu || parseFloat(formData.area_mu) <= 0) {
      show('❌ 请输入有效的面积');
      return;
    }

    setLoading(true);
    setMsg('');

    try {
      // 提取服务端返回的永久 URL
      const imageUrls = uploadedImages.map(item => item.server);
      const videoUrls = uploadedVideos.map(item => item.server);

      const res = await fetch('/api/dashboard/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: 'asset',
          ...formData,
          images: JSON.stringify(imageUrls),
          video_url: videoUrls[0] || '',
        }),
      });
      
      const d = await res.json() as any;
      if (d.success) {
        show('✅ 发布成功，等待管理员审核！');
        setTimeout(() => router.push('/dashboard/assets'), 1500);
      } else {
        show(`❌ ${d.error || '发布失败'}`);
      }
    } catch (err) {
      console.error('Publish error:', err);
      show('❌ 网络错误，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div className="text-center py-16 text-gray-400">加载中...</div>;

  return (
    <div className="max-w-3xl mx-auto pb-20">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">🏠 发布闲置资产</h1>
        <p className="text-sm text-gray-500 mt-1">个人/合伙人发布，将展示在"纯净一手官方原矿区"</p>
      </div>

      {msg && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm sticky top-20 z-50 ${
          msg.startsWith('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {msg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 p-6 space-y-6">
        {/* 基础信息 */}
        <div className="space-y-4">
          <h3 className="font-bold text-gray-800 border-b pb-2">📝 基础信息</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">资产标题 *</label>
            <input
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green"
              placeholder="如：安吉深山精装宅基地"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">详细描述 *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={4}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green"
              placeholder="请详细描述资产情况..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">省份 *</label>
              <input
                name="province"
                value={formData.province}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">城市 *</label>
              <input
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green"
              />
            </div>
          </div>
        </div>

        {/* 资产属性 */}
        <div className="space-y-4">
          <h3 className="font-bold text-gray-800 border-b pb-2">📐 资产属性</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">面积 (亩) *</label>
              <input
                type="number"
                step="0.01"
                name="area_mu"
                value={formData.area_mu}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">资产类型</label>
              <select
                name="asset_type"
                value={formData.asset_type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green"
              >
                <option>宅基地</option>
                <option>林地</option>
                <option>茶园</option>
                <option>果园</option>
                <option>厂房</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">年租金 (万)</label>
              <input
                type="number"
                step="0.1"
                name="price_year"
                value={formData.price_year}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">总价 (万)</label>
              <input
                type="number"
                step="0.1"
                name="price_total"
                value={formData.price_total}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">流转年限</label>
              <input
                type="number"
                name="lease_years"
                value={formData.lease_years}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">联系人 *</label>
              <input
                name="contact_name"
                value={formData.contact_name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">联系电话 *</label>
              <input
                type="tel"
                name="contact_phone"
                value={formData.contact_phone}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green"
                placeholder="请输入手机号"
              />
            </div>
          </div>

          {/* GPS 定位 */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
            <h4 className="text-sm font-bold text-blue-800 mb-2">📍 精确定位</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">纬度</label>
                <input
                  name="gps_lat"
                  value={formData.gps_lat}
                  onChange={handleChange}
                  placeholder="如: 30.5"
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">经度</label>
                <input
                  name="gps_lng"
                  value={formData.gps_lng}
                  onChange={handleChange}
                  placeholder="如: 119.5"
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleGetLocation}
              className="mt-2 flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              <span>➕</span>
              <span>获取当前位置</span>
            </button>
          </div>

          {/* 图片上传 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">📷 图片上传</label>
            <div className="space-y-2">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                disabled={uploading}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-brand-green file:text-white hover:file:bg-brand-light disabled:opacity-50"
              />
              <p className="text-xs text-gray-500">支持 JPG、PNG、GIF 格式，单张不超过 10MB</p>
              
              {uploadedImages.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-3">
                  {uploadedImages.map((item, i) => (
                    <div key={i} className="relative aspect-square">
                      <img src={item.preview} alt="" className="w-full h-full object-cover rounded border border-gray-200" />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600 shadow"
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
                onChange={handleVideoUpload}
                disabled={uploading}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-brand-green file:text-white hover:file:bg-brand-light disabled:opacity-50"
              />
              <p className="text-xs text-gray-500">支持 MP4、WebM 格式，单个不超过 50MB</p>
              
              {uploadedVideos.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mt-3">
                  {uploadedVideos.map((item, i) => (
                    <div key={i} className="relative">
                      <video src={item.preview} controls className="w-full h-32 object-cover rounded border border-gray-200" />
                      <button
                        type="button"
                        onClick={() => removeVideo(i)}
                        className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600 shadow"
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

        <button
          type="submit"
          disabled={loading || uploading}
          className="w-full bg-brand-green text-white py-3 rounded-xl font-medium hover:bg-brand-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '提交中...' : uploading ? '上传中...' : '✅ 确认发布'}
        </button>
      </form>
    </div>
  );
}
