// pages/asset/publish.js — 发布资产页（完整版，对齐H5）
const app = getApp()

Page({
  data: {
    form: {
      title: '', description: '', province: '', city: '', district: '', address: '',
      area_mu: '', lease_years: '', price_year: '', price_total: '',
      contact_name: '', contact_phone: '', asset_type: '',
      certification: 'uncertified'
    },
    typeOptions: ['林地', '茶园', '古宅', '种植', '集体建设用地', '国有建设用地', '集体经营性建设用地', '养殖用地', '荒山', '水域', '厂房', '宅基地'],
    typeIndex: -1,

    // 流转方式
    transferOptions: [
      { key: 'lease', label: '租赁' },
      { key: 'transfer', label: '转让' },
      { key: 'grant', label: '出让' },
      { key: 'cooperation', label: '合作' },
      { key: 'equity', label: '入股' }
    ],
    transferIndex: 0,

    // 权证信息
    certOptions: [
      { key: 'uncertified', label: '❌ 未确权' },
      { key: 'pending', label: '⏳ 待确权' },
      { key: 'certified', label: '✅ 已确权' }
    ],
    certIndex: 0,
    ownerOptions: ['集体', '国有', '个人'],
    ownerIndex: -1,
    certTypeOptions: ['不动产权证书', '宅基地使用权证', '土地承包经营权证', '暂无'],
    certTypeIndex: -1,

    // 交通信息
    transportFields: [
      { key: 'highway', icon: '🚗', label: '距高速出口', options: ['15分钟内', '30分钟内', '60分钟内', '60分钟以上'], valueIndex: -1 },
      { key: 'rail', icon: '🚄', label: '距高铁站', options: ['15分钟内', '30分钟内', '60分钟内', '60分钟以上'], valueIndex: -1 },
      { key: 'airport', icon: '✈️', label: '距机场', options: ['30分钟内', '60分钟内', '90分钟内', '90分钟以上'], valueIndex: -1 },
      { key: 'bus', icon: '🚌', label: '公交', options: ['有直达', '需转车', '无公交'], valueIndex: -1 },
      { key: 'metro', icon: '🚇', label: '地铁', options: ['有站点', '规划中', '无地铁'], valueIndex: -1 }
    ],

    // 基建配套
    infraItems: [
      { key: 'electricity', icon: '⚡', label: '通电', enabled: true },
      { key: 'water', icon: '💧', label: '自来水', enabled: true },
      { key: 'network', icon: '📶', label: '网络', enabled: true },
      { key: 'sewage', icon: '🚽', label: '污水化粪池', enabled: false },
      { key: 'gas', icon: '🔥', label: '天燃气', enabled: false },
      { key: 'road', icon: '🛣️', label: '自建路', enabled: false }
    ],

    // 环境指标
    envItems: [
      { key: 'comfort', icon: '🌡️', label: '舒适度', enabled: false },
      { key: 'air', icon: '🌬️', label: '空气质量', enabled: false },
      { key: 'water_quality', icon: '💧', label: '水质', enabled: false },
      { key: 'noise', icon: '🔇', label: '噪声指数', enabled: false }
    ],

    images: [],
    submitting: false
  },

  onLoad() {
    const user = app.globalData.user
    if (user) {
      this.setData({
        'form.contact_name': user.nickname || '',
        'form.contact_phone': user.phone || ''
      })
    }
    const loc = app.globalData.location
    if (loc.province) {
      this.setData({
        'form.province': loc.province,
        'form.city': loc.city || '',
        'form.district': loc.district || ''
      })
    }
  },

  onInput(e) {
    this.setData({ ['form.' + e.currentTarget.dataset.field]: e.detail.value })
  },

  onTypeChange(e) {
    this.setData({ typeIndex: e.detail.value, 'form.asset_type': this.data.typeOptions[e.detail.value] })
  },

  onTransferChange(e) {
    this.setData({ transferIndex: e.detail.value })
  },

  onCertChange(e) {
    const idx = e.detail.value
    this.setData({ certIndex: idx, 'form.certification': this.data.certOptions[idx].key })
  },

  onOwnerChange(e) {
    this.setData({ ownerIndex: e.detail.value })
  },

  onCertTypeChange(e) {
    this.setData({ certTypeIndex: e.detail.value })
  },

  onTransportChange(e) {
    const key = e.currentTarget.dataset.key
    const idx = e.detail.value
    const fields = this.data.transportFields.map(f =>
      f.key === key ? { ...f, valueIndex: idx } : f
    )
    this.setData({ transportFields: fields })
  },

  toggleInfra(e) {
    const idx = e.currentTarget.dataset.index
    const items = this.data.infraItems.slice()
    items[idx].enabled = !items[idx].enabled
    this.setData({ infraItems: items })
  },

  toggleEnv(e) {
    const idx = e.currentTarget.dataset.index
    const items = this.data.envItems.slice()
    items[idx].enabled = !items[idx].enabled
    this.setData({ envItems: items })
  },

  getGPS() {
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        this._gpsLat = res.latitude
        this._gpsLng = res.longitude
        wx.request({
          url: `https://apis.map.qq.com/ws/geocoder/v1/?location=${res.latitude},${res.longitude}&key=***
          success: (addrRes) => {
            const addr = addrRes.data?.result?.address_component
            if (addr) {
              this.setData({
                'form.province': addr.province || '',
                'form.city': addr.city || '',
                'form.district': addr.district || '',
                'form.address': addrRes.data.result.formatted_addresses?.recommend || ''
              })
              wx.showToast({ title: '定位成功', icon: 'success' })
            }
          }
        })
      },
      fail: () => wx.showToast({ title: '定位失败，请开启定位权限', icon: 'none' })
    })
  },

  chooseImage() {
    wx.chooseMedia({
      count: 9 - this.data.images.length,
      mediaType: ['image'],
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.setData({ images: this.data.images.concat(res.tempFiles.map(f => f.tempFilePath)) })
      }
    })
  },

  removeImage(e) {
    const images = this.data.images.slice()
    images.splice(e.currentTarget.dataset.index, 1)
    this.setData({ images })
  },

  async submitForm() {
    const { form, images, transportFields, infraItems, envItems, certOptions, ownerOptions, certTypeOptions } = this.data
    if (!form.title) { wx.showToast({ title: '请填写标题', icon: 'none' }); return }
    if (!form.province) { wx.showToast({ title: '请填写省份', icon: 'none' }); return }
    if (this.data.typeIndex < 0) { wx.showToast({ title: '请选择资产类型', icon: 'none' }); return }

    this.setData({ submitting: true })

    try {
      // 上传图片
      let imageUrls = []
      for (const img of images) {
        try { const url = await this.uploadImage(img); if (url) imageUrls.push(url) } catch (e) {}
      }

      // 组装交通信息
      const transport = {}
      transportFields.forEach(f => {
        if (f.valueIndex >= 0) transport[f.key] = f.options[f.valueIndex]
      })

      // 组装基建信息
      const infra = infraItems.filter(i => i.enabled).map(i => ({ key: i.key, label: i.label, status: '已通' }))
      const env = envItems.filter(i => i.enabled).map(i => ({ key: i.key, label: i.label, value: '达标' }))

      // 组装权证信息
      const certInfo = {}
      if (this.data.ownerIndex >= 0) certInfo.ownership_type = ownerOptions[this.data.ownerIndex]
      if (this.data.certTypeIndex >= 0) certInfo.cert_type = certTypeOptions[this.data.certTypeIndex]

      const data = {
        ...form,
        target: 'asset',
        transfer_type: this.data.transferOptions[this.data.transferIndex]?.key || 'lease',
        area_mu: form.area_mu ? parseFloat(form.area_mu) : null,
        lease_years: form.lease_years ? parseInt(form.lease_years) : null,
        price_year: form.price_year ? parseFloat(form.price_year) : null,
        price_total: form.price_total ? parseFloat(form.price_total) : null,
        images: imageUrls,
        gps_lat: this._gpsLat || null,
        gps_lng: this._gpsLng || null,
        transport_info: Object.keys(transport).length > 0 ? transport : undefined,
        infra_details: infra.length > 0 ? JSON.stringify({ infra, env: [] }) : undefined,
        cert_info: Object.keys(certInfo).length > 0 ? certInfo : undefined
      }

      const res = await app.request({ url: '/api/dashboard/publish', method: 'POST', data })
      if (res.success) {
        wx.showModal({
          title: '提交成功', content: '您的资产已提交审核，审核通过后将自动上架。',
          showCancel: false, success: () => wx.navigateBack()
        })
      }
    } catch (e) {
      wx.showToast({ title: '提交失败', icon: 'none' })
    } finally {
      this.setData({ submitting: false })
    }
  },

  uploadImage(filePath) {
    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: app.globalData.baseUrl + '/api/upload/r2/direct',
        filePath, name: 'file',
        header: { 'Authorization': 'Bearer ' + app.globalData.token },
        success: (res) => {
          try {
            const data = JSON.parse(res.data)
            data.success && data.url ? resolve(data.url) : reject(new Error(data.error))
          } catch (e) { reject(e) }
        },
        fail: reject
      })
    })
  }
})
