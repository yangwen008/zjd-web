# 大宗路演独立表 — 全链路变更规划

> 核心决策：大宗路演从 `assets` 表独立出来，新建 `bulk_projects` 表
> 影响范围：14 个文件（4 新建 + 10 修改）

---

## 变更全景图

```
变更类型    文件路径                                        说明
─────────────────────────────────────────────────────────────────────
新建        sql/schema.sql (追加)                           建表语句
新建        sql/seed.sql (追加)                             种子数据
新建        app/api/admin/bulk-projects/route.ts            管理员 API
新建        app/admin/bulk-projects/page.tsx                管理员页面
新建        app/bulk-projects/[id]/page.tsx                 详情页

修改        lib/data.ts                                     数据访问层
修改        lib/test-home-data.ts                           接口定义 + 清理 Mock
修改        app/page.tsx                                    首页大宗路演板块
修改        app/bulk-projects/page.tsx                       列表页重写
修改        components/test-home/BulkProjectCard.tsx         卡片组件适配
修改        app/admin/layout.tsx                            侧边栏加菜单
修改        app/admin/page.tsx                              控制台统计
修改        app/api/admin/assets/route.ts                   移除 featured 逻辑
修改        sql/schema.sql                                  assets 表清理 featured
```

---

## 第 1 步：D1 数据库

### 1.1 新建 `bulk_projects` 表（schema.sql 追加）

```sql
-- 15. 大宗路演项目表
CREATE TABLE IF NOT EXISTS bulk_projects (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  title             TEXT NOT NULL,               -- 项目标题
  code              TEXT,                        -- 项目编号（如 ZJD-001）
  description       TEXT,                        -- 项目描述
  location          TEXT,                        -- 完整地址
  province          TEXT,                        -- 省份
  city              TEXT,                        -- 城市
  district          TEXT,                        -- 区县
  area_mu           REAL,                        -- 占地面积（亩）
  area_sqm          REAL,                        -- 建筑面积（㎡）
  price_total       REAL,                        -- 总价（万元）
  price_start       REAL,                        -- 起始价（万元/年）
  yield_rate        REAL,                        -- 年收益率（%）
  lease_years       INTEGER,                     -- 流转年限
  certification     TEXT DEFAULT 'uncertified',  -- 确权状态：certified/pending/uncertified
  planning_use      TEXT,                        -- 规划用途（文旅/康养/农业/商业）
  images            TEXT,                        -- JSON数组：图片URL列表
  video_url         TEXT,                        -- 视频URL
  commercial_plan   TEXT,                        -- 商业规划书URL（R2私有路径）
  cert_doc_url      TEXT,                        -- 确权证书URL（R2私有路径）
  gps_lat           REAL,                        -- 纬度
  gps_lng           REAL,                        -- 经度
  contact_name      TEXT,                        -- 联系人
  contact_phone     TEXT,                        -- 联系电话（加密）
  views             INTEGER DEFAULT 0,           -- 浏览量
  status            TEXT DEFAULT 'pending',      -- pending/approved/rejected
  featured          INTEGER DEFAULT 0,           -- 是否首页推荐
  user_id           INTEGER,                     -- 发布者ID
  created_at        TEXT DEFAULT (datetime('now')),
  updated_at        TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_bulk_province ON bulk_projects(province);
CREATE INDEX IF NOT EXISTS idx_bulk_status ON bulk_projects(status);
CREATE INDEX IF NOT EXISTS idx_bulk_featured ON bulk_projects(featured, status);
CREATE INDEX IF NOT EXISTS idx_bulk_views ON bulk_projects(views DESC);
```

### 1.2 assets 表清理（schema.sql 修改）

```diff
- featured      INTEGER DEFAULT 0, -- 是否橱窗推荐
+ -- featured 字段保留但不再用于大宗路演，仅用于普通资产橱窗推荐
+ featured      INTEGER DEFAULT 0, -- 橱窗推荐（与大宗路演无关）
```

**注意**：`featured` 字段保留在 assets 表，但语义变更为"普通资产橱窗推荐"，不再承担大宗路演功能。

