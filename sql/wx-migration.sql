-- =============================================
-- 微信公众号 + 预约带看 迁移脚本
-- 等 D1 配额恢复后在控制台执行
-- =============================================

-- 1. 用户表增加微信字段
ALTER TABLE users ADD COLUMN wx_openid TEXT;
ALTER TABLE users ADD COLUMN wx_unionid TEXT;
ALTER TABLE users ADD COLUMN wx_nickname TEXT;
ALTER TABLE users ADD COLUMN wx_avatar TEXT;
CREATE INDEX IF NOT EXISTS idx_users_wx_openid ON users(wx_openid);
CREATE INDEX IF NOT EXISTS idx_users_wx_unionid ON users(wx_unionid);

-- 2. 预约带看表
CREATE TABLE IF NOT EXISTS appointments (id INTEGER PRIMARY KEY AUTOINCREMENT, asset_id INTEGER NOT NULL, user_id INTEGER NOT NULL, contact_name TEXT, contact_phone TEXT, status TEXT DEFAULT 'pending', notes TEXT, created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')), FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, UNIQUE(asset_id, user_id));
CREATE INDEX IF NOT EXISTS idx_appts_asset ON appointments(asset_id);
CREATE INDEX IF NOT EXISTS idx_appts_user ON appointments(user_id);

-- 3. 微信消息记录表（如果之前没建成功的话）
CREATE TABLE IF NOT EXISTS wx_messages (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, openid TEXT NOT NULL, template_id TEXT NOT NULL, msg_type TEXT NOT NULL, content TEXT, status TEXT DEFAULT 'sent', msg_id TEXT, created_at TEXT DEFAULT (datetime('now')), FOREIGN KEY (user_id) REFERENCES users(id));
CREATE INDEX IF NOT EXISTS idx_wxmsg_openid ON wx_messages(openid);
CREATE INDEX IF NOT EXISTS idx_wxmsg_type ON wx_messages(msg_type);

-- 4. homepage_config 增加微信相关配置（如果需要模板消息）
INSERT OR IGNORE INTO homepage_config (key, value) VALUES ('wx_access_token', '');
