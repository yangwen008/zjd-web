// pages/services/detail/detail.js — 服务商详情
const app = getApp()

Page({
  data: {
    prof: {},
    typeIcon: '👤',
    typeLabel: '',
    priceRange: '面议',
    serviceAreas: [],
    services: [],
    reviews: []
  },

  onLoad(options) {
    this.profId = options.id
    this.loadProf()
  },

  async loadProf() {
    try {
      const res = await app.request({ url: '/api/professionals/' + this.profId })
      if (!res.success || !res.data) return
      const prof = res.data
      const typeIcons = { notary: '📋', lawyer: '⚖️', fengshui: '🏔️' }
      const typeLabels = { notary: '公证处', lawyer: '律师', fengshui: '风水师' }

      let serviceAreas = []
      try { if (prof.service_areas) serviceAreas = JSON.parse(prof.service_areas) } catch (e) {}

      let services = []
      try { if (prof.services) services = JSON.parse(prof.services) } catch (e) {}

      const reviews = (res.reviews || []).map(r => ({
        ...r,
        stars: '⭐'.repeat(r.review_rating || 5),
        timeText: (r.created_at || '').slice(0, 10)
      }))

      this.setData({
        prof,
        typeIcon: typeIcons[prof.prof_type] || '👤',
        typeLabel: typeLabels[prof.prof_type] || '',
        priceRange: prof.price_min && prof.price_max ? '¥' + prof.price_min + '-' + prof.price_max : '面议',
        serviceAreas,
        services,
        reviews
      })
    } catch (e) {
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  bookService(e) {
    const name = e.currentTarget.dataset.name
    const price = e.currentTarget.dataset.price
    this.doBook(name, price)
  },

  bookFirstService() {
    const s = this.data.services[0]
    if (s) this.doBook(s.name, s.price)
    else this.doBook('咨询', '')
  },

  doBook(serviceName, price) {
    if (!app.globalData.token) { wx.navigateTo({ url: '/pages/login/index' }); return }
    wx.showModal({
      title: '预约 ' + serviceName,
      content: price ? '价格：' + price + '\n提交后服务商将尽快联系您' : '提交后服务商将尽快联系您',
      success: async (res) => {
        if (res.confirm) {
          try {
            await app.request({
              url: '/api/professionals/order',
              method: 'POST',
              data: { professional_id: parseInt(this.profId), service_name: serviceName }
            })
            wx.showToast({ title: '预约成功', icon: 'success' })
          } catch (e) {}
        }
      }
    })
  }
})
