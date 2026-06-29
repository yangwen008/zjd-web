-- =============================================
-- zjd.cn 种子数据 (Cloudflare D1)
-- 金禾计划 v8.8.1
-- =============================================

-- 1. 首页配置
INSERT OR IGNORE INTO homepage_config (key, value) VALUES
  ('hero_title', '寻找被低估的低密度空间资产'),
  ('hero_subtitle', '乡村资产数字化绿色流转中枢。全网多源产权低频提纯，一键交叉碰撞，让技术重归山川。'),
  ('total_assets', '104281'),
  ('today_new', '142'),
  ('company_name', '绵阳网安科技有限公司'),
  ('company_phone', '13696266999'),
  ('company_email', 'contact@zjd.cn'),
  ('icp_number', '蜀ICP备16015085号-5'),
  -- 板块配置：热点寻源
  ('section_regions_title', '核心地点寻源区'),
  ('section_regions_subtitle', '默认按本站最热点击量、收藏量降序排列'),
  ('section_regions_count', '6'),
  -- 板块配置：行情数据
  ('section_market_title', '省级行政细分流速与交易深度'),
  ('section_market_subtitle', 'CONNECTED'),
  -- 板块配置：官方原矿
  ('section_official_title', '纯净一手官方原矿区'),
  ('section_official_subtitle', '进入原矿搜寻引擎'),
  ('section_official_count', '6'),
  -- 板块配置：村委直发
  ('section_village_title', '村集体直发专区'),
  ('section_village_subtitle', '查看所有村委直发'),
  ('section_village_count', '2'),
  -- 板块配置：大宗路演
  ('section_bulk_title', '文旅大宗产业路演带'),
  ('section_bulk_subtitle', '进入独立路演大厅'),
  ('section_bulk_count', '2'),
  -- 板块配置：基建指标
  ('section_infra_title', '数字化隐居基建硬指标'),
  ('section_infra_subtitle', '查看全国基建指数表'),
  ('section_infra_count', '6'),
  -- 板块配置：合伙人
  ('section_brokers_title', '本地金牌"农房合伙人"联播网'),
  ('section_brokers_subtitle', '查看全网合伙人名册'),
  ('section_brokers_count', '3'),
  ('police_record', ''),
  ('footer_about', '乡村闲置资产数字交易所。全网多源产权低频提纯，让技术重归山川。'),
  ('featured_slots', '["1","2","3","4","5","6"]');

-- 2. 超级管理员
INSERT OR IGNORE INTO users (openid, nickname, role, status, verified) VALUES
  ('admin_init', '系统管理员', 'superadmin', 'active', 1);

-- 3. 行情数据
INSERT OR IGNORE INTO market_data (province, median_price, change_pct, bargain_space, total_listings) VALUES
  ('浙江省', 14.2, 4.2, -5.4, 1420),
  ('四川省', 7.8, 1.8, -12.4, 892),
  ('云南省', 4.5, 0, -18.2, 415),
  ('贵州省', 3.2, -1.5, -22.1, 286),
  ('广西壮族自治区', 3.8, 0.5, -19.5, 198);

-- 4. 基建评分
INSERT OR IGNORE INTO infrastructure_ratings (region, signal_5g_ms, hospital_min, grid_redundancy, overall_grade, province, city) VALUES
  ('杭州·安吉', 12, 8, 98, 'S+', '浙江省', '湖州市'),
  ('成都·都江堰', 18, 12, 95, 'S', '四川省', '成都市'),
  ('大理·苍洱', 35, 25, 92, 'A+', '云南省', '大理州'),
  ('丽水·缙云', 42, 30, 88, 'A', '浙江省', '丽水市'),
  ('桂林·阳朔', 48, 35, 85, 'A-', '广西壮族自治区', '桂林市'),
  ('北京·延庆', 15, 10, 96, 'S', '北京市', '延庆区');

-- 5. 合伙人
INSERT OR IGNORE INTO users (openid, nickname, role, status, verified, phone) VALUES
  ('broker_zhang', '张大山', 'broker', 'active', 1, '13800001111'),
  ('broker_li', '李秀英', 'broker', 'active', 1, '13800002222'),
  ('broker_wang', '王铁柱', 'broker', 'active', 1, '13800003333'),
  ('broker_zhao', '赵翠花', 'broker', 'active', 1, '13800004444'),
  ('broker_liu', '刘大牛', 'broker', 'active', 1, '13800005555');

