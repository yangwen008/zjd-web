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
      const proxyBase = 'http://112.44.232.181:8443';
      const pageUrl = window.location.href.split('#')[0];
      fetch(`${proxyBase}/jssdk?url=${encodeURIComponent(pageUrl)}`)
        .then(r => r.json() as Promise<any>)
        .then(data => {
          if (!data.success) {
            console.error('[WxShare] JSSDK签名获取失败:', data.error);
            return;
          }

          const wx = (window as any).wx;
          if (!wx) return;

          wx.config({
            debug: window.location.search.includes('wxdebug=1'),
            appId: data.data.appId,
            timestamp: data.data.timestamp,
            nonceStr: data.data.nonceStr,
            signature: data.data.signature,
            jsApiList: [
              'onMenuShareAppMessage',
              'onMenuShareTimeline',
              'updateAppMessageShareData',
              'updateTimelineShareData',
            ],
          });

          wx.ready(() => {
            console.log('[WxShare] wx.ready, 注入分享数据');

            // 老版 API（兼容性最好，微信 7.0+ 都支持）
            wx.onMenuShareAppMessage({
              title: title,
              desc: desc,
              link: link,
              imgUrl: imgUrl,
              success: function () {
                console.log('[WxShare] onMenuShareAppMessage success');
              },
            });

            wx.onMenuShareTimeline({
              title: title,
              link: link,
              imgUrl: imgUrl,
              success: function () {
                console.log('[WxShare] onMenuShareTimeline success');
              },
            });

            // 新版 API（备用）
            wx.updateAppMessageShareData({
              title: title,
              desc: desc,
              link: link,
              imgUrl: imgUrl,
            });

            wx.updateTimelineShareData({
              title: title,
              link: link,
              imgUrl: imgUrl,
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
