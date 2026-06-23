-- 种子数据: homepage_config
INSERT OR IGNORE INTO homepage_config (key, value) VALUES
  ('hero_title', '寻找被低估的低密度空间资产'),
  ('hero_subtitle', '乡村资产数字化绿色流转中枢。全网多源产权低频提纯，一键交叉碰撞，让技术重归山川。'),
  ('total_assets', '104281'),
  ('today_new', '142'),
  ('company_name', '绵阳网安科技有限公司'),
  ('company_phone', '13696266999'),
  ('company_email', 'contact@zjd.cn'),
  ('icp_number', '蜀ICP备16015085号-5'),
  ('police_record', ''),
  ('footer_about', '乡村闲置资产数字交易所。全网多源产权低频提纯，让技术重归山川。'),
  ('featured_slots', '["1","2","3","4","5","6"]');

-- 种子数据: 行情
INSERT OR IGNORE INTO market_data (province, median_price, change_pct, bargain_space, total_listings) VALUES
  ('浙江省', 14.2, 4.2, -5.4, 1420),
  ('四川省', 7.8, 1.8, -12.4, 892),
  ('云南省', 4.5, 0, -18.2, 415),
  ('贵州省', 3.2, -1.5, -22.1, 286),
  ('广西壮族自治区', 3.8, 0.5, -19.5, 198);

-- 种子数据: 基建评分
INSERT OR IGNORE INTO infrastructure_ratings (region, signal_5g_ms, hospital_min, grid_redundancy, overall_grade) VALUES
  ('杭州·安吉', 12, 8, 98, 'S+'),
  ('成都·都江堰', 18, 12, 95, 'S'),
  ('大理·苍洱', 35, 25, 92, 'A+'),
  ('丽水·缙云', 42, 30, 88, 'A'),
  ('桂林·阳朔', 48, 35, 85, 'A-'),
  ('北京·延庆', 15, 10, 96, 'S');

-- 种子数据: 超级管理员
INSERT OR IGNORE INTO users (openid, nickname, role, status, verified) VALUES
  ('admin_init', '系统管理员', 'superadmin', 'active', 1);