INSERT OR IGNORE INTO brokers (user_id, name, region, province, city, bio, specialties, rating, show_count, good_rate, status) VALUES
  (2, '张大山', '浙江安吉', '浙江省', '湖州市', '安吉本地人，深耕乡村房产10年，熟悉每一块宅基地', '["宅基地","茶园","民宿改造"]', 'gold', 128, 98, 'active'),
  (3, '李秀英', '四川都江堰', '四川省', '成都市', '都江堰文旅协会成员，专注青城山周边林地流转', '["林地","茶园","康养项目"]', 'silver', 86, 95, 'active'),
  (4, '王铁柱', '云南大理', '云南省', '大理州', '大理古城老房东，白族老宅改造专家', '["古宅","民宿改造","文旅项目"]', 'silver', 64, 97, 'active'),
  (5, '赵翠花', '丽水缙云', '浙江省', '丽水市', '缙云仙都景区金牌地陪，石头房民宿运营顾问', '["宅基地","石头房","景区民宿"]', 'bronze', 52, 96, 'active'),
  (6, '刘大牛', '桂林阳朔', '广西壮族自治区', '桂林市', '阳朔十里画廊片区负责人，精通农房租赁法规', '["宅基地","院落","法规咨询"]', 'bronze', 45, 94, 'active');

-- 6. 20条测试资产数据
INSERT OR IGNORE INTO assets (title, description, location, province, city, district, area_mu, price_year, price_total, lease_years, asset_type, source_type, images, gps_lat, gps_lng, contact_phone, contact_name, views, status, featured, user_id) VALUES

-- 官方原矿 (official) - 8条
('杭州·安吉溪龙乡溪畔宅基地', '安吉白茶核心产区，溪流环绕，竹林掩映。距杭州城区1.5小时车程，已通自来水、5G网络。适合精品民宿或隐居改造。', '浙江省湖州市安吉县溪龙乡', '浙江省', '湖州市', '安吉县', 3.2, 12.8, 256, 20, '宅基地', 'official', '["https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800"]', 30.63, 119.68, '13800001001', '安吉溪龙乡政府', 18420, 'approved', 1, 1),

('成都·都江堰青城山后山林地', '青城山后山天然林地，负氧离子浓度极高。可做康养基地、中草药种植或高端露营地。距成都双流机场1小时。', '四川省成都市都江堰市青城山镇', '四川省', '成都市', '都江堰市', 28.5, 6.5, 130, 30, '林地', 'official', '["https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800"]', 30.90, 103.58, '13800001002', '都江堰林业局', 17120, 'approved', 1, 1),

('大理·苍山脚下白族传统老宅', '完整保留白族三坊一照壁建筑格局，百年老宅修缮良好。距大理古城8公里，苍山索道步行15分钟。', '云南省大理州大理市银桥镇', '云南省', '大理州', '大理市', 1.8, 3.2, 64, 20, '古宅', 'official', '["https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800"]', 25.69, 100.16, '13800001003', '大理文旅局', 12480, 'approved', 1, 1),

('丽水·缙云仙都景区旁石头房', '缙云独特火山岩建筑，冬暖夏凉。紧邻仙都风景区，门前即为好溪。适合极客工作室或精品民宿。', '浙江省丽水市缙云县仙都街道', '浙江省', '丽水市', '缙云县', 2.1, 5.8, 116, 20, '宅基地', 'official', '["https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800"]', 28.66, 120.07, '13800001004', '缙云仙都管委会', 9430, 'approved', 1, 1),

('桂林·阳朔遇龙河畔院落', '遇龙河核心景观带，推窗即见喀斯特峰林。占地2亩，含主楼、副楼、庭院。已有民宿经营许可。', '广西桂林市阳朔县白沙镇', '广西壮族自治区', '桂林市', '阳朔县', 2.0, 4.2, 84, 20, '宅基地', 'official', '["https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800"]', 24.92, 110.49, '13800001005', '阳朔旅游局', 8940, 'approved', 1, 1),

