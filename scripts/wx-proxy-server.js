const http = require('http');
const https = require('https');
const { URL } = require('url');
const crypto = require('crypto');
const PORT = process.env.PORT || 8444;
const APPID = process.env.WX_APPID;
const APPSECRET = process.env.WX_APPSECRET;

let accessTokenCache = { token: null, expiresAt: 0 };
let ticketCache = { ticket: null, expiresAt: 0 };

function jsonRes(res, code, data) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(data));
}

function httpGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const mod = parsed.protocol === 'https:' ? https : http;
    const req = mod.request({
      hostname: parsed.hostname, port: parsed.port,
      path: parsed.pathname + parsed.search, method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        ...headers
      },
      timeout: 30000
    }, (resp) => {
      let body = [];
      resp.on('data', chunk => body.push(chunk));
      resp.on('end', () => resolve({
        status: resp.statusCode,
        headers: resp.headers,
        body: Buffer.concat(body)
      }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.end();
  });
}

async function getAccessToken() {
  const now = Date.now();
  if (accessTokenCache.token && now < accessTokenCache.expiresAt) return accessTokenCache.token;
  const resp = await httpGet(`https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${APPID}&secret=***
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
  const resp = await httpGet(`https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=***&type=jsapi`);
  const data = JSON.parse(resp.body.toString());
  if (!data.ticket) throw new Error(`getJsapiTicket: ${data.errmsg} (${data.errcode})`);
  ticketCache = { ticket: data.ticket, expiresAt: now + (data.expires_in - 300) * 1000 };
  console.log(`[${new Date().toISOString()}] jsapi_ticket refreshed`);
  return ticketCache.ticket;
}

async function handleJssdk(targetUrl, res) {
  try {
    const ticket = await getJsapiTicket();
    const timestamp = Math.floor(Date.now() / 1000);
    const nonceStr = Math.random().toString(36).substring(2, 15);
    const signStr = `jsapi_ticket=${ticket}&noncestr=${nonceStr}&timestamp=${timestamp}&url=${targetUrl}`;
    const signature = crypto.createHash('sha1').update(signStr).digest('hex');
    jsonRes(res, 200, {
      success: true,
      data: { appId: APPID, timestamp, nonceStr, signature }
    });
  } catch (err) {
    jsonRes(res, 500, { success: false, error: err.message });
  }
}

async function handleFetch(targetUrl, reqHeaders, res) {
  try {
    if (!targetUrl) return jsonRes(res, 400, { error: 'url required' });
    const forwardHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,*/*'
    };
    const referer = reqHeaders['x-forwarded-referer'] || reqHeaders['referer'];
    if (referer) forwardHeaders['Referer'] = referer;
    const resp = await httpGet(targetUrl, forwardHeaders);
    res.writeHead(200, {
      'Content-Type': resp.headers['content-type'] || 'text/html',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(resp.body);
  } catch (err) {
    jsonRes(res, 502, { error: `fetch failed: ${err.message}` });
  }
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,X-Forwarded-Referer'
    });
    return res.end();
  }
  const parsed = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = parsed.pathname;
  if (pathname === '/jssdk') {
    const url = parsed.searchParams.get('url');
    if (!url) return jsonRes(res, 400, { error: 'url required' });
    return handleJssdk(url, res);
  }
  if (pathname === '/fetch') {
    return handleFetch(parsed.searchParams.get('url'), req.headers, res);
  }
  if (pathname === '/health') {
    return jsonRes(res, 200, { status: 'ok', time: new Date().toISOString() });
  }
  jsonRes(res, 404, { error: 'not found' });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[Proxy] listening on :${PORT}`);
});
