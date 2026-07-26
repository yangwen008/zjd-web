// pages/region/region.js — 热点寻源（默认按浏览量排序）
const app = getApp()

Page({
  data: {
    provinces: [],
    showProvinceFilter: false,
    selectedProvince: '',
    assets: [],
    leftCol: [],
    rightCol: [],
    loading: false,
    noMore: false,
    page: 1,
    sort: 'views'
  },

  onLoad() {
    this.loadAssets(true)
    this.loadProvinces()
  },

  onShow() {},
  noop() {}, // 阻止省份选择器点击穿透

  async loadProvinces() {
    try {
      const res = await app.request({ url: '/api/regions?level=province' })
      if (res.success && res.data) {
        this.setData({ provinces: res.data.map(p => ({ name: p.name, emoji: p.emoji || '📍' })) })
      }
    } catch (e) {}
  },

  toggleProvinceFilter() {
    this.setData({ showProvinceFilter: !this.data.showProvinceFilter })
  },

  selectProvince(e) {
    const name = e.currentTarget.dataset.name
    // 点击已选中的省份 = 取消筛选
    const newProvince = this.data.selectedProvince === name ? '' : name
    this.setData({
      selectedProvince: newProvince,
      showProvinceFilter: false
    })
    this.loadAssets(true)
  },

  clearProvince() {
    this.setData({ selectedProvince: '' })
    this.loadAssets(true)
  },

  changeSort(e) {
    this.setData({ sort: e.currentTarget.dataset.sort })
    this.loadAssets(true)
  },

  async loadAssets(reset) {
    if (this.data.loading) return
    if (reset) this.setData({ page: 1, noMore: false, assets: [] })
    this.setData({ loading: true })
    try {
      let url = '/api/assets?page=' + this.data.page + '&limit=10&sort=' + this.data.sort
      if (this.data.selectedProvince) url += '&province=' + encodeURIComponent(this.data.selectedProvince)
      const res = await app.request({ url })
      if (res.success && res.data) {
        const newAssets = res.data.map(item => ({
          ...item,
          firstImage: app.getFirstImage(item.images),
          priceText: item.price_year ? '¥' + item.price_year + '万/年起' : '价格面议',
          badge: this.getBadge(item)
        }))
        const all = reset ? newAssets : this.data.assets.concat(newAssets)
        const leftCol = [], rightCol = []
        all.forEach((item, i) => { if (i % 2 === 0) leftCol.push(item); else rightCol.push(item) })
        this.setData({ assets: all, leftCol, rightCol, page: this.data.page + 1, noMore: newAssets.length < 10 })
      }
    } catch (e) {}
    finally { this.setData({ loading: false }); wx.stopPullDownRefresh() }
  },

  getBadge(item) {
    if (item.source_site) return '第三方'
    if (item.publisher_role === 'project_publisher') return '交易所'
    if (item.source_type === 'official') return '官方'
    if (item.source_type === 'village') return '村委'
    return '个人'
  },

  goAsset(e) { wx.navigateTo({ url: '/pages/asset/detail?id=' + e.currentTarget.dataset.id }) },
  goSearch() { wx.switchTab({ url: '/pages/search/search' }) },
  onPullDownRefresh() { this.loadAssets(true) },
  onReachBottom() { if (!this.data.noMore) this.loadAssets(false) }
})