('北京·延庆八达岭长城脚下老院', '长城景观保护区外，合法流转。四合院格局，翻新后可做高端会所或文化体验馆。距北京市区1.5小时。', '北京市延庆区八达岭镇', '北京市', '延庆区', '八达岭镇', 1.5, 9.6, 192, 20, '宅基地', 'official', '["https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800"]', 40.36, 116.00, '13800001006', '延庆文旅投', 6510, 'approved', 1, 1),

('杭州·千岛湖畔独栋老宅', '千岛湖西南湖区，湖景一线。独栋石木结构老宅，带果园3亩。适合湖畔度假庄园改造。', '浙江省杭州市淳安县界首乡', '浙江省', '杭州市', '淳安县', 5.5, 8.2, 164, 20, '宅基地', 'official', '["https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800"]', 29.61, 118.87, '13800001007', '淳安千岛湖管理局', 5820, 'approved', 1, 1),

('恩施·利川苏马荡避暑山居', '海拔1400米，夏季均温22℃。已建成避暑小院，含菜地、鱼塘。重庆武汉3小时高铁直达。', '湖北省恩施州利川市谋道镇', '湖北省', '恩施州', '利川市', 4.0, 2.8, 56, 20, '宅基地', 'official', '["https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800"]', 30.48, 108.93, '13800001008', '利川苏马荡管委会', 4680, 'approved', 0, 1),

-- 村委直营 (village) - 6条
('安吉·余村绿水青山示范区宅基地', '两山理论发源地，村委直发。紧邻余村游客中心，配套完善。适合生态文旅项目。', '浙江省湖州市安吉县天荒坪镇余村', '浙江省', '湖州市', '安吉县', 2.8, 15.0, 300, 20, '宅基地', 'village', '["https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800"]', 30.59, 119.62, '13800002001', '余村村委会', 15600, 'approved', 1, 1),

('都江堰·虹口漂流景区林盘', '成都市民周末度假热门地。川西林盘保护性开发，含竹林、水渠、老院落群。', '四川省成都市都江堰市虹口乡', '四川省', '成都市', '都江堰市', 12.0, 8.8, 176, 30, '林盘', 'village', '["https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800"]', 31.02, 103.65, '13800002002', '虹口乡政府', 11200, 'approved', 1, 1),

('大理·喜洲古镇白族院落群', '喜洲古镇核心区，严家大院旁。5栋白族传统院落整体流转，可做精品酒店群。', '云南省大理州大理市喜洲镇', '云南省', '大理州', '大理市', 8.0, 5.5, 165, 30, '古宅群', 'village', '["https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800"]', 25.82, 100.13, '13800002003', '喜洲镇政府', 9800, 'approved', 0, 1),

('阳朔·兴坪古镇漓江边老宅', '20元人民币背景取景地旁。三层临江老宅，顶楼可直接观赏黄布倒影。', '广西桂林市阳朔县兴坪镇', '广西壮族自治区', '桂林市', '阳朔县', 0.8, 6.0, 120, 20, '宅基地', 'village', '["https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800"]', 24.99, 110.59, '13800002004', '兴坪镇政府', 8200, 'approved', 0, 1),

('缙云·壶镇古街商铺老宅', '壶镇千年古街核心区，前店后院格局。适合文创工坊、非遗体验馆或特色餐饮。', '浙江省丽水市缙云县壶镇', '浙江省', '丽水市', '缙云县', 0.6, 4.5, 90, 20, '商铺', 'village', '["https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800"]', 28.73, 120.22, '13800002005', '壶镇古街管委会', 6700, 'approved', 0, 1),

('延庆·柳沟村凤凰城老院', '柳沟豆腐宴发源地，民俗旅游成熟。三进院落，可做高端四合院民宿。', '北京市延庆区井庄镇柳沟村', '北京市', '延庆区', '井庄镇', 1.2, 7.8, 156, 20, '宅基地', 'village', '["https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800"]', 40.43, 116.09, '13800002006', '柳沟村委会', 5400, 'approved', 0, 1),

-- 经纪人UGC (ugc) - 6条
('千岛湖·姜家镇文渊狮城旁古宅', '文渊狮城景区步行5分钟，新安江水库移民古村落。徽派建筑保存完好，适合研学基地。', '浙江省杭州市淳安县姜家镇', '浙江省', '杭州市', '淳安县', 3.0, 6.8, 136, 20, '古宅', 'ugc', '["https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800"]', 29.52, 118.79, '13800003001', '张大山', 5100, 'approved', 0, 2),

