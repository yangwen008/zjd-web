// 爬虫主干引擎 (catcher.js)
// 只写一次，永远不需要改。所有差异化配置从 D1 scrapers_recipes 表读取。
//
// 运行方式：
//   - GitHub Actions 每天凌晨定时触发
//   - 或手动在后台点击"立即执行"
//
// 依赖：playwright (需在 GitHub Actions 中安装)

const { chromium } = require('playwright');

// 从环境变量获取配置
const CF_API_URL = process.env.CF_API_URL || 'https://zjd-web.pages.dev';
const CF_API_TOKEN = process.env.CF_API_TOKEN || '';

// 请求重试工具
async function fetchWithRetry(url, options = {}, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      if (res.ok) return res;
      if (res.status === 429 && i < retries - 1) {
        // 速率限制，等待后重试
        const wait = Math.pow(2, i + 1) * 1000;
        console.log(`  ⏳ Rate limited, waiting ${wait}ms...`);
        await new Promise(r => setTimeout(r, wait));
        continue;
      }
      return res;
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
}

async function fetchRecipes() {
  const res = await fetchWithRetry(`${CF_API_URL}/api/scrape?path=recipes`, {
    headers: { 'Authorization': `Bearer ${CF_API_TOKEN}` },
  });
  const data = await res.json();
  return data.recipes || [];
}

async function updateStatus(recipeId, status, errorMsg = null) {
  await fetchWithRetry(`${CF_API_URL}/api/scrape`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CF_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action: 'update-status', recipeId, status, errorMsg }),
  });
}

async function saveRawData(recipeId, rawData) {
  await fetchWithRetry(`${CF_API_URL}/api/scrape`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CF_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action: 'save-raw', recipeId, rawData }),
  });
}

// CSS 选择器提取（在 page.evaluate 内执行）
// 支持属性提取：img@src, a@href, meta@content
function extractField(node, selector) {
  if (!selector) return '';
  
  // 处理属性选择器：如 "img@src" 或 "a@href"
  const attrMatch = selector.match(/^(.+?)@(\w+)$/);
  if (attrMatch) {
    const [, sel, attr] = attrMatch;
    const el = node.querySelector(sel);
    return el?.getAttribute(attr) || '';
  }
  
  // 普通文本选择器
  const el = node.querySelector(selector);
  return el?.textContent?.trim() || '';
}

async function scrapeRecipe(browser, recipe) {
  const selectors = JSON.parse(recipe.selectors);
  const detailSelectors = recipe.detail_selectors ? JSON.parse(recipe.detail_selectors) : null;
  const page = await browser.newPage();
  
  // 随机 User-Agent
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
  ];
  await page.setExtraHTTPHeaders({
    'User-Agent': userAgents[Math.floor(Math.random() * userAgents.length)],
  });

  const allItems = [];

  try {
    const maxPages = Math.min(recipe.max_pages || 10, 20); // 安全上限

    for (let p = 1; p <= maxPages; p++) {
      const url = recipe.list_url.replace('{page}', p);
      console.log(`  [Page ${p}/${maxPages}] ${url}`);
      
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      
      // 等待列表容器加载
      if (selectors.list?.container) {
        await page.waitForSelector(selectors.list.container, { timeout: 10000 }).catch(() => {});
      }

      // 提取列表数据 — 纯 CSS 选择器，在浏览器端执行
      const items = await page.evaluate(({ containerSel, fieldSels }) => {
        if (!containerSel) return [];
        
        const nodes = document.querySelectorAll(containerSel);
        return Array.from(nodes).map(node => {
          const result = {};
          for (const [key, selector] of Object.entries(fieldSels || {})) {
            try {
              if (!selector) { result[key] = ''; continue; }
              
              // 属性选择器
              const attrMatch = selector.match(/^(.+?)@(\w+)$/);
              if (attrMatch) {
                const el = node.querySelector(attrMatch[1]);
                result[key] = el?.getAttribute(attrMatch[2]) || '';
              } else {
                const el = node.querySelector(selector);
                result[key] = el?.textContent?.trim() || '';
              }
            } catch {
              result[key] = '';
            }
          }
          return result;
        });
      }, {
        containerSel: selectors.list?.container,
        fieldSels: selectors.list?.fields || {},
      });

      // 进详情页提取
      if (detailSelectors && items.length > 0) {
        const detailLimit = Math.min(items.length, 10); // 每页最多进 10 条详情
        for (let i = 0; i < detailLimit; i++) {
          const item = items[i];
          const linkField = detailSelectors.link_field || 'link';
          const link = item[linkField];
          
          if (link) {
            try {
              const detailUrl = link.startsWith('http') ? link : `${recipe.base_url}${link}`;
              await page.goto(detailUrl, { waitUntil: 'networkidle', timeout: 20000 });
              
              const detail = await page.evaluate(({ fieldSels }) => {
                const result = {};
                for (const [key, selector] of Object.entries(fieldSels || {})) {
                  try {
                    if (!selector || key === 'link_field') { result[key] = ''; continue; }
                    
                    const attrMatch = selector.match(/^(.+?)@(\w+)$/);
                    if (attrMatch) {
                      const el = document.querySelector(attrMatch[1]);
                      result[key] = el?.getAttribute(attrMatch[2]) || '';
                    } else {
                      const el = document.querySelector(selector);
                      result[key] = el?.textContent?.trim() || '';
                    }
                  } catch {
                    result[key] = '';
                  }
                }
                return result;
              }, { fieldSels: detailSelectors.fields || detailSelectors });
              
              item.detail = detail;
            } catch (e) {
              console.log(`    Detail page failed: ${e.message}`);
            }
            
            // 请求间隔 1-3 秒，避免被封
            await new Promise(r => setTimeout(r, 1000 + Math.random() * 2000));
          }
        }
      }

      allItems.push(...items);
      console.log(`    Extracted ${items.length} items`);

      // 翻页间隔
      if (p < maxPages) {
        await new Promise(r => setTimeout(r, 1000 + Math.random() * 1000));
      }
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
  
  if (!CF_API_TOKEN) {
    console.error('❌ CF_API_TOKEN not set. Exiting.');
    process.exit(1);
  }

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

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
