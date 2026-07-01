# zjd-web 代码库深度分析报告

> 分析时间：2026-06-30 | 版本：v8.8.1

---

## 一、项目概览

**项目名称**：zjd.cn — 乡村闲置资产数字交易所
**定位**：一个面向中国乡村闲置资产（宅基地、林地、茶园、古宅等）的数字化流转平台，连接资产持有方（村集体、政府）与需求方（投资者、创业者）。
**运营主体**：绵阳网安科技有限公司

### 技术栈
| 层级 | 技术选型 |
|------|---------|
| 前端框架 | Next.js 15 (App Router) + React 19 |
| UI | Tailwind CSS 3.4 |
| 边缘计算 | Cloudflare Workers (Edge Runtime) |
| 数据库 | Cloudflare D1 (SQLite) |
| 对象存储 | Cloudflare R2 (私有桶 + 签名URL) |
| AI引擎 | Gemini 2.0 Flash (数据清洗/提取) |
| 爬虫 | GitHub Actions + Playwright |
| 部署 | Cloudflare Pages |
| 包管理 | npm |

---

## 二、系统架构

```
┌─────────────────────────────────────────────────────────┐
│                    Cloudflare Pages                       │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              Next.js 15 (Edge Runtime)               │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │ │
│  │  │ SSR Pages │  │ API Routes│  │ Server Components│  │ │
│  │  └──────────┘  └──────────┘  └──────────────────┘  │ │
│  └─────────────────────────────────────────────────────┘ │
│                          │                                │
│  ┌───────────┐  ┌───────┴───────┐  ┌──────────────┐    │
│  │   D1 (DB)  │  │  R2 (Storage) │  │ Gemini API   │    │
│  │  SQLite    │  │  图片/文件     │  │ 数据清洗/AI  │    │
│  └───────────┘  └───────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────┘
                          │
         ┌────────────────┼────────────────┐
         ▼                ▼                ▼
┌─────────────┐  ┌──────────────┐  ┌──────────────┐
│ GitHub Actions│  │  用户浏览器   │  │ 管理员后台   │
│ 爬虫定时任务  │  │  (前端展示)   │  │  /admin      │
└─────────────┘  └──────────────┘  └──────────────┘
```

**核心特征**：
- **全Edge部署**：所有API路由和页面均使用 `export const runtime = 'edge'`，运行在 Cloudflare Workers 上
- **无服务器**：无需管理任何服务器实例，冷启动极快
- **SSR优先**：首页及详情页使用异步服务端组件直接查询D1，首屏速度极好

---

## 三、数据库结构分析 (24张表)

### 3.1 核心业务表

| 表名 | 用途 | 核心字段 |
|------|------|---------|
| `assets` | **资产主表** (最核心) | title, location, province/city/district, area_mu, price_year/price_total, lease_years, asset_type, source_type(official/village/ugc), status(pending/approved/rejected/banned), featured, views, user_id, images(JSON), contact_phone, gps_lat/lng, raw_html, ai_extracted |
| `users` | 用户表 | openid(微信), phone, role(buyer/broker/village/admin/superadmin), status, password_hash, role_apply, broker_region/specialties/bio |
| `brokers` | 合伙人表 | user_id, name, region, province, city, bio, specialties(JSON), rating(gold/silver/bronze), show_count, good_rate |
| `bulk_projects` | 大宗路演项目 | title, code, area_mu/sqm, price_start, yield_rate, certification, planning_use, images, contact |
| `leads` | 线索表(解锁记录) | asset_id, user_id, unlock_type, broker_id, status |

### 3.2 内容管理表

| 表名 | 用途 |
|------|------|
| `homepage_config` | 首页KV配置（标题/副标题/数量/公司信息等） |
| `regions` | 行政区划（Materialized Path: `CN/ZJ/HZ/`） |
| `asset_types` | 资产类型字典（宅基地/林地/茶园/古宅等9种） |
| `market_data` | 省级行情数据（中位价/涨跌/砍价空间/存量） |
| `infrastructure_ratings` | 基建评分（5G延迟/医院距离/电网冗余/综合评级） |

### 3.3 爬虫与数据处理表