('青城山·大观镇茶山田园综合体', '青城道茶核心产区，含茶园8亩、加工厂房、宿舍楼。可做茶旅融合项目。', '四川省成都市都江堰市大观镇', '四川省', '成都市', '都江堰市', 15.0, 12.0, 240, 30, '茶园', 'ugc', '["https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800"]', 30.85, 103.52, '13800003002', '李秀英', 4800, 'approved', 0, 3),

('大理·双廊古镇洱海边白族院', '双廊古镇核心区，正对洱海玉几岛。白族三合院，适合海景民宿或艺术工作室。', '云南省大理州大理市双廊镇', '云南省', '大理州', '大理市', 1.2, 7.5, 150, 20, '古宅', 'ugc', '["https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800"]', 25.97, 100.18, '13800003003', '王铁柱', 4500, 'approved', 0, 4),

('阳朔·旧县村攀岩基地旁老宅', '旧县村国际攀岩基地旁，户外运动爱好者聚集地。含庭院、菜地，适合户外主题民宿。', '广西桂林市阳朔县旧县村', '广西壮族自治区', '桂林市', '阳朔县', 1.5, 3.8, 76, 20, '宅基地', 'ugc', '["https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800"]', 24.88, 110.45, '13800003004', '刘大牛', 4200, 'approved', 0, 6),

('缙云·新建镇石头古村落', '浙南独特的火山岩古村落，整村可做艺术乡建项目。含20栋石头房、古桥、溪流。', '浙江省丽水市缙云县新建镇', '浙江省', '丽水市', '缙云县', 25.0, 18.0, 360, 30, '古村落', 'ugc', '["https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800"]', 28.58, 120.15, '13800003005', '赵翠花', 3800, 'approved', 0, 5),

('利川·苏马荡森林木屋群', '苏马荡核心避暑区，10栋独立森林木屋已建成。含停车场、公共厨房、观景平台。', '湖北省恩施州利川市苏马荡', '湖北省', '恩施州', '利川市', 8.0, 5.2, 104, 20, '民宿群', 'ugc', '["https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800"]', 30.45, 108.90, '13800003006', '张大山', 3500, 'approved', 0, 2);

-- 7. 行政区划
INSERT OR IGNORE INTO regions (code, name, level, parent_code, path, province, city, emoji, lat, lng, sort_order) VALUES
  -- 省级 (path = 'CN/XX/')
  ('330000', '浙江省', 'province', NULL, 'CN/ZJ/', NULL, NULL, '🌊', 30.27, 120.15, 1),
  ('510000', '四川省', 'province', NULL, 'CN/SC/', NULL, NULL, '🐼', 30.57, 104.07, 2),
  ('530000', '云南省', 'province', NULL, 'CN/YN/', NULL, NULL, '🌸', 25.04, 102.68, 3),
  ('520000', '贵州省', 'province', NULL, 'CN/GZ/', NULL, NULL, '🌄', 26.65, 106.63, 4),
  ('450000', '广西壮族自治区', 'province', NULL, 'CN/GX/', NULL, NULL, '🏞️', 22.82, 108.32, 5),
  ('110000', '北京市', 'province', NULL, 'CN/BJ/', NULL, NULL, '🏛️', 39.90, 116.40, 6),
  ('420000', '湖北省', 'province', NULL, 'CN/HB/', NULL, NULL, '🌾', 30.59, 114.30, 7),
  ('350000', '福建省', 'province', NULL, 'CN/FJ/', NULL, NULL, '🍵', 26.07, 119.30, 8),
  ('320000', '江苏省', 'province', NULL, 'CN/JS/', NULL, NULL, '🏯', 32.06, 118.80, 9),
  ('310000', '上海市', 'province', NULL, 'CN/SH/', NULL, NULL, '🏙️', 31.23, 121.47, 10),
  -- 浙江省城市 (path = 'CN/ZJ/XX/')
  ('330100', '杭州市', 'city', '330000', 'CN/ZJ/HZ/', '浙江省', NULL, NULL, 30.27, 120.15, 1),
  ('330500', '湖州市', 'city', '330000', 'CN/ZJ/HUZ/', '浙江省', NULL, NULL, 30.89, 120.09, 2),
  ('331100', '丽水市', 'city', '330000', 'CN/ZJ/LS/', '浙江省', NULL, NULL, 28.47, 119.92, 3),
  ('330600', '绍兴市', 'city', '330000', 'CN/ZJ/SX/', '浙江省', NULL, NULL, 30.00, 120.58, 4),
  -- 四川省城市
  ('510100', '成都市', 'city', '510000', 'CN/SC/CD/', '四川省', NULL, NULL, 30.57, 104.07, 1),
  ('511100', '乐山市', 'city', '510000', 'CN/SC/LS/', '四川省', NULL, NULL, 29.55, 103.77, 2),
  -- 云南省城市
  ('532900', '大理州', 'city', '530000', 'CN/YN/DL/', '云南省', NULL, NULL, 25.59, 100.23, 1),
  ('530700', '丽江市', 'city', '530000', 'CN/YN/LJ/', '云南省', NULL, NULL, 26.87, 100.23, 2),
  -- 贵州省城市
  ('552600', '黔东南州', 'city', '520000', 'CN/GZ/QDN/', '贵州省', NULL, NULL, 26.58, 107.98, 1),
  -- 广西城市
  ('450300', '桂林市', 'city', '450000', 'CN/GX/GL/', '广西壮族自治区', NULL, NULL, 25.27, 110.29, 1),
  ('450500', '北海市', 'city', '450000', 'CN/GX/BH/', '广西壮族自治区', NULL, NULL, 21.48, 109.12, 2),
  -- 北京市区
  ('110119', '延庆区', 'city', '110000', 'CN/BJ/YQ/', '北京市', NULL, NULL, 40.45, 115.97, 1),
  -- 湖北省城市
  ('422800', '恩施州', 'city', '420000', 'CN/HB/ES/', '湖北省', NULL, NULL, 30.27, 109.49, 1),
  -- 福建省城市
  ('350800', '龙岩市', 'city', '350000', 'CN/FJ/LY/', '福建省', NULL, NULL, 25.08, 117.02, 1);

