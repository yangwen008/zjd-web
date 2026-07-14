'use client';

import { useEffect } from 'react';

interface WeChatJSSDKProps {
  title: string;
  desc: string;
  imgUrl: string;
  link?: string;
}

export default function WeChatJSSDK({ title, desc, imgUrl, link }: WeChatJSSDKProps) {
  useEffect(() => {
    // 1. 仅在微信手机端浏览器中执行（PC端微信或普通浏览器直接跳过，绝不影响登录）
    const isWechatMobile = /micromessenger/i.test(navigator.userAgent) && /mobile/i.test(navigator.userAgent);
    if (!isWechatMobile) return;

    // 2. 获取当前 URL（必须与后端签名一致）
    const currentUrl = window.location.href.split('#')[0];

    // 3. 动态加载微信 JSSDK
    const loadWxSDK = () => {
      if ((window as any).wx) {
        initWxConfig();
      } else {
        const script = document.createElement('script');
        script.src = 'https://res.wx.qq.com/open/js/jweixin-1.6.0.js';
        script.async = true;
        script.onload = () => initWxConfig();
        document.head.appendChild(script);
      }
    };

    // 4. 初始化配置
    const initWxConfig = async () => {
      try {
        // 调用您的代理服务器
        const res = await fetch(`http://112.44.232.181:8443/jssdk?url=${encodeURIComponent(currentUrl)}`);
        const data = await res.json();

        if (!data.success || !data.data) {
          console.error('微信签名失败:', data);
          return;
        }

        // 5. 注入 wx.config（仅用于分享，不涉及登录）
        (window as any).wx.config({
          debug: false, // 调试时可改为 true
          appId: data.data.appId,
          timestamp: data.data.timestamp,
          nonceStr: data.data.nonceStr,
          signature: data.data.signature,
          jsApiList: ['updateAppMessageShareConfig', 'updateTimelineShareData'],
        });

        // 6. 配置分享卡片
        (window as any).wx.ready(() => {
          const shareData = {
            title: title || '宅基地交易所',
            desc: desc || '专业的宅基地交易平台',
            link: link || currentUrl,
            imgUrl: imgUrl || 'https://zjd.cn/logo.png',
          };
          (window as any).wx.updateAppMessageShareConfig(shareData);
          (window as any).wx.updateTimelineShareData(shareData);
        });
      } catch (err) {
        console.error('获取签名异常:', err);
      }
    };

    loadWxSDK();
  }, [title, desc, imgUrl, link]);

  return null; // 纯逻辑组件，不渲染任何 UI
}
