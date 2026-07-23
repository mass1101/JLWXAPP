const act = require('../../services/activation');

Page({
  data: {
    version: '1.0.0',
    activated: false,
    connected: false,
    deviceInfo: null
  },

  onShow() {
    const app = getApp();
    const activated = act.isActivated();
    const bleService = app.globalData.bleService;
    const connected = bleService ? bleService.isConnected : false;
    const deviceInfo = connected ? {
      deviceId: bleService.deviceId || '',
      isDFU: bleService.isDFU || false
    } : null;
    this.setData({ activated, connected, deviceInfo });
  },

  openRepo() {
    wx.setClipboardData({
      data: 'https://github.com/mass1101/JLWXAPP',
      success: () => { wx.showToast({ title: '链接已复制' }); }
    });
  }
});
