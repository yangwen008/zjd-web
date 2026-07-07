# zjd.cn 开发历史时间线

> 基于 15 份开发文档整理（2026-06-29 ~ 2026-07-07）

## 6月29日（千问）
- Dashboard 用户后台：补齐"我的资产"/"我的线索"/"我的收藏"页面，多角色数据隔离
- 资产发布系统：前端表单 → 后端入库 → GPS定位 → 图片视频上传，完整闭环
- R2 私有化存储：代理上传链路（上传→存储→代理访问）
- Dashboard 统计修复：toLocaleString() 报错导致页面崩溃的致命 Bug
- 前台详情页升级：MediaGallery 轮播组件（图片+视频混合）

## 6月30日 上午（MIMO）
- 完整项目分析报告
- 地址下拉框 Bug 修复（React 'use client' 子组件内原生 `<select>` 丢失交互能力）
- 13 次 commit 推送

## 6月30日 下午（千问）
- ClientShell 物理隔离：前台 Navbar/Footer 在后台页面不再闪现
- Admin 后台全面升级：侧边栏分组折叠、品牌 Logo、运营控制台
- Dashboard 焕然一新：Sidebar 顶天立地、专属 Topbar、问候语、卡片式快捷操作
- 前台品牌统一：Logo 集成、版本标签升级、登录入口优化

## 7月1日 上午（MIMO）
- 注册系统改造
- Admin 后台优化
- Dashboard 用户后台重构
- 个人资料页完善
- 导航栏重构
- 热点寻源整合搜索 + 排序
- 资产发布增加基建配套 & 环境指标（infra_details 字段）
- 大宗项目全链路完善
- 图片压缩 + 缩略图

## 7月1日 下午（MIMO）
- 审核中心系统
- 资产管理体系
- UGC/个人资产展示
- 统一标签体系
- 联系方式登录控制
- 图片压缩系统
- 首页数据控制
- certification 字段
- 55 次 commit

## 7月1日 晚上（MIMO）
- 安全与逻辑修复（PBKDF2 salt 类型、4项安全问题）
- 热点寻源页显示图片
- 推荐内容全局优先排序（featured DESC）
- 种植类型新增（🌾）
- 采集系统大改造
- 四川农交所采集器（cdaee.js）— 直接调 JSON API
- 来源账号自动管理（lib/source-account.ts）
- 前台标签体系（交易所/官方/村委/个人）
- source_accounts 表

## 7月2日（MIMO）
- 微信公众号 SDK 开发（wechat.ts: OAuth/JSSDK/模板消息/access_token 缓存）
- 预约带看功能（appointments 表）
- 域名迁移（zjd-web.pages.dev → zjd.cn）
- 微信公众号配置文件（wx-menu.json, wx-setup.sh, wx-auto-reply.md）
- appointments + wx_messages 表
- users 表新增 wx_openid/wx_unionid/wx_nickname/wx_avatar

## 7月2日 晚上（MIMO）
- OG metadata + 移动端分享按钮
- 全站移动端响应式优化（6个页面）
- 微信登录重定向修复
- Badge 逻辑修复（只有 project_publisher 显示"交易所"）

## 7月3日 上午（MIMO）
- 分页系统（3个列表页 + 1个公开API）
- 发布者资料页（/publisher/[id]）
- 拼单认购系统（参投）— investments 表，invest_* 字段
- 机构/村委介绍（bio 字段）
- TipTap 富文本编辑器
- 26 次提交，37 个文件变更

## 7月3日 下午（MIMO）
- 智能检索系统（/smart-search）— 资产+合伙人+大宗跨类型搜索，IP 地理定位优先排序
- 微信分享 OG 图修复
- 侧边栏 sticky 统一修复
- 导航栏文案修改
- 无数据库变更

## 7月5日 下午（MIMO）
- 微信分享修复（JSSDK ticket 缓存、OG 图片三重判断）
- 爬虫采集系统：tuliu-nongfang.js（土流网）、jutubao.js（聚土网）
- 详情页全面升级：ZJD 编号、权证信息、交通信息、腾讯地图
- 用户发布系统增强：交通信息下拉、权证信息下拉、区县下拉
- Admin 后台增强：用户编辑弹窗、批量删除、分页
- 地理信息数据：877 个区县

## 7月6日 下午（MIMO）
- 微信分享持续修复（代理服务器配置）
- SEO 优化（sitemap.ts + robots.ts）
- Admin 后台增强：大宗编辑弹窗、资产列表分页
- 数据采集系统：一键采集+入库 API、批量图片下载上传 R2
- 前端优化：首页缓存延长到 1 小时、骨架屏

## 7月6日 晚上（MIMO）
- 代码质量问题修复（4项）
- admin_audit_logs 表新增 6 列
- 微信 JSSDK 分享代理服务器优化
- 采集系统代理调试

## 7月7日 上午（MIMO）
- 微信分享最终结论：从公众号菜单打开有标题描述，从外部打开无（微信安全机制）
- 采集系统关键发现：Worker 能直连聚土网（200 OK, 1秒），不需要代理
- 之前 502 是因为代理 8443 端口被 Cloudflare 拦截（Error 1003）

---

## 关键架构决策

1. **认证系统**: 用户 Session + PBKDF2（兼容旧 SHA-256）; 管理员 HMAC token
2. **图片存储**: R2 私有桶 → 代理访问 `/api/images/[...path]`
3. **爬虫配方化**: scrapers_recipes 表存配置，catcher.js 引擎读取执行
4. **来源账号自动管理**: 采集数据自动匹配/创建农交所账号
5. **首页配置化**: homepage_config KV 表，后台可调所有板块
6. **Edge Runtime**: 所有 API Route 均为 edge，运行在 Cloudflare Workers

## 待解决事项

1. admin_audit_logs 表新增 6 列迁移（audit-logs-upgrade.sql）
2. 微信 JSSDK IP 白名单问题
3. 注册页 RegionSelector 同样的 select 交互 Bug
4. FTS5 中文分词精度
5. 首页 8 个并行 D1 查询性能优化
