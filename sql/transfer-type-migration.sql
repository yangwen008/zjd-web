-- 流转方式字段迁移
-- assets 表新增 transfer_type
ALTER TABLE assets ADD COLUMN transfer_type TEXT DEFAULT 'lease';
CREATE INDEX IF NOT EXISTS idx_assets_transfer ON assets(transfer_type);

-- bulk_projects 表新增 transfer_type
ALTER TABLE bulk_projects ADD COLUMN transfer_type TEXT DEFAULT 'lease';

-- 回填已有数据（默认租赁）
UPDATE assets SET transfer_type = 'lease' WHERE transfer_type IS NULL;
UPDATE bulk_projects SET transfer_type = 'lease' WHERE transfer_type IS NULL;
