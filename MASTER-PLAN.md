# zjd-web 全栈开发规划 v2.0

> 基于真实前台栏目逆向推导后台需求 | 2026-06-29

---

## 一、真实前台栏目解析与后台映射

### 1.1 前台 8 大栏目数据溯源

通过逐页分析源码，确认每个栏目的精确数据来源、展示逻辑和后台管控需求：

#### 栏目 1：首页数据概览 & 省级流速

| 维度 | 详情 |
|------|------|
| **前台路径** | `/` 首页 + `/market-index` 流转大盘 + `/market-index/[province]` 省级详情 |
| **展示内容** | 全网收录宗数、今日上新、各省流转均价、环比涨跌、砍价空间、买卖比、散户溢价空间 |
| **数据来源** | `homepage_config`（总收录数/今日上新，可手动覆盖）+ `market_data` 表（各省行情）+ `assets` 表 COUNT 聚合 |
| **展示逻辑** | 首页显示前 2 省均价概览 + 4 统计卡片；流转大盘页显示全部省份表格；省级详情页显示该省价格区间分布图 + 资产列表 |
| **后台管控** | ① `market_data` CRUD（各省均价/涨跌/挂牌数/砍价空间）② `homepage_config` 覆盖值（总收录数/今日上新可手动微调）③ 聚合统计自动计算（总资产 COUNT、今日新增 COUNT） |

#### 栏目 2：核心地点寻源区

| 维度 | 详情 |
|------|------|
| **前台路径** | `/regions` 热点寻源大厅 |
| **展示内容** | 按热度（浏览量）降序排列的资产卡片，显示排名、标题、区域、浏览量、价格。支持切换"按起价"排序 |
| **数据来源** | `getHotAssets(20)` — `SELECT * FROM assets WHERE status='approved' ORDER BY views DESC LIMIT 20` |
| **展示逻辑** | 渐变色卡片 + 排名徽章（🥇🥈🥉）+ 浏览量 + 价格。点击跳转资产详情 |
| **后台管控** | ① `assets.views` 可手动调整（运营刷热度）② `assets.featured` 橱窗推荐标记 ③ 排序算法可配置（views 权重 vs price 权重，当前硬编码） |

#### 栏目 3：纯净一手官方原矿区

| 维度 | 详情 |
|------|------|
| **前台路径** | `/` 首页"官方原矿"板块 + `/search?source=official` 搜索页 + `/asset/[id]` 详情页 |
| **展示内容** | 完整资产信息：标题、位置、面积(亩)、年租金(万)、流转年限、资产类型、图片、描述、基建配套、环境指标、联系方式（加密） |
| **数据来源** | `assets` 表 `WHERE source_type='official' AND status='approved'` |
| **展示逻辑** | 首页 6 张卡片；搜索页支持省份/关键词筛选；详情页左侧图片+指标，右侧联系方式（需解锁） |
| **后台管控** | ① `assets` 全字段 CRUD ② `source_type` 分类管理 ③ `status` 审核流转 ④ `featured` 橱窗推荐 ⑤ 图片上传到 R2 ⑥ 联系电话 AES-GCM 加密存储 |

#### 栏目 4：村集体直发专区

| 维度 | 详情 |
|------|------|
| **前台路径** | `/` 首页"村委直发"板块 + `/search?source=village` |
| **展示内容** | 强调"村委官方直招"，显示发包方（如"余村村委会"）、描述含"已完成林地及基本农田交叉排查"等合规信息 |
| **数据来源** | `assets` 表 `WHERE source_type='village' AND status='approved'` |
| **展示逻辑** | 左图右文大卡片，突出村委联系人和价格 |
| **后台管控** | ① 与栏目 3 共用 `assets` 表 ② 需要额外字段：`org_authorization_url`（村委授权书 URL，存 R2）③ 审核时需人工验证村委资质 |

#### 栏目 5：文旅大宗产业路演带

| 维度 | 详情 |
|------|------|
| **前台路径** | `/` 首页"大宗路演"板块 + `/bulk-projects` |
| **展示内容** | 大型项目卡片，含项目编号(ZJD-001)、占地面积、年收益率、30年确权书状态、起始价格 |
| **数据来源** | `assets` 表 `WHERE featured=1 AND status='approved'`（当前逻辑）|
| **展示逻辑** | 项目编号 + 标题 + 描述 + 面积/收益率/确权三指标 + 价格 |
| **后台管控** | ① 当前复用 `assets` 表 + `featured` 标记 ② **需评估**：是否需要独立的 `bulk_projects` 表？大宗项目有额外字段（投资回报率、商业规划书、确权状态）③ 如不独立建表，需在 `assets` 中扩展字段或用 `ai_extracted` JSON 存储 |

