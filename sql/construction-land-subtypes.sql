-- 建设用地二级分类
-- 将'建设用地'拆分为三个子类型

-- 方法1：直接在 asset_types 表中新增子类型（推荐，简单直接）
INSERT INTO asset_types (name, icon, description, sort_order) VALUES
('集体建设用地', '🏗️', '集体建设用地使用权流转', 7),
('国有建设用地', '🏛️', '国有建设用地使用权流转', 8),
('集体经营性建设用地', '🏭', '集体经营性建设用地入市流转', 9);

-- 回填：将已有的'建设用地'资产改为'集体建设用地'（最常见类型）
UPDATE assets SET asset_type = '集体建设用地' WHERE asset_type = '建设用地';
UPDATE bulk_projects SET asset_type = '集体建设用地' WHERE asset_type = '建设用地';

-- 方法2（可选）：如果想保留主分类+子分类结构，新增 sub_type 字段
-- ALTER TABLE assets ADD COLUMN sub_type TEXT;
-- ALTER TABLE bulk_projects ADD COLUMN sub_type TEXT;
```

**说明**：
- 方法1更简单，子类型直接作为 asset_type 使用，筛选和展示都不需要改逻辑
- 方法2更灵活，但需要改筛选和展示逻辑
- 推荐方法1，三个子类型在金刚区可以合并显示为"建设用地"分组
