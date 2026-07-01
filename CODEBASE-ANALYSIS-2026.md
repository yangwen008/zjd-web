# zjd-web 代码库深度分析报告

> 分析日期: 2026-07-01 | 版本: v8.8.2 (最新 commit: b98996c)

---

## 一、项目概览

**zjd.cn — 乡村闲置资产数字交易所**

一个基于 Next.js 15 + Cloudflare 全家桶（Pages + D1 + R2 + Workers）的乡村闲置资产数字化流转平台。

### 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端 | Next.js 15 (App Router) + React 19 + Tailwind CSS | SSR + CSR 混合 |
| 运行时 | Cloudflare Workers (edge runtime) | 所有 API Route 均为 edge |
| 数据库 | Cloudflare D1 (SQLite) | 24 张表，含 FTS5 全文搜索 |
| 存储 | Cloudflare R2 | 私有桶 + 签名 URL 防盗链 |
| AI | Gemini 2.0 Flash | 爬虫数据清洗 + UGC 智能秒填 |
| 爬虫 | Playwright (GitHub Actions 定时) | 配方化架构，零代码扩展 |
| 部署 | Cloudflare Pages | GitHub Actions 自动部署 |
| 认证 | Cookie Session + SHA-256 | 角色权限体系 (RBAC) |

---

## 二、数据库结构 (24 张表)

### 核心业务表

| 表名 | 用途 | 关键字段 |
|------|------|---------|
| `assets` | 资产主表 | title, province/city/district, area_mu, price_year, source_type(official/village/ugc), status(pending/approved/rejected/banned), views, featured |
| `assets_fts` | FTS5 全文搜索虚拟表 | 与 assets 同步触发器维护 |
| `users` | 用户表 | phone, role(user/broker/village_org/data_editor/project_publisher/admin/superadmin), status, password_hash |
| `brokers` | 合伙人表 | user_id, name, region, province, city, rating(gold/silver/bronze), show_count, good_rate |
| `bulk_projects` | 大宗路演项目 | title, code, area_mu, price_start, yield_rate, certification |
| `leads` | 线索表 (买家解锁记录) | asset_id, user_id, unlock_type, broker_id |
| `user_favorites` | 用户收藏表 | user_id, asset_id (唯一约束) |

### 配置与元数据表

| 表名 | 用途 |
|------|------|
| `homepage_config` | 首页 KV 配置 (标题/副标题/板块数量等) |
| `regions` | 行政区划 (province/city/district 三级, Materialized Path) |
| `asset_types` | 资产类型字典 (宅基地/林地/茶园/厂房等 9 种) |
| `market_data` | 行情数据 (省级中位价/涨跌/砍价空间) |
| `infrastructure_ratings` | 基建评分 (5G延迟/医院距离/电网冗余) |

### 权限与安全表

| 表名 | 用途 |
|------|------|
| `roles` / `permissions` / `role_permissions` | RBAC 权限体系 (7角色 × 47权限) |
| `user_sessions` | 会话管理 (UUID + 过期时间) |
| `login_attempts` | 登录锁定 (5次失败锁30分钟) |
| `login_logs` | 登录审计日志 |
| `admin_audit_logs` | 管理员操作审计 (只 INSERT 不 DELETE) |
| `audit_reviews` | 审核记录 |
| `rate_limits` | 频率限制 (IP + 操作维度) |
| `alerts` | 告警记录 |
| `ai_usage_log` | AI 用量追踪 (预算熔断) |

### 爬虫系统表

| 表名 | 用途 |
|------|------|
| `scrapers_recipes` | 爬虫配方 (URL/CSS选择器/调度/AI提示词) |
| `staging_raw` | 爬虫原始数据暂存 (raw → cleaned → imported) |
| `unlock_tasks` | 解锁任务队列 |

### ER 关系核心链路

```
users ──1:N──> assets (发布者)
users ──1:1──> brokers (合伙人信息)
users ──1:N──> user_favorites (收藏)
users ──1:N──> leads (解锁记录)
assets ──1:N──> leads (被解锁)
assets ──1:N──> unlock_tasks (解锁任务)
brokers ──1:N──> leads (分配线索)
regions ──自关联──> regions (parent_code 树形)
scrapers_recipes ──1:N──> staging_raw (配方→原始数据)
```

---

## 三、API 路由清单 (30+ 端点)

