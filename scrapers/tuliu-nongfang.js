/**
 * 土流网农房数据采集器
 * 
 * 数据源：https://www.tuliu.com/nongfang/
 * 采集内容：农村宅基地、农家庭院
 * 
 * 用法：
 *   node scrapers/tuliu-nongfang.js              # 采集全国，默认5页
 *   node scrapers/tuliu-nongfang.js --province=sichuan --pages=10
 *   node scrapers/tuliu-nongfang.js --dry-run     # 只打印不入库
 * 
 * 省份代码：
 *   0=全国, 253=四川, 94=浙江, 182=湖北, 212=广东, 249=海南,
 *   1=北京, 79=上海, 80=江苏, 106=安徽, 124=福建, 134=江西,
 *   146=山东, 164=河南, 234=广西, 275=贵州, 285=云南, 310=陕西
 */

const { chromium } = require('playwright');

const CF_API_URL = process.env.CF_API_URL || 'https://z.zjd.cn';
const CF_API_TOKEN = process.env.CF_API_TOKEN || '';

// 命令行参数
const args = Object.fromEntries(
  process.argv.slice(2)
    .filter(a => a.startsWith('--'))
    .map(a => a.slice(2).split('=').map(s => s.trim()))
);
const PROVINCE = args.province || '0';
const MAX_PAGES = parseInt(args.pages || '5', 10);
const MAX_ITEMS = parseInt(args.limit || '10', 10); // 默认采集10条
const DRY_RUN = process.argv.includes('--dry-run');

// 省份代码 → 省份名称映射
const PROVINCE_MAP = {
  '0': '全国', '253': '四川省', '94': '浙江省', '182': '湖北省',
  '212': '广东省', '249': '海南省', '1': '北京市', '79': '上海市',
  '80': '江苏省', '106': '安徽省', '124': '福建省', '134': '江西省',
  '146': '山东省', '164': '河南省', '234': '广西壮族自治区', '275': '贵州省',
  '285': '云南省', '310': '陕西省', '3': '河北省', '15': '山西省',
  '27': '内蒙古自治区', '40': '辽宁省', '55': '吉林省', '65': '黑龙江省',
  '252': '重庆市', '302': '西藏自治区', '345': '宁夏回族自治区', '351': '新疆维吾尔自治区',
};

// ===== 工具函数 =====

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms + Math.random() * ms * 0.5));
}

async function fetchWithRetry(url, options = {}, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      if (res.ok) return res;
      if (res.status === 429) {
        const wait = Math.pow(2, i + 1) * 2000;
        console.log(`  ⏳ 限流，等待 ${wait}ms...`);
        await sleep(wait);
        continue;
      }
      return res;
    } catch (err) {
      if (i === retries - 1) throw err;
      await sleep(1000 * (i + 1));
    }
  }
}

// 解析价格文本 → 年租金(万)
function parsePriceYear(priceStr) {
  if (!priceStr) return null;
  const s = priceStr.replace(/\s/g, '');
  
  // "0.8万元/年" → 0.8
  const wanYear = s.match(/([\d.]+)\s*万元?\/年/);
  if (wanYear) return parseFloat(wanYear[1]);
  
  // "500元/亩/年" → 0.05 (假设小面积按亩算不太合理，返回null)
  const yuanMuYear = s.match(/([\d.]+)\s*元\/亩\/年/);
  if (yuanMuYear) return null; // 需要面积才能算
  
  // "55万元" (总价，无年份) → null (需要知道年限才能算年租金)
  const wanTotal = s.match(/([\d.]+)\s*万元?$/);
  if (wanTotal) return null; // 总价，不是年租金
  
  // "5元/平方米/年" → 需要面积
  const yuanSqmYear = s.match(/([\d.]+)\s*元\/平方米\/年/);
  if (yuanSqmYear) return null;
  
  return null;
}

// 解析面积文本 → 亩数
function parseAreaMu(areaStr) {
  if (!areaStr) return null;
  const s = areaStr.replace(/\s/g, '');
  
  // "450平米" → 转换为亩 (1亩 ≈ 666.67平米)
  const sqm = s.match(/([\d.]+)\s*(?:平米|平方米|㎡)/);
  if (sqm) return Math.round(parseFloat(sqm[1]) / 666.67 * 100) / 100;
  
  // "3亩"
  const mu = s.match(/([\d.]+)\s*亩/);
  if (mu) return parseFloat(mu[1]);
  
  return null;
}

// 解析价格总价
function parsePriceTotal(priceStr) {
  if (!priceStr) return null;
  const s = priceStr.replace(/\s/g, '');
  const wan = s.match(/([\d.]+)\s*万元?/);
  if (wan) return parseFloat(wan[1]);
  return null;
}

// 解析流转年限
function parseLeaseYears(text) {
  if (!text) return null;
  const m = text.match(/(\d+)\s*年/);
  return m ? parseInt(m[1]) : null;
}

