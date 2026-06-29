# 用户后台规划 v2.0 — 修正版

> 基于千问 10 个重大问题的全面修正

---

## 一、角色体系统一命名

### 1.1 修正前 vs 修正后

| 修正前（混乱） | 修正后（统一） | 说明 |
|---------------|--------------|------|
| `buyer` | `user` | 普通注册用户 |
| `broker` | `broker` | 合伙人（保留） |
| `village` | `village_org` | 村集体/政府机构 |
| `infra_editor` | `data_editor` | 数据录入员（基建/行情等） |
| `bulk_publisher` | `project_publisher` | 大宗项目发布者 |
| `admin` | `admin` | 平台运营（保留） |
| `superadmin` | `superadmin` | 超级管理员（保留） |

### 1.2 角色定义表

```sql
-- 新增 roles 表（角色定义）
CREATE TABLE roles (
  code        TEXT PRIMARY KEY,     -- 角色代码
  name        TEXT NOT NULL,        -- 显示名称
  description TEXT,                 -- 描述
  level       INTEGER DEFAULT 0,    -- 权限等级（数字越大权限越高）
  is_system   INTEGER DEFAULT 0,    -- 是否系统内置（不可删除）
  created_at  TEXT DEFAULT (datetime('now'))
);

INSERT INTO roles (code, name, description, level, is_system) VALUES
  ('user',            '普通用户',     '浏览、收藏、发布UGC资产',           10, 1),
  ('broker',          '合伙人',       '发布房源、查看线索',                20, 1),
  ('village_org',     '村集体',       '发布村委直发资产、查看线索',         20, 1),
  ('data_editor',     '数据录入员',   '录入基建/行情等数据',               15, 1),
  ('project_publisher','项目发布者',  '发布大宗路演项目',                  25, 1),
  ('admin',           '平台运营',     '资产审核、内容维护、数据管理',       50, 1),
  ('superadmin',      '超级管理员',   '系统管理、用户管理、全局配置',       100, 1);
```

### 1.3 用户表角色字段

```sql
-- users 表修改
role          TEXT DEFAULT 'user'   -- 当前生效角色
role_apply    TEXT,                  -- 申请的角色（注册时填，待审核）
role_approved_at TEXT,              -- 角色审批时间
role_approved_by INTEGER,           -- 审批人ID
```

---

## 二、权限矩阵（RBAC 模型）

### 2.1 权限定义

