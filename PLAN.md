# zjd-web 后台系统开发规划

> 版本：v1.0 | 日期：2026-06-29

---

## 一、前台栏目与数据源分析

### 1.1 首页（/）— 8个数据板块

| 板块 | 数据源 | 说明 |
|------|--------|------|
| 🔥 Hero 横幅 | `homepage_config` | 大标题、副标题、总收录数、今日上新（可手动覆盖） |
| 🔥 核心地点寻源区 | `getHotAssets(6)` | 按 views 降序，展示热门资产 |
| 📊 行情数据概览 | `getMarketData()` | 展示前2省均价 + 买卖比 + 溢价空间 |
| 📊 行情数据表格 | `getMarketData()` | 全部省份的中位数、涨跌、砍价空间 |
| ⚖️ 官方原矿区 | `getAssetsBySource('official', 6)` | source_type='official' 的资产 |
| 🏛️ 村集体直发专区 | `getAssetsBySource('village', 2)` | source_type='village' 的资产 |
| 🎪 文旅大宗产业路演带 | `getFeaturedAssets(2)` | featured=1 的资产 |
| 📡 数字化隐居基建硬指标 | `getInfraRatings()` | 全部基建评分 |
| 🤝 本地金牌合伙人联播网 | `getBrokers(3)` | 按评级排序的前3个合伙人 |

**关键发现**：
- 首页所有板块的 **标题/副标题/显示数量** 都存储在 `homepage_config` 表，后台可配置
- "大宗路演"实际调用的是 `getFeaturedAssets`（推荐资产），而非独立的大宗项目表
- 数据来源 = `assets` 表（按 source_type/featured 区分）+ `market_data` + `infrastructure_ratings` + `brokers`

### 1.2 二级页面数据源

| 页面 | 数据源 | 数据关系 |
|------|--------|----------|
| 热点寻源 `/regions` | `getHotAssets(20)` 或 `getAssets({limit:50})` + 排序 | 点击量排序 / 起价排序 |
| 资产搜索 `/search` | `/api/assets` (client-side) | 支持 source/province/search 筛选 |
| 流转大盘 `/market-index` | `getMarketData()` | 全部省份行情 |
| 省级详情 `/market-index/[province]` | `getMarketDataByProvince` + `getAssetsByProvince` | 行情数据 + 该省资产列表 |
| 资产详情 `/asset/[id]` | `getAssetById` + `getAssets`(相似推荐) | 基建信息目前硬编码，应从 `infrastructure_ratings` 取 |
| 合伙人名录 `/brokers` | `/api/brokers` (client-side) | 省份/城市/评级/搜索/排序/分页 |
| 合伙人详情 `/brokers/[id]` | `getBrokerById` + `getBrokers` + `getAssets` | 通过 user_id 或 contact_name 匹配管辖资产 |
| 基建指标 `/infra-rating` | `getInfraRatings()` | 全部基建评分 |
| 基建详情 `/infra-rating/[id]` | `getInfraRatingById` + `getInfraRatings` + `getAssets` | 通过关键词模糊匹配区域资产 |
| 大宗路演 `/bulk-projects` | `getAssetsBySource('official', 10)` | 实际是官方原矿，非独立大宗表 |

### 1.3 前台数据流总结

```
所有前台页面 → lib/data.ts (数据访问层) → lib/db.ts (D1查询) → Cloudflare D1

核心数据表：
├── assets          → 资产（按 source_type: official/village/ugc 区分）
├── market_data     → 行情数据（按省份）
├── infrastructure_ratings → 基建评分（按区域）
├── brokers         → 合伙人（按评级/带看量排序）
├── homepage_config → 首页配置（键值对）
└── regions         → 行政区划（省/市/区县级联）
```

---

## 二、角色权限矩阵与后台规划

### 2.1 现有用户角色（D1 users.role）

