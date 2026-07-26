// pages/search/search.js — 看过/收藏页
const app = getApp()

Page({
  data: {
    activeTab: 'history',
    historyList: [],
    favList: [],
    loading: false
  },

  onShow() {
    // 设置 TabBar 选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ current: 1 })
    }
    this.loadData()
  },

  switchTab(e) {
    this.setData({ activeTab: e.currentTarget.dataset.tab })
    this.loadData()
  },

  async loadData() {
    this.setData({ loading: true })
    if (this.data.activeTab === 'history') {
      this.loadHistory()
    } else {
      this.loadFavorites()
    }
  },

  // 加载浏览历史（从本地缓存读取）
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

  // 加载收藏列表
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
    finally {
      this.setData({ loading: false })
    }
  },

  // 取消收藏
  async removeFav(e) {
    const assetId = e.currentTarget.dataset.id
    try {
      await app.request({
        url: '/api/dashboard/favorites',
        method: 'POST',
        data: { assetId }
      })
      this.setData({
        favList: this.data.favList.filter(f => f.asset_id !== assetId)
      })
      wx.showToast({ title: '已取消收藏', icon: 'none' })
    } catch (e) {}
  },

  goAsset(e) {
    wx.navigateTo({ url: '/pages/asset/detail?id=' + e.currentTarget.dataset.id })
  }
})