#### 栏目 6：数字化隐居基建硬指标

| 维度 | 详情 |
|------|------|
| **前台路径** | `/infra-rating` 排行榜 + `/infra-rating/[id]` 区域详情 |
| **展示内容** | 按区域展示 5G 延迟(ms)、三甲医院车程(分钟)、电网冗余度(%)、综合评级(S+/S/A+...)。详情页含指标可视化 + 匹配资产列表 + 相邻区域对比表 |
| **数据来源** | `infrastructure_ratings` 表（独立数据字典）|
| **展示逻辑** | 排行表 + 颜色标记（绿/黄/红）+ 排名徽章；详情页通过关键词模糊匹配 `assets` 表中的区域资产 |
| **后台管控** | ① `infrastructure_ratings` CRUD ② 关联 `assets` 的匹配逻辑（当前是关键词模糊匹配，应改为精确关联）③ 需要 Excel 批量导入功能（运营人员线下采集后批量上传）|

#### 栏目 7：本地金牌农房合伙人

| 维度 | 详情 |
|------|------|
| **前台路径** | `/brokers` 名录墙 + `/brokers/[id]` 个人主页 |
| **展示内容** | 合伙人信息：姓名、区域、评级(金银铜)、带看量、好评率、擅长领域、简介、头像。个人主页含管辖资产列表 + 擅长领域标签 |
| **数据来源** | `brokers` 表 + 通过 `user_id` 或 `contact_name` 关联 `assets` 表 |
| **展示逻辑** | 名录墙支持省份/城市/评级/搜索筛选 + 排序（带看量/好评率/评级）+ 分页 |
| **后台管控** | ① `brokers` CRUD（已有）② 评级调整 ③ 实名认证审核 ④ 关联 `users` 表的角色分配 |

#### 栏目 8：官方原始经办权解锁终端

| 维度 | 详情 |
|------|------|
| **前台路径** | `/asset/[id]` 详情页右侧"微信一键安全授权解锁真实电话"按钮 |
| **展示内容** | 联系方式被遮罩（136****8899），用户需"解锁"才能看到完整号码 |
| **数据来源** | `assets.contact_phone`（AES-GCM 加密）+ `unlock_tasks` 表（解锁记录）+ `leads` 表（线索） |
| **展示逻辑** | 加密显示 → 点击解锁 → 创建 unlock_task → 返回解密后的电话 |
| **后台管控** | ① 解锁记录审计（谁、何时、解锁了哪个资产）② 线索分配（将解锁记录关联到合伙人）③ 加密密钥管理（SIGNING_SECRET）④ 解锁配额控制 |

---

### 1.2 前台栏目与后台模块映射总表

| 前台栏目 | 后台管理模块 | D1 核心表 | R2 存储 | 管控要点 |
|----------|------------|-----------|---------|---------|
| ① 首页数据概览 & 省级流速 | 行情数据管理 | `market_data`, `homepage_config` | — | 各省均价/涨跌/挂牌数 CRUD，首页配置覆盖值 |
| ② 核心地点寻源区 | 资产管理（热度相关） | `assets` | — | views 调整、featured 推荐、排序算法配置 |
| ③ 官方原矿区 | 资产管理（核心 CRUD） | `assets` | `/public/assets/images/` | 全字段 CRUD、图片上传、电话加密、审核流转 |
| ④ 村集体直发专区 | 资产管理 + 资质审核 | `assets` | `/private/certificates/` | 村委授权书上传/验证、source_type=village |
| ⑤ 文旅大宗路演带 | 资产管理 或 大宗项目管理 | `assets`(featured) 或 `bulk_projects` | `/private/contracts/` | 扩展字段（收益率/确权书）、规划书附件 |
| ⑥ 基建硬指标 | 基建评分管理 | `infrastructure_ratings` | — | CRUD + Excel 导入 + 区域关联 assets |
| ⑦ 金牌合伙人 | 合伙人管理 | `brokers`, `users` | `/public/partners/avatars/` | CRUD + 评级 + 实名认证 + 线索关联 |
| ⑧ 解锁终端 | 线索管理 + 解锁审计 | `unlock_tasks`, `leads` | `/private/contracts/` | 解锁记录、线索分配、配额控制、密钥管理 |

