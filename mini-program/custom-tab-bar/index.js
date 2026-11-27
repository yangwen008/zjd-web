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

    // 按住说话：优先用同声传译实时识别（边说边出字），松开自动搜索
    getPlugin() {
      try { return requirePlugin('WechatSI') } catch (e) { return null }
    },

    startRecord() {
      if (this.data.isRecording) return
      const plugin = this.getPlugin()

      if (plugin && plugin.getRecordRecognitionManager) {
        // 实时识别：录音+转写一体，说话过程中文字就出来
        if (!this.recogManager) {
          this.recogManager = plugin.getRecordRecognitionManager()
          this.recogManager.onStart = () => {
            this.setData({ isRecording: true, showResult: true, voiceLoading: true, voiceText: '', voiceReply: '', voiceResults: [] })
          }
          this.recogManager.onRecognize = (res) => {
            if (res && res.result) this.setData({ voiceText: res.result })
          }
          this.recogManager.onStop = (res) => {
            const text = ((res && res.result) || this.data.voiceText || '').trim()
            this.setData({ isRecording: false })
            if (text) {
              this.setData({ voiceText: text })
              this.searchByVoice(text)
            } else {
              this.setData({ voiceLoading: false, showResult: false })
              wx.showToast({ title: '没听清，请按住🎤再说一次', icon: 'none' })
            }
          }
          this.recogManager.onError = (err) => {
            this.setData({ isRecording: false, voiceLoading: false, showResult: false })
            const hint = (err && (err.msg || err.errMsg)) || '请重试'
            wx.showToast({ title: '语音识别失败：' + hint, icon: 'none' })
          }
        }
        this.setData({ isRecording: true, showResult: true, voiceLoading: true, voiceText: '', voiceReply: '', voiceResults: [] })
        this.recogManager.start({ lang: 'zh_CN', duration: 60000 })
      } else {
        // 降级：先录音，录完整段送 translateVoice 转文字
        this.setData({ isRecording: true })
        this.recorderManager = wx.getRecorderManager()
        this.recorderManager.onStop((res) => {
          this.setData({ isRecording: false })
          this.recognizeVoice(res.tempFilePath)
        })
        this.recorderManager.onError(() => {
          this.setData({ isRecording: false })
          wx.showToast({ title: '录音失败，请检查麦克风权限', icon: 'none' })
        })
        this.recorderManager.start({ format: 'mp3', duration: 60000 })
      }
    },

    stopRecord() {
      if (!this.data.isRecording) return
      try {
        if (this.recogManager) this.recogManager.stop()
        else if (this.recorderManager) this.recorderManager.stop()
      } catch (e) {}
    },

    // 语音识别（降级路径：整段音频转文字）
    recognizeVoice(tempFilePath) {
      this.setData({
        showResult: true,
        voiceLoading: true,
        voiceText: '',
        voiceReply: '',
        voiceResults: []
      })

      let plugin = this.getPlugin()
      if (plugin && plugin.translateVoice) {
        plugin.translateVoice({
          filePath: tempFilePath,
          lfrom: 'zh_CN',
          lto: 'zh_CN',
          success: (res) => {
            const text = ((res && res.result) || '').trim()
            this.setData({ voiceText: text })
            if (text) this.searchByVoice(text)
            else this.fallbackInput()
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
        } else {
          this.setData({
            voiceReply: res.error || '搜索失败，请重试',
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