| 表名 | 用途 |
|------|------|
| `scrapers_recipes` | 爬虫配方（base_url, CSS选择器, AI prompt, cron等） |
| `staging_raw` | 原始抓取数据暂存（raw → cleaned → imported 状态机） |
| `ai_usage_log` | AI用量追踪（tokens_in/out, cost, 用于预算熔断） |

### 3.4 权限与安全表

| 表名 | 用途 |
|------|------|
| `roles` | 角色定义（user/broker/village_org/data_editor/project_publisher/admin/superadmin） |
| `permissions` | 权限定义（47条细粒度权限，覆盖asset/bulk/infra/market/partner/user/lead/scraper/config/audit等模块） |
| `role_permissions` | 角色-权限映射 |
| `user_sessions` | 会话管理（UUID + 过期时间） |
| `login_attempts` | 登录锁定（5次失败 → 锁30分钟） |
| `login_logs` | 登录日志审计 |
| `rate_limits` | 频率限制（IP+操作维度） |
| `admin_audit_logs` | 管理员审计日志 |
| `audit_reviews` | 审核记录 |
| `alerts` | 告警记录 |

### 3.5 全文搜索

- 使用 **FTS5** 虚拟表 `assets_fts`，索引 title/description/location/province/city
- 通过触发器自动同步：INSERT/UPDATE/DELETE 时自动维护 FTS 索引

### 3.6 数据库设计评价

**优点**：
- 表结构清晰，字段设计合理
- Materialized Path 设计行政区划查询高效
- FTS5 全文搜索+触发器同步是最佳实践
- 细粒度 RBAC 权限系统（47条权限 × 7个角色）
- AI用量追踪+预算熔断机制

**可改进**：
- `images` 字段用 JSON 字符串存储，D1 的 JSON 函数支持有限
- `contact_phone` 加密方案不一致（有的用 AES-GCM，有的明文）
- 缺少 `user_favorites` 表的建表语句（但 dashboard API 中有引用）
- `audit_reviews` 和 `admin_audit_logs` 有功能重叠
- 没有外键约束在 D1 中默认不生效（需 PRAGMA foreign_keys = ON）

---

## 四、后端API架构

### 4.1 API路由总览（共30+个端点）

**公开API**：
| 路由 | 方法 | 功能 |
|------|------|------|
| `/api/assets` | GET | 资产列表（分页/筛选/FTS搜索） |
| `/api/asset-types` | GET | 资产类型字典 |
| `/api/brokers` | GET | 合伙人列表 |
| `/api/regions` | GET | 行政区划 |
| `/api/auth/login` | POST | 手机号+密码登录 |
| `/api/auth/register` | POST | 注册（支持角色申请） |
| `/api/auth/me` | GET | 当前用户信息 |
| `/api/auth/logout` | POST | 登出 |
| `/api/unlock` | POST/GET | 联系方式解锁任务 |
| `/api/scrape` | GET/POST | 爬虫配方管理 |

**用户后台API** (`/api/dashboard/*`)：
| 路由 | 功能 |
|------|------|
| `/api/dashboard/profile` | 个人信息读写 |
| `/api/dashboard/stats` | 用户维度统计数据 |

**管理后台API** (`/api/admin/*`)：
| 路由 | 功能 |
|------|------|
| `/api/admin/auth` | 管理员认证（密码→cookie） |
| `/api/admin/stats` | 全站统计 |
| `/api/admin/config` | 首页配置 CRUD |
| `/api/admin/assets` | 资产管理（审核/上下架/推荐） |
| `/api/admin/brokers` | 合伙人管理 |
| `/api/admin/users` | 用户管理（审核/封禁/角色变更） |
| `/api/admin/staging` | 暂存数据管理（AI清洗/导入） |
| `/api/admin/upload` | R2文件上传 |
| `/api/admin/bulk-projects` | 大宗项目管理 |
| `/api/admin/market-data` | 行情数据管理 |
| `/api/admin/infra-ratings` | 基建评分管理 |
| `/api/admin/regions` | 行政区划管理 |
| `/api/admin/asset-types` | 资产类型管理 |
| `/api/admin/scrapers` | 爱虫配方管理 |

### 4.2 认证体系

