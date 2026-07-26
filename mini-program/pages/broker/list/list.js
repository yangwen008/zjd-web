// pages/broker/list/list.js — 合伙人列表
const app = getApp()

Page({
  data: {
    brokers: [],
    leftCol: [],
    rightCol: [],
    loading: false,
    sort: 'show_count',
    ratingIndex: 0,
    ratingOptions: [
      { key: '', label: '全部等级' },
      { key: 'gold', label: '🥇 金牌' },
      { key: 'silver', label: '🥈 银牌' },
      { key: 'bronze', label: '🥉 铜牌' }
    ],
    page: 1,
    noMore: false
  },

  onLoad() { this.loadBrokers(true) },

  async loadBrokers(reset) {
    if (this.data.loading) return
    if (reset) this.setData({ page: 1, noMore: false, brokers: [] })
    this.setData({ loading: true })
    try {
      let url = '/api/brokers?page=' + this.data.page + '&limit=10&sort=' + this.data.sort
      const rating = this.data.ratingOptions[this.data.ratingIndex].key
      if (rating) url += '&rating=' + rating
      const res = await app.request({ url })
      if (res.success && res.data) {
        const newItems = res.data.map(b => {
          let avatarUrl = '/static/default-avatar.png'
          if (b.avatar_url) {
            if (b.avatar_url.startsWith('http')) {
              avatarUrl = b.avatar_url
            } else {
              avatarUrl = app.globalData.baseUrl + (b.avatar_url.startsWith('/') ? '' : '/') + b.avatar_url
            }
          }
          return {
            ...b,
            avatarUrl,
            goodRateText: b.good_rate ? Math.round(b.good_rate * 100) + '%' : '0%',
            specialtyList: this.parseSpecialties(b.specialties)
          }
        })
        const all = reset ? newItems : this.data.brokers.concat(newItems)
        const leftCol = [], rightCol = []
        all.forEach((item, i) => { if (i % 2 === 0) leftCol.push(item); else rightCol.push(item) })
        this.setData({ brokers: all, leftCol, rightCol, page: this.data.page + 1, noMore: newItems.length < 10 })
      }
    } catch (e) {}
    finally { this.setData({ loading: false }) }
  },

  parseSpecialties(json) {
    if (!json) return []
    try { const arr = JSON.parse(json); return Array.isArray(arr) ? arr.slice(0, 3) : [] } catch { return [] }
  },

  onRatingChange(e) {
    this.setData({ ratingIndex: e.detail.value })
    this.loadBrokers(true)
  },

  changeSort(e) {
    this.setData({ sort: e.currentTarget.dataset.sort })
    this.loadBrokers(true)
  },

  goDetail(e) { wx.navigateTo({ url: '/pages/broker/detail/detail?id=' + e.currentTarget.dataset.id }) },
  onPullDownRefresh() { this.loadBrokers(true); wx.stopPullDownRefresh() },
  onReachBottom() { if (!this.data.noMore) this.loadBrokers(false) }
})