---

## 二、多角色后台复用与权限矩阵（RBAC）

### 2.1 角色定义与核心诉求

| 角色 | 代码 | 核心诉求 | 当前状态 |
|------|------|----------|----------|
| 超级管理员 | `superadmin` | 掌控全局、配置系统、用户管理、财务结算 | ✅ 有种子用户 |
| 平台运营 | `admin` | 资产审核、内容维护、数据纠错、爬虫管理 | ❌ 无实例，需创建 |
| 农房合伙人 | `broker` | 管理自己发布的房源、查看客户线索、业绩统计 | ✅ 有种子用户，缺后台入口 |
| 村集体 | `village` | 发布村委直发资产、查看线索 | ❌ 无实例，需创建 |
| 普通用户 | `buyer` | 浏览、收藏、解锁联系方式、发布自家闲置 | ❌ 无实例，需创建 |

### 2.2 完整权限矩阵

#### A. 内容管理权限

| 功能 | superadmin | admin | village | broker | buyer |
|------|:----------:|:-----:|:-------:|:------:|:-----:|
| 查看所有资产 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 查看自己发布的资产 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 新增资产（official） | ✅ | ✅ | ❌ | ❌ | ❌ |
| 新增资产（village） | ✅ | ✅ | ✅ | ❌ | ❌ |
| 新增资产（ugc） | ✅ | ✅ | ❌ | ✅ | ✅ |
| 编辑任何资产 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 编辑自己发布的资产 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 删除任何资产 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 删除自己发布的资产 | ✅ | ✅ | ✅ | ❌ | ❌ |
| 审核资产（批准/拒绝） | ✅ | ✅ | ❌ | ❌ | ❌ |
| 橱窗推荐 featured | ✅ | ✅ | ❌ | ❌ | ❌ |

#### B. 数据字典权限

| 功能 | superadmin | admin | village | broker | buyer |
|------|:----------:|:-----:|:-------:|:------:|:-----:|
| 行情数据 CRUD | ✅ | ✅ | ❌ | ❌ | ❌ |
| 基建评分 CRUD | ✅ | ✅ | ❌ | ❌ | ❌ |
| 行政区划 CRUD | ✅ | ✅ | ❌ | ❌ | ❌ |
| 资产类型 CRUD | ✅ | ✅ | ❌ | ❌ | ❌ |
| 首页配置修改 | ✅ | ✅ | ❌ | ❌ | ❌ |

#### C. 合伙人管理权限

| 功能 | superadmin | admin | village | broker | buyer |
|------|:----------:|:-----:|:-------:|:------:|:-----:|
| 查看所有合伙人 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 新增/编辑/删除合伙人 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 评级调整 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 查看自己的线索 | ✅ | ✅ | ✅ | ✅ | ❌ |
| 查看所有线索 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 分配线索给合伙人 | ✅ | ✅ | ❌ | ❌ | ❌ |

#### D. 采集与系统权限

| 功能 | superadmin | admin | village | broker | buyer |
|------|:----------:|:-----:|:-------:|:------:|:-----:|
| 爬虫配方管理 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 暂存数据管理 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 用户管理 | ✅ | ❌ | ❌ | ❌ | ❌ |
| 角色分配 | ✅ | ❌ | ❌ | ❌ | ❌ |
| 审计日志查看 | ✅ | ✅ | ❌ | ❌ | ❌ |
| AI 用量监控 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 全局配置 | ✅ | ❌ | ❌ | ❌ | ❌ |

#### E. 前台操作权限

| 功能 | superadmin | admin | village | broker | buyer |
|------|:----------:|:-----:|:-------:|:------:|:-----:|
| 收藏资产 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 解锁联系方式 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 发布 UGC 资产 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 微信登录 | ✅ | ✅ | ✅ | ✅ | ✅ |

### 2.3 技术实现方案

#### 权限数据模型

```
users 表：
  role → 角色代码（superadmin/admin/broker/village/buyer）

permissions 表（新增）：
  id, role, permission_key

permission_key 命名规范：
  模块:动作
  ├── asset:create, asset:read, asset:update, asset:delete, asset:audit
  ├── asset:read:own, asset:update:own, asset:delete:own
  ├── market_data:create, market_data:read, market_data:update, market_data:delete
  ├── broker:create, broker:read, broker:update, broker:delete
  ├── lead:read:own, lead:read:all, lead:assign
  ├── user:create, user:read, user:update, user:delete, user:assign-role
  ├── scraper:create, scraper:read, scraper:update, scraper:delete, scraper:execute
  ├── config:read, config:update
  └── audit:read
```

