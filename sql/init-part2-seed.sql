-- zjd.cn 种子数据 (Cloudflare D1)
-- 建表完成后执行此脚本

-- 首页配置
INSERT INTO homepage_config (key, value) VALUES ('hero_title', '寻找被低估的低密度空间资产');
INSERT INTO homepage_config (key, value) VALUES ('hero_subtitle', '乡村资产数字化绿色流转中枢。全网多源产权低频提纯，一键交叉碰撞，让技术重归山川。');
INSERT INTO homepage_config (key, value) VALUES ('total_assets', '104281');
INSERT INTO homepage_config (key, value) VALUES ('today_new', '142');
INSERT INTO homepage_config (key, value) VALUES ('company_name', '绵阳网安科技有限公司');
INSERT INTO homepage_config (key, value) VALUES ('company_phone', '13696266999');
INSERT INTO homepage_config (key, value) VALUES ('company_email', 'contact@zjd.cn');
INSERT INTO homepage_config (key, value) VALUES ('icp_number', '蜀ICP备16015085号-5');
INSERT INTO homepage_config (key, value) VALUES ('police_record', '');
INSERT INTO homepage_config (key, value) VALUES ('footer_about', '乡村闲置资产数字交易所。全网多源产权低频提纯，让技术重归山川。');

-- 超级管理员
INSERT INTO users (openid, nickname, role, status, verified) VALUES ('admin_init', '系统管理员', 'superadmin', 'active', 1);

-- 合伙人用户
INSERT INTO users (openid, nickname, role, status, verified, phone) VALUES ('broker_zhang', '张大山', 'broker', 'active', 1, '13800001111');
INSERT INTO users (openid, nickname, role, status, verified, phone) VALUES ('broker_li', '李秀英', 'broker', 'active', 1, '13800002222');
INSERT INTO users (openid, nickname, role, status, verified, phone) VALUES ('broker_wang', '王铁柱', 'broker', 'active', 1, '13800003333');
INSERT INTO users (openid, nickname, role, status, verified, phone) VALUES ('broker_zhao', '赵翠花', 'broker', 'active', 1, '13800004444');
INSERT INTO users (openid, nickname, role, status, verified, phone) VALUES ('broker_liu', '刘大牛', 'broker', 'active', 1, '13800005555');

-- 合伙人信息
INSERT INTO brokers (user_id, name, region, bio, rating, show_count, good_rate, status) VALUES (2, '张大山', '浙江安吉', '安吉本地人，深耕乡村房产10年，熟悉每一块宅基地', 'gold', 128, 98, 'active');
INSERT INTO brokers (user_id, name, region, bio, rating, show_count, good_rate, status) VALUES (3, '李秀英', '四川都江堰', '都江堰文旅协会成员，专注青城山周边林地流转', 'silver', 86, 95, 'active');
INSERT INTO brokers (user_id, name, region, bio, rating, show_count, good_rate, status) VALUES (4, '王铁柱', '云南大理', '大理古城老房东，白族老宅改造专家', 'silver', 64, 97, 'active');
INSERT INTO brokers (user_id, name, region, bio, rating, show_count, good_rate, status) VALUES (5, '赵翠花', '丽水缙云', '缙云仙都景区金牌地陪，石头房民宿运营顾问', 'bronze', 52, 96, 'active');
INSERT INTO brokers (user_id, name, region, bio, rating, show_count, good_rate, status) VALUES (6, '刘大牛', '桂林阳朔', '阳朔十里画廊片区负责人，精通农房租赁法规', 'bronze', 45, 94, 'active');

-- 行情数据
INSERT INTO market_data (province, median_price, change_pct, bargain_space, total_listings) VALUES ('浙江省', 14.2, 4.2, -5.4, 1420);
INSERT INTO market_data (province, median_price, change_pct, bargain_space, total_listings) VALUES ('四川省', 7.8, 1.8, -12.4, 892);
INSERT INTO market_data (province, median_price, change_pct, bargain_space, total_listings) VALUES ('云南省', 4.5, 0, -18.2, 415);
INSERT INTO market_data (province, median_price, change_pct, bargain_space, total_listings) VALUES ('贵州省', 3.2, -1.5, -22.1, 286);
INSERT INTO market_data (province, median_price, change_pct, bargain_space, total_listings) VALUES ('广西壮族自治区', 3.8, 0.5, -19.5, 198);

