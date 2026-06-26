'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface SearchBarProps {
  placeholder?: string;
  defaultValue?: string;
  onSearch?: (query: string) => void;
  /** 跳转到搜索页，传 'assets' 或 'brokers' */
  target?: 'assets' | 'brokers';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function SearchBar({
  placeholder = '输入关键词搜索...',
  defaultValue = '',
  onSearch,
  target,
  size = 'md',
  className = '',
}: SearchBarProps) {
  const [query, setQuery] = useState(defaultValue);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = () => {
    const q = query.trim();
    if (!q) return;

    if (onSearch) {
      onSearch(q);
    } else if (target) {
      router.push(`/${target}?search=${encodeURIComponent(q)}`);
    }
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-sm',
    lg: 'px-6 py-4 text-base',
  };

  const btnSizeClasses = {
    sm: 'px-3 py-2 text-xs',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-sm',
  };

  return (
    <div className={`flex rounded-xl shadow-lg border border-gray-200 overflow-hidden bg-white ${className}`}>
      <div className="flex-1 flex items-center px-4">
        <svg className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder={placeholder}
          className={`w-full outline-none text-gray-700 placeholder-gray-400 ${sizeClasses[size]}`}
        />
      </div>
      <button
        onClick={handleSearch}
        className={`bg-[#1a4731] hover:bg-[#2d5a45] text-white font-medium transition-colors ${btnSizeClasses[size]}`}
      >
        搜索
      </button>
    </div>
  );
}
