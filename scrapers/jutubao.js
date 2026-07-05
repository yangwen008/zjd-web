/**
 * 聚土网数据采集器
 * 
 * 数据源：http://www.jutubao.com/tudi/
 * 采集内容：农房、宅基地、林地、耕地等
 * 
 * 用法：
 *   node scrapers/jutubao.js                           # 默认采集农房，5页
 *   node scrapers/jutubao.js --type=nongfang --pages=10
 *   node scrapers/jutubao.js --type=all --pages=3      # 全部类型
 *   node scrapers/jutubao.js --dry-run                 # 只打印不入库
 *   node scrapers/jutubao.js --province=sichuan        # 按省份
 * 
 * 土地类型代码：
 *   nongfang=农房, linmumiaopu=林木苗圃地, shucailiangyou=蔬菜粮油地,
 *   guochacansang=水果茶桑地, xumufangyang=畜牧放养地, chanzhiyangzhi=水产养殖地,
 *   shangfu=商服地, gonggong=公共服务用地, teshu=特殊用地, all=全部
 */

const { chromium } = require('playwright');
const fs = require('fs');

// ===== 命令行参数 =====
const args = Object.fromEntries(
  process.argv.slice(2)
    .filter(a => a.startsWith('--'))
    .map(a => a.slice(2).split('=').map(s => s.trim()))
);

const LAND_TYPE = args.type || 'nongfang';
const MAX_PAGES = parseInt(args.pages || '5', 10);
const DRY_RUN = process.argv.includes('--dry-run');
const PROVINCE = args.province || '';

// 土地类型 → URL路径
const TYPE_MAP = {
  'nongfang': 'c5j0m0l0',        // 农房
  'linmumiaopu': 'c3j0m0l0',     // 林木苗圃地
  'shucailiangyou': 'c1j0m0l0',  // 蔬菜粮油地
  'guochacansang': 'c2j0m0l0',   // 水果茶桑地
  'xumufangyang': 'c4j0m0l0',    // 畜牧放养地
  'chanzhiyangzhi': 'c7j0m0l0',  // 水产养殖地
  'all': '',                      // 全部
};

// 省份 → URL路径
const PROVINCE_MAP = {
  'sichuan': 't-sichuan',
  'yunnan': 't-yunnan',
  'guizhou': 't-guizhou',
  'chongqing': 't-chongqing',
  'guangxi': 't-guangxi',
  'hubei': 't-hubei',
  'hunan': 't-hunan',
  'guangdong': 't-guangdong',
  'zhejiang': 't-zhejiangsheng',
  'jiangsu': 't-jiangsu',
  'anhui': 't-anhui',
  'fujian': 't-fujian',
  'jiangxi': 't-jiangxi',
  'shandong': 't-shandong',
  'henan': 't-henan',
  'hebei': 't-hebei',
  'beijing': 't-beijing',
  'shanghai': 't-shanghai',
  'hainan': 't-hainan',
};

// 构建列表页URL
function buildListUrl(page) {
  const typeCode = TYPE_MAP[LAND_TYPE] || '';
  const provCode = PROVINCE ? (PROVINCE_MAP[PROVINCE] || `t-${PROVINCE}`) : '';
  
  if (provCode && typeCode) {
    // 省份 + 类型
    return `http://www.jutubao.com/${provCode}/${typeCode}/`;
  } else if (provCode) {
    // 只按省份
    return `http://www.jutubao.com/${provCode}/`;
  } else if (typeCode) {
    // 只按类型
    if (page === 1) return `http://www.jutubao.com/tudi/${typeCode}`;
    return `http://www.jutubao.com/tudi/${typeCode}-p${page}/`;
  } else {
    // 全部
    if (page === 1) return `http://www.jutubao.com/tudi/`;
    return `http://www.jutubao.com/tudi-p${page}/`;
  }
}

// ===== 工具函数 =====

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms + Math.random() * ms * 0.3));
}

// 去掉 OSS 图片处理参数，获取原图（无水印）
function getOriginalImage(url) {
  if (!url) return '';
  // http://static.jutubao.com/uploads/images/xxx.jpg?x-oss-process=...
  // → http://static.jutubao.com/uploads/images/xxx.jpg
  return url.split('?')[0];
}

// 解析面积 → 亩
function parseAreaMu(text) {
  if (!text) return null;
  const s = text.replace(/\s/g, '');
  const mu = s.match(/([\d.]+)\s*亩/);
  if (mu) return parseFloat(mu[1]);
  const sqm = s.match(/([\d.]+)\s*(?:平米|平方米|㎡|平方)/);
  if (sqm) return Math.round(parseFloat(sqm[1]) / 666.67 * 100) / 100;
  return null;
}

