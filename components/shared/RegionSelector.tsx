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

  // 加载省份
  useEffect(() => {
    fetch('/api/regions?level=province')
      .then((r) => r.json())
      .then((d) => setProvinces(d.data || []))
      .catch(() => {});
  }, []);

  // 省份变化 → 加载城市
  useEffect(() => {
    if (!province) { setCities([]); return; }
    fetch(`/api/regions?level=city&province=${encodeURIComponent(province)}`)
      .then((r) => r.json())
      .then((d) => setCities(d.data || []))
      .catch(() => {});
  }, [province]);

  // 城市变化 → 加载区县
  useEffect(() => {
    if (!showDistrict || !city || !province) { setDistricts([]); return; }
    fetch(`/api/regions?level=district&province=${encodeURIComponent(province)}&city=${encodeURIComponent(city)}`)
      .then((r) => r.json())
      .then((d) => setDistricts(d.data || []))
      .catch(() => {});
  }, [city, province, showDistrict]);

  const selectClass = compact
    ? 'w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg bg-gray-50 outline-none focus:border-brand-green'
    : 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 outline-none focus:border-brand-green';

  return (
    <div className="grid grid-cols-1 gap-3" style={{ gridTemplateColumns: showDistrict ? '1fr 1fr 1fr' : '1fr 1fr' }}>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">省份</label>
        <select
          value={province}
          onChange={(e) => {
            onProvinceChange(e.target.value);
            onCityChange('');
            onDistrictChange('');
          }}
          className={selectClass}
        >
          <option value="">全部省份</option>
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
          disabled={!province}
          className={`${selectClass} disabled:opacity-50`}
        >
          <option value="">{province ? '全部城市' : '请先选择省份'}</option>
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
            disabled={!city}
            className={`${selectClass} disabled:opacity-50`}
          >
            <option value="">{city ? '全部区县' : '请先选择城市'}</option>
            {districts.map((d) => (
              <option key={d.code} value={d.name}>{d.name}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
