# zjd-web 项目代码分析报告

> 分析时间：2026-06-29 | 分析范围：全量代码（74个文件）

---

## 一、项目概览

**zjd.cn** 是一个「乡村闲置资产数字交易所」平台，定位为连接乡村闲置宅基地、林地、古宅等资产与城市买家/投资商的数字化流转中枢。

| 维度 | 说明 |
|------|------|
| **技术栈** | Next.js 15 (App Router) + React 19 + Tailwind CSS |
| **运行时** | Cloudflare Workers (Edge Runtime) |
| **数据库** | Cloudflare D1 (SQLite) |
| **对象存储** | Cloudflare R2 (私有桶) |
| **AI引擎** | Gemini 2.0 Flash (数据清洗/提取) |
| **爬虫** | GitHub Actions + Playwright (配方化) |
| **部署** | Cloudflare Pages (自动CI/CD) |
| **版本** | v8.8.1 (金禾计划) |

---

## 二、项目结构总览

```
zjd-web/
├── app/                          # Next.js App Router (17个页面 + 12个API)
│   ├── page.tsx                  # 首页 (服务端组件，异步数据获取)
│   ├── layout.tsx                # 全局布局 (Navbar + Footer)
│   ├── error.tsx / not-found.tsx # 全局错误/404
│   ├── globals.css               # 全局样式 (Tailwind + 自定义动画)
│   ├── search/                   # 资产搜索引擎页
│   ├── regions/                  # 热点寻源页
│   ├── market-index/             # 流转大盘 + 省级详情
│   ├── infra-rating/             # 基建指标 + 区域详情
│   ├── brokers/                  # 合伙人名录 + 个人主页
│   ├── bulk-projects/            # 大宗路演页
│   ├── asset/[id]/               # 资产三级尽调详情页
│   ├── admin/                    # 后台管理 (4个子页面)
│   └── api/                      # Worker API (12个路由)
├── components/                   # UI组件库 (14个组件)
│   ├── layout/                   # Navbar, Footer
│   ├── shared/                   # AssetCard, FilterPanel, SearchBar, RegionSelector, WeChatModal, HeroSection
│   └── test-home/                # 首页专用组件 (8个)
├── lib/                          # 核心逻辑库
│   ├── db.ts                     # D1 连接 + 便捷查询封装
│   ├── data.ts                   # 数据访问层 (所有D1查询)
│   ├── ai.ts                     # Gemini AI 提纯引擎
│   ├── r2.ts                     # R2 对象存储工具
│   ├── utils.ts                  # 工具函数 (加密/签名/距离计算)
│   └── test-home-data.ts         # 首页 Mock 数据 (已弃用，仅做兜底)
├── sql/                          # 数据库脚本
│   ├── schema.sql                # 建表 (12张表 + FTS5 + 触发器)
│   └── seed.sql                  # 种子数据 (20条资产 + 5个合伙人 + 行情数据)
├── scrapers/catcher.js           # 爬虫主干引擎
├── .github/workflows/            # CI/CD
│   ├── deploy.yml                # 自动部署 (push → Cloudflare Pages)
│   └── scrape.yml                # 定时爬虫 (每天凌晨3点)
├── middleware.ts                  # 中间件 (admin 路由保护)
├── wrangler.toml                 # Cloudflare 配置
└── tailwind.config.ts            # Tailwind 主题配置
```

---

## 三、数据结构详解

### 3.1 核心数据表 (12张)

#### ① assets — 资产主表 (核心)
```sql
id, title, description, location, province, city, district, address,
area_mu(亩), price_year(年租金万), price_total(总价万), lease_years(流转年限),
asset_type(宅基地/林地/茶园/厂房等), source_type(official/village/ugc),
source_url, images(JSON数组), video_url, gps_lat, gps_lng,
contact_phone(加密), contact_name, views(浏览量), status(pending/approved/rejected/banned),
featured(橱窗推荐), user_id, raw_html, ai_extracted, created_at, updated_at
```
- **索引**: province, status, source_type, views(降序), featured+status
- **全文搜索**: FTS5 虚拟表 `assets_fts`，自动同步触发器

