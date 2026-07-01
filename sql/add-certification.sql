-- 迁移脚本：给 assets 表添加 certification 字段
-- 执行方式：wrangler d1 execute zjd-main --file=./sql/add-certification.sql

ALTER TABLE assets ADD COLUMN certification TEXT DEFAULT 'uncertified';

-- 给现有种子数据标记为已确权（可选）
UPDATE assets SET certification = 'certified' WHERE source_type = 'official' AND id <= 20;
