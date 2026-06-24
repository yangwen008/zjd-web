"use client";

import HeroSection from "@/components/test-home/HeroSection";
import RegionGrid from "@/components/test-home/RegionGrid";
import MarketStats from "@/components/test-home/MarketStats";
import PropertyCard from "@/components/test-home/PropertyCard";
import VillageDirectCard from "@/components/test-home/VillageDirectCard";
import BulkProjectCard from "@/components/test-home/BulkProjectCard";
import InfraRatingCard from "@/components/test-home/InfraRatingCard";
import BrokerCard from "@/components/test-home/BrokerCard";
import CTASection from "@/components/test-home/CTASection";
import { mockProperties, mockVillageProjects, mockBulkProjects, mockInfraRatings, mockBrokers } from "@/lib/test-home-data";

// --- 内部小组件 (Nav & Footer) ---

function Navigation() {
  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* 左侧：Logo + 菜单 */}
          <div className="flex items-center gap-8">
            {/* Logo */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="text-2xl font-bold">
                <span className="text-gray-900">zjd</span>
                <span className="text-[#1a4731]">.cn</span>
              </div>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">宅基地计划 v8.8.1</span>
            </div>
            
            {/* 导航菜单 */}
            <div className="hidden md:flex items-center gap-6 text-sm text-gray-600">
              <a href="#" className="hover:text-[#1a4731] transition-colors flex items-center gap-1">
                <span>🔥</span> 热点寻源
              </a>
              <a href="#" className="hover:text-[#1a4731] transition-colors flex items-center gap-1">
                <span>📊</span> 流转大盘
              </a>
              <a href="#" className="hover:text-[#1a4731] transition-colors flex items-center gap-1">
                <span>🔍</span> 资产搜索
              </a>
              <a href="#" className="hover:text-[#1a4731] transition-colors flex items-center gap-1">
                <span>🏢</span> 大宗路演
              </a>
              <a href="#" className="hover:text-[#1a4731] transition-colors flex items-center gap-1">
                <span>🏘️</span> 隐居基建
              </a>
              <a href="#" className="hover:text-[#1a4731] transition-colors flex items-center gap-1">
                <span>🌾</span> 金牌合伙人
              </a>
            </div>
          </div>

          {/* 右侧：按钮 */}
          <div className="flex items-center gap-3">
            <button className="text-sm text-gray-600 hover:text-[#1a4731] flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
              <span>⚙️</span> 后台管理
            </button>
            <button className="bg-[#1a4731] hover:bg-[#2d5a45] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/>
              </svg>
              微信安全登录
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

// 替换为这个高大上的全新 Footer：
function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 顶部：四列内容布局 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          
          {/* 第一列：品牌介绍 */}
          <div>
            <div className="text-2xl font-bold text-[#1a4731] mb-3">zjd.cn</div>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              zjd.cn 是由绵阳网安科技有限公司倾力打造的乡村闲置资产数字交易所。我们通过分布式低频智能采矿与大模型型价值清洗，将零散、非结构化的民间资产重塑为具备高依托信用、完美基建指标、完全穿透地理边界的数字化绿色大宗资产。
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-gray-400 hover:text-[#1a4731] transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/></svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-[#1a4731] transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/></svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-[#1a4731] transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/></svg>
              </a>
            </div>
          </div>

          {/* 第二列：流转大厅 */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">流转大厅</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><a href="#" className="hover:text-[#1a4731] transition-colors flex items-center gap-2"><span>🔥</span> 热点寻源榜</a></li>
              <li><a href="#" className="hover:text-[#1a4731] transition-colors flex items-center gap-2"><span>📊</span> 土地价格大盘</a></li>
              <li><a href="#" className="hover:text-[#1a4731] transition-colors flex items-center gap-2"><span>🔍</span> 官方原矿检索</a></li>
            </ul>
          </div>

          {/* 第三列：双边生态 */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">双边生态</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><a href="#" className="hover:text-[#1a4731] transition-colors flex items-center gap-2"><span>🎪</span> 大宗项目路演</a></li>
              <li><a href="#" className="hover:text-[#1a4731] transition-colors flex items-center gap-2"><span>🏘️</span> 隐居新基建指标</a></li>
              <li><a href="#" className="hover:text-[#1a4731] transition-colors flex items-center gap-2"><span>🤝</span> 地陪合伙人名册</a></li>
            </ul>
          </div>

          {/* 第四列：合作与法务 */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">合作与法务通道</h4>
            <ul className="space-y-2 text-sm text-gray-600 mb-4">
              <li><span className="text-gray-500">合作热线：</span><strong className="text-gray-900">13696266999</strong></li>
              <li><span className="text-gray-500">企业邮箱：</span><strong className="text-gray-900">cooperate@zjd.cn</strong></li>
            </ul>
            <div className="p-3 bg-gray-100 rounded-lg text-xs text-gray-500 leading-relaxed">
              【合规与演绎隔离声明】本平台展示的所有官方产权信息均通过合法公开手段采集，前端呈现的拼凑在新积木上属于"演绎再创作作品"。本店铺坚持共享求真，交易双方须线下验证产权真实性。
            </div>
          </div>
        </div>

        {/* 底部：版权与备案信息 */}
        <div className="border-t border-gray-200 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
            <div>© 2026 绵阳网安科技有限公司 版权所有</div>
            <div className="flex gap-6">
              <span>蜀ICP备16015085号-5</span>
              <span>蜀公网安备 51070302000888号</span>
            </div>
            <div className="flex gap-6">
              <a href="#" className="hover:text-[#1a4731] transition-colors">《平台数据隐私保护白皮书》</a>
              <a href="#" className="hover:text-[#1a4731] transition-colors">《免责声明4.0》</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

// --- 主页面 ---

export default function TestNewHomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 全局样式注入 */}
      <style jsx global>{`
        .card-hover { transition: all 0.3s ease; }
        .card-hover:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(0,0,0,0.1); }
        .image-zoom { transition: transform 0.5s ease; }
        .group:hover .image-zoom { transform: scale(1.1); }
      `}</style>

      <Navigation />
      
      <main>
        <HeroSection />
        <RegionGrid />
        <MarketStats />
        
        {/* 官方原矿区 */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <span className="bg-[#1a4731] text-white px-2 py-1 rounded text-xs font-bold">OFFICIAL</span>
                <span className="text-2xl">🏛️</span>
                <h2 className="text-2xl font-bold text-gray-900">纯净一手官方原矿区</h2>
              </div>
              <a href="#" className="text-sm text-[#1a4731] hover:underline">进入原矿搜寻引擎 →</a>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockProperties.map((p) => <PropertyCard key={p.id} property={p} />)}
            </div>
          </div>
        </section>

        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <span className="bg-red-600 text-white px-2 py-1 rounded text-xs font-bold">VILLAGE DIRECT</span>
                <span className="text-2xl">🏛️</span>
                <h2 className="text-2xl font-bold text-gray-900">村集体直发专区</h2>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {mockVillageProjects.map((p) => <VillageDirectCard key={p.id} project={p} />)}
            </div>
          </div>
        </section>

        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <span className="bg-yellow-600 text-white px-2 py-1 rounded text-xs font-bold">BULK ROADSHOW</span>
                <span className="text-2xl">🎪</span>
                <h2 className="text-2xl font-bold text-gray-900">文旅大宗产业路演带</h2>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {mockBulkProjects.map((p) => <BulkProjectCard key={p.id} project={p} />)}
            </div>
          </div>
        </section>

        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <span className="bg-[#1a4731] text-white px-2 py-1 rounded text-xs font-bold">INFRASTRUCTURE</span>
                <span className="text-2xl">📡</span>
                <h2 className="text-2xl font-bold text-gray-900">数字化隐居基建硬指标</h2>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {mockInfraRatings.map((i) => <InfraRatingCard key={i.id} infra={i} />)}
            </div>
          </div>
        </section>

        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <span className="bg-[#1a4731] text-white px-2 py-1 rounded text-xs font-bold">BROKERS</span>
                <span className="text-2xl">🤝</span>
                <h2 className="text-2xl font-bold text-gray-900">本地金牌"农房合伙人"联播网</h2>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {mockBrokers.map((b) => <BrokerCard key={b.id} broker={b} />)}
            </div>
          </div>
        </section>

        <CTASection />
      </main>

      <Footer />
    </div>
  );
}

export const runtime = 'edge';