// 解析价格
function parsePrice(priceText, unitText) {
  if (!priceText) return { price_year: null, price_total: null };
  const num = parseFloat(priceText);
  if (isNaN(num)) return { price_year: null, price_total: null };
  
  const unit = (unitText || '').replace(/\s/g, '');
  
  // "元/亩/年" → 需要面积才能算年租金
  if (unit.includes('元/亩/年')) return { price_year: null, price_total: null };
  // "元/月" → 年租金 = num * 12 / 10000
  if (unit.includes('元/月')) return { price_year: Math.round(num * 12 / 10000 * 100) / 100, price_total: null };
  // "万元" → 总价
  if (unit.includes('万元')) return { price_year: null, price_total: num };
  // "元/年" → 转万
  if (unit.includes('元/年')) return { price_year: Math.round(num / 10000 * 100) / 100, price_total: null };
  
  return { price_year: null, price_total: null };
}

// 解析流转年限
function parseLeaseYears(text) {
  if (!text) return null;
  const m = text.match(/(\d+)\s*年/);
  return m ? parseInt(m[1]) : null;
}

// 解析位置
function parseLocation(text) {
  if (!text) return { province: null, city: null, district: null };
  // "所在地区：四川省 - 成都市 - 温江区"
  const cleaned = text.replace(/所在地区：?/, '').replace(/\s/g, '');
  const parts = cleaned.split('-').map(s => s.trim()).filter(Boolean);
  return {
    province: parts[0] || null,
    city: parts[1] || null,
    district: parts[2] || null,
  };
}

// 资产类型映射
function mapAssetType(landType) {
  if (!landType) return '其他';
  const t = landType.trim();
  if (t.includes('农房') || t.includes('宅基地')) return '宅基地';
  if (t.includes('林') || t.includes('苗圃')) return '林地';
  if (t.includes('茶') || t.includes('果园') || t.includes('桑') || t.includes('果')) return '茶园';
  if (t.includes('蔬菜') || t.includes('粮油') || t.includes('旱地') || t.includes('水田')) return '种植';
  if (t.includes('厂房') || t.includes('仓储')) return '厂房';
  if (t.includes('商') || t.includes('铺')) return '商铺';
  return '其他';
}

// ===== 采集列表页 =====

async function scrapeListPage(page, pageNum) {
  const url = buildListUrl(pageNum);
  console.log(`  [Page ${pageNum}] ${url}`);
  
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(2000);
  
  const items = await page.evaluate(() => {
    const results = [];
    const listItems = document.querySelectorAll('.list-pop-body li, .mlt-list li, ul li');
    
    for (const li of listItems) {
      try {
        const linkEl = li.querySelector('a[href*="content-"]');
        if (!linkEl) continue;
        
        const href = linkEl.getAttribute('href') || '';
        if (!href.includes('content-')) continue;
        
        // 图片
        const imgEl = li.querySelector('img[original], img');
        const imgSrc = imgEl ? (imgEl.getAttribute('original') || imgEl.src || '') : '';
        
        // 流转类型
        const typeEl = li.querySelector('.mspan2');
        const transferType = typeEl ? typeEl.textContent.trim() : '';
        
        // 标题
        const titleEl = li.querySelector('.mltr-p1, .textover');
        const title = titleEl ? titleEl.textContent.trim() : '';
        
        // 土地类型
        const landTypeEl = li.querySelector('.mltr-p2');
        const landType = landTypeEl ? landTypeEl.textContent.trim() : '';
        
        // 面积+年限
        const areaEl = li.querySelector('.mltr-p3 .fl');
        const areaText = areaEl ? areaEl.textContent.trim() : '';
        
        // 价格
        const priceNumEl = li.querySelector('.mltr-p3 .fr .f18, .mltr-p3 .fr .cff7');
        const priceNum = priceNumEl ? priceNumEl.textContent.trim() : '';
        const priceUnitEl = li.querySelector('.mltr-p3 .fr');
        const priceUnit = priceUnitEl ? priceUnitEl.textContent.replace(priceNum, '').trim() : '';
        
        // 位置和时间
        const p2s = li.querySelectorAll('.mltr-p2');
        let location = '', updateTime = '';
        for (const p of p2s) {
          const text = p.textContent.trim();
          if (text.includes('所在地区')) location = text;
          if (text.includes('最新刷新')) updateTime = text;
        }
        
        results.push({
          title, href, imgSrc, transferType, landType,
          areaText, priceNum, priceUnit, location, updateTime,
        });
      } catch (e) {}
    }
    return results;
  });
  
  return items;
}

// ===== 采集详情页 =====

