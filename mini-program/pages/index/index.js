// pages/index/index.js
const app = getApp()

Page({
  data: {
    locationText: '定位中...',
    assetTypes: [
      { type: '宅基地', icon: '🏠', label: '宅基地', bg: '#e8f5e9' },
      { type: '林地', icon: '🌾', label: '林地', bg: '#fff3e0' },
      { type: '厂房', icon: '🏭', label: '厂房', bg: '#e3f2fd' },
      { type: '茶园', icon: '🌿', label: '茶园', bg: '#f1f8e9' },
      { type: '古宅', icon: '🏡', label: '古宅', bg: '#fce4ec' },
      { type: '种植', icon: '🌱', label: '种植', bg: '#e0f7fa' }
    ],
    serviceEntries: [
      { path: '/pages/services/index', icon: '🛡️', label: '服务', bg: '#ede7f6' },
      { path: '/pages/broker/list', icon: '🤝', label: '合伙人', bg: '#e8eaf6' },
      { path: '/pages/bulk/list', icon: '🏢', label: '大宗', bg: '#fff8e1' },
      { path: '/pages/region/index', icon: '🔥', label: '热门', bg: '#fbe9e7' }
    ],
    featuredAssets: [],
    assets: [],
    loading: false,
    noMore: false,
    page: 1
  },

  onShow() {
    // 设置 TabBar 选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ current: 0 })
    }
    // 更新定位
    this.updateLocation()
  },

  onLoad() {
    this.loadFeatured()
    this.loadAssets(true)
  },

  updateLocation() {
    const loc = app.globalData.location
    if (loc.city) {
      const province = loc.province.replace(/省|市/g, '')
      const city = loc.city.replace(/市/g, '')
      this.setData({ locationText: province + '·' + city })
    } else if (loc.province) {
      this.setData({ locationText: loc.province.replace(/省|市/g, '') })
    }
  },

  async loadFeatured() {
    try {
      const res = await app.request({ url: '/api/assets?featured=true&limit=5&sort=views' })
      if (res.success && res.data) {
        const featured = res.data.map(item => ({
          ...item,
          firstImage: this.getFirstImage(item.images),
          priceText: item.price_year ? '¥' + item.price_year + '万/年' : '价格面议'
        }))
        this.setData({ featuredAssets: featured })
      }
    } catch (e) {}
  },

  async loadAssets(reset) {
    if (this.data.loading) return
    if (reset) {
      this.setData({ page: 1, noMore: false, assets: [] })
    }
    this.setData({ loading: true })
    try {
      const loc = app.globalData.location
      let url = '/api/assets?page=' + this.data.page + '&limit=10&sort=views'
      if (loc.province) url += '&province=' + encodeURIComponent(loc.province)
      const res = await app.request({ url })
      if (res.success && res.data) {
        const newAssets = res.data.map(item => ({
          ...item,
          firstImage: this.getFirstImage(item.images),
          priceText: item.price_year ? '¥' + item.price_year + '万/年' : '价格面议',
          areaText: item.area_mu ? item.area_mu + '亩' : '-',
          locationText: [item.city, item.district].filter(Boolean).join('·') || item.province || '全国',
          badge: this.getBadge(item),
          badgeClass: this.getBadgeClass(item)
        }))
        const assets = reset ? newAssets : this.data.assets.concat(newAssets)
        this.setData({
          assets,
          page: this.data.page + 1,
          noMore: newAssets.length < 10
        })
      }
    } catch (e) {}
    finally {
      this.setData({ loading: false })
      wx.stopPullDownRefresh()
    }
  },

  getFirstImage(imagesJson) {
    if (!imagesJson) return '/static/logo.png'
    try {
      const arr = JSON.parse(imagesJson)
      if (Array.isArray(arr) && arr.length > 0) {
        const first = arr[0]
        return (typeof first === 'object' ? (first.thumb || first.url) : first) || '/static/logo.png'
      }
    } catch (e) {}
    return '/static/logo.png'
  },

  getBadge(item) {
    if (item.source_site) return '第三方'
    if (item.publisher_role === 'project_publisher') return '交易所'
    if (item.source_type === 'official') return '官方'
    if (item.source_type === 'village') return '村委'
    return '个人'
  },

  getBadgeClass(item) {
    const badge = this.getBadge(item)
    const map = { '官方': 'badge-official', '村委': 'badge-village', '交易所': 'badge-exchange', '第三方': 'badge-third' }
    return map[badge] || 'badge-personal'
  },

  goSearch() {
    wx.switchTab({ url: '/pages/search/index' })
  },

  goFilter(e) {
    const type = e.currentTarget.dataset.type
    wx.navigateTo({ url: '/pages/search/index?type=' + encodeURIComponent(type) })
  },

  goPage(e) {
    const url = e.currentTarget.dataset.url
    wx.navigateTo({ url })
  },

  goAsset(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/asset/detail?id=' + id })
  },

  chooseCity() {
    wx.showToast({ title: '城市切换开发中', icon: 'none' })
  },

  onPullDownRefresh() {
    this.loadAssets(true)
  },

  onReachBottom() {
    if (!this.data.noMore) this.loadAssets(false)
  }
})
