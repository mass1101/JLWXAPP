import { StorageManager } from '../../services/storage-manager';

Page({
  data: { cards: [] },
  onShow() { this.loadCards(); },
  loadCards() {
    const cards = StorageManager.getCards() || [];
    this.setData({ cards });
  },
  addCard() {
    wx.showModal({
      title: '新建卡片', editable: true, placeholderText: '输入卡片ID',
      success: (res) => {
        if (res.confirm && res.content) {
          StorageManager.saveCard(res.content.trim(), { type: 'manual', createdAt: new Date().toISOString() });
          this.loadCards();
        }
      }
    });
  },
  viewCard(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/cards/detail?id=' + encodeURIComponent(id) });
  }
});
