# P1/P2 详细规划：后台内容管控体系

> 核心原则：后台必须完全控制前台每一个数据字段的增删改查

---

## 前台内容 → 后台管控 对照表

| 前台页面/板块 | 数据来源表 | 管控页面 | 优先级 |
|--------------|-----------|---------|--------|
| 首页 Hero / 板块标题 | `homepage_config` | ✅ 已有 /admin | — |
| 🔥 热点寻源 | `assets` (按 views 排序) | ✅ 已有 /admin/assets | — |
| 📊 流转大盘表格 | `market_data` | ❌ **P1** /admin/market-data | P1 |
| 📊 省级行情详情 | `market_data` + `assets` | ❌ **P1** /admin/market-data | P1 |
| ⚖️ 官方原矿 | `assets` (source_type=official) | ✅ 已有 /admin/assets | — |
| 🏛️ 村委直发 | `assets` (source_type=village) | ✅ 已有 /admin/assets | — |
| 🎪 大宗路演 | `assets` (featured=1) | ✅ 已有 /admin/assets | — |
| 📡 基建指标排行 | `infrastructure_ratings` | ❌ **P1** /admin/infra-ratings | P1 |
| 📡 基建详情 | `infrastructure_ratings` + `assets` | ❌ **P1** /admin/infra-ratings | P1 |
| 🤝 合伙人名录 | `brokers` | ✅ 已有 /admin/brokers | — |
| 🤝 合伙人详情 | `brokers` + `assets` | ✅ 已有 /admin/brokers | — |
| 🔍 资产搜索（省份筛选） | `regions` | ❌ **P1** /admin/regions | P1 |
| 🔍 资产搜索（类型筛选） | `asset_types` | ❌ **P1** /admin/asset-types | P1 |
| 资产详情页基建配套 | `infrastructure_ratings` | ❌ **P1** 需要 assets 关联 infra | P1 |
| 🕷️ 爬虫采集 | `scrapers_recipes` + `staging_raw` | ✅ 已有 /admin/scrapers（基础） | — |
| 🕷️ 暂存数据清洗 | `staging_raw` → `assets` | ❌ **P1** /admin/staging | P1 |
| 用户管理 | `users` | ❌ **P2** /admin/users | P2 |
| 审计日志 | `admin_audit_logs` | ❌ **P2** /admin/audit-logs | P2 |
| AI 用量监控 | `ai_usage_log` | ❌ **P2** /admin/ai-usage | P2 |

---

## P1：内容管控核心（1-2周）

### P1-1 行情数据管理 `/admin/market-data`

**对应前台**：流转大盘页面（首页概览 + /market-index 表格 + /market-index/[province] 省级详情）

**D1 表**：`market_data`

```
字段：
  id            → 自增主键（不显示）
  province      → 省份名称（下拉选择，从 regions 表读取省份列表）
  median_price  → 租金中位数（万元/年，数字输入，支持小数）
  change_pct    → 环比涨跌（百分比，正数绿色↑ 负数红色↓ 0灰色→）
  bargain_space → 砍价空间（百分比，负数，如 -12.4）
  total_listings → 官方存量挂牌数（整数）
  updated_at    → 最后更新时间（自动）
```

**页面功能**：

| 功能 | 说明 |
|------|------|
| 列表 | 表格展示所有省份行情，按 median_price 降序 |
| 新增 | 弹窗/侧边栏表单，省份从下拉选择 |
| 编辑 | 点击行内编辑或弹窗编辑 |
| 删除 | 确认弹窗后删除 |
| 批量导入 | 支持 CSV/JSON 导入（可选） |
| 状态指示 | 涨跌颜色标记、砍价空间进度条（复用前台样式） |

**API**：✅ 已有 `/api/admin/market-data`（GET/POST CRUD），前端页面需新建

---

### P1-2 基建评分管理 `/admin/infra-ratings`

**对应前台**：基建指标页面（/infra-rating 排行表 + /infra-rating/[id] 详情页）

**D1 表**：`infrastructure_ratings`

