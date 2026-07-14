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
 */
export default function WxShareConfig({ title, desc, link, imgUrl }: WxShareConfigProps) {
  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    const isWechat = ua.indexOf('micromessenger') > -1;
    if (!isWechat) return;

    const script = document.createElement('script');
    script.src = 'https://res.wx.qq.com/open/js/jweixin-1.6.0.js';
    script.onload = () => {
      const pageUrl = window.location.href.split('#')[0];
      fetch(`/api/wx/jssdk?url=${encodeURIComponent(pageUrl)}`)
        .then(r => r.json() as Promise<any>)
        .then(data => {
          if (!data.success) {
            console.error('[WxShare] JSSDK签名获取失败:', data.error);
            return;
          }

          const wx = (window as any).wx;
          if (!wx) return;

          wx.config({
            debug: true,
            appId: data.data.appId,
            timestamp: data.data.timestamp,
            nonceStr: data.data.nonceStr,
            signature: data.data.signature,
            jsApiList: [
              'updateAppMessageShareData',
              'updateTimelineShareData',
            ],
          });

          wx.ready(() => {
            console.log('[WxShare] wx.ready, 注入分享数据');

            // 新版 API（微信 6.7.2+）
            // link 加时间戳参数，强制微信重新抓取预览（避免缓存）
            var shareLink = link + (link.indexOf('?') > -1 ? '&' : '?') + '_wx=' + Date.now();
            wx.updateAppMessageShareData({
              title: title,
              desc: desc,
              link: shareLink,
              imgUrl: imgUrl,
              success: function () {
                console.log('[WxShare] updateAppMessageShareData success');
              },
            });

            wx.updateTimelineShareData({
              title: title,
              link: shareLink,
              imgUrl: imgUrl,
              success: function () {
                console.log('[WxShare] updateTimelineShareData success');
              },
            });
          });

          wx.error(function (err: any) {
            console.error('[WxShare] wx.error:', err);
          });
        })
        .catch((err) => {
          console.error('[WxShare] 请求异常:', err);
        });
    };
    document.head.appendChild(script);

    return () => {
      const existing = document.querySelector('script[src*="jweixin"]');
      if (existing) existing.remove();
    };
  }, [title, desc, link, imgUrl]);

  return null;
}
