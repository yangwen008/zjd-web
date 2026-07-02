'use client';

import { useEffect } from 'react';

interface WxShareConfigProps {
  title: string;
  desc: string;
  link: string;
  imgUrl: string;
}

/**
 * 微信 JSSDK 分享配置组件
 * 在需要分享的页面引入，自动注入 wx.ready() 分享配置
 *
 * 使用方式：
 *   <WxShareConfig
 *     title="资产标题"
 *     desc="资产描述"
 *     link="https://zjd.cn/asset/123"
 *     imgUrl="https://zjd.cn/api/images/xxx.jpg"
 *   />
 */
export default function WxShareConfig({ title, desc, link, imgUrl }: WxShareConfigProps) {
  useEffect(() => {
    // 检测是否在微信浏览器内
    const ua = navigator.userAgent.toLowerCase();
    const isWechat = ua.indexOf('micromessenger') > -1;
    if (!isWechat) return;

    // 动态加载 wx JS SDK
    const script = document.createElement('script');
    script.src = 'https://res.wx.qq.com/open/js/jweixin-1.6.0.js';
    script.onload = () => {
      // 获取 JSSDK 签名
      fetch(`/api/wx/jssdk?url=${encodeURIComponent(window.location.href.split('#')[0])}`)
        .then(r => r.json() as Promise<any>)
        .then(data => {
          if (!data.success) return;

          const wx = (window as any).wx;
          if (!wx) return;

          wx.config({
            debug: false,
            appId: data.data.appId,
            timestamp: data.data.timestamp,
            nonceStr: data.data.nonceStr,
            signature: data.data.signature,
            jsApiList: [
              'updateAppMessageShareData',
              'updateTimelineShareData',
              'getLocation',
              'previewImage',
            ],
          });

          wx.ready(() => {
            // 分享给朋友
            wx.updateAppMessageShareData({
              title,
              desc,
              link,
              imgUrl,
              success: () => {},
            });

            // 分享到朋友圈
            wx.updateTimelineShareData({
              title,
              link,
              imgUrl,
              success: () => {},
            });
          });
        })
        .catch(() => {});
    };
    document.head.appendChild(script);

    return () => {
      // cleanup
      const existing = document.querySelector('script[src*="jweixin"]');
      if (existing) existing.remove();
    };
  }, [title, desc, link, imgUrl]);

  return null; // 无 UI 渲染
}
