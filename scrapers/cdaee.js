/**
 * 四川省农村产权综合交易平台 采集器
 * 直接调用 JSON API，无需 Playwright
 * 
 * 用法：
 *   node scrapers/cdaee.js              # 采集资产资源（默认）
 *   node scrapers/cdaee.js --pages 5    # 采集5页
 *   node scrapers/cdaee.js --dry-run    # 预览不入库
 */

const CF_API_URL = process.env.CF_API_URL || 'https://zjd-web.pages.dev';
const CF_API_TOKEN = process.env.CF_API_TOKEN || '';

const API_URL = 'https://www.cdaee.com/inteligentsearch_new/rest/esinteligentsearch/getFullTextDataNew';
const DETAIL_BASE = 'https://www.cdaee.com';
const PAGE_SIZE = 20;

// 资源分类号（资产资源 > 项目公告，排除标的信息和信息变更）
const CATEGORY_NUM = '018003001';

async function fetchPage(pageNum, pageSize) {
  const param = {
    token: '',
    pn: pageNum * pageSize,
    rn: pageSize,
    sdt: '',
    edt: '',
    wd: '',
    inc_wd: '',
    exc_wd: '',
    fields: '',
    cnum: '001',
    sort: '{"webdate":"0","id":"0"}',
    cl: 500,
    terminal: '',
    condition: [{
      fieldName: 'categorynum',
      equal: CATEGORY_NUM,
      notEqual: null,
      equalList: null,
      notEqualList: ['018003001007', '018003001010'],
      isLike: true,
      likeType: 2,
    }],
    time: [],
    highlights: '',
    statistics: null,
    unionCondition: null,
    accuracy: '',
    noParticiple: '1',
    searchRange: [],
    noWd: true,
  };

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Referer': 'https://www.cdaee.com/nccq/jyxx/018003/resource_assets.html',
      'Origin': 'https://www.cdaee.com',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
    },
    body: JSON.stringify(param),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.result;
}

/**
 * 从地址字符串提取省/市/区
 * 格式："四川省/成都市/都江堰市/青城山镇"
 */
function parseAddress(xmdz) {
  if (!xmdz) return { province: '', city: '', district: '' };
  const parts = xmdz.split('/').map(s => s.trim());
  return {
    province: parts[0] || '',
    city: parts[1] || '',
    district: parts[2] || '',
  };
}

/**
 * 将 API 记录转换为我们的资产格式
 */