### 公开 API

| 路由 | 方法 | 功能 |
|------|------|------|
| `/api/assets` | GET | 资产列表 (分页/筛选/FTS搜索) |
| `/api/asset-types` | GET | 资产类型字典 |
| `/api/brokers` | GET | 合伙人列表 |
| `/api/regions` | GET | 行政区划 |
| `/api/auth/login` | POST | 手机号+密码登录 |
| `/api/auth/register` | POST | 注册 (支持角色申请) |
| `/api/auth/me` | GET | 当前用户信息 |
| `/api/auth/logout` | POST | 登出 |
| `/api/unlock` | POST/GET | 联系方式解锁任务 |
| `/api/images/[...path]` | GET | R2 图片代理 (签名验证) |

### 用户后台 API (`/api/dashboard/*`)

| 路由 | 功能 |
|------|------|
| `/api/dashboard/assets` | 我的资产列表 |
| `/api/dashboard/favorites` | 我的收藏 |
| `/api/dashboard/leads` | 我的线索 |
| `/api/dashboard/profile` | 个人信息读写 |
| `/api/dashboard/publish` | 发布资产 |
| `/api/dashboard/stats` | 用户维度统计 |

### 管理后台 API (`/api/admin/*`)

| 路由 | 功能 |
|------|------|
| `/api/admin/auth` | 管理员认证 (密码→cookie) |
| `/api/admin/stats` | 全站统计 |
| `/api/admin/config` | 首页配置 CRUD |
| `/api/admin/assets` | 资产管理 (审核/上下架/推荐/编辑) |
| `/api/admin/assets/[id]/approve` | 批准资产 |
| `/api/admin/assets/[id]/reject` | 拒绝资产 |
| `/api/admin/brokers` | 合伙人管理 |
| `/api/admin/bulk-projects` | 大宗项目管理 |
| `/api/admin/market-data` | 行情数据管理 |
| `/api/admin/infra-ratings` | 基建评分管理 |
| `/api/admin/regions` | 行政区划管理 |
| `/api/admin/asset-types` | 资产类型管理 |
| `/api/admin/scrapers` | 爬虫配方管理 |
| `/api/admin/staging` | 暂存数据管理 |
| `/api/admin/users` | 用户管理 (审核/封禁/角色变更) |
| `/api/admin/upload` | R2 文件上传 |
| `/api/scrape` | 爬虫配方 CRUD + 状态更新 |

---

## 四、前端页面架构

### 公开页面

| 路由 | 渲染方式 | 功能 |
|------|---------|------|
| `/` | SSR (异步服务端组件) | 首页 (7 个板块, 8 个并行 D1 查询) |
| `/regions` | CSR | 热点寻源 |
| `/market-index` | CSR | 流转大盘 (省级行情) |
| `/market-index/[province]` | CSR | 省份行情详情 |
| `/search` | CSR | 资产搜索引擎 (FTS + 多维筛选) |
| `/asset/[id]` | SSR | 资产详情 (三级尽调, MediaGallery 轮播) |
| `/brokers` | CSR | 合伙人墙 |
| `/brokers/[id]` | CSR | 合伙人详情 |
| `/bulk-projects` | CSR | 大宗路演列表 |
| `/bulk-projects/[id]` | CSR | 大宗项目详情 |
| `/infra-rating` | CSR | 基建评分列表 |
| `/infra-rating/[id]` | CSR | 基建详情 |
| `/login` | CSR | 登录 |
| `/register` | CSR | 注册 (2步: 基本信息→角色选择) |
| `/pending-review` | CSR | 待审核提示 |

### 后台页面

| 路由 | 功能 |
|------|------|
| `/admin` | 运营控制台 (统计 + 首页配置 + 公司信息) |
| `/admin/assets` | 资产审核 (默认显示待审核) |
| `/admin/brokers` | 合伙人管理 |
| `/admin/bulk-projects` | 大宗项目管理 |
| `/admin/market-data` | 行情数据管理 |
| `/admin/infra-ratings` | 基建评分管理 |
| `/admin/regions` | 行政区划管理 |
| `/admin/asset-types` | 资产类型管理 |
| `/admin/scrapers` | 爬虫配方管理 |
| `/admin/staging` | 暂存数据管理 |
| `/admin/users` | 用户管理 |
| `/dashboard` | 用户概览 (按角色显示不同统计+快捷操作) |
| `/dashboard/assets` | 我的资产 |
| `/dashboard/assets/new` | 发布资产 |
| `/dashboard/assets/[id]/edit` | 编辑资产 |
| `/dashboard/favorites` | 我的收藏 |
| `/dashboard/leads` | 我的线索 |
| `/dashboard/profile` | 个人资料 |

