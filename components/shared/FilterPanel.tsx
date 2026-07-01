'use client';

import { useState, useEffect } from 'react';

interface FilterOption {
  key: string;
  label: string;
}

interface FilterPanelProps {
  /** 省市级联选择器 */
  showRegion?: boolean;
  province?: string;
  city?: string;
  onProvinceChange?: (v: string) => void;
  onCityChange?: (v: string) => void;
  /** 关键词搜索 */
  showSearch?: boolean;
  searchValue?: string;
  onSearchChange?: (v: string) => void;
  searchPlaceholder?: string;
  /** 搜索按钮 */
  onSearch?: () => void;
  searchLabel?: string;
  searchLoading?: boolean;
  /** 排序 */
  showSort?: boolean;
  sortValue?: string;
  sortOptions?: FilterOption[];
  onSortChange?: (v: string) => void;
  /** 筛选按钮组 */
  filterGroups?: {
    label: string;
    options: FilterOption[];
    value: string;
    onChange: (v: string) => void;
  }[];
  /** 结果统计 */
  resultCount?: number;
  resultLabel?: string;
  /** 自定义 className */
  className?: string;
}

export default function FilterPanel({
  showRegion = false,
  province = '',
  city = '',
  onProvinceChange,
  onCityChange,
  showSearch = false,
  searchValue = '',
  onSearchChange,
  searchPlaceholder = '搜索...',
  showSort = false,
  sortValue = '',
  sortOptions = [],
  onSortChange,
  filterGroups = [],
  resultCount,
  resultLabel = '条结果',
  onSearch,
  searchLabel = '搜索',
  searchLoading = false,
  className = '',
}: FilterPanelProps) {
  const [provinceList, setProvinceList] = useState<{ name: string; emoji: string | null }[]>([]);
  const [cityList, setCityList] = useState<string[]>([]);
  const [searchInput, setSearchInput] = useState(searchValue);

  // 加载省份
  useEffect(() => {
    if (!showRegion) return;
    fetch('/api/regions?level=province')
      .then((r) => r.json())
      .then((d: any) => setProvinceList(d.data || []))
      .catch(() => {});
  }, [showRegion]);

  // 省份变化 → 加载城市
  useEffect(() => {
    if (!showRegion || !province) { setCityList([]); return; }
    fetch(`/api/regions?level=city&province=${encodeURIComponent(province)}`)
      .then((r) => r.json())
      .then((d: any) => setCityList(d.data?.map((c: any) => c.name) || []))
      .catch(() => {});
  }, [province, showRegion]);

  // 搜索防抖
  useEffect(() => {
    if (!showSearch || !onSearchChange) return;
    const t = setTimeout(() => onSearchChange(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  // 同步外部 searchValue
  useEffect(() => {
    setSearchInput(searchValue);
  }, [searchValue]);

  const hasFilters = showRegion || showSearch || filterGroups.length > 0 || showSort;

  return (
    <div className={`bg-white rounded-xl border border-gray-100 p-5 ${className}`}>
      {/* 第一行：筛选条件 */}
      {hasFilters && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* 省市选择 */}
          {showRegion && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">省份</label>
              <select
                value={province}
                onChange={(e) => {
                  onProvinceChange?.(e.target.value);
                  onCityChange?.('');
                }}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 outline-none focus:border-brand-green"
              >
                <option value="">全部省份</option>
                {provinceList.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.emoji ? `${p.emoji} ` : ''}{p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {showRegion && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">城市</label>
              <select
                value={city}
                onChange={(e) => onCityChange?.(e.target.value)}
                disabled={!province}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 outline-none focus:border-brand-green disabled:opacity-50"
              >
                <option value="">{province ? '全部城市' : '请先选择省份'}</option>
                {cityList.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}

          {/* 搜索框 */}
          {showSearch && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">关键词</label>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && onSearch) onSearch(); }}
                placeholder={searchPlaceholder}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 outline-none focus:border-brand-green"
              />
            </div>
          )}

          {/* 筛选按钮组 */}
          {filterGroups.map((group) => (
            <div key={group.label}>
              <label className="block text-xs font-medium text-gray-500 mb-1">{group.label}</label>
              <div className="flex flex-wrap gap-1.5">
                {group.options.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => group.onChange(opt.key)}
                    className={`px-2 py-1.5 text-xs rounded-lg transition-colors ${
                      group.value === opt.key
                        ? 'bg-brand-green text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 第二行：状态栏 + 排序 */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="w-2 h-2 bg-brand-green rounded-full"></span>
          {resultCount !== undefined ? (
            <span>共 <strong className="text-gray-700">{resultCount.toLocaleString()}</strong> {resultLabel}</span>
          ) : (
            <span>筛选中...</span>
          )}
        </div>

        {showSort && sortOptions.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">排序：</span>
            {sortOptions.map((opt) => (
              <button
                key={opt.key}
                onClick={() => onSortChange?.(opt.key)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  sortValue === opt.key
                    ? 'bg-brand-green text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