#### 前端权限控制

```tsx
// 权限按钮组件
<AuthButton permission="asset:audit">
  <button>审核通过</button>
</AuthButton>

// 侧边栏动态渲染
const menuItems = NAV_ITEMS.filter(item =>
  item.permissions.some(p => user.permissions.includes(p))
);

// 页面级权限守卫
if (!user.permissions.includes('market_data:read')) {
  redirect('/admin');
}
```

#### API 层鉴权

```typescript
// 中间件统一鉴权
function requirePermission(permission: string) {
  return async (request: Request) => {
    const user = await getUserFromCookie(request);
    if (!user || !user.permissions.includes(permission)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  };
}

// 使用
export async function GET(request: Request) {
  await requirePermission('market_data:read')(request);
  // ... 正常逻辑
}
```

### 2.4 两套后台入口

```
/admin    → 管理员后台（superadmin + admin）
  ├── 运营控制台
  ├── 资产管理
  ├── 行情数据
  ├── 基建评分
  ├── 行政区划
  ├── 资产类型
  ├── 合伙人管理
  ├── 爬虫管理
  ├── 暂存数据
  ├── 用户管理（仅 superadmin）
  ├── 审计日志
  ├── AI 用量监控
  └── 全局配置（仅 superadmin）

/dashboard → 角色通用后台（broker + village + buyer）
  ├── 我的资产（发布/编辑/查看状态）
  ├── 发布新资产（表单页）
  ├── 我的线索（broker/village 可见）
  ├── 我的收藏（buyer 可见）
  ├── 我的解锁记录
  └── 个人资料
```

---

## 三、后台 + D1 + R2 开发规划

### 3.1 D1 数据库表结构完善

#### 已有表（12 张）— 需补充字段

| 表 | 需补充字段 | 说明 |
|---|-----------|------|
| `assets` | `org_authorization_url TEXT` | 村委授权书 URL（R2 路径） |
| `assets` | `yield_rate REAL` | 年收益率（大宗路演用） |
| `assets` | `certification_status TEXT` | 确权状态（已确权/待确权/无争议） |
| `assets` | `commercial_plan_url TEXT` | 商业规划书 URL（R2 路径） |
| `assets` | `region_id INTEGER` | 关联 infrastructure_ratings.id（精确匹配基建数据） |
| `users` | `last_active_at TEXT` | 最后活跃时间（统计活跃用户） |
| `users` | `wechat_unionid TEXT` | 微信 UnionID（跨应用关联） |

#### 新增表（3 张）

**① permissions — 权限表**
```sql
CREATE TABLE IF NOT EXISTS permissions (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  role            TEXT NOT NULL,           -- 角色代码
  permission_key  TEXT NOT NULL,           -- 权限标识（如 asset:create）
  UNIQUE(role, permission_key)
);
```

**② user_favorites — 用户收藏表**
```sql
CREATE TABLE IF NOT EXISTS user_favorites (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL,
  asset_id   INTEGER NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (asset_id) REFERENCES assets(id),
  UNIQUE(user_id, asset_id)
);
CREATE INDEX idx_favorites_user ON user_favorites(user_id);
```

**③ asset_views_log — 浏览日志表（可选，用于深度分析）**
```sql
CREATE TABLE IF NOT EXISTS asset_views_log (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_id   INTEGER NOT NULL,
  user_id    INTEGER,                    -- 可为空（未登录用户）
  ip_address TEXT,
  user_agent TEXT,
  referer    TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (asset_id) REFERENCES assets(id)
);
CREATE INDEX idx_views_log_asset ON asset_views_log(asset_id);
CREATE INDEX idx_views_log_date ON asset_views_log(created_at);
```

### 3.2 R2 存储目录与安全规划