**双认证系统**：
1. **用户认证**：手机号+密码 → SHA-256 哈希 → Session UUID → Cookie (`user_session`)
   - 登录锁定：5次失败锁30分钟
   - 密码策略：≥8位，含大小写+数字
   - 会话有效期：7天
2. **管理员认证**：密码比对 → Cookie (`admin_token=authenticated`)
   - 密码从环境变量 `ADMIN_PASSWORD` 读取
   - 硬编码 fallback：`zjd2026admin`（⚠️ 安全风险）

**中间件保护**：
- `/admin/*` → 检查 `admin_token` cookie
- `/dashboard/*` → 检查 `user_session` cookie
- `/api/admin/*` → 检查 `admin_token` cookie
- `/api/dashboard/*` → 检查 `user_session` cookie

### 4.3 权限模型 (RBAC)

**7个角色的层级**：
```
superadmin (100) > admin (50) > project_publisher (25) > broker/village_org (20) > data_editor (15) > user (10)
```

**权限粒度示例**：
- `asset:create:official` — 只有admin/superadmin能发官方原矿
- `asset:create:village` — 村集体可发村委直发
- `asset:create:ugc` — 普通用户/合伙人都能发UGC
- `asset:audit` — 只有admin/superadmin能审核

---

## 五、前端页面架构

### 5.1 页面路由

| 路由 | 类型 | 功能 |
|------|------|------|
| `/` | SSR | 首页（7个板块：Hero/热点寻源/行情/官方原矿/村委直发/大宗路演/基建/合伙人/CTA） |
| `/regions` | CSR | 热点寻源页 |
| `/market-index` | CSR | 流转大盘（省级行情） |
| `/market-index/[province]` | CSR | 省份详情 |
| `/search` | CSR | 资产搜索引擎（FTS+多维筛选） |
| `/asset/[id] | SSR | 资产详情（三级尽调） |
| `/brokers` | CSR | 合伙人墙 |
| `/brokers/[id]` | CSR | 合伙人详情 |
| `/bulk-projects` | CSR | 大宗路演列表 |
| `/bulk-projects/[id]` | CSR | 大宗项目详情 |
| `/infra-rating` | CSR | 基建评分列表 |
| `/infra-rating/[id]` | CSR | 基建详情 |
| `/login` | CSR | 登录 |
| `/register` | CSR | 注册（2步：基本信息→角色选择） |
| `/pending-review` | CSR | 待审核提示 |
| `/dashboard` | CSR | 用户后台（按角色显示不同统计+快捷操作） |
| `/dashboard/profile` | CSR | 个人资料 |
| `/admin` | CSR | 管理后台（12个子页面） |

### 5.2 组件体系

**布局组件**：
- `Navbar` — 全局导航（毛玻璃效果，深绿+金色品牌色）
- `Footer` — 全局页脚（从D1配置动态读取公司信息）

**首页组件** (`components/test-home/`)：
- `HeroSection` — 主视觉横幅
- `RegionGrid` — 热点地区网格
- `MarketStats` — 行情统计
- `PropertyCard` — 资产卡片
- `VillageDirectCard` — 村委直发卡片
- `BulkProjectCard` — 大宗项目卡片
- `InfraRatingCard` — 基建评分卡片
- `BrokerCard` — 合伙人卡片
- `CTASection` — 号召行动区

**共享组件** (`components/shared/`)：
- `AssetCard` — 通用资产卡片
- `FilterPanel` — 通用筛选面板
- `SearchBar` — 搜索框
- `RegionSelector` — 省市区三级联动选择器
- `WeChatModal` — 微信授权弹窗

### 5.3 设计风格

- **品牌色**：深绿 `#2C4C3B` + 金色 `#D4AF37`
- **背景色**：浅灰白 `#F9F9F8`
- **页脚背景**：浅绿灰 `#edf4f0`
- **整体风格**：政务/商务风，信息密度高，卡片化布局

---

## 六、爬虫系统

### 6.1 架构

```
GitHub Actions (每日03:00 UTC)
    │
    ▼
catcher.js (Playwright)
    │
    ├── 1. 从 CF API 获取配方列表
    ├── 2. 遍历每个配方：
    │   ├── 打开列表页 → CSS选择器提取
    │   ├── 进详情页 → 提取更多字段
    │   └── 保存原始数据到 staging_raw
    └── 3. 更新配方运行状态
```