### 1.3 种子数据（seed.sql 追加）

```sql
-- 10. 大宗路演项目
INSERT OR IGNORE INTO bulk_projects (title, code, description, location, province, city, district, area_mu, area_sqm, price_start, yield_rate, lease_years, certification, planning_use, images, gps_lat, gps_lng, contact_phone, contact_name, views, status, featured, user_id) VALUES
('莫干山辐射圈 · 闲置集体村办小学校舍整栋流转招商', 'ZJD-001', '包含完整苏式红砖多功能空间、宽敞院落。权属已归属乡村经济合作社，AI测算黄金投资回报周期约5.8年。', '浙江省湖州市德清县莫干山镇', '浙江省', '湖州市', '德清县', 15.0, 1220, 15.0, 6.80, 30, 'certified', '文旅', '["https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800"]', 30.55, 119.92, '13800004001', '莫干山镇合作社', 8920, 'approved', 1, 1),
('都江堰青城山旁 · 45亩传统梯田茶园配3栋闲置库房', 'ZJD-0055', '首期已由村委办协调完成林地林权排他性测绘，提供小溪及微水电野奢级配接入方案。适合品牌文旅民宿带开发。', '四川省成都市都江堰市青城山镇', '四川省', '成都市', '都江堰市', 45.0, 1300, 18.5, 6.80, 30, 'certified', '康养', '["https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800"]', 30.90, 103.58, '13800004002', '青城山镇合作社', 7650, 'approved', 1, 1);
```

---

## 第 2 步：数据访问层 `lib/data.ts`

### 2.1 新增接口定义

```typescript
// 大宗路演项目
export interface BulkProject {
  id: number;
  title: string;
  code: string | null;
  description: string | null;
  location: string | null;
  province: string | null;
  city: string | null;
  district: string | null;
  area_mu: number | null;
  area_sqm: number | null;
  price_total: number | null;
  price_start: number | null;
  yield_rate: number | null;
  lease_years: number | null;
  certification: string;
  planning_use: string | null;
  images: string | null;
  video_url: string | null;
  commercial_plan: string | null;
  cert_doc_url: string | null;
  gps_lat: number | null;
  gps_lng: number | null;
  contact_name: string | null;
  contact_phone: string | null;
  views: number;
  status: string;
  featured: number;
  user_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface BulkProjectFilters {
  province?: string;
  status?: string;
  featured?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}
```

### 2.2 新增查询函数

```typescript
// ============ 大宗路演 ============

export async function getBulkProjects(params: BulkProjectFilters = {}): Promise<BulkProject[]> {
  const { province, status = 'approved', featured, search, page = 1, limit = 20 } = params;
  const limitNum = Math.min(limit, 50);
  let sql = 'SELECT * FROM bulk_projects WHERE status = ?';
  const args: unknown[] = [status];
  if (province) { sql += ' AND province = ?'; args.push(province); }
  if (featured) { sql += ' AND featured = 1'; }
  if (search) { sql += ' AND (title LIKE ? OR description LIKE ? OR location LIKE ?)'; const q = `%${search}%`; args.push(q, q, q); }
  sql += ' ORDER BY featured DESC, views DESC LIMIT ? OFFSET ?';
  args.push(limitNum, (page - 1) * limitNum);
  return query<BulkProject>(sql, ...args);
}

export async function getBulkProjectsCount(params: BulkProjectFilters = {}): Promise<number> {
  const { province, status = 'approved', featured, search } = params;
  let sql = 'SELECT COUNT(*) as count FROM bulk_projects WHERE status = ?';
  const args: unknown[] = [status];
  if (province) { sql += ' AND province = ?'; args.push(province); }
  if (featured) { sql += ' AND featured = 1'; }
  if (search) { sql += ' AND (title LIKE ? OR description LIKE ? OR location LIKE ?)'; const q = `%${search}%`; args.push(q, q, q); }
  const row = await queryOne<{ count: number }>(sql, ...args);
  return row?.count || 0;
}

export async function getBulkProjectById(id: number | string): Promise<BulkProject | null> {
  return queryOne<BulkProject>(
    'SELECT * FROM bulk_projects WHERE id = ? AND status = ?',
    id, 'approved'
  );
}

export async function getFeaturedBulkProjects(limit: number = 2): Promise<BulkProject[]> {
  return query<BulkProject>(
    'SELECT * FROM bulk_projects WHERE status = ? AND featured = 1 ORDER BY views DESC LIMIT ?',
    'approved', limit
  );
}

export async function incrementBulkViews(id: number | string): Promise<void> {
  await queryOne('UPDATE bulk_projects SET views = views + 1 WHERE id = ?', id);
}
```

