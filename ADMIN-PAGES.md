# 后台管理页面完整规划

> 共 12 个管理页面，4 个已有 + 8 个待建

---

## 页面总览

```
/admin
├── 📊 运营控制台          /admin                  ✅ 已有 → 需增强
├── 🏠 资产管理            /admin/assets           ✅ 已有 → 需增强
├── 🤝 合伙人管理          /admin/brokers          ✅ 已有 → OK
├── 🕷️ 爬虫管理            /admin/scrapers         ✅ 已有 → 需增强
├── 💰 行情数据            /admin/market-data      ❌ 待建
├── 📡 基建评分            /admin/infra-ratings    ❌ 待建
├── 🗺️ 行政区划            /admin/regions          ❌ 待建
├── 🏷️ 资产类型            /admin/asset-types      ❌ 待建
├── 📥 暂存数据            /admin/staging          ❌ 待建
├── 👥 用户管理            /admin/users            ❌ 待建
├── 📋 审计日志            /admin/audit-logs       ❌ 待建
└── 🤖 AI用量监控          /admin/ai-usage         ❌ 待建
```

---

## 1. 运营控制台 `/admin`（✅ 已有 → 需增强）

### 现有功能
- 统计卡片（总资产数、今日新增、待审核、活跃用户）
- 公司信息编辑（名称、电话、邮箱、ICP、公安备案）
- 首页板块配置（Hero、热点寻源、行情数据、官方原矿、村委直发、大宗路演、基建指标、合伙人，每个板块的标题/副标题/显示数量）
- 页脚配置（关于我们文案）

### 需增强

| 增强项 | 说明 |
|--------|------|
| 统计卡片数据真实化 | "活跃用户"目前显示 "—"，需从 users 表统计近7天活跃 |
| 待审核数量跳转 | 点击"待审核"卡片跳转到 /admin/assets?status=pending |
| 快捷入口 | 增加快捷操作区：新增资产、新增合伙人、查看暂存数据 |
| 最近操作 | 显示最近5条审计日志（从 admin_audit_logs 读取） |
| 数据概览图 | 资产来源分布饼图（official/village/ugc 各占多少） |

### 字段清单

```
统计卡片：
  总资产数      → SELECT COUNT(*) FROM assets
  今日新增      → SELECT COUNT(*) FROM assets WHERE date(created_at) = date('now')
  待审核        → SELECT COUNT(*) FROM assets WHERE status = 'pending'
  活跃用户      → SELECT COUNT(DISTINCT user_id) FROM assets WHERE created_at >= date('now', '-7 days')

公司信息（homepage_config 表）：
  company_name    → 公司主体名称（文本）
  company_phone   → 全国服务热线（文本）
  company_email   → 官方合作邮箱（文本）
  icp_number      → ICP备案号（文本）
  police_record   → 公安备案号（文本）

首页板块配置（homepage_config 表）：
  hero_title      → Hero大标题（文本）
  hero_subtitle   → Hero副标题（文本）
  total_assets    → 总收录数覆盖值（数字文本，留空则自动计算）
  today_new       → 今日上新覆盖值（数字文本）
  section_*_title → 各板块标题（文本）
  section_*_subtitle → 各板块副标题（文本）
  section_*_count → 各板块显示数量（数字，1-12）

页脚配置（homepage_config 表）：
  footer_about    → 关于我们文案（文本域）
  featured_slots  → 橱窗推荐位（JSON数组）
```

---

## 2. 资产管理 `/admin/assets`（✅ 已有 → 需增强）

### 现有功能
- 按状态筛选（全部/待审核/已上架/已拒绝）
- 资产列表表格（ID、标题、区域、来源、浏览量、状态、操作）
- 批准/拒绝操作
- 查看链接

### 需增强

| 增强项 | 说明 |
|--------|------|
| 更多筛选条件 | 增加来源类型（official/village/ugc）、省份、资产类型筛选 |
| 搜索 | 关键词搜索（标题、地址） |
| 新增资产 | 管理员手动发布资产的表单 |
| 编辑资产 | 修改资产所有字段 |
| 删除资产 | 软删除（status='banned'）或硬删除 |
| 橱窗推荐 | toggle featured 状态（已有 API 逻辑，缺前端按钮） |
| 批量操作 | 批量批准、批量拒绝、批量推荐 |
| 图片预览 | 悬停或点击查看资产图片 |
| 分页 | 当前只显示50条，需要分页 |

