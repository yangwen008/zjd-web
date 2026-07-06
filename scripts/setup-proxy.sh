#!/bin/bash
# =============================================
# 代理服务器增强脚本
# 在 112.44.232.181 上执行
# 功能：新增 /fetch（网页代理抓取）和 /jssdk（微信签名）端点
# =============================================

set -e

WORK_DIR="/opt/wx-proxy"
PORT=8444
WX_APPID="wx19a9456163a3bf8d"
# ⚠️ 替换为真实值
WX_APPSECRET="YOUR_APPSECRET_HERE"

echo "=== 代理服务增强 部署 ==="

mkdir -p $WORK_DIR
cd $WORK_DIR

cat > server.js << 'SERVEREOF'
const http = require('http');
const https = require('https');
const { URL } = require('url');
const crypto = require('crypto');

const PORT = process.env.PORT || 8444;
const APPID = process.env.WX_APPID;
const APPSECRET = process.env.WX_APPSECRET;

// ============ 缓存 ============
let accessTokenCache = { token: null, expiresAt: 0 };
let ticketCache = { ticket: null, expiresAt: 0 };

// ============ 工具函数 ============

function jsonRes(res, code, data) {
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(data));
}

function httpGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const mod = parsed.protocol === 'https:' ? https : http;
    const options = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        ...headers,
      },
      timeout: 30000,
    };
    const req = mod.request(options, (resp) => {
      let body = [];
      resp.on('data', chunk => body.push(chunk));
      resp.on('end', () => {
        const buf = Buffer.concat(body);
        resolve({ status: resp.statusCode, headers: resp.headers, body: buf });
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.end();
  });
}

// ============ 微信 JSSDK ============

async function getAccessToken() {
  const now = Date.now();
  if (accessTokenCache.token && now < accessTokenCache.expiresAt) return accessTokenCache.token;
  const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${APPID}&secret=***
  const resp = await httpGet(url);
  const data = JSON.parse(resp.body.toString());
  if (!data.access_token) throw new Error(`getAccessToken: ${data.errmsg} (${data.errcode})`);
  accessTokenCache = { token: data.access_token, expiresAt: now + (data.expires_in - 300) * 1000 };
  console.log(`[${new Date().toISOString()}] access_token refreshed`);
  return accessTokenCache.token;
}

async function getJsapiTicket() {
  const now = Date.now();
  if (ticketCache.ticket && now < ticketCache.expiresAt) return ticketCache.ticket;
  const token = await getAccessToken();
  const url = `https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=***&type=jsapi`;
  const resp = await httpGet(url);
  const data = JSON.parse(resp.body.toString());
  if (!data.ticket) throw new Error(`getJsapiTicket: ${data.errmsg} (${data.errcode})`);
  ticketCache = { ticket: data.ticket, expiresAt: now + (data.expires_in - 300) * 1000 };
  console.log(`[${new Date().toISOString()}] jsapi_ticket refreshed`);
  return ticketCache.ticket;
}

async function handleJssdk(url, res) {
  try {
    const ticket = await getJsapiTicket();
    const timestamp = Math.floor(Date.now() / 1000);
    const nonceStr = Math.random().toString(36).substring(2, 15);
    const signStr = `jsapi_ticket=${ticket}&noncestr=${nonceStr}&timestamp=${timestamp}&url=${url}`;
    const signature = crypto.createHash('sha1').update(signStr).digest('hex');
    jsonRes(res, 200, { success: true, data: { appId: APPID, timestamp, nonceStr, signature } });
  } catch (err) {
    jsonRes(res, 500, { success: false, error: err.message });
  }
}

// ============ 网页代理抓取 ============

async function handleFetch(targetUrl, reqHeaders, res) {
  try {
    if (!targetUrl) return jsonRes(res, 400, { error: 'url parameter required' });

    // 安全检查：只允许 http/https
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      return jsonRes(res, 400, { error: 'only http/https URLs allowed' });
    }

    const forwardHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    };

    // 透传 Referer
    const referer = reqHeaders['x-forwarded-referer'] || reqHeaders['referer'];
    if (referer) forwardHeaders['Referer'] = referer;

    const resp = await httpGet(targetUrl, forwardHeaders);

    // 设置响应头
    const contentType = resp.headers['content-type'] || 'text/html';
    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'X-Proxy-Status': resp.status,
      'X-Proxy-Content-Length': resp.body.length,
    });
    res.end(resp.body);
  } catch (err) {
    jsonRes(res, 502, { error: `fetch failed: ${err.message}` });
  }
}

// ============ 微信 API 转发 (兼容已有 /weixin-proxy/) ============

async function handleWeixinProxy(path, res) {
  try {
    const targetUrl = `https://api.weixin.qq.com${path}`;
    const resp = await httpGet(targetUrl);
    res.writeHead(resp.status, {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
    });
    res.end(resp.body);
  } catch (err) {
    jsonRes(res, 502, { error: err.message });
  }
}

// ============ HTTP 服务 ============

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Forwarded-Referer',
    });
    return res.end();
  }

  const parsed = new URL(req.url, `http://localhost:${PORT}`);
  const path = parsed.pathname;

  // GET /jssdk?url=xxx
  if (path === '/jssdk') {
    const url = parsed.searchParams.get('url');
    if (!url) return jsonRes(res, 400, { success: false, error: 'url required' });
    return handleJssdk(url, res);
  }

  // GET /fetch?url=xxx
  if (path === '/fetch') {
    const url = parsed.searchParams.get('url');
    return handleFetch(url, req.headers, res);
  }

  // /weixin-proxy/* — 微信 API 转发（兼容旧路径）
  if (path.startsWith('/weixin-proxy/')) {
    const wxPath = path.replace('/weixin-proxy', '');
    return handleWeixinProxy(wxPath, res);
  }

  // GET /health
  if (path === '/health') {
    return jsonRes(res, 200, {
      status: 'ok',
      time: new Date().toISOString(),
      endpoints: ['/fetch?url=', '/jssdk?url=', '/weixin-proxy/*', '/health'],
    });
  }

  jsonRes(res, 404, { error: 'not found' });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[Proxy] listening on :${PORT}`);
  console.log(`[Proxy] /fetch?url=xxx     — 网页代理抓取`);
  console.log(`[Proxy] /jssdk?url=xxx     — 微信 JSSDK 签名`);
  console.log(`[Proxy] /weixin-proxy/*    — 微信 API 转发`);
  console.log(`[Proxy] /health            — 健康检查`);
});
SERVEREOF

# systemd 服务
cat > /etc/systemd/system/wx-proxy.service << SVCEOF
[Unit]
Description=WeChat + Fetch Proxy Service
After=network.target

[Service]
Type=simple
WorkingDirectory=$WORK_DIR
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=5
Environment=PORT=$PORT
Environment=WX_APPID=$WX_APPID
Environment=WX_APPSECRET=$WX_APPSECRET

[Install]
WantedBy=multi-user.target
SVCEOF

systemctl daemon-reload
systemctl enable wx-proxy
systemctl restart wx-proxy

sleep 1

echo ""
echo "=== 部署完成 ==="
echo ""
echo "测试："
echo "  curl http://localhost:$PORT/health"
echo "  curl 'http://localhost:$PORT/fetch?url=https://www.jutubao.com/tudi/'"
echo "  curl 'http://localhost:$PORT/jssdk?url=https://zjd.cn/'"
echo ""
echo "日志：journalctl -u wx-proxy -f"
