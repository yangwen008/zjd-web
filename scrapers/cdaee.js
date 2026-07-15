/**
 * 四川省农村产权综合交易平台 采集器
 * 直接调用 JSON API + 详情页图片采集
 * AI标题重写在 Workers 端完成（/api/admin/staging action=ai-rename）
 * 
 * 用法：
 *   node scrapers/cdaee.js              # 采集最近7天数据
 *   node scrapers/cdaee.js --since 2026-07-01  # 从指定日期开始采集
 *   node scrapers/cdaee.js --pages 5    # 最多采集5页
 *   node scrapers/cdaee.js --dry-run    # 预览不入库
 *   node scrapers/cdaee.js --no-image   # 不采集图片（保留所有记录）
 */

const CF_API_URL = process.env.CF_API_URL || 'https://zjd.cn';
const CF_API_TOKEN = process.env.CF_API_TOKEN || '';

const API_URL = 'https://www.cdaee.com/inteligentsearch_new/rest/esinteligentsearch/getFullTextDataNew';
const DETAIL_BASE = 'https://www.cdaee.com';
const PAGE_SIZE = 20;

const CATEGORY_NUM = '018003001';

async function fetchPage(pageNum, pageSize, sinceDate) {
  const param = {
    token: '',
    pn: pageNum * pageSize,
    rn: pageSize,
    sdt: sinceDate || '',
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

function parseAddress(xmdz) {
  if (!xmdz) return { province: '', city: '', district: '' };
  const parts = xmdz.split('/').map(s => s.trim());
  return {
    province: parts[0] || '',
    city: parts[1] || '',
    district: parts[2] || '',
  };
}

async function fetchDetailImages(detailUrl) {
  try {
    const res = await fetch(detailUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.cdaee.com/',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];

    const html = await res.text();
    const images = [];

    const attachRegex = /data-attachurl\s*=\s*['"]([^'"]+)['"]/gi;
    let match;
    while ((match = attachRegex.exec(html)) !== null) {
      const path = match[1];
      const ext = path.split('.').pop().toLowerCase();
      if (['jpg', 'jpeg', 'png', 'bmp', 'gif', 'webp'].includes(ext)) {
        const fullUrl = path.startsWith('http') ? path : `${DETAIL_BASE}${path}`;
        images.push(fullUrl);
      }
    }

    if (images.length === 0) {
      const imgRegex = /<img[^>]*src\s*=\s*['"]([^'"]*nccq_nas[^'"]*)['"]/gi;
      while ((match = imgRegex.exec(html)) !== null) {
        const src = match[1];
        const fullUrl = src.startsWith('http') ? src : `${DETAIL_BASE}${src}`;
        images.push(fullUrl);
      }
    }

    return images;
  } catch {
    return [];
  }
}

function transformRecord(record) {
  const addr = parseAddress(record.xmdz);

  let priceYear = null;
  if (record.gpjg && parseFloat(record.gpjg) > 0) {
    const unit = record.gpjgdw || '';
    const price = parseFloat(record.gpjg);
    if (unit.includes('万元')) {
      priceYear = price;
    } else if (unit.includes('元/亩')) {
      const area = parseFloat(record.tdmj) || 1;
      priceYear = Math.round((price * area) / 10000 * 100) / 100;
    } else {
      priceYear = Math.round(price / 10000 * 100) / 100;
    }
  }

  let leaseYears = null;
  if (record.zcqx && parseInt(record.zcqx) > 0) {
    leaseYears = parseInt(record.zcqx);
  } else if (record.zcqxmonth && parseInt(record.zcqxmonth) > 0) {
    leaseYears = Math.round(parseInt(record.zcqxmonth) / 12);
  }

  let assetType = '种植';
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
  const headers = {};
  if (CF_API_TOKEN) headers['Authorization'] = `Bearer ${CF_API_TOKEN}`;
  const res = await fetch(`${CF_API_URL}/api/scrape`, { headers });
  const data = await res.json();
  const recipes = data.recipes || [];
  // 优先找 source_name=cdaee，其次找名字包含“四川”或“农交所”的
  const sys = recipes.find(r => r.source_name === 'cdaee')
    || recipes.find(r => r.name && (r.name.includes('四川') || r.name.includes('农交所')))
    || recipes.find(r => r.name === '系统内置采集器');
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

// 读取上次采集日期（从 recipe 的 last_run_at 字段）
async function getLastScrapeDate(recipeId) {
  try {
    const res = await fetch(`${CF_API_URL}/api/scrape`, {
      headers: { 'Authorization': `Bearer ${CF_API_TOKEN}` },
    });
    const data = await res.json();
    const recipes = data.recipes || [];
    const recipe = recipes.find(r => r.id === recipeId);
    if (recipe?.last_run_at) {
      // 返回上次运行日期的前一天（确保不漏数据）
      const d = new Date(recipe.last_run_at);
      d.setDate(d.getDate() - 1);
      return d.toISOString().split('T')[0]; // YYYY-MM-DD
    }
  } catch {}
  // 默认采集最近7天
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().split('T')[0];
}

async function main() {
  const args = process.argv.slice(2);
  const maxPages = parseInt(args.find((_, i, a) => a[i - 1] === '--pages') || '3');
  const dryRun = args.includes('--dry-run');
  const noImage = args.includes('--no-image');
  let sinceDate = args.find((_, i, a) => a[i - 1] === '--since') || '';

  // 如果没有指定日期，从 recipe 的 last_run_at 推算
  if (!sinceDate) {
    const recipeId = await getSystemRecipeId();
    if (recipeId) {
      sinceDate = await getLastScrapeDate(recipeId);
    } else {
      // 默认7天
      const d = new Date();
      d.setDate(d.getDate() - 7);
      sinceDate = d.toISOString().split('T')[0];
    }
  }

  console.log('🌾 四川省农村产权综合交易平台 采集器');
  console.log(`📄 最多采集: ${maxPages} 页`);
  console.log(`📅 采集起始日期: ${sinceDate}`);
  console.log(`🔧 模式: ${dryRun ? '预览(dry-run)' : '入库'}`);
  console.log(`🖼️ 图片采集: ${noImage ? '关闭' : '开启（仅保留有图片的内容）'}`);
  console.log('');

  let totalItems = [];
  let skippedNoImage = 0;

  for (let page = 0; page < maxPages; page++) {
    console.log(`📥 采集第 ${page + 1}/${maxPages} 页...`);
    try {
      const result = await fetchPage(page, PAGE_SIZE, sinceDate);
      const records = result.records || [];
      console.log(`   获取 ${records.length} 条 (总计: ${result.totalcount})`);

      for (const record of records) {
        const item = transformRecord(record);

        if (!noImage && item.source_url) {
          console.log(`   🖼️ ${item.title.substring(0, 30)}...`);
          const images = await fetchDetailImages(item.source_url);
          if (images.length > 0) {
            item._images = images;
            console.log(`      ✅ ${images.length} 张图片`);
          } else {
            console.log(`      ⏭️ 无图片，跳过`);
            skippedNoImage++;
            continue;
          }
          await new Promise(r => setTimeout(r, 500 + Math.random() * 500));
        }

        totalItems.push(item);
      }

      if (page < maxPages - 1) {
        await new Promise(r => setTimeout(r, 1000 + Math.random() * 1000));
      }
    } catch (err) {
      console.error(`   ❌ 第 ${page + 1} 页失败: ${err.message}`);
    }
  }

  console.log(`\n📊 采集完成: ${totalItems.length} 条有图片，${skippedNoImage} 条无图片跳过`);

  if (dryRun) {
    console.log('\n--- 预览前5条 ---');
    totalItems.slice(0, 5).forEach((item, i) => {
      console.log(`\n[${i + 1}] ${item.title}`);
      console.log(`    📍 ${item.location}`);
      console.log(`    📐 ${item.area_mu || '-'}亩 | 💰 ${item.price_year || '-'}万/年 | ⏱ ${item.lease_years || '-'}年`);
      console.log(`    🏷️ ${item.asset_type}`);
      console.log(`    🖼️ 图片: ${(item._images || []).length} 张`);
    });
  } else {
    console.log('💾 保存到暂存区...');
    try {
      const recipeId = await getSystemRecipeId();
      if (!recipeId) { console.error('❌ 未找到系统内置采集器配方，请先在后台创建'); process.exit(1); }
      console.log(`   使用配方 ID: ${recipeId}`);
      const result = await saveToStaging(totalItems, recipeId);
      if (result.success) {
        // 更新配方的 last_run_at
        await fetch(`${CF_API_URL}/api/scrape`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${CF_API_TOKEN}`,
          },
          body: JSON.stringify({ action: 'update-status', recipeId, status: 'success' }),
        }).catch(() => {});

        console.log('✅ 保存成功，请到后台「暂存数据清洗」页面审核入库');
        console.log('💡 提示：在后台点击「AI重写标题」按钮可批量优化标题');
      } else {
        console.error('❌ 保存失败:', result.error);
      }
    } catch (err) {
      console.error('❌ 保存失败:', err.message);
    }
  }
}

main().catch(console.error);