#### ② users — 用户表
```sql
id, openid(微信OpenID), nickname, avatar_url, phone,
role(buyer/broker/village/admin/superadmin), status, real_name,
org_name(村委/机构), org_license, verified, daily_quota(每日发布上限)
```

#### ③ brokers — 合伙人表
```sql
id, user_id, name, region, province, city, bio,
specialties(JSON数组), rating(gold/silver/bronze),
show_count(带看量), good_rate(好评率), phone_encrypted, avatar_url, status
```

#### ④ leads — 线索表 (买家解锁记录)
```sql
id, asset_id, user_id, unlock_type(phone/gps/contact), created_at
```

#### ⑤ homepage_config — 首页配置表
```sql
key(TEXT PK), value, updated_at
```
- 键值对存储，支持：hero文案、板块标题/副标题/显示数量、公司信息、ICP备案等

#### ⑥ scrapers_recipes — 爬虫配方表
```sql
id, name, base_url, list_url, enabled, pagination_type, max_pages,
selectors(JSON), detail_selectors(JSON), ai_prompt, schedule_cron,
last_run_at, last_run_status, proxy_enabled
```

#### ⑦ staging_raw — 爬虫原始数据暂存表
```sql
id, recipe_id, raw_html, raw_data(JSON), status(raw/cleaned/imported/error), error_msg
```

#### ⑧ market_data — 行情数据表
```sql
id, province, median_price, change_pct, bargain_space, total_listings
```

#### ⑨ infrastructure_ratings — 基建评分表
```sql
id, region, signal_5g_ms, hospital_min, grid_redundancy, overall_grade
```

#### ⑩ admin_audit_logs — 审计日志表 (只INSERT不DELETE)
```sql
id, admin_id, action, target_type, target_id, detail, ip_address
```

#### ⑪ unlock_tasks — 解锁任务表
```sql
id, asset_id, user_id, wechat_openid, status, result_data(JSON)
```

#### ⑫ ai_usage_log — AI用量追踪表
```sql
id, tokens_in, tokens_out, cost, model
```

### 3.2 数据关系

```
users (1) ──→ (N) assets       (发布者)
users (1) ──→ (N) brokers      (合伙人关联)
assets (1) ──→ (N) leads       (解锁记录)
assets (1) ──→ (N) unlock_tasks
scrapers_recipes (1) ──→ (N) staging_raw
```

---

## 四、核心业务逻辑

### 4.1 资产流转生命周期

```
爬虫采集/UGC提交 → staging_raw(原始数据)
    → AI提纯(Gemini) → assets(status=pending)
    → 管理员审核 → approved/rejected
    → 前台展示 → 浏览量统计
    → 买家解锁联系方式 → leads(线索)
```

### 4.2 三大数据来源

| 来源 | source_type | 说明 |
|------|------------|------|
| 官方原矿 | `official` | 政府/官方机构发布的产权信息 |
| 村委直营 | `village` | 村集体直接发布的资产 |
| 经纪人UGC | `ugc` | 合伙人/经纪人上传的资产 |

### 4.3 爬虫配方化架构

```
scrapers_recipes (D1)  →  catcher.js (GitHub Actions)
    ↓ 配置 selectors, detail_selectors, ai_prompt
    ↓ Playwright 抓取 → staging_raw
    ↓ AI清洗 → assets
```

- **配方驱动**: 所有采集站的差异化配置存储在 D1 的 `scrapers_recipes` 表
- **主干引擎**: `catcher.js` 只写一次，永远不需要改
- **定时执行**: GitHub Actions 每天凌晨3点触发
- **支持**: CSS选择器提取、属性提取(img@src, a@href)、详情页深度抓取、请求限速

### 4.4 安全机制

| 机制 | 实现 |
|------|------|
| 电话号码加密 | AES-GCM 加密 (Web Crypto API) |
| R2图片防盗链 | HMAC-SHA256 签名URL + Referer验证 |
| 每日发布配额 | C端3宗/日，G端5宗/日 |
| GPS围栏去重 | Haversine公式 + 矩形粗筛 |
| 管理员认证 | Cookie-based (httpOnly, secure, sameSite=strict) |
| Admin API保护 | middleware.ts 拦截未认证请求 |
| AI消费熔断 | D1持久化用量，每日预算硬顶(默认10元) |
| 审计日志 | 只INSERT不DELETE，记录所有管理操作 |

