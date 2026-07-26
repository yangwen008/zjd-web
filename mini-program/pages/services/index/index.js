// pages/services/index/index.js — 服务中心
const app = getApp()

Page({
  data: {
    items: [],
    leftCol: [],
    rightCol: [],
    loading: false,
    activeType: '',
    page: 1,
    noMore: false
  },

  onLoad() { this.loadItems(true) },

  async loadItems(reset) {
    if (this.data.loading) return
    if (reset) this.setData({ page: 1, noMore: false, items: [] })
    this.setData({ loading: true })
    try {
      let url = '/api/professionals?page=' + this.data.page + '&limit=10'
      if (this.data.activeType) url += '&type=' + this.data.activeType
      const res = await app.request({ url })
      if (res.success && res.data) {
        const typeIcons = { notary: '📋', lawyer: '⚖️', fengshui: '🏔️' }
        const newItems = res.data.map(item => ({
          ...item,
          typeIcon: typeIcons[item.prof_type] || '👤',
          bioText: (item.bio || '').substring(0, 40),
          serviceNames: this.parseServices(item.services),
          priceText: item.price_min && item.price_max ? '¥' + item.price_min + '-' + item.price_max : '面议'
        }))
        const all = reset ? newItems : this.data.items.concat(newItems)
        const leftCol = [], rightCol = []
        all.forEach((item, i) => { if (i % 2 === 0) leftCol.push(item); else rightCol.push(item) })
        this.setData({ items: all, leftCol, rightCol, page: this.data.page + 1, noMore: newItems.length < 10 })
      }
    } catch (e) {}
    finally { this.setData({ loading: false }); wx.stopPullDownRefresh() }
  },

  parseServices(json) {
    if (!json) return []
    try {
      const arr = JSON.parse(json)
      return Array.isArray(arr) ? arr.slice(0, 3).map(s => s.name) : []
    } catch { return [] }
  },

  switchType(e) {
    this.setData({ activeType: e.currentTarget.dataset.type })
    this.loadItems(true)
  },

  goDetail(e) { wx.navigateTo({ url: '/pages/services/detail/detail?id=' + e.currentTarget.dataset.id }) },
  onPullDownRefresh() { this.loadItems(true) },
  onReachBottom() { if (!this.data.noMore) this.loadItems(false) }
})
