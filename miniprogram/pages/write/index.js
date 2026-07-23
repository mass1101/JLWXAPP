import { BLEManager } from '../../services/ble-manager';
import { StorageManager } from '../../services/storage-manager';
import { ErrorHandler } from '../../services/error-handler';

Page({
  data: {
    ble: { connected: false },
    writeMode: 'hf', slotIndex: 0, source: 'manual',
    slotRange: Array.from({ length: 8 }, (_, i) => '槽位 ' + (i + 1)),
    hexData: '', blockNum: '0', keyTypes: ['Key A (0x60)', 'Key B (0x61)'], keyTypeIdx: 0,
    historyRange: [], historyLabel: '', libraryRange: [], libraryLabel: '',
    writing: false, writeLog: null,
    historyData: [], libraryData: []
  },
  onShow() {
    this.stateListener = (s) => { this.setData({ ble: s }); };
    BLEManager.on('state', this.stateListener);
    this.setData({ ble: BLEManager.getState() });
  },
  onHide() { BLEManager.off('state', this.stateListener); },
  onWriteMode(e) { this.setData({ writeMode: e.currentTarget.dataset.mode }); },
  onSlotPick(e) { this.setData({ slotIndex: parseInt(e.detail.value) }); },
  onSource(e) {
    const source = e.currentTarget.dataset.source;
    this.setData({ source });
    if (source === 'history') { this.loadHistory(); }
    if (source === 'library') { this.loadLibrary(); }
  },
  onHexData(e) { this.setData({ hexData: e.detail.value }); },
  onBlockNum(e) { this.setData({ blockNum: e.detail.value }); },
  onKeyType(e) { this.setData({ keyTypeIdx: parseInt(e.detail.value) }); },
  loadHistory() {
    const list = StorageManager.getHistory() || [];
    this.setData({ historyData: list, historyRange: list.map(h => new Date(h.timestamp).toLocaleString()) });
  },
  loadLibrary() {
    const list = StorageManager.getCards() || [];
    this.setData({ libraryData: list, libraryRange: list.map(c => c.id || 'Unknown') });
  },
  onHistoryPick(e) {
    const item = this.data.historyData[parseInt(e.detail.value)];
    this.setData({ historyLabel: item ? new Date(item.timestamp).toLocaleString() : '' });
  },
  onLibraryPick(e) {
    const item = this.data.libraryData[parseInt(e.detail.value)];
    this.setData({ libraryLabel: item?.id || '' });
  },
  previewData() {
    wx.showModal({ title: '预览数据', content: this.data.hexData || '(空)', showCancel: false });
  },
  async startWrite() {
    try {
      if (!this.data.hexData.trim()) { wx.showToast({ title: '请输入数据', icon: 'none' }); return; }
      this.setData({ writing: true, writeLog: null });

      const params = {
        slot: this.data.slotIndex,
        block: parseInt(this.data.blockNum) || 0,
        keyType: this.data.keyTypeIdx === 0 ? 0x60 : 0x61,
        data: this.data.hexData
      };

      let result;
      if (this.data.writeMode === 'hf') {
        result = await BLEManager.customCommand('MF1_WRITE_BLOCK', params);
      } else {
        result = await BLEManager.customCommand('LF_EM410X_WRITE', params);
      }

      this.setData({ writing: false, writeLog: JSON.stringify(result, null, 2) });
      wx.showToast({ title: '写入完成', icon: 'success' });
    } catch (err) {
      this.setData({ writing: false });
      ErrorHandler.show(err);
    }
  }
});
