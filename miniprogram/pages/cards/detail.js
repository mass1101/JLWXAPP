const st = require('../../services/storage');

Page({
  data: {
    card: {}
  },

  onLoad(opts) {
    const id = decodeURIComponent(opts.id || '');
    const cards = st.getCards();
    const card = cards.find(function(c) { return c.id === id; });
    if (card) {
      this.setData({
        card: {
          id: card.id,
          type: card.type || '--',
          name: card.name || card.id,
          uid: card.uid || '',
          data: card.data || '',
          createdAt: card.created ? new Date(card.created).toLocaleString() : '--',
          modified: card.modified ? new Date(card.modified).toLocaleString() : ''
        }
      });
    } else {
      this.setData({ card: { id: id, type: '--', createdAt: '--' } });
    }
  },

  onNameInput(e) {
    this.setData({ 'card.name': e.detail.value });
  },

  saveName() {
    const id = this.data.card.id;
    const name = this.data.card.name;
    st.updateCard(id, { name: name });
    wx.showToast({ title: '名称已更新' });
  },

  copyUID() {
    const uid = this.data.card.uid;
    if (!uid) {
      wx.showToast({ title: '无 UID 数据', icon: 'none' });
      return;
    }
    wx.setClipboardData({
      data: uid,
      success() { wx.showToast({ title: 'UID 已复制' }); }
    });
  },

  copyData() {
    const data = this.data.card.data;
    if (!data) {
      wx.showToast({ title: '无数据内容', icon: 'none' });
      return;
    }
    wx.setClipboardData({
      data: data,
      success() { wx.showToast({ title: '数据已复制' }); }
    });
  },

  writeCard() {
    wx.navigateTo({
      url: '/pages/write/index?source=library&cardId=' + encodeURIComponent(this.data.card.id)
    });
  },

  deleteCard() {
    const id = this.data.card.id;
    wx.showModal({
      title: '删除卡片',
      content: '确定删除这张卡片？此操作不可撤销。',
      success: (res) => {
        if (res.confirm) {
          st.deleteCard(id);
          wx.showToast({ title: '已删除' });
          wx.navigateBack();
        }
      }
    });
  }
});
