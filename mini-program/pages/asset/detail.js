// pages/asset/detail.js — 资产详情页
const app = getApp()

Page({
  data: {
    asset: {},
    images: [],
    isFav: false,
    badge: '',
    badgeClass: '',
    priceText: '',
    areaText: '',
    leaseText: '',
    distanceText: '',
    locationText: '',
    descText: '',
    certInfo: null,
    infraDetails: '',
    transportInfo: null,
    professionals: [],
    pubInitial: '?',
    pubRoleText: ''
  },

  onLoad(options) {
    this.assetId = options.id
    this.loadAsset()
    this.checkFavorite()
  },

  // 记录浏览历史
  saveHistory(asset) {
    let history = wx.getStorageSync('viewHistory') || []
    // 去重
    history = history.filter(h => h.id !== asset.id)
    // 插入到最前面
    history.unshift({
      id: asset.id,
      title: asset.title,
      images: asset.images,
      price_year: asset.price_year,
      province: asset.province,
      city: asset.city,
      district: asset.district,
      viewedAt: Date.now()
    })
    // 最多保留50条
    if (history.length > 50) history = history.slice(0, 50)
    wx.setStorageSync('viewHistory', history)
  },

  async loadAsset() {
    try {
      const res = await app.request({ url: '/api/assets/' + this.assetId })
      if (res.success && res.data) {
        const asset = res.data
        const images = this.parseImages(asset.images)
        const loc = app.globalData.location

        // 距离
        let distanceText = '--'
        if (asset.gps_lat && asset.gps_lng && loc.latitude) {
          const km = this.calcDistance(loc.latitude, loc.longitude, asset.gps_lat, asset.gps_lng)
          distanceText = km < 1 ? Math.round(km * 1000) + 'm' : km.toFixed(1) + 'km'
        }

        // 权证信息
        let certInfo = null
        if (asset.cert_info) {
          try {
            const ci = JSON.parse(asset.cert_info)
            certInfo = Object.entries(ci).filter(([_, v]) => v).map(([k, v]) => ({ label: k, value: v }))
          } catch (e) {}
        }

        // 交通信息
        let transportInfo = null
        if (asset.transport_info) {
          try {
            const ti = JSON.parse(asset.transport_info)
            transportInfo = Object.entries(ti).filter(([_, v]) => v).map(([k, v]) => ({ label: k, value: v }))
          } catch (e) {}
        }

        // 发布者
        const pubRoleMap = {
          'project_publisher': '交易所/机构',
          'broker': '认证合伙人',
          'village_org': '村集体',
          'admin': '平台运营'
        }

        // 记录浏览历史
        this.saveHistory(asset)

        this.setData({
          asset,
          images,
          badge: this.getBadge(asset),
          badgeClass: this.getBadgeClass(asset),
          priceText: asset.price_year ? '¥' + asset.price_year + '万' : '面议',
          areaText: asset.area_mu ? asset.area_mu + '亩' : '--',
          leaseText: asset.lease_years ? asset.lease_years + '年' : '--',
          distanceText,
          locationText: [asset.province, asset.city, asset.district, asset.address].filter(Boolean).join(' '),
          descText: (asset.description || '').replace(/<[^>]*>/g, '').substring(0, 200),
          certInfo,
          infraDetails: asset.infra_details || '',
          transportInfo,
          pubInitial: (asset.publisher_name || '平').charAt(0),
          pubRoleText: pubRoleMap[asset.publisher_role] || '个人发布'
        })

        // 加载交易保障服务商
        if (asset.province) {
          this.loadProfessionals(asset.province, asset.city)
        }
      }
    } catch (e) {
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  async loadProfessionals(province, city) {
    try {
      const res = await app.request({ url: '/api/professionals?province=' + encodeURIComponent(province) + '&limit=1' })
      if (res.success && res.data) {
        const iconMap = { notary: '📋', lawyer: '⚖️', fengshui: '🏔️' }
        const labelMap = { notary: '公证服务', lawyer: '法律服务', fengshui: '风水勘察' }
        const profs = res.data.map(p => ({
          ...p,
          icon: iconMap[p.prof_type] || '👤',
          label: labelMap[p.prof_type] || p.prof_type
        }))
        this.setData({ professionals: profs })
      }
    } catch (e) {}
  },

  async checkFavorite() {
    if (!app.globalData.token) return
    try {
      const res = await app.request({ url: '/api/dashboard/favorites' })
      if (res.success && res.data) {
        const isFav = res.data.some(f => f.id == this.assetId || f.asset_id == this.assetId)
        this.setData({ isFav })
      }
    } catch (e) {}
  },

  async toggleFav() {
    if (!app.globalData.token) {
      wx.navigateTo({ url: '/pages/login/index' })
      return
    }
    try {
      const res = await app.request({
        url: '/api/dashboard/favorites',
        method: 'POST',
        data: { assetId: parseInt(this.assetId) }
      })
      if (res.success) {
        this.setData({ isFav: !this.data.isFav })
        wx.showToast({ title: this.data.isFav ? '已收藏' : '已取消', icon: 'none' })
      }
    } catch (e) {
      wx.showToast({ title: '操作失败', icon: 'none' })
    }
  },

  parseImages(imagesJson) {
    if (!imagesJson) return ['/static/logo.png']
    try {
      const arr = JSON.parse(imagesJson)
      if (!Array.isArray(arr) || arr.length === 0) return ['/static/logo.png']
      return arr.map(item => {
        let url = (typeof item === 'object') ? (item.thumb || item.url) : item
        if (!url) return '/static/logo.png'
        if (url.startsWith('/api/images/') || url.startsWith('api/images/')) {
          return app.globalData.baseUrl + (url.startsWith('/') ? '' : '/') + url
        }
        if (url.startsWith('http')) return url
        return app.globalData.baseUrl + (url.startsWith('/') ? '' : '/') + url
      })
    } catch (e) {
      return ['/static/logo.png']
    }
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
    return { '官方': 'tag-official', '村委': 'tag-village', '交易所': 'tag-exchange', '第三方': 'tag-third' }[badge] || 'tag-personal'
  },

  calcDistance(lat1, lng1, lat2, lng2) {
    const R = 6371
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  },

  previewImage(e) {
    wx.previewImage({ urls: this.data.images, current: e.currentTarget.dataset.src })
  },

  goBack() { wx.navigateBack() },

  goPublisher() {
    if (this.data.asset.user_id) {
      wx.navigateTo({ url: '/pages/broker/detail/detail?id=' + this.data.asset.user_id })
    }
  },

  goProf(e) {
    wx.navigateTo({ url: '/pages/services/detail/detail?id=' + e.currentTarget.dataset.id })
  },

  openMap() {
    const a = this.data.asset
    if (a.gps_lat && a.gps_lng) {
      wx.openLocation({ latitude: a.gps_lat, longitude: a.gps_lng, name: a.title, address: this.data.locationText })
    } else {
      wx.showToast({ title: '暂无定位信息', icon: 'none' })
    }
  },

  bookAppointment() {
    if (!app.globalData.token) { wx.navigateTo({ url: '/pages/login/index' }); return }
    wx.showModal({
      title: '预约带看',
      content: '提交后发布者将收到通知，是否继续？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await app.request({
              url: '/api/appointments',
              method: 'POST',
              data: { asset_id: parseInt(this.assetId) }
            })
            wx.showToast({ title: '预约成功', icon: 'success' })
          } catch (e) {}
        }
      }
    })
  },

  shareAsset() {
    // 小程序分享通过右上角菜单，这里复制链接
    wx.setClipboardData({
      data: 'https://z.zjd.cn/asset/' + this.assetId,
      success: () => wx.showToast({ title: '链接已复制', icon: 'none' })
    })
  },

  unlockContact() {
    if (!app.globalData.token) { wx.navigateTo({ url: '/pages/login/index' }); return }
    wx.showModal({
      title: '查看联系方式',
      content: '解锁后可查看发布者的联系电话',
      success: async (res) => {
        if (res.confirm) {
          try {
            const r = await app.request({ url: '/api/unlock', method: 'POST', data: { assetId: parseInt(this.assetId) } })
            if (r.success && r.data) {
              wx.showModal({
                title: '联系方式',
                content: (r.data.contact_name || '') + '\n' + (r.data.contact_phone || '未提供'),
                showCancel: false
              })
            }
          } catch (e) {}
        }
      }
    })
  },

  onShareAppMessage() {
    return {
      title: this.data.asset.title || '宅基点 - 优质资产推荐',
      path: '/pages/asset/detail?id=' + this.assetId,
      imageUrl: this.data.images[0] || ''
    }
  }
})