```sql
-- permissions 表
CREATE TABLE permissions (
  code        TEXT PRIMARY KEY,     -- 权限代码：模块:动作
  name        TEXT NOT NULL,        -- 权限名称
  module      TEXT NOT NULL,        -- 所属模块
  description TEXT
);

-- 权限清单
INSERT INTO permissions (code, name, module, description) VALUES
  -- 资产模块
  ('asset:create',          '发布资产',         'asset', '创建新资产记录'),
  ('asset:create:official', '发布官方原矿',     'asset', '创建source_type=official的资产'),
  ('asset:create:village',  '发布村委直发',     'asset', '创建source_type=village的资产'),
  ('asset:create:ugc',      '发布UGC资产',      'asset', '创建source_type=ugc的资产'),
  ('asset:read',            '查看所有资产',     'asset', '查看所有用户的资产'),
  ('asset:read:own',        '查看自己的资产',   'asset', '仅查看自己发布的资产'),
  ('asset:update',          '编辑所有资产',     'asset', '编辑任何资产'),
  ('asset:update:own',      '编辑自己的资产',   'asset', '仅编辑自己发布的资产'),
  ('asset:delete',          '删除所有资产',     'asset', '删除任何资产'),
  ('asset:delete:own',      '删除自己的资产',   'asset', '仅删除自己发布的资产'),
  ('asset:audit',           '审核资产',         'asset', '批准/拒绝待审核资产'),
  ('asset:feature',         '橱窗推荐',         'asset', '设置featured推荐标记'),
  
  -- 大宗项目模块
  ('bulk:create',           '发布大宗项目',     'bulk', '创建大宗路演项目'),
  ('bulk:read',             '查看所有大宗项目', 'bulk', '查看所有大宗项目'),
  ('bulk:read:own',         '查看自己的大宗项目','bulk', '仅查看自己发布的大宗项目'),
  ('bulk:update',           '编辑所有大宗项目', 'bulk', '编辑任何大宗项目'),
  ('bulk:update:own',       '编辑自己的大宗项目','bulk', '仅编辑自己发布的大宗项目'),
  ('bulk:delete',           '删除大宗项目',     'bulk', '删除大宗项目'),
  ('bulk:audit',            '审核大宗项目',     'bulk', '审核待发布的大宗项目'),
  
  -- 基建数据模块
  ('infra:create',          '录入基建数据',     'infra', '创建基建评分记录'),
  ('infra:read',            '查看所有基建数据', 'infra', '查看所有基建评分'),
  ('infra:read:own',        '查看负责区域基建', 'infra', '仅查看自己负责区域的基建数据'),
  ('infra:update',          '编辑所有基建数据', 'infra', '编辑任何基建评分'),
  ('infra:update:own',      '编辑负责区域基建', 'infra', '仅编辑自己负责区域的基建数据'),
  ('infra:audit',           '审核基建数据',     'infra', '审核待发布的基建数据'),
  
  -- 行情数据模块
  ('market:create',         '录入行情数据',     'market', '创建行情数据记录'),
  ('market:read',           '查看行情数据',     'market', '查看行情数据'),
  ('market:update',         '编辑行情数据',     'market', '编辑行情数据'),
  ('market:delete',         '删除行情数据',     'market', '删除行情数据'),
  
  -- 合伙人模块
  ('partner:create',        '新增合伙人',       'partner', '创建合伙人记录'),
  ('partner:read',          '查看所有合伙人',   'partner', '查看所有合伙人'),
  ('partner:update',        '编辑合伙人',       'partner', '编辑合伙人信息'),
  ('partner:delete',        '删除合伙人',       'partner', '删除合伙人'),
  ('partner:audit',         '审核合伙人',       'partner', '审核合伙人申请'),
  
  -- 用户模块
  ('user:read',             '查看所有用户',     'user', '查看用户列表'),
  ('user:update',           '编辑用户',         'user', '编辑用户信息'),
  ('user:assign_role',      '分配角色',         'user', '修改用户角色'),
  ('user:ban',              '封禁用户',         'user', '封禁/解封用户'),
  ('user:audit',            '审核用户注册',     'user', '审核角色申请'),
  
  -- 线索模块
  ('lead:read:own',         '查看自己的线索',   'lead', '仅查看与自己资产相关的线索'),
  ('lead:read',             '查看所有线索',     'lead', '查看所有线索'),
  ('lead:assign',           '分配线索',         'lead', '将线索分配给合伙人'),
  
  -- 收藏模块
  ('favorite:manage',       '管理收藏',         'favorite', '添加/取消收藏'),
  
  -- 爬虫模块
  ('scraper:manage',        '管理爬虫配方',     'scraper', '增删改查爬虫配方'),
  ('scraper:execute',       '执行爬虫',         'scraper', '手动触发爬虫'),
  
  -- 暂存数据模块
  ('staging:manage',        '管理暂存数据',     'staging', '清洗/导入/删除暂存数据'),
  
  -- 配置模块
  ('config:read',           '查看配置',         'config', '查看系统配置'),
  ('config:update',         '修改配置',         'config', '修改系统配置'),
  
  -- 审计模块
  ('audit:read',            '查看审计日志',     'audit', '查看审计日志'),
  
  -- AI模块
  ('ai:read',               '查看AI用量',       'ai', '查看AI用量统计'),
  ('ai:config',             '配置AI参数',       'ai', '配置AI预算和参数');
```

### 2.2 角色-权限映射表

