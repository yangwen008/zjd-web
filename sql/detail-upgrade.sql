-- 详情页升级：新增交通信息、权证信息字段
-- assets 表
ALTER TABLE assets ADD COLUMN transport_info TEXT;
ALTER TABLE assets ADD COLUMN cert_info TEXT;

-- bulk_projects 表
ALTER TABLE bulk_projects ADD COLUMN transport_info TEXT;
ALTER TABLE bulk_projects ADD COLUMN cert_info TEXT;
