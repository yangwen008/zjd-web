# zjd-web 代码库深度分析报告

> 分析时间: 2026-07-01 | 版本: v8.8.2 (commit b98996c)

---

## 一、项目概览

**zjd.cn — 乡村闲置资产数字交易所**

一个基于 Next.js 15 + Cloudflare 全家桶（Pages + D1 + R2 + Workers）的乡村资产流转平台，核心功能包括资产展示、搜索、行情数据、合伙人系统、大宗路演等。

### 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端 | Next.js 15 (App Router) + React 19 + Tailwind CSS | SSR + CSR 混合渲染 |
| 运行时 | Cloudflare Workers (edge runtime) | 所有 API 路由均为 edge |
| 数据库 | Cloudflare D1 (SQLite) | 24 张表，含 FTS5 全文搜索 |
| 存储 | Cloudflare R2 | 私有桶 + 签名URL防盗链 |
| AI | Gemini 2.0 Flash | 爬虫数据清洗、UGC智能秒填 |
| 爬虫 | Playwright (GitHub Actions定时) | 配方化架构，零代码扩展 |
| 部署 | Cloudflare Pages | GitHub Actions 自动部署 |
| 认证 | Cookie Session + SHA-256 | 角色权限体系 (RBAC) |

### 项目规模

- **前端页面**: ~25 个路由
- **API路由**: ~30 个
- **数据库表**: 24 张
- **组件**: ~20 个
- **代码文件**: ~100 个

---

## 二、数据库结构 (24张表)

### 核心业务表

| 表名 | 用途 | 关键字段 |
|------|------|---------|
| `assets` | 资产主表 | title, province/city/district, area_mu, price_year, source_type, status, views, featured, user_id |
| `assets_fts` | FTS5全文搜索虚拟表 | 与assets同步触发器维护 |
| `users` | 用户表 | phone, role, status, password_hash, broker_*, org_name |
| `brokers` | 合伙人表 | user_id, name, region, province, city, rating, show_count, good_rate |
| `bulk_projects` | 大宗路演项目 | title, code, area_mu, price_start, yield_rate, certification |
| `leads` | 线索表(解锁记录) | asset_id, user_id, unlock_type, broker_id |
| `user_favorites` | 用户收藏 | user_id, asset_id (唯一约束) |

### 配置与元数据表

| 表名 | 用途 |
|------|------|
| `homepage_config` | 首页配置键值对 |
| `regions` | 行政区划(省/市/区县三级，含emoji、经纬度) |
| `asset_types` | 资产类型字典(宅基地/林地/茶园等) |
| `market_data` | 行情数据(省级中位价、涨跌幅、砍价空间) |
| `infrastructure_ratings` | 基建评分(5G延迟、医院距离、电网冗余) |

### 权限与安全表

| 表名 | 用途 |
|------|------|
| `roles` / `permissions` / `role_permissions` | RBAC权限体系(7角色50+权限点) |
| `user_sessions` | 会话管理 |
| `login_attempts` | 登录锁定(5次/30分钟) |
| `login_logs` | 登录审计 |
| `admin_audit_logs` | 管理员操作审计(只INSERT不DELETE) |
| `rate_limits` | 频率限制 |
| `ai_usage_log` | AI用量追踪(预算熔断) |

### 爬虫系统表

| 表名 | 用途 |
|------|------|
| `scrapers_recipes` | 爬虫配方(选择器、翻页、调度) |
| `staging_raw` | 爬虫原始数据暂存 |
| `unlock_tasks` | 解锁任务队列 |

### ER关系核心链路

```
users ──1:N──> assets (发布者)
users ──1:1──> brokers (合伙人信息)
users ──1:N──> user_favorites (收藏)
users ──1:N──> leads (解锁记录)
assets ──1:N──> leads (被解锁)
assets ──1:N──> unlock_tasks (解锁任务)
brokers ──1:N──> leads (分配线索)
```

---

## 三、API路由清单

### 公开API (12个)
- `GET /api/assets` — 资产列表(分页/筛选/FTS搜索)
- `GET /api/asset-types` — 资产类型
- `GET /api/regions` — 行政区划
- `GET /api/brokers` — 合伙人列表
- `POST /api/auth/login` — 用户登录
- `POST /api/auth/register` — 用户注册(支持角色申请)
- `GET /api/auth/me` — 当前用户信息
- `POST /api/auth/logout` — 退出登录
- `POST /api/unlock` — 创建解锁任务
- `GET /api/unlock` — 查询解锁状态
- `GET /api/images/[...path]` — R2图片代理(签名验证)
- `GET/POST /api/scrape` — 爬虫配方管理