```
zjd-assets (R2 Bucket)
├── /public/                           ← 公开访问（CDN 加速）
│   ├── /assets/images/                ← 资产外观图、环境图
│   │   └── {timestamp}-{random}.{ext}
│   ├── /partners/avatars/             ← 合伙人头像
│   │   └── {broker_id}-{random}.{ext}
│   └── /org/logos/                    ← 机构 Logo
│       └── {org_id}-{random}.{ext}
│
├── /private/                          ← 私有访问（需签名 URL）
│   ├── /certificates/                 ← 村委授权书、确权书、营业执照
│   │   └── {asset_id}-{type}-{random}.{ext}
│   ├── /contracts/                    ← 原始经办合同
│   │   └── {asset_id}-{random}.{ext}
│   ├── /commercial-plans/             ← 商业规划书（大宗项目）
│   │   └── {asset_id}-{random}.{ext}
│   └── /identity/                     ← 合伙人实名证件
│       └── {user_id}-{type}-{random}.{ext}
│
└── /system/                           ← 系统文件
    ├── /scraper-screenshots/          ← 爬虫抓取截图
    │   └── {recipe_id}-{timestamp}.{ext}
    └── /temp/                         ← 临时文件（24h 自动清理）
        └── {random}.{ext}
```

#### 安全策略

| 目录 | 访问方式 | 安全措施 |
|------|---------|---------|
| `/public/*` | R2 公开域名直连 | Referer 白名单防盗链 |
| `/private/*` | Workers 签名 URL | HMAC-SHA256 签名 + 10分钟过期 + 仅限登录用户 |
| `/system/*` | 仅 Workers 内部访问 | 不对外暴露 |

#### 签名 URL 流程

```
用户请求查看私有文件
    ↓
API 检查：用户是否登录？是否有权限？
    ↓
是 → 生成签名 URL（HMAC + 过期时间）
    ↓
返回 302 重定向到签名 URL
    ↓
R2 验证签名 → 返回文件
    ↓
10分钟后 URL 过期，无法再次访问
```

### 3.3 后台前端页面规划

#### 页面布局规范

所有管理页面统一布局：

```
┌─────────────────────────────────────────────────────┐
│ [侧边栏]  │              [主内容区]                  │
│           │                                          │
│ 📊 控制台  │  ┌─────────────────────────────────────┐ │
│ 🏠 资产    │  │ 页面标题 + 操作按钮                   │ │
│ 💰 行情    │  ├─────────────────────────────────────┤ │
│ 📡 基建    │  │ 筛选栏（下拉/搜索/日期）              │ │
│ 🗺️ 区划    │  ├─────────────────────────────────────┤ │
│ 🏷️ 类型    │  │ 统计卡片（可选）                      │ │
│ 🤝 合伙人  │  ├─────────────────────────────────────┤ │
│ 🕷️ 爬虫    │  │ 数据表格 / 树形列表 / 卡片网格        │ │
│ 📥 暂存    │  │                                      │ │
│ 👥 用户    │  │                                      │ │
│ 📋 日志    │  │                                      │ │
│ 🤖 AI     │  │                                      │ │
│ ⚙️ 配置    │  └─────────────────────────────────────┘ │
│           │                                          │
└───────────┴──────────────────────────────────────────┘
```

#### 资产审核工作台设计（重点页面）

```
┌──────────────────────────────────────────────────────────────────┐
│ 🏠 资产审核工作台                                                 │
├──────────────────────────────────────────────────────────────────┤
│ [状态▼ 待审核] [来源▼ 全部] [省份▼ 全部] [类型▼ 全部] [搜索___]  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────┐  ┌──────────────────────────────────┐ │
│  │ 原始数据预览          │  │ AI 提取的结构化数据               │ │
│  │                      │  │                                  │ │
│  │ [网页截图/HTML快照]   │  │ 标题：[杭州·安吉溪龙乡溪畔宅基地] │ │
│  │                      │  │ 省份：[浙江省] 城市：[湖州市]     │ │
│  │ 来源URL: https://... │  │ 面积：[3.2] 亩                   │ │
│  │ 抓取时间: 2026-06-29 │  │ 年租金：[12.8] 万                │ │
│  │                      │  │ 流转年限：[20] 年                 │ │
│  │                      │  │ 类型：[宅基地]                    │ │
│  │                      │  │ 描述：[安吉白茶核心产区...]       │ │
│  │                      │  │ 联系人：[安吉溪龙乡政府]          │ │
│  │                      │  │ 电话：[13800001001]              │ │
│  └──────────────────────┘  │                                  │ │
│                             │  [修改] [通过 ✓] [驳回 ✗]        │ │
│                             └──────────────────────────────────┘ │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │ 相似资产（去重检测）                                          ││
│  │ ⚠️ 发现 1 条相似资产：                                       ││
│  │   #15 杭州·安吉递铺镇宅基地 (3.1亩, ¥12.5万/年) 相似度 92%  ││
│  │   → 建议：合并或标记为重复                                    ││
│  └──────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────┘
```

