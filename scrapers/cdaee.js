/**
 * 四川省农村产权综合交易平台 采集器
 * 直接调用 JSON API + 详情页图片采集 + AI标题重写
 * 
 * 用法：
 *   node scrapers/cdaee.js              # 采集资产资源（默认3页）
 *   node scrapers/cdaee.js --pages 5    # 采集5页
 *   node scrapers/cdaee.js --dry-run    # 预览不入库
 *   node scrapers/cdaee.js --no-image   # 不采集图片（保留所有记录）
 *   node scrapers/cdaee.js --no-rename  # 不重写标题
 */

const CF_API_URL = process.env.CF_API_URL || 'https://zjd.cn';
const CF_API_TOKEN = process.env.CF_API_TOKEN || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

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
 * 用 AI 重写标题：结合内容生成更精准的标题
 * 批量处理，一次 API 调用重写多个标题
 */
async function rewriteTitles(items) {
  if (!GEMINI_API_KEY || items.length === 0) return items;

  // 构建批量重写请求
  const lines = items.map((item, i) => {
    const desc = (item.description || '').substring(0, 200);
    return `[${i}] 标题: ${item.title}\n    地点: ${item.location}\n    面积: ${item.area_mu || '-'}亩 | 类型: ${item.asset_type}\n    内容: ${desc}`;
  }).join('\n\n');

  const prompt = `你是乡村资产标题优化专家。请根据以下资产信息，为每条资产重新生成一个简洁、有吸引力的标题。

要求：
1. 标题要包含地点+资产类型+核心亮点
2. 长度控制在15-30字
3. 保留关键数据（面积、价格等）
4. 去掉"公告"、"项目"、"流转"等冗余后缀
5. 风格：专业但不枯燥

请严格按格式返回，每行一条：
[序号] 新标题

资产列表：
${lines}`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 2048, temperature: 0.3 },
        }),
      }
    );

    if (!res.ok) {
      console.warn(`   ⚠️ AI标题重写失败: HTTP ${res.status}`);
      return items;
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // 解析返回的标题
    const titleMap = new Map();
    const matches = text.matchAll(/\[(\d+)\]\s*(.+)/g);
    for (const m of matches) {
      const idx = parseInt(m[1]);
      const newTitle = m[2].trim();
      if (idx >= 0 && idx < items.length && newTitle) {
        titleMap.set(idx, newTitle);
      }
    }

    // 应用新标题
    let renamed = 0;
    for (const [idx, newTitle] of titleMap) {
      items[idx]._originalTitle = items[idx].title;
      items[idx].title = newTitle;
      renamed++;
    }

    console.log(`   ✏️ AI重写标题: ${renamed}/${items.length} 条`);
    return items;
  } catch (err) {
    console.warn(`   ⚠️ AI标题重写异常: ${err.message}`);
    return items;
  }
}

/**
 * 从详情页提取图片 URL 列表
 * 图片在附件列表的 data-attachurl 属性中，过滤 jpg/png/jpeg/bmp
 */
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

    // 匹配 data-attachurl 属性中的图片路径
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

    // 备用：匹配 <img> 标签中的 nccq_nas 图片
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
  const noImage = args.includes('--no-image');
  const noRename = args.includes('--no-rename');

  console.log('🌾 四川省农村产权综合交易平台 采集器');
  console.log(`📄 采集页数: ${maxPages}`);
  console.log(`🔧 模式: ${dryRun ? '预览(dry-run)' : '入库'}`);
  console.log(`🖼️ 图片采集: ${noImage ? '关闭' : '开启（仅保留有图片的内容）'}`);
  console.log(`✏️ AI重写标题: ${noRename || !GEMINI_API_KEY ? '关闭' : '开启'}`);
  console.log('');

  let totalItems = [];
  let skippedNoImage = 0;

  for (let page = 0; page < maxPages; page++) {
    console.log(`📥 采集第 ${page + 1}/${maxPages} 页...`);
    try {
      const result = await fetchPage(page, PAGE_SIZE);
      const records = result.records || [];
      console.log(`   获取 ${records.length} 条 (总计: ${result.totalcount})`);

      // 转换所有记录
      const items = records.map(transformRecord);

      // AI 重写标题（整页批量处理）
      if (!noRename && GEMINI_API_KEY) {
        await rewriteTitles(items);
      }

      // 逐条采集图片
      for (const item of items) {
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

      // 翻页间隔
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
      if (item._originalTitle) console.log(`    原标题: ${item._originalTitle}`);
      console.log(`    📍 ${item.location}`);
      console.log(`    📐 ${item.area_mu || '-'}亩 | 💰 ${item.price_year || '-'}万/年 | ⏱ ${item.lease_years || '-'}年`);
      console.log(`    🏷️ ${item.asset_type} | 来源: ${item.source_url || '-'}`);
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