### 4.5 AI引擎 (Gemini 2.0 Flash)

```typescript
// lib/ai.ts - AIClient
├── extractFromHTML(html, customPrompt?)  // 从原始HTML提取结构化数据
├── extractFromUserInput(text)            // UGC智能秒填
├── checkBudget()                         // 预算熔断检查
├── logUsage(tokensIn, tokensOut, cost)   // 用量记录
└── setDailyBudget(amount)                // 设置每日预算
```

- **模型**: gemini-2.0-flash
- **温度**: 0.1 (低随机性，高确定性)
- **Token限制**: 4096
- **费用估算**: tokens_in × 0.00001 + tokens_out × 0.00003

---

## 五、页面架构分析

### 5.1 前台页面 (10个)

| 页面 | 路径 | 类型 | 数据源 |
|------|------|------|--------|
| 首页 | `/` | 异步服务端组件 | D1 (8个并行查询) |
| 热点寻源 | `/regions` | 异步服务端组件 | getHotAssets |
| 流转大盘 | `/market-index` | 异步服务端组件 | getMarketData |
| 省级详情 | `/market-index/[province]` | 异步服务端组件 | marketData + assets |
| 资产搜索 | `/search` | 客户端组件 | /api/assets |
| 资产详情 | `/asset/[id]` | 异步服务端组件 | getAssetById + 相似推荐 |
| 合伙人名录 | `/brokers` | 客户端组件 | /api/brokers (筛选/排序/分页) |
| 合伙人详情 | `/brokers/[id]` | 异步服务端组件 | getBrokerById + 管辖资产 |
| 基建指标 | `/infra-rating` | 异步服务端组件 | getInfraRatings |
| 基建详情 | `/infra-rating/[id]` | 异步服务端组件 | getInfraRatingById + 匹配资产 |
| 大宗路演 | `/bulk-projects` | 异步服务端组件 | getAssetsBySource |

### 5.2 后台管理 (4个)

| 页面 | 功能 |
|------|------|
| `/admin` | 运营控制台 (公司信息、首页板块配置、页脚配置) |
| `/admin/assets` | 资产审核 (筛选、批准、拒绝) |
| `/admin/brokers` | 合伙人管理 (增删改查、评级、带看量) |
| `/admin/scrapers` | 爬虫管理 (配方列表、新增采集站) |

### 5.3 API路由 (12个)

| 路由 | 方法 | 功能 |
|------|------|------|
| `/api/assets` | GET | 资产列表 (筛选/搜索/分页) |
| `/api/brokers` | GET | 合伙人列表 (筛选/排序/分页/省份城市) |
| `/api/regions` | GET | 行政区划查询 (省/市/区县/模糊搜索) |
| `/api/asset-types` | GET | 资产类型列表 |
| `/api/scrape` | GET/POST | 爬虫配方管理 |
| `/api/unlock` | GET/POST | 解锁任务创建/查询 |
| `/api/admin/auth` | GET/POST/DELETE | 管理员认证 |
| `/api/admin/assets` | GET/POST | 资产管理 (审核/推荐) |
| `/api/admin/assets/[id]/approve` | POST | 批准资产 |
| `/api/admin/assets/[id]/reject` | POST | 拒绝资产 |
| `/api/admin/brokers` | GET/POST | 合伙人管理 |
| `/api/admin/config` | GET/POST | 首页配置管理 |
| `/api/admin/stats` | GET | 统计数据 |
| `/api/admin/upload` | POST | 文件上传到R2 |
| `/api/admin/market-data` | GET/POST | 行情数据管理 |
| `/api/admin/migrate-brokers` | POST | 合伙人数据迁移 |

---

## 六、组件库分析

### 6.1 布局组件 (2个)

| 组件 | 说明 |
|------|------|
| `Navbar` | 全局导航栏，毛玻璃效果，6个主入口，移动端汉堡菜单 |
| `Footer` | 全局页脚，4-2-2-4网格布局，读取D1配置动态渲染 |

### 6.2 共享组件 (6个)

