// pages/asset/publish.js — 发布资产页
const app = getApp()

Page({
  data: {
    form: {
      title: '', description: '', province: '', city: '', district: '', address: '',
      area_mu: '', lease_years: '', price_year: '', price_total: '',
      contact_name: '', contact_phone: '', asset_type: ''
    },
    typeOptions: ['宅基地', '林地', '厂房', '茶园', '古宅', '种植'],
    typeIndex: -1,
    images: [],
    submitting: false
  },

  onLoad() {
    // 预填用户信息
    const user = app.globalData.user
    if (user) {
      this.setData({
        'form.contact_name': user.nickname || '',
        'form.contact_phone': user.phone || ''
      })
    }
    // 预填定位
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
    const field = e.currentTarget.dataset.field
    this.setData({ ['form.' + field]: e.detail.value })
  },

  onTypeChange(e) {
    this.setData({
      typeIndex: e.detail.value,
      'form.asset_type': this.data.typeOptions[e.detail.value]
    })
  },

  getGPS() {
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        wx.request({
          url: `https://apis.map.qq.com/ws/geocoder/v1/?location=${res.latitude},${res.longitude}&key=***
          success: (addrRes) => {
            const addr = addrRes.data && addrRes.data.result && addrRes.data.result.address_component
            if (addr) {
              this.setData({
                'form.province': addr.province || '',
                'form.city': addr.city || '',
                'form.district': addr.district || '',
                'form.address': addrRes.data.result.formatted_addresses && addrRes.data.result.formatted_addresses.recommend || ''
              })
              wx.showToast({ title: '定位成功', icon: 'success' })
            }
          }
        })
      },
      fail: () => wx.showToast({ title: '定位失败', icon: 'none' })
    })
  },

  chooseImage() {
    const remaining = 9 - this.data.images.length
    wx.chooseMedia({
      count: remaining,
      mediaType: ['image'],
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const newImages = res.tempFiles.map(f => f.tempFilePath)
        this.setData({ images: this.data.images.concat(newImages) })
      }
    })
  },

  removeImage(e) {
    const index = e.currentTarget.dataset.index
    const images = this.data.images.slice()
    images.splice(index, 1)
    this.setData({ images })
  },

  async submitForm() {
    const { form, images } = this.data

    // 验证
    if (!form.title) { wx.showToast({ title: '请填写标题', icon: 'none' }); return }
    if (!form.province) { wx.showToast({ title: '请填写省份', icon: 'none' }); return }
    if (this.data.typeIndex < 0) { wx.showToast({ title: '请选择资产类型', icon: 'none' }); return }

    this.setData({ submitting: true })

    try {
      // 上传图片
      let imageUrls = []
      for (const imgPath of images) {
        try {
          const uploadRes = await this.uploadImage(imgPath)
          if (uploadRes) imageUrls.push(uploadRes)
        } catch (e) {}
      }

      // 提交数据
      const data = {
        ...form,
        asset_type: form.asset_type || '宅基地',
        area_mu: form.area_mu ? parseFloat(form.area_mu) : null,
        lease_years: form.lease_years ? parseInt(form.lease_years) : null,
        price_year: form.price_year ? parseFloat(form.price_year) : null,
        price_total: form.price_total ? parseFloat(form.price_total) : null,
        images: imageUrls
      }

      const res = await app.request({
        url: '/api/dashboard/publish',
        method: 'POST',
        data
      })

      if (res.success) {
        wx.showModal({
          title: '提交成功',
          content: '您的资产已提交审核，审核通过后将自动上架。',
          showCancel: false,
          success: () => wx.navigateBack()
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
        filePath,
        name: 'file',
        header: {
          'Authorization': 'Bearer ' + app.globalData.token
        },
        success: (res) => {
          try {
            const data = JSON.parse(res.data)
            if (data.success && data.url) {
              resolve(data.url)
            } else {
              reject(new Error(data.error))
            }
          } catch (e) {
            reject(e)
          }
        },
        fail: reject
      })
    })
  }
})