```sql
CREATE TABLE role_permissions (
  role        TEXT NOT NULL,
  permission  TEXT NOT NULL,
  PRIMARY KEY (role, permission),
  FOREIGN KEY (role) REFERENCES roles(code),
  FOREIGN KEY (permission) REFERENCES permissions(code)
);

-- user（普通用户）
INSERT INTO role_permissions VALUES
  ('user', 'asset:create:ugc'),
  ('user', 'asset:read:own'),
  ('user', 'asset:update:own'),
  ('user', 'asset:delete:own'),
  ('user', 'favorite:manage'),
  ('user', 'lead:read:own');

-- broker（合伙人）
INSERT INTO role_permissions VALUES
  ('broker', 'asset:create:ugc'),
  ('broker', 'asset:read:own'),
  ('broker', 'asset:update:own'),
  ('broker', 'asset:delete:own'),
  ('broker', 'lead:read:own'),
  ('broker', 'favorite:manage');

-- village_org（村集体）
INSERT INTO role_permissions VALUES
  ('village_org', 'asset:create:village'),
  ('village_org', 'asset:create:ugc'),
  ('village_org', 'asset:read:own'),
  ('village_org', 'asset:update:own'),
  ('village_org', 'asset:delete:own'),
  ('village_org', 'lead:read:own'),
  ('village_org', 'favorite:manage');

-- data_editor（数据录入员）
INSERT INTO role_permissions VALUES
  ('data_editor', 'infra:create'),
  ('data_editor', 'infra:read:own'),
  ('data_editor', 'infra:update:own'),
  ('data_editor', 'market:create'),
  ('data_editor', 'market:read');

-- project_publisher（项目发布者）
INSERT INTO role_permissions VALUES
  ('project_publisher', 'bulk:create'),
  ('project_publisher', 'bulk:read:own'),
  ('project_publisher', 'bulk:update:own'),
  ('project_publisher', 'bulk:delete');

-- admin（平台运营）
INSERT INTO role_permissions VALUES
  ('admin', 'asset:create'), ('admin', 'asset:create:official'), ('admin', 'asset:create:village'), ('admin', 'asset:create:ugc'),
  ('admin', 'asset:read'), ('admin', 'asset:update'), ('admin', 'asset:delete'), ('admin', 'asset:audit'), ('admin', 'asset:feature'),
  ('admin', 'bulk:create'), ('admin', 'bulk:read'), ('admin', 'bulk:update'), ('admin', 'bulk:audit'),
  ('admin', 'infra:create'), ('admin', 'infra:read'), ('admin', 'infra:update'), ('admin', 'infra:audit'),
  ('admin', 'market:create'), ('admin', 'market:read'), ('admin', 'market:update'), ('admin', 'market:delete'),
  ('admin', 'partner:create'), ('admin', 'partner:read'), ('admin', 'partner:update'), ('admin', 'partner:audit'),
  ('admin', 'user:read'), ('admin', 'user:audit'), ('admin', 'user:ban'),
  ('admin', 'lead:read'), ('admin', 'lead:assign'),
  ('admin', 'scraper:manage'), ('admin', 'scraper:execute'),
  ('admin', 'staging:manage'),
  ('admin', 'config:read'), ('admin', 'config:update'),
  ('admin', 'audit:read'),
  ('admin', 'ai:read');

-- superadmin（超级管理员）— 拥有所有权限
INSERT INTO role_permissions (role, permission)
  SELECT 'superadmin', code FROM permissions;
```

### 2.3 权限检查工具函数

```typescript
// lib/auth.ts

// 获取用户的所有权限
export async function getUserPermissions(userId: number): Promise<string[]> {
  const user = await queryOne<{ role: string }>('SELECT role FROM users WHERE id = ?', userId);
  if (!user) return [];
  
  const perms = await query<{ permission: string }>(
    'SELECT permission FROM role_permissions WHERE role = ?',
    user.role
  );
  return perms.map(p => p.permission);
}

// 检查用户是否有某权限
export async function hasPermission(userId: number, permission: string): Promise<boolean> {
  const perms = await getUserPermissions(userId);
  return perms.includes(permission);
}

// API 中间件：要求特定权限
export function requirePermission(permission: string) {
  return async (request: Request) => {
    const user = await getUserFromSession(request);
    if (!user) throw new Error('Unauthorized');
    if (!await hasPermission(user.id, permission)) throw new Error('Forbidden');
    return user;
  };
}
```

---

## 三、审核状态机

### 3.1 统一状态定义

```typescript
// 所有可审核内容的统一状态
type ContentStatus = 
  | 'draft'      // 草稿（用户保存但未提交）
  | 'pending'    // 待审核（已提交，等待管理员审核）
  | 'approved'   // 已通过（前台可见）
  | 'rejected'   // 已拒绝（需修改后重新提交）
  | 'banned'     // 已封禁（管理员强制下架）
  | 'archived';  // 已归档（下架但不删除）
```