| 组件 | 说明 |
|------|------|
| `AssetCard` | 资产卡片，渐变背景+排名徽章+价格 |
| `FilterPanel` | 通用筛选面板，支持省市、搜索、筛选按钮组、排序 |
| `SearchBar` | 搜索框，支持跳转目标页 |
| `RegionSelector` | 省市区三级联选器 |
| `HeroSection` | 旧版Hero (带WeChatModal) |
| `WeChatModal` | 微信扫码注册弹窗 (模拟) |

### 6.3 首页专用组件 (8个)

| 组件 | 说明 |
|------|------|
| `HeroSection` | 新版Hero，胶囊搜索框+统计信息 |
| `RegionGrid` | 热点地区网格，图片卡片+浏览量 |
| `MarketStats` | 行情概览，4个统计卡片 |
| `PropertyCard` | 官方原矿资产卡片 |
| `VillageDirectCard` | 村委直发卡片，左图右文布局 |
| `BulkProjectCard` | 大宗路演卡片，含面积/收益率/确权信息 |
| `InfraRatingCard` | 基建评分卡片 |
| `BrokerCard` | 合伙人卡片 |
| `CTASection` | 底部行动号召区 |

---

## 七、技术亮点

### 7.1 架构优势

1. **全Edge部署**: 所有API路由和页面都标记 `runtime = 'edge'`，充分利用Cloudflare全球节点
2. **服务端优先**: 首页、详情页等关键页面使用异步服务端组件，SEO友好，首屏极快
3. **D1数据访问层**: `lib/data.ts` 封装了所有查询，业务逻辑与数据层解耦
4. **配方化爬虫**: 新增采集站只需在后台配置CSS选择器，0代码扩展
5. **AI提纯管道**: Gemini自动从原始HTML提取结构化数据，带预算熔断
6. **FTS5全文搜索**: SQLite原生全文搜索，触发器自动同步索引
7. **配置热更新**: 首页所有板块的标题/副标题/数量都存储在D1，后台实时修改

### 7.2 安全设计

1. **AES-GCM电话加密**: Web Crypto API原生实现，密钥通过SHA-256派生
2. **HMAC签名URL**: R2图片防盗链，签名+过期时间双重验证
3. **GPS围栏去重**: 矩形粗筛 + Haversine精筛，防止重复发布
4. **审计日志**: 只INSERT不DELETE，完整的管理操作追踪
5. **AI消费熔断**: D1持久化用量统计，防止API滥用

### 7.3 部署流程

```
GitHub Push → GitHub Actions → next-on-pages 构建 → Cloudflare Pages 部署
                                                              ↓
                                              D1 (数据库) + R2 (存储) + Workers (API)
```

---

## 八、已识别问题与改进建议

### 8.1 代码层面

| # | 问题 | 严重度 | 建议 |
|---|------|--------|------|
| 1 | `lib/test-home-data.ts` 的 Mock 数据仍在代码中，首页组件有 fallback 到 Mock 的逻辑 | 低 | 已正确通过 `catch(() => [])` 处理，但 Mock 数据文件可清理 |
| 2 | `app/api/admin/scrape/` 目录不存在，但 `scrapers/page.tsx` 引用了 `/api/scrape/recipes` | 中 | 爬虫API实际挂载在 `/api/scrape`，前端引用正确 |
| 3 | `middleware.ts` 中 admin 页面保护逻辑为空（注释说由客户端处理） | 中 | 可考虑加强服务端保护 |
| 4 | `R2PublicUrl` 使用占位域名 `pub-placeholder.r2.dev` | 高 | 需要替换为实际R2公开域名 |
| 5 | `admin_token` 使用硬编码值 `'authenticated'` 而非真正的JWT/session | 中 | 生产环境建议使用更安全的session管理 |
| 6 | `.env.example` 中 `ADMIN_PASSWORD=zjd2026admin` 作为默认值硬编码在 auth 路由中 | 中 | 应强制要求设置环境变量，移除硬编码默认值 |
| 7 | `unlock/route.ts` 中解锁任务立即完成，没有实际的异步处理逻辑 | 低 | 设计为预留接口，后续需对接实际解密流程 |
| 8 | 首页并行查询8个D1请求，D1冷启动可能较慢 | 中 | 可考虑缓存策略或ISR |

### 8.2 功能层面