-- 8. 资产类型
INSERT OR IGNORE INTO asset_types (name, icon, description, sort_order) VALUES
  ('宅基地', '🏠', '农村宅基地使用权流转', 1),
  ('林地', '🌲', '林地承包经营权流转', 2),
  ('茶园', '🍵', '茶园经营权流转', 3),
  ('古宅', '🏘️', '传统古建筑保护性流转', 4),
  ('厂房', '🏭', '集体建设用地厂房流转', 5),
  ('商铺', '🏪', '沿街商铺经营权流转', 6),
  ('林盘', '🌿', '川西林盘保护性开发', 7),
  ('古村落', '🏚️', '整村保护性开发流转', 8),
  ('民宿群', '🏡', '已建成民宿群整体流转', 9);

-- 9. 大宗路演项目
INSERT OR IGNORE INTO bulk_projects (title, code, description, location, province, city, district, area_mu, area_sqm, price_start, yield_rate, lease_years, certification, planning_use, images, gps_lat, gps_lng, contact_phone, contact_name, views, status, featured, user_id) VALUES
  ('莫干山辐射圈 · 闲置集体村办小学校舍整栋流转招商', 'ZJD-001', '包含完整苏式红砖多功能空间、宽敞院落。权属已归属乡村经济合作社，AI测算黄金投资回报周期约5.8年。', '浙江省湖州市德清县莫干山镇', '浙江省', '湖州市', '德清县', 15.0, 1220, 15.0, 6.80, 30, 'certified', '文旅', '["https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800"]', 30.55, 119.92, '13800004001', '莫干山镇合作社', 8920, 'approved', 1, 1),
  ('都江堰青城山旁 · 45亩传统梯田茶园配3栋闲置库房', 'ZJD-0055', '首期已由村委办协调完成林地林权排他性测绘，提供小溪及微水电野奢级配接入方案。适合品牌文旅民宿带开发。', '四川省成都市都江堰市青城山镇', '四川省', '成都市', '都江堰市', 45.0, 1300, 18.5, 6.80, 30, 'certified', '康养', '["https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800"]', 30.90, 103.58, '13800004002', '青城山镇合作社', 7650, 'approved', 1, 1);

