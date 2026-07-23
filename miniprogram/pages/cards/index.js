const st = require('../../services/storage');

Page({
  data: {
    cards: [],
    filterType: '',
    searchQuery: ''
  },

  onShow() {
    this.loadCards();
  },

  loadCards() {
    const filter = {};
    if (this.data.filterType) filter.type = this.data.filterType;
    if (this.data.searchQuery) filter.search = this.data.searchQuery;
    const cards = st.getCards(Object.keys(filter).length ? filter : null);
    const mapped = cards.map(function(c) {
      return {
        id: c.id,
        type: c.type || '--',
        name: c.name || c.id,
        uid: c.uid,
        createdAt: c.created ? new Date(c.created).toLocaleString() : ''
      };
    });
    this.setData({ cards: mapped });
  },

  onFilterChange(e) {
    this.setData({ filterType: e.currentTarget.dataset.type || '' });
    this.loadCards();
  },

  onSearchInput(e) {
    this.setData({ searchQuery: e.detail.value });
    this.loadCards();
  },

  addCard() {
    wx.showModal({
      title: '新建卡片',
      editable: true,
      placeholderText: '输入卡片名称',
      success: (res) => {
        if (res.confirm && res.content) {
          st.saveCard({ name: res.content.trim(), type: 'manual', data: '' });
          this.loadCards();
          wx.showToast({ title: '已创建' });
        }
      }
    });
  },

  viewCard(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/cards/detail?id=' + encodeURIComponent(id) });
  },

  deleteCard(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '删除卡片',
      content: '确定删除这张卡片？',
      success: (res) => {
        if (res.confirm) {
          st.deleteCard(id);
          this.loadCards();
          wx.showToast({ title: '已删除' });
        }
      }
    });
  }
});