---

## 四、采集功能（爬虫系统）深度完善规划

### 4.1 当前架构 vs 目标架构

```
当前（断裂的）：
  GitHub Actions → catcher.js → staging_raw ❌ 停在这里

目标（完整的）：
  GitHub Actions → catcher.js → staging_raw → AI清洗 → assets(pending) → 人工审核 → assets(approved) → 前台展示
```

### 4.2 多源异构采集策略

#### 策略 A：官方原矿 + 村委直发

| 维度 | 规划 |
|------|------|
| **目标源** | 各省农村产权交易中心官网、政府土流网公示、全国土地市场网 |
| **采集重点** | 发包方（必须是村委会或村集体）、流转期限、评估价、地块坐标 |
| **AI 提取字段** | title, location, area_mu, price_year, lease_years, asset_type, contact_name, contact_phone, org_name |
| **AI 合规校验** | "是否有争议"、"是否通水电"、"是否基本农田"、"发包方资质是否合规" |
| **去重策略** | GPS 坐标 + 面积 + 发包方名称 → 生成指纹 → 与已有资产比对 |
| **优先级规则** | 同一资产多源出现时：official > village > ugc（保留最权威来源） |

#### 策略 B：文旅大宗产业路演

| 维度 | 规划 |
|------|------|
| **目标源** | 地方文旅招商网、大型农业产业园招商页面、产权交易所大宗板块 |
| **采集重点** | 占地面积（通常很大）、规划用途、投资回报率、确权状态、商业规划书 |
| **AI 提取字段** | title, description, area_mu, price_total, yield_rate, certification_status |
| **特殊处理** | 大宗项目需要额外字段，在 assets 表中用 `ai_extracted` JSON 存储扩展数据 |

#### 策略 C：数字化隐居基建硬指标

| 维度 | 规划 |
|------|------|
| **目标源** | **不能依赖全自动爬虫**（5G延迟/医疗响应时间无公开数据源） |
| **数据采集方案** | ① 运营人员线下采集 → Excel 批量导入 ② 对接高德地图 API 计算到三甲医院距离/时间 ③ 对接 Speedtest API 测量 5G 延迟 ④ 对接国家电网 API 查询供电冗余 |
| **后台工具** | `/admin/infra-ratings` 页面需支持 Excel 导入 + 单条录入 + API 自动更新 |

#### 策略 D：合伙人信息

| 维度 | 规划 |
|------|------|
| **目标源** | 各地房产中介平台、村务公开信息、合伙人自主申请 |
| **采集重点** | 姓名、区域、从业年限、擅长领域 |
| **特殊处理** | 合伙人数据主要靠自主申请 + 人工审核，爬虫仅做补充验证 |

### 4.3 人机协作工作流（Human-in-the-loop）

```
┌─────────────────────────────────────────────────────────────┐
│                    采集工作流全景图                           │
└─────────────────────────────────────────────────────────────┘

第1步：自动抓取
  GitHub Actions (每天凌晨3点)
    → 读取 scrapers_recipes（启用的配方）
    → Playwright 抓取网页
    → CSS 选择器提取列表数据
    → 可选：进详情页深度抓取
    → 存入 staging_raw (status='raw')

第2步：AI 结构化
  触发条件：爬虫完成 / 手动触发
    → 读取 staging_raw (status='raw')
    → 调用 Gemini 2.0 Flash
    → 使用 scrapers_recipes.ai_prompt 自定义提示词
    → 提取结构化 JSON
    → 成功 → staging_raw (status='cleaned') + 写入 assets (status='pending')
    → 失败 → staging_raw (status='error', error_msg=...)

第3步：智能去重
  新资产写入前：
    → 生成数据指纹（GPS坐标 + 面积 + 发包方名称）
    → 与已有 assets 比对（Haversine 距离 < 0.5km 且面积差异 < 10%）
    → 重复 → 保留权威来源（official > village > ugc）
    → 不重复 → 正常写入

第4步：人工复核（后台审核工作台）
  运营人员操作：
    → 左侧：原始网页截图/HTML 快照
    → 右侧：AI 提取的结构化数据
    → 核对关键字段（价格、面积、发包方、联系方式）
    → "村委直发"资产：必须验证村委授权书
    → 操作：通过 / 驳回（附原因）/ 修改后通过

第5步：上架展示
  审核通过：
    → assets.status = 'approved'
    → 前台自动展示
    → 同步更新 FTS5 全文搜索索引
    → 更新 homepage_config.total_assets（可选，或自动计算）
```