-- 10. 角色定义
INSERT OR IGNORE INTO roles (code, name, description, level, is_system) VALUES
  ('user', '普通用户', '浏览、收藏、发布UGC资产', 10, 1),
  ('broker', '合伙人', '发布房源、查看线索', 20, 1),
  ('village_org', '村集体', '发布村委直发资产、查看线索', 20, 1),
  ('data_editor', '数据录入员', '录入基建/行情等数据', 15, 1),
  ('project_publisher', '项目发布者', '发布大宗路演项目', 25, 1),
  ('admin', '平台运营', '资产审核、内容维护、数据管理', 50, 1),
  ('superadmin', '超级管理员', '系统管理、用户管理、全局配置', 100, 1);

-- 11. 权限定义
INSERT OR IGNORE INTO permissions (code, name, module, description) VALUES
  ('asset:create', '发布资产', 'asset', '创建新资产记录'),
  ('asset:create:official', '发布官方原矿', 'asset', '创建source_type=official的资产'),
  ('asset:create:village', '发布村委直发', 'asset', '创建source_type=village的资产'),
  ('asset:create:ugc', '发布UGC资产', 'asset', '创建source_type=ugc的资产'),
  ('asset:read', '查看所有资产', 'asset', '查看所有用户的资产'),
  ('asset:read:own', '查看自己的资产', 'asset', '仅查看自己发布的资产'),
  ('asset:update', '编辑所有资产', 'asset', '编辑任何资产'),
  ('asset:update:own', '编辑自己的资产', 'asset', '仅编辑自己发布的资产'),
  ('asset:delete', '删除所有资产', 'asset', '删除任何资产'),
  ('asset:delete:own', '删除自己的资产', 'asset', '仅删除自己发布的资产'),
  ('asset:audit', '审核资产', 'asset', '批准/拒绝待审核资产'),
  ('asset:feature', '橱窗推荐', 'asset', '设置featured推荐标记'),
  ('bulk:create', '发布大宗项目', 'bulk', '创建大宗路演项目'),
  ('bulk:read', '查看所有大宗项目', 'bulk', '查看所有大宗项目'),
  ('bulk:read:own', '查看自己的大宗项目', 'bulk', '仅查看自己发布的大宗项目'),
  ('bulk:update', '编辑所有大宗项目', 'bulk', '编辑任何大宗项目'),
  ('bulk:update:own', '编辑自己的大宗项目', 'bulk', '仅编辑自己发布的大宗项目'),
  ('bulk:delete', '删除大宗项目', 'bulk', '删除大宗项目'),
  ('bulk:audit', '审核大宗项目', 'bulk', '审核待发布的大宗项目'),
  ('infra:create', '录入基建数据', 'infra', '创建基建评分记录'),
  ('infra:read', '查看所有基建数据', 'infra', '查看所有基建评分'),
  ('infra:read:own', '查看负责区域基建', 'infra', '仅查看自己负责区域的基建数据'),
  ('infra:update', '编辑所有基建数据', 'infra', '编辑任何基建评分'),
  ('infra:update:own', '编辑负责区域基建', 'infra', '仅编辑自己负责区域的基建数据'),
  ('infra:audit', '审核基建数据', 'infra', '审核待发布的基建数据'),
  ('market:create', '录入行情数据', 'market', '创建行情数据记录'),
  ('market:read', '查看行情数据', 'market', '查看行情数据'),
  ('market:update', '编辑行情数据', 'market', '编辑行情数据'),
  ('market:delete', '删除行情数据', 'market', '删除行情数据'),
  ('partner:create', '新增合伙人', 'partner', '创建合伙人记录'),
  ('partner:read', '查看所有合伙人', 'partner', '查看所有合伙人'),
  ('partner:update', '编辑合伙人', 'partner', '编辑合伙人信息'),
  ('partner:delete', '删除合伙人', 'partner', '删除合伙人'),
  ('partner:audit', '审核合伙人', 'partner', '审核合伙人申请'),
  ('user:read', '查看所有用户', 'user', '查看用户列表'),
  ('user:update', '编辑用户', 'user', '编辑用户信息'),
  ('user:assign_role', '分配角色', 'user', '修改用户角色'),
  ('user:ban', '封禁用户', 'user', '封禁/解封用户'),
  ('user:audit', '审核用户注册', 'user', '审核角色申请'),
  ('lead:read:own', '查看自己的线索', 'lead', '仅查看与自己资产相关的线索'),
  ('lead:read', '查看所有线索', 'lead', '查看所有线索'),
  ('lead:assign', '分配线索', 'lead', '将线索分配给合伙人'),
  ('favorite:manage', '管理收藏', 'favorite', '添加/取消收藏'),
  ('scraper:manage', '管理爬虫配方', 'scraper', '增删改查爬虫配方'),
  ('scraper:execute', '执行爬虫', 'scraper', '手动触发爬虫'),
  ('staging:manage', '管理暂存数据', 'staging', '清洗/导入/删除暂存数据'),
  ('config:read', '查看配置', 'config', '查看系统配置'),
  ('config:update', '修改配置', 'config', '修改系统配置'),
  ('audit:read', '查看审计日志', 'audit', '查看审计日志'),
  ('ai:read', '查看AI用量', 'ai', '查看AI用量统计'),
  ('ai:config', '配置AI参数', 'ai', '配置AI预算和参数');