### 3.2 状态流转图

```
                    ┌─────────────────────────────────────┐
                    │           状态流转规则               │
                    └─────────────────────────────────────┘

用户操作：
  [保存草稿] → draft
  [提交审核] → pending

管理员操作：
  [审核通过] → approved
  [审核拒绝] → rejected（附拒绝原因）
  [强制下架] → banned（附封禁原因）
  [归档]    → archived

用户操作：
  [修改重提] rejected → pending
  [撤回]    pending → draft
  [重新上架] archived → pending

自动流转：
  [超时未审] pending（超过7天）→ 通知管理员
```

### 3.3 审核记录表

```sql
CREATE TABLE audit_reviews (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  target_type   TEXT NOT NULL,         -- asset/bulk_project/infra_rating/user
  target_id     INTEGER NOT NULL,
  action        TEXT NOT NULL,         -- submit/approve/reject/ban/archive
  from_status   TEXT,
  to_status     TEXT NOT NULL,
  reviewer_id   INTEGER,               -- 审核人ID（用户提交时为空）
  reason        TEXT,                  -- 拒绝/封禁原因
  created_at    TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (reviewer_id) REFERENCES users(id)
);

CREATE INDEX idx_reviews_target ON audit_reviews(target_type, target_id);
CREATE INDEX idx_reviews_reviewer ON audit_reviews(reviewer_id);
```

---

## 四、数据隔离规则（分层）

### 4.1 隔离层级

```
Level 5: superadmin  → 看所有数据，可修改一切
Level 4: admin       → 看所有业务数据，不可修改系统配置
Level 3: project_publisher → 看自己的大宗项目 + 公开数据
Level 2: broker/village_org → 看自己的资产/线索 + 公开数据
Level 1: data_editor → 看自己负责区域的数据 + 公开数据
Level 0: user        → 看自己的资产/收藏 + 公开数据
```

### 4.2 SQL 隔离模板

```typescript
// lib/data-isolation.ts

export function buildDataIsolation(
  currentUser: { id: number; role: string },
  table: string,
  options: { ownColumn?: string; regionColumn?: string } = {}
): { where: string; params: unknown[] } {
  const { ownColumn = 'user_id', regionColumn = 'province' } = options;

  switch (currentUser.role) {
    case 'superadmin':
    case 'admin':
      // 无限制
      return { where: '', params: [] };

    case 'project_publisher':
    case 'broker':
    case 'village_org':
    case 'user':
      // 只看自己的数据
      return { where: `AND ${table}.${ownColumn} = ?`, params: [currentUser.id] };

    case 'data_editor':
      // 看自己负责区域的数据
      const user = await queryOne<{ broker_region: string }>(
        'SELECT broker_region FROM users WHERE id = ?', currentUser.id
      );
      const regions = user?.broker_region?.split(',') || [];
      if (regions.length === 0) return { where: 'AND 1=0', params: [] }; // 无区域=无数据
      const placeholders = regions.map(() => '?').join(',');
      return { where: `AND ${table}.${regionColumn} IN (${placeholders})`, params: regions };

    default:
      // 未知角色=无数据
      return { where: 'AND 1=0', params: [] };
  }
}
```

---

## 五、R2 存储权限规划

### 5.1 目录结构与访问控制

```
zjd-assets (R2 Bucket)
├── /public/                           ← 公开访问（CDN + Referer白名单）
│   ├── /assets/images/                ← 资产图片
│   │   └── {user_id}/{timestamp}-{random}.{ext}
│   ├── /partners/avatars/             ← 合伙人头像
│   │   └── {user_id}-{random}.{ext}
│   └── /bulk/images/                  ← 大宗项目图片
│       └── {user_id}/{timestamp}-{random}.{ext}
│
├── /private/                          ← 私有访问（签名URL + 权限检查）
│   ├── /certificates/                 ← 村委授权书、确权书
│   │   └── {user_id}/{type}-{timestamp}.{ext}
│   ├── /identity/                     ← 实名证件
│   │   └── {user_id}/{type}-{timestamp}.{ext}
│   ├── /contracts/                    ← 合同文件
│   │   └── {asset_id}-{random}.{ext}
│   └── /commercial-plans/             ← 商业规划书
│       └── {bulk_id}-{random}.{ext}
│
└── /system/                           ← 系统内部（Workers直连）
    ├── /scraper-screenshots/          ← 爬虫截图
    └── /temp/                         ← 临时文件（24h清理）
```

