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
        // 反查地址（通过后端代理，避免暴露 API Key）
        this.reverseGeocode(res.latitude, res.longitude)
      },
      fail: (err) => {
        console.warn('GPS 定位失败:', err.errMsg)
        // 定位失败时尝试 IP 定位
        this.locateByIP()
      }
    })
  },

  // 通过后端 API 反向地理编码（安全，不暴露 Key）
  reverseGeocode(lat, lng) {
    wx.request({
      url: this.globalData.baseUrl + '/api/wx/geocoder?lat=' + lat + '&lng=' + lng,
      success: (res) => {
        if (res.data && res.data.success && res.data.address) {
          const addr = res.data.address
          this.globalData.location.province = addr.province || ''
          this.globalData.location.city = addr.city || ''
          this.globalData.location.district = addr.district || ''
          console.log('定位成功:', addr.province, addr.city)
        } else {
          console.warn('反向地理编码失败，尝试 IP 定位')
          this.locateByIP()
        }
      },
      fail: () => {
        console.warn('反向地理编码请求失败，尝试 IP 定位')
        this.locateByIP()
      }
    })
  },

  // IP 定位降级方案（通过后端获取）
  locateByIP() {
    wx.request({
      url: this.globalData.baseUrl + '/api/wx/geocoder',
      success: (res) => {
        if (res.data && res.data.success && res.data.address) {
          const addr = res.data.address
          this.globalData.location.province = addr.province || ''
          this.globalData.location.city = addr.city || ''
          this.globalData.location.district = addr.district || ''
          console.log('IP 定位成功:', addr.province, addr.city)
        }
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
