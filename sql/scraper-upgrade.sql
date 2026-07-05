-- 爬虫配方表升级：新增来源标识、采集模式、省份代码
ALTER TABLE scrapers_recipes ADD COLUMN source_name TEXT;
ALTER TABLE scrapers_recipes ADD COLUMN scraper_type TEXT DEFAULT 'playwright';
ALTER TABLE scrapers_recipes ADD COLUMN province_code TEXT;
