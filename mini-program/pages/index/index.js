// pages/index/index.js — 首页（美团风格双列瀑布流）
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
      { path: '/pages/services/index/index', icon: '🛡️', label: '服务', bg: '#ede7f6' },
      { path: '/pages/broker/list', icon: '🤝', label: '合伙人', bg: '#e8eaf6' },
      { path: '/pages/bulk/list', icon: '🏢', label: '大宗', bg: '#fff8e1' },
      { path: '/pages/region/index', icon: '🔥', label: '热门', bg: '#fbe9e7' }
    ],
    featuredAssets: [],
    assets: [],
    leftCol: [],
    rightCol: [],
    loading: false,
    noMore: false,
    page: 1
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ current: 0 })
    }
    const loc = app.globalData.location
    if (loc.province && loc.province !== this._lastProvince) {
      this._lastProvince = loc.province
      this.updateLocation()
      this.loadFeatured()
      this.loadAssets(true)
    }
  },

  onLoad() {
    this.loadDataWithLocation()
  },

  loadDataWithLocation() {
    const check = () => {
      const loc = app.globalData.location
      if (loc.province) {
        this.updateLocation()
        this.loadFeatured()
        this.loadAssets(true)
      } else {
        if (!this._locWait) this._locWait = 0
        this._locWait += 100
        if (this._locWait < 3000) {
          setTimeout(check, 100)
        } else {
          this.loadFeatured()
          this.loadAssets(true)
        }
      }
    }
    check()
  },

  updateLocation() {
    const loc = app.globalData.location
    if (loc.city) {
      this.setData({ locationText: loc.province.replace(/省|市/g, '') + '·' + loc.city.replace(/市/g, '') })
    } else if (loc.province) {
      this.setData({ locationText: loc.province.replace(/省|市/g, '') })
    }
  },

  async loadFeatured() {
    try {
      const loc = app.globalData.location
      let url = '/api/assets?featured=true&limit=5&sort=views'
      if (loc.province) url += '&province=' + encodeURIComponent(loc.province)
      const res = await app.request({ url })
      if (res.success && res.data) {
        const featured = res.data.map(item => ({
          ...item,
          title: item.title || '未命名资产',
          firstImage: this.getFirstImage(item.images),
          priceText: item.price_year ? '¥' + item.price_year + '万/年起' : '价格面议'
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
        const newAssets = res.data.map(item => {
          const loc = app.globalData.location
          let distanceText = ''
          if (item.gps_lat && item.gps_lng && loc.latitude) {
            const km = this.calcDistance(loc.latitude, loc.longitude, item.gps_lat, item.gps_lng)
            distanceText = km < 1 ? Math.round(km * 1000) + 'm' : km.toFixed(1) + 'km'
          }
          const views = item.views || 0
          const viewsText = views >= 10000 ? (views / 10000).toFixed(1) + 'w' : views >= 1000 ? (views / 1000).toFixed(1) + 'k' : views > 0 ? views + '' : ''
          return {
            ...item,
            title: item.title || '未命名资产',
            descText: item.description ? item.description.replace(/<[^>]*>/g, '').substring(0, 30) : '',
            firstImage: this.getFirstImage(item.images),
            priceText: item.price_year ? '¥' + item.price_year + '万/年起' : '价格面议',
            areaText: item.area_mu ? item.area_mu + '亩' : '-',
            locationText: [item.city, item.district].filter(Boolean).join('·') || item.province || '全国',
            badge: this.getBadge(item),
            distanceText,
            viewsText
          }
        })
        const allAssets = reset ? newAssets : this.data.assets.concat(newAssets)
        // 分左右两列
        const leftCol = []
        const rightCol = []
        allAssets.forEach((item, i) => {
          if (i % 2 === 0) leftCol.push(item)
          else rightCol.push(item)
        })
        this.setData({
          assets: allAssets,
          leftCol,
          rightCol,
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

  calcDistance(lat1, lng1, lat2, lng2) {
    const R = 6371
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2)
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  },

  getFirstImage(imagesJson) {
    if (!imagesJson) return '/static/logo.png'
    try {
      const arr = JSON.parse(imagesJson)
      if (Array.isArray(arr) && arr.length > 0) {
        const first = arr[0]
        let url = (typeof first === 'object' ? (first.thumb || first.url) : first) || ''
        if (!url) return '/static/logo.png'
        // R2 路径需要加代理前缀
        if (url.startsWith('/api/images/') || url.startsWith('api/images/')) {
          return 'https://z.zjd.cn' + (url.startsWith('/') ? '' : '/') + url
        }
        // 已经是完整URL
        if (url.startsWith('http')) return url
        // 其他相对路径
        return 'https://z.zjd.cn' + (url.startsWith('/') ? '' : '/') + url
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

  goSearch() { wx.switchTab({ url: '/pages/search/index' }) },
  goFilter(e) { wx.navigateTo({ url: '/pages/search/search?type=' + encodeURIComponent(e.currentTarget.dataset.type) }) },
  goPage(e) { wx.navigateTo({ url: e.currentTarget.dataset.url }) },
  goAsset(e) { wx.navigateTo({ url: '/pages/asset/detail?id=' + e.currentTarget.dataset.id }) },
  chooseCity() { wx.showToast({ title: '城市切换开发中', icon: 'none' }) },
  onPullDownRefresh() { this.loadAssets(true) },
  onReachBottom() { if (!this.data.noMore) this.loadAssets(false) }
})