---

## 五、核心业务逻辑

### 5.1 认证体系

**双认证系统**:
1. **用户认证**: Cookie `user_session` → D1 user_sessions 表查询 → 用户信息
   - 密码: SHA-256 哈希 (无盐)
   - 登录锁定: 5 次失败锁 30 分钟
   - 会话有效期: 7 天
2. **管理员认证**: Cookie `admin_token` = `authenticated` → 简单密码比对
   - 密码从环境变量 `ADMIN_PASSWORD` 读取
   - Fallback: `zjd2026admin` (⚠️ 安全风险)

**RBAC 权限体系** (7 角色 × 47 权限):
```
superadmin (100) > admin (50) > project_publisher (25) > broker/village_org (20) > data_editor (15) > user (10)
```

### 5.2 资产生命周期

```
创建(pending) → 审核(approved/rejected) → 展示 → 浏览/收藏/解锁
     ↑                                              ↓
  UGC发布/爬虫采集                            leads 线索生成
```

- **source_type**: official(官方原矿) / village(村委直发) / ugc(用户上传)
- **status**: pending → approved / rejected / banned
- **每日配额**: 普通用户 3 条/天, 合伙人/村集体 5 条/天
- **GPS 去重**: Haversine 公式, 500m 半径围栏

### 5.3 首页渲染流程

首页是异步服务端组件, 并行查询 8 个数据源:

```
getHotAssets(6)         → 热门资产 (按 views 降序)
getMarketData()         → 行情数据
getAssetsBySource()     → 官方原矿(6) + 村委直发(2)
getFeaturedBulkProjects(2) → 大宗路演
getInfraRatings()       → 基建评分
getBrokers(3)           → 合伙人
getHomepageConfig()     → 首页配置
```

所有配置通过 `homepage_config` 表动态管理, 后台可调。

### 5.4 爬虫系统

**配方化架构**:
1. `scrapers_recipes` 表存储配方 (URL, CSS 选择器, 翻页规则)
2. GitHub Actions 每天凌晨 3 点触发 `catcher.js`
3. Playwright 打开页面 → CSS 选择器提取 → 保存到 `staging_raw`
4. 管理员审核 → 导入 `assets` 表

### 5.5 搜索实现

- D1 的 FTS5 全文搜索扩展
- `assets_fts` 虚拟表与 `assets` 通过触发器同步
- 支持 title/description/location/province/city 字段搜索

### 5.6 安全机制

| 机制 | 实现 |
|------|------|
| R2 防盗链 | HMAC-SHA256 签名 URL + Referer 校验 |
| 发布防刷 | 每日配额 (C端3条, G端5条) |
| GPS 去重 | Haversine 公式, 500m 半径围栏 |
| 审计日志 | admin_audit_logs 只 INSERT 不 DELETE |
| AI 预算熔断 | D1 持久化每日消费, 硬顶 10 元/天 |
| 频率限制 | D1 存储, 按 IP+端点粒度 |
| 路由保护 | Middleware 拦截 admin/dashboard 路径 |
| SQL 注入防护 | 参数化查询 (D1 prepare/bind) |
| CSRF 防护 | SameSite=Strict Cookie |
| 电话加密 | AES-GCM 加密存储 |

---

## 六、部署与 CI/CD

### 部署流程
```
GitHub Push (main) → GitHub Actions → npm install → @cloudflare/next-on-pages → wrangler pages deploy
```

### 爬虫定时任务
```
GitHub Actions cron (每天 UTC 03:00) → npm install → playwright install → node scrapers/catcher.js
```

### 环境变量

| 变量 | 用途 | 存储位置 |
|------|------|---------|
| `GEMINI_API_KEY` | Gemini AI 密钥 | Cloudflare Dashboard |
| `ADMIN_PASSWORD` | 管理员密码 | Cloudflare Dashboard |
| `SIGNING_SECRET` | R2 签名密钥 | Cloudflare Dashboard |
| `CF_API_TOKEN` | 爬虫 API 令牌 | GitHub Secrets |
| `CF_API_URL` | 爬虫目标 URL | GitHub Secrets |

