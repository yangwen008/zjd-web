'use client';

import { useState } from 'react';

interface MediaItem {
  type: 'image' | 'video';
  url: string;
}

export default function MediaGallery({ images, video }: { images: string[]; video: string | null }) {
  const mediaList: MediaItem[] = [];

  // ✅ 修改点 1：先添加视频，让视频默认排在第一位
  if (video) {
    mediaList.push({ type: 'video', url: video });
  }

  // ✅ 修改点 2：再添加图片，排在视频后面
  if (images && images.length > 0) {
    images.forEach((url) => {
      if (url) mediaList.push({ type: 'image', url });
    });
  }

  const [currentIndex, setCurrentIndex] = useState(0);

  // 如果没有媒体文件，显示占位图
  if (mediaList.length === 0) {
    return (
      <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl h-80 flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300">
        <div className="text-center">
          <div className="text-6xl mb-3 opacity-60">🏔️</div>
          <div className="text-lg font-semibold text-gray-500">暂无实景图片/视频</div>
          <div className="text-sm text-gray-400 mt-1">发布者尚未上传资产图片</div>
        </div>
      </div>
    );
  }

  const currentMedia = mediaList[currentIndex];

  const goTo = (index: number) => setCurrentIndex(index);
  const prev = () => setCurrentIndex((p) => (p === 0 ? mediaList.length - 1 : p - 1));
  const next = () => setCurrentIndex((p) => (p === mediaList.length - 1 ? 0 : p + 1));

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
      {/* 主展示区 */}
      <div className="relative aspect-video bg-gray-900">
        {currentMedia.type === 'image' ? (
          <img src={currentMedia.url} alt="" className="w-full h-full object-contain" />
        ) : (
          <video src={currentMedia.url} controls className="w-full h-full" autoPlay />
        )}

        {/* 左右切换箭头 */}
        {mediaList.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/30 hover:bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={next}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/30 hover:bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* 右上角计数器 */}
        <div className="absolute top-4 right-4 bg-black/50 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
          {currentIndex + 1} / {mediaList.length}
        </div>
      </div>

      {/* 底部缩略图导航 */}
      {mediaList.length > 1 && (
        <div className="p-4 bg-gray-50 border-t border-gray-100">
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {mediaList.map((media, index) => (
              <button
                key={index}
                onClick={() => goTo(index)}
                className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all relative ${
                  index === currentIndex ? 'border-brand-green ring-2 ring-brand-green/20' : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                {media.type === 'image' ? (
                  <img src={media.url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}