-- 基建评分
INSERT INTO infrastructure_ratings (region, signal_5g_ms, hospital_min, grid_redundancy, overall_grade) VALUES ('杭州·安吉', 12, 8, 98, 'S+');
INSERT INTO infrastructure_ratings (region, signal_5g_ms, hospital_min, grid_redundancy, overall_grade) VALUES ('成都·都江堰', 18, 12, 95, 'S');
INSERT INTO infrastructure_ratings (region, signal_5g_ms, hospital_min, grid_redundancy, overall_grade) VALUES ('大理·苍洱', 35, 25, 92, 'A+');
INSERT INTO infrastructure_ratings (region, signal_5g_ms, hospital_min, grid_redundancy, overall_grade) VALUES ('丽水·缙云', 42, 30, 88, 'A');
INSERT INTO infrastructure_ratings (region, signal_5g_ms, hospital_min, grid_redundancy, overall_grade) VALUES ('桂林·阳朔', 48, 35, 85, 'A-');
INSERT INTO infrastructure_ratings (region, signal_5g_ms, hospital_min, grid_redundancy, overall_grade) VALUES ('北京·延庆', 15, 10, 96, 'S');

-- ========== 20条测试资产 ==========

-- 官方原矿 1: 安吉宅基地
INSERT INTO assets (title, description, location, province, city, district, area_mu, price_year, price_total, lease_years, asset_type, source_type, images, gps_lat, gps_lng, contact_phone, contact_name, views, status, featured) VALUES ('杭州·安吉溪龙乡溪畔宅基地', '安吉白茶核心产区，溪流环绕，竹林掩映。距杭州城区1.5小时车程，已通自来水、5G网络。', '浙江省湖州市安吉县溪龙乡', '浙江省', '湖州市', '安吉县', 3.2, 12.8, 256, 20, '宅基地', 'official', '["https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800"]', 30.63, 119.68, '13800001001', '安吉溪龙乡政府', 18420, 'approved', 1);

-- 官方原矿 2: 都江堰林地
INSERT INTO assets (title, description, location, province, city, district, area_mu, price_year, price_total, lease_years, asset_type, source_type, images, gps_lat, gps_lng, contact_phone, contact_name, views, status, featured) VALUES ('成都·都江堰青城山后山林地', '青城山后山天然林地，负氧离子浓度极高。可做康养基地、中草药种植或高端露营地。', '四川省成都市都江堰市青城山镇', '四川省', '成都市', '都江堰市', 28.5, 6.5, 130, 30, '林地', 'official', '["https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800"]', 30.90, 103.58, '13800001002', '都江堰林业局', 17120, 'approved', 1);

-- 官方原矿 3: 大理古宅
INSERT INTO assets (title, description, location, province, city, district, area_mu, price_year, price_total, lease_years, asset_type, source_type, images, gps_lat, gps_lng, contact_phone, contact_name, views, status, featured) VALUES ('大理·苍山脚下白族传统老宅', '完整保留白族三坊一照壁建筑格局，百年老宅修缮良好。距大理古城8公里。', '云南省大理州大理市银桥镇', '云南省', '大理州', '大理市', 1.8, 3.2, 64, 20, '古宅', 'official', '["https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800"]', 25.69, 100.16, '13800001003', '大理文旅局', 12480, 'approved', 1);

-- 官方原矿 4: 缙云石头房
INSERT INTO assets (title, description, location, province, city, district, area_mu, price_year, price_total, lease_years, asset_type, source_type, images, gps_lat, gps_lng, contact_phone, contact_name, views, status, featured) VALUES ('丽水·缙云仙都景区旁石头房', '缙云独特火山岩建筑，冬暖夏凉。紧邻仙都风景区，门前即为好溪。', '浙江省丽水市缙云县仙都街道', '浙江省', '丽水市', '缙云县', 2.1, 5.8, 116, 20, '宅基地', 'official', '["https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800"]', 28.66, 120.07, '13800001004', '缙云仙都管委会', 9430, 'approved', 1);

-- 官方原矿 5: 阳朔院落
INSERT INTO assets (title, description, location, province, city, district, area_mu, price_year, price_total, lease_years, asset_type, source_type, images, gps_lat, gps_lng, contact_phone, contact_name, views, status, featured) VALUES ('桂林·阳朔遇龙河畔院落', '遇龙河核心景观带，推窗即见喀斯特峰林。占地2亩，含主楼、副楼、庭院。', '广西桂林市阳朔县白沙镇', '广西壮族自治区', '桂林市', '阳朔县', 2.0, 4.2, 84, 20, '宅基地', 'official', '["https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800"]', 24.92, 110.49, '13800001005', '阳朔旅游局', 8940, 'approved', 1);

-- 官方原矿 6: 延庆老院
INSERT INTO assets (title, description, location, province, city, district, area_mu, price_year, price_total, lease_years, asset_type, source_type, images, gps_lat, gps_lng, contact_phone, contact_name, views, status, featured) VALUES ('北京·延庆八达岭长城脚下老院', '长城景观保护区外，合法流转。四合院格局，翻新后可做高端会所或文化体验馆。', '北京市延庆区八达岭镇', '北京市', '延庆区', '八达岭镇', 1.5, 9.6, 192, 20, '宅基地', 'official', '["https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800"]', 40.36, 116.00, '13800001006', '延庆文旅投', 6510, 'approved', 1);