| 角色 | 代码 | 当前状态 | 定位 |
|------|------|----------|------|
| 超级管理员 | `superadmin` | ✅ 种子数据有 | 平台最高权限 |
| 管理员 | `admin` | ❌ 无实例 | 平台运营 |
| 买家 | `buyer` | ❌ 无实例 | 浏览/搜索/解锁联系方式 |
| 合伙人 | `broker` | ✅ 种子数据有 | 发布资产/管理线索 |
| 村集体 | `village` | ❌ 无实例 | 村委直发资产 |

### 2.2 权限矩阵

| 功能 | superadmin | admin | village | broker | buyer |
|------|:----------:|:-----:|:-------:|:------:|:-----:|
| **资产管理** |
| 查看所有资产 | ✅ | ✅ | 仅自己 | 仅自己 | ❌ |
| 发布资产 | ✅ | ✅ | ✅ (village类型) | ✅ (ugc类型) | ❌ |
| 编辑资产 | ✅ | ✅ | 仅自己 | 仅自己 | ❌ |
| 删除资产 | ✅ | ✅ | 仅自己 | ❌ | ❌ |
| 审核资产 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 橱窗推荐 | ✅ | ✅ | ❌ | ❌ | ❌ |
| **合伙人管理** |
| 查看合伙人 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 新增/编辑/删除 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 评级调整 | ✅ | ✅ | ❌ | ❌ | ❌ |
| **线索管理** |
| 查看自己的线索 | ✅ | ✅ | ✅ | ✅ | ❌ |
| 查看所有线索 | ✅ | ✅ | ❌ | ❌ | ❌ |
| **数据配置** |
| 首页配置 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 行情数据 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 基建评分 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 行政区划 | ✅ | ✅ | ❌ | ❌ | ❌ |
| **爬虫管理** |
| 配方管理 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 执行爬虫 | ✅ | ✅ | ❌ | ❌ | ❌ |
| **系统管理** |
| 用户管理 | ✅ | ❌ | ❌ | ❌ | ❌ |
| 审计日志 | ✅ | ✅ | ❌ | ❌ | ❌ |
| AI用量 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 全局配置 | ✅ | ❌ | ❌ | ❌ | ❌ |

### 2.3 后台架构规划

```
/admin (管理员后台 - 已有)
├── /admin                    → 运营控制台（首页配置、公司信息）
├── /admin/assets             → 资产审核（筛选、批准、拒绝、推荐）
├── /admin/brokers            → 合伙人管理（CRUD、评级）
├── /admin/scrapers           → 爬虫管理（配方列表、新增）
├── /admin/market-data        → 行情数据管理 [待建]
├── /admin/infra-ratings      → 基建评分管理 [待建]
├── /admin/regions            → 行政区划管理 [待建]
├── /admin/users              → 用户管理 [待建]
├── /admin/audit-logs         → 审计日志 [待建]
└── /admin/ai-usage           → AI用量监控 [待建]

/dashboard (角色通用后台 - 待建)
├── /dashboard                → 角色首页（根据角色显示不同内容）
├── /dashboard/assets         → 我发布的资产
├── /dashboard/assets/new     → 发布新资产
├── /dashboard/leads          → 我的线索（broker/village）
├── /dashboard/profile        → 个人资料
└── /dashboard/settings       → 设置
```

### 2.4 技术实现要点

1. **路由隔离**：`/admin` 仅限 admin/superadmin，`/dashboard` 按角色鉴权
2. **API 层鉴权**：每个 API 路由需检查 `users.role` + `users.id`，确保只能操作自己的数据
3. **前端菜单**：根据角色动态渲染侧边栏菜单项
4. **复用组件**：AssetCard、FilterPanel、表格组件等可共用，权限逻辑在 API 层处理

---

## 三、后台 + D1 + R2 开发规划

### 3.1 D1 数据库待完善

