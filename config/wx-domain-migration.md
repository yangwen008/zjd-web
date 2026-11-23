# 公众号/开放平台域名迁移配置清单（zjd.cn → z.zjd.cn）

> 2026-11-23 整理。代码侧已全部迁移到 `https://z.zjd.cn`（已核实无旧域名残留），
> 本文档是 **微信各平台后台** 需要手动完成的配置项。

## 现状核实（已验证 ✅）

| 项 | 状态 |
|---|---|
| 代码内域名（API 回调/菜单/分享/模板消息跳转/小程序 baseUrl） | ✅ 全部为 `https://z.zjd.cn` |
| 线上站点 | ✅ https://z.zjd.cn 正常（标题"乡村闲置资产数字交易所"） |
| 域名校验文件 | ✅ https://z.zjd.cn/MP_verify_ga4iGrIdWJ1KkvTK.txt 返回 200（内容 `ga4iGrIdWJ1KkvTK`），公众平台添加域名时可直接通过校验 |
| 自定义菜单 JSON / 自动回复文案（config/wx-menu.json、config/wx-auto-reply.md） | ✅ 已指向 z.zjd.cn，待推送到公众号 |

---

## 一、微信公众平台后台（mp.weixin.qq.com）

路径：**设置与开发 → 公众号设置 → 功能设置**

### 1. 网页授权域名（必改 🔴）
- 添加：`z.zjd.cn`（不带 `https://`、不带路径）
- 数量上限 2 个；若 `zjd.cn` 已不再使用可删除，仍在用则两个并存
- 影响功能：微信内网页授权登录
  （`/api/auth/wx/login` → 授权后回调 `https://z.zjd.cn/wx-callback`）
- 不改的症状：微信内点登录报「redirect_uri 域名与后台配置不一致」

### 2. JS接口安全域名（必改 🔴）
- 添加：`z.zjd.cn`（上限 5 个）
- 影响功能：微信内分享卡片（WxShareConfig → `/api/wx/jssdk`）

### 3. 业务域名（建议改 🟡）
- 添加：`z.zjd.cn`（上限 5 个）
- 影响功能：微信内打开网站不再提示"非官方网页，请谨慎访问"
- 同样用 `MP_verify_ga4iGrIdWJ1KkvTK.txt` 校验（已就绪，见上表）

### 4. 自定义菜单（必改 🔴）
菜单 JSON 已指向 z.zjd.cn，需重新推送生效：
```bash
bash config/wx-setup.sh <APPID> <APPSECRET>
```
- 推送后 24 小时全量生效；取消关注→重新关注可立即看到
- 或在公众平台后台「自定义菜单」手工把旧 zjd.cn 链接替换为 z.zjd.cn

### 5. 自动回复（必改 🔴）
- 后台「内容与功能 → 自动回复」：关注后回复 + 关键词回复里若还有 zjd.cn 旧链接
- 替换文案已备好：`config/wx-auto-reply.md`（全部为 z.zjd.cn）

### 6. 服务器配置（消息推送）→ 保持"停用" ⚪
- 代码中没有消息推送端点（无 echostr 校验接口），**不要启用服务器配置**
- 自动回复全部走后台规则，不需要 URL/Token

### 7. 模板消息（检查即可 🟡）
- 消息跳转 URL 由代码生成（已为 z.zjd.cn），无需改动
- 检查「模板消息」模板库中是否有写死 zjd.cn 跳转链接的模板，有则更新

---

## 二、微信开放平台（open.weixin.qq.com）— 网站应用

网站应用 AppID：`wxdf0895ffafe30943`（PC 扫码登录 / JS-SDK 签名用）

- **授权回调域**：改为 `z.zjd.cn`
  - 影响：PC 扫码登录（`/wx-scan-login` → 回调 `https://z.zjd.cn/wx-open-callback`）
- 应用官网等仍写 zjd.cn 的字段顺手更新

---

## 三、小程序后台（如小程序在用）— 服务器域名

路径：**开发管理 → 开发设置 → 服务器域名**（小程序 API 全部走 `https://z.zjd.cn`）

- request 合法域名：`+ https://z.zjd.cn`
- uploadFile 合法域名：`+ https://z.zjd.cn`（发布资产传图/视频）
- downloadFile 合法域名：`+ https://z.zjd.cn`（图片/视频代理 `/api/images/`）

---

## 四、配置完成后的验证步骤

```bash
# 1. 校验文件可访问（应输出 ga4iGrIdWJ1KkvTK）
curl -s https://z.zjd.cn/MP_verify_ga4iGrIdWJ1KkvTK.txt
```

1. **网页授权**：微信内打开 `https://z.zjd.cn/api/auth/wx/login?redirect=/` → 应正常跳微信授权页，授权后回到首页（而不是报 redirect_uri 域名不一致）
2. **分享卡片**：微信内打开任意资产详情页 → 右上角转发，卡片标题/描述/缩略图正确
3. **扫码登录**：PC 打开 `https://z.zjd.cn/wx-scan-login` → 手机微信扫码 → 登录成功
4. **公众号菜单**：公众号底部菜单各栏目点击直达 z.zjd.cn 对应页面
5. **自动回复**：关注/发送关键词 → 回复中链接为 z.zjd.cn

---

## 五、备注：JS-SDK AppID 归属（如分享仍异常）

当前分享签名使用**开放平台网站应用 AppID**（`lib/wechat.ts` → `getOpenJSSDKSignature`，由 `/api/wx/jssdk` 输出）。
若完成域名配置后微信内分享仍报 `invalid url domain`：

1. 将 `components/shared/WxShareConfig.tsx` 的取签名接口切到公众号 AppID 版本
   （`getJSSDKSignature` 已在 `lib/wechat.ts` 实现，改造 `/api/wx/jssdk` 即可）
2. 并确保「JS接口安全域名」已加 `z.zjd.cn`（见一-2）
