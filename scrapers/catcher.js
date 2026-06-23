// 爬虫主干引擎 (catcher.js)
// 只写一次，永远不需要改。所有差异化配置从 D1 scrapers_recipes 表读取。
//
// 运行方式：
//   - GitHub Actions 每天定时触发 HTTP 请求到 /api/scrape
//   - 或手动在后台点击"立即执行"
//
// 依赖：playwright (需在 GitHub Actions 中安装)

const { chromium } = require('playwright');

// 从环境变量获取配置
const CF_API_URL = process.env.CF_API_URL || 'https://zjd.cn';
const CF_API_TOKEN = process.env.CF_API_TOKEN || '';

async function fetchRecipes() {
  const res = await fetch(`${CF_API_URL}/api/scrape/recipes`, {
    headers: { 'Authorization': `Bearer ${CF_API_TOKEN}` },
  });
  const data = await res.json();
  return data.recipes || [];
}

async function updateStatus(recipeId, status, errorMsg = null) {
  await fetch(`${CF_API_URL}/api/scrape/status`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CF_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ recipeId, status, errorMsg }),
  });
}

async function saveRawData(recipeId, rawData) {
  await fetch(`${CF_API_URL}/api/scrape/save-raw`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CF_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ recipeId, rawData }),
  });
}

function extractByXPath(node, xpath) {
  // 简化版XPath提取，实际部署时需要更完善的实现
  try {
    const result = node.evaluate(xpath, node, null, 7 /* ORDERED_NODE_SNAPSHOT_TYPE */);
    if (result.snapshotLength > 0) {
      return result.snapshotItem(0).textContent?.trim() || '';
    }
  } catch (e) {
    // fallback: 尝试CSS选择器
    try {
      const el = node.querySelector(xpath.replace(/\/\//g, '').replace(/\//g, ' > '));
      return el?.textContent?.trim() || '';
    } catch {}
  }
  return '';
}

async function scrapeRecipe(browser, recipe) {
  const selectors = JSON.parse(recipe.selectors);
  const detailSelectors = recipe.detail_selectors ? JSON.parse(recipe.detail_selectors) : null;
  const page = await browser.newPage();
  
  const allItems = [];

  try {
    for (let p = 1; p <= recipe.max_pages; p++) {
      const url = recipe.list_url.replace('{page}', p);
      console.log(`  [Page ${p}] ${url}`);
      
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      
      // 等待列表容器加载
      if (selectors.list?.container) {
        await page.waitForSelector(selectors.list.container, { timeout: 10000 }).catch(() => {});
      }

      // 提取列表数据
      const items = await page.evaluate((sel) => {
        const container = sel.list?.container;
        if (!container) return [];
        
        const nodes = document.querySelectorAll(container);
        return Array.from(nodes).map(node => {
          const result = {};
          for (const [key, selector] of Object.entries(sel.list.fields || {})) {
            try {
              const el = node.querySelector(selector);
              result[key] = el?.textContent?.trim() || el?.getAttribute('href') || '';
            } catch {
              result[key] = '';
            }
          }
          return result;
        });
      }, selectors);

      // 进详情页提取
      if (detailSelectors && items.length > 0) {
        for (const item of items.slice(0, 5)) { // 限制每页前5条进详情
          if (item.link) {
            try {
              const detailUrl = item.link.startsWith('http') ? item.link : `${recipe.base_url}${item.link}`;
              await page.goto(detailUrl, { waitUntil: 'networkidle', timeout: 20000 });
              
              const detail = await page.evaluate((sel) => {
                const result = {};
                for (const [key, selector] of Object.entries(sel.fields || {})) {
                  try {
                    if (selector.includes('@src') || selector.includes('@href') || selector.includes('@content')) {
                      const el = document.querySelector(selector.split('/@')[0]);
                      result[key] = el?.getAttribute(selector.split('/@')[1]) || '';
                    } else {
                      const el = document.querySelector(selector);
                      result[key] = el?.textContent?.trim() || '';
                    }
                  } catch {
                    result[key] = '';
                  }
                }
                return result;
              }, detailSelectors);
              
              item.detail = detail;
            } catch (e) {
              console.log(`    Detail page failed: ${e.message}`);
            }
          }
        }
      }

      allItems.push(...items);
      console.log(`    Extracted ${items.length} items`);
    }

    // 保存原始数据
    await saveRawData(recipe.id, allItems);
    await updateStatus(recipe.id, 'success');
    console.log(`  ✅ Recipe "${recipe.name}" done: ${allItems.length} items`);

  } catch (error) {
    console.error(`  ❌ Recipe "${recipe.name}" failed:`, error.message);
    await updateStatus(recipe.id, 'failed', error.message);
  } finally {
    await page.close();
  }
}

async function main() {
  console.log('🚀 Scraper engine starting...');
  
  const recipes = await fetchRecipes();
  console.log(`📋 Found ${recipes.length} enabled recipes`);

  if (recipes.length === 0) {
    console.log('No recipes to run. Exiting.');
    return;
  }

  const browser = await chromium.launch({ headless: true });

  try {
    for (const recipe of recipes) {
      console.log(`\n▶ Running: ${recipe.name} (${recipe.base_url})`);
      await updateStatus(recipe.id, 'running');
      await scrapeRecipe(browser, recipe);
    }
  } finally {
    await browser.close();
  }

  console.log('\n✅ All recipes completed.');
}

main().catch(console.error);