### 字段清单

```
列表字段：
  id            → #编号
  title         → 标题（可点击跳转详情）
  province      → 省份
  city          → 城市
  asset_type    → 资产类型
  source_type   → 来源（official/village/ugc，彩色标签）
  price_year    → 年租金
  area_mu       → 面积
  views         → 浏览量
  status        → 状态（pending/approved/rejected/banned，彩色标签）
  featured      → 橱窗推荐（星标）
  created_at    → 创建时间
  操作          → 查看/编辑/批准/拒绝/推荐/删除

新增/编辑表单字段：
  title         → 标题（文本，必填）
  description   → 描述（文本域）
  asset_type    → 资产类型（下拉，从 asset_types 表读取）
  source_type   → 来源类型（下拉：official/village/ugc）
  province      → 省份（下拉）
  city          → 城市（下拉，联动省份）
  district      → 区县（下拉，联动城市）
  address       → 详细地址（文本）
  area_mu       → 面积/亩（数字）
  price_year    → 年租金/万（数字）
  price_total   → 总价/万（数字）
  lease_years   → 流转年限（数字）
  images        → 图片（多图上传到 R2）
  video_url     → 视频URL（文本）
  gps_lat       → 纬度（数字）
  gps_lng       → 经度（数字）
  contact_name  → 联系人（文本）
  contact_phone → 联系电话（文本，自动加密存储）
  status        → 状态（下拉）
  featured      → 橱窗推荐（开关）
```

---

## 3. 合伙人管理 `/admin/brokers`（✅ 已有）

### 现有功能
- 列表展示所有合伙人
- 新增合伙人（表单在表格底部）
- 编辑合伙人（行内编辑）
- 删除合伙人
- 评级选择（gold/silver/bronze）
- 擅长领域（JSON 文本输入）

### 不需要改动
功能完整，字段齐全。

---

## 4. 爬虫管理 `/admin/scrapers`（✅ 已有 → 需增强）

### 现有功能
- 配方列表（站点名称、采集URL、最大页数、上次运行、状态、操作）
- 新增采集站表单（名称、基础URL、列表页URL、最大页数、AI提示词）

### 需增强

| 增强项 | 说明 |
|--------|------|
| 配方编辑 | 修改已有配方（当前只有新增，没有编辑） |
| 启用/禁用 | toggle 开关 |
| 测试抓取 | 点击"测试"→ 调用 API → 显示前3条抓取结果预览 |
| 运行日志 | 展开显示最近N次运行的时间、状态、抓取数量、错误信息 |
| 选择器编辑 | 配置 CSS 选择器（list.container、list.fields、detail_selectors） |
| 手动触发 | "立即执行"按钮 → 调用 GitHub Actions API |
| 删除确认 | 当前删除无确认弹窗 |

### 字段清单

```
列表字段：
  id                → ID
  name              → 站点名称
  base_url          → 基础URL
  list_url          → 列表页URL
  enabled           → 启用状态（开关）
  max_pages         → 最大页数
  pagination_type   → 翻页方式（url/scroll）
  last_run_at       → 上次运行时间
  last_run_status   → 运行状态（idle/running/success/failed）
  操作              → 编辑/测试/运行日志/删除

编辑表单字段：
  name              → 站点名称（文本，必填）
  base_url          → 基础URL（文本，必填）
  list_url          → 列表页URL（文本，必填，支持 {page} 占位符）
  max_pages         → 最大页数（数字，1-20）
  pagination_type   → 翻页方式（下拉：url/scroll）
  enabled           → 启用（开关）
  selectors         → CSS选择器配置（JSON编辑器或表单化）
    selectors.list.container → 列表容器选择器
    selectors.list.fields.*  → 字段选择器（title, link, price等）
  detail_selectors  → 详情页选择器（可选）
  ai_prompt         → AI清洗提示词（文本域）
  schedule_cron     → 定时表达式（文本，默认 0 3 * * *）
  proxy_enabled     → 启用代理（开关）
```

---

## 5. 行情数据管理 `/admin/market-data`（❌ 待建）

### 页面布局

