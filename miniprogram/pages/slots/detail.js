import { BLEManager } from '../../services/ble-manager';

Page({
  data: { index: 0, nickname: '', hfType: '', lfType: '', hfEnabled: false, lfEnabled: false },
  onLoad(opts) {
    const index = parseInt(opts.index) || 0;
    const saved = wx.getStorageSync('slot_' + index);
    this.setData({ index, ...(saved || {}) });
  },
  onNickname(e) { this.setData({ nickname: e.detail.value }); },
  onHfType(e) { this.setData({ hfType: e.detail.value }); },
  onLfType(e) { this.setData({ lfType: e.detail.value }); },
  onHfEnabled(e) { this.setData({ hfEnabled: e.detail.value }); },
  onLfEnabled(e) { this.setData({ lfEnabled: e.detail.value }); },
  async saveSlot() {
    const idx = this.data.index;
    const hfTypeVal = parseInt(this.data.hfType) || 0;
    const lfTypeVal = parseInt(this.data.lfType) || 0;

    wx.setStorageSync('slot_' + idx, {
      nickname: this.data.nickname, hfType: this.data.hfType,
      lfType: this.data.lfType, hfEnabled: this.data.hfEnabled,
      lfEnabled: this.data.lfEnabled
    });

    try {
      await BLEManager.customCommand('SLOT_SET_TYPE', { slot: idx, hfType: hfTypeVal, lfType: lfTypeVal });
      await BLEManager.customCommand('SLOT_SET_ENABLE', { slot: idx, hfEnable: this.data.hfEnabled, lfEnable: this.data.lfEnabled });
      if (this.data.nickname) {
        await BLEManager.customCommand('SLOT_SET_NICK', { slot: idx, nickname: this.data.nickname });
        await BLEManager.customCommand('SLOT_SAVE_NICKS');
      }
    } catch (e) {
      // 硬件写入失败时仅本地保存
    }

    wx.showToast({ title: '已保存', icon: 'success' });
  },
  goBack() { wx.navigateBack(); }
});
