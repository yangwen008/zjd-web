# zjd-web 工作日志学习总结

## 项目开发时间线

### 2026-06-29 (千问)
- **Dashboard 用户后台**：补齐"我的资产"、"我的线索"、"我的收藏"子页面及 API
- **资产发布系统**：完整闭环 — 前端表单（GPS定位、图片/视频上传）→ 后端入库 → 审核 → 前台展示
- **R2 私有化存储**：代理上传链路，图片/视频通过 API 代理访问（防盗链）
- **Dashboard 统计修复**：修复 toLocaleString() 导致页面崩溃的致命 Bug
- **MediaGallery 轮播组件**：图片/视频混合轮播，缩略图导航

### 2026-06-30 上午 (MIMO)
- **地址下拉框 Bug 修复**：React 'use client' 子组件内原生 `<select>` 丢失交互能力，通过内联写法解决
- **资产修改页**：用户可修改已发布资产，含图片管理
- **Admin 资产审核优化**：编辑 Modal 省市下拉框、图片管理、搜索栏
- **区县数据修复**：种子数据中 province 字段全部错填为"四川省"
- **GPS 自动匹配省市**：Haversine 算法

### 2026-06-30 下午 (千问)
- **ClientShell 路由守卫**：物理隔离前台 Navbar/Footer 在后台页面闪现
- **Admin 后台全面升级**：侧边栏浅色主题、菜单分组折叠、真实 Logo、运营控制台跳转
- **Dashboard 用户中心**：专属 Topbar、品牌 Logo、时间段问候语、卡片式快捷操作
- **前台品牌统一**："宅基地交易所"、微信登录入口

### 2026-07-01 上午 (MIMO)
- **注册系统改造**：先选身份→再填信息，增加"大宗用户"角色
- **Dashboard 重构**：菜单重规划、大宗项目管理全链路（发布/编辑/列表）
- **个人资料页**：头像上传、资质文件上传
- **导航栏重构**：登录态检测、村委直发入口
- **热点寻源整合搜索**：FilterPanel + 排序
- **基建配套 & 环境指标**：assets 和 bulk_projects 新增 infra_details 字段
- **TipTap 富文本编辑器**：商业计划书编辑
- **图片压缩系统**：客户端 Canvas API 压缩，生成缩略图

### 2026-07-01 下午 (MIMO)
- **审核中心系统**：统一审核页面（资产+大宗+用户角色），预览弹窗
- **资产管理体系**：按来源分类、推荐开关、确权状态、URL参数同步
- **UGC 个人资产展示**：搜索页默认全来源、最新发布板块
- **统一标签体系**：来源标签（官方/村委/个人）、确权标签（已确权/待确权/未确权）
- **联系方式登录控制**：ContactCard 组件，未登录显示脱敏电话
- **大宗项目完善**：商业计划书渲染、视频上传、MediaGallery 复用
- **图片压缩系统**：1200px 压缩 + 400px 缩略图，新格式 {url, thumb}
- **首页数据控制**：所有板块数量从 homepage_config 读取

## 数据库变更汇总

```sql
-- 新增字段
ALTER TABLE assets ADD COLUMN infra_details TEXT;        -- 基建配套+环境指标 JSON
ALTER TABLE assets ADD COLUMN certification TEXT DEFAULT 'uncertified';  -- 确权状态
ALTER TABLE bulk_projects ADD COLUMN infra_details TEXT;  -- 大宗基建
ALTER TABLE bulk_projects ADD COLUMN commercial_plan_doc TEXT;  -- 商业计划书附件URL
```

## 已知遗留问题

1. **注册页 RegionSelector**：与发布页相同的下拉框 Bug，需统一处理
2. **密码哈希**：SHA-256 无 salt，安全性一般
3. **R2 公开 URL**：占位域名未替换
4. **解锁逻辑**：/api/unlock 直接标记完成，实际解密未实现
5. **Admin 认证**：admin_token 硬编码 'authenticated'

## 架构特点

- **Edge Runtime**：全站运行在 Cloudflare Pages 边缘
- **Server Components**：首页等页面使用异步服务端组件，并行查询多个数据源
- **私有 R2**：图片通过 API 代理访问，不暴露存储桶
- **AI 提纯**：Gemini 2.0 Flash 从爬虫 HTML 提取结构化数据，预算熔断
- **配置化首页**：homepage_config 表控制各板块标题/数量/副标题
- **图片压缩**：客户端 Canvas API 压缩 + 缩略图，列表页用缩略图提速