```
┌─────────────────────────────────────────────┐
│ 💰 行情数据管理                    [+ 新增]  │
├─────────────────────────────────────────────┤
│ [省份▼] [搜索___________]  共 5 条数据       │
├─────────────────────────────────────────────┤
│ 省份      | 挂牌数  | 中位数  | 涨跌   | 砍价空间 | 操作     │
│ 浙江省    | 1,420  | ¥14.2万 | ↑+4.2% | -5.4%   | 编辑 删除│
│ 四川省    | 892    | ¥7.8万  | ↑+1.8% | -12.4%  | 编辑 删除│
│ 云南省    | 415    | ¥4.5万  | → 持平 | -18.2%  | 编辑 删除│
│ ...       | ...    | ...     | ...    | ...     | ...      │
└─────────────────────────────────────────────┘
```

### D1 表：market_data

```
字段              类型        前端控件        说明
──────────────────────────────────────────────────────
id                INTEGER     隐藏           自增主键
province          TEXT        下拉选择        从 regions 表省份列表读取
median_price      REAL        数字输入        租金中位数（万元/年），步长0.1
change_pct        REAL        数字输入        环比涨跌（%），正数=涨，负数=跌
bargain_space     REAL        数字输入        砍价空间（%），如 -12.4
total_listings    INTEGER     整数输入        官方存量挂牌数
updated_at        TEXT        自动            最后更新时间
```

### 功能清单

| 功能 | 说明 |
|------|------|
| 列表 | 表格，按 median_price 降序，涨跌颜色标记 |
| 新增 | 弹窗/侧边栏表单，省份下拉（去重，已有省份不可再选） |
| 编辑 | 点击行"编辑"→ 行内编辑或弹窗 |
| 删除 | 确认弹窗"确定删除 XX 省行情数据？" |
| 视觉反馈 | 涨跌：绿色↑/红色↓/灰色→；砍价空间：进度条 |

### API

✅ 已有 `/api/admin/market-data`（GET/POST，支持 add/update/delete action）

---

## 6. 基建评分管理 `/admin/infra-ratings`（❌ 待建）

### 页面布局

```
┌──────────────────────────────────────────────────────────┐
│ 📡 基建评分管理                                [+ 新增]   │
├──────────────────────────────────────────────────────────┤
│ [省份▼] [搜索___________]  共 6 条数据                    │
├──────────────────────────────────────────────────────────┤
│ 排名 | 区域        | 省份   | 5G延迟 | 医院车程 | 电网冗余 | 评级 | 操作     │
│ 🥇1 | 杭州·安吉    | 浙江省 | 12ms   | 8分钟   | 98%     | S+  | 编辑 删除│
│ 🥈2 | 北京·延庆    | 北京市 | 15ms   | 10分钟  | 96%     | S   | 编辑 删除│
│ 🥉3 | 成都·都江堰  | 四川省 | 18ms   | 12分钟  | 95%     | S   | 编辑 删除│
│  4  | 大理·苍洱    | 云南省 | 35ms   | 25分钟  | 92%     | A+  | 编辑 删除│
│ ...  | ...         | ...    | ...    | ...     | ...     | ... | ...      │
└──────────────────────────────────────────────────────────┘
```

### D1 表：infrastructure_ratings

```
字段              类型        前端控件        说明
──────────────────────────────────────────────────────
id                INTEGER     隐藏           自增主键
region            TEXT        文本输入        区域名称（如"杭州·安吉"）
province          TEXT        下拉选择        省份
city              TEXT        下拉选择        城市（联动省份）
signal_5g_ms      INTEGER     数字输入        5G延迟（毫秒，0-200）
hospital_min      INTEGER     数字输入        三甲医院车程（分钟，0-120）
grid_redundancy   INTEGER     数字输入        电网冗余度（%，0-100）
overall_grade     TEXT        下拉选择        综合评级（S+/S/A+/A/A-/B+/B/C）
updated_at        TEXT        自动            最后更新时间
```

### 功能清单

| 功能 | 说明 |
|------|------|
| 列表 | 表格，按 signal_5g_ms 升序，排名徽章（🥇🥈🥉） |
| 新增 | 弹窗表单，省市联动选择器 |
| 编辑 | 弹窗编辑 |
| 删除 | 确认弹窗 |
| 评级自动计算 | 根据三个指标自动建议评级（可手动覆盖） |
| 关联资产预览 | 列表显示"该区域匹配 N 宗资产" |
| 颜色标记 | 5G延迟：绿≤20/黄≤40/红>40；医院：绿≤15/黄≤30/红>30；电网：绿≥95/黄≥85/红<85 |

