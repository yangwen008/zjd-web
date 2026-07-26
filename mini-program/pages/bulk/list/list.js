// pages/bulk/list/list.js — 大宗路演列表
const app = getApp()

Page({
  data: {
    items: [],
    leftCol: [],
    rightCol: [],
    loading: false,
    page: 1,
    noMore: false
  },

  onLoad() { this.loadItems(true) },

  async loadItems(reset) {
    if (this.data.loading) return
    if (reset) this.setData({ page: 1, noMore: false, items: [] })
    this.setData({ loading: true })
    try {
      const loc = app.globalData.location
      let url = '/api/bulk-projects?page=' + this.data.page + '&limit=10'
      if (loc.province) url += '&province=' + encodeURIComponent(loc.province)
      const res = await app.request({ url })
      if (res.success && res.data) {
        const newItems = res.data.map(item => ({
          ...item,
          firstImage: app.getFirstImage(item.images),
          code: item.code || 'ZJD-' + String(item.id).padStart(3, '0'),
          priceText: item.price_start ? '¥' + item.price_start + '万/年起' : '价格面议',
          areaText: item.area_sqm ? '约' + item.area_sqm + '㎡' : (item.area_mu ? '约' + Math.round(item.area_mu * 666.7) + '㎡' : ''),
          yieldText: item.yield_rate ? item.yield_rate + '%收益率' : ''
        }))
        const all = reset ? newItems : this.data.items.concat(newItems)
        const leftCol = [], rightCol = []
        all.forEach((item, i) => { if (i % 2 === 0) leftCol.push(item); else rightCol.push(item) })
        this.setData({ items: all, leftCol, rightCol, page: this.data.page + 1, noMore: newItems.length < 10 })
      }
    } catch (e) {}
    finally { this.setData({ loading: false }); wx.stopPullDownRefresh() }
  },

  goDetail(e) { wx.navigateTo({ url: '/pages/bulk/detail/detail?id=' + e.currentTarget.dataset.id }) },
  onPullDownRefresh() { this.loadItems(true) },
  onReachBottom() { if (!this.data.noMore) this.loadItems(false) }
})
