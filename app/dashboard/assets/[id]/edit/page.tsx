'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AssetEditForm from '@/components/shared/AssetEditForm';

export default function EditAssetPage() {
  const router = useRouter();
  const params = useParams();
  const assetId = params.id as string;
  const [asset, setAsset] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetch(`/api/dashboard/assets?id=${assetId}`)
      .then(r => r.json())
      .then((d: any) => {
        if (d.success && d.data) {
          const a = Array.isArray(d.data) ? d.data.find((x: any) => x.id === parseInt(assetId)) : d.data;
          if (a) setAsset(a);
        }
      })
      .finally(() => setLoading(false));
  }, [assetId]);

  const show = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 5000); };

  const handleSubmit = async (data: Record<string, any>) => {
    const res = await fetch('/api/dashboard/assets', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: parseInt(assetId), ...data }),
    });
    const d = await res.json() as any;
    if (d.success) {
      show('✅ 保存成功');
      setTimeout(() => router.push('/dashboard/assets'), 1500);
    } else {
      show(`❌ ${d.error || '保存失败'}`);
    }
  };

  if (loading) return <div className="text-center py-16 text-gray-400">加载中...</div>;
  if (!asset) return <div className="text-center py-16"><p className="text-lg text-gray-500">资产不存在</p></div>;

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
      <AssetEditForm mode="edit" assetId={parseInt(assetId)} initialData={asset} onSubmit={handleSubmit} onCancel={() => router.push('/dashboard/assets')} showMsg={show} />
    </div>
  );
}