### 2.3 清理不再需要的函数

```diff
- // 可保留但不再用于大宗路演
- export async function getFeaturedAssets(limit: number = 6): Promise<Asset[]> {
-   return query<Asset>(
-     'SELECT * FROM assets WHERE status = ? AND featured = 1 ORDER BY views DESC LIMIT ?',
-     'approved', limit
-   );
- }
+ // getFeaturedAssets 保留，仅用于普通资产橱窗推荐，不再用于大宗路演
```

---

## 第 3 步：前端页面

### 3.1 首页大宗路演板块 `app/page.tsx`

**当前逻辑**：`getFeaturedAssets(2)` → 读取 assets.featured=1 的资产
**改为**：`getFeaturedBulkProjects(2)` → 读取 bulk_projects 表

```diff
- import { getFeaturedAssets, ... } from "@/lib/data";
+ import { getFeaturedBulkProjects, ... } from "@/lib/data";
+ import type { BulkProject } from "@/lib/data";

- const [hotAssets, marketData, officialAssets, villageAssets, bulkAssets, infraRatings, brokers, config] = await Promise.all([
+ const [hotAssets, marketData, officialAssets, villageAssets, bulkProjectsData, infraRatings, brokers, config] = await Promise.all([
    getHotAssets(6).catch(() => [] as Asset[]),
    getMarketData().catch(() => [] as MarketData[]),
    getAssetsBySource('official', 6).catch(() => [] as Asset[]),
    getAssetsBySource('village', 2).catch(() => [] as Asset[]),
-   getFeaturedAssets(2).catch(() => [] as Asset[]),
+   getFeaturedBulkProjects(2).catch(() => [] as BulkProject[]),
    getInfraRatings().catch(() => [] as InfraRating[]),
    getBrokers(3).catch(() => [] as Broker[]),
    getHomepageConfig().catch(() => ({} as Record<string, string>)),
  ]);

- const bulkProjects = bulkAssets.map(a => toBulkFormat(a, defaultImage));
+ // 直接使用 BulkProject 数据，无需转换
+ const bulkProjects = bulkProjectsData.map(bp => ({
+   id: bp.id.toString(),
+   code: bp.code || `ZJD-${bp.id.toString().padStart(3, '0')}`,
+   title: bp.title,
+   description: bp.description || '',
+   area: bp.area_sqm ? `约${bp.area_sqm}㎡` : (bp.area_mu ? `约${Math.round(bp.area_mu * 666.7)}㎡` : '-'),
+   yieldRate: bp.yield_rate ? `${bp.yield_rate}%` : '-',
+   price: bp.price_start ? `¥${bp.price_start}万/年起` : (bp.price_total ? `¥${bp.price_total}万` : '价格面议'),
+   hasCertificate: bp.certification === 'certified',
+ }));

- // 删除 toBulkFormat 函数（不再需要）
```

### 3.2 列表页重写 `app/bulk-projects/page.tsx`

**当前逻辑**：`getAssetsBySource('official', 10)` — 读的是官方原矿资产
**改为**：`getBulkProjects()` — 读取 bulk_projects 表