| 优先级 | 任务 | 说明 |
|--------|------|------|
| P0 | users 表数据初始化 | 当前只有种子用户，需要注册流程 |
| P0 | assets 表补充真实数据 | 种子数据 20 条，需要爬虫/UGC 补充 |
| P1 | regions 补充更多城市 | 当前只有 10 省 14 市，需覆盖全国 |
| P1 | asset_types 补充数据 | 当前 9 种类型，可能需要更多 |
| P1 | market_data 补充更多省份 | 当前只有 5 省 |
| P1 | infrastructure_ratings 补充更多区域 | 当前只有 6 条 |
| P2 | 新增 user_favorites 表 | 用户收藏资产 |
| P2 | 新增 user_messages 表 | 站内消息/通知 |
| P2 | 新增 asset_views_log 表 | 详细浏览日志（用于分析） |
| P2 | 新增 payment_records 表 | 付费记录（如需变现） |

### 3.2 R2 存储待完善

| 优先级 | 任务 | 说明 |
|--------|------|------|
| P0 | 配置 R2 公开域名 | 当前用占位符 `pub-placeholder.r2.dev`，需替换为真实域名 |
| P0 | 图片上传流程打通 | `/api/admin/upload` 已有，但前台 UGC 上传未实现 |
| P1 | 图片压缩/缩略图 | 接入 Cloudflare Image Resizing，生成多尺寸 |
| P1 | 视频存储 | assets.video_url 字段已有，需实现视频上传/播放 |
| P2 | 文档存储 | 产权证、营业执照等 PDF 存储 |

### 3.3 后台功能模块规划

#### 阶段一：核心运营（当前 → 2周）

| 模块 | 状态 | 说明 |
|------|------|------|
| 运营控制台 | ✅ 已有 | 首页配置、公司信息 |
| 资产审核 | ✅ 已有 | 筛选、批准、拒绝 |
| 合伙人管理 | ✅ 已有 | CRUD、评级 |
| 爬虫管理 | ✅ 已有 | 配方列表、新增 |
| 行情数据管理 | ❌ 待建 | CRUD 省份行情数据 |
| 基建评分管理 | ❌ 待建 | CRUD 区域基建评分 |
| 行政区划管理 | ❌ 待建 | CRUD 省/市/区县 |

#### 阶段二：用户体系（2-4周）

| 模块 | 说明 |
|------|------|
| 微信登录 | 对接微信开放平台 OAuth2 |
| 用户管理 | 管理员查看/禁用/角色分配 |
| 角色后台 | /dashboard 角色通用后台 |
| UGC发布 | 合伙人/村委前台发布资产 |
| 线索管理 | 合伙人查看自己的线索 |

#### 阶段三：数据分析（4-6周）

| 模块 | 说明 |
|------|------|
| 审计日志 | 查看所有管理操作记录 |
| AI 用量监控 | Gemini 消费统计、预算熔断 |
| 流量分析 | 浏览量趋势、热门资产排行 |
| 转化分析 | 解锁率、线索转化漏斗 |

#### 阶段四：商业化（6-8周）

| 模块 | 说明 |
|------|------|
| 付费解锁 | 买家付费查看完整联系方式 |
| 合伙人入驻费 | 年费/保证金 |
| 置顶推荐 | 资产付费置顶 |
| 数据报告 | 自动生成区域行情报告 |

---

## 四、采集功能完善规划

### 4.1 当前架构

```
┌─────────────────────────────────────────────────┐
│                GitHub Actions                    │
│  (scrape.yml - 每天凌晨3点触发)                    │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│              scrapers/catcher.js                 │
│  (Playwright 主干引擎 - 配方驱动)                   │
│                                                  │
│  1. 从 D1 读取 scrapers_recipes（启用的配方）        │
│  2. 遍历每个配方：                                   │
│     a. 用 CSS 选择器提取列表页数据                    │
│     b. 进详情页深度抓取（可选）                       │
│     c. 保存原始数据到 staging_raw                    │
│     d. 更新配方状态                                  │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│               Cloudflare D1                      │
│  scrapers_recipes  → 配方存储                      │
│  staging_raw       → 原始数据暂存                   │
└─────────────────────────────────────────────────┘
```

### 4.2 当前缺失环节

```
staging_raw (原始数据)
    ↓
    ❌ 【缺失】AI 清洗管道 (Gemini)
    ↓
assets (结构化数据, status=pending)
    ↓
    ❌ 【缺失】管理员审核通知
    ↓
assets (status=approved)
    ↓
    ✅ 前台展示
```

