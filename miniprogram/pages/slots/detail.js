const { CHAMELEON_COMMANDS, TAG_TYPES } = require('../../utils/constants');

Page({
  data: {
    index: 0,
    nickname: '',
    hfType: '',
    lfType: '',
    hfEnabled: false,
    lfEnabled: false
  },

  onLoad(opts) {
    this._app = getApp();
    this._ble = this._app.globalData.bleService;
    const slotIdx = parseInt(opts.slot) || 0;
    this.setData({ index: slotIdx });
    this._loadSlotInfo();
  },

  async _loadSlotInfo() {
    if (!this._ble || !this._ble.isConnected) return;
    const idx = this.data.index;
    try {
      const infoResult = await this._ble.sendCommand(CHAMELEON_COMMANDS.GET_SLOT_INFO, [idx]);
      const data = infoResult.data;
      const hfType = data[1] !== undefined ? String(data[1]) : '';
      const lfType = data[2] !== undefined ? String(data[2]) : '';
      const flagByte = data[3] !== undefined ? data[3] : 0;
      const hfEnabled = !!(flagByte & 0x01);
      const lfEnabled = !!(flagByte & 0x02);

      let nickname = '';
      try {
        const nickResult = await this._ble.sendCommand(CHAMELEON_COMMANDS.GET_SLOT_TAG_NICK, [idx]);
        const nickData = nickResult.data;
        const filtered = nickData.filter(b => b > 0);
        nickname = String.fromCharCode.apply(null, filtered);
      } catch (e) { /* nickname load failed */ }

      this.setData({ hfType, lfType, hfEnabled, lfEnabled, nickname });
    } catch (e) {
      console.error('Load slot info failed:', e);
    }
  },

  onNickname(e) { this.setData({ nickname: e.detail.value }); },
  onHfType(e) { this.setData({ hfType: e.detail.value }); },
  onLfType(e) { this.setData({ lfType: e.detail.value }); },
  onHfEnabled(e) { this.setData({ hfEnabled: e.detail.value }); },
  onLfEnabled(e) { this.setData({ lfEnabled: e.detail.value }); },

  async saveSlot() {
    const idx = this.data.index;

    try {
      const hfTypeVal = parseInt(this.data.hfType) || 0;
      const lfTypeVal = parseInt(this.data.lfType) || 0;
      await this._ble.sendCommand(CHAMELEON_COMMANDS.SET_SLOT_TAG_TYPE, [idx, hfTypeVal, lfTypeVal]);

      const enableFlags = (this.data.hfEnabled ? 0x01 : 0) | (this.data.lfEnabled ? 0x02 : 0);
      await this._ble.sendCommand(CHAMELEON_COMMANDS.SET_SLOT_ENABLE, [idx, enableFlags]);

      if (this.data.nickname) {
        const nickBytes = [];
        for (let i = 0; i < this.data.nickname.length; i++) {
          nickBytes.push(this.data.nickname.charCodeAt(i));
        }
        await this._ble.sendCommand(CHAMELEON_COMMANDS.SET_SLOT_TAG_NICK, [idx, ...nickBytes]);
        await this._ble.sendCommand(CHAMELEON_COMMANDS.SAVE_SLOT_NICKS);
      }

      wx.showToast({ title: '已保存', icon: 'success' });
    } catch (e) {
      console.error('Save slot failed:', e);
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
  },

  goBack() { wx.navigateBack(); }
});
