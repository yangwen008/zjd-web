export default function CTASection() {
  return (
    <section className="py-20 bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <div className="bg-yellow-600 text-white px-3 py-1 rounded text-xs font-bold inline-block mb-4">DATA ACCESS CONTROL</div>
        <h2 className="text-4xl font-bold mb-4">全网唯一提供官方原始经办权解锁终端</h2>
        <p className="text-gray-400 mb-8 max-w-2xl mx-auto">为保护数据资产主权，系统执行了动态高斯防护混淆。资产详情全免费，绑定微信即可一键安全消除真实产权透视。</p>
        <button className="bg-yellow-600 hover:bg-yellow-700 text-white px-8 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 mx-auto">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/></svg>
          微信一键安全授权
        </button>
      </div>
    </section>
  );
}