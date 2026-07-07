'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import BulkProjectEditForm from '@/components/shared/BulkProjectEditForm';

export default function EditBulkProjectPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetch(`/api/dashboard/bulk-projects`)
      .then(r => r.json())
      .then((d: any) => {
        if (d.success && d.data) {
          const p = d.data.find((x: any) => x.id === parseInt(projectId));
          if (p) setProject(p);
        }
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  const show = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 5000); };

  const handleSubmit = async (data: Record<string, any>) => {
    const res = await fetch('/api/dashboard/bulk-projects', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: parseInt(projectId), ...data }),
    });
    const d = await res.json() as any;
    if (d.success) {
      show('✅ 保存成功');
      setTimeout(() => router.push('/dashboard/bulk-projects'), 1500);
    } else {
      show(`❌ ${d.error || '保存失败'}`);
    }
  };

  if (loading) return <div className="text-center py-16 text-gray-400">加载中...</div>;
  if (!project) return <div className="text-center py-16"><p className="text-lg text-gray-500">项目不存在</p></div>;

  return (
    <div className="max-w-3xl mx-auto pb-20">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">✏️ 修改大宗项目</h1>
        <p className="text-sm text-gray-500 mt-1">修改后需重新审核</p>
      </div>
      {msg && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm sticky top-20 z-50 ${
          msg.startsWith('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>{msg}</div>
      )}
      <BulkProjectEditForm mode="edit" projectId={parseInt(projectId)} initialData={project} onSubmit={handleSubmit} onCancel={() => router.push('/dashboard/bulk-projects')} showMsg={show} />
    </div>
  );
}
