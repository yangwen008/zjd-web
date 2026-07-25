-- =============================================
-- 专业服务商系统迁移脚本
-- 公证处(notary) / 律师(lawyer) / 风水师(fengshui)
-- =============================================

-- 1. 专业服务商主表
CREATE TABLE IF NOT EXISTS professionals (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       INTEGER,
  prof_type     TEXT NOT NULL,                -- notary/lawyer/fengshui
  name          TEXT NOT NULL,
  org_name      TEXT,                         -- 公证处名称/律所名称
  phone         TEXT,
  phone_encrypted TEXT,
  avatar_url    TEXT,
  bio           TEXT,                         -- 个人/机构简介
  license_no    TEXT,                         -- 执业证号
  qualification TEXT,                         -- 资质等级描述
  province      TEXT,
  city          TEXT,
  district      TEXT,
  service_areas TEXT,                         -- JSON: 服务覆盖区域
  services      TEXT,                         -- JSON: 服务项目列表
  pricing_model TEXT DEFAULT 'negotiable',    -- fixed/range/negotiable
  price_min     REAL,
  price_max     REAL,
  rating        REAL DEFAULT 5.0,
  review_count  INTEGER DEFAULT 0,
  order_count   INTEGER DEFAULT 0,
  verified      INTEGER DEFAULT 0,            -- 平台认证(公证处/律师可用，风水师不用)
  status        TEXT DEFAULT 'active',
  created_at    TEXT DEFAULT (datetime('now')),
  updated_at    TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_professionals_type ON professionals(prof_type);
CREATE INDEX IF NOT EXISTS idx_professionals_province ON professionals(province);
CREATE INDEX IF NOT EXISTS idx_professionals_city ON professionals(city);
CREATE INDEX IF NOT EXISTS idx_professionals_rating ON professionals(rating DESC);
CREATE INDEX IF NOT EXISTS idx_professionals_status ON professionals(status);

-- 2. 服务预约/评价表
CREATE TABLE IF NOT EXISTS professional_orders (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  professional_id INTEGER NOT NULL,
  asset_id      INTEGER,
  user_id       INTEGER NOT NULL,
  service_name  TEXT NOT NULL,
  status        TEXT DEFAULT 'pending',       -- pending/confirmed/completed/cancelled
  contact_name  TEXT,
  contact_phone TEXT,
  notes         TEXT,
  review_rating INTEGER,                      -- 1-5星
  review_text   TEXT,
  created_at    TEXT DEFAULT (datetime('now')),
  updated_at    TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (professional_id) REFERENCES professionals(id) ON DELETE CASCADE,
  FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_porders_professional ON professional_orders(professional_id);
CREATE INDEX IF NOT EXISTS idx_porders_user ON professional_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_porders_asset ON professional_orders(asset_id);