```diff
- import { getAssetsBySource, getHomepageConfig } from '@/lib/data';
+ import { getBulkProjects, getHomepageConfig } from '@/lib/data';
+ import type { BulkProject } from '@/lib/data';

- const [projects, config] = await Promise.all([
-   getAssetsBySource('official', 10).catch(() => []),
+ const [projects, config] = await Promise.all([
+   getBulkProjects({ limit: 20 }).catch(() => [] as BulkProject[]),
    getHomepageConfig().catch(() => ({})),
  ]);
```

页面卡片展示字段也需更新：

| 当前字段 | 改为 |
|---------|------|
| `p.area_mu` | `p.area_sqm \|\| p.area_mu` |
| `p.price_year` | `p.price_start` |
| `p.lease_years` | `p.lease_years` |
| `p.source_type` 标签 | `p.planning_use` 标签（文旅/康养/农业） |
| `p.description` | `p.description` |
| `p.views` | `p.views` |

### 3.3 新建详情页 `app/bulk-projects/[id]/page.tsx`

```
/bulk-projects/[id] — 大宗项目详情页

页面布局：
┌─────────────────────────────────────────────────────┐
│ 面包屑：首页 / 大宗路演 / 项目详情                    │
├─────────────────────────────────────────────────────┤
│                                                      │
│ 项目编号：ZJD-001          状态：已确权 ✓             │
│ 标题：莫干山辐射圈 · 闲置集体村办小学校舍整栋流转招商  │
│ 地址：浙江省湖州市德清县莫干山镇                      │
│                                                      │
├──────────────┬──────────────────────────────────────┤
│              │                                       │
│  [图片轮播]   │  核心指标（4宫格）                     │
│              │  ┌─────────┬─────────┐               │
│              │  │ 占地面积 │ 建筑面积 │               │
│              │  │ 15 亩   │ 1220 ㎡ │               │
│              │  ├─────────┼─────────┤               │
│              │  │ 年收益率 │ 流转年限 │               │
│              │  │ 6.80%   │ 30 年   │               │
│              │  └─────────┴─────────┘               │
│              │                                       │
│              │  价格：¥15.0万/年起                    │
│              │  规划用途：文旅                        │
│              │  确权状态：已确权                       │
│              │                                       │
│              │  [微信一键安全授权解锁联系方式]          │
│              │                                       │
├──────────────┴──────────────────────────────────────┤
│                                                      │
│ 项目描述                                             │
│ 包含完整苏式红砖多功能空间、宽敞院落...               │
│                                                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│ 基础设施配套（从 infrastructure_ratings 读取）        │
│                                                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│ 附件（需解锁后查看）                                 │
│ 📄 商业规划书 [点击解锁查看]                          │
│ 📄 确权证书   [点击解锁查看]                          │
│                                                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│ 相似推荐                                             │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### 3.4 卡片组件适配 `components/test-home/BulkProjectCard.tsx`

**当前**：从 `lib/test-home-data.ts` 的 `BulkProject` 接口读取
**改为**：从 `lib/data.ts` 的 `BulkProject` 接口读取

```diff
- import { BulkProject } from "@/lib/test-home-data";
+ import { BulkProject } from "@/lib/data";

- interface BulkProject { id, code, title, description, area, yieldRate, price, hasCertificate }
+ // 接口字段变化：
+ // area → area_sqm || area_mu（需格式化）
+ // yieldRate → yield_rate（需加%）
+ // price → price_start（需加¥和万/年起）
+ // hasCertificate → certification === 'certified'
```

---

## 第 4 步：管理员后台

### 4.1 新建 API `app/api/admin/bulk-projects/route.ts`

```
GET    /api/admin/bulk-projects          → 列表（支持 status/province/featured/search/page）
POST   /api/admin/bulk-projects          → 操作
  { action: 'add', ...fields }           → 新增
  { action: 'update', id, ...fields }    → 更新
  { action: 'delete', id }               → 删除
  { action: 'toggle-featured', id, featured } → 推荐/取消推荐
  { action: 'update-status', id, status } → 审核（approved/rejected）
```

### 4.2 新建管理页面 `app/admin/bulk-projects/page.tsx`

```
/admin/bulk-projects — 大宗路演项目管理

