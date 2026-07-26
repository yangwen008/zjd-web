// custom-tab-bar/index.js
const app = getApp()

Component({
  data: {
    current: 0,
    isRecording: false,
    showResult: false,
    voiceText: '',
    voiceReply: '',
    voiceResults: [],
    voiceLoading: false
  },

  methods: {
    switchTab(e) {
      const { index, url } = e.currentTarget.dataset
      this.setData({ current: index })
      wx.switchTab({ url })
    },

    // 按住说话
    startRecord() {
      this.setData({ isRecording: true })
      this.recorderManager = wx.getRecorderManager()
      this.recorderManager.onStop((res) => {
        this.recognizeVoice(res.tempFilePath)
      })
      this.recorderManager.start({
        format: 'mp3',
        duration: 60000
      })
    },

    stopRecord() {
      if (!this.data.isRecording) return
      this.setData({ isRecording: false })
      if (this.recorderManager) this.recorderManager.stop()
    },

    // 语音识别
    recognizeVoice(tempFilePath) {
      this.setData({
        showResult: true,
        voiceLoading: true,
        voiceText: '',
        voiceReply: '',
        voiceResults: []
      })

      // 使用微信同声传译插件进行语音识别
      // 如果插件不可用，使用备用方案：弹出输入框
      const plugin = requirePlugin('WechatSI')
      if (plugin && plugin.manager) {
        plugin.manager.translateVoice({
          filePath: tempFilePath,
          lfrom: 'zh_CN',
          lto: 'zh_CN',
          success: (res) => {
            const text = res.result || ''
            this.setData({ voiceText: text })
            this.searchByVoice(text)
          },
          fail: () => {
            this.fallbackInput()
          }
        })
      } else {
        this.fallbackInput()
      }
    },

    // 备用方案：弹出输入框
    fallbackInput() {
      wx.showModal({
        title: '语音搜索',
        content: '请输入您想找的资产',
        editable: true,
        placeholderText: '四川茶园，10亩以上，3万以内',
        success: (res) => {
          if (res.confirm && res.content) {
            this.setData({ voiceText: res.content })
            this.searchByVoice(res.content)
          } else {
            this.setData({ showResult: false, voiceLoading: false })
          }
        }
      })
    },

    // 调用后端搜索
    async searchByVoice(text) {
      if (!text) return
      try {
        const res = await app.request({
          url: '/api/voice-search',
          method: 'POST',
          data: { text }
        })
        if (res.success && res.data) {
          const assets = (res.data.assets || []).map(item => ({
            ...item,
            firstImage: this.getFirstImage(item.images),
            priceText: item.price_year ? '¥' + item.price_year + '万/年' : '价格面议'
          }))
          this.setData({
            voiceReply: res.data.reply,
            voiceResults: assets,
            voiceLoading: false
          })
        }
      } catch (e) {
        this.setData({
          voiceReply: '搜索失败，请重试',
          voiceLoading: false
        })
      }
    },

    getFirstImage(imagesJson) {
      return app.getFirstImage(imagesJson)
    },

    goAsset(e) {
      const id = e.currentTarget.dataset.id
      this.setData({ showResult: false })
      wx.navigateTo({ url: '/pages/asset/detail?id=' + id })
    },

    goSearch() {
      this.setData({ showResult: false })
      wx.switchTab({ url: '/pages/search/search' })
    },

    closeResult() {
      this.setData({ showResult: false })
    },

    noop() {}
  }
})