---

## 七、已知问题与待办

### 🔴 安全风险

1. **管理员认证过于简单**: 仅密码比对 + cookie 值 `authenticated`, 无 JWT/Session 管理, fallback 硬编码 `zjd2026admin`
2. **SHA-256 无盐哈希**: 密码存储未加盐, 建议升级为 bcrypt/PBKDF2
3. **admin_audit_logs 字段不匹配**: audit.ts 写入的 `user_role`, `module`, `level`, `before_data`, `after_data`, `user_agent` 字段在 schema.sql 中未定义

### 🟡 功能缺失 (明日计划中提到)

1. **注册缺少"大宗用户"选项**: ROLES 数组只有 user/broker/village_org
2. **村集体/大宗用户专属发布模板**: 目前只有合伙人有专属页面
3. **管理后台总资产点击跳转**: 应显示全部资产而非待审核
4. **资产详情页基建数据硬编码**: 未从 infrastructure_ratings 表读取

### 🟢 性能优化

1. **首页 8 个并行查询**: 对 D1 有压力, 建议引入缓存层
2. **FTS5 中文分词**: 搜索精度有限
3. **R2 公开 URL 占位符**: `getR2PublicUrl()` 返回 `pub-placeholder.r2.dev`

---

## 八、核心 lib 模块说明

| 文件 | 职责 |
|------|------|
| `lib/db.ts` | D1 连接封装 (query/queryOne/execute/batch) |
| `lib/data.ts` | 数据访问层, 所有 D1 查询封装 (资产/行情/合伙人/大宗/基建/区划等) |
| `lib/auth.ts` | 认证 (Session/密码/权限/登录锁定/角色工具) |
| `lib/utils.ts` | 工具 (AES-GCM 加密/Haversine 距离/每日配额/GPS 去重/签名 URL) |
| `lib/ai.ts` | Gemini AI 封装 (HTML 提取/UGC 秒填/预算熔断) |
| `lib/r2.ts` | R2 存储封装 (上传/公开 URL) |
| `lib/rate-limit.ts` | 频率限制 (D1 存储, 按 IP+端点) |
| `lib/audit.ts` | 审计日志 (快捷方法: auditAsset/auditBulk/auditUser/auditAuth/auditConfig) |
| `middleware.ts` | 路由保护 (admin/dashboard 路径拦截) |

---

## 九、近期开发进展 (2026-06-29 ~ 06-30)

### QWEN 6月29日 完成

1. **Dashboard 用户后台**: 补齐"我的资产"/"我的线索"/"我的收藏"页面, 实现多角色数据隔离
2. **资产发布系统**: 完整闭环 (前端表单→后端入库→GPS定位→图片视频上传)
3. **R2 私有化存储**: 代理上传链路 (上传→存储→代理访问)
4. **Dashboard 统计修复**: 修复 toLocaleString() 报错导致页面崩溃的致命 Bug
5. **前台详情页升级**: MediaGallery 轮播组件 (图片+视频混合)

### QWEN 6月30日 完成

1. **ClientShell 物理隔离**: 前台 Navbar/Footer 在后台页面不再闪现
2. **Admin 后台全面升级**: 侧边栏分组折叠、品牌 Logo、运营控制台跳转、资产审核默认 pending
3. **Dashboard 焕然一新**: Sidebar 顶天立地、专属 Topbar、问候语、卡片式快捷操作
4. **前台品牌统一**: Logo 集成、版本标签升级、登录入口优化

### MIMO 6月30日 完成

1. **项目分析报告**: 完整梳理数据库架构、权限系统、API 路由
2. **地址下拉框修复**: 解决 React 'use client' 子组件内原生 `<select>` 丢失交互能力的 Bug
3. **13 次 commit 推送**: 持续迭代优化

---

## 十、代码统计

| 类别 | 数量 |
|------|------|
| TypeScript/TSX 文件 | ~90 |
| JavaScript 文件 | 1 (catcher.js) |
| SQL 文件 | 3 |
| 数据库表 | 24 |
| API 路由 | ~30 |
| 前端页面 | ~20 |
| 组件 | ~15 |
| 角色 | 7 |
| 权限点 | 47 |

---

*报告生成完毕。如需深入分析特定模块或开始具体工作，请告知。*