### 管理员API (15个，需admin_token)
- `/api/admin/auth` — 管理员认证
- `/api/admin/stats` — 全站统计
- `/api/admin/config` — 首页配置CRUD
- `/api/admin/assets` — 资产管理(审核/编辑/推荐)
- `/api/admin/assets/[id]/approve` — 批准资产
- `/api/admin/assets/[id]/reject` — 拒绝资产
- `/api/admin/brokers` — 合伙人管理
- `/api/admin/bulk-projects` — 大宗项目管理
- `/api/admin/market-data` — 行情数据管理
- `/api/admin/infra-ratings` — 基建评分管理
- `/api/admin/regions` — 行政区划管理
- `/api/admin/asset-types` — 资产类型管理
- `/api/admin/scrapers` — 爬虫配方管理
- `/api/admin/staging` — 暂存数据管理
- `/api/admin/users` — 用户管理

### 用户后台API (6个，需user_session)
- `/api/dashboard/assets` — 我的资产
- `/api/dashboard/favorites` — 我的收藏
- `/api/dashboard/leads` — 我的线索
- `/api/dashboard/profile` — 个人资料
- `/api/dashboard/publish` — 发布资产
- `/api/dashboard/stats` — 统计数据

---

## 四、前端页面架构

### 公开页面 (15个)

| 路径 | 渲染 | 功能 |
|------|------|------|
| `/` | SSR | 首页(8个数据源并行查询) |
| `/regions` | CSR | 热点寻源 |
| `/market-index` | CSR | 行情大盘 |
| `/market-index/[province]` | CSR | 省级行情详情 |
| `/search` | CSR | 资产搜索引擎 |
| `/brokers` | SSR | 合伙人名册 |
| `/brokers/[id]` | SSR | 合伙人详情 |
| `/bulk-projects` | SSR | 大宗路演大厅 |
| `/bulk-projects/[id]` | SSR | 路演项目详情 |
| `/infra-rating` | SSR | 基建指标 |
| `/infra-rating/[id]` | SSR | 基建详情 |
| `/asset/[id]` | SSR | 资产详情(MediaGallery轮播) |
| `/login` | CSR | 用户登录 |
| `/register` | CSR | 用户注册(两步) |
| `/pending-review` | CSR | 待审核提示 |

### 后台页面 (18个)
- `/admin` — 运营控制台
- `/admin/assets` — 资产审核(默认pending)
- `/admin/brokers` — 合伙人管理
- `/admin/bulk-projects` — 大宗管理
- `/admin/market-data` — 行情管理
- `/admin/infra-ratings` — 基建管理
- `/admin/regions` — 区划管理
- `/admin/asset-types` — 类型管理
- `/admin/scrapers` — 爬虫管理
- `/admin/staging` — 暂存数据
- `/admin/users` — 用户管理
- `/dashboard` — 用户概览(按角色差异化)
- `/dashboard/assets` — 我的资产
- `/dashboard/assets/new` — 发布资产
- `/dashboard/assets/[id]/edit` — 编辑资产
- `/dashboard/favorites` — 我的收藏
- `/dashboard/leads` — 我的线索
- `/dashboard/profile` — 个人资料

---

## 五、核心业务逻辑

### 5.1 认证与权限

**双轨认证**:
- 用户: Cookie `user_session` → D1 session查询 → 用户信息
- 管理员: Cookie `admin_token` = `authenticated` → 简单密码比对

**角色体系** (7级):
```
superadmin (100) > admin (50) > project_publisher (25) > broker/village_org (20) > data_editor (15) > user (10)
```

**权限粒度**: 50+个权限点，覆盖asset/bulk/infra/market/partner/user/lead/favorite/scraper/config/audit模块

### 5.2 资产生命周期

```
创建(pending) → 审核(approved/rejected) → 展示 → 浏览/收藏/解锁
     ↑                                              ↓
  UGC发布/爬虫采集                            leads线索生成
```

- **source_type**: official(官方原矿) / village(村委直发) / ugc(用户上传)
- **status**: pending → approved / rejected / banned
- **每日配额**: C端3条/天，G端5条/天
- **GPS去重**: Haversine公式，500m半径围栏

### 5.3 首页渲染

首页是SSR异步组件，并行查询8个数据源：
1. `getHotAssets(6)` — 热门资产(按views降序)
2. `getMarketData()` — 行情数据
3. `getAssetsBySource('official', 6)` — 官方原矿
4. `getAssetsBySource('village', 2)` — 村委直发
5. `getFeaturedBulkProjects(2)` — 大宗路演
6. `getInfraRatings()` — 基建评分
7. `getBrokers(3)` — 合伙人
8. `getHomepageConfig()` — 首页配置

