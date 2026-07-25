-- 资产编号字段迁移
ALTER TABLE assets ADD COLUMN asset_code TEXT;
CREATE INDEX IF NOT EXISTS idx_assets_code ON assets(asset_code);

-- 回填已有资产编号（按 id 生成）
-- 注意：需要在 Cloudflare Dashboard 执行，D1 不支持 UPDATE...FROM 子句
-- 先更新有省市区的资产
UPDATE assets SET asset_code = (
  CASE
    WHEN province = '北京市' THEN 'BJ'
    WHEN province = '天津市' THEN 'TJ'
    WHEN province = '上海市' THEN 'SH'
    WHEN province = '重庆市' THEN 'CQ'
    WHEN province = '河北省' THEN 'HE'
    WHEN province = '山西省' THEN 'SX'
    WHEN province = '辽宁省' THEN 'LN'
    WHEN province = '吉林省' THEN 'JL'
    WHEN province = '黑龙江省' THEN 'HL'
    WHEN province = '江苏省' THEN 'JS'
    WHEN province = '浙江省' THEN 'ZJ'
    WHEN province = '安徽省' THEN 'AH'
    WHEN province = '福建省' THEN 'FJ'
    WHEN province = '江西省' THEN 'JX'
    WHEN province = '山东省' THEN 'SD'
    WHEN province = '河南省' THEN 'HA'
    WHEN province = '湖北省' THEN 'HB'
    WHEN province = '湖南省' THEN 'HN'
    WHEN province = '广东省' THEN 'GD'
    WHEN province = '海南省' THEN 'HI'
    WHEN province = '四川省' THEN 'SC'
    WHEN province = '贵州省' THEN 'GZ'
    WHEN province = '云南省' THEN 'YN'
    WHEN province = '陕西省' THEN 'SN'
    WHEN province = '甘肃省' THEN 'GS'
    WHEN province = '青海省' THEN 'QH'
    WHEN province LIKE '%内蒙%' THEN 'NM'
    WHEN province LIKE '%广西%' THEN 'GX'
    WHEN province LIKE '%西藏%' THEN 'XZ'
    WHEN province LIKE '%宁夏%' THEN 'NX'
    WHEN province LIKE '%新疆%' THEN 'XJ'
    ELSE 'QT'
  END
) || '-' || printf('%05d', id)
WHERE asset_code IS NULL;