async function scrapeDetailPage(page, url) {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await sleep(1500);
    
    const detail = await page.evaluate(() => {
      const getText = (sel) => {
        const el = document.querySelector(sel);
        return el ? el.textContent.trim() : '';
      };
      
      // 描述
      const descEl = document.querySelector('.intro-con, .detail-intro, [class*="intro"], [class*="desc"], [class*="jianjie"]');
      const description = descEl ? descEl.textContent.trim().substring(0, 800) : '';
      
      // 详情页图片（多张）
      const images = [];
      const imgEls = document.querySelectorAll('.swiper-wrapper img, .detail-img img, .banner img, [class*="banner"] img, [class*="gallery"] img');
      for (const img of imgEls) {
        const src = img.getAttribute('original') || img.src || '';
        if (src && src.includes('static.jutubao.com')) {
          images.push(src.split('?')[0]); // 去掉OSS参数
        }
      }
      
      return { description, images };
    });
    
    return detail;
  } catch (e) {
    console.log(`    ⚠️ 详情页失败: ${e.message}`);
    return { description: '', images: [] };
  }
}

// ===== 主流程 =====

async function main() {
  const landTypeNames = {
    'nongfang': '农房', 'linmumiaopu': '林木苗圃地', 'shucailiangyou': '蔬菜粮油地',
    'guochacansang': '水果茶桑地', 'xumufangyang': '畜牧放养地', 'chanzhiyangzhi': '水产养殖地',
    'all': '全部类型',
  };
  
  console.log('🌾 聚土网数据采集器');
  console.log(`   类型: ${landTypeNames[LAND_TYPE] || LAND_TYPE}`);
  console.log(`   省份: ${PROVINCE || '全国'}`);
  console.log(`   页数: ${MAX_PAGES}`);
  console.log(`   模式: ${DRY_RUN ? '试运行(不入库)' : '正式采集'}`);
  console.log('');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
    locale: 'zh-CN',
  });
  const page = await context.newPage();

  let allItems = [];
  
  try {
    // 1. 采集列表页
    for (let p = 1; p <= MAX_PAGES; p++) {
      const items = await scrapeListPage(page, p);
      console.log(`    提取 ${items.length} 条`);
      
      for (const item of items) {
        const loc = parseLocation(item.location);
        const areaMu = parseAreaMu(item.areaText);
        const leaseYears = parseLeaseYears(item.areaText);
        const { price_year, price_total } = parsePrice(item.priceNum, item.priceUnit);
        
        const fullLink = item.href.startsWith('http') ? item.href : `http://www.jutubao.com${item.href}`;
        
        allItems.push({
          title: item.title,
          location: item.location.replace(/所在地区：?/, '').replace(/\s/g, ''),
          province: loc.province,
          city: loc.city,
          district: loc.district,
          area_mu: areaMu,
          price_year: price_year,
          price_total: price_total,
          lease_years: leaseYears,
          asset_type: mapAssetType(item.landType),
          transfer_type: item.transferType,
          land_type_raw: item.landType,
          source_type: 'official',
          source_url: fullLink,
          images: item.imgSrc ? JSON.stringify([getOriginalImage(item.imgSrc)]) : '[]',
          description: null,
          contact_name: null,
        });
      }
      
      if (p < MAX_PAGES) await sleep(2000);
    }
    
    console.log(`\n📊 列表采集完成，共 ${allItems.length} 条`);
    
    // 2. 详情页补充（取前20条）
    const detailLimit = Math.min(allItems.length, 20);
    if (detailLimit > 0) {
      console.log(`\n📄 补充详情页数据 (前${detailLimit}条)...`);
      for (let i = 0; i < detailLimit; i++) {
        const item = allItems[i];
        if (item.source_url) {
          const detail = await scrapeDetailPage(page, item.source_url);
          if (detail.description) item.description = detail.description;
          if (detail.images.length > 0) {
            // 详情页图片替换列表页图片（更清晰）
            item.images = JSON.stringify(detail.images);
          }
          console.log(`    [${i + 1}/${detailLimit}] ${item.title.substring(0, 25)}...`);
          await sleep(1500);
        }
      }
    }
    
    // 3. 输出结果
    if (DRY_RUN) {
      console.log('\n📋 试运行结果 (前5条):');
      for (const item of allItems.slice(0, 5)) {
        console.log(`  ──────────────────────`);
        console.log(`  标题: ${item.title}`);
        console.log(`  位置: ${item.location}`);
        console.log(`  面积: ${item.area_mu}亩`);
        console.log(`  年租: ${item.price_year}万/年 | 总价: ${item.price_total}万`);
        console.log(`  类型: ${item.asset_type} (${item.land_type_raw})`);
        console.log(`  图片: ${JSON.parse(item.images).length} 张`);
        console.log(`  链接: ${item.source_url}`);
      }
    } else {
      // 输出 JSON 文件
      const outputPath = `scrapers/jutubao-output-${Date.now()}.json`;
      fs.writeFileSync(outputPath, JSON.stringify(allItems, null, 2));
      console.log(`\n📁 数据已保存到: ${outputPath}`);
      console.log(`   共 ${allItems.length} 条，可通过 POST /api/admin/import-tuliu 导入`);
    }
    
  } catch (error) {
    console.error('❌ 采集失败:', error.message);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