### 4.4 智能去重与"原矿"指纹

#### 数据指纹算法

```javascript
function generateFingerprint(asset) {
  const components = [
    // GPS 坐标（四舍五入到小数点后3位，约100米精度）
    asset.gps_lat?.toFixed(3) || '',
    asset.gps_lng?.toFixed(3) || '',
    // 面积（四舍五入到整数亩）
    Math.round(asset.area_mu || 0).toString(),
    // 发包方/联系人名称
    asset.contact_name?.trim() || '',
    // 省市区
    asset.province || '',
    asset.city || '',
    asset.district || '',
  ];
  // SHA-256 哈希
  return sha256(components.join('|'));
}
```

#### 去重规则

```
新资产指纹 → 与已有资产比对
  ├── 完全匹配 → 标记为"疑似重复"
  │   ├── 来源优先级：official > village > ugc
  │   ├── 保留高优先级来源
  │   └── 低优先级来源 → staging_raw (status='duplicate')
  │
  ├── GPS 距离 < 0.5km 且面积差异 < 10% → 标记为"疑似重复"
  │   └── 人工审核确认
  │
  └── 无匹配 → 正常入库
```

### 4.5 采集监控仪表盘

```
/admin/scrapers → 增强版

┌──────────────────────────────────────────────────────────────┐
│ 🕷️ 采集监控中心                                               │
├──────────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│ │ 配方总数  │ │ 今日采集  │ │ 待清洗    │ │ 待审核    │         │
│ │    5     │ │   234    │ │    45    │ │    12    │         │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘         │
├──────────────────────────────────────────────────────────────┤
│ 配方列表                                                      │
│ 名称           | URL              | 启用 | 上次运行  | 状态  | 操作    │
│ 浙江产权中心    | zjcq.zj.gov.cn   | ✅  | 06-29 3am | ✅   | 编辑 日志│
│ 四川产权中心    | cdzcc.com        | ✅  | 06-29 3am | ✅   | 编辑 日志│
│ 大理文旅招商    | dl.gov.cn/lyzs   | ❌  | 从未运行  | ⏸   | 编辑 测试│
├──────────────────────────────────────────────────────────────┤
│ 数据流转管道                                                  │
│ raw(45) → cleaning(2) → cleaned(12) → pending_review(8)      │
│                              ↓                                │
│                         error(3) → 重试/删除                   │
└──────────────────────────────────────────────────────────────┘
```

### 4.6 爬虫配方增强

#### 当前配方结构

```json
{
  "name": "浙江产权中心",
  "base_url": "https://zjcq.zj.gov.cn",
  "list_url": "https://zjcq.zj.gov.cn/list?page={page}",
  "selectors": {
    "list": {
      "container": ".asset-list-item",
      "fields": {
        "title": ".title",
        "link": "a@href",
        "price": ".price"
      }
    }
  }
}
```

#### 增强后的配方结构

```json
{
  "name": "浙江产权中心",
  "base_url": "https://zjcq.zj.gov.cn",
  "list_url": "https://zjcq.zj.gov.cn/list?page={page}",
  "enabled": true,
  "max_pages": 10,
  "pagination_type": "url",
  "schedule_cron": "0 3 * * *",
  "proxy_enabled": false,
  "selectors": {
    "list": {
      "container": ".asset-list-item",
      "fields": {
        "title": ".title a",
        "link": ".title a@href",
        "price": ".price em",
        "area": ".area span",
        "location": ".location"
      }
    }
  },
  "detail_selectors": {
    "link_field": "link",
    "fields": {
      "description": ".detail-content",
      "contact_name": ".contact-name",
      "contact_phone": ".contact-phone",
      "images": ".gallery img@src",
      "gps_lat": ".map-data@data-lat",
      "gps_lng": ".map-data@data-lng"
    }
  },
  "ai_prompt": "从以下HTML中提取乡村资产信息。重点关注：1) 发包方是否为村委会或村集体 2) 是否有产权争议 3) 是否通水电 4) 流转期限。返回JSON格式。",
  "source_type": "official",
  "target_province": "浙江省",
  "dedup_strategy": "gps+fingerprint",
  "auto_import": false
}
```

