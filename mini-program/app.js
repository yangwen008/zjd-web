// app.js — 小程序入口
App({
  globalData: {
    baseUrl: 'https://z.zjd.cn',
    token: '',
    user: null,
    location: { latitude: 0, longitude: 0, province: '', city: '', district: '' }
  },

  onLaunch() {
    // 恢复登录状态
    const token = wx.getStorageSync('token')
    const user = wx.getStorageSync('user')
    if (token) this.globalData.token = token
    if (user) this.globalData.user = user
    // 自动定位
    this.locate()
  },

  // GPS 定位
  locate() {
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        this.globalData.location.latitude = res.latitude
        this.globalData.location.longitude = res.longitude
        // 反查地址
        wx.request({
          url: `https://apis.map.qq.com/ws/geocoder/v1/?location=${res.latitude},${res.longitude}&key=YOUR_KEY`,
          success: (addrRes) => {
            const addr = addrRes.data && addrRes.data.result && addrRes.data.result.address_component
            if (addr) {
              this.globalData.location.province = addr.province || ''
              this.globalData.location.city = addr.city || ''
              this.globalData.location.district = addr.district || ''
            }
          }
        })
      }
    })
  },

  // 获取图片URL（R2代理处理）
  getFirstImage(imagesJson) {
    if (!imagesJson) return '/static/logo.png'
    try {
      const arr = JSON.parse(imagesJson)
      if (Array.isArray(arr) && arr.length > 0) {
        const first = arr[0]
        let url = (typeof first === 'object' ? (first.thumb || first.url) : first) || ''
        if (!url) return '/static/logo.png'
        if (url.startsWith('/api/images/') || url.startsWith('api/images/')) {
          return this.globalData.baseUrl + (url.startsWith('/') ? '' : '/') + url
        }
        if (url.startsWith('http')) return url
        return this.globalData.baseUrl + (url.startsWith('/') ? '' : '/') + url
      }
    } catch (e) {}
    return '/static/logo.png'
  },

  // 统一请求
  request(options) {
    return new Promise((resolve, reject) => {
      const header = { 'Content-Type': 'application/json' }
      if (this.globalData.token) {
        header['Authorization'] = 'Bearer ' + this.globalData.token
      }
      wx.request({
        url: this.globalData.baseUrl + options.url,
        method: options.method || 'GET',
        data: options.data,
        header,
        success: (res) => {
          if (res.statusCode === 401) {
            this.globalData.token = ''
            wx.removeStorageSync('token')
            wx.navigateTo({ url: '/pages/login/index' })
            reject(new Error('请先登录'))
            return
          }
          resolve(res.data)
        },
        fail: reject
      })
    })
  }
})