### 5.2 上传权限矩阵

| 目录 | 谁能上传 | 文件类型 | 大小限制 |
|------|---------|---------|---------|
| `/public/assets/images/` | user, broker, village_org, admin | jpg/png/webp | 5MB |
| `/public/partners/avatars/` | broker, admin | jpg/png/webp | 2MB |
| `/public/bulk/images/` | project_publisher, admin | jpg/png/webp | 5MB |
| `/private/certificates/` | village_org, admin | jpg/png/pdf | 10MB |
| `/private/identity/` | broker, village_org, admin | jpg/png/pdf | 5MB |
| `/private/contracts/` | admin | jpg/png/pdf | 10MB |
| `/private/commercial-plans/` | project_publisher, admin | pdf | 20MB |

### 5.3 签名URL访问规则

```typescript
// 访问私有文件的权限检查
async function canAccessPrivateFile(
  userId: number,
  filePath: string,
  userRole: string
): Promise<boolean> {
  // admin/superadmin 可访问所有
  if (['admin', 'superadmin'].includes(userRole)) return true;
  
  // 文件所有者可访问自己的文件
  const fileOwnerId = extractUserIdFromPath(filePath); // 从路径提取 user_id
  if (fileOwnerId === userId) return true;
  
  // admin 审核时可访问（通过 audit_reviews 关联）
  // ... 其他业务规则
  
  return false;
}
```

---

## 六、审计日志（强制记录）

### 6.1 必须记录的操作

```typescript
const AUDIT_ACTIONS = {
  // 用户操作
  'user.register':      { module: 'auth',    level: 'info' },
  'user.login':         { module: 'auth',    level: 'info' },
  'user.logout':        { module: 'auth',    level: 'info' },
  'user.login_failed':  { module: 'auth',    level: 'warn' },
  'user.password_change':{ module: 'auth',   level: 'info' },
  
  // 资产操作
  'asset.create':       { module: 'asset',   level: 'info' },
  'asset.update':       { module: 'asset',   level: 'info' },
  'asset.delete':       { module: 'asset',   level: 'warn' },
  'asset.audit_approve':{ module: 'asset',   level: 'info' },
  'asset.audit_reject': { module: 'asset',   level: 'info' },
  'asset.feature':      { module: 'asset',   level: 'info' },
  
  // 大宗项目操作
  'bulk.create':        { module: 'bulk',    level: 'info' },
  'bulk.update':        { module: 'bulk',    level: 'info' },
  'bulk.delete':        { module: 'bulk',    level: 'warn' },
  
  // 用户管理操作
  'user.role_change':   { module: 'user',    level: 'warn' },
  'user.ban':           { module: 'user',    level: 'warn' },
  'user.unban':         { module: 'user',    level: 'warn' },
  
  // 系统操作
  'config.update':      { module: 'system',  level: 'warn' },
  'scraper.execute':    { module: 'system',  level: 'info' },
  'ai.budget_reset':    { module: 'system',  level: 'warn' },
};
```

### 6.2 审计日志表（已有，增强字段）

```sql
-- admin_audit_logs 表增强
ALTER TABLE admin_audit_logs ADD COLUMN user_role TEXT;     -- 操作者角色
ALTER TABLE admin_audit_logs ADD COLUMN module TEXT;        -- 所属模块
ALTER TABLE admin_audit_logs ADD COLUMN level TEXT;         -- 日志级别 info/warn/error
ALTER TABLE admin_audit_logs ADD COLUMN before_data TEXT;   -- 修改前数据（JSON）
ALTER TABLE admin_audit_logs ADD COLUMN after_data TEXT;    -- 修改后数据（JSON）
ALTER TABLE admin_audit_logs ADD COLUMN ip_address TEXT;    -- IP地址
ALTER TABLE admin_audit_logs ADD COLUMN user_agent TEXT;    -- 浏览器UA
```

### 6.3 审计日志写入工具

