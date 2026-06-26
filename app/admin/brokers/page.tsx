'use client';

import { useState, useEffect, useCallback } from 'react';

interface Broker {
  id: number;
  name: string;
  region: string;
  province: string | null;
  city: string | null;
  bio: string | null;
  specialties: string | null;
  rating: string;
  show_count: number;
  good_rate: number;
  phone_encrypted: string | null;
  avatar_url: string | null;
  status: string;
}

const RATING_OPTIONS = [
  { value: 'gold', label: '🥇 金牌', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'silver', label: '🥈 银牌', color: 'bg-gray-100 text-gray-600' },
  { value: 'bronze', label: '🥉 铜牌', color: 'bg-orange-50 text-orange-600' },
];

const EMPTY_ROW: Omit<Broker, 'id' | 'status'> = {
  name: '',
  region: '',
  province: '',
  city: '',
  bio: '',
  specialties: '',
  rating: 'bronze',
  show_count: 0,
  good_rate: 0,
  phone_encrypted: '',
  avatar_url: '',
};

function RatingBadge({ rating }: { rating: string }) {
  const opt = RATING_OPTIONS.find((r) => r.value === rating);
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${opt?.color || 'bg-gray-100 text-gray-600'}`}>
      {opt?.label || rating}
    </span>
  );
}

export default function AdminBrokersPage() {
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [loading, setLoading] = useState(true);
  const [editRow, setEditRow] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<Broker>>({});
  const [adding, setAdding] = useState(false);
  const [newRow, setNewRow] = useState(EMPTY_ROW);
  const [saving, setSaving] = useState<number | null>(null);
  const [message, setMessage] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/brokers');
      const json: any = await res.json();
      setBrokers(json.data || []);
    } catch {
      setBrokers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleEdit = (row: Broker) => {
    setEditRow(row.id);
    setEditData({ ...row });
  };

  const handleCancel = () => {
    setEditRow(null);
    setEditData({});
  };

  const handleSave = async (id: number) => {
    setSaving(id);
    try {
      const res = await fetch('/api/admin/brokers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          id,
          name: editData.name,
          region: editData.region,
          province: editData.province,
          city: editData.city,
          bio: editData.bio,
          specialties: editData.specialties,
          rating: editData.rating,
          show_count: editData.show_count,
          good_rate: editData.good_rate,
          phone: editData.phone_encrypted,
          avatar_url: editData.avatar_url,
        }),
      });
      const json: any = await res.json();
      if (json.success) {
        showMessage('✅ 已保存');
        setEditRow(null);
        fetchData();
      } else {
        showMessage(`❌ 保存失败: ${json.error}`);
      }
    } catch {
      showMessage('❌ 网络错误');
    } finally {
      setSaving(null);
    }
  };

  const handleAdd = async () => {
    if (!newRow.name.trim()) {
      showMessage('❌ 姓名不能为空');
      return;
    }
    setSaving(-1);
    try {
      const res = await fetch('/api/admin/brokers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          name: newRow.name,
          region: newRow.region,
          province: newRow.province,
          city: newRow.city,
          bio: newRow.bio,
          specialties: newRow.specialties,
          rating: newRow.rating,
          show_count: newRow.show_count,
          good_rate: newRow.good_rate,
          phone: newRow.phone_encrypted,
          avatar_url: newRow.avatar_url,
        }),
      });
      const json: any = await res.json();
      if (json.success) {
        showMessage('✅ 已添加');
        setAdding(false);
        setNewRow(EMPTY_ROW);
        fetchData();
      } else {
        showMessage(`❌ 添加失败: ${json.error}`);
      }
    } catch {
      showMessage('❌ 网络错误');
    } finally {
      setSaving(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除此合伙人？')) return;
    try {
      const res = await fetch('/api/admin/brokers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id }),
      });
      const json: any = await res.json();
      if (json.success) {
        showMessage('✅ 已删除');
        fetchData();
      } else {
        showMessage(`❌ 删除失败: ${json.error}`);
      }
    } catch {
      showMessage('❌ 网络错误');
    }
  };

  const renderInput = (field: string, value: any, onChange: (v: any) => void, isNew: boolean) => {
    if (field === 'rating') {
      return (
        <select
          value={value || 'bronze'}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-2 py-1 text-sm border border-brand-green rounded outline-none bg-white"
        >
          {RATING_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      );
    }
    if (field === 'bio') {
      return (
        <textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          rows={2}
          className="w-full px-2 py-1 text-sm border border-brand-green rounded outline-none resize-none"
        />
      );
    }
    return (
      <input
        type={field === 'show_count' || field === 'good_rate' ? 'number' : 'text'}
        step={field === 'good_rate' ? 'any' : undefined}
        value={value ?? ''}
        onChange={(e) => onChange(
          field === 'show_count' || field === 'good_rate'
            ? (parseFloat(e.target.value) || 0)
            : e.target.value
        )}
        className="w-full px-2 py-1 text-sm border border-brand-green rounded outline-none"
      />
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">🤝 合伙人管理</h1>
        <button
          onClick={() => { setAdding(!adding); setNewRow(EMPTY_ROW); }}
          className="bg-brand-green hover:bg-brand-light text-white px-4 py-2 rounded-lg text-sm"
        >
          {adding ? '取消' : '+ 新增合伙人'}
        </button>
      </div>

      {message && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${message.startsWith('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-4 py-3 font-medium text-gray-500 w-12">ID</th>
              <th className="px-4 py-3 font-medium text-gray-500 w-20">头像</th>
              <th className="px-4 py-3 font-medium text-gray-500 w-28">姓名</th>
              <th className="px-4 py-3 font-medium text-gray-500 w-28">区域</th>
              <th className="px-4 py-3 font-medium text-gray-500 w-20">省份</th>
              <th className="px-4 py-3 font-medium text-gray-500 w-20">城市</th>
              <th className="px-4 py-3 font-medium text-gray-500">简介</th>
              <th className="px-4 py-3 font-medium text-gray-500 w-32">擅长领域</th>
              <th className="px-4 py-3 font-medium text-gray-500 w-24">等级</th>
              <th className="px-4 py-3 font-medium text-gray-500 w-20">带看</th>
              <th className="px-4 py-3 font-medium text-gray-500 w-20">好评</th>
              <th className="px-4 py-3 font-medium text-gray-500 w-28">电话</th>
              <th className="px-4 py-3 font-medium text-gray-500 w-32">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {/* Add new row */}
            {adding && (
              <tr className="bg-green-50/30">
                <td className="px-4 py-3 text-gray-400">—</td>
                <td className="px-4 py-3">
                  <input
                    type="text"
                    placeholder="头像URL"
                    value={newRow.avatar_url || ''}
                    onChange={(e) => setNewRow({ ...newRow, avatar_url: e.target.value })}
                    className="w-full px-2 py-1 text-xs border border-brand-green rounded outline-none"
                  />
                </td>
                <td className="px-4 py-3">
                  {renderInput('name', newRow.name, (v) => setNewRow({ ...newRow, name: v }), true)}
                </td>
                <td className="px-4 py-3">
                  {renderInput('region', newRow.region, (v) => setNewRow({ ...newRow, region: v }), true)}
                </td>
                <td className="px-4 py-3">
                  <input type="text" placeholder="省份" value={newRow.province || ''} onChange={(e) => setNewRow({ ...newRow, province: e.target.value })} className="w-full px-2 py-1 text-sm border border-brand-green rounded outline-none" />
                </td>
                <td className="px-4 py-3">
                  <input type="text" placeholder="城市" value={newRow.city || ''} onChange={(e) => setNewRow({ ...newRow, city: e.target.value })} className="w-full px-2 py-1 text-sm border border-brand-green rounded outline-none" />
                </td>
                <td className="px-4 py-3">
                  {renderInput('bio', newRow.bio, (v) => setNewRow({ ...newRow, bio: v }), true)}
                </td>
                <td className="px-4 py-3">
                  <input type="text" placeholder='["宅基地","林地"]' value={newRow.specialties || ''} onChange={(e) => setNewRow({ ...newRow, specialties: e.target.value })} className="w-full px-2 py-1 text-xs border border-brand-green rounded outline-none" />
                </td>
                <td className="px-4 py-3">
                  {renderInput('rating', newRow.rating, (v) => setNewRow({ ...newRow, rating: v }), true)}
                </td>
                <td className="px-4 py-3">
                  {renderInput('show_count', newRow.show_count, (v) => setNewRow({ ...newRow, show_count: v }), true)}
                </td>
                <td className="px-4 py-3">
                  {renderInput('good_rate', newRow.good_rate, (v) => setNewRow({ ...newRow, good_rate: v }), true)}
                </td>
                <td className="px-4 py-3">
                  {renderInput('phone_encrypted', newRow.phone_encrypted, (v) => setNewRow({ ...newRow, phone_encrypted: v }), true)}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={handleAdd}
                    disabled={saving === -1}
                    className="text-xs text-white bg-brand-green hover:bg-brand-light px-3 py-1 rounded disabled:opacity-50"
                  >
                    {saving === -1 ? '...' : '添加'}
                  </button>
                </td>
              </tr>
            )}

            {loading ? (
              <tr><td colSpan={13} className="px-4 py-8 text-center text-gray-400">加载中...</td></tr>
            ) : brokers.length > 0 ? brokers.map((row) => {
              const isEditing = editRow === row.id;
              return (
                <tr key={row.id} className={`hover:bg-gray-50/50 ${isEditing ? 'bg-blue-50/20' : ''}`}>
                  <td className="px-4 py-3 text-gray-400">#{row.id}</td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      renderInput('avatar_url', editData.avatar_url, (v) => setEditData({ ...editData, avatar_url: v }), false)
                    ) : (
                      row.avatar_url ? (
                        <img src={row.avatar_url} alt={row.name} className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">
                          {row.name.charAt(0)}
                        </div>
                      )
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing
                      ? renderInput('name', editData.name, (v) => setEditData({ ...editData, name: v }), false)
                      : <span className="font-medium text-gray-900">{row.name}</span>}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing
                      ? renderInput('region', editData.region, (v) => setEditData({ ...editData, region: v }), false)
                      : <span className="text-gray-500">{row.region}</span>}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing
                      ? <input type="text" value={editData.province || ''} onChange={(e) => setEditData({ ...editData, province: e.target.value })} className="w-full px-2 py-1 text-sm border border-brand-green rounded outline-none" />
                      : <span className="text-gray-500">{row.province || '—'}</span>}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing
                      ? <input type="text" value={editData.city || ''} onChange={(e) => setEditData({ ...editData, city: e.target.value })} className="w-full px-2 py-1 text-sm border border-brand-green rounded outline-none" />
                      : <span className="text-gray-500">{row.city || '—'}</span>}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing
                      ? renderInput('bio', editData.bio, (v) => setEditData({ ...editData, bio: v }), false)
                      : <span className="text-gray-500 text-xs line-clamp-2">{row.bio || '—'}</span>}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing
                      ? <input type="text" value={editData.specialties || ''} onChange={(e) => setEditData({ ...editData, specialties: e.target.value })} className="w-full px-2 py-1 text-xs border border-brand-green rounded outline-none" />
                      : <span className="text-gray-500 text-xs">{row.specialties || '—'}</span>}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing
                      ? renderInput('rating', editData.rating, (v) => setEditData({ ...editData, rating: v }), false)
                      : <RatingBadge rating={row.rating} />}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing
                      ? renderInput('show_count', editData.show_count, (v) => setEditData({ ...editData, show_count: v }), false)
                      : <span className="text-gray-700">{row.show_count}</span>}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing
                      ? renderInput('good_rate', editData.good_rate, (v) => setEditData({ ...editData, good_rate: v }), false)
                      : <span className="text-gray-700">{row.good_rate}%</span>}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing
                      ? renderInput('phone_encrypted', editData.phone_encrypted, (v) => setEditData({ ...editData, phone_encrypted: v }), false)
                      : <span className="text-gray-500 text-xs">{row.phone_encrypted || '—'}</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => handleSave(row.id)}
                            disabled={saving === row.id}
                            className="text-xs text-white bg-brand-green hover:bg-brand-light px-3 py-1 rounded disabled:opacity-50"
                          >
                            {saving === row.id ? '...' : '保存'}
                          </button>
                          <button onClick={handleCancel} className="text-xs text-gray-500 hover:text-gray-700">取消</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => handleEdit(row)} className="text-xs text-brand-green hover:underline">编辑</button>
                          <button onClick={() => handleDelete(row.id)} className="text-xs text-red-500 hover:underline">删除</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            }) : (
              <tr><td colSpan={13} className="px-4 py-8 text-center text-gray-400">暂无合伙人数据，点击上方按钮添加</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
