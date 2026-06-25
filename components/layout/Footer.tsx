interface FooterProps {
  config?: Record<string, string>;
}

export default function Footer({ config }: FooterProps) {
  // 【绝对保留】：原有的数据读取逻辑和默认值完全不动
  const companyName = config?.company_name || '绵阳网安科技有限公司';
  const companyPhone = config?.company_phone || '13696266999';
  const companyEmail = config?.company_email || 'contact@zjd.cn';
  const icpNumber = config?.icp_number || '蜀ICP备16015085号-5';
  const footerAbout = config?.footer_about || '乡村闲置资产数字交易所。全网多源产权低频提纯，让技术重归山川。';

  return (
    // 【修改1】：背景改为 zjd.cn 的浅灰绿 #edf4f0，文字改为深色 #1E2022，增加顶部边框
    <footer className="bg-[#edf4f0] text-[#1E2022] pt-16 pb-8 border-t border-[#2C4C3B]/10 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* 【修改2】：网格改为 12 列布局，匹配 zjd.cn 的 4-2-2-4 黄金比例 */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-12">
          
          {/* Brand - 占 4 列 */}
          <div className="md:col-span-4 space-y-4">
            <div className="flex items-center space-x-2">
              {/* 【修改3】：图标背景改为浅绿透明，图标颜色改为深绿 */}
              <div className="w-8 h-8 rounded-lg bg-[#2C4C3B]/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-[#2C4C3B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              {/* 【修改4】：Logo 文字改为深绿 + 金色 (.cn 部分) */}
              <span className="text-2xl font-black tracking-tight text-[#2C4C3B]">
                zjd<span className="text-[#D4AF37]">.cn</span>
              </span>
            </div>
            {/* 【修改5】：简介文字改为浅灰，字号变小，行高增加 */}
            <p className="text-xs text-gray-600 leading-relaxed">{footerAbout}</p>
          </div>

          {/* Links 1 - 占 2 列 */}
          <div className="md:col-span-2 space-y-3">
            {/* 【修改6】：标题改为深绿，字号变小，增加字间距，全大写 */}
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#2C4C3B]">流转大厅</h4>
            <ul className="text-xs text-gray-600 space-y-2">
              <li><a href="/regions" className="hover:text-[#2C4C3B] transition-colors">🔥 热点寻源榜</a></li>
              <li><a href="/market-index" className="hover:text-[#2C4C3B] transition-colors">📊 土地价格大盘</a></li>
              <li><a href="/search" className="hover:text-[#2C4C3B] transition-colors">🔍 官方原矿检索</a></li>
            </ul>
          </div>

          {/* Links 2 - 占 2 列 */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#2C4C3B]">双边生态</h4>
            <ul className="text-xs text-gray-600 space-y-2">
              <li><a href="/bulk-projects" className="hover:text-[#2C4C3B] transition-colors">🏢 大宗项目路演</a></li>
              <li><a href="/infra-rating" className="hover:text-[#2C4C3B] transition-colors">🛰️ 隐居新基建指标</a></li>
              <li><a href="/brokers" className="hover:text-[#2C4C3B] transition-colors">🌾 地陪合伙人名册</a></li>
            </ul>
          </div>

          {/* Contact - 占 4 列 */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#2C4C3B]">合作与法务通道</h4>
            {/* 【修改7】：联系方式文字改为浅灰，强调部分（电话/邮箱/ICP）改为深绿加粗，使用等宽字体 */}
            <div className="text-xs text-gray-600 space-y-2 font-mono">
              <div>合作热线：<strong className="text-[#2C4C3B] font-bold">{companyPhone}</strong></div>
              <div>企业邮箱：<strong className="text-[#2C4C3B] font-bold">{companyEmail}</strong></div>
              <div>ICP备案：<strong className="text-[#2C4C3B] font-bold">{icpNumber}</strong></div>
            </div>
          </div>
        </div>

        {/* 【修改8】：底部合规与备案区，调整边框颜色、字号和布局 */}
        <div className="border-t border-[#2C4C3B]/10 pt-8">
          <p className="text-[10px] text-gray-500 leading-relaxed mb-4">
            【合规与演绎隔离声明】本平台展示的所有官方产权信息均通过合法公开手段采集，前端呈现的报告在版权法上属于&quot;演绎再创作作品&quot;。本站仅提供决策参考，交易双方须线下核验产权真实性。
          </p>
          <div className="flex flex-col md:flex-row items-center justify-between text-[10px] text-gray-500 gap-4">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
              {/* 这里顺便把您的 companyName 变量用上了，比硬编码更灵活 */}
              <span>© 2026 {companyName} 版权所有</span>
            </div>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-[#2C4C3B] transition-colors">《平台数据隐私保护白皮书》</a>
              <span>|</span>
              <a href="#" className="hover:text-[#2C4C3B] transition-colors">《免责声明 4.0》</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