```typescript
// lib/audit.ts

export async function writeAuditLog(params: {
  userId: number;
  userRole: string;
  action: string;
  module: string;
  level: string;
  targetType?: string;
  targetId?: number;
  detail?: string;
  beforeData?: unknown;
  afterData?: unknown;
  request?: Request; // 提取 IP 和 UA
}) {
  const ip = request?.headers.get('cf-connecting-ip') || 
             request?.headers.get('x-forwarded-for') || '';
  const ua = request?.headers.get('user-agent') || '';

  await execute(
    `INSERT INTO admin_audit_logs 
     (admin_id, action, target_type, target_id, detail, user_role, module, level, before_data, after_data, ip_address, user_agent, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    params.userId, params.action, params.targetType || null, params.targetId || null,
    params.detail || null, params.userRole, params.module, params.level,
    params.beforeData ? JSON.stringify(params.beforeData) : null,
    params.afterData ? JSON.stringify(params.afterData) : null,
    ip, ua
  );
}
```

---

## 七、业务规则约束

### 7.1 发布配额

```typescript
const PUBLISH_QUOTAS = {
  user:              { daily: 3,  monthly: 20  },  // 普通用户
  broker:            { daily: 10, monthly: 100 },  // 合伙人
  village_org:       { daily: 5,  monthly: 50  },  // 村集体
  data_editor:       { daily: 20, monthly: 200 },  // 数据录入员
  project_publisher: { daily: 3,  monthly: 10  },  // 大宗发布者
  admin:             { daily: 999, monthly: 9999 }, // 管理员无限制
};

async function checkPublishQuota(userId: number, role: string): Promise<boolean> {
  const quota = PUBLISH_QUOTAS[role] || PUBLISH_QUOTAS.user;
  const today = new Date().toISOString().split('T')[0];
  
  const count = await queryOne<{ c: number }>(
    'SELECT COUNT(*) as c FROM assets WHERE user_id = ? AND date(created_at) = ?',
    userId, today
  );
  
  return (count?.c || 0) < quota.daily;
}
```

### 7.2 GPS 围栏去重

```typescript
async function checkGPSDuplicate(lat: number, lng: number, radiusKm: number = 0.5): Promise<boolean> {
  // 粗筛：矩形范围
  const latRange = radiusKm / 111;
  const lngRange = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));
  
  const results = await query<{ gps_lat: number; gps_lng: number }>(
    `SELECT gps_lat, gps_lng FROM assets 
     WHERE gps_lat BETWEEN ? AND ? AND gps_lng BETWEEN ? AND ?
     AND status != 'rejected'`,
    lat - latRange, lat + latRange, lng - lngRange, lng + lngRange
  );
  
  // 精筛：Haversine
  for (const row of results) {
    if (row.gps_lat && row.gps_lng) {
      const dist = haversineDistance(lat, lng, row.gps_lat, row.gps_lng);
      if (dist < radiusKm) return true;
    }
  }
  return false;
}
```

### 7.3 修改冷却期

```typescript
const EDIT_COOLDOWNS = {
  asset:    3600,      // 资产修改后1小时内不能再改
  broker:   86400,     // 合伙人资料修改后1天内不能再改
  bulk:     3600,      // 大宗项目修改后1小时内不能再改
};

async function checkEditCooldown(userId: number, targetType: string): Promise<boolean> {
  const cooldown = EDIT_COOLDOWNS[targetType] || 3600;
  const lastEdit = await queryOne<{ updated_at: string }>(
    `SELECT updated_at FROM ${targetType === 'asset' ? 'assets' : targetType + 's'} 
     WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1`,
    userId
  );
  
  if (!lastEdit) return true;
  const elapsed = (Date.now() - new Date(lastEdit.updated_at).getTime()) / 1000;
  return elapsed > cooldown;
}
```

### 7.4 审核 SLA

```typescript
const AUDIT_SLA_HOURS = {
  asset:    72,    // 资产审核 3 天内完成
  bulk:     168,   // 大宗项目审核 7 天内完成
  user:     48,    // 用户注册审核 2 天内完成
};

