// pages/login/index.js
const app = getApp()

Page({
  data: {
    phone: '',
    password: ''
  },

  onPhoneInput(e) { this.setData({ phone: e.detail.value }) },
  onPasswordInput(e) { this.setData({ password: e.detail.value }) },

  // 手机号快捷登录
  async getPhoneNumber(e) {
    if (!e.detail.code) {
      wx.showToast({ title: '获取手机号失败', icon: 'none' })
      return
    }
    try {
      const res = await app.request({
        url: '/api/auth/wx/mini-login',
        method: 'POST',
        data: { code: e.detail.code, phone_code: e.detail.code }
      })
      if (res.success) {
        app.globalData.token = res.token || ''
        app.globalData.user = res.user || null
        wx.setStorageSync('token', app.globalData.token)
        wx.setStorageSync('user', app.globalData.user)
        wx.switchTab({ url: '/pages/index/index' })
      }
    } catch (err) {
      wx.showToast({ title: '登录失败', icon: 'none' })
    }
  },

  // 手机号密码登录
  async login() {
    const { phone, password } = this.data
    if (!phone || !password) {
      wx.showToast({ title: '请填写手机号和密码', icon: 'none' })
      return
    }
    try {
      const res = await app.request({
        url: '/api/auth/login',
        method: 'POST',
        data: { phone, password }
      })
      if (res.success) {
        app.globalData.token = res.token || ''
        app.globalData.user = res.user || null
        wx.setStorageSync('token', app.globalData.token)
        wx.setStorageSync('user', app.globalData.user)
        wx.switchTab({ url: '/pages/index/index' })
      }
    } catch (err) {
      wx.showToast({ title: '登录失败', icon: 'none' })
    }
  },

  goRegister() {
    wx.navigateTo({ url: '/pages/register/index' })
  }
})