### 4.3 采集功能完善计划

#### 4.3.1 AI 清洗管道（P0）

```
staging_raw (status=raw)
    ↓ 触发条件：爬虫完成 / 手动触发
    ↓
AI 清洗引擎 (lib/ai.ts - AIClient)
    ↓ 读取 staging_raw.raw_data
    ↓ 使用 scrapers_recipes.ai_prompt 作为自定义提示词
    ↓ 调用 Gemini 2.0 Flash 提取结构化数据
    ↓
    ├── 成功 → INSERT INTO assets (status='pending', ai_extracted=JSON)
    │         → UPDATE staging_raw SET status='imported'
    ↓
    └── 失败 → UPDATE staging_raw SET status='error', error_msg=...
```

**需要开发**：
- `/api/admin/staging/route.ts` — 暂存数据管理 API
- AI 清洗 Worker（Durable Object 或 Queue Consumer）
- 清洗进度追踪（staging_raw 状态更新）
- 重复检测（GPS围栏 + 标题相似度）

#### 4.3.2 配方管理增强（P1）

| 功能 | 说明 |
|------|------|
| 配方编辑 | 修改已有配方的选择器、URL等 |
| 测试抓取 | 对单个配方执行试运行，返回前3条结果预览 |
| 运行日志 | 查看每次运行的详细日志（成功/失败/跳过） |
| 配方导入/导出 | JSON 格式的配方备份/分享 |
| 代理配置 | 支持配置代理池，避免被封 |
| 定时调度 | 支持自定义 cron 表达式（当前固定每天3点） |

#### 4.3.3 数据源扩展（P1-P2）

| 数据源 | 类型 | 优先级 | 说明 |
|--------|------|--------|------|
| 各省农村产权交易中心 | 官方 | P1 | 浙江、四川、云南等省级平台 |
| 全国土地市场网 | 官方 | P1 | 自然资源部 |
| 淘宝司法拍卖 | 官方 | P2 | 农村房产拍卖 |
| 58同城/安居客 | 民间 | P2 | 农村房源信息 |
| 各地村务公开网站 | 村委 | P2 | 村集体资产公示 |
| 微信公众号/小程序 | UGC | P3 | 社交媒体采集 |

#### 4.3.4 数据质量保障（P2）

| 机制 | 说明 |
|------|------|
| GPS 坐标校验 | 采集到的地址自动 geocoding，校验是否在合理范围 |
| 价格合理性检测 | 异常低价/高价自动标记待人工审核 |
| 图片真实性 | AI 检测是否为网图/盗图 |
| 重复数据合并 | 同一资产在不同来源出现时自动关联 |
| 数据时效性 | 超过 N 天未更新的资产自动下架 |

#### 4.3.5 采集监控仪表盘（P2）

```
/admin/scrapers (增强版)
├── 配方列表（带状态、上次运行时间、成功率）
├── 运行日志（时间线、每个配方的执行详情）
├── 暂存数据管理（staging_raw 的 raw/cleaned/imported/error 状态）
├── AI 清洗队列（pending 数量、处理速度、错误率）
└── 数据质量报告（今日新增、重复率、审核通过率）
```

---

## 五、开发优先级总览

```
P0 (立即需要)                 P1 (1-2周)                  P2 (3-4周)
├── R2 公开域名配置            ├── 用户注册/登录流程          ├── 用户收藏功能
├── AI 清洗管道打通            ├── 角色通用后台 /dashboard    ├── 站内消息系统
├── regions 补充全国数据        ├── 行情数据管理页面           ├── 流量分析仪表盘
├── 资产详情页基建信息动态化      ├── 基建评分管理页面           ├── 转化漏斗分析
└── 爬虫配方编辑/测试功能        ├── 行政区划管理页面           ├── 付费解锁功能
                                ├── UGC 前台发布入口           ├── 数据质量自动化检测
                                └── 线索管理页面               └── 采集监控仪表盘
```
