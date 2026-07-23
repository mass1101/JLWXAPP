const DEFAULT = {
  autoReconnect: true, scanTimeout: 10, connectTimeout: 15,
  displayFormatIdx: 0, debugMode: false
};

Page({
  data: {
    autoReconnect: true, scanTimeout: '10', connectTimeout: '15',
    displayFormats: ['HEX', 'ASCII', '混合'], displayFormatIdx: 0, debugMode: false
  },
  onLoad() {
    const s = wx.getStorageSync('appSettings');
    this.setData(s && Object.keys(DEFAULT).every(k => k in s) ? s : DEFAULT);
  },
  onAutoReconnect(e) { this.setData({ autoReconnect: e.detail.value }); },
  onScanTimeout(e) { this.setData({ scanTimeout: e.detail.value }); },
  onConnectTimeout(e) { this.setData({ connectTimeout: e.detail.value }); },
  onDisplayFormat(e) { this.setData({ displayFormatIdx: parseInt(e.detail.value) }); },
  onDebugMode(e) { this.setData({ debugMode: e.detail.value }); },
  saveSettings() {
    wx.setStorageSync('appSettings', {
      autoReconnect: this.data.autoReconnect, scanTimeout: parseInt(this.data.scanTimeout) || 10,
      connectTimeout: parseInt(this.data.connectTimeout) || 15,
      displayFormatIdx: this.data.displayFormatIdx, debugMode: this.data.debugMode
    });
    wx.showToast({ title: '已保存', icon: 'success' });
  },
  resetSettings() {
    this.setData(DEFAULT);
    wx.setStorageSync('appSettings', DEFAULT);
    wx.showToast({ title: '已恢复默认', icon: 'success' });
  }
});
