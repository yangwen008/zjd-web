-- =============================================
-- zjd.cn 数据库 Schema (Cloudflare D1)
-- 金禾计划 v8.8.1
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
  created_at    TEXT DEFAULT (datetime('now')),
  updated_at    TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_assets_province ON assets(province);
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_source ON assets(source_type);
CREATE INDEX IF NOT EXISTS idx_assets_views ON assets(views DESC);
CREATE INDEX IF NOT EXISTS idx_assets_featured ON assets(featured, status);

-- 资产全文搜索
CREATE VIRTUAL TABLE IF NOT EXISTS assets_fts USING fts5(
  title, description, location, province, city,
  content='assets', content_rowid='id'
);

-- FTS5 同步触发器：确保新增/修改/删除资产时自动更新搜索索引
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
  real_name     TEXT,
  org_name      TEXT,              -- 村委/机构名称
  org_license   TEXT,              -- 营业执照/登记证URL
  verified      INTEGER DEFAULT 0,
  daily_quota   INTEGER DEFAULT 3, -- 每日发布上限
  created_at    TEXT DEFAULT (datetime('now')),
  updated_at    TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_openid ON users(openid);

-- 3. 线索表 (买家解锁记录)
CREATE TABLE IF NOT EXISTS leads (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_id      INTEGER NOT NULL,
  user_id       INTEGER NOT NULL,
  unlock_type   TEXT DEFAULT 'phone', -- phone/gps/contact
  created_at    TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (asset_id) REFERENCES assets(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_leads_asset ON leads(asset_id);
CREATE INDEX IF NOT EXISTS idx_leads_user ON leads(user_id);

-- 4. 合伙人表
CREATE TABLE IF NOT EXISTS brokers (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       INTEGER NOT NULL,
  name          TEXT NOT NULL,
  region        TEXT,
  bio           TEXT,
  rating        TEXT DEFAULT 'bronze', -- gold/silver/bronze
  show_count    INTEGER DEFAULT 0,
  good_rate     REAL DEFAULT 0,
  phone_encrypted TEXT,
  avatar_url    TEXT,
  status        TEXT DEFAULT 'active',
  created_at    TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

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
  FOREIGN KEY (recipe_id) REFERENCES scrapers_recipes(id)
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
  FOREIGN KEY (asset_id) REFERENCES assets(id)
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
  updated_at    TEXT DEFAULT (datetime('now'))
);

-- 12. AI 用量追踪表 (用于预算熔断)
CREATE TABLE IF NOT EXISTS ai_usage_log (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  tokens_in     INTEGER DEFAULT 0,
  tokens_out    INTEGER DEFAULT 0,
  cost          REAL DEFAULT 0,
  model         TEXT,
  created_at    TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_date ON ai_usage_log(created_at);