-- 12. 角色-权限映射
-- user（普通用户）
INSERT OR IGNORE INTO role_permissions (role, permission) VALUES
  ('user', 'asset:create:ugc'), ('user', 'asset:read:own'), ('user', 'asset:update:own'), ('user', 'asset:delete:own'),
  ('user', 'favorite:manage'), ('user', 'lead:read:own');

-- broker（合伙人）
INSERT OR IGNORE INTO role_permissions (role, permission) VALUES
  ('broker', 'asset:create:ugc'), ('broker', 'asset:read:own'), ('broker', 'asset:update:own'), ('broker', 'asset:delete:own'),
  ('broker', 'lead:read:own'), ('broker', 'favorite:manage');

-- village_org（村集体）
INSERT OR IGNORE INTO role_permissions (role, permission) VALUES
  ('village_org', 'asset:create:village'), ('village_org', 'asset:create:ugc'),
  ('village_org', 'asset:read:own'), ('village_org', 'asset:update:own'), ('village_org', 'asset:delete:own'),
  ('village_org', 'lead:read:own'), ('village_org', 'favorite:manage');

-- data_editor（数据录入员）
INSERT OR IGNORE INTO role_permissions (role, permission) VALUES
  ('data_editor', 'infra:create'), ('data_editor', 'infra:read:own'), ('data_editor', 'infra:update:own'),
  ('data_editor', 'market:create'), ('data_editor', 'market:read');

-- project_publisher（项目发布者）
INSERT OR IGNORE INTO role_permissions (role, permission) VALUES
  ('project_publisher', 'bulk:create'), ('project_publisher', 'bulk:read:own'),
  ('project_publisher', 'bulk:update:own'), ('project_publisher', 'bulk:delete');

-- admin（平台运营）
INSERT OR IGNORE INTO role_permissions (role, permission) VALUES
  ('admin', 'asset:create'), ('admin', 'asset:create:official'), ('admin', 'asset:create:village'), ('admin', 'asset:create:ugc'),
  ('admin', 'asset:read'), ('admin', 'asset:update'), ('admin', 'asset:delete'), ('admin', 'asset:audit'), ('admin', 'asset:feature'),
  ('admin', 'bulk:create'), ('admin', 'bulk:read'), ('admin', 'bulk:update'), ('admin', 'bulk:audit'),
  ('admin', 'infra:create'), ('admin', 'infra:read'), ('admin', 'infra:update'), ('admin', 'infra:audit'),
  ('admin', 'market:create'), ('admin', 'market:read'), ('admin', 'market:update'), ('admin', 'market:delete'),
  ('admin', 'partner:create'), ('admin', 'partner:read'), ('admin', 'partner:update'), ('admin', 'partner:audit'),
  ('admin', 'user:read'), ('admin', 'user:audit'), ('admin', 'user:ban'),
  ('admin', 'lead:read'), ('admin', 'lead:assign'),
  ('admin', 'scraper:manage'), ('admin', 'scraper:execute'), ('admin', 'staging:manage'),
  ('admin', 'config:read'), ('admin', 'config:update'), ('admin', 'audit:read'), ('admin', 'ai:read');

-- superadmin（超级管理员）拥有所有权限
INSERT OR IGNORE INTO role_permissions (role, permission)
  SELECT 'superadmin', code FROM permissions;

-- 13. 同步 FTS5 全文搜索索引
INSERT INTO assets_fts(rowid, title, description, location, province, city)
  SELECT id, title, description, location, province, city FROM assets;
