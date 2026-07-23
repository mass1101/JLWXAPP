import { BLEManager } from '../../services/ble-manager';

Page({
  data: {
    ble: { connected: false },
    slots: [],
    gpio: { gpo: false, gpi: false }
  },
  onShow() {
    this.stateListener = (s) => { this.setData({ ble: s }); };
    BLEManager.on('state', this.stateListener);
    this.setData({ ble: BLEManager.getState() });
    if (BLEManager.getState().connected) this.loadSlots();
  },
  onHide() { BLEManager.off('state', this.stateListener); },
  async loadSlots() {
    const count = 8;
    const slots = [];
    for (let i = 0; i < count; i++) {
      try {
        const resp = await BLEManager.customCommand('SLOT_GET_INFO', { slot: i });
        const data = resp && resp.data ? resp.data : [];
        slots.push({
          hfType: data[1] !== undefined ? String(data[1]) : '',
          lfType: data[2] !== undefined ? String(data[2]) : '',
          hfEnabled: !!(data[3] & 0x01),
          lfEnabled: !!(data[3] & 0x02),
          nickname: ''
        });
      } catch (e) {
        const saved = wx.getStorageSync('slot_' + i);
        slots.push(saved || { hfType: '', lfType: '', hfEnabled: false, lfEnabled: false, nickname: '' });
      }
    }
    try {
      const nickResp = await BLEManager.customCommand('SLOT_GET_ALL_NICKS');
      if (nickResp && nickResp.data) {
        const data = nickResp.data;
        for (let i = 0; i < count; i++) {
          const off = i * 32;
          const nickBytes = data.slice(off, off + 32).filter(b => b > 0);
          slots[i].nickname = String.fromCharCode.apply(null, nickBytes);
        }
      }
    } catch (e) { /* nick load failed, skip */ }
    this.setData({ slots });
  },
  onSlotTap(e) {
    const idx = e.currentTarget.dataset.index;
    wx.navigateTo({ url: '/pages/slots/detail?index=' + idx });
  },
  async toggleGPO() {
    const gpState = !this.data.gpio.gpo;
    this.setData({ 'gpio.gpo': gpState });
    wx.showToast({ title: 'GPO 已切换', icon: 'success' });
  }
});
