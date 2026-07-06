-- =============================================
-- admin_audit_logs 表升级迁移脚本
-- 问题：audit.ts 写入了 user_role/module/level/before_data/after_data/user_agent 共 6 列
--       但 schema.sql 只定义了 8 列，缺少这 6 列
-- 修复：ALTER TABLE 新增缺失列
-- 执行：wrangler d1 execute zjd-main --remote --file=./sql/audit-logs-upgrade.sql
-- =============================================

ALTER TABLE admin_audit_logs ADD COLUMN user_role TEXT;
ALTER TABLE admin_audit_logs ADD COLUMN module TEXT;
ALTER TABLE admin_audit_logs ADD COLUMN level TEXT DEFAULT 'info';
ALTER TABLE admin_audit_logs ADD COLUMN before_data TEXT;
ALTER TABLE admin_audit_logs ADD COLUMN after_data TEXT;
ALTER TABLE admin_audit_logs ADD COLUMN user_agent TEXT;
