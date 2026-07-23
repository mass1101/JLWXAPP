const st = require('../../services/storage');

var WXML_DEFAULTS = {
  autoReconnect: true,
  scanTimeout: '10',
  connectTimeout: '15',
  displayFormatIdx: 0,
  displayFormats: ['HEX', 'ASCII', '混合'],
  debugMode: false
};

Page({
  data: {
    autoReconnect: true,
    scanTimeout: '10',
    connectTimeout: '15',
    displayFormatIdx: 0,
    displayFormats: ['HEX', 'ASCII', '混合'],
    debugMode: false
  },

  onLoad() {
    var saved = st.getSettings();
    var merged = {};
    var keys = Object.keys(WXML_DEFAULTS);
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      merged[k] = (saved && saved[k] !== undefined) ? saved[k] : WXML_DEFAULTS[k];
    }
    this.setData(merged);
  },

  onAutoReconnect(e) {
    this.setData({ autoReconnect: e.detail.value });
  },

  onScanTimeout(e) {
    this.setData({ scanTimeout: e.detail.value });
  },

  onConnectTimeout(e) {
    this.setData({ connectTimeout: e.detail.value });
  },

  onDisplayFormat(e) {
    this.setData({ displayFormatIdx: parseInt(e.detail.value) });
  },

  onDebugMode(e) {
    this.setData({ debugMode: e.detail.value });
  },

  saveSettings() {
    var toSave = {
      autoReconnect: this.data.autoReconnect,
      scanTimeout: this.data.scanTimeout,
      connectTimeout: this.data.connectTimeout,
      displayFormatIdx: this.data.displayFormatIdx,
      debugMode: this.data.debugMode
    };
    st.saveSettings(toSave);
    wx.showToast({ title: '已保存', icon: 'success' });
  },

  resetSettings() {
    var that = this;
    wx.showModal({
      title: '恢复默认',
      content: '将恢复所有设置为默认值，确定？',
      success: function(res) {
        if (res.confirm) {
          that.setData(WXML_DEFAULTS);
          st.saveSettings({});
          wx.showToast({ title: '已恢复默认', icon: 'success' });
        }
      }
    });
  },

  exportData() {
    var json = st.exportAll();
    wx.setClipboardData({
      data: json,
      success: function() {
        wx.showToast({ title: '已复制到剪贴板' });
      }
    });
  },

  importData() {
    var that = this;
    wx.getClipboardData({
      success: function(res) {
        try {
          st.importAll(res.data);
          wx.showToast({ title: '导入成功' });
          that.onLoad();
        } catch (e) {
          wx.showToast({ title: '数据格式错误', icon: 'none' });
        }
      },
      fail: function() {
        wx.showToast({ title: '请先复制数据到剪贴板', icon: 'none' });
      }
    });
  }
});
