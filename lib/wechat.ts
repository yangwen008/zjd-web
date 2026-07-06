// lib/wechat.ts — 微信公众号核心 SDK
// 功能：OAuth 登录、模板消息、JSSDK 签名、access_token 缓存

import { queryOne, execute } from './db';

// ============ 配置 ============

// 微信 API 直连（api.weixin.qq.com）
// 之前用代理 112.44.232.181:8443，但 Cloudflare Workers 无法访问（error 1003）
// 改为直连，需在微信公众平台配置 IP 白名单或不设白名单
const WX_API_BASE = 'https://api.weixin.qq.com';

function wxApiUrl(path: string): string {
  return `${WX_API_BASE}${path}`;
}

interface WxConfig {
  appId: string;
  appSecret: string;
}

function getWxConfig(): WxConfig {
  const appId = (process.env as Record<string, string>).WX_APPID;
  const appSecret = (process.env as Record<string, string>).WX_APPSECRET;
  if (!appId || !appSecret) {
    throw new Error('WX_APPID or WX_APPSECRET not configured');
  }
  return { appId, appSecret };
}

// ============ Access Token 管理 (带 D1 缓存) ============

interface TokenCache {
  access_token: string;
  expires_at: string;
  updated_at?: string;
}

/**
 * 获取 access_token，优先从 D1 缓存读取
 * 微信 access_token 有效期 2 小时，提前 5 分钟刷新
 */
export async function getAccessToken(): Promise<string> {
  const config = getWxConfig();

  // 查缓存
  const cached = await queryOne<TokenCache>(
    `SELECT value as access_token, updated_at as expires_at FROM homepage_config WHERE key = 'wx_access_token'`
  );

  if (cached) {
    const updatedAt = new Date(cached.expires_at).getTime();
    const now = Date.now();
    // 有效期 2 小时，提前 5 分钟刷新
    if (now - updatedAt < 115 * 60 * 1000) {
      return cached.access_token;
    }
  }

  // 重新获取（通过国内代理）
  const url = wxApiUrl(`/cgi-bin/token?grant_type=client_credential&appid=${config.appId}&secret=${config.appSecret}`);
  const res = await fetch(url);
  const data = await res.json() as { access_token?: string; errcode?: number; errmsg?: string };

  if (!data.access_token) {
    throw new Error(`Failed to get access_token: ${data.errmsg} (${data.errcode})`);
  }

  // 写入缓存（用 homepage_config 表，key = wx_access_token）
  await execute(
    `INSERT OR REPLACE INTO homepage_config (key, value, updated_at) VALUES ('wx_access_token', ?, datetime('now'))`,
    data.access_token
  );

  return data.access_token;
}

// ============ OAuth 登录 ============

interface WxOAuthToken {
  access_token: string;
  refresh_token: string;
  openid: string;
  scope: string;
  unionid?: string;
}

interface WxUserInfo {
  openid: string;
  nickname: string;
  sex: number;
  province: string;
  city: string;
  country: string;
  headimgurl: string;
  unionid?: string;
}

/**
 * 生成微信 OAuth 授权 URL
 * @param redirectUri 回调地址（需要 encodeURIComponent）
 * @param state 防 CSRF 状态码
 * @param scope snsapi_base（静默）或 snsapi_userinfo（弹窗授权）
 */
export function getOAuthUrl(redirectUri: string, state: string, scope: 'snsapi_base' | 'snsapi_userinfo' = 'snsapi_userinfo'): string {
  const config = getWxConfig();
  const encodedUri = encodeURIComponent(redirectUri);
  return `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${config.appId}&redirect_uri=${encodedUri}&response_type=code&scope=${scope}&state=${state}#wechat_redirect`;
}

/**
 * 用 code 换取 OAuth token
 */
export async function getOAuthToken(code: string): Promise<WxOAuthToken> {
  const config = getWxConfig();
  const url = wxApiUrl(`/sns/oauth2/access_token?appid=${config.appId}&secret=${config.appSecret}&code=${code}&grant_type=authorization_code`);
  const res = await fetch(url);
  const data = await res.json() as WxOAuthToken & { errcode?: number; errmsg?: string };

  if ((data as any).errcode) {
    throw new Error(`OAuth token error: ${(data as any).errmsg} (${(data as any).errcode})`);
  }

  return data;
}

/**
 * 获取微信用户信息（需要 scope=snsapi_userinfo）
 */
export async function getWxUserInfo(accessToken: string, openid: string): Promise<WxUserInfo> {
  const url = wxApiUrl(`/sns/userinfo?access_token=${accessToken}&openid=${openid}&lang=zh_CN`);
  const res = await fetch(url);
  const data = await res.json() as WxUserInfo & { errcode?: number; errmsg?: string };

  if ((data as any).errcode) {
    throw new Error(`Get user info error: ${(data as any).errmsg} (${(data as any).errcode})`);
  }

  return data;
}

/**
 * 刷新 OAuth access_token（有效期 30 天）
 */
export async function refreshOAuthToken(refreshToken: string): Promise<WxOAuthToken> {
  const config = getWxConfig();
  const url = wxApiUrl(`/sns/oauth2/refresh_token?appid=${config.appId}&grant_type=refresh_token&refresh_token=${refreshToken}`);
  const res = await fetch(url);
  return await res.json() as WxOAuthToken;
}

// ============ 模板消息 ============

interface TemplateMessageData {
  [key: string]: { value: string; color?: string };
}

interface SendTemplateMessageParams {
  touser: string;       // openid
  template_id: string;
  url?: string;         // 点击跳转链接
  miniprogram?: {       // 跳小程序（可选）
    appid: string;
    pagepath: string;
  };
  data: TemplateMessageData;
}

