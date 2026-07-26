// pages/messages/messages.js — 消息页
const app = getApp()

Page({
  data: {
    activeTab: 'all',
    messages: [],
    loading: false
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ current: 2 })
    }
    this.loadMessages()
  },

  switchTab(e) {
    this.setData({ activeTab: e.currentTarget.dataset.tab })
    this.loadMessages()
  },

  async loadMessages() {
    this.setData({ loading: true })
    // 从本地缓存和API加载消息
    const messages = []

    // 加载预约记录
    try {
      const apptRes = await app.request({ url: '/api/appointments' }).catch(() => null)
      if (apptRes && apptRes.success && apptRes.data) {
        apptRes.data.forEach(a => {
          const statusMap = { pending: '待确认', confirmed: '已确认', cancelled: '已取消', completed: '已完成' }
          messages.push({
            id: 'appt-' + a.id,
            type: 'appointment',
            icon: '📞',
            title: '预约带看',
            desc: (a.asset_title || '资产') + ' - ' + (statusMap[a.status] || a.status),
            time: (a.created_at || '').slice(0, 10),
            unread: a.status === 'pending' ? 1 : 0
          })
        })
      }
    } catch (e) {}

    // 加载线索（如果是服务商/合伙人角色）
    try {
      const leadRes = await app.request({ url: '/api/dashboard/leads' }).catch(() => null)
      if (leadRes && leadRes.success && leadRes.data) {
        leadRes.data.slice(0, 10).forEach(l => {
          messages.push({
            id: 'lead-' + l.id,
            type: 'lead',
            icon: '📋',
            title: '新线索',
            desc: (l.asset_title || '资产') + ' - ' + (l.contact_name || '有人感兴趣'),
            time: (l.created_at || '').slice(0, 10),
            unread: l.status === 'new' ? 1 : 0
          })
        })
      }
    } catch (e) {}

    // 按时间排序
    messages.sort((a, b) => b.time.localeCompare(a.time))

    // 按类型筛选
    let filtered = messages
    if (this.data.activeTab !== 'all') {
      filtered = messages.filter(m => m.type === this.data.activeTab)
    }

    this.setData({ messages: filtered, loading: false })
  },

  goDetail(e) {
    const item = e.currentTarget.dataset.item
    if (item.type === 'appointment') {
      wx.navigateTo({ url: '/pages/messages/messages' })
    } else if (item.type === 'lead') {
      wx.navigateTo({ url: '/pages/messages/messages' })
    }
  }
})
