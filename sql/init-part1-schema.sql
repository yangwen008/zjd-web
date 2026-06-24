-- zjd.cn 建表脚本 (Cloudflare D1)
-- 在 D1 Console 中执行此脚本

CREATE TABLE IF NOT EXISTS assets (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  title         TEXT NOT NULL,
  description   TEXT,
  location      TEXT,
  province      TEXT,
  city          TEXT,
  district      TEXT,
  address       TEXT,
  area_mu       REAL,
  price_year    REAL,
  price_total   REAL,
  lease_years   INTEGER,
  asset_type    TEXT,
  source_type   TEXT DEFAULT 'official',
  source_url    TEXT,
  images        TEXT,
  video_url     TEXT,
  gps_lat       REAL,
  gps_lng       REAL,
  contact_phone TEXT,
  contact_name  TEXT,
  views         INTEGER DEFAULT 0,
  status        TEXT DEFAULT 'pending',
  featured      INTEGER DEFAULT 0,
  user_id       INTEGER,
  raw_html      TEXT,
  ai_extracted  TEXT,
  created_at    TEXT DEFAULT (datetime('now')),
  updated_at    TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_assets_province ON assets(province);
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_source ON assets(source_type);
CREATE INDEX IF NOT EXISTS idx_assets_views ON assets(views DESC);
CREATE INDEX IF NOT EXISTS idx_assets_featured ON assets(featured, status);

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  openid        TEXT UNIQUE,
  nickname      TEXT,
  avatar_url    TEXT,
  phone         TEXT,
  role          TEXT DEFAULT 'buyer',
  status        TEXT DEFAULT 'active',
  real_name     TEXT,
  org_name      TEXT,
  org_license   TEXT,
  verified      INTEGER DEFAULT 0,
  daily_quota   INTEGER DEFAULT 3,
  created_at    TEXT DEFAULT (datetime('now')),
  updated_at    TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_openid ON users(openid);

CREATE TABLE IF NOT EXISTS leads (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_id      INTEGER NOT NULL,
  user_id       INTEGER NOT NULL,
  unlock_type   TEXT DEFAULT 'phone',
  created_at    TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_leads_asset ON leads(asset_id);
CREATE INDEX IF NOT EXISTS idx_leads_user ON leads(user_id);

CREATE TABLE IF NOT EXISTS brokers (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       INTEGER NOT NULL,
  name          TEXT NOT NULL,
  region        TEXT,
  bio           TEXT,
  rating        TEXT DEFAULT 'bronze',
  show_count    INTEGER DEFAULT 0,
  good_rate     REAL DEFAULT 0,
  phone_encrypted TEXT,
  avatar_url    TEXT,
  status        TEXT DEFAULT 'active',
  created_at    TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS homepage_config (
  key           TEXT PRIMARY KEY,
  value         TEXT NOT NULL,
  updated_at    TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS scrapers_recipes (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  base_url      TEXT NOT NULL,
  list_url      TEXT NOT NULL,
  enabled       INTEGER DEFAULT 1,
  pagination_type TEXT DEFAULT 'url',
  max_pages     INTEGER DEFAULT 10,
  selectors     TEXT NOT NULL,
  detail_selectors TEXT,
  ai_prompt     TEXT,
  schedule_cron TEXT DEFAULT '0 3 * * *',
  last_run_at   TEXT,
  last_run_status TEXT DEFAULT 'idle',
  proxy_enabled INTEGER DEFAULT 0,
  created_at    TEXT DEFAULT (datetime('now')),
  updated_at    TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS staging_raw (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  recipe_id     INTEGER NOT NULL,
  raw_html      TEXT,
  raw_data      TEXT,
  status        TEXT DEFAULT 'raw',
  error_msg     TEXT,
  created_at    TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_id      INTEGER NOT NULL,
  action        TEXT NOT NULL,
  target_type   TEXT,
  target_id     INTEGER,
  detail        TEXT,
  ip_address    TEXT,
  created_at    TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_audit_admin ON admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON admin_audit_logs(action);

CREATE TABLE IF NOT EXISTS unlock_tasks (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_id      INTEGER NOT NULL,
  user_id       INTEGER,
  wechat_openid TEXT,
  status        TEXT DEFAULT 'pending',
  result_data   TEXT,
  created_at    TEXT DEFAULT (datetime('now')),
  completed_at  TEXT
);

CREATE TABLE IF NOT EXISTS market_data (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  province      TEXT NOT NULL,
  median_price  REAL,
  change_pct    REAL,
  bargain_space REAL,
  total_listings INTEGER,
  updated_at    TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS infrastructure_ratings (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  region        TEXT NOT NULL,
  signal_5g_ms  INTEGER,
  hospital_min  INTEGER,
  grid_redundancy INTEGER,
  overall_grade TEXT,
  updated_at    TEXT DEFAULT (datetime('now'))
);
