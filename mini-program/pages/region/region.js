// pages/region/region.js — 热点寻源
const app = getApp()

Page({
  data: {
    provinces: [],
    selectedProvince: '',
    assets: [],
    leftCol: [],
    rightCol: [],
    loadingAssets: false
  },

  onLoad() { this.loadProvinces() },

  async loadProvinces() {
    try {
      const res = await app.request({ url: '/api/regions?level=province' })
      if (res.success && res.data) {
        const provinces = res.data.map(p => ({
          name: p.name,
          emoji: p.emoji || '📍',
          count: 0,
          active: false
        }))
        this.setData({ provinces })
        // 加载各省资产数量
        this.loadProvinceCounts()
      }
    } catch (e) {}
  },

  async loadProvinceCounts() {
    try {
      const res = await app.request({ url: '/api/assets?limit=1' })
      // 简化：用已有数据估算
    } catch (e) {}
  },

  async selectProvince(e) {
    const name = e.currentTarget.dataset.name
    const provinces = this.data.provinces.map(p => ({ ...p, active: p.name === name }))
    this.setData({ provinces, selectedProvince: name, assets: [], leftCol: [], rightCol: [] })
    this.loadAssets(name)
  },

  async loadAssets(province) {
    this.setData({ loadingAssets: true })
    try {
      const res = await app.request({ url: '/api/assets?province=' + encodeURIComponent(province) + '&limit=10&sort=views' })
      if (res.success && res.data) {
        const assets = res.data.map(item => ({
          ...item,
          firstImage: app.getFirstImage(item.images),
          priceText: item.price_year ? '¥' + item.price_year + '万/年起' : '价格面议'
        }))
        const leftCol = [], rightCol = []
        assets.forEach((item, i) => { if (i % 2 === 0) leftCol.push(item); else rightCol.push(item) })
        this.setData({ assets, leftCol, rightCol })
      }
    } catch (e) {}
    finally { this.setData({ loadingAssets: false }) }
  },

  goAsset(e) { wx.navigateTo({ url: '/pages/asset/detail?id=' + e.currentTarget.dataset.id }) },
  goSearch() { wx.switchTab({ url: '/pages/search/search' }) }
})