```
字段：
  id              → 自增主键
  region          → 区域名称（如"杭州·安吉"，文本输入）
  province        → 省份（下拉选择）
  city            → 城市（下拉选择，联动省份）
  signal_5g_ms    → 5G延迟（毫秒，整数，0-200）
  hospital_min    → 三甲医院车程（分钟，整数，0-120）
  grid_redundancy → 电网冗余度（百分比，整数，0-100）
  overall_grade   → 综合评级（下拉：S+/S/A+/A/A-/B+/B/C，或自由输入）
  updated_at      → 最后更新时间（自动）
```

**页面功能**：

| 功能 | 说明 |
|------|------|
| 列表 | 表格展示，按 signal_5g_ms 升序（延迟越低越好） |
| 新增 | 表单，省市联动选择器（复用 RegionSelector 组件） |
| 编辑 | 行内编辑或弹窗 |
| 删除 | 确认弹窗 |
| 评级预览 | 根据三个指标自动计算建议评级（S+/S/A+...） |
| 关联资产预览 | 显示该区域匹配的资产数量（模糊匹配 city/district） |

**API**：❌ 需新建 `/api/admin/infra-ratings`（GET/POST CRUD）

---

### P1-3 行政区划管理 `/admin/regions`

**对应前台**：搜索页省份/城市筛选、合伙人名录省市筛选、RegionSelector 组件

**D1 表**：`regions`

```
字段：
  id          → 自增主键
  code        → 行政区划代码（如 330000，唯一）
  name        → 名称（如"浙江省"）
  level       → 级别（province/city/district，下拉）
  parent_code → 上级代码（省级为空，市级填省代码，区级填市代码）
  province    → 所属省份（市级/区级时填）
  city        → 所属城市（区级时填）
  emoji       → 表情符号（用于前台展示）
  lat         → 纬度
  lng         → 经度
  sort_order  → 排序序号
  active      → 是否启用（0/1）
  created_at  → 创建时间
```

**页面功能**：

| 功能 | 说明 |
|------|------|
| 树形列表 | 按 省→市→区县 三级树形展示（折叠/展开） |
| 筛选 | 按级别筛选、按省份筛选、关键词搜索 |
| 新增 | 表单，级别联动（选省级时上级为空，选市级时上级为省） |
| 编辑 | 行内编辑 |
| 删除 | 确认弹窗（检查是否有下级数据） |
| 启用/禁用 | toggle 开关（控制前台是否显示） |
| 批量导入 | 支持国家标准行政区划代码 CSV 导入 |

**API**：❌ 需新建 `/api/admin/regions`（GET/POST CRUD）

---

### P1-4 资产类型管理 `/admin/asset-types`

**对应前台**：搜索页资产类型筛选

**D1 表**：`asset_types`

```
字段：
  id          → 自增主键
  name        → 类型名称（唯一，如"宅基地"）
  icon        → 图标（emoji 或图标名）
  description → 描述
  sort_order  → 排序序号
  active      → 是否启用
```

**页面功能**：

| 功能 | 说明 |
|------|------|
| 列表 | 表格展示，按 sort_order 排序 |
| 新增 | 表单 |
| 编辑 | 行内编辑 |
| 删除 | 确认弹窗（检查是否有资产引用） |
| 启用/禁用 | toggle 开关 |
| 拖拽排序 | 可选，拖拽调整前台显示顺序 |

**API**：❌ 需新建 `/api/admin/asset-types`（GET/POST CRUD）

---

### P1-5 暂存数据管理 `/admin/staging`

**对应前台**：爬虫采集数据 → AI 清洗 → 上架

**D1 表**：`staging_raw` + `scrapers_recipes`

```
staging_raw 字段：
  id          → 自增主键
  recipe_id   → 关联配方ID
  raw_html    → 原始HTML
  raw_data    → 原始数据（JSON）
  status      → 状态（raw/cleaned/imported/error）
  error_msg   → 错误信息
  created_at  → 创建时间
```

**页面功能**：

| 功能 | 说明 |
|------|------|
| 列表 | 按配方筛选、按状态筛选（raw/cleaned/imported/error） |
| 数据预览 | 展开 raw_data JSON，格式化显示 |
| AI 清洗 | 选中 raw 数据 → 调用 Gemini → 预览提取结果 → 确认导入 |
| 导入确认 | 预览 AI 提取的结构化数据 → 编辑修正 → 确认写入 assets 表 |
| 批量操作 | 批量清洗、批量导入、批量删除 |
| 错误处理 | 查看 error_msg，支持手动修正后重试 |
| 状态统计 | 顶部卡片：raw 数量、cleaned 数量、imported 数量、error 数量 |

