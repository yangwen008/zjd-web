-- =============================================
-- 拼单认购功能迁移脚本
-- 执行方式: wrangler d1 execute zjd-main --file=./sql/invest-migration.sql
-- =============================================

-- 1. assets 表增加参投字段
ALTER TABLE assets ADD COLUMN invest_enabled INTEGER DEFAULT 0;
ALTER TABLE assets ADD COLUMN invest_total_shares INTEGER;
ALTER TABLE assets ADD COLUMN invest_share_price REAL;
ALTER TABLE assets ADD COLUMN invest_min_shares INTEGER DEFAULT 1;
ALTER TABLE assets ADD COLUMN invest_sold_shares INTEGER DEFAULT 0;

-- 2. bulk_projects 表增加参投字段
ALTER TABLE bulk_projects ADD COLUMN invest_enabled INTEGER DEFAULT 0;
ALTER TABLE bulk_projects ADD COLUMN invest_total_shares INTEGER;
ALTER TABLE bulk_projects ADD COLUMN invest_share_price REAL;
ALTER TABLE bulk_projects ADD COLUMN invest_min_shares INTEGER DEFAULT 1;
ALTER TABLE bulk_projects ADD COLUMN invest_sold_shares INTEGER DEFAULT 0;

-- 3. 认购记录表
CREATE TABLE IF NOT EXISTS investments (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_id      INTEGER NOT NULL,
  asset_type    TEXT NOT NULL DEFAULT 'asset',  -- 'asset' 或 'bulk_project'
  user_id       INTEGER NOT NULL,
  shares        INTEGER NOT NULL,
  amount        REAL,                           -- 认领金额(万)，冗余计算
  status        TEXT DEFAULT 'pending',          -- pending/contacted/signed/withdrawn
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

-- 4. users 表增加 bio 字段（机构/村委介绍）
ALTER TABLE users ADD COLUMN bio TEXT;