-- 官方原矿 7: 千岛湖老宅
INSERT INTO assets (title, description, location, province, city, district, area_mu, price_year, price_total, lease_years, asset_type, source_type, images, gps_lat, gps_lng, contact_phone, contact_name, views, status, featured) VALUES ('杭州·千岛湖畔独栋老宅', '千岛湖西南湖区，湖景一线。独栋石木结构老宅，带果园3亩。', '浙江省杭州市淳安县界首乡', '浙江省', '杭州市', '淳安县', 5.5, 8.2, 164, 20, '宅基地', 'official', '["https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800"]', 29.61, 118.87, '13800001007', '淳安千岛湖管理局', 5820, 'approved', 1);

-- 官方原矿 8: 利川避暑
INSERT INTO assets (title, description, location, province, city, district, area_mu, price_year, price_total, lease_years, asset_type, source_type, images, gps_lat, gps_lng, contact_phone, contact_name, views, status, featured) VALUES ('恩施·利川苏马荡避暑山居', '海拔1400米，夏季均温22℃。已建成避暑小院，含菜地、鱼塘。', '湖北省恩施州利川市谋道镇', '湖北省', '恩施州', '利川市', 4.0, 2.8, 56, 20, '宅基地', 'official', '["https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800"]', 30.48, 108.93, '13800001008', '利川苏马荡管委会', 4680, 'approved', 0);

-- 村委直营 1: 余村
INSERT INTO assets (title, description, location, province, city, district, area_mu, price_year, price_total, lease_years, asset_type, source_type, images, gps_lat, gps_lng, contact_phone, contact_name, views, status, featured) VALUES ('安吉·余村绿水青山示范区宅基地', '两山理论发源地，村委直发。紧邻余村游客中心，配套完善。', '浙江省湖州市安吉县天荒坪镇余村', '浙江省', '湖州市', '安吉县', 2.8, 15.0, 300, 20, '宅基地', 'village', '["https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800"]', 30.59, 119.62, '13800002001', '余村村委会', 15600, 'approved', 1);

-- 村委直营 2: 虹口林盘
INSERT INTO assets (title, description, location, province, city, district, area_mu, price_year, price_total, lease_years, asset_type, source_type, images, gps_lat, gps_lng, contact_phone, contact_name, views, status, featured) VALUES ('都江堰·虹口漂流景区林盘', '成都市民周末度假热门地。川西林盘保护性开发，含竹林、水渠、老院落群。', '四川省成都市都江堰市虹口乡', '四川省', '成都市', '都江堰市', 12.0, 8.8, 176, 30, '林盘', 'village', '["https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800"]', 31.02, 103.65, '13800002002', '虹口乡政府', 11200, 'approved', 1);

-- 村委直营 3: 喜洲院落群
INSERT INTO assets (title, description, location, province, city, district, area_mu, price_year, price_total, lease_years, asset_type, source_type, images, gps_lat, gps_lng, contact_phone, contact_name, views, status, featured) VALUES ('大理·喜洲古镇白族院落群', '喜洲古镇核心区，严家大院旁。5栋白族传统院落整体流转，可做精品酒店群。', '云南省大理州大理市喜洲镇', '云南省', '大理州', '大理市', 8.0, 5.5, 165, 30, '古宅群', 'village', '["https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800"]', 25.82, 100.13, '13800002003', '喜洲镇政府', 9800, 'approved', 0);

-- 村委直营 4: 兴坪老宅
INSERT INTO assets (title, description, location, province, city, district, area_mu, price_year, price_total, lease_years, asset_type, source_type, images, gps_lat, gps_lng, contact_phone, contact_name, views, status, featured) VALUES ('阳朔·兴坪古镇漓江边老宅', '20元人民币背景取景地旁。三层临江老宅，顶楼可直接观赏黄布倒影。', '广西桂林市阳朔县兴坪镇', '广西壮族自治区', '桂林市', '阳朔县', 0.8, 6.0, 120, 20, '宅基地', 'village', '["https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800"]', 24.99, 110.59, '13800002004', '兴坪镇政府', 8200, 'approved', 0);

-- 村委直营 5: 壶镇商铺
INSERT INTO assets (title, description, location, province, city, district, area_mu, price_year, price_total, lease_years, asset_type, source_type, images, gps_lat, gps_lng, contact_phone, contact_name, views, status, featured) VALUES ('缙云·壶镇古街商铺老宅', '壶镇千年古街核心区，前店后院格局。适合文创工坊、非遗体验馆。', '浙江省丽水市缙云县壶镇', '浙江省', '丽水市', '缙云县', 0.6, 4.5, 90, 20, '商铺', 'village', '["https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800"]', 28.73, 120.22, '13800002005', '壶镇古街管委会', 6700, 'approved', 0);