/**
 * 发送模板消息
 */
export async function sendTemplateMessage(params: SendTemplateMessageParams): Promise<{ msgid?: string; errcode?: number }> {
  const accessToken = await getAccessToken();
  const url = wxApiUrl(`/cgi-bin/message/template/send?access_token=${accessToken}`);

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = await res.json() as { errcode: number; errmsg: string; msgid?: string };

  // 记录发送日志
  try {
    await execute(
      `INSERT INTO wx_messages (openid, template_id, msg_type, content, status, msg_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
      params.touser,
      params.template_id,
      'template',
      JSON.stringify(params.data),
      data.errcode === 0 ? 'sent' : 'failed',
      data.msgid || null
    );
  } catch {
    // 日志写入失败不影响主流程
  }

  return data;
}

// ============ 预定义模板消息 ============

/**
 * 资产审核通过通知
 */
export async function notifyAssetApproved(openid: string, assetTitle: string, assetId: number, siteUrl: string, templateId: string) {
  return sendTemplateMessage({
    touser: openid,
    template_id: templateId,
    url: `${siteUrl}/asset/${assetId}`,
    data: {
      first: { value: '您发布的资产已通过审核！' },
      keyword1: { value: assetTitle },
      keyword2: { value: '已通过' },
      keyword3: { value: new Date().toLocaleString('zh-CN') },
      remark: { value: '点击查看资产详情' },
    },
  });
}

/**
 * 预约带看通知（推送给资产所有者）
 */
export async function notifyAppointment(openid: string, assetTitle: string, userName: string, userPhone: string, assetId: number, siteUrl: string, templateId: string) {
  return sendTemplateMessage({
    touser: openid,
    template_id: templateId,
    url: `${siteUrl}/dashboard/leads`,
    data: {
      first: { value: '您有一条新的预约带看！' },
      keyword1: { value: assetTitle },
      keyword2: { value: userName },
      keyword3: { value: userPhone },
      keyword4: { value: new Date().toLocaleString('zh-CN') },
      remark: { value: '请及时联系预约人安排带看' },
    },
  });
}

/**
 * 新线索通知（推送给资产所有者）
 */
export async function notifyNewLead(openid: string, assetTitle: string, assetId: number, siteUrl: string, templateId: string) {
  return sendTemplateMessage({
    touser: openid,
    template_id: templateId,
    url: `${siteUrl}/dashboard/leads`,
    data: {
      first: { value: '有人对您的资产感兴趣！' },
      keyword1: { value: assetTitle },
      keyword2: { value: '联系方式解锁' },
      keyword3: { value: new Date().toLocaleString('zh-CN') },
      remark: { value: '前往线索中心查看详情' },
    },
  });
}

// ============ JSSDK 签名 ============

interface JSSDKSignature {
  appId: string;
  timestamp: number;
  nonceStr: string;
  signature: string;
}

/**
 * 获取 jsapi_ticket，带 D1 缓存
 * 微信 jsapi_ticket 有效期 2 小时，提前 5 分钟刷新
 */
async function getJsapiTicket(): Promise<string> {
  const accessToken = await getAccessToken();

  // 查缓存
  const cached = await queryOne<{ value: string; updated_at: string }>(
    `SELECT value, updated_at FROM homepage_config WHERE key = 'wx_jsapi_ticket'`
  );

  if (cached) {
    const updatedAt = new Date(cached.updated_at).getTime();
    const now = Date.now();
    // 有效期 2 小时，提前 5 分钟刷新
    if (now - updatedAt < 115 * 60 * 1000) {
      return cached.value;
    }
  }

  // 重新获取
  const ticketRes = await fetch(
    wxApiUrl(`/cgi-bin/ticket/getticket?access_token=${accessToken}&type=jsapi`)
  );
  const ticketData = await ticketRes.json() as { ticket?: string; errcode?: number; errmsg?: string };

  if (!ticketData.ticket) {
    throw new Error(`Failed to get jsapi_ticket: ${ticketData.errmsg} (${ticketData.errcode})`);
  }

  // 写入缓存
  await execute(
    `INSERT OR REPLACE INTO homepage_config (key, value, updated_at) VALUES ('wx_jsapi_ticket', ?, datetime('now'))`,
    ticketData.ticket
  );

  return ticketData.ticket;
}

/**
 * 生成 JSSDK 签名
 * 用于前端 wx.config() 调用
 */
export async function getJSSDKSignature(url: string): Promise<JSSDKSignature> {
  const config = getWxConfig();

  // 1. 获取带缓存的 jsapi_ticket
  const ticket = await getJsapiTicket();

  // 2. 生成签名
  const timestamp = Math.floor(Date.now() / 1000);
  const nonceStr = Math.random().toString(36).substring(2, 15);
  const signStr = `jsapi_ticket=${ticket}&noncestr=${nonceStr}&timestamp=${timestamp}&url=${url}`;

  // SHA-1 签名
  const encoder = new TextEncoder();
  const data = encoder.encode(signStr);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const signature = Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return {
    appId: config.appId,
    timestamp,
    nonceStr,
    signature,
  };
}

// ============ 自定义菜单（可选） ============

interface MenuButton {
  type?: string;
  name: string;
  url?: string;
  sub_button?: MenuButton[];
}

/**
 * 创建自定义菜单
 */
export async function createMenu(buttons: MenuButton[]): Promise<{ errcode: number; errmsg: string }> {
  const accessToken = await getAccessToken();
  const url = wxApiUrl(`/cgi-bin/menu/create?access_token=${accessToken}`);

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ button: buttons }),
  });

  return await res.json() as { errcode: number; errmsg: string };
}
