// pages/asset/asset.js — 我的资产列表
const app = getApp()

Page({
  data: {
    assets: [],
    loading: false
  },

  onShow() {
    this.loadAssets()
  },

  async loadAssets() {
    this.setData({ loading: true })
    try {
      const res = await app.request({ url: '/api/dashboard/assets' })
      if (res.success && res.data) {
        const statusMap = {
          'approved': { text: '已上架', cls: 'status-green' },
          'pending': { text: '审核中', cls: 'status-yellow' },
          'rejected': { text: '已拒绝', cls: 'status-red' }
        }
        const assets = res.data.map(item => {
          const st = statusMap[item.status] || { text: item.status, cls: '' }
          return {
            ...item,
            firstImage: app.getFirstImage(item.images),
            priceText: item.price_year ? '¥' + item.price_year + '万/年起' : '价格面议',
            statusText: st.text,
            statusClass: st.cls
          }
        })
        this.setData({ assets })
      }
    } catch (e) {}
    finally { this.setData({ loading: false }) }
  },

  goPublish() { wx.navigateTo({ url: '/pages/asset/publish' }) },
  goDetail(e) { wx.navigateTo({ url: '/pages/asset/detail?id=' + e.currentTarget.dataset.id }) }
})
