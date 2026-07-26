// pages/index/index.js — 首页（美团风格双列瀑布流）
const app = getApp()

Page({
  data: {
    locationText: '定位中...',
    assetTypes: [
      { type: '林地', icon: '🌾', label: '林地', bg: '#fff3e0' },
      { type: '茶园', icon: '🌿', label: '茶园', bg: '#f1f8e9' },
      { type: '古宅', icon: '🏡', label: '古宅', bg: '#fce4ec' },
      { type: '种植', icon: '🌱', label: '种植', bg: '#e0f7fa' },
      { type: '集体建设用地', icon: '🏗️', label: '集体建设', bg: '#fff3e0' },
      { type: '国有建设用地', icon: '🏛️', label: '国有建设', bg: '#e8eaf6' },
      { type: '集体经营性建设用地', icon: '🏭', label: '经营性', bg: '#fff8e1' },
      { type: '养殖用地', icon: '🐟', label: '养殖', bg: '#e0f7fa' },
      { type: '荒山', icon: '⛰️', label: '荒山', bg: '#efebe9' },
      { type: '水域', icon: '🌊', label: '水域', bg: '#e3f2fd' },
      { type: '厂房', icon: '🏭', label: '厂房', bg: '#e3f2fd' },
      { type: '宅基地', icon: '🏠', label: '宅基地', bg: '#e8f5e9' }
    ],
    serviceEntries: [
      { path: '/pages/services/index/index', icon: '🛡️', label: '服务', bg: '#ede7f6' },
      { path: '/pages/broker/list/list', icon: '🤝', label: '合伙人', bg: '#e8eaf6' },
      { path: '/pages/bulk/list/list', icon: '🏢', label: '大宗', bg: '#fff8e1' },
      { path: '/pages/region/region', icon: '🔥', label: '热门', bg: '#fbe9e7' }
    ],
    assets: [],
    leftCol: [],
    rightCol: [],
    loading: false,
    noMore: false,
    page: 1,
    showCityPicker: false,
    provinces: [],
    selectedCity: '',
    cities: []
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ current: 0 })
    }
    const loc = app.globalData.location
    if (loc.province && loc.province !== this._lastProvince) {
      this._lastProvince = loc.province
      this.updateLocation()
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
        this.loadAssets(true)
      } else {
        if (!this._locWait) this._locWait = 0
        this._locWait += 100
        if (this._locWait < 3000) {
          setTimeout(check, 100)
        } else {
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
            transferLabel: this.getTransferLabel(item.transfer_type),
            transferColor: this.getTransferColor(item.transfer_type),
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

  getTransferLabel(type) {
    const map = { lease: '租赁', transfer: '转让', grant: '出让', cooperation: '合作', equity: '入股' }
    return map[type] || ''
  },

  getTransferColor(type) {
    const map = { lease: '#2e7d32', transfer: '#1565c0', grant: '#e65100', cooperation: '#7b1fa2', equity: '#c62828' }
    return map[type] || ''
  },

  goSearch() { wx.switchTab({ url: '/pages/search/search' }) },
  goFilter(e) {
    // tabBar页面不能用navigateTo，用全局变量+switchTab
    app.globalData._filterType = e.currentTarget.dataset.type
    app.globalData._filterSource = ''
    wx.switchTab({ url: '/pages/search/search' })
  },
  goPage(e) { wx.navigateTo({ url: e.currentTarget.dataset.url }) },
  goAsset(e) { wx.navigateTo({ url: '/pages/asset/detail?id=' + e.currentTarget.dataset.id }) },
  // 城市切换
  chooseCity() {
    this.setData({ showCityPicker: true })
    if (this.data.provinces.length === 0) this.loadProvinces()
  },

  closeCityPicker() {
    this.setData({ showCityPicker: false })
  },

  async loadProvinces() {
    try {
      const res = await app.request({ url: '/api/regions?level=province' })
      if (res.success && res.data) {
        this.setData({ provinces: res.data })
      }
    } catch (e) {}
  },

  async selectProvince(e) {
    const province = e.currentTarget.dataset.name
    // 更新全局定位
    app.globalData.location.province = province
    app.globalData.location.city = ''
    this.updateLocation()
    this.setData({ showCityPicker: false })
    this.loadAssets(true)
  },

  selectCity(e) {
    const city = e.currentTarget.dataset.name
    if (!city) {
      // 点击「← 返回省份」，回到省份列表
      this.setData({ selectedCity: '' })
      return
    }
    app.globalData.location.city = city
    this.updateLocation()
    this.setData({ showCityPicker: false, selectedCity: '' })
    this.loadAssets(true)
  },

  async showCities(e) {
    const province = e.currentTarget.dataset.name
    try {
      const res = await app.request({ url: '/api/regions?level=city&province=' + encodeURIComponent(province) })
      if (res.success && res.data) {
        this.setData({ selectedCity: province, cities: res.data })
      }
    } catch (e) {}
  },
  onPullDownRefresh() { this.loadAssets(true) },
  onReachBottom() { if (!this.data.noMore) this.loadAssets(false) },
  noop() {} // 阻止城市选择器点击穿透
})
