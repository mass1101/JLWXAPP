import { BLEManager } from '../../services/ble-manager';
import { StorageManager } from '../../services/storage-manager';
import { ErrorHandler } from '../../services/error-handler';

Page({
  data: {
    ble: { connected: false },
    mode: 'hf',
    slotIndex: 0,
    slotRange: Array.from({ length: 8 }, (_, i) => '槽位 ' + (i + 1)),
    reading: false,
    cardData: null
  },
  onShow() {
    this.stateListener = (s) => { this.setData({ ble: s }); };
    BLEManager.on('state', this.stateListener);
    this.setData({ ble: BLEManager.getState() });
  },
  onHide() { BLEManager.off('state', this.stateListener); },
  setMode(e) { this.setData({ mode: e.currentTarget.dataset.mode }); },
  onSlotPick(e) { this.setData({ slotIndex: parseInt(e.detail.value) }); },
  async startRead() {
    try {
      this.setData({ reading: true, cardData: null });
      let result;

      if (this.data.mode === 'lf') {
        result = await BLEManager.customCommand('LF_EM410X_READ', { slot: this.data.slotIndex });
      } else if (this.data.mode === 'both') {
        const hfResult = await BLEManager.customCommand('HF14A_SCAN', { slot: this.data.slotIndex });
        const lfResult = await BLEManager.customCommand('LF_EM410X_READ', { slot: this.data.slotIndex });
        result = { hf: hfResult, lf: lfResult };
      } else {
        result = await BLEManager.customCommand('HF14A_SCAN', { slot: this.data.slotIndex });
      }

      const text = JSON.stringify(result, null, 2);
      this.setData({ cardData: text, reading: false });
      await StorageManager.addHistory({ type: 'read', mode: this.data.mode, data: result, timestamp: Date.now() });
    } catch (err) {
      this.setData({ reading: false });
      ErrorHandler.show(err);
    }
  },
  stopRead() { this.setData({ reading: false }); },
  copyResult() {
    wx.setClipboardData({ data: this.data.cardData, success() { wx.showToast({ title: '已复制' }); } });
  },
  saveResult() {
    const id = 'RD_' + Date.now();
    StorageManager.saveCard(id, { type: 'read', mode: this.data.mode, data: this.data.cardData });
    wx.showToast({ title: '已保存到卡库', icon: 'success' });
  }
});
