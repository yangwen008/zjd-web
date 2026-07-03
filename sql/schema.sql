-- =============================================
-- zjd.cn 数据库 Schema (Cloudflare D1)
-- 金禾计划 v8.8.2 (架构师完善版)
-- =============================================

-- 1. 资产主表
CREATE TABLE IF NOT EXISTS assets (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  title         TEXT NOT NULL,
  description   TEXT,
  location      TEXT,              -- 省市区
  province      TEXT,
  city          TEXT,
  district      TEXT,
  address       TEXT,
  area_mu       REAL,              -- 面积(亩)
  price_year    REAL,              -- 年租金(万)
  price_total   REAL,              -- 总价(万)
  lease_years   INTEGER,           -- 流转年限
  asset_type    TEXT,              -- 宅基地/林地/茶园/厂房等
  source_type   TEXT DEFAULT 'official', -- official/village/ugc
  source_url    TEXT,              -- 原始来源URL
  images        TEXT,              -- JSON数组: 图片URL列表
  video_url     TEXT,
  gps_lat       REAL,
  gps_lng       REAL,
  contact_phone TEXT,              -- 加密后的电话
  contact_name  TEXT,
  views         INTEGER DEFAULT 0, -- 浏览量
  status        TEXT DEFAULT 'pending', -- pending/approved/rejected/banned
  featured      INTEGER DEFAULT 0, -- 是否橱窗推荐
  user_id       INTEGER,           -- 发布者ID
  raw_html      TEXT,              -- 原始抓取HTML
  ai_extracted  TEXT,              -- AI提取的JSON
  infra_details TEXT,              -- 基建配套+环境指标JSON
  certification TEXT DEFAULT 'uncertified', -- 确权状态: certified/uncertified/pending
  invest_enabled      INTEGER DEFAULT 0,    -- 是否开放参投
  invest_total_shares INTEGER,              -- 总份数
  invest_share_price  REAL,                 -- 每份单价(万)
  invest_min_shares   INTEGER DEFAULT 1,    -- 最低起投份数
  invest_sold_shares  INTEGER DEFAULT 0,    -- 已认购份数
  created_at    TEXT DEFAULT (datetime('now')),
  updated_at    TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_assets_province ON assets(province);
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_source ON assets(source_type);
CREATE INDEX IF NOT EXISTS idx_assets_views ON assets(views DESC);
CREATE INDEX IF NOT EXISTS idx_assets_featured ON assets(featured, status);
-- 架构师补充：后台审核列表高频查询复合索引
CREATE INDEX IF NOT EXISTS idx_assets_status_created ON assets(status, created_at DESC);

-- 资产全文搜索
CREATE VIRTUAL TABLE IF NOT EXISTS assets_fts USING fts5(
  title, description, location, province, city,
  content='assets', content_rowid='id'
);

-- FTS5 同步触发器
CREATE TRIGGER IF NOT EXISTS assets_fts_insert AFTER INSERT ON assets BEGIN
  INSERT INTO assets_fts(rowid, title, description, location, province, city)
  VALUES (new.id, new.title, new.description, new.location, new.province, new.city);
END;

CREATE TRIGGER IF NOT EXISTS assets_fts_update AFTER UPDATE ON assets BEGIN
  INSERT INTO assets_fts(assets_fts, rowid, title, description, location, province, city)
  VALUES ('delete', old.id, old.title, old.description, old.location, old.province, old.city);
  INSERT INTO assets_fts(rowid, title, description, location, province, city)
  VALUES (new.id, new.title, new.description, new.location, new.province, new.city);
END;

CREATE TRIGGER IF NOT EXISTS assets_fts_delete AFTER DELETE ON assets BEGIN
  INSERT INTO assets_fts(assets_fts, rowid, title, description, location, province, city)
  VALUES ('delete', old.id, old.title, old.description, old.location, old.province, old.city);
END;

-- 2. 用户表
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  openid        TEXT UNIQUE,       -- 微信OpenID
  nickname      TEXT,
  avatar_url    TEXT,
  phone         TEXT,
  role          TEXT DEFAULT 'buyer', -- buyer/broker/village/admin/superadmin
  status        TEXT DEFAULT 'active', -- active/banned
  role_approved_at TEXT,           -- 架构师补充：角色审核通过时间（修复审核报错）
  real_name     TEXT,
  org_name      TEXT,              -- 村委/机构名称
  org_license   TEXT,              -- 营业执照/登记证URL
  verified      INTEGER DEFAULT 0,
  daily_quota   INTEGER DEFAULT 3, -- 每日发布上限
  password_hash TEXT,
  phone_verified INTEGER DEFAULT 0,
  last_login_at TEXT,
  role_apply    TEXT,              -- 申请的角色（注册时填）
  apply_reason  TEXT,              -- 申请理由
  broker_region TEXT,              -- 合伙人负责区域
  broker_specialties TEXT,         -- 合伙人擅长领域（JSON）
  broker_bio    TEXT,              -- 合伙人简介
  wx_openid     TEXT,              -- 微信公众号OpenID
  wx_unionid    TEXT,              -- 微信UnionID
  wx_nickname   TEXT,              -- 微信昵称
  wx_avatar     TEXT,              -- 微信头像
  created_at    TEXT DEFAULT (datetime('now')),
  updated_at    TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_openid ON users(openid);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_wx_openid ON users(wx_openid);
CREATE INDEX IF NOT EXISTS idx_users_wx_unionid ON users(wx_unionid);

-- 3. 线索表 (买家解锁记录)
CREATE TABLE IF NOT EXISTS leads (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_id      INTEGER NOT NULL,
  user_id       INTEGER NOT NULL,
  unlock_type   TEXT DEFAULT 'phone', -- phone/gps/contact
  broker_id     INTEGER,
  status        TEXT DEFAULT 'new',
  notes         TEXT,
  created_at    TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_leads_asset ON leads(asset_id);
CREATE INDEX IF NOT EXISTS idx_leads_user ON leads(user_id);

-- 4. 合伙人表
CREATE TABLE IF NOT EXISTS brokers (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       INTEGER NOT NULL,
  name          TEXT NOT NULL,
  region        TEXT,
  province      TEXT,              -- 省份（结构化筛选）
  city          TEXT,              -- 城市（结构化筛选）
  bio           TEXT,
  specialties   TEXT,              -- JSON数组: 擅长领域
  rating        TEXT DEFAULT 'bronze', -- gold/silver/bronze
  show_count    INTEGER DEFAULT 0,
  good_rate     REAL DEFAULT 0,
  phone_encrypted TEXT,
  avatar_url    TEXT,
  status        TEXT DEFAULT 'active',
  created_at    TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_brokers_province ON brokers(province);
CREATE INDEX IF NOT EXISTS idx_brokers_city ON brokers(city);
CREATE INDEX IF NOT EXISTS idx_brokers_rating ON brokers(rating);

-- 5. 首页配置表
CREATE TABLE IF NOT EXISTS homepage_config (
  key           TEXT PRIMARY KEY,
  value         TEXT NOT NULL,
  updated_at    TEXT DEFAULT (datetime('now'))
);

-- 6. 爬虫配方表
CREATE TABLE IF NOT EXISTS scrapers_recipes (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  base_url      TEXT NOT NULL,
  list_url      TEXT NOT NULL,
  enabled       INTEGER DEFAULT 1,
  pagination_type TEXT DEFAULT 'url',
  max_pages     INTEGER DEFAULT 10,
  selectors     TEXT NOT NULL,       -- JSON: 列表页选择器
  detail_selectors TEXT,             -- JSON: 详情页选择器
  ai_prompt     TEXT,
  schedule_cron TEXT DEFAULT '0 3 * * *',
  last_run_at   TEXT,
  last_run_status TEXT DEFAULT 'idle',
  proxy_enabled INTEGER DEFAULT 0,
  created_at    TEXT DEFAULT (datetime('now')),
  updated_at    TEXT DEFAULT (datetime('now'))
);

-- 7. 爬虫原始数据暂存表
CREATE TABLE IF NOT EXISTS staging_raw (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  recipe_id     INTEGER NOT NULL,
  raw_html      TEXT,
  raw_data      TEXT,               -- JSON
  status        TEXT DEFAULT 'raw', -- raw/cleaned/imported/error
  error_msg     TEXT,
  created_at    TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (recipe_id) REFERENCES scrapers_recipes(id) ON DELETE CASCADE
);

-- 8. 审计日志表 (只INSERT不DELETE)
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_id      INTEGER NOT NULL,
  action        TEXT NOT NULL,       -- login/update/delete/approve/ban
  target_type   TEXT,                -- asset/user/config
  target_id     INTEGER,
  detail        TEXT,
  ip_address    TEXT,
  created_at    TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_audit_admin ON admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON admin_audit_logs(action);

-- 9. 解锁任务表
CREATE TABLE IF NOT EXISTS unlock_tasks (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_id      INTEGER NOT NULL,
  user_id       INTEGER,
  wechat_openid TEXT,
  status        TEXT DEFAULT 'pending', -- pending/processing/done/failed
  result_data   TEXT,               -- JSON: 解密结果
  created_at    TEXT DEFAULT (datetime('now')),
  completed_at  TEXT,
  FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
);

-- 10. 行情数据表
CREATE TABLE IF NOT EXISTS market_data (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  province      TEXT NOT NULL,
  median_price  REAL,
  change_pct    REAL,
  bargain_space REAL,
  total_listings INTEGER,
  updated_at    TEXT DEFAULT (datetime('now'))
);

-- 11. 基建评分表
CREATE TABLE IF NOT EXISTS infrastructure_ratings (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  region        TEXT NOT NULL,
  signal_5g_ms  INTEGER,
  hospital_min  INTEGER,
  grid_redundancy INTEGER,
  overall_grade TEXT,
  province      TEXT,
  city          TEXT,
  updated_at    TEXT DEFAULT (datetime('now'))
);

-- 12. 行政区划表
CREATE TABLE IF NOT EXISTS regions (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  code          TEXT UNIQUE,
  name          TEXT NOT NULL,
  level         TEXT NOT NULL,          -- province/city/district
  parent_code   TEXT,
  path          TEXT,                   -- Materialized Path: e.g. 'CN/ZJ/HZ/AJ/'
  province      TEXT,
  city          TEXT,
  emoji         TEXT,
  lat           REAL,
  lng           REAL,
  sort_order    INTEGER DEFAULT 0,
  active        INTEGER DEFAULT 1,
  created_at    TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_regions_path ON regions(path);
CREATE INDEX IF NOT EXISTS idx_regions_level ON regions(level);
CREATE INDEX IF NOT EXISTS idx_regions_parent ON regions(parent_code);
CREATE INDEX IF NOT EXISTS idx_regions_province ON regions(province);

-- 13. 资产类型表
CREATE TABLE IF NOT EXISTS asset_types (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL UNIQUE,
  icon          TEXT,
  description   TEXT,
  sort_order    INTEGER DEFAULT 0,
  active        INTEGER DEFAULT 1
);

-- 14. AI 用量追踪表 (用于预算熔断)
CREATE TABLE IF NOT EXISTS ai_usage_log (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  tokens_in     INTEGER DEFAULT 0,
  tokens_out    INTEGER DEFAULT 0,
  cost          REAL DEFAULT 0,
  model         TEXT,
  created_at    TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_date ON ai_usage_log(created_at);

-- 15. 大宗路演项目表
CREATE TABLE IF NOT EXISTS bulk_projects (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  title             TEXT NOT NULL,
  code              TEXT,
  description       TEXT,
  location          TEXT,
  province          TEXT,
  city              TEXT,
  district          TEXT,
  area_mu           REAL,
  area_sqm          REAL,
  price_total       REAL,
  price_start       REAL,
  yield_rate        REAL,
  lease_years       INTEGER,
  certification     TEXT DEFAULT 'uncertified',
  planning_use      TEXT,
  images            TEXT,
  video_url         TEXT,
  commercial_plan   TEXT,
  commercial_plan_doc TEXT,            -- 商业计划书附件URL
  cert_doc_url      TEXT,
  infra_details     TEXT,              -- 基建配套+环境指标JSON
  gps_lat           REAL,
  gps_lng           REAL,
  contact_name      TEXT,
  contact_phone     TEXT,
  views             INTEGER DEFAULT 0,
  status            TEXT DEFAULT 'pending',
  featured          INTEGER DEFAULT 0,
  user_id           INTEGER,
  invest_enabled      INTEGER DEFAULT 0,
  invest_total_shares INTEGER,
  invest_share_price  REAL,
  invest_min_shares   INTEGER DEFAULT 1,
  invest_sold_shares  INTEGER DEFAULT 0,
  created_at        TEXT DEFAULT (datetime('now')),
  updated_at        TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_bulk_province ON bulk_projects(province);
CREATE INDEX IF NOT EXISTS idx_bulk_status ON bulk_projects(status);
CREATE INDEX IF NOT EXISTS idx_bulk_featured ON bulk_projects(featured, status);
CREATE INDEX IF NOT EXISTS idx_bulk_views ON bulk_projects(views DESC);

-- 16. 角色定义表
CREATE TABLE IF NOT EXISTS roles (
  code          TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  description   TEXT,
  level         INTEGER DEFAULT 0,
  is_system     INTEGER DEFAULT 0,
  created_at    TEXT DEFAULT (datetime('now'))
);

-- 17. 权限定义表
CREATE TABLE IF NOT EXISTS permissions (
  code          TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  module        TEXT NOT NULL,
  description   TEXT
);

-- 18. 角色-权限映射表
CREATE TABLE IF NOT EXISTS role_permissions (
  role          TEXT NOT NULL,
  permission    TEXT NOT NULL,
  PRIMARY KEY (role, permission),
  FOREIGN KEY (role) REFERENCES roles(code) ON DELETE CASCADE,
  FOREIGN KEY (permission) REFERENCES permissions(code) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_rp_role ON role_permissions(role);
CREATE INDEX IF NOT EXISTS idx_rp_permission ON role_permissions(permission);

-- 19. 用户会话表
CREATE TABLE IF NOT EXISTS user_sessions (
  id            TEXT PRIMARY KEY,
  user_id       INTEGER NOT NULL,
  expires_at    TEXT NOT NULL,
  created_at    TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON user_sessions(expires_at);

-- 20. 登录尝试记录表
CREATE TABLE IF NOT EXISTS login_attempts (
  phone         TEXT PRIMARY KEY,
  attempts      INTEGER DEFAULT 0,
  locked_until  TEXT,
  updated_at    TEXT DEFAULT (datetime('now'))
);

-- 21. 频率限制表
CREATE TABLE IF NOT EXISTS rate_limits (
  key           TEXT NOT NULL,
  ip            TEXT NOT NULL,
  count         INTEGER DEFAULT 1,
  window_start  TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (key, ip)
);

-- 21.5 用户收藏表
CREATE TABLE IF NOT EXISTS user_favorites (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       INTEGER NOT NULL,
  asset_id      INTEGER NOT NULL,
  created_at    TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (asset_id) REFERENCES assets(id),
  UNIQUE(user_id, asset_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_asset ON user_favorites(asset_id);

-- 22. 审核记录表
CREATE TABLE IF NOT EXISTS audit_reviews (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  target_type   TEXT NOT NULL,
  target_id     INTEGER NOT NULL,
  action        TEXT NOT NULL,
  from_status   TEXT,
  to_status     TEXT NOT NULL,
  reviewer_id   INTEGER,
  reason        TEXT,
  created_at    TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_reviews_target ON audit_reviews(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer ON audit_reviews(reviewer_id);

-- 23. 告警记录表
CREATE TABLE IF NOT EXISTS alerts (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  rule          TEXT NOT NULL,
  context       TEXT,
  acknowledged  INTEGER DEFAULT 0,
  created_at    TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_alerts_rule ON alerts(rule);
CREATE INDEX IF NOT EXISTS idx_alerts_created ON alerts(created_at);

-- 24. 登录日志表
CREATE TABLE IF NOT EXISTS login_logs (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  phone         TEXT,
  user_id       INTEGER,
  success       INTEGER NOT NULL,
  ip_address    TEXT,
  user_agent    TEXT,
  reason        TEXT,
  created_at    TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_login_logs_phone ON login_logs(phone);
CREATE INDEX IF NOT EXISTS idx_login_logs_user ON login_logs(user_id);

-- 25. 预约带看表
CREATE TABLE IF NOT EXISTS appointments (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_id      INTEGER NOT NULL,
  user_id       INTEGER NOT NULL,
  contact_name  TEXT,
  contact_phone TEXT,
  status        TEXT DEFAULT 'pending',  -- pending/confirmed/cancelled/completed
  notes         TEXT,
  created_at    TEXT DEFAULT (datetime('now')),
  updated_at    TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(asset_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_appts_asset ON appointments(asset_id);
CREATE INDEX IF NOT EXISTS idx_appts_user ON appointments(user_id);

-- 26. 微信消息记录表
CREATE TABLE IF NOT EXISTS wx_messages (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       INTEGER,
  openid        TEXT NOT NULL,
  template_id   TEXT NOT NULL,
  msg_type      TEXT NOT NULL,
  content       TEXT,
  status        TEXT DEFAULT 'sent',
  msg_id        TEXT,
  created_at    TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_wxmsg_openid ON wx_messages(openid);
CREATE INDEX IF NOT EXISTS idx_wxmsg_type ON wx_messages(msg_type);

-- 27. 拼单认购记录表
CREATE TABLE IF NOT EXISTS investments (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_id      INTEGER NOT NULL,
  asset_type    TEXT NOT NULL DEFAULT 'asset',
  user_id       INTEGER NOT NULL,
  shares        INTEGER NOT NULL,
  amount        REAL,
  status        TEXT DEFAULT 'pending',
  notes         TEXT,
  contact_name  TEXT,
  contact_phone TEXT,
  created_at    TEXT DEFAULT (datetime('now')),
  updated_at    TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(asset_id, asset_type, user_id)
);

CREATE INDEX IF NOT EXISTS idx_invest_asset ON investments(asset_id, asset_type);
CREATE INDEX IF NOT EXISTS idx_invest_user ON investments(user_id);
CREATE INDEX IF NOT EXISTS idx_invest_status ON investments(status);
