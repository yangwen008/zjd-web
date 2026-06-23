# zjd.cn - 乡村闲置资产数字交易所

> 金禾计划 v8.8.1 · 全栈落地终极版

## 技术栈

- **前端**: Next.js 15 (App Router) + React 19 + Tailwind CSS
- **边缘计算**: Cloudflare Workers
- **数据库**: Cloudflare D1 (SQLite)
- **存储**: Cloudflare R2 (私有桶 + 签名URL)
- **AI**: Gemini 2.0 Flash (数据清洗/提取)
- **爬虫**: GitHub Actions + Playwright
- **部署**: Cloudflare Pages

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 初始化数据库

```bash
# 创建 D1 数据库 (首次)
wrangler d1 create zjd-main

# 执行建表脚本
npm run db:init

# 导入种子数据
npm run db:seed
```

### 3. 配置环境变量

编辑 `wrangler.toml`，填入：
- `GEMINI_API_KEY`: 你的 Gemini API Key
- `database_id`: D1 数据库 ID

### 4. 本地开发

```bash
npm run dev
```

访问 http://localhost:3000

### 5. 部署

```bash
# 部署到 Cloudflare Pages
npm run build
wrangler pages deploy .vercel/output/static
```

## 项目结构

```
zjd-web/
├── app/                    # Next.js App Router
│   ├── page.tsx            # 首页
│   ├── regions/            # 热点寻源
│   ├── market-index/       # 流转大盘
│   ├── search/             # 搜索引擎
│   ├── brokers/            # 合伙人墙
│   ├── bulk-projects/      # 大宗路演
│   ├── infra-rating/       # 基建指标
│   ├── asset/[id]/         # 三级尽调详情
│   ├── admin/              # 后台管理
│   └── api/                # Worker API
├── components/             # UI 组件库
├── lib/                    # 核心逻辑库
│   ├── db.ts               # D1 连接
│   ├── ai.ts               # Gemini AI
│   └── utils.ts            # 工具函数
├── sql/                    # 数据库脚本
│   ├── schema.sql          # 建表
│   └── seed.sql            # 种子数据
├── scrapers/               # 爬虫引擎
│   └── catcher.js          # 主干程序
├── .github/workflows/      # GitHub Actions
└── wrangler.toml           # Cloudflare 配置
```

## 后台管理

访问 `/admin` 进入后台控制台：

- **运营控制台**: 公司信息、页脚文案、首页数据配置
- **资产审核**: 审批/拒绝用户提交的资产
- **爬虫管理**: 新增/编辑/删除采集配方，0代码扩展
- **全局配置**: 超管权限、审计日志

## 爬虫配方化

新增采集站不需要写代码：

1. 进入后台 → 爬虫管理 → 新增采集站
2. 填写站点URL、XPath选择器、字段映射
3. 点击"测试抓取"验证
4. 保存配方，启用

主干程序每天凌晨自动读取所有启用的配方执行采集。

## 安全机制

- R2 私有签名URL + Referer防盗链
- 每日发布防刷（C端3宗/日，G端5宗/日）
- GPS围栏去重 + AI虚假信息交叉比对
- 管理员审计日志（只INSERT不DELETE）
- Gemini 消费熔断滑块（日预算硬顶）

## License

Private - 绵阳网安科技有限公司
