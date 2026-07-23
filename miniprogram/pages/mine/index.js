const st = require('../../services/storage');
const act = require('../../services/activation');

Page({
  data: {
    cardCount: 0,
    historyCount: 0,
    activated: false,
    connected: false,
    slotCount: 8
  },

  onShow() {
    const cards = st.getCards();
    const app = getApp();
    const connected = app.globalData.bleService ? app.globalData.bleService.isConnected : false;
    this.setData({
      cardCount: cards.length,
      historyCount: 0,
      activated: act.isActivated(),
      connected: connected,
      slotCount: act.getEffectiveSlotCount()
    });
  },

  goPage(e) {
    const page = e.currentTarget.dataset.page;
    const routes = {
      cards: '/pages/cards/index',
      dictionary: '/pages/dictionary/index',
      settings: '/pages/settings/index',
      dfu: '/pages/dfu/index',
      tools: '/pages/tools/index',
      activation: '/pages/activation/index',
      about: '/pages/about/index'
    };
    wx.navigateTo({ url: routes[page] || '/pages/mine/index' });
  },

  exportCards() {
    const json = st.exportAll();
    wx.setClipboardData({
      data: json,
      success() { wx.showToast({ title: '已复制到剪贴板' }); }
    });
  },

  importCards() {
    wx.getClipboardData({
      success: (res) => {
        try {
          st.importAll(res.data);
          wx.showToast({ title: '导入成功' });
          this.onShow();
        } catch (e) {
          wx.showToast({ title: '数据格式错误', icon: 'none' });
        }
      },
      fail() {
        wx.showToast({ title: '请先复制数据到剪贴板', icon: 'none' });
      }
    });
  },

  clearHistory() {
    wx.showModal({
      title: '确认清除',
      content: '将清除所有使用历史，确定？',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({ title: '已清除' });
          this.onShow();
        }
      }
    });
  }
});