function transformRecord(record) {
  const addr = parseAddress(record.xmdz);
  
  // 价格：gpjg 是单价(元/亩/年)，转为万元
  let priceYear = null;
  if (record.gpjg && parseFloat(record.gpjg) > 0) {
    const unit = record.gpjgdw || '';
    const price = parseFloat(record.gpjg);
    if (unit.includes('万元')) {
      priceYear = price;
    } else if (unit.includes('元/亩')) {
      // 假设按面积计算年租金
      const area = parseFloat(record.tdmj) || 1;
      priceYear = Math.round((price * area) / 10000 * 100) / 100;
    } else {
      priceYear = Math.round(price / 10000 * 100) / 100;
    }
  }

  // 流转年限
  let leaseYears = null;
  if (record.zcqx && parseInt(record.zcqx) > 0) {
    leaseYears = parseInt(record.zcqx);
  } else if (record.zcqxmonth && parseInt(record.zcqxmonth) > 0) {
    leaseYears = Math.round(parseInt(record.zcqxmonth) / 12);
  }

  // 资产类型推断
  let assetType = '种植'; // 默认
  const title = (record.customtitle || record.title || '').toLowerCase();
  if (title.includes('宅基地') || title.includes('住房') || title.includes('农房')) assetType = '宅基地';
  else if (title.includes('林地') || title.includes('林木')) assetType = '林地';
  else if (title.includes('茶园') || title.includes('茶山')) assetType = '茶园';
  else if (title.includes('古宅') || title.includes('老宅') || title.includes('古建筑')) assetType = '古宅';
  else if (title.includes('厂房') || title.includes('加工房')) assetType = '厂房';
  else if (title.includes('商铺') || title.includes('商业')) assetType = '商铺';
  else if (title.includes('民宿')) assetType = '民宿群';
  else if (title.includes('果园') || title.includes('果林')) assetType = '果园';
  else if (title.includes('土地') || title.includes('耕地') || title.includes('农田')) assetType = '种植';
  else if (title.includes('堰塘') || title.includes('鱼塘') || title.includes('养殖')) assetType = '种植';
  else if (title.includes('集体建设用地') || title.includes('经营性')) assetType = '厂房';

  // 详情链接
  const detailUrl = record.linkurl ? `${DETAIL_BASE}${record.linkurl}` : '';

  return {
    title: record.customtitle || record.title || 'Untitled',
    description: (record.content || '').substring(0, 500).trim(),
    location: record.xmdz ? record.xmdz.replace(/\//g, ' ') : '',
    province: addr.province,
    city: addr.city,
    district: addr.district,
    area_mu: parseFloat(record.tdmj) || null,
    price_year: priceYear,
    lease_years: leaseYears,
    asset_type: assetType,
    source_type: 'official',
    source_url: detailUrl,
    contact_name: null,
    contact_phone: null,
    certification: 'uncertified',
  };
}

async function getSystemRecipeId() {
  const res = await fetch(`${CF_API_URL}/api/scrape`, {
    headers: { 'Authorization': `Bearer ${CF_API_TOKEN}` },
  });
  const data = await res.json();
  const recipes = data.recipes || [];
  const sys = recipes.find(r => r.name === '系统内置采集器');
  return sys?.id || null;
}

async function saveToStaging(items, recipeId) {
  const res = await fetch(`${CF_API_URL}/api/scrape`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CF_API_TOKEN}`,
    },
    body: JSON.stringify({
      action: 'save-raw',
      recipeId: recipeId,
      rawData: items,
    }),
  });
  return res.json();
}

async function main() {
  const args = process.argv.slice(2);
  const maxPages = parseInt(args.find((_, i, a) => a[i - 1] === '--pages') || '3');
  const dryRun = args.includes('--dry-run');

  console.log('🌾 四川省农村产权综合交易平台 采集器');
  console.log(`📄 采集页数: ${maxPages}`);
  console.log(`🔧 模式: ${dryRun ? '预览(dry-run)' : '入库'}`);
  console.log('');

  let totalItems = [];

  for (let page = 0; page < maxPages; page++) {
    console.log(`📥 采集第 ${page + 1}/${maxPages} 页...`);
    try {
      const result = await fetchPage(page, PAGE_SIZE);
      const records = result.records || [];
      console.log(`   获取 ${records.length} 条 (总计: ${result.totalcount})`);

      const items = records.map(transformRecord);
      totalItems.push(...items);

      // 请求间隔
      if (page < maxPages - 1) {
        await new Promise(r => setTimeout(r, 1000 + Math.random() * 1000));
      }
    } catch (err) {
      console.error(`   ❌ 第 ${page + 1} 页失败: ${err.message}`);
    }
  }

  console.log(`\n📊 采集完成，共 ${totalItems.length} 条`);

  if (dryRun) {
    console.log('\n--- 预览前5条 ---');
    totalItems.slice(0, 5).forEach((item, i) => {
      console.log(`\n[${i + 1}] ${item.title}`);
      console.log(`    📍 ${item.location}`);
      console.log(`    📐 ${item.area_mu || '-'}亩 | 💰 ${item.price_year || '-'}万/年 | ⏱ ${item.lease_years || '-'}年`);
      console.log(`    🏷️ ${item.asset_type} | 来源: ${item.source_url || '-'}`);
    });
  } else {
    console.log('💾 保存到暂存区...');
    try {
      const recipeId = await getSystemRecipeId();
      if (!recipeId) { console.error('❌ 未找到系统内置采集器配方，请先在后台创建'); process.exit(1); }
      console.log(`   使用配方 ID: ${recipeId}`);
      const result = await saveToStaging(totalItems, recipeId);
      if (result.success) {
        console.log('✅ 保存成功，请到后台「暂存数据清洗」页面审核入库');
      } else {
        console.error('❌ 保存失败:', result.error);
      }
    } catch (err) {
      console.error('❌ 保存失败:', err.message);
    }
  }
}

main().catch(console.error);
