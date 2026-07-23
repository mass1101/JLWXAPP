import { StorageManager } from '../../services/storage-manager';

Page({
  data: { card: {} },
  onLoad(opts) {
    const id = decodeURIComponent(opts.id || '');
    const cards = StorageManager.getCards();
    const card = cards.find(c => c.id === id) || {};
    this.setData({ card });
  },
  writeCard() {
    wx.navigateTo({ url: '/pages/write/index?source=library&cardId=' + encodeURIComponent(this.data.card.id) });
  },
  deleteCard() {
    wx.showModal({
      title: '删除卡片', content: '确定删除？',
      success: (res) => {
        if (res.confirm) {
          const cards = StorageManager.getCards();
          const newCards = cards.filter(c => c.id !== this.data.card.id);
          wx.setStorageSync(StorageManager.KEYS.CARDS, newCards);
          wx.navigateBack();
        }
      }
    });
  }
});