**API**：❌ 需新建 `/api/admin/staging`（GET/POST/PUT）

---

### P1-6 爬虫管理增强 `/admin/scrapers`

**现有功能**：配方列表、新增采集站

**需增强**：

| 功能 | 说明 |
|------|------|
| 配方编辑 | 修改已有配方的选择器、URL、AI提示词等 |
| 测试抓取 | 对单个配方执行试运行，返回前3条结果预览 |
| 运行日志 | 查看每次运行的详细日志 |
| 手动触发 | "立即执行"按钮，触发 GitHub Actions workflow |
| 状态统计 | 启用/禁用数量、上次运行时间、成功率 |

**API**：✅ 已有 `/api/scrape`（基础），需增强 edit/test 功能

---

### P1-7 资产详情页基建信息动态化

**当前问题**：`/asset/[id]` 页面的"基础设施配套明细"是硬编码的（通电、自来水、5G等全部显示"已通"），没有从 `infrastructure_ratings` 表读取真实数据。

**修复方案**：
1. assets 表新增 `region_id` 字段（关联 infrastructure_ratings.id）
2. 或通过 GPS 坐标 + Haversine 距离匹配最近的基建评分区域
3. 前台详情页从 infrastructure_ratings 动态读取并展示

**需修改**：
- `app/asset/[id]/page.tsx` — 动态读取基建数据
- `lib/data.ts` — 新增 `getInfraForAsset(lat, lng)` 函数

---

## P2：用户体系与数据分析（3-4周）

### P2-1 用户管理 `/admin/users`

**D1 表**：`users`

```
字段：
  id          → 自增主键
  openid      → 微信OpenID
  nickname    → 昵称
  avatar_url  → 头像
  phone       → 手机号
  role        → 角色（buyer/broker/village/admin/superadmin）
  status      → 状态（active/banned）
  real_name   → 真实姓名
  org_name    → 组织名称
  org_license → 营业执照URL
  verified    → 是否认证
  daily_quota → 每日发布配额
  created_at  → 注册时间
  updated_at  → 更新时间
```

**页面功能**：

| 功能 | 说明 |
|------|------|
| 列表 | 表格，按角色/状态/认证筛选，支持搜索 |
| 角色分配 | 下拉修改角色（仅 superadmin 可操作） |
| 封禁/解封 | toggle 状态 |
| 认证审核 | 审核 org_license，设置 verified=1 |
| 配额调整 | 修改 daily_quota |
| 用户详情 | 查看用户发布的资产、线索、活动记录 |

**权限**：仅 superadmin 可访问

**API**：❌ 需新建 `/api/admin/users`

---

### P2-2 审计日志 `/admin/audit-logs`

**D1 表**：`admin_audit_logs`

```
字段：
  id          → 自增主键
  admin_id    → 操作者ID
  action      → 操作类型（login/update/delete/approve/ban）
  target_type → 目标类型（asset/user/config）
  target_id   → 目标ID
  detail      → 详情文本
  ip_address  → IP地址
  created_at  → 操作时间
```

**页面功能**：

| 功能 | 说明 |
|------|------|
| 列表 | 按时间倒序，分页 |
| 筛选 | 按操作类型、目标类型、操作者、时间范围 |
| 详情 | 展开显示完整 detail |
| 导出 | CSV 导出（可选） |

**API**：❌ 需新建 `/api/admin/audit-logs`（只读 GET，审计日志只增不删）

---

### P2-3 AI 用量监控 `/admin/ai-usage`

**D1 表**：`ai_usage_log`

```
字段：
  id          → 自增主键
  tokens_in   → 输入 tokens
  tokens_out  → 输出 tokens
  cost        → 费用（元）
  model       → 模型名称
  created_at  → 调用时间
```

**页面功能**：

| 功能 | 说明 |
|------|------|
| 总览卡片 | 今日消费、本月消费、总消费、今日调用次数 |
| 趋势图 | 折线图展示每日消费趋势 |
| 明细列表 | 每次调用的 token 数、费用、时间 |
| 预算设置 | 每日预算上限（滑块/输入框） |
| 熔断状态 | 显示当前是否已熔断，手动重置按钮 |

