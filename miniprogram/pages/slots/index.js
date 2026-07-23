const { CHAMELEON_COMMANDS } = require('../../utils/constants');

Page({
  data: {
    ble: { connected: false },
    slots: [],
    gpio: { gpo: false, gpi: false }
  },

  onLoad() {
    this._app = getApp();
    this._ble = this._app.globalData.bleService;
  },

  onShow() {
    this._updateBleState();
    if (this._app.globalData.isConnected) {
      this.loadSlots();
    }
  },

  onConnectionStateChanged() {
    this._updateBleState();
    if (this._app.globalData.isConnected) {
      this.loadSlots();
    } else {
      this.setData({ slots: [] });
    }
  },

  _updateBleState() {
    this.setData({ 'ble.connected': this._app.globalData.isConnected });
  },

  async loadSlots() {
    if (!this._ble || !this._ble.isConnected) return;
    try {
      const slotCount = this._app.globalData.slotCount || 8;

      const enabledResult = await this._ble.sendCommand(CHAMELEON_COMMANDS.GET_ENABLED_SLOTS);
      const enabledData = enabledResult.data;
      const enabledBits = enabledData[0] || 0;
      const enabledBits2 = enabledData[1] || 0;

      const activeResult = await this._ble.sendCommand(CHAMELEON_COMMANDS.GET_ACTIVE_SLOT);
      const activeSlot = activeResult.data[0] || 0;

      const slots = [];
      for (let i = 0; i < slotCount; i++) {
        try {
          const infoResult = await this._ble.sendCommand(CHAMELEON_COMMANDS.GET_SLOT_INFO, [i]);
          const data = infoResult.data;
          const hfType = data[1] !== undefined ? String(data[1]) : '';
          const lfType = data[2] !== undefined ? String(data[2]) : '';
          const flagByte = data[3] !== undefined ? data[3] : 0;
          const hfEnabled = !!(flagByte & 0x01);
          const lfEnabled = !!(flagByte & 0x02);

          let nickname = '';
          try {
            const nickResult = await this._ble.sendCommand(CHAMELEON_COMMANDS.GET_SLOT_TAG_NICK, [i]);
            const nickData = nickResult.data;
            const filtered = nickData.filter(b => b > 0);
            nickname = String.fromCharCode.apply(null, filtered);
          } catch (e) { /* nickname load failed */ }

          slots.push({
            index: i,
            hfType,
            lfType,
            hfEnabled,
            lfEnabled,
            nickname,
            isActive: i === activeSlot
          });
        } catch (e) {
          slots.push({
            index: i,
            hfType: '',
            lfType: '',
            hfEnabled: false,
            lfEnabled: false,
            nickname: '',
            isActive: false
          });
        }
      }
      this.setData({ slots });
    } catch (e) {
      console.error('Load slots failed:', e);
      wx.showToast({ title: '加载卡槽失败', icon: 'none' });
    }
  },

  onSlotTap(e) {
    const idx = e.currentTarget.dataset.index;
    wx.navigateTo({ url: '/pages/slots/detail?slot=' + idx });
  },

  async toggleGPO() {
    const gpState = !this.data.gpio.gpo;
    this.setData({ 'gpio.gpo': gpState });
    wx.showToast({ title: 'GPO 已切换', icon: 'success' });
  }
});
