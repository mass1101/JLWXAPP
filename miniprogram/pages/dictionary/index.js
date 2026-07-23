const st = require('../../services/storage');

Page({
  data: {
    tab: 'keys',
    keyDict: [],
    typeDict: [],
    newKeyName: '',
    newKeyValue: '',
    newType: ''
  },

  onShow() {
    this.loadDict();
  },

  loadDict() {
    var keyDict = st.getDictionary('keys');
    var typeDict = st.getDictionary('types');
    this.setData({ keyDict: keyDict, typeDict: typeDict });
  },

  onTab(e) {
    this.setData({ tab: e.currentTarget.dataset.tab });
  },

  onNewKeyName(e) {
    this.setData({ newKeyName: e.detail.value });
  },

  onNewKeyValue(e) {
    this.setData({ newKeyValue: e.detail.value });
  },

  addKey() {
    if (!this.data.newKeyName || !this.data.newKeyValue) {
      wx.showToast({ title: '请填写完整', icon: 'none' });
      return;
    }
    var keys = st.getDictionary('keys');
    keys.push({ name: this.data.newKeyName, value: this.data.newKeyValue });
    st.saveDictionary('keys', keys);
    this.setData({ keyDict: keys, newKeyName: '', newKeyValue: '' });
    wx.showToast({ title: '已添加' });
  },

  removeKey(e) {
    var idx = e.currentTarget.dataset.index;
    var keys = st.getDictionary('keys');
    keys = keys.filter(function(_, i) { return i !== idx; });
    st.saveDictionary('keys', keys);
    this.setData({ keyDict: keys });
  },

  onNewType(e) {
    this.setData({ newType: e.detail.value });
  },

  addType() {
    if (!this.data.newType) {
      wx.showToast({ title: '请输入类型', icon: 'none' });
      return;
    }
    var types = st.getDictionary('types');
    types.push(this.data.newType);
    st.saveDictionary('types', types);
    this.setData({ typeDict: types, newType: '' });
    wx.showToast({ title: '已添加' });
  },

  removeType(e) {
    var idx = e.currentTarget.dataset.index;
    var types = st.getDictionary('types');
    types = types.filter(function(_, i) { return i !== idx; });
    st.saveDictionary('types', types);
    this.setData({ typeDict: types });
  }
});
