Page({
  data: {
    tab: 'keys', keyDict: [], typeDict: [],
    newKeyName: '', newKeyValue: '', newType: ''
  },
  onShow() { this.loadDict(); },
  loadDict() {
    const keys = wx.getStorageSync('keyDict') || [];
    const types = wx.getStorageSync('typeDict') || [];
    this.setData({ keyDict: keys, typeDict: types });
  },
  onTab(e) { this.setData({ tab: e.currentTarget.dataset.tab }); },
  onNewKeyName(e) { this.setData({ newKeyName: e.detail.value }); },
  onNewKeyValue(e) { this.setData({ newKeyValue: e.detail.value }); },
  addKey() {
    if (!this.data.newKeyName || !this.data.newKeyValue) { wx.showToast({ title: '请填写完整', icon: 'none' }); return; }
    const keys = [...this.data.keyDict, { name: this.data.newKeyName, value: this.data.newKeyValue }];
    wx.setStorageSync('keyDict', keys);
    this.setData({ keyDict: keys, newKeyName: '', newKeyValue: '' });
  },
  removeKey(e) {
    const idx = e.currentTarget.dataset.index;
    const keys = this.data.keyDict.filter((_, i) => i !== idx);
    wx.setStorageSync('keyDict', keys);
    this.setData({ keyDict: keys });
  },
  onNewType(e) { this.setData({ newType: e.detail.value }); },
  addType() {
    if (!this.data.newType) { wx.showToast({ title: '请输入类型', icon: 'none' }); return; }
    const types = [...this.data.typeDict, this.data.newType];
    wx.setStorageSync('typeDict', types);
    this.setData({ typeDict: types, newType: '' });
  },
  removeType(e) {
    const idx = e.currentTarget.dataset.index;
    const types = this.data.typeDict.filter((_, i) => i !== idx);
    wx.setStorageSync('typeDict', types);
    this.setData({ typeDict: types });
  }
});
