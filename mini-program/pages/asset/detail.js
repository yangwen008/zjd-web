// pages/asset/detail.js — 资产详情页（完整版，对齐H5）
const app = getApp()

Page({
  data: {
    asset: {},
    images: [],
    isFav: false,
    badge: '',
    badgeClass: '',
    transferLabel: '',
    transferColor: '',
    priceText: '',
    areaText: '',
    leaseText: '',
    distanceText: '',
    locationText: '',
    descText: '',
    certInfo: null,
    infraItems: [],
    envItems: [],
    transportInfo: null,
    professionals: [],
    similarAssets: [],
    pubInitial: '?',
    pubRoleText: '',
    investEnabled: false,
    investInfo: null
  },

  onLoad(options) {
    this.assetId = options.id
    this.loadAsset()
    this.checkFavorite()
  },

  async loadAsset() {
    try {
      const res = await app.request({ url: '/api/assets/' + this.assetId })
      if (!res.success || !res.data) return
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
          certInfo = [
            ci.ownership_type && { label: '权属类型', value: ci.ownership_type },
            ci.cert_type && { label: '权证类型', value: ci.cert_type },
            { label: '确权状态', value: asset.certification === 'certified' ? '已确权' : asset.certification === 'pending' ? '待确权' : '未确权' }
          ].filter(Boolean)
        } catch (e) {}
      }

      // 基建配套
      let infraItems = [
        { icon: '⚡', label: '通电', enabled: true, status: '已通' },
        { icon: '💧', label: '自来水', enabled: true, status: '已通' },
        { icon: '📶', label: '网络', enabled: true, status: '5G覆盖' },
        { icon: '🚽', label: '污水化粪池', enabled: false, status: '未建' },
        { icon: '🔥', label: '天燃气', enabled: false, status: '未通' },
        { icon: '🛣️', label: '自建路', enabled: false, status: '未硬化' }
      ]
      if (asset.infra_details) {
        try {
          const parsed = JSON.parse(asset.infra_details)
          if (parsed.infra && Array.isArray(parsed.infra) && parsed.infra.length > 0) {
            infraItems = parsed.infra.map(item => ({
              ...item,
              enabled: item.enabled !== false
            }))
          }
        } catch (e) {}
      }

      // 环境指标
      let envItems = [
        { icon: '🌡️', label: '舒适度', value: '±1级' },
        { icon: '🌬️', label: '空气质量', value: '51-100(良)' },
        { icon: '💧', label: '水质', value: 'II类' },
        { icon: '🔇', label: '噪声指数', value: '20-40 dB' }
      ]

      // 交通信息
      let transportInfo = null
      if (asset.transport_info) {
        try {
          const ti = typeof asset.transport_info === 'string' ? JSON.parse(asset.transport_info) : asset.transport_info
          const items = [
            ti.highway && { icon: '🚗', label: '距高速出口', value: ti.highway },
            ti.rail && { icon: '🚄', label: '距高铁站', value: ti.rail },
            ti.airport && { icon: '✈️', label: '距机场', value: ti.airport },
            ti.bus && { icon: '🚌', label: '公交', value: ti.bus },
            ti.metro && { icon: '🚇', label: '地铁', value: ti.metro }
          ].filter(Boolean)
          if (items.length > 0) transportInfo = items
        } catch (e) {}
      }

      // 参投信息
      let investInfo = null
      if (asset.invest_enabled) {
        investInfo = {
          totalShares: asset.invest_total_shares || 0,
          sharePrice: asset.invest_share_price || 0,
          minShares: asset.invest_min_shares || 1,
          soldShares: asset.invest_sold_shares || 0,
          progress: asset.invest_total_shares ? Math.round((asset.invest_sold_shares / asset.invest_total_shares) * 100) : 0
        }
      }

      const pubRoleMap = {
        'project_publisher': '交易所/机构', 'broker': '认证合伙人',
        'village_org': '村集体', 'admin': '平台运营'
      }

      const transferMap = { lease: { label: '租赁', color: '#2e7d32' }, transfer: { label: '转让', color: '#1565c0' }, grant: { label: '出让', color: '#e65100' }, cooperation: { label: '合作', color: '#7b1fa2' }, equity: { label: '入股', color: '#c62828' } }
      const tt = transferMap[asset.transfer_type] || transferMap.lease

      this.setData({
        asset, images,
        badge: this.getBadge(asset),
        badgeClass: this.getBadgeClass(asset),
        transferLabel: tt.label,
        transferColor: tt.color,
        priceText: asset.price_year ? '¥' + asset.price_year + '万' : '面议',
        areaText: asset.area_mu ? asset.area_mu + '亩' : '--',
        leaseText: asset.lease_years ? asset.lease_years + '年' : '--',
        distanceText,
        locationText: [asset.province, asset.city, asset.district, asset.address].filter(Boolean).join(' '),
        descText: (asset.description || '').replace(/<[^>]*>/g, '').substring(0, 300),
        certInfo,
        infraItems,
        envItems,
        transportInfo,
        investEnabled: !!asset.invest_enabled,
        investInfo,
        pubInitial: (asset.publisher_name || '平').charAt(0),
        pubRoleText: pubRoleMap[asset.publisher_role] || '个人发布'
      })

      // 加载交易保障服务商
      if (asset.province) this.loadProfessionals(asset.province, asset.city)
      // 加载相似推荐
      this.loadSimilar(asset)
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
        this.setData({
          professionals: res.data.map(p => ({ ...p, icon: iconMap[p.prof_type] || '👤', label: labelMap[p.prof_type] || p.prof_type }))
        })
      }
    } catch (e) {}
  },

  async loadSimilar(asset) {
    try {
      let url = '/api/assets?limit=3&sort=views'
      if (asset.province) url += '&province=' + encodeURIComponent(asset.province)
      const res = await app.request({ url })
      if (res.success && res.data) {
        const similar = res.data
          .filter(a => a.id !== asset.id)
          .slice(0, 3)
          .map(a => ({
            ...a,
            firstImage: app.getFirstImage(a.images),
            priceText: a.price_year ? '¥' + a.price_year + '万/年' : '面议'
          }))
        this.setData({ similarAssets: similar })
      }
    } catch (e) {}
  },

  async checkFavorite() {
    if (!app.globalData.token) return
    try {
      const res = await app.request({ url: '/api/dashboard/favorites' })
      if (res.success && res.data) {
        this.setData({ isFav: res.data.some(f => f.id == this.assetId || f.asset_id == this.assetId) })
      }
    } catch (e) {}
  },

  async toggleFav() {
    if (!app.globalData.token) { wx.navigateTo({ url: '/pages/login/index' }); return }
    try {
      const res = await app.request({ url: '/api/dashboard/favorites', method: 'POST', data: { assetId: parseInt(this.assetId) } })
      if (res.success) {
        this.setData({ isFav: !this.data.isFav })
        wx.showToast({ title: this.data.isFav ? '已收藏' : '已取消', icon: 'none' })
      }
    } catch (e) {}
  },

  parseImages(imagesJson) {
    if (!imagesJson) return ['/static/logo.png']
    try {
      const arr = JSON.parse(imagesJson)
      if (!Array.isArray(arr) || arr.length === 0) return ['/static/logo.png']
      return arr.map(item => {
        let url = (typeof item === 'object') ? (item.thumb || item.url) : item
        if (!url) return '/static/logo.png'
        if (url.startsWith('/api/images/') || url.startsWith('api/images/')) return app.globalData.baseUrl + (url.startsWith('/') ? '' : '/') + url
        if (url.startsWith('http')) return url
        return app.globalData.baseUrl + (url.startsWith('/') ? '' : '/') + url
      })
    } catch (e) { return ['/static/logo.png'] }
  },

  getBadge(item) {
    if (item.source_site) return '第三方'
    if (item.publisher_role === 'project_publisher') return '交易所'
    if (item.source_type === 'official') return '官方'
    if (item.source_type === 'village') return '村委'
    return '个人'
  },
  getBadgeClass(item) {
    return { '官方': 'tag-official', '村委': 'tag-village', '交易所': 'tag-exchange', '第三方': 'tag-third' }[this.getBadge(item)] || 'tag-personal'
  },

  calcDistance(lat1, lng1, lat2, lng2) {
    const R = 6371, dLat = (lat2-lat1)*Math.PI/180, dLng = (lng2-lng1)*Math.PI/180
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  },

  saveHistory(asset) {
    let history = wx.getStorageSync('viewHistory') || []
    history = history.filter(h => h.id !== asset.id)
    history.unshift({ id: asset.id, title: asset.title, images: asset.images, price_year: asset.price_year, province: asset.province, city: asset.city, district: asset.district, viewedAt: Date.now() })
    if (history.length > 50) history = history.slice(0, 50)
    wx.setStorageSync('viewHistory', history)
  },

  previewImage(e) { wx.previewImage({ urls: this.data.images, current: e.currentTarget.dataset.src }) },
  goBack() { wx.navigateBack() },
  goPublisher() { if (this.data.asset.user_id) wx.navigateTo({ url: '/pages/broker/detail/detail?id=' + this.data.asset.user_id }) },
  goProf(e) { wx.navigateTo({ url: '/pages/services/detail/detail?id=' + e.currentTarget.dataset.id }) },
  goSimilar(e) { wx.navigateTo({ url: '/pages/asset/detail?id=' + e.currentTarget.dataset.id }) },

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
      title: '预约带看', content: '提交后发布者将收到通知，是否继续？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await app.request({ url: '/api/appointments', method: 'POST', data: { asset_id: parseInt(this.assetId) } })
            wx.showToast({ title: '预约成功', icon: 'success' })
          } catch (e) {}
        }
      }
    })
  },

  // 参投认购
  investAsset() {
    if (!app.globalData.token) { wx.navigateTo({ url: '/pages/login/index' }); return }
    const info = this.data.investInfo
    if (!info) return
    wx.showModal({
      title: '参投认购',
      content: `每份¥${info.sharePrice}万，最低${info.minShares}份起投，已认购${info.soldShares}/${info.totalShares}份`,
      editable: true,
      placeholderText: '请输入认购份数',
      success: async (res) => {
        if (res.confirm && res.content) {
          const shares = parseInt(res.content)
          if (isNaN(shares) || shares < info.minShares) {
            wx.showToast({ title: '份数不能低于' + info.minShares + '份', icon: 'none' }); return
          }
          try {
            const r = await app.request({
              url: '/api/invest', method: 'POST',
              data: { asset_id: parseInt(this.assetId), asset_type: 'asset', shares }
            })
            if (r.success) wx.showToast({ title: '认购成功', icon: 'success' })
          } catch (e) {}
        }
      }
    })
  },

  shareAsset() {
    wx.setClipboardData({ data: 'https://z.zjd.cn/asset/' + this.assetId, success: () => wx.showToast({ title: '链接已复制', icon: 'none' }) })
  },

  unlockContact() {
    if (!app.globalData.token) { wx.navigateTo({ url: '/pages/login/index' }); return }
    wx.showModal({
      title: '查看联系方式', content: '解锁后可查看发布者的联系电话',
      success: async (res) => {
        if (res.confirm) {
          try {
            const r = await app.request({ url: '/api/unlock', method: 'POST', data: { assetId: parseInt(this.assetId) } })
            if (r.success && r.data) {
              wx.showModal({ title: '联系方式', content: (r.data.contact_name || '') + '\n' + (r.data.contact_phone || '未提供'), showCancel: false })
            }
          } catch (e) {}
        }
      }
    })
  },

  onShareAppMessage() {
    return { title: this.data.asset.title || '宅基点 - 优质资产推荐', path: '/pages/asset/detail?id=' + this.assetId, imageUrl: this.data.images[0] || '' }
  }
})
