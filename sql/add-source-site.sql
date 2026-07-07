-- 采集来源标记（前台卡片标签显示「第三方」用）
-- 1. 添加字段
ALTER TABLE assets ADD COLUMN source_site TEXT;

-- 2. 回填老的采集数据（source_url 有值说明是采集的）
UPDATE assets SET source_site = '1' WHERE source_url IS NOT NULL AND source_url != '';
