'use client';

import { useState, useEffect } from 'react';

interface Region {
  code: string;
  name: string;
  level: string;
  province?: string;
  city?: string;
  emoji?: string;
}

interface RegionSelectorProps {
  province: string;
  city: string;
  district: string;
  onProvinceChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onDistrictChange: (value: string) => void;
  showDistrict?: boolean;
  compact?: boolean;
}

export default function RegionSelector({
  province, city, district,
  onProvinceChange, onCityChange, onDistrictChange,
  showDistrict = true, compact = false,
}: RegionSelectorProps) {
  const [provinces, setProvinces] = useState<Region[]>([]);
  const [cities, setCities] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<Region[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(true);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);

  // 加载省份
  useEffect(() => {
    setLoadingProvinces(true);
    fetch('/api/regions?level=province')
      .then((r) => r.json())
      .then((d: any) => setProvinces(d.data || []))
      .catch((err) => { console.error('加载省份失败:', err); setProvinces([]); })
      .finally(() => setLoadingProvinces(false));
  }, []);

  // 省份变化 → 加载城市
  useEffect(() => {
    if (!province) { setCities([]); return; }
    setLoadingCities(true);
    fetch(`/api/regions?level=city&province=${encodeURIComponent(province)}`)
      .then((r) => r.json())
      .then((d: any) => setCities(d.data || []))
      .catch((err) => { console.error('加载城市失败:', err); setCities([]); })
      .finally(() => setLoadingCities(false));
  }, [province]);

  // 城市变化 → 加载区县
  useEffect(() => {
    if (!showDistrict || !city || !province) { setDistricts([]); return; }
    setLoadingDistricts(true);
    fetch(`/api/regions?level=district&province=${encodeURIComponent(province)}&city=${encodeURIComponent(city)}`)
      .then((r) => r.json())
      .then((d: any) => setDistricts(d.data || []))
      .catch((err) => { console.error('加载区县失败:', err); setDistricts([]); })
      .finally(() => setLoadingDistricts(false));
  }, [city, province, showDistrict]);

  const selectClass = compact
    ? 'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green cursor-pointer'
    : 'w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg bg-white outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green cursor-pointer';

  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: showDistrict ? '1fr 1fr 1fr' : '1fr 1fr' }}>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">省份</label>
        <select
          value={province}
          onChange={(e) => {
            onProvinceChange(e.target.value);
            onCityChange('');
            onDistrictChange('');
          }}
          disabled={loadingProvinces}
          className={`${selectClass} ${loadingProvinces ? 'opacity-60' : ''}`}
        >
          <option value="">{loadingProvinces ? '加载中...' : '请选择省份'}</option>
          {provinces.map((p) => (
            <option key={p.code} value={p.name}>
              {p.emoji ? `${p.emoji} ` : ''}{p.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">城市</label>
        <select
          value={city}
          onChange={(e) => {
            onCityChange(e.target.value);
            onDistrictChange('');
          }}
          disabled={!province || loadingCities}
          className={`${selectClass} ${(!province || loadingCities) ? 'opacity-60' : ''}`}
        >
          <option value="">
            {!province ? '请先选择省份' : loadingCities ? '加载中...' : '请选择城市'}
          </option>
          {cities.map((c) => (
            <option key={c.code} value={c.name}>{c.name}</option>
          ))}
        </select>
      </div>

      {showDistrict && (
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">区县</label>
          <select
            value={district}
            onChange={(e) => onDistrictChange(e.target.value)}
            disabled={!city || loadingDistricts}
            className={`${selectClass} ${(!city || loadingDistricts) ? 'opacity-60' : ''}`}
          >
            <option value="">
              {!city ? '请先选择城市' : loadingDistricts ? '加载中...' : districts.length === 0 ? '暂无数据' : '请选择区县'}
            </option>
            {districts.map((d) => (
              <option key={d.code} value={d.name}>{d.name}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