所有配置通过`homepage_config`表动态管理，后台可调。

### 5.4 爬虫系统

配方化架构：
1. `scrapers_recipes`表存储配方(URL、CSS选择器、翻页规则)
2. GitHub Actions每天凌晨3点触发`catcher.js`
3. Playwright打开页面 → CSS选择器提取 → 保存到`staging_raw`
4. 管理员审核 → 导入`assets`表

### 5.5 搜索实现

- D1的FTS5全文搜索扩展
- `assets_fts`虚拟表与`assets`通过触发器同步
- 支持title/description/location/province/city字段搜索

### 5.6 安全机制

| 机制 | 实现 |
|------|------|
| R2防盗链 | HMAC-SHA256签名URL + Referer校验 |
| 发布防刷 | 每日配额 + GPS围栏去重 |
| 审计日志 | admin_audit_logs只INSERT不DELETE |
| AI预算熔断 | D1持久化每日消费，硬顶10元/天 |
| 频率限制 | D1存储，按IP+端点粒度 |
| 路由保护 | Middleware拦截admin/dashboard路径 |
| SQL注入防护 | 参数化查询(D1 prepare/bind) |
| 电话加密 | AES-GCM加密存储 |

---

## 六、部署与CI/CD

### 部署流程
```
GitHub Push (main) → GitHub Actions → npm install → @cloudflare/next-on-pages → wrangler pages deploy
```

### 环境变量

| 变量 | 用途 | 存储位置 |
|------|------|---------|
| GEMINI_API_KEY | Gemini AI | Cloudflare Dashboard |
| ADMIN_PASSWORD | 管理员密码 | Cloudflare Dashboard |
| SIGNING_SECRET | R2签名密钥 | Cloudflare Dashboard |
| CF_API_TOKEN | 爬虫API令牌 | GitHub Secrets |
| CF_API_URL | 爬虫目标URL | GitHub Secrets |

---

## 七、已知问题与待办

### 安全风险
1. ⚠️ 管理员认证仅密码比对+cookie，fallback硬编码`zjd2026admin`
2. ⚠️ SHA-256无盐哈希存储密码
3. ⚠️ admin_audit_logs字段不匹配(schema缺少user_role/module/level等列)

### 功能缺失
1. 注册页面缺少"大宗用户"角色选项
2. 村集体/大宗用户专属发布模板未实现
3. 管理后台总资产点击后应显示全部资产而非待审核
4. 资产详情页基建/环境数据硬编码，未从数据库读取
5. R2公开URL占位符未替换

### 性能优化
1. 首页8个独立D1查询，可考虑batch或缓存
2. FTS5中文分词精度有限
3. 无数据库迁移机制

---

## 八、核心lib模块

| 文件 | 职责 |
|------|------|
| `lib/db.ts` | D1连接封装(query/queryOne/execute/batch) |
| `lib/data.ts` | 数据访问层，所有D1查询封装 |
| `lib/auth.ts` | 认证(Session/密码/权限/登录锁定) |
| `lib/utils.ts` | 工具(加密/Haversine/配额/GPS去重/签名URL) |
| `lib/ai.ts` | Gemini AI封装(HTML提取/UGC秒填/预算熔断) |
| `lib/r2.ts` | R2存储封装(上传/公开URL) |
| `lib/rate-limit.ts` | 频率限制(D1存储) |
| `lib/audit.ts` | 审计日志 |
| `middleware.ts` | 路由保护(admin/dashboard) |

---

## 九、近期开发进展

### QWEN 6月29日完成
1. Dashboard用户后台补齐(我的资产/线索/收藏)
2. 资产发布系统完整闭环
3. R2私有化存储代理链路
4. Dashboard统计修复
5. 前台详情页MediaGallery轮播组件

### QWEN 6月30日完成
1. ClientShell物理隔离(前台Navbar/Footer不在后台闪现)
2. Admin后台全面升级(侧边栏分组折叠、品牌Logo、资产审核默认pending)
3. Dashboard焕然一新(Sidebar顶天立地、专属Topbar、问候语、卡片式快捷操作)
4. 前台品牌统一(Logo集成、版本标签升级、登录入口优化)

### MIMO 6月30日完成
1. 完整项目分析报告
2. 地址下拉框Bug修复(React 'use client'子组件内原生select丢失交互)
3. 13次commit推送到GitHub

### 明日计划(待完成)
1. 注册页面：先选择身份，村集体需上传证明文件，缺少大宗用户选项
2. 用户后台：村集体/大宗用户专属发布模板
3. Admin后台：总资产点击跳转后应显示全部资产

---

*报告生成时间: 2026-07-01*