### API

❌ 需新建 `/api/admin/infra-ratings`

```
GET    /api/admin/infra-ratings          → 列表
POST   /api/admin/infra-ratings          → 新增 { action: 'add', ...fields }
POST   /api/admin/infra-ratings          → 更新 { action: 'update', id, ...fields }
POST   /api/admin/infra-ratings          → 删除 { action: 'delete', id }
```

---

## 7. 行政区划管理 `/admin/regions`（❌ 待建）

### 页面布局

```
┌──────────────────────────────────────────────────────────┐
│ 🗺️ 行政区划管理                              [+ 新增]    │
├──────────────────────────────────────────────────────────┤
│ [级别▼ 全部/省/市/区县] [省份▼] [搜索___________] 共 24条 │
├──────────────────────────────────────────────────────────┤
│ ▼ 🌊 浙江省 (330000)                          [编辑] [+] │
│     ├── 🏙️ 杭州市 (330100)                   [编辑] [+] │
│     ├── 🏙️ 湖州市 (330500)                   [编辑]     │
│     ├── 🏙️ 丽水市 (331100)                   [编辑]     │
│     └── 🏙️ 绍兴市 (330600)                   [编辑]     │
│ ▼ 🐼 四川省 (510000)                          [编辑] [+] │
│     ├── 🏙️ 成都市 (510100)                   [编辑]     │
│     └── 🏙️ 乐山市 (511100)                   [编辑]     │
│ ▼ 🌸 云南省 (530000)                          [编辑] [+] │
│     ├── 🏙️ 大理州 (532900)                   [编辑]     │
│     └── 🏙️ 丽江市 (530700)                   [编辑]     │
│ ...                                                      │
└──────────────────────────────────────────────────────────┘
```

### D1 表：regions

```
字段          类型        前端控件          说明
──────────────────────────────────────────────────
id            INTEGER     隐藏             自增主键
code          TEXT        文本输入          行政区划代码（如 330000）
name          TEXT        文本输入          名称（如"浙江省"）
level         TEXT        下拉选择          province/city/district
parent_code   TEXT        下拉选择          上级代码（省级为空）
province      TEXT        自动填充          所属省份（市级/区级自动填）
city          TEXT        自动填充          所属城市（区级自动填）
emoji         TEXT        文本输入          表情符号
lat           REAL        数字输入          纬度
lng           REAL        数字输入          经度
sort_order    INTEGER     数字输入          排序序号
active        INTEGER     开关              是否启用
created_at    TEXT        自动              创建时间
```

### 功能清单

| 功能 | 说明 |
|------|------|
| 树形列表 | 按 省→市→区县 三级折叠展示 |
| 筛选 | 按级别、按省份、关键词搜索 |
| 新增 | 弹窗表单，级别决定上级字段是否必填 |
| 编辑 | 弹窗编辑 |
| 删除 | 确认弹窗，检查是否有下级数据（有下级则禁止删除） |
| 新增下级 | 每行有"➕"按钮，快速新增下级区划 |
| 启用/禁用 | toggle 开关，控制前台是否显示 |
| 批量导入 | "导入"按钮 → 上传 CSV → 预览 → 确认 |

### API

❌ 需新建 `/api/admin/regions`

```
GET    /api/admin/regions                → 列表（支持 level/parent_code/search 参数）
POST   /api/admin/regions                → 新增 { action: 'add', ...fields }
POST   /api/admin/regions                → 更新 { action: 'update', id, ...fields }
POST   /api/admin/regions                → 删除 { action: 'delete', id }
POST   /api/admin/regions                → 批量导入 { action: 'import', data: [...] }
```

---

## 8. 资产类型管理 `/admin/asset-types`（❌ 待建）

### 页面布局