**API**：❌ 需新建 `/api/admin/ai-usage`

---

### P2-4 资产发布流程增强

**当前问题**：assets 的 status 状态机不完整

**完善方案**：

```
发布来源          状态流转
─────────────────────────────
爬虫采集    →  staging_raw → AI清洗 → assets(pending) → 审核 → approved/rejected
UGC提交     →  assets(pending) → 审核 → approved/rejected
管理员手动  →  assets(approved)  → 直接上架
```

**需开发**：
- 管理员后台"新增资产"表单（手动发布）
- 审核时自动写入审计日志
- 拒绝时允许填写拒绝原因
- 被拒绝的资产支持"修改后重新提交"

---

### P2-5 前台发布入口（UGC）

**对应角色**：broker（合伙人）、village（村集体）

**发布入口**：`/dashboard/assets/new`

**表单字段**：

| 字段 | 类型 | 说明 |
|------|------|------|
| title | 文本 | 必填 |
| description | 文本域 | 选填 |
| asset_type | 下拉 | 从 asset_types 读取 |
| province/city/district | 级联选择 | 复用 RegionSelector |
| address | 文本 | 详细地址 |
| area_mu | 数字 | 面积（亩） |
| price_year | 数字 | 年租金（万元） |
| lease_years | 数字 | 流转年限 |
| images | 图片上传 | 多图，上传到 R2 |
| contact_name | 文本 | 联系人 |
| contact_phone | 文本 | 联系电话（自动加密存储） |

**流程**：
1. 填写表单 → 前端校验
2. 提交 → `/api/assets` (POST)
3. 图片 → `/api/admin/upload` → R2
4. 写入 assets (status=pending, source_type=ugc/village)
5. 管理员审核 → 上架

---

## 后台侧边栏导航（最终版）

```
🔧 后台管理
├── 📊 运营控制台          /admin              (superadmin + admin)
├── 🏠 资产管理            /admin/assets       (superadmin + admin)
├── 💰 行情数据            /admin/market-data  (superadmin + admin)  ← P1
├── 📡 基建评分            /admin/infra-ratings(superadmin + admin)  ← P1
├── 🗺️ 行政区划            /admin/regions      (superadmin + admin)  ← P1
├── 🏷️ 资产类型            /admin/asset-types  (superadmin + admin)  ← P1
├── 🤝 合伙人管理          /admin/brokers      (superadmin + admin)
├── 🕷️ 爬虫管理            /admin/scrapers     (superadmin + admin)
├── 📥 暂存数据            /admin/staging      (superadmin + admin)  ← P1
├── 👥 用户管理            /admin/users        (superadmin only)     ← P2
├── 📋 审计日志            /admin/audit-logs   (superadmin + admin)  ← P2
├── 🤖 AI用量              /admin/ai-usage     (superadmin + admin)  ← P2
└── ⚙️ 全局配置            /admin/config       (superadmin only)
```

---

## 开发顺序（建议）

```
第1周：数据字典管理（P1-3 + P1-4 + P1-1 + P1-2）
  Day 1-2: /admin/regions + /api/admin/regions
  Day 3:   /admin/asset-types + /api/admin/asset-types
  Day 4-5: /admin/market-data + /api/admin/market-data（API已有，只建前端）

第2周：采集管道 + 基建（P1-2 + P1-5 + P1-6）
  Day 1-2: /admin/infra-ratings + /api/admin/infra-ratings
  Day 3-4: /admin/staging + /api/admin/staging + AI清洗流程
  Day 5:   /admin/scrapers 增强（编辑、测试抓取）

第3周：用户体系（P2-1 + P2-4 + P2-5）
  Day 1-2: 微信登录对接
  Day 3:   /admin/users + /api/admin/users
  Day 4-5: UGC发布入口 + 审核流程完善

第4周：监控与收尾（P2-2 + P2-3 + P1-7）
  Day 1:   /admin/audit-logs
  Day 2:   /admin/ai-usage
  Day 3:   资产详情页基建信息动态化
  Day 4-5: 联调测试 + Bug修复
```