// 定时检查超时任务（cron job）
async function checkAuditSLA() {
  for (const [type, hours] of Object.entries(AUDIT_SLA_HOURS)) {
    const overdue = await query(
      `SELECT id, title, created_at FROM ${type === 'user' ? 'users' : type === 'asset' ? 'assets' : 'bulk_projects'}
       WHERE status = 'pending' AND datetime(created_at, '+${hours} hours') < datetime('now')`
    );
    
    if (overdue.length > 0) {
      // 通知管理员
      await notifyAdmins(`⚠️ ${type} 审核超时：${overdue.length} 条待审核已超过 ${hours} 小时`);
    }
  }
}
```

---

## 八、登录体系完善

### 8.1 登录安全措施

```typescript
// 登录失败锁定
const LOGIN_SECURITY = {
  maxAttempts: 5,           // 最大失败次数
  lockoutMinutes: 30,       // 锁定时间（分钟）
  sessionExpiryDays: 7,     // Session有效期（天）
  requireStrongPassword: true, // 要求强密码
};

// 密码强度规则
function validatePassword(password: string): { valid: boolean; reason?: string } {
  if (password.length < 8) return { valid: false, reason: '密码至少8位' };
  if (!/[A-Z]/.test(password)) return { valid: false, reason: '密码需包含大写字母' };
  if (!/[a-z]/.test(password)) return { valid: false, reason: '密码需包含小写字母' };
  if (!/[0-9]/.test(password)) return { valid: false, reason: '密码需包含数字' };
  return { valid: true };
}

// 登录失败计数
async function checkLoginAttempts(phone: string): Promise<{ allowed: boolean; remaining: number }> {
  const record = await queryOne<{ attempts: number; locked_until: string }>(
    'SELECT attempts, locked_until FROM login_attempts WHERE phone = ?',
    phone
  );
  
  if (record?.locked_until && new Date(record.locked_until) > new Date()) {
    return { allowed: false, remaining: 0 };
  }
  
  const attempts = record?.attempts || 0;
  return { allowed: attempts < LOGIN_SECURITY.maxAttempts, remaining: LOGIN_SECURITY.maxAttempts - attempts };
}
```

### 8.2 登录日志

```typescript
// 记录所有登录事件
async function logLoginEvent(params: {
  phone: string;
  success: boolean;
  ip: string;
  userAgent: string;
  reason?: string;
}) {
  await execute(
    `INSERT INTO login_logs (phone, success, ip_address, user_agent, reason, created_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'))`,
    params.phone, params.success ? 1 : 0, params.ip, params.userAgent, params.reason || null
  );
}
```

### 8.3 微信登录预留接口

```typescript
// 微信登录接口（后期实现）
export async function wechatLogin(code: string): Promise<{ user: User; isNew: boolean }> {
  // 1. 用 code 换取 openid
  const wxRes = await fetch(`https://api.weixin.qq.com/sns/oauth2/access_token?appid=${WX_APPID}&secret=${WX_SECRET}&code=${code}&grant_type=authorization_code`);
  const wxData = await wxRes.json();
  const openid = wxData.openid;
  
  // 2. 查找或创建用户
  let user = await queryOne<User>('SELECT * FROM users WHERE openid = ?', openid);
  const isNew = !user;
  
  if (!user) {
    // 新用户：创建默认 user 角色
    await execute(
      'INSERT INTO users (openid, nickname, role, status) VALUES (?, ?, ?, ?)',
      openid, '微信用户', 'user', 'active'
    );
    user = await queryOne<User>('SELECT * FROM users WHERE openid = ?', openid);
  }
  
  // 3. 创建 session
  const session = await createSession(user!.id);
  
  return { user: user!, isNew };
}
```

---

## 九、异常处理与风控

### 9.1 频率限制

```typescript
// lib/rate-limit.ts

const RATE_LIMITS = {
  'auth.login':        { window: 300,  max: 10 },   // 5分钟内最多10次登录
  'auth.register':     { window: 3600, max: 5 },    // 1小时内最多5次注册
  'asset.create':      { window: 3600, max: 20 },   // 1小时内最多发布20条
  'asset.update':      { window: 300,  max: 30 },   // 5分钟内最多修改30次
  'api.general':       { window: 60,   max: 100 },  // 1分钟内最多100次API调用
};

