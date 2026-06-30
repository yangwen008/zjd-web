-- =============================================
-- 修复区县 province 字段错误
-- 问题：所有区县的 province 都被错误地设为 '四川省'
-- 修复：根据 city 的正确 province 来更新
-- =============================================

-- 1. 浙江省城市 → 修正为浙江省
UPDATE regions SET province = '浙江省'
WHERE level = 'district' AND city IN (
  SELECT name FROM regions r2 WHERE r2.level = 'city' AND r2.province = '浙江省'
);

-- 2. 四川省城市 → 保留四川省（成都等已经是正确的）
-- 不需要修改，因为四川城市的区县已经是 '四川省'

-- 3. 如果还有其他省份的区县需要修复，按同样逻辑添加
-- UPDATE regions SET province = '云南省'
-- WHERE level = 'district' AND city IN (
--   SELECT name FROM regions r2 WHERE r2.level = 'city' AND r2.province = '云南省'
-- );

-- 验证修复结果
-- SELECT province, city, COUNT(*) as cnt
-- FROM regions WHERE level = 'district'
-- GROUP BY province, city
-- ORDER BY province, city;
