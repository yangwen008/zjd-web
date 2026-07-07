'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BulkProjectEditForm from '@/components/shared/BulkProjectEditForm';

export default function PublishBulkProjectPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then((d: any) => {
        if (d.success) setUser(d.user);
        else router.push('/login');
      });
  }, [router]);

  const show = (m: string, persist?: boolean) => {
    setMsg(m);
    if (!persist) setTimeout(() => setMsg(''), 5000);
  };

  const handleSubmit = async (data: Record<string, any>) => {
    const res = await fetch('/api/dashboard/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target: 'bulk_project', ...data }),
    });
    const d = await res.json() as any;
    if (d.success) {
      show('✅ 大宗项目发布成功，等待管理员审核！');
      setTimeout(() => router.push('/dashboard/bulk-projects'), 1500);
    } else {
      show(`❌ ${d.error || '发布失败'}`);
    }
  };

  if (!user) return <div className="text-center py-16 text-gray-400">加载中...</div>;

  return (
    <div className="max-w-3xl mx-auto pb-20">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">🏢 发布大宗路演项目</h1>
        <p className="text-sm text-gray-500 mt-1">大宗项目需管理员审核通过后展示</p>
      </div>
      {msg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className={`${msg.startsWith('✅') ? 'bg-green-600' : 'bg-red-600'} text-white px-8 py-4 rounded-xl shadow-2xl text-sm font-medium`}>{msg}</div>
        </div>
      )}
      <BulkProjectEditForm mode="create" onSubmit={handleSubmit} showMsg={show} />
    </div>
  );
}