async function checkRateLimit(key: string, ip: string): Promise<boolean> {
  const limit = RATE_LIMITS[key];
  if (!limit) return true;
  
  const record = await queryOne<{ count: number; window_start: string }>(
    'SELECT count, window_start FROM rate_limits WHERE key = ? AND ip = ?',
    `${key}:${ip}`, ip
  );
  
  if (!record || Date.now() - new Date(record.window_start).getTime() > limit.window * 1000) {
    // 新窗口
    await execute(
      'INSERT OR REPLACE INTO rate_limits (key, ip, count, window_start) VALUES (?, ?, 1, datetime("now"))',
      `${key}:${ip}`, ip
    );
    return true;
  }
  
  if (record.count >= limit.max) return false;
  
  await execute('UPDATE rate_limits SET count = count + 1 WHERE key = ? AND ip = ?', `${key}:${ip}`, ip);
  return true;
}
```

### 9.2 异常告警

```typescript
// lib/alert.ts

const ALERT_RULES = {
  'login.brute_force':    { threshold: 10, window: 300,  channel: 'admin' },
  'asset.spam':           { threshold: 20, window: 3600, channel: 'admin' },
  'audit.sla_overdue':    { threshold: 1,  window: 0,   channel: 'admin' },
  'ai.budget_exceeded':   { threshold: 1,  window: 0,   channel: 'admin' },
};

async function checkAndAlert(rule: string, context: Record<string, unknown>) {
  const config = ALERT_RULES[rule];
  if (!config) return;
  
  // 检查是否已告警（防重复）
  const recent = await queryOne<{ id: number }>(
    'SELECT id FROM alerts WHERE rule = ? AND created_at > datetime("now", "-1 hour") LIMIT 1',
    rule
  );
  if (recent) return;
  
  // 记录告警
  await execute(
    'INSERT INTO alerts (rule, context, created_at) VALUES (?, ?, datetime("now"))',
    rule, JSON.stringify(context)
  );
  
  // 通知管理员
  await notifyAdmins(`🚨 告警：${rule}`, context);
}
```

### 9.3 敏感信息过滤

```typescript
// 发布内容敏感词过滤
const SENSITIVE_WORDS = ['诈骗', '赌博', '色情', '毒品', '暴力', '非法集资'];

function checkSensitiveContent(text: string): { safe: boolean; words: string[] } {
  const found = SENSITIVE_WORDS.filter(word => text.includes(word));
  return { safe: found.length === 0, words: found };
}

// 发布前检查
async function prePublishCheck(asset: { title: string; description: string }) {
  const titleCheck = checkSensitiveContent(asset.title);
  const descCheck = checkSensitiveContent(asset.description || '');
  
  if (!titleCheck.safe || !descCheck.safe) {
    return {
      pass: false,
      reason: `内容包含敏感词：${[...titleCheck.words, ...descCheck.words].join('、')}`
    };
  }
  
  return { pass: true };
}
```

---

## 十、完整开发计划（修正版）

```
第1周：基础架构
  Day 1: roles 表 + permissions 表 + role_permissions 表 + 种子数据
  Day 2: user_sessions 表 + login_attempts 表 + rate_limits 表
  Day 3: lib/auth.ts（权限检查工具）+ lib/audit.ts（审计日志工具）

第2周：登录体系
  Day 1: /api/auth/register（含角色选择+补充信息）
  Day 2: /api/auth/login（含失败锁定+频率限制）
  Day 3: /login + /register 页面 + middleware.ts

第3周：/dashboard 骨架
  Day 1: /dashboard layout（侧边栏+角色菜单+权限驱动）
  Day 2: /dashboard 概览页 + /dashboard/profile
  Day 3: /api/dashboard/stats + /api/dashboard/profile

第4周：资产管理
  Day 1: /dashboard/assets（我的资产列表，数据隔离）
  Day 2: /dashboard/assets/new（角色差异化发布表单）
  Day 3: /api/dashboard/assets CRUD + 审核流程 + 审计日志

第5周：角色专属功能
  Day 1: /dashboard/bulk-projects（大宗项目管理）
  Day 2: /dashboard/infra（基建数据录入）
  Day 3: /dashboard/leads + /dashboard/favorites

第6周：风控与收尾
  Day 1: 频率限制 + 敏感词过滤 + 异常告警
  Day 2: 审核SLA检查 + 修改冷却期 + 发布配额
  Day 3: 全量联调 + 测试
```