#### 新增配方字段说明

| 字段 | 说明 |
|------|------|
| `source_type` | 采集数据的来源分类（official/village/ugc） |
| `target_province` | 目标省份（用于自动填充 assets.province） |
| `dedup_strategy` | 去重策略（gps+fingerprint / title_similarity / none） |
| `auto_import` | 是否自动导入（true=跳过人工审核，false=进入 staging 待审核） |

---

## 五、开发优先级与排期

### Phase 1：数据字典管控（第 1 周）

```
Day 1-2: /admin/regions + /api/admin/regions
  ├── 树形列表（省→市→区县）
  ├── CRUD + 启用/禁用
  └── 批量导入 CSV

Day 3: /admin/asset-types + /api/admin/asset-types
  ├── 列表 + CRUD
  └── 关联资产数量统计

Day 4-5: /admin/market-data 前端页面
  ├── API 已有，只建前端
  ├── 列表 + 新增/编辑弹窗
  └── 涨跌颜色标记 + 砍价空间进度条
```

### Phase 2：采集与基建（第 2 周）

```
Day 1-2: /admin/infra-ratings + /api/admin/infra-ratings
  ├── 列表 + CRUD
  ├── 省市联动选择器
  ├── 评级自动计算
  └── Excel 批量导入

Day 3-4: /admin/staging + /api/admin/staging
  ├── 统计卡片（raw/cleaned/imported/error）
  ├── 数据预览（JSON 格式化）
  ├── AI 清洗流程（调用 Gemini）
  ├── 导入确认（预览 → 修正 → 写入 assets）
  └── 批量操作

Day 5: /admin/scrapers 增强
  ├── 配方编辑
  ├── 测试抓取（前3条预览）
  └── 运行日志
```

### Phase 3：用户与权限（第 3 周）

```
Day 1: D1 新增 permissions 表 + 种子数据
  ├── 5 个角色的权限配置
  └── API 中间件鉴权

Day 2: /admin/users + /api/admin/users
  ├── 用户列表 + 筛选
  ├── 角色分配
  ├── 封禁/解封
  └── 认证审核

Day 3-4: /dashboard 角色通用后台
  ├── 我的资产列表
  ├── 发布新资产表单
  ├── 我的线索
  └── 个人资料

Day 5: assets 表扩展字段
  ├── org_authorization_url（村委授权书）
  ├── yield_rate（收益率）
  ├── certification_status（确权状态）
  └── region_id（关联基建评分）
```

### Phase 4：监控与收尾（第 4 周）

```
Day 1: /admin/audit-logs
  ├── 只读列表 + 筛选
  └── 操作类型颜色标记

Day 2: /admin/ai-usage
  ├── 统计卡片 + 趋势图
  ├── 预算设置 + 熔断重置
  └── 调用明细分页

Day 3: 审核工作台增强
  ├── 左右分栏（原始数据 vs AI提取）
  ├── 去重检测提示
  └── 一键通过/驳回

Day 4-5: 全量联调 + Bug修复
  ├── 权限控制联调
  ├── R2 签名 URL 测试
  └── 端到端流程验证
```

---

## 六、关键技术决策点（需确认）

| # | 问题 | 选项 | 建议 |
|---|------|------|------|
| 1 | 大宗路演是否需要独立表？ | A: 复用 assets + featured 标记 B: 新建 bulk_projects 表 | A（复用，扩展字段即可） |
| 2 | 权限粒度到什么级别？ | A: 角色级（5个角色固定权限）B: 角色+自定义权限 | A（先用角色级，后续可扩展） |
| 3 | 基建数据如何采集？ | A: 纯人工录入 B: 对接第三方 API C: 混合 | C（API 自动 + 人工校准） |
| 4 | 微信登录何时对接？ | A: Phase 3 B: 推迟到 Phase 5 | A（Phase 3，否则 UGC 无法落地） |
| 5 | 去重策略严格程度？ | A: 严格（自动拒绝疑似重复）B: 宽松（标记待人工确认） | B（标记待确认，避免误删） |
| 6 | 是否需要资产浏览日志表？ | A: 需要（深度分析）B: 只用 assets.views 计数器 | B（先用计数器，后续再加日志表） |
