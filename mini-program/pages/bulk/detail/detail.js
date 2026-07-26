// pages/bulk/detail/detail.js — 大宗路演详情
const app = getApp()

Page({
  data: {
    project: {},
    images: [],
    locationText: '',
    areaText: '--',
    sqmText: '--',
    yieldText: '--',
    yieldClass: '',
    descText: '',
    certLabel: '',
    certClass: '',
    infraItems: [],
    transportInfo: null,
    investEnabled: false,
    investInfo: null
  },

  onLoad(options) {
    this.projectId = options.id
    this.loadProject()
  },

  async loadProject() {
    try {
      const res = await app.request({ url: '/api/bulk-projects/' + this.projectId })
      if (!res.success || !res.data) return
      const p = res.data
      const images = this.parseImages(p.images)

      const certMap = {
        certified: { label: '已确权', cls: 'cert-green' },
        pending: { label: '待确权', cls: 'cert-yellow' },
        uncertified: { label: '未确权', cls: 'cert-gray' }
      }
      const cert = certMap[p.certification] || certMap.uncertified

      // 基建
      let infraItems = []
      if (p.infra_details) {
        try {
          const parsed = JSON.parse(p.infra_details)
          if (parsed.infra) infraItems = parsed.infra
        } catch (e) {}
      }

      // 交通
      let transportInfo = null
      if (p.transport_info) {
        try {
          const ti = typeof p.transport_info === 'string' ? JSON.parse(p.transport_info) : p.transport_info
          transportInfo = [
            ti.highway && { icon: '🚗', label: '距高速出口', value: ti.highway },
            ti.rail && { icon: '🚄', label: '距高铁站', value: ti.rail },
            ti.airport && { icon: '✈️', label: '距机场', value: ti.airport },
            ti.bus && { icon: '🚌', label: '公交', value: ti.bus },
            ti.metro && { icon: '🚇', label: '地铁', value: ti.metro }
          ].filter(Boolean)
          if (transportInfo.length === 0) transportInfo = null
        } catch (e) {}
      }

      // 参投
      let investInfo = null
      if (p.invest_enabled) {
        investInfo = {
          totalShares: p.invest_total_shares || 0,
          sharePrice: p.invest_share_price || 0,
          soldShares: p.invest_sold_shares || 0,
          progress: p.invest_total_shares ? Math.round((p.invest_sold_shares / p.invest_total_shares) * 100) : 0
        }
      }

      this.setData({
        project: p, images,
        locationText: [p.province, p.city, p.district, p.location].filter(Boolean).join(' '),
        areaText: p.area_mu ? p.area_mu + '亩' : '--',
        sqmText: p.area_sqm ? p.area_sqm + '㎡' : '--',
        yieldText: p.yield_rate ? p.yield_rate + '%' : '--',
        yieldClass: p.yield_rate ? 'text-green' : '',
        descText: (p.description || '').replace(/<[^>]*>/g, '').substring(0, 300),
        certLabel: cert.label,
        certClass: cert.cls,
        infraItems,
        transportInfo,
        investEnabled: !!p.invest_enabled,
        investInfo
      })
    } catch (e) {
      wx.showToast({ title: '加载失败', icon: 'none' })
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
        if (url.startsWith('/api/images/') || url.startsWith('api/images/')) return app.globalData.baseUrl + (url.startsWith('/') ? '' : '/') + url
        if (url.startsWith('http')) return url
        return app.globalData.baseUrl + (url.startsWith('/') ? '' : '/') + url
      })
    } catch (e) { return ['/static/logo.png'] }
  },

  previewImage(e) { wx.previewImage({ urls: this.data.images, current: e.currentTarget.dataset.src }) },

  openMap() {
    const p = this.data.project
    if (p.gps_lat && p.gps_lng) {
      wx.openLocation({ latitude: p.gps_lat, longitude: p.gps_lng, name: p.title, address: this.data.locationText })
    } else {
      wx.showToast({ title: '暂无定位信息', icon: 'none' })
    }
  },

  investProject() {
    if (!app.globalData.token) { wx.navigateTo({ url: '/pages/login/index' }); return }
    const info = this.data.investInfo
    if (!info) return
    wx.showModal({
      title: '参投认购',
      content: `每份¥${info.sharePrice}万，已认购${info.soldShares}/${info.totalShares}份`,
      editable: true, placeholderText: '请输入认购份数',
      success: async (res) => {
        if (res.confirm && res.content) {
          const shares = parseInt(res.content)
          if (isNaN(shares) || shares < 1) { wx.showToast({ title: '请输入有效份数', icon: 'none' }); return }
          try {
            const r = await app.request({ url: '/api/invest', method: 'POST', data: { asset_id: parseInt(this.projectId), asset_type: 'bulk', shares } })
            if (r.success) wx.showToast({ title: '认购成功', icon: 'success' })
          } catch (e) {}
        }
      }
    })
  },

  shareProject() {
    wx.setClipboardData({ data: 'https://z.zjd.cn/bulk-projects/' + this.projectId, success: () => wx.showToast({ title: '链接已复制', icon: 'none' }) })
  },

  onShareAppMessage() {
    return { title: this.data.project.title || '宅基点 - 大宗路演', path: '/pages/bulk/detail/detail?id=' + this.projectId }
  }
})
