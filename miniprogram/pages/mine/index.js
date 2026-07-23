import { StorageManager } from '../../services/storage-manager';

Page({
  data: { cardCount: 0, historyCount: 0 },
  onShow() {
    const cards = StorageManager.getCards() || [];
    const history = StorageManager.getHistory() || [];
    this.setData({ cardCount: cards.length, historyCount: history.length });
  },
  goPage(e) {
    const page = e.currentTarget.dataset.page;
    const routes = {
      cards: '/pages/cards/index', dictionary: '/pages/dictionary/index',
      settings: '/pages/settings/index', dfu: '/pages/dfu/index',
      activation: '/pages/activation/index', about: '/pages/about/index'
    };
    wx.navigateTo({ url: routes[page] || '/pages/mine/index' });
  },
  exportCards() {
    const cards = StorageManager.getCards();
    wx.setClipboardData({ data: JSON.stringify(cards), success() { wx.showToast({ title: '已复制到剪贴板' }); } });
  },
  importCards() {
    wx.showToast({ title: '功能开发中', icon: 'none' });
  },
  clearHistory() {
    wx.showModal({
      title: '确认清除',
      content: '将清除所有使用历史，确定？',
      success: (res) => {
        if (res.confirm) { StorageManager.clearHistory(); this.onShow(); wx.showToast({ title: '已清除' }); }
      }
    });
  }
});
