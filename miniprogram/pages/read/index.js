const st = require('../../services/storage');
const { CHAMELEON_COMMANDS } = require('../../utils/constants');

Page({
  data: {
    ble: { connected: false },
    mode: 'hf',
    slotIndex: 0,
    slotRange: [],
    reading: false,
    cardData: null
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

  setMode(e) {
    this.setData({ mode: e.currentTarget.dataset.mode });
  },

  onSlotPick(e) {
    this.setData({ slotIndex: parseInt(e.detail.value) });
  },

  async startRead() {
    if (!this._ble || !this._ble.isConnected) {
      wx.showToast({ title: '请先连接设备', icon: 'none' });
      return;
    }
    try {
      this.setData({ reading: true, cardData: null });
      let resultText = '';

      if (this.data.mode === 'hf') {
        const scanResult = await this._ble.sendCommand(CHAMELEON_COMMANDS.SCAN_14A_TAG);
        const scanData = scanResult.data;
        const uid = this._bytesToHex(scanData.slice(0, 4));
        let blocksText = '';
        for (let block = 0; block < 64; block++) {
          try {
            const readResult = await this._ble.sendCommand(CHAMELEON_COMMANDS.MF1_READ_BLOCK, [block]);
            blocksText += 'Block ' + block + ': ' + this._bytesToHex(readResult.data) + '\n';
          } catch (e) {
            break;
          }
        }
        resultText = 'UID: ' + uid + '\n\n' + blocksText;
      } else if (this.data.mode === 'lf') {
        const lfResult = await this._ble.sendCommand(CHAMELEON_COMMANDS.EM410X_READ);
        resultText = this._bytesToHex(lfResult.data);
      } else if (this.data.mode === 'both') {
        let hfText = '';
        let lfText = '';
        try {
          const scanResult = await this._ble.sendCommand(CHAMELEON_COMMANDS.SCAN_14A_TAG);
          const uid = this._bytesToHex(scanResult.data.slice(0, 4));
          let blocksText = '';
          for (let block = 0; block < 64; block++) {
            try {
              const readResult = await this._ble.sendCommand(CHAMELEON_COMMANDS.MF1_READ_BLOCK, [block]);
              blocksText += 'Block ' + block + ': ' + this._bytesToHex(readResult.data) + '\n';
            } catch (e) { break; }
          }
          hfText = '[HF]\nUID: ' + uid + '\n' + blocksText;
        } catch (e) {
          hfText = '[HF] 读取失败: ' + e.message;
        }
        try {
          const lfResult = await this._ble.sendCommand(CHAMELEON_COMMANDS.EM410X_READ);
          lfText = '[LF]\n' + this._bytesToHex(lfResult.data);
        } catch (e) {
          lfText = '[LF] 读取失败: ' + e.message;
        }
        resultText = hfText + '\n\n' + lfText;
      }

      this.setData({ cardData: resultText, reading: false });
    } catch (err) {
      this.setData({ reading: false });
      wx.showToast({ title: err.message || '读取失败', icon: 'none' });
    }
  },

  stopRead() {
    this.setData({ reading: false });
  },

  _bytesToHex(bytes) {
    if (!bytes || bytes.length === 0) return '';
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
  },

  copyResult() {
    wx.setClipboardData({
      data: this.data.cardData,
      success() { wx.showToast({ title: '已复制' }); }
    });
  },

  saveResult() {
    const card = {
      name: 'Read_' + new Date().toLocaleString(),
      type: 'read',
      mode: this.data.mode,
      data: this.data.cardData
    };
    st.saveCard(card);
    wx.showToast({ title: '已保存到卡库', icon: 'success' });
  }
});
