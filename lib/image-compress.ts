/**
 * 客户端图片压缩工具
 * 使用 Canvas API 在浏览器端压缩图片，减少上传大小和加载时间
 */

interface CompressResult {
  file: File;
  width: number;
  height: number;
  sizeKB: number;
}

/**
 * 压缩图片
 * @param file 原始文件
 * @param maxWidth 最大宽度（默认1200px）
 * @param quality 压缩质量（0-1，默认0.8）
 * @returns 压缩后的文件
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1200,
  quality: number = 0.8
): Promise<CompressResult> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      // 计算新尺寸
      let { width, height } = img;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      // Canvas 绘制
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);

      // 导出为 Blob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas compression failed'));
            return;
          }
          const compressedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve({
            file: compressedFile,
            width,
            height,
            sizeKB: Math.round(blob.size / 1024),
          });
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * 生成缩略图（用于列表卡片）
 * @param file 原始文件
 * @param thumbWidth 缩略图宽度（默认400px）
 * @returns 缩略图文件
 */
export async function generateThumbnail(
  file: File,
  thumbWidth: number = 400
): Promise<CompressResult> {
  return compressImage(file, thumbWidth, 0.7);
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

/**
 * 从 images JSON 中提取图片 URL 列表
 * 兼容两种格式：
 *   旧格式: ["url1", "url2"]
 *   新格式: [{ url: "...", thumb: "..." }, ...]
 */
export function parseImageUrls(imagesJson: string | null, preferThumb: boolean = false): string[] {
  if (!imagesJson) return [];
  try {
    const arr = JSON.parse(imagesJson);
    if (!Array.isArray(arr)) return [];
    return arr.map((item) => {
      if (typeof item === 'string') return item;
      if (typeof item === 'object' && item) {
        return preferThumb && item.thumb ? item.thumb : item.url || '';
      }
      return '';
    }).filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * 获取第一张图片（用于列表卡片缩略图）
 */
export function getFirstImage(imagesJson: string | null, preferThumb: boolean = true): string | undefined {
  const urls = parseImageUrls(imagesJson, preferThumb);
  return urls.length > 0 ? urls[0] : undefined;
}