// 从URL提取省份/城市/区县
function parseLocation(url, title) {
  // URL格式: https://wenjiang.tuliu.com/s-view-265281.html
  // wenjiang = 温江区的子域名
  const subdomain = url.match(/https?:\/\/([^.]+)\.tuliu\.com/);
  if (!subdomain) return {};
  
  const code = subdomain[1];
  // 常见子域名 → 省市区映射 (主要覆盖四川)
  const domainMap = {
    'wenjiang': { province: '四川省', city: '成都市', district: '温江区' },
    'dujiangyan': { province: '四川省', city: '成都市', district: '都江堰市' },
    'xinjin': { province: '四川省', city: '成都市', district: '新津县' },
    'chongzhou': { province: '四川省', city: '成都市', district: '崇州市' },
    'longquanyi': { province: '四川省', city: '成都市', district: '龙泉驿区' },
    'shuangliu': { province: '四川省', city: '成都市', district: '双流区' },
    'pixian': { province: '四川省', city: '成都市', district: '郫都区' },
    'dayi': { province: '四川省', city: '成都市', district: '大邑县' },
    'jintang': { province: '四川省', city: '成都市', district: '金堂县' },
    'pengzhou': { province: '四川省', city: '成都市', district: '彭州市' },
    'qionglai': { province: '四川省', city: '成都市', district: '邛崃市' },
    'jianyang': { province: '四川省', city: '成都市', district: '简阳市' },
    'chengdu': { province: '四川省', city: '成都市' },
    'sichuan': { province: '四川省' },
    'zhejiang': { province: '浙江省' },
    'hubei': { province: '湖北省' },
    'guangdong': { province: '广东省' },
    'hainan': { province: '海南省' },
    'chongqing': { province: '重庆市' },
    'yunnan': { province: '云南省' },
    'guizhou': { province: '贵州省' },
    'guangxi': { province: '广西壮族自治区' },
    'jiangsu': { province: '江苏省' },
    'anhui': { province: '安徽省' },
    'fujian': { province: '福建省' },
    'jiangxi': { province: '江西省' },
    'shandong': { province: '山东省' },
    'henan': { province: '河南省' },
    'hunan': { province: '湖南省' },
    'hebei': { province: '河北省' },
    'shanxi': { province: '山西省' },
    'neimenggu': { province: '内蒙古自治区' },
    'liaoning': { province: '辽宁省' },
    'jilin': { province: '吉林省' },
    'heilongjiang': { province: '黑龙江省' },
    'shanghai': { province: '上海市' },
    'beijing': { province: '北京市' },
    'tianjin': { province: '天津市' },
    'shaanxi': { province: '陕西省' },
    'gansu': { province: '甘肃省' },
    'qinghai': { province: '青海省' },
    'xinjiang': { province: '新疆维吾尔自治区' },
    'xizang': { province: '西藏自治区' },
    'ningxia': { province: '宁夏回族自治区' },
  };
  
  return domainMap[code] || {};
}

// ===== 采集主逻辑 =====

async function scrapeListPage(page, pageNum) {
  const url = `https://www.tuliu.com/nongfang/list-${PROVINCE}-31-0/?p=${pageNum}&o1=ctime&o2=1`;
  console.log(`  [Page ${pageNum}] ${url}`);
  
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(1500);
  
  // 提取列表数据
  const items = await page.evaluate(() => {
    const results = [];
    // 列表项容器
    const cards = document.querySelectorAll('.land-list .land-item, .list-wrap .list-item, .supply-list .item');
    
    // 如果上面的选择器没命中，尝试通用选择器
    const allCards = cards.length > 0 ? cards : document.querySelectorAll('[class*="item"][class*="land"], [class*="card"]');
    
    for (const card of allCards) {
      try {
        // 标题和链接
        const titleEl = card.querySelector('a[href*="view"], a[href*="tuliu.com"]');
        if (!titleEl) continue;
        
        const title = titleEl.textContent.trim();
        const link = titleEl.href;
        if (!title || !link) continue;
        
        // 价格
        const priceEl = card.querySelector('[class*="price"], .price, .money');
        const price = priceEl ? priceEl.textContent.trim() : '';
        
        // 面积
        const areaEl = card.querySelector('[class*="area"], .area');
        const area = areaEl ? areaEl.textContent.trim() : '';
        
        // 位置
        const locEl = card.querySelector('[class*="addr"], [class*="location"], .addr, .location');
        const location = locEl ? locEl.textContent.trim() : '';
        
        // 流转类型
        const typeEl = card.querySelector('[class*="type"], .type, .tag');
        const leaseType = typeEl ? typeEl.textContent.trim() : '';
        
        // 流转年限
        const yearEl = card.querySelector('[class*="year"], .year');
        const leaseYears = yearEl ? yearEl.textContent.trim() : '';
        
        // 图片
        const imgEl = card.querySelector('img');
        const imageUrl = imgEl ? (imgEl.src || imgEl.dataset.src || '') : '';
        
        results.push({ title, link, price, area, location, leaseType, leaseYears, imageUrl });
      } catch (e) {
        // skip broken item
      }
    }
    return results;
  });
  
  return items;
}

