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
          <div className="flex items-center gap-8">
            <div className="flex-shrink-0">
              <span className="text-2xl font-bold text-[#1a4731]">zjd.cn</span>
              <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">测试版 v9.0</span>
            </div>
            <div className="hidden md:flex items-center gap-6 text-sm text-gray-600">
              <a href="#" className="hover:text-[#1a4731]">🔥 热点寻源</a>
              <a href="#" className="hover:text-[#1a4731]">📊 流转大盘</a>
              <a href="#" className="hover:text-[#1a4731]">🔍 资产搜索</a>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a href="/" className="text-sm text-[#1a4731] hover:underline font-medium">← 返回旧版</a>
            <button className="bg-[#1a4731] hover:bg-[#2d5a45] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">微信安全登录</button>
          </div>
        </div>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500">
        <p>© 2026 绵阳网安科技有限公司 版权所有</p>
        <p className="mt-2">蜀ICP备16015085号-5 | 蜀公网安备 51070302000888号</p>
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