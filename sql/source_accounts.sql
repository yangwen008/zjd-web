-- 信息来源账号映射表
-- 将采集数据的地区自动映射到对应的发布账号
CREATE TABLE IF NOT EXISTS source_accounts (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,              -- 来源名称：成都农交所德阳子公司
  province      TEXT,                       -- 匹配省份
  city          TEXT,                       -- 匹配城市
  district      TEXT,                       -- 匹配区县（可选，精确匹配）
  user_id       INTEGER,                    -- 关联的用户ID
  auto_approve  INTEGER DEFAULT 1,          -- 采集数据是否自动上架
  enabled       INTEGER DEFAULT 1,
  created_at    TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_source_city ON source_accounts(city);
CREATE INDEX IF NOT EXISTS idx_source_province ON source_accounts(province);
CREATE INDEX IF NOT EXISTS idx_source_enabled ON source_accounts(enabled);

-- 种子数据：四川省主要农交所
INSERT OR IGNORE INTO source_accounts (name, province, city, user_id, auto_approve) VALUES
  ('四川省农村产权综合交易平台', '四川省', NULL, NULL, 1);