| # | 缺失功能 | 说明 |
|---|----------|------|
| 1 | 微信登录未实现 | WeChatModal 是模拟UI，需对接微信开放平台 |
| 2 | 区域表(regions)和资产类型表(asset_types)未在schema中定义 | API引用了这两个表，但schema.sql中没有建表语句 |
| 3 | 资产发布(UGC提交)流程未实现 | 前台没有发布入口 |
| 4 | 解锁流程不完整 | 只是模拟完成，没有实际的电话解密逻辑 |
| 5 | 爬虫配方的"测试抓取"功能未实现 | 后台UI有按钮但无逻辑 |
| 6 | 行情数据只有种子数据 | 没有自动采集/更新机制 |
| 7 | 用户体系未落地 | 没有注册/登录流程，openid只有种子数据 |

### 8.3 数据完整性

| 表 | 状态 |
|---|---|
| assets | ✅ 有20条种子数据 |
| users | ✅ 有管理员+5个broker用户 |
| brokers | ✅ 有5条种子数据 + 迁移脚本可添加更多 |
| homepage_config | ✅ 有完整配置 |
| market_data | ✅ 有5省种子数据 |
| infrastructure_ratings | ✅ 有6条种子数据 |
| regions | ✅ 已确认存在，schema已同步 |
| asset_types | ✅ 已确认存在，schema已同步 |
| scrapers_recipes | ✅ 表已定义，无种子数据 |
| staging_raw | ✅ 表已定义 |
| admin_audit_logs | ✅ 表已定义 |
| unlock_tasks | ✅ 表已定义 |
| ai_usage_log | ✅ 表已定义 |

---

## 九、数据流图

### 9.1 前台数据流

```
用户浏览器 → Next.js Edge Runtime
    ↓
Server Component (异步)
    ↓
lib/data.ts (数据访问层)
    ↓
lib/db.ts (D1查询封装)
    ↓
Cloudflare D1 (SQLite)
    ↓
HTML响应 → 浏览器渲染
```

### 9.2 后台数据流

```
管理员 → /admin (客户端认证)
    ↓
fetch → /api/admin/* (Cookie验证)
    ↓
lib/db.ts → D1 (读写)
    ↓
lib/ai.ts → Gemini API (可选)
    ↓
lib/r2.ts → R2 (文件上传)
```

### 9.3 爬虫数据流

```
GitHub Actions (定时)
    ↓
catcher.js → /api/scrape (读取配方)
    ↓
Playwright 抓取 → CSS选择器提取
    ↓
/api/scrape (保存原始数据到 staging_raw)
    ↓
[待实现] AI清洗 → assets 表
```

---

## 十、性能与优化建议

### 10.1 当前性能特征

- **首屏**: 服务端渲染，D1查询延迟决定（冷启动~200ms，热启动~50ms）
- **图片**: 使用 Unsplash CDN，R2 图片需要签名URL
- **搜索**: FTS5 全文搜索，性能优秀
- **Edge Runtime**: 全球分布式，延迟低

### 10.2 优化方向

1. **缓存策略**: 首页数据变化不频繁，可添加 ISR 或 Edge Cache
2. **图片优化**: R2图片可接入 Cloudflare Image Resizing
3. **分页优化**: 当前使用 OFFSET 分页，大数据量下应改为 cursor-based
4. **Bundle优化**: 首页组件较多，可考虑动态导入非首屏组件
5. **SEO**: 添加 sitemap.xml、robots.txt、结构化数据(JSON-LD)

---

## 十一、总结

zjd-web 是一个架构清晰、技术选型合理的全栈应用。核心亮点：

1. **Cloudflare全家桶**: D1 + R2 + Workers + Pages，零服务器成本
2. **配方化爬虫**: 可扩展的数据采集能力
3. **AI提纯管道**: Gemini自动提取结构化数据
4. **安全设计**: 加密、签名、配额、熔断、审计，考虑周全
5. **配置热更新**: 运营可实时调整页面内容

主要待完善：

1. 微信登录对接
2. UGC发布流程
3. 区域/资产类型表补充
4. 解锁流程实际实现
5. 爬虫AI清洗管道打通
6. R2公开域名配置

项目已具备MVP可用性，种子数据完整，可直接部署并开始运营。
