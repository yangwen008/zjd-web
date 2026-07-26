// pages/profile/profile.js — 我的页
const app = getApp()

Page({
  data: {
    user: null,
    isLoggedIn: false,
    roleLabel: '普通用户',
    stats: { assets: 0, favorites: 0, appointments: 0, leads: 0 }
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ current: 3 })
    }
    this.refreshUser()
  },

  refreshUser() {
    const user = app.globalData.user
    const token = app.globalData.token
    if (user && token) {
      const roleMap = {
        'user': '普通用户', 'broker': '合伙人', 'village_org': '村集体',
        'project_publisher': '项目发布者', 'notary': '公证处', 'lawyer': '律师',
        'fengshui': '风水师', 'admin': '平台运营', 'superadmin': '超级管理员'
      }
      const roleTips = {
        'broker': ' · 您可以发布房源、查看客户线索',
        'village_org': ' · 您可以发布村委直发资产、查看线索',
        'project_publisher': ' · 您可以发布大宗路演项目',
        'notary': ' · 您可以在交易服务中心展示公证服务',
        'lawyer': ' · 您可以在交易服务中心展示法律服务',
        'fengshui': ' · 您可以在交易服务中心展示风水勘察服务'
      }
      this.setData({
        user,
        isLoggedIn: true,
        roleLabel: roleMap[user.role] || '普通用户',
        roleTip: roleTips[user.role] || ''
      })
      this.loadStats()
    } else {
      this.setData({ user: null, isLoggedIn: false })
    }
  },

  async loadStats() {
    try {
      const res = await app.request({ url: '/api/dashboard/stats' })
      if (res.success && res.data) {
        this.setData({ stats: res.data })
      }
    } catch (e) {}
  },

  goLogin() {
    wx.navigateTo({ url: '/pages/login/index' })
  },

  goSettings() {
    wx.showToast({ title: '设置页开发中', icon: 'none' })
  },

  goMyAssets() {
    wx.navigateTo({ url: '/pages/asset/asset' })
  },

  goPage(e) {
    const url = e.currentTarget.dataset.url
    wx.navigateTo({ url })
  },

  goMessages() {
    wx.switchTab({ url: '/pages/messages/messages' })
  },

  goFavorites() {
    wx.switchTab({ url: '/pages/search/search' })
  },

  logout() {
    wx.showModal({
      title: '确认退出',
      content: '退出后需要重新登录',
      success: (res) => {
        if (res.confirm) {
          app.globalData.token = ''
          app.globalData.user = null
          wx.removeStorageSync('token')
          wx.removeStorageSync('user')
          this.setData({ user: null, isLoggedIn: false, stats: { assets: 0, favorites: 0, appointments: 0, leads: 0 } })
          wx.showToast({ title: '已退出', icon: 'none' })
        }
      }
    })
  }
})