┌──────────────────────────────────────────────────────────────────┐
│ 🏢 大宗路演项目管理                                  [+ 新增]    │
├──────────────────────────────────────────────────────────────────┤
│ [状态▼ 全部] [省份▼ 全部] [搜索___________]  共 2 条数据         │
├──────────────────────────────────────────────────────────────────┤
│ ID    | 编号      | 标题                    | 省份   | 收益率 | 状态 | 推荐 | 操作         │
│ #1    | ZJD-001  | 莫干山辐射圈·校舍流转     | 浙江省 | 6.80% | ✅   | ⭐  | 编辑 审核 删除│
│ #2    | ZJD-0055 | 都江堰青城山·茶园流转     | 四川省 | 6.80% | ✅   | ⭐  | 编辑 审核 删除│
└──────────────────────────────────────────────────────────────────┘

新增/编辑表单字段：
  title             → 项目标题（文本，必填）
  code              → 项目编号（文本，如 ZJD-001）
  description       → 项目描述（文本域）
  province          → 省份（下拉）
  city              → 城市（下拉，联动）
  district          → 区县（下拉，联动）
  location          → 详细地址（文本）
  area_mu           → 占地面积/亩（数字）
  area_sqm          → 建筑面积/㎡（数字）
  price_start       → 起始价/万每年（数字）
  price_total       → 总价/万（数字）
  yield_rate        → 年收益率/%（数字）
  lease_years       → 流转年限（数字）
  certification     → 确权状态（下拉：certified/pending/uncertified）
  planning_use      → 规划用途（下拉：文旅/康养/农业/商业）
  images            → 图片（多图上传到 R2）
  video_url         → 视频URL（文本）
  commercial_plan   → 商业规划书（文件上传到 R2 /private/）
  cert_doc_url      → 确权证书（文件上传到 R2 /private/）
  contact_name      → 联系人（文本）
  contact_phone     → 联系电话（文本，加密存储）
  gps_lat           → 纬度（数字）
  gps_lng           → 经度（数字）
  featured          → 首页推荐（开关）
  status            → 状态（下拉：pending/approved/rejected）
```

### 4.3 侧边栏加菜单 `app/admin/layout.tsx`

```diff
  const NAV_ITEMS = [
    { icon: '📊', label: '运营控制台', href: '/admin' },
    { icon: '🏠', label: '资产审核', href: '/admin/assets' },
+   { icon: '🏢', label: '大宗路演', href: '/admin/bulk-projects' },
    { icon: '🛰️', label: '爬虫管理', href: '/admin/scrapers' },
    { icon: '⚙️', label: '全局配置', href: '/admin/config' },
  ];
```

### 4.4 控制台统计更新 `app/admin/page.tsx`

```diff
+ // 新增大宗项目统计
+ const bulkCount = await queryOne<{ total: number; pending: number }>(
+   `SELECT COUNT(*) as total, SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) as pending FROM bulk_projects`
+ );

  // 统计卡片增加大宗项目
  { label: '大宗项目', value: bulkCount?.total || 0, icon: '🏢', color: 'text-yellow-500' },
