const st = require('../../services/storage');
const { CHAMELEON_COMMANDS } = require('../../utils/constants');

Page({
  data: {
    ble: { connected: false },
    writeMode: 'hf',
    slotIndex: 0,
    source: 'manual',
    slotRange: [],
    hexData: '',
    blockNum: '0',
    keyTypes: ['Key A (0x60)', 'Key B (0x61)'],
    keyTypeIdx: 0,
    historyRange: [],
    historyLabel: '',
    libraryRange: [],
    libraryLabel: '',
    writing: false,
    writeLog: null,
    historyData: [],
    libraryData: []
  },

  onLoad() {
    this._app = getApp();
    this._ble = this._app.globalData.bleService;
    const count = this._app.globalData.slotCount || 8;
    const range = [];
    for (let i = 0; i < count; i++) {
      range.push('槽位 ' + (i + 1));
    }
    this.setData({ slotRange: range });
  },

  onShow() {
    this._updateBleState();
  },

  onConnectionStateChanged() {
    this._updateBleState();
  },

  _updateBleState() {
    this.setData({ 'ble.connected': this._app.globalData.isConnected });
  },

  onWriteMode(e) {
    this.setData({ writeMode: e.currentTarget.dataset.mode });
  },

  onSlotPick(e) {
    this.setData({ slotIndex: parseInt(e.detail.value) });
  },

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
    try {
      const cards = st.getCards({ type: 'read' });
      this.setData({
        historyData: cards,
        historyRange: cards.map(h => h.name || (h.id ? h.id.substring(0, 8) : 'Unknown'))
      });
    } catch (e) {
      this.setData({ historyData: [], historyRange: [] });
    }
  },

  loadLibrary() {
    try {
      const cards = st.getCards();
      this.setData({
        libraryData: cards,
        libraryRange: cards.map(c => c.name || c.id || 'Unknown')
      });
    } catch (e) {
      this.setData({ libraryData: [], libraryRange: [] });
    }
  },

  onHistoryPick(e) {
    const item = this.data.historyData[parseInt(e.detail.value)];
    if (item) {
      this.setData({
        historyLabel: item.name || item.id || '',
        hexData: item.data || ''
      });
    }
  },

  onLibraryPick(e) {
    const item = this.data.libraryData[parseInt(e.detail.value)];
    if (item) {
      this.setData({
        libraryLabel: item.name || item.id || '',
        hexData: item.data || ''
      });
    }
  },

  _hexToBytes(hexStr) {
    hexStr = hexStr.replace(/\s/g, '');
    const bytes = [];
    for (let i = 0; i < hexStr.length; i += 2) {
      bytes.push(parseInt(hexStr.substring(i, i + 2), 16) || 0);
    }
    return bytes;
  },

  previewData() {
    wx.showModal({
      title: '预览数据',
      content: this.data.hexData || '(空)',
      showCancel: false
    });
  },

  async startWrite() {
    if (!this._ble || !this._ble.isConnected) {
      wx.showToast({ title: '请先连接设备', icon: 'none' });
      return;
    }
    const hexStr = this.data.hexData.trim();
    if (!hexStr) {
      wx.showToast({ title: '请输入数据', icon: 'none' });
      return;
    }
    try {
      this.setData({ writing: true, writeLog: null });
      const dataBytes = this._hexToBytes(hexStr);
      let result;

      if (this.data.writeMode === 'hf') {
        const blockNum = parseInt(this.data.blockNum) || 0;
        const keyType = this.data.keyTypeIdx === 0 ? 0x60 : 0x61;
        result = await this._ble.sendCommand(CHAMELEON_COMMANDS.MF1_WRITE_BLOCK, [blockNum, keyType, ...dataBytes]);
      } else if (this.data.writeMode === 'lf') {
        result = await this._ble.sendCommand(CHAMELEON_COMMANDS.EM410X_WRITE_TO_T55XX, dataBytes);
      }

      this.setData({
        writing: false,
        writeLog: '写入成功\n命令: 0x' + result.commandId.toString(16).toUpperCase() + '\n状态: ' + result.status
      });
      wx.showToast({ title: '写入完成', icon: 'success' });
    } catch (err) {
      this.setData({ writing: false });
      wx.showToast({ title: err.message || '写入失败', icon: 'none' });
    }
  }
});