```
┌──────────────────────────────────────────────────────┐
│ 🏷️ 资产类型管理                           [+ 新增]   │
├──────────────────────────────────────────────────────┤
│ 共 9 种资产类型                                       │
├──────────────────────────────────────────────────────┤
│ 排序 | 图标 | 名称     | 描述                   | 状态 | 资产数 | 操作     │
│  1  | 🏠  | 宅基地    | 农村宅基地使用权流转    | ✅   | 12    | 编辑 删除│
│  2  | 🌲  | 林地      | 林地承包经营权流转      | ✅   | 5     | 编辑 删除│
│  3  | 🍵  | 茶园      | 茶园经营权流转          | ✅   | 3     | 编辑 删除│
│  4  | 🏘️  | 古宅      | 传统古建筑保护性流转    | ✅   | 4     | 编辑 删除│
│  5  | 🏭  | 厂房      | 集体建设用地厂房流转    | ✅   | 0     | 编辑 删除│
│ ...  | ... | ...      | ...                    | ...  | ...   │ ...      │
└──────────────────────────────────────────────────────┘
```

### D1 表：asset_types

```
字段          类型        前端控件      说明
──────────────────────────────────────────────
id            INTEGER     隐藏         自增主键
name          TEXT        文本输入      类型名称（唯一）
icon          TEXT        emoji选择器   图标
description   TEXT        文本输入      描述
sort_order    INTEGER     数字输入      排序序号
active        INTEGER     开关          是否启用
```

### 功能清单

| 功能 | 说明 |
|------|------|
| 列表 | 表格，按 sort_order 排序，显示每种类型关联的资产数量 |
| 新增 | 弹窗表单 |
| 编辑 | 弹窗编辑 |
| 删除 | 确认弹窗，如果有关联资产则提示"该类型下有 N 宗资产，删除后资产类型将变为空" |
| 启用/禁用 | toggle 开关 |

### API

❌ 需新建 `/api/admin/asset-types`

```
GET    /api/admin/asset-types            → 列表
POST   /api/admin/asset-types            → 新增 { action: 'add', ...fields }
POST   /api/admin/asset-types            → 更新 { action: 'update', id, ...fields }
POST   /api/admin/asset-types            → 删除 { action: 'delete', id }
```

---

## 9. 暂存数据管理 `/admin/staging`（❌ 待建）

### 页面布局

```
┌──────────────────────────────────────────────────────────────────┐
│ 📥 暂存数据管理（爬虫 → AI清洗 → 上架）                          │
├──────────────────────────────────────────────────────────────────┤
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                             │
│ │ 原始  │ │ 已清洗│ │ 已导入│ │ 错误  │                             │
│ │  45  │ │  12  │ │ 128  │ │  3   │                             │
│ └──────┘ └──────┘ └──────┘ └──────┘                             │
├──────────────────────────────────────────────────────────────────┤
│ [配方▼ 全部] [状态▼ 全部] [搜索___________]                      │
├──────────────────────────────────────────────────────────────────┤
│ ID  | 配方名        | 数据预览              | 状态  | 时间     | 操作        │
│ #45 | 浙江产权中心   | 杭州余杭区5亩宅基...  | raw   | 06-29   | 清洗 导入   │
│ #44 | 浙江产权中心   | 安吉溪龙乡3亩茶...   | clean | 06-29   | 预览 导入   │
│ #43 | 四川产权中心   | 都江堰青城山后山...   | import| 06-28   | 查看资产    │
│ #42 | 浙江产权中心   | [解析失败]            | error | 06-28   | 重试 删除   │
└──────────────────────────────────────────────────────────────────┘
```

### D1 表：staging_raw

```
字段          类型        前端控件      说明
──────────────────────────────────────────────
id            INTEGER     隐藏         自增主键
recipe_id     INTEGER     隐藏         关联配方ID
raw_html      TEXT        不显示        原始HTML（太大）
raw_data      TEXT        JSON预览      原始数据（JSON格式化展示）
status        TEXT        彩色标签      raw/cleaned/imported/error
error_msg     TEXT        红色文本      错误信息
created_at    TEXT        自动          创建时间
```

### 功能清单

| 功能 | 说明 |
|------|------|
| 统计卡片 | 顶部4个卡片：raw数量、cleaned数量、imported数量、error数量 |
| 列表 | 按配方筛选、按状态筛选、分页 |
| 数据预览 | 点击"预览"→ 弹窗展示 raw_data JSON（格式化、可折叠） |
| AI 清洗 | 选中 raw 数据 → 点击"AI清洗" → 调用 Gemini → 预览提取结果 |
| 导入确认 | 预览 AI 提取的结构化数据 → 允许手动修正 → 确认写入 assets(pending) |
| 批量操作 | 全选 → 批量清洗 / 批量导入 / 批量删除 |
| 错误处理 | 查看 error_msg → 手动修正 → 重试 |
| 跳转关联 | imported 状态的条目可点击"查看资产"跳转到对应 assets 记录 |