```

---

## 第 5 步：清理与适配

### 5.1 移除 assets 表的 featured 用于大宗路演的逻辑

`app/api/admin/assets/route.ts` 中的 `toggle-featured` 保留，但语义变为"普通资产橱窗推荐"，不再关联大宗路演。

### 5.2 清理 lib/test-home-data.ts

```diff
- export interface BulkProject {
-   id: string; code: string; title: string; description: string;
-   area: string; yieldRate: string; price: string; hasCertificate: boolean;
- }
- export const mockBulkProjects: BulkProject[] = [...]
+ // 删除 mockBulkProjects 和相关接口
+ // BulkProject 接口移到 lib/data.ts
```

### 5.3 assets 表的 featured 字段处理

- **保留** `featured` 字段在 assets 表，用于普通资产的橱窗推荐
- **不再** 用 featured=1 来标识大宗路演项目
- 已有的种子数据中 featured=1 的资产，语义变为"橱窗推荐"而非"大宗路演"

---

## 变更文件清单（14 个）

| # | 操作 | 文件 | 变更内容 |
|---|------|------|---------|
| 1 | 追加 | `sql/schema.sql` | 新增 bulk_projects 建表语句 + 索引 |
| 2 | 追加 | `sql/seed.sql` | 新增 2 条大宗路演种子数据 |
| 3 | 新建 | `app/api/admin/bulk-projects/route.ts` | 管理员 CRUD API |
| 4 | 新建 | `app/admin/bulk-projects/page.tsx` | 管理员管理页面 |
| 5 | 新建 | `app/bulk-projects/[id]/page.tsx` | 大宗项目详情页 |
| 6 | 修改 | `lib/data.ts` | 新增 BulkProject 接口 + 5 个查询函数 |
| 7 | 修改 | `lib/test-home-data.ts` | 删除 mock BulkProject 数据和接口 |
| 8 | 修改 | `app/page.tsx` | 首页大宗路演板块改用 getFeaturedBulkProjects |
| 9 | 重写 | `app/bulk-projects/page.tsx` | 列表页改用 bulk_projects 表 |
| 10 | 修改 | `components/test-home/BulkProjectCard.tsx` | 适配新接口字段 |
| 11 | 修改 | `app/admin/layout.tsx` | 侧边栏增加"大宗路演"菜单 |
| 12 | 修改 | `app/admin/page.tsx` | 控制台增加大宗项目统计 |
| 13 | 不变 | `app/api/admin/assets/route.ts` | toggle-featured 保留，语义变更为橱窗推荐 |
| 14 | 不变 | `sql/schema.sql` assets 表 | featured 字段保留，语义变更 |

---

## 开发顺序

```
1. schema.sql + seed.sql（建表 + 种子数据）
2. lib/data.ts（接口 + 查询函数）
3. app/api/admin/bulk-projects/route.ts（API）
4. app/admin/bulk-projects/page.tsx（管理页面）
5. app/admin/layout.tsx（侧边栏）
6. app/page.tsx（首页板块）
7. app/bulk-projects/page.tsx（列表页重写）
8. app/bulk-projects/[id]/page.tsx（详情页）
9. components/test-home/BulkProjectCard.tsx（卡片适配）
10. lib/test-home-data.ts（清理 Mock）
11. app/admin/page.tsx（统计更新）
12. D1 执行 schema + seed → 测试全链路
```

---

## 需同步执行的 D1 操作

```bash
# 1. 在线上 D1 创建 bulk_projects 表
wrangler d1 execute zjd-main --command "
CREATE TABLE IF NOT EXISTS bulk_projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  code TEXT,
  description TEXT,
  location TEXT,
  province TEXT,
  city TEXT,
  district TEXT,
  area_mu REAL,
  area_sqm REAL,
  price_total REAL,
  price_start REAL,
  yield_rate REAL,
  lease_years INTEGER,
  certification TEXT DEFAULT 'uncertified',
  planning_use TEXT,
  images TEXT,
  video_url TEXT,
  commercial_plan TEXT,
  cert_doc_url TEXT,
  gps_lat REAL,
  gps_lng REAL,
  contact_name TEXT,
  contact_phone TEXT,
  views INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  featured INTEGER DEFAULT 0,
  user_id INTEGER,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
"

# 2. 创建索引
wrangler d1 execute zjd-main --command "CREATE INDEX IF NOT EXISTS idx_bulk_province ON bulk_projects(province);"
wrangler d1 execute zjd-main --command "CREATE INDEX IF NOT EXISTS idx_bulk_status ON bulk_projects(status);"
wrangler d1 execute zjd-main --command "CREATE INDEX IF NOT EXISTS idx_bulk_featured ON bulk_projects(featured, status);"
wrangler d1 execute zjd-main --command "CREATE INDEX IF NOT EXISTS idx_bulk_views ON bulk_projects(views DESC);"

# 3. 插入种子数据
wrangler d1 execute zjd-main --file=./sql/seed-bulk.sql
```