### 6.2 配方化设计

爬虫完全**配方驱动**，存储在 `scrapers_recipes` 表：
- `selectors`：列表页 CSS 选择器（容器 + 字段映射）
- `detail_selectors`：详情页 CSS 选择器
- `ai_prompt`：自定义 AI 提取提示词
- `pagination_type`：翻页方式（URL模板 `{page}`）
- `max_pages`：最大翻页数（安全上限20）

### 6.3 数据处理流水线

```
raw → (AI清洗) → cleaned → (人工审核) → imported → assets表
                                  ↘ error (可重试)
```

AI清洗使用 Gemini 2.0 Flash，提取：title, location, area_mu, price_year, asset_type, description, contact_name, contact_phone

---

## 七、安全机制

### 7.1 已实现的安全措施

| 机制 | 实现 |
|------|------|
| 密码哈希 | SHA-256 (crypto.subtle) |
| 登录锁定 | 5次失败锁30分钟 |
| 频率限制 | 6种操作维度（login/register/create/update/general） |
| CSRF保护 | SameSite=Strict cookies |
| 电话加密 | AES-GCM (Web Crypto API) |
| R2防盗链 | HMAC-SHA256 签名URL |
| 输入校验 | 手机号正则、密码复杂度、文件类型/大小限制 |
| 审计日志 | 管理员操作全记录 |
| Referer校验 | 严格匹配域名 |

### 7.2 安全风险点

| 风险 | 级别 | 说明 |
|------|------|------|
| 管理员密码硬编码fallback | 🔴 高 | `admin/auth/route.ts` 中 `env.ADMIN_PASSWORD \|\| 'zjd2026admin'` |
| 管理员认证仅靠cookie值 | 🟡 中 | `admin_token=authenticated` 是固定值，无法防重放 |
| 无RBAC中间件 | 🟡 中 | admin API 路由仅检查cookie是否存在，不校验角色 |
| contact_phone加密不一致 | 🟡 中 | 部分数据明文存储，AES-GCM加密功能已实现但未全面使用 |
| unlock API无鉴权 | 🟡 中 | `/api/unlock` 端点不需要登录即可调用 |
| D1无外键强制 | 🟢 低 | D1默认不执行外键约束 |

---

## 八、部署与CI/CD

### 8.1 部署流程

```yaml
# deploy.yml — push to main 自动触发
npm install → npx @cloudflare/next-on-pages → wrangler pages deploy
```

### 8.2 爬虫定时任务

```yaml
# scrape.yml — 每日 03:00 UTC (北京时间11:00)
npm install → npx playwright install → node scrapers/catcher.js
```

### 8.3 环境变量

| 变量 | 存储方式 | 用途 |
|------|---------|------|
| `GEMINI_API_KEY` | CF Dashboard Secret | Gemini AI |
| `ADMIN_PASSWORD` | CF Dashboard Secret | 管理后台 |
| `SIGNING_SECRET` | CF Dashboard Secret | R2签名URL |
| `CLOUDFLARE_API_TOKEN` | GitHub Actions Secret | 部署 |
| `CLOUDFLARE_ACCOUNT_ID` | GitHub Actions Secret | 部署 |
| `CF_API_URL` | GitHub Actions Secret | 爬虫API地址 |
| `CF_API_TOKEN` | GitHub Actions Secret | 爬虫认证 |

---

## 九、数据流与业务流程

### 9.1 资产生命周期

```
创建(pending) → 审核(approved/rejected) → 上架展示 → 用户浏览 → 解锁联系方式 → 线索生成
     ↑                    ↓
  爬虫采集          橱窗推荐(featured)
  (raw→cleaned→imported)
```

### 9.2 用户角色流程

```
注册 → 普通用户(active) → 申请合伙人/村集体 → 管理员审核 → 角色升级
                                                         → 审核拒绝 → 封禁
```

### 9.3 解锁流程

```
用户点击"解锁" → 创建unlock_task(pending) → 异步处理 → 返回解密后的联系方式
                                                              (当前是同步完成)
```

---

## 十、技术亮点

