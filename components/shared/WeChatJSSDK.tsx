'use client';

import { useEffect } from 'react';

interface WeChatJSSDKProps {
  title: string;
  desc: string;
  imgUrl: string;
  link?: string;
}

// 👇 新增：定义接口，解决 TypeScript 'unknown' 类型报错
interface WxSignatureResponse {
  success: boolean;
  data?: {
    appId: string;
    timestamp: number;
    nonceStr: string;
    signature: string;
  };
}

export default function WeChatJSSDK({ title, desc, imgUrl, link }: WeChatJSSDKProps) {
  useEffect(() => {
    // 仅在微信手机端浏览器中执行，绝不干扰 PC 端登录
    const isWechatMobile = /micromessenger/i.test(navigator.userAgent) && /mobile/i.test(navigator.userAgent);
    if (!isWechatMobile) return;

    // 获取当前 URL（必须与后端签名一致）
    const currentUrl = window.location.href.split('#')[0];

    // 动态加载微信 JSSDK
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

    // 初始化配置
    const initWxConfig = async () => {
      try {
        // 调用您的代理服务器
        const res = await fetch(`http://112.44.232.181:8443/jssdk?url=${encodeURIComponent(currentUrl)}`);
        
        // 👇 修复点：添加类型断言 as WxSignatureResponse
        const data = (await res.json()) as WxSignatureResponse;

        if (!data.success || !data.data) {
          console.error('❌ 微信签名失败:', data);
          return;
        }

        console.log('✅ 获取签名成功:', data.data);

        // 配置 wx
        (window as any).wx.config({
          debug: false, // 调试时可改为 true，微信会弹出 config:ok
          appId: data.data.appId,
          timestamp: data.data.timestamp,
          nonceStr: data.data.nonceStr,
          signature: data.data.signature,
          jsApiList: ['updateAppMessageShareConfig', 'updateTimelineShareData'],
        });

        // 监听 ready 事件
        (window as any).wx.ready(() => {
          console.log('✅ wx.config 验证成功，开始配置分享');
          
          const shareData = {
            title: title || '宅基地交易所',
            desc: desc || '专业的宅基地交易平台',
            link: link || currentUrl,
            imgUrl: imgUrl || 'https://zjd.cn/logo.png',
          };

          // 分享给朋友
          (window as any).wx.updateAppMessageShareConfig(shareData);
          // 分享到朋友圈
          (window as any).wx.updateTimelineShareData(shareData);
          
          console.log('✅ 分享配置成功:', shareData);
        });

        // 监听 error 事件
        (window as any).wx.error((err: any) => {
          console.error('❌ wx.config 验证失败:', err);
        });
      } catch (err) {
        console.error('❌ 获取签名异常:', err);
      }
    };

    loadWxSDK();
  }, [title, desc, imgUrl, link]);

  return null; // 纯逻辑组件，不渲染任何 UI
}