### API

❌ 需新建 `/api/admin/staging`

```
GET    /api/admin/staging                → 列表（支持 recipe_id/status/search 参数）
POST   /api/admin/staging                → 操作
  { action: 'clean', ids: [1,2,3] }     → AI清洗
  { action: 'import', id: 1, asset: {...} } → 确认导入到 assets
  { action: 'delete', ids: [1,2,3] }    → 删除暂存数据
  { action: 'retry', id: 1 }            → 重试失败的条目
```

---

## 10. 用户管理 `/admin/users`（❌ 待建）

### 页面布局

```
┌──────────────────────────────────────────────────────────────────┐
│ 👥 用户管理                                                      │
├──────────────────────────────────────────────────────────────────┤
│ [角色▼ 全部] [状态▼ 全部] [认证▼ 全部] [搜索___________]         │
├──────────────────────────────────────────────────────────────────┤
│ ID  | 头像 | 昵称     | 角色      | 认证 | 状态 | 资产数 | 注册时间 | 操作       │
│ #1  | 👤  | 系统管理员| superadmin| ✅  | 正常 | —     | 2026-01 | —          │
│ #2  | 👨‍🌾  | 张大山    | broker   | ✅  | 正常 | 3     | 2026-03 | 编辑 封禁  │
│ #3  | 👩‍🌾  | 李秀英    | broker   | ✅  | 正常 | 2     | 2026-03 | 编辑 封禁  │
│ #7  | 🏛️  | 余村村委会| village  | ❌  | 正常 | 1     | 2026-06 | 审核 编辑  │
│ #8  | 👤  | 王小明    | buyer    | ❌  | 正常 | 0     | 2026-06 | 封禁       │
└──────────────────────────────────────────────────────────────────┘
```

### D1 表：users

```
字段          类型        前端控件      说明
──────────────────────────────────────────────
id            INTEGER     隐藏         自增主键
openid        TEXT        隐藏         微信OpenID
nickname      TEXT        文本输入      昵称
avatar_url    TEXT        图片上传      头像
phone         TEXT        文本输入      手机号
role          TEXT        下拉选择      buyer/broker/village/admin/superadmin
status        TEXT        开关          active/banned
real_name     TEXT        文本输入      真实姓名
org_name      TEXT        文本输入      组织名称（村委/机构）
org_license   TEXT        文件上传      营业执照/登记证URL
verified      INTEGER     开关          是否认证（0/1）
daily_quota   INTEGER     数字输入      每日发布配额
created_at    TEXT        自动          注册时间
updated_at    TEXT        自动          更新时间
```

### 功能清单

| 功能 | 说明 |
|------|------|
| 列表 | 表格，按角色/状态/认证筛选，支持昵称搜索 |
| 角色分配 | 下拉修改角色（仅 superadmin 可操作 admin/superadmin 角色） |
| 封禁/解封 | toggle 状态，封禁后该用户无法登录和操作 |
| 认证审核 | 查看 org_license → 通过/拒绝 → 更新 verified |
| 配额调整 | 修改 daily_quota（数字输入） |
| 用户详情 | 点击"详情"→ 展开/跳转：发布的资产列表、线索记录、活动日志 |
| 统计 | 顶部卡片：总用户数、broker数量、village数量、待认证数量 |

### 权限控制

| 操作 | superadmin | admin |
|------|:----------:|:-----:|
| 查看用户列表 | ✅ | ✅ |
| 修改角色 | ✅ | ❌ |
| 封禁/解封 | ✅ | ✅（不含admin以上） |
| 认证审核 | ✅ | ✅ |
| 删除用户 | ✅ | ❌ |

### API

❌ 需新建 `/api/admin/users`

```
GET    /api/admin/users                  → 列表（支持 role/status/verified/search 参数）
POST   /api/admin/users                  → 操作
  { action: 'update-role', id, role }    → 修改角色
  { action: 'toggle-status', id }        → 封禁/解封
  { action: 'verify', id, verified }     → 认证审核
  { action: 'update-quota', id, quota }  → 调整配额
  { action: 'update', id, ...fields }    → 修改资料
```

---

