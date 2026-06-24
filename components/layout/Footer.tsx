interface FooterProps {
  config?: Record<string, string>;
}

export default function Footer({ config }: FooterProps) {
  const companyName = config?.company_name || '绵阳网安科技有限公司';
  const companyPhone = config?.company_phone || '13696266999';
  const companyEmail = config?.company_email || 'contact@zjd.cn';
  const icpNumber = config?.icp_number || '蜀ICP备16015085号-5';
  const footerAbout = config?.footer_about || '乡村闲置资产数字交易所。全网多源产权低频提纯，让技术重归山川。';

  return (
    <footer className="bg-brand-dark text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-brand-green flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-white font-bold text-lg">zjd.cn</span>
            </div>
            <p className="text-sm leading-relaxed">{footerAbout}</p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4">流转大厅</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/regions" className="hover:text-white transition-colors">🔥 热点寻源榜</a></li>
              <li><a href="/market-index" className="hover:text-white transition-colors">📊 土地价格大盘</a></li>
              <li><a href="/search" className="hover:text-white transition-colors">🔍 官方原矿检索</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-sm mb-4">双边生态</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/bulk-projects" className="hover:text-white transition-colors">🏢 大宗项目路演</a></li>
              <li><a href="/infra-rating" className="hover:text-white transition-colors">🛰️ 隐居新基建指标</a></li>
              <li><a href="/brokers" className="hover:text-white transition-colors">🌾 地陪合伙人名册</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-sm mb-4">合作与法务通道</h4>
            <ul className="space-y-2 text-sm">
              <li>合作热线：<strong className="text-white">{companyPhone}</strong></li>
              <li>企业邮箱：<strong className="text-white">{companyEmail}</strong></li>
              <li>ICP备案：<strong className="text-white">{icpNumber}</strong></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6">
          <p className="text-xs text-gray-500 leading-relaxed">
            【合规与演绎隔离声明】本平台展示的所有官方产权信息均通过合法公开手段采集，前端呈现的报告在版权法上属于&quot;演绎再创作作品&quot;。本站仅提供决策参考，交易双方须线下核验产权真实性。
          </p>
          <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500">
            <a href="#" className="hover:text-white transition-colors">《平台数据隐私保护白皮书》</a>
            <span>|</span>
            <a href="#" className="hover:text-white transition-colors">《免责声明 4.0》</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
