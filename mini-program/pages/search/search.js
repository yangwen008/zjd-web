// pages/search/search.js — 搜索 + 看过/收藏 + 资产筛选
const app = getApp()

Page({
  data: {
    // 搜索模式
    searchMode: false,
    searchKeyword: '',
    searchAssets: [],
    autoFocus: false,

    // 筛选模式
    filterMode: false,
    filterTitle: '',
    filterType: '',
    filterSource: '',
    sort: 'views',
    filterAssets: [],
    leftCol: [],
    rightCol: [],
    page: 1,
    noMore: false,

    // 看过/收藏模式
    activeTab: 'history',
    historyList: [],
    favList: [],

    loading: false
  },

  onLoad(options) {
    // 判断是筛选模式还是默认模式
    if (options.type || options.source) {
      this.setData({
        filterMode: true,
        filterType: options.type || '',
        filterSource: options.source || '',
        filterTitle: this.getTitle(options.type, options.source)
      })
      this.loadFilterAssets(true)
    }
    // 从首页跳过来带搜索关键词
    if (options.q) {
      this.setData({ searchKeyword: options.q, searchMode: true, autoFocus: false })
      this.loadSearchAssets(true)
    }
  },

  // ===== 搜索模式 =====
  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value })
  },

  doSearch() {
    const keyword = this.data.searchKeyword.trim()
    if (!keyword) {
      this.setData({ searchMode: false, searchAssets: [], leftCol: [], rightCol: [] })
      return
    }
    this.setData({ searchMode: true, filterMode: false })
    this.loadSearchAssets(true)
  },

  clearSearch() {
    this.setData({ searchKeyword: '', searchMode: false, searchAssets: [], leftCol: [], rightCol: [] })
  },

  async loadSearchAssets(reset) {
    if (this.data.loading) return
    if (reset) this.setData({ page: 1, noMore: false, searchAssets: [] })
    this.setData({ loading: true })
    try {
      const loc = app.globalData.location
      let url = '/api/assets?page=' + this.data.page + '&limit=10&sort=' + this.data.sort
      url += '&search=' + encodeURIComponent(this.data.searchKeyword)
      if (loc.province) url += '&province=' + encodeURIComponent(loc.province)
      const res = await app.request({ url })
      if (res.success && res.data) {
        const newAssets = res.data.map(item => {
          let distanceText = ''
          if (item.gps_lat && item.gps_lng && loc.latitude) {
            const km = this.calcDistance(loc.latitude, loc.longitude, item.gps_lat, item.gps_lng)
            distanceText = km < 1 ? Math.round(km * 1000) + 'm' : km.toFixed(1) + 'km'
          }
          return {
            ...item,
            title: item.title || '未命名资产',
            firstImage: app.getFirstImage(item.images),
            priceText: item.price_year ? '¥' + item.price_year + '万/年起' : '价格面议',
            badge: this.getBadge(item),
            distanceText
          }
        })
        const all = reset ? newAssets : this.data.searchAssets.concat(newAssets)
        const leftCol = [], rightCol = []
        all.forEach((item, i) => { if (i % 2 === 0) leftCol.push(item); else rightCol.push(item) })
        this.setData({ searchAssets: all, leftCol, rightCol, page: this.data.page + 1, noMore: newAssets.length < 10 })
      }
    } catch (e) {}
    finally { this.setData({ loading: false }); wx.stopPullDownRefresh() }
  },

  getTitle(type, source) {
    if (type) {
      const map = { '宅基地': '🏠 宅基地', '林地': '🌾 林地', '厂房': '🏭 厂房', '茶园': '🌿 茶园', '古宅': '🏡 古宅', '种植': '🌱 种植', '集体建设用地': '🏗️ 集体建设用地', '国有建设用地': '🏛️ 国有建设用地', '集体经营性建设用地': '🏭 经营性用地', '养殖用地': '🐟 养殖', '荒山': '⛰️ 荒山', '水域': '🌊 水域' }
      return map[type] || type
    }
    if (source) {
      const map = { 'official': '⚖️ 官方资产', 'village': '🏛️ 村委资产', 'ugc': '👤 个人资产' }
      return map[source] || '资产列表'
    }
    return '资产列表'
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ current: 1 })
    }
    // 检查全局筛选参数（从金刚区跳转过来）
    const filterType = app.globalData._filterType
    const filterSource = app.globalData._filterSource
    if (filterType || filterSource) {
      app.globalData._filterType = ''
      app.globalData._filterSource = ''
      this.setData({
        filterMode: true,
        filterType: filterType || '',
        filterSource: filterSource || '',
        filterTitle: this.getTitle(filterType, filterSource)
      })
      this.loadFilterAssets(true)
    } else if (!this.data.filterMode) {
      this.setData({ filterMode: false })
      this.loadData()
    }
  },

  // ===== 筛选模式 =====
  async loadFilterAssets(reset) {
    if (this.data.loading) return
    if (reset) this.setData({ page: 1, noMore: false, filterAssets: [] })
    this.setData({ loading: true })
    try {
      const loc = app.globalData.location
      let url = '/api/assets?page=' + this.data.page + '&limit=10&sort=' + this.data.sort
      if (this.data.filterType) url += '&asset_type=' + encodeURIComponent(this.data.filterType)
      if (this.data.filterSource) url += '&source=' + encodeURIComponent(this.data.filterSource)
      if (loc.province) url += '&province=' + encodeURIComponent(loc.province)
      const res = await app.request({ url })
      if (res.success && res.data) {
        const newAssets = res.data.map(item => {
          let distanceText = ''
          if (item.gps_lat && item.gps_lng && loc.latitude) {
            const km = this.calcDistance(loc.latitude, loc.longitude, item.gps_lat, item.gps_lng)
            distanceText = km < 1 ? Math.round(km * 1000) + 'm' : km.toFixed(1) + 'km'
          }
          return {
            ...item,
            title: item.title || '未命名资产',
            firstImage: app.getFirstImage(item.images),
            priceText: item.price_year ? '¥' + item.price_year + '万/年起' : '价格面议',
            badge: this.getBadge(item),
            distanceText
          }
        })
        const all = reset ? newAssets : this.data.filterAssets.concat(newAssets)
        const leftCol = [], rightCol = []
        all.forEach((item, i) => { if (i % 2 === 0) leftCol.push(item); else rightCol.push(item) })
        this.setData({ filterAssets: all, leftCol, rightCol, page: this.data.page + 1, noMore: newAssets.length < 10 })
      }
    } catch (e) {}
    finally { this.setData({ loading: false }); wx.stopPullDownRefresh() }
  },

  changeSort(e) {
    this.setData({ sort: e.currentTarget.dataset.sort })
    if (this.data.searchMode) {
      this.loadSearchAssets(true)
    } else if (this.data.filterMode) {
      this.loadFilterAssets(true)
    }
  },

  // ===== 看过/收藏模式 =====
  switchTab(e) {
    this.setData({ activeTab: e.currentTarget.dataset.tab })
    this.loadData()
  },

  loadData() {
    this.setData({ loading: true })
    if (this.data.activeTab === 'history') this.loadHistory()
    else this.loadFavorites()
  },

  loadHistory() {
    const history = wx.getStorageSync('viewHistory') || []
    const list = history.map(item => ({
      ...item,
      firstImage: app.getFirstImage(item.images),
      priceText: item.price_year ? '¥' + item.price_year + '万/年起' : '价格面议',
      locationText: [item.city, item.district].filter(Boolean).join('·') || item.province || ''
    }))
    this.setData({ historyList: list, loading: false })
  },

  async loadFavorites() {
    try {
      const res = await app.request({ url: '/api/dashboard/favorites' })
      if (res.success && res.data) {
        const list = res.data.map(item => ({
          ...item,
          firstImage: app.getFirstImage(item.images),
          priceText: item.price_year ? '¥' + item.price_year + '万/年起' : '价格面议',
          locationText: item.asset_province || ''
        }))
        this.setData({ favList: list })
      }
    } catch (e) {}
    finally { this.setData({ loading: false }) }
  },

  async removeFav(e) {
    const assetId = e.currentTarget.dataset.id
    try {
      await app.request({ url: '/api/dashboard/favorites', method: 'POST', data: { assetId } })
      this.setData({ favList: this.data.favList.filter(f => f.asset_id !== assetId) })
      wx.showToast({ title: '已取消收藏', icon: 'none' })
    } catch (e) {}
  },

  // ===== 通用 =====

  getBadge(item) {
    if (item.source_site) return '第三方'
    if (item.publisher_role === 'project_publisher') return '交易所'
    if (item.source_type === 'official') return '官方'
    if (item.source_type === 'village') return '村委'
    return '个人'
  },

  calcDistance(lat1, lng1, lat2, lng2) {
    const R = 6371, dLat = (lat2-lat1)*Math.PI/180, dLng = (lng2-lng1)*Math.PI/180
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  },

  goAsset(e) { wx.navigateTo({ url: '/pages/asset/detail?id=' + e.currentTarget.dataset.id }) },
  goBack() {
    // 金刚区进入的列表页，返回首页
    wx.switchTab({ url: '/pages/index/index' })
  },
  onPullDownRefresh() {
    if (this.data.searchMode) this.loadSearchAssets(true)
    else if (this.data.filterMode) this.loadFilterAssets(true)
    else wx.stopPullDownRefresh()
  },
  onReachBottom() {
    if (this.data.searchMode && !this.data.noMore) this.loadSearchAssets(false)
    else if (this.data.filterMode && !this.data.noMore) this.loadFilterAssets(false)
  }
})
