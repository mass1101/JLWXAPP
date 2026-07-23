import { ActivationManager } from '../../services/activation-manager';
import { BLEManager } from '../../services/ble-manager';

Page({
  data: {
    serial: '', fwVersion: '', activated: false,
    actCode: '', activating: false, licenses: [],
    pollingDelay: null, pollingInput: '', savingPolling: false,
    pollingMsg: '', pollingOk: false
  },
  onShow() {
    const serial = wx.getStorageSync('deviceSerial') || '';
    const fwVersion = wx.getStorageSync('deviceFwVersion') || '';
    this.setData({ serial, fwVersion });
    this.loadActivation();
    this.loadPollingDelay();
  },
  loadActivation() {
    const actData = ActivationManager.getActivationData();
    this.setData({
      activated: actData.activated || false,
      licenses: actData.licenses || []
    });
  },
  async loadPollingDelay() {
    if (!BLEManager.getState().connected) return;
    try {
      const resp = await BLEManager.customCommand('GET_POLLING_DELAY');
      if (resp && resp.data && resp.data.length >= 2) {
        const delay = (resp.data[0] << 8) | resp.data[1];
        this.setData({ pollingDelay: delay, pollingInput: String(delay) });
      }
    } catch (e) {
      this.setData({ pollingDelay: null, pollingMsg: '读取失败', pollingOk: false });
    }
  },
  onActCode(e) { this.setData({ actCode: e.detail.value }); },
  onPollingInput(e) { this.setData({ pollingInput: e.detail.value }); },
  async activateDevice() {
    if (!this.data.actCode.trim()) { wx.showToast({ title: '请输入激活码', icon: 'none' }); return; }
    try {
      this.setData({ activating: true });
      const result = await ActivationManager.activate(this.data.actCode.trim());
      wx.showToast({ title: '激活成功', icon: 'success' });
      this.setData({ activated: true, licenses: result.licenses || [] });
    } catch (err) {
      wx.showToast({ title: err.message || '激活失败', icon: 'none' });
    } finally {
      this.setData({ activating: false });
    }
  },
  async savePollingDelay() {
    const ms = parseInt(this.data.pollingInput);
    if (isNaN(ms) || ms < 0) { wx.showToast({ title: '请输入有效毫秒值', icon: 'none' }); return; }
    if (!BLEManager.getState().connected) { wx.showToast({ title: '请先连接设备', icon: 'none' }); return; }
    try {
      this.setData({ savingPolling: true, pollingMsg: '' });
      await BLEManager.customCommand('SET_POLLING_DELAY', { delay: ms, ms: ms });
      await BLEManager.customCommand('SAVE_SETTINGS');
      this.setData({
        savingPolling: false, pollingDelay: ms,
        pollingMsg: '已保存并持久化到设备 flash', pollingOk: true
      });
    } catch (err) {
      this.setData({
        savingPolling: false,
        pollingMsg: '保存失败: ' + (err.message || err),
        pollingOk: false
      });
    }
  },
  deactivateDevice() {
    wx.showModal({
      title: '撤销激活', content: '确定撤销激活？',
      success: (res) => {
        if (res.confirm) {
          ActivationManager.deactivate();
          this.setData({ activated: false, licenses: [] });
          wx.showToast({ title: '已撤销激活' });
        }
      }
    });
  }
});