async function scrapeDetailPage(page, url) {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await sleep(1000);
    
    const detail = await page.evaluate(() => {
      const getText = (sel) => {
        const el = document.querySelector(sel);
        return el ? el.textContent.trim() : '';
      };
      
      // 描述
      const descEl = document.querySelector('.land-intro, .detail-intro, [class*="intro"], [class*="desc"]');
      const description = descEl ? descEl.textContent.trim().substring(0, 500) : '';
      
      // 联系人
      const contactEl = document.querySelector('.seller-name, .contact-name, [class*="seller"] [class*="name"]');
      const contactName = contactEl ? contactEl.textContent.trim() : '';
      
      // 土地编码
      const codeEl = document.querySelector('[class*="code"]');
      const landCode = codeEl ? codeEl.textContent.replace(/[^0-9]/g, '') : '';
      
      return { description, contactName, landCode };
    });
    
    return detail;
  } catch (e) {
    console.log(`    ⚠️ 详情页失败: ${e.message}`);
    return { description: '', contactName: '', landCode: '' };
  }
}

// ===== 入库逻辑 =====

async function saveToStaging(items) {
  for (const item of items) {
    try {
      const res = await fetchWithRetry(`${CF_API_URL}/api/scrape`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CF_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'save-raw',
          recipeId: 0, // 临时，需要先创建配方
          rawData: item,
        }),
      });
      if (res && !res.ok) {
        console.log(`    ⚠️ 保存失败: ${res.status}`);
      }
    } catch (e) {
      console.log(`    ⚠️ 保存异常: ${e.message}`);
    }
  }
}

// ===== 主流程 =====

async function main() {
  console.log('🏠 土流网农房数据采集器');
  console.log(`   省份: ${PROVINCE_MAP[PROVINCE] || PROVINCE}`);
  console.log(`   页数: ${MAX_PAGES}`);
  console.log(`   限制: ${MAX_ITEMS} 条`);
  console.log(`   模式: ${DRY_RUN ? '试运行(不入库)' : '正式采集'}`);
  console.log('');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // 随机 UA
  await page.setExtraHTTPHeaders({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'zh-CN,zh;q=0.9',
  });

  let allItems = [];
  
  try {
    for (let p = 1; p <= MAX_PAGES; p++) {
      const items = await scrapeListPage(page, p);
      console.log(`    提取 ${items.length} 条`);
      
      // 转换格式
      for (const item of items) {
        const loc = parseLocation(item.link, item.title);
        const areaMu = parseAreaMu(item.area);
        const priceYear = parsePriceYear(item.price);
        const priceTotal = parsePriceTotal(item.price);
        const leaseYears = parseLeaseYears(item.leaseYears);
        
        if (allItems.length >= MAX_ITEMS) break;
        allItems.push({
          title: item.title,
          location: item.location || [loc.province, loc.city, loc.district].filter(Boolean).join('/'),
          province: loc.province || null,
          city: loc.city || null,
          district: loc.district || null,
          area_mu: areaMu,
          price_year: priceYear,
          price_total: priceTotal,
          lease_years: leaseYears,
          asset_type: '宅基地',
          source_type: 'official',
          source_url: item.link,
          images: item.imageUrl ? JSON.stringify([item.imageUrl]) : '[]',
          contact_name: null,
        });
      }
      
      if (allItems.length >= MAX_ITEMS) break;
      if (p < MAX_PAGES) {
        await sleep(2000);
      }
    }
    
    console.log(`\n📊 采集完成，共 ${allItems.length} 条 (限制: ${MAX_ITEMS})`);
    
    // 详情页补充（取前10条的描述）
    const detailLimit = Math.min(allItems.length, 10);
    if (detailLimit > 0) {
      console.log(`\n📄 补充详情页数据 (前${detailLimit}条)...`);
      for (let i = 0; i < detailLimit; i++) {
        const item = allItems[i];
        if (item.source_url) {
          const detail = await scrapeDetailPage(page, item.source_url);
          if (detail.description) item.description = detail.description;
          if (detail.contact_name) item.contact_name = detail.contact_name;
          console.log(`    [${i + 1}/${detailLimit}] ${item.title.substring(0, 20)}...`);
          await sleep(1500);
        }
      }
    }
    
    if (DRY_RUN) {
      console.log('\n📋 试运行结果 (前5条):');
      for (const item of allItems.slice(0, 5)) {
        console.log(`  - ${item.title}`);
        console.log(`    位置: ${item.location}`);
        console.log(`    面积: ${item.area_mu}亩`);
        console.log(`    年租: ${item.price_year}万/年`);
        console.log(`    链接: ${item.source_url}`);
        console.log('');
      }
    } else {
      // TODO: 入库逻辑 - 需要先在后台创建土流网配方
      console.log('\n💾 入库功能需要先在后台创建配方...');
      console.log('   请先在 /admin/scrapers 中创建"土流网农房"配方');
      console.log('   然后修改此脚本的 recipeId');
      
      // 输出 JSON 文件供手动导入
      const fs = require('fs');
      const outputPath = `scrapers/tuliu-output-${Date.now()}.json`;
      fs.writeFileSync(outputPath, JSON.stringify(allItems, null, 2));
      console.log(`\n📁 数据已保存到: ${outputPath}`);
    }
    
  } catch (error) {
    console.error('❌ 采集失败:', error.message);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