1. **全Edge架构**：利用 Cloudflare Workers + D1 + R2 实现零服务器部署，全球边缘节点加速
2. **FTS5全文搜索**：SQLite FTS5 + 触发器自动同步，无需外部搜索引擎
3. **配方化爬虫**：CSS选择器 + AI提示词存储在数据库，新增采集站零代码
4. **AI预算熔断**：D1持久化用量追踪，Workers冷启动不丢失状态
5. **Materialized Path行政区划**：`CN/ZJ/HZ/` 路径设计，前缀查询极快
6. **细粒度RBAC**：47条权限 × 7个角色，覆盖所有业务模块
7. **首页配置KV化**：所有文案/数量存储在D1，后台可热更新

---

## 十一、待改进项

### 11.1 功能缺失
- [ ] 用户收藏功能（`user_favorites` 表未建但API已引用）
- [ ] 联系方式解锁的完整流程（当前同步完成，应改为异步+微信通知）
- [ ] 微信登录集成（OpenID字段已有，但未实现OAuth流程）
- [ ] 用户发布资产的完整前端页面（dashboard中有入口但无实现页面）
- [ ] 用户查看线索页面
- [ ] 大宗路演项目详情页（当前跳转到 `/asset/[id]`，应为 `/bulk-projects/[id]`）

### 11.2 安全加固
- [ ] 管理员认证升级（当前仅密码+固定cookie值）
- [ ] 移除硬编码密码fallback
- [ ] 全面启用电话号码AES-GCM加密
- [ ] unlock API 添加认证
- [ ] admin API 添加角色校验

### 11.3 性能优化
- [ ] 图片懒加载 + WebP格式
- [ ] API响应缓存（Cloudflare Cache API）
- [ ] D1查询优化（部分全表扫描可加索引）
- [ ] 首页8个并行查询可考虑合并

### 11.4 运营工具
- [ ] 数据看板（GMV、活跃度、转化率等）
- [ ] 爬虫执行监控面板
- [ ] AI用量可视化
- [ ] 批量导入/导出功能

---

## 十二、文件清单

```
zjd-web/
├── app/                         # Next.js App Router (30个页面/API路由)
│   ├── page.tsx                 # 首页 (SSR, 7个板块)
│   ├── layout.tsx               # 全局布局 (Navbar + Footer)
│   ├── asset/[id]/page.tsx      # 资产详情 (SSR)
│   ├── search/page.tsx          # 搜索引擎 (CSR)
│   ├── login/page.tsx           # 登录
│   ├── register/page.tsx        # 注册 (2步)
│   ├── dashboard/               # 用户后台 (3页)
│   ├── admin/                   # 管理后台 (12页)
│   └── api/                     # API路由 (30+端点)
├── components/                  # UI组件 (14个)
│   ├── layout/                  # Navbar, Footer
│   ├── shared/                  # AssetCard, FilterPanel, SearchBar等
│   └── test-home/               # 首页板块组件
├── lib/                         # 核心库
│   ├── db.ts                    # D1连接+查询封装
│   ├── auth.ts                  # 认证+权限+Session
│   ├── ai.ts                    # Gemini AI客户端
│   ├── data.ts                  # 数据访问层 (30+查询方法)
│   ├── r2.ts                    # R2存储操作
│   ├── utils.ts                 # 加密/解密/距离计算/配额
│   ├── rate-limit.ts            # 频率限制
│   ├── audit.ts                 # 审计日志
│   └── test-home-data.ts        # Mock数据 (开发用)
├── sql/
│   ├── schema.sql               # 建表语句 (24表+索引+触发器)
│   └── seed.sql                 # 种子数据 (20条资产+5个合伙人+行情+基建)
├── scrapers/
│   └── catcher.js               # 爬虫主干引擎 (Playwright)
├── .github/workflows/
│   ├── deploy.yml               # 部署 (push to main)
│   └── scrape.yml               # 爬虫 (每日03:00 UTC)
├── middleware.ts                 # Next.js中间件 (路由保护)
├── wrangler.toml                # Cloudflare配置
├── next.config.mjs              # Next.js配置
├── tailwind.config.ts           # Tailwind配置
└── package.json                 # 依赖 (next/react/tailwind等)
```

---

*此报告基于仓库最新代码自动生成，覆盖所有源文件的完整分析。*