## 11. 审计日志 `/admin/audit-logs`（❌ 待建）

### 页面布局

```
┌──────────────────────────────────────────────────────────────────┐
│ 📋 审计日志（只读，不可删除）                                     │
├──────────────────────────────────────────────────────────────────┤
│ [操作类型▼ 全部] [目标类型▼ 全部] [时间范围▼ 近7天] [搜索______]  │
├──────────────────────────────────────────────────────────────────┤
│ 时间              | 操作者    | 操作    | 目标        | 详情           │ IP           │
│ 06-29 10:30      | 管理员    | approve | 资产 #45   | Asset #45 appr │ 116.x.x.x   │
│ 06-29 10:25      | 管理员    | update  | 配置       | hero_title 改… │ 116.x.x.x   │
│ 06-29 09:15      | 管理员    | login   | —          | 后台登录        │ 116.x.x.x   │
│ 06-28 16:42      | 管理员    | reject  | 资产 #41   | Asset #41 reje │ 116.x.x.x   │
│ 06-28 14:20      | 管理员    | delete  | 合伙人 #8  | Broker #8 dele │ 116.x.x.x   │
└──────────────────────────────────────────────────────────────────┘
```

### D1 表：admin_audit_logs

```
字段          类型        前端控件      说明
──────────────────────────────────────────────
id            INTEGER     隐藏         自增主键
admin_id      INTEGER     关联显示      操作者ID → 显示昵称
action        TEXT        彩色标签      login/update/delete/approve/ban
target_type   TEXT        标签          asset/user/config/broker
target_id     INTEGER     链接          目标ID（可点击跳转到对应管理页面）
detail        TEXT        文本          详情描述
ip_address    TEXT        文本          IP地址
created_at    TEXT        自动          操作时间
```

### 功能清单

| 功能 | 说明 |
|------|------|
| 列表 | 按时间倒序，分页（每页50条） |
| 筛选 | 按操作类型、目标类型、操作者、时间范围 |
| 搜索 | 关键词搜索 detail 字段 |
| 详情 | 点击行展开完整 detail |
| 操作类型颜色 | approve=绿、reject=红、delete=红、update=蓝、login=灰、ban=橙 |
| 目标链接 | target_type + target_id 可点击跳转到对应管理页面 |
| 导出 | "导出CSV"按钮（可选） |

### 权限控制

- **只读**：不可编辑、不可删除（审计日志只增不删是安全设计）
- superadmin + admin 可查看

### API

❌ 需新建 `/api/admin/audit-logs`

```
GET    /api/admin/audit-logs             → 列表（支持 action/target_type/admin_id/date_from/date_to/search/page 参数）
```

---

## 12. AI用量监控 `/admin/ai-usage`（❌ 待建）

### 页面布局

```
┌──────────────────────────────────────────────────────────────────┐
│ 🤖 AI 用量监控                                                   │
├──────────────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│ │ 今日消费  │ │ 本月消费  │ │ 总消费    │ │ 今日调用  │            │
│ │ ¥2.35    │ │ ¥48.20   │ │ ¥156.80  │ │ 23 次    │            │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘            │
├──────────────────────────────────────────────────────────────────┤
│ [每日预算上限]  [████████░░] ¥8.00 / ¥10.00  [修改] [重置熔断]  │
├──────────────────────────────────────────────────────────────────┤
│ 每日消费趋势（折线图，近30天）                                    │
│  ┌─────────────────────────────────────────────────────┐        │
│  │     *                                               │        │
│  │    * *     *                                        │        │
│  │   *   *   * *                                      │        │
│  │  *     * *   *                                     │        │
│  │ *              *                                   │        │
│  └─────────────────────────────────────────────────────┘        │
├──────────────────────────────────────────────────────────────────┤
│ 调用明细                                                          │
│ 时间              | 模型             | 输入Token | 输出Token | 费用    │
│ 06-29 10:30      | gemini-2.0-flash | 1,234    | 567      │ ¥0.03  │
│ 06-29 09:15      | gemini-2.0-flash | 2,345    | 890      │ ¥0.05  │
│ ...              | ...              | ...      | ...      │ ...    │
└──────────────────────────────────────────────────────────────────┘
```

### D1 表：ai_usage_log

