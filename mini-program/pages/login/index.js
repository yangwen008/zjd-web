// pages/login/index.js
const app = getApp()

Page({
  data: {
    phone: '',
    password: '',
    showPasswordLogin: false,
    wxLoading: false
  },

  onPhoneInput(e) { this.setData({ phone: e.detail.value }) },
  onPasswordInput(e) { this.setData({ password: e.detail.value }) },

  expandPassword() {
    this.setData({ showPasswordLogin: true })
  },

  // 微信一键登录（优先）
  async wxLogin() {
    if (this.data.wxLoading) return
    this.setData({ wxLoading: true })
    try {
      // 获取 wx.login code
      const loginRes = await new Promise((resolve, reject) => {
        wx.login({ success: resolve, fail: reject })
      })
      const code = loginRes.code
      if (!code) {
        wx.showToast({ title: '获取登录凭证失败', icon: 'none' })
        return
      }

      const res = await app.request({
        url: '/api/auth/wx/mini-login',
        method: 'POST',
        data: { code }
      })
      if (res.success && res.token) {
        this.saveLogin(res.token, res.user)
      } else {
        wx.showToast({ title: res.error || '登录失败', icon: 'none' })
      }
    } catch (err) {
      wx.showToast({ title: '登录失败，请重试', icon: 'none' })
    } finally {
      this.setData({ wxLoading: false })
    }
  },

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
      if (res.success && res.token) {
        this.saveLogin(res.token, res.user)
      } else {
        wx.showToast({ title: res.error || '登录失败', icon: 'none' })
      }
    } catch (err) {
      wx.showToast({ title: '登录失败', icon: 'none' })
    }
  },

  // 账号密码登录
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
      if (res.success && res.token) {
        this.saveLogin(res.token, res.user)
      } else {
        wx.showToast({ title: res.error || '登录失败', icon: 'none' })
      }
    } catch (err) {
      wx.showToast({ title: '登录失败', icon: 'none' })
    }
  },

  // 统一保存登录态并跳转
  saveLogin(token, user) {
    app.globalData.token = token
    app.globalData.user = user || null
    wx.setStorageSync('token', token)
    wx.setStorageSync('user', user || null)
    wx.showToast({ title: '登录成功', icon: 'success' })
    // 延迟跳转，确保 storage 写入完成
    setTimeout(() => {
      wx.switchTab({ url: '/pages/index/index' })
    }, 800)
  },

  goRegister() {
    wx.navigateTo({ url: '/pages/register/index' })
  }
})