-- 村委直营 6: 柳沟老院
INSERT INTO assets (title, description, location, province, city, district, area_mu, price_year, price_total, lease_years, asset_type, source_type, images, gps_lat, gps_lng, contact_phone, contact_name, views, status, featured) VALUES ('延庆·柳沟村凤凰城老院', '柳沟豆腐宴发源地，民俗旅游成熟。三进院落，可做高端四合院民宿。', '北京市延庆区井庄镇柳沟村', '北京市', '延庆区', '井庄镇', 1.2, 7.8, 156, 20, '宅基地', 'village', '["https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800"]', 40.43, 116.09, '13800002006', '柳沟村委会', 5400, 'approved', 0);

-- UGC 1: 千岛湖古宅
INSERT INTO assets (title, description, location, province, city, district, area_mu, price_year, price_total, lease_years, asset_type, source_type, images, gps_lat, gps_lng, contact_phone, contact_name, views, status, featured) VALUES ('千岛湖·姜家镇文渊狮城旁古宅', '文渊狮城景区步行5分钟，新安江水库移民古村落。徽派建筑保存完好。', '浙江省杭州市淳安县姜家镇', '浙江省', '杭州市', '淳安县', 3.0, 6.8, 136, 20, '古宅', 'ugc', '["https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800"]', 29.52, 118.79, '13800003001', '张大山', 5100, 'approved', 0);

-- UGC 2: 青城山茶园
INSERT INTO assets (title, description, location, province, city, district, area_mu, price_year, price_total, lease_years, asset_type, source_type, images, gps_lat, gps_lng, contact_phone, contact_name, views, status, featured) VALUES ('青城山·大观镇茶山田园综合体', '青城道茶核心产区，含茶园8亩、加工厂房、宿舍楼。可做茶旅融合项目。', '四川省成都市都江堰市大观镇', '四川省', '成都市', '都江堰市', 15.0, 12.0, 240, 30, '茶园', 'ugc', '["https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800"]', 30.85, 103.52, '13800003002', '李秀英', 4800, 'approved', 0);

-- UGC 3: 双廊洱海院
INSERT INTO assets (title, description, location, province, city, district, area_mu, price_year, price_total, lease_years, asset_type, source_type, images, gps_lat, gps_lng, contact_phone, contact_name, views, status, featured) VALUES ('大理·双廊古镇洱海边白族院', '双廊古镇核心区，正对洱海玉几岛。白族三合院，适合海景民宿或艺术工作室。', '云南省大理州大理市双廊镇', '云南省', '大理州', '大理市', 1.2, 7.5, 150, 20, '古宅', 'ugc', '["https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800"]', 25.97, 100.18, '13800003003', '王铁柱', 4500, 'approved', 0);

-- UGC 4: 旧县攀岩老宅
INSERT INTO assets (title, description, location, province, city, district, area_mu, price_year, price_total, lease_years, asset_type, source_type, images, gps_lat, gps_lng, contact_phone, contact_name, views, status, featured) VALUES ('阳朔·旧县村攀岩基地旁老宅', '旧县村国际攀岩基地旁，户外运动爱好者聚集地。含庭院、菜地。', '广西桂林市阳朔县旧县村', '广西壮族自治区', '桂林市', '阳朔县', 1.5, 3.8, 76, 20, '宅基地', 'ugc', '["https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800"]', 24.88, 110.45, '13800003004', '刘大牛', 4200, 'approved', 0);

-- UGC 5: 缙云石头村
INSERT INTO assets (title, description, location, province, city, district, area_mu, price_year, price_total, lease_years, asset_type, source_type, images, gps_lat, gps_lng, contact_phone, contact_name, views, status, featured) VALUES ('缙云·新建镇石头古村落', '浙南独特的火山岩古村落，整村可做艺术乡建项目。含20栋石头房、古桥、溪流。', '浙江省丽水市缙云县新建镇', '浙江省', '丽水市', '缙云县', 25.0, 18.0, 360, 30, '古村落', 'ugc', '["https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800"]', 28.58, 120.15, '13800003005', '赵翠花', 3800, 'approved', 0);

-- UGC 6: 利川木屋群
INSERT INTO assets (title, description, location, province, city, district, area_mu, price_year, price_total, lease_years, asset_type, source_type, images, gps_lat, gps_lng, contact_phone, contact_name, views, status, featured) VALUES ('利川·苏马荡森林木屋群', '苏马荡核心避暑区，10栋独立森林木屋已建成。含停车场、公共厨房、观景平台。', '湖北省恩施州利川市苏马荡', '湖北省', '恩施州', '利川市', 8.0, 5.2, 104, 20, '民宿群', 'ugc', '["https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800"]', 30.45, 108.90, '13800003006', '张大山', 3500, 'approved', 0);
