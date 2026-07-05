-- 土流网来源账号
INSERT OR IGNORE INTO source_accounts (name, province, city, user_id, auto_approve, enabled)
VALUES ('土流网', NULL, NULL, NULL, 1, 1);

-- 创建土流网用户 (role=project_publisher)
INSERT OR IGNORE INTO users (nickname, role, status, daily_quota, created_at, updated_at)
VALUES ('土流网', 'project_publisher', 'active', 100, datetime('now'), datetime('now'));

-- 更新 source_accounts 关联 user_id
UPDATE source_accounts SET user_id = (
  SELECT id FROM users WHERE nickname = '土流网' AND role = 'project_publisher' LIMIT 1
) WHERE name = '土流网' AND user_id IS NULL;
