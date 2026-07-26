// pages/broker/detail/detail.js — 合伙人详情
const app = getApp()

Page({
  data: {
    broker: {},
    brokerAssets: [],
    peers: [],
    ratingLabel: '',
    goodRateText: '0%',
    specialtyList: []
  },

  onLoad(options) {
    this.brokerId = options.id
    this.loadBroker()
  },

  async loadBroker() {
    try {
      const res = await app.request({ url: '/api/brokers/' + this.brokerId })
      if (!res.success || !res.data) return
      const broker = res.data
      const ratingMap = { gold: '🥇 金牌合伙人', silver: '🥈 银牌合伙人', bronze: '🥉 铜牌合伙人' }

      let specialtyList = []
      try { if (broker.specialties) specialtyList = JSON.parse(broker.specialties) } catch (e) {}

      this.setData({
        broker,
        ratingLabel: ratingMap[broker.rating] || '合伙人',
        goodRateText: broker.good_rate ? Math.round(broker.good_rate * 100) + '%' : '0%',
        specialtyList
      })

      // 加载管辖资产
      this.loadBrokerAssets(broker)
      // 加载同城合伙人
      this.loadPeers(broker)
    } catch (e) {
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  async loadBrokerAssets(broker) {
    try {
      let url = '/api/assets?limit=10&sort=newest'
      if (broker.province) url += '&province=' + encodeURIComponent(broker.province)
      const res = await app.request({ url })
      if (res.success && res.data) {
        const assets = res.data.map(a => ({
          ...a,
          firstImage: app.getFirstImage(a.images),
          priceText: a.price_year ? '¥' + a.price_year + '万/年' : '价格面议',
          locationText: [a.city, a.district].filter(Boolean).join('·') || a.province || ''
        }))
        this.setData({ brokerAssets: assets })
      }
    } catch (e) {}
  },

  async loadPeers(broker) {
    try {
      let url = '/api/brokers?limit=4&sort=show_count'
      if (broker.province) url += '&province=' + encodeURIComponent(broker.province)
      const res = await app.request({ url })
      if (res.success && res.data) {
        const ratingMap = { gold: '🥇', silver: '🥈', bronze: '🥉' }
        const peers = res.data.filter(b => b.id !== broker.id).slice(0, 4).map(b => ({
          ...b,
          ratingLabel: ratingMap[b.rating] || '🤝'
        }))
        this.setData({ peers })
      }
    } catch (e) {}
  },

  goAsset(e) { wx.navigateTo({ url: '/pages/asset/detail?id=' + e.currentTarget.dataset.id }) },
  goPeer(e) { wx.redirectTo({ url: '/pages/broker/detail/detail?id=' + e.currentTarget.dataset.id }) },

  callBroker() {
    const phone = this.data.broker.phone_encrypted || this.data.broker.phone
    if (phone) {
      wx.makePhoneCall({ phoneNumber: phone })
    } else {
      wx.showToast({ title: '暂无联系方式', icon: 'none' })
    }
  }
})