```
字段          类型        前端控件      说明
──────────────────────────────────────────────
id            INTEGER     隐藏         自增主键
tokens_in     INTEGER     数字显示      输入tokens
tokens_out    INTEGER     数字显示      输出tokens
cost          REAL        金额显示      费用（元）
model         TEXT        文本显示      模型名称
created_at    TEXT        自动          调用时间
```

### 功能清单

| 功能 | 说明 |
|------|------|
| 统计卡片 | 今日消费、本月消费、总消费、今日调用次数 |
| 预算控制 | 显示当前每日预算上限 + 消费进度条 + "修改"按钮 + "重置熔断"按钮 |
| 趋势图 | 折线图展示近30天每日消费（可用简单的 div 柱状图实现，或引入 chart 库） |
| 调用明细 | 分页列表，按时间倒序 |
| 筛选 | 按模型、按时间范围 |
| 消费占比 | 按模型分组的消费占比（饼图或表格） |

### API

❌ 需新建 `/api/admin/ai-usage`

```
GET    /api/admin/ai-usage               → 统计数据 + 明细列表
  ?action=stats                          → 返回今日/本月/总消费统计
  ?action=list&page=1&limit=50           → 返回调用明细列表
  ?action=daily&days=30                  → 返回近N天每日消费趋势
POST   /api/admin/ai-usage               → 操作
  { action: 'set-budget', amount: 10 }   → 设置每日预算上限
  { action: 'reset-breaker' }            → 重置熔断状态
```

---

## 侧边栏导航（最终版）

```typescript
const NAV_ITEMS = [
  // —— 内容管控（admin + superadmin）——
  { icon: '📊', label: '运营控制台',     href: '/admin',               roles: ['admin', 'superadmin'] },
  { icon: '🏠', label: '资产管理',       href: '/admin/assets',        roles: ['admin', 'superadmin'] },
  { icon: '💰', label: '行情数据',       href: '/admin/market-data',   roles: ['admin', 'superadmin'] },
  { icon: '📡', label: '基建评分',       href: '/admin/infra-ratings', roles: ['admin', 'superadmin'] },
  { icon: '🗺️', label: '行政区划',       href: '/admin/regions',       roles: ['admin', 'superadmin'] },
  { icon: '🏷️', label: '资产类型',       href: '/admin/asset-types',   roles: ['admin', 'superadmin'] },
  { icon: '🤝', label: '合伙人管理',     href: '/admin/brokers',       roles: ['admin', 'superadmin'] },
  // —— 采集管控（admin + superadmin）——
  { icon: '🕷️', label: '爬虫管理',       href: '/admin/scrapers',      roles: ['admin', 'superadmin'] },
  { icon: '📥', label: '暂存数据',       href: '/admin/staging',       roles: ['admin', 'superadmin'] },
  // —— 系统管理（分级权限）——
  { icon: '👥', label: '用户管理',       href: '/admin/users',         roles: ['superadmin'] },
  { icon: '📋', label: '审计日志',       href: '/admin/audit-logs',    roles: ['admin', 'superadmin'] },
  { icon: '🤖', label: 'AI用量监控',     href: '/admin/ai-usage',      roles: ['admin', 'superadmin'] },
  { icon: '⚙️', label: '全局配置',       href: '/admin/config',        roles: ['superadmin'] },
];
```

---

## 开发顺序

```
第1周：数据字典管理
  Day 1-2: /admin/regions + /api/admin/regions（行政区划，树形展示）
  Day 3:   /admin/asset-types + /api/admin/asset-types（资产类型）
  Day 4-5: /admin/market-data 前端页面（API已有）

第2周：采集与基建
  Day 1-2: /admin/infra-ratings + /api/admin/infra-ratings
  Day 3-4: /admin/staging + /api/admin/staging + AI清洗流程
  Day 5:   /admin/scrapers 增强（编辑、测试抓取）

第3周：用户与监控
  Day 1-2: /admin/users + /api/admin/users
  Day 3:   /admin/audit-logs + /api/admin/audit-logs
  Day 4:   /admin/ai-usage + /api/admin/ai-usage
  Day 5:   /admin/assets 增强（新增/编辑表单、更多筛选）

第4周：收尾与联调
  Day 1-2: /admin 运营控制台增强（统计真实化、快捷入口）
  Day 3-4: 权限控制联调（侧边栏按角色显示、API鉴权）
  Day 5:   全量测试 + Bug修复
```
