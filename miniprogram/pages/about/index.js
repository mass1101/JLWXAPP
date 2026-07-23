Page({
  data: { version: '1.0.0' },
  openRepo() {
    wx.setClipboardData({ data: 'https://github.com/proxmark3-miniapp/PM3Assistant', success() { wx.showToast({ title: '链接已复制' }); } });
  }
});
