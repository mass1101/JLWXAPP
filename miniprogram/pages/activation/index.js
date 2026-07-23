const act = require('../../services/activation');
const st = require('../../services/storage');
const { CHAMELEON_COMMANDS } = require('../../utils/constants');
const app = getApp();

Page({
  data: {
    chipId: '',
    inputCode: '',
    activated: false,
    activating: false,
    pollingDelay: null,
    pollingDelayInput: '',
    savingPolling: false,
    pollingMsg: '',
    pollingOk: false
  },

  onShow() {
    const bleService = app.globalData.bleService;
    const activated = act.isActivated();
    this.setData({ activated });

    if (bleService && bleService.isConnected) {
      this.loadChipId(bleService);
      this.loadPollingDelay(bleService);
    }
  },

  async loadChipId(bleService) {
    try {
      const result = await bleService.sendCommand(CHAMELEON_COMMANDS.GET_DEVICE_CHIP_ID, []);
      if (result && result.data && result.data.length > 0) {
        const hex = Array.from(result.data)
          .map(b => b.toString(16).padStart(2, '0'))
          .join('')
          .toUpperCase();
        this.setData({ chipId: hex });
      }
    } catch (e) {
      this.setData({ chipId: '' });
    }
  },

  async loadPollingDelay(bleService) {
    try {
      const result = await bleService.sendCommand(CHAMELEON_COMMANDS.GET_POLLING_DELAY, []);
      if (result && result.data && result.data.length > 0) {
        const delay = result.data[0];
        this.setData({ pollingDelay: delay, pollingDelayInput: String(delay) });
      }
    } catch (e) {
      this.setData({ pollingDelay: null, pollingMsg: '读取失败', pollingOk: false });
    }
  },

  onActCode(e) {
    const raw = e.detail.value;
    const formatted = act.formatActivationCode(act.cleanActivationCode(raw));
    this.setData({ inputCode: formatted });
  },

  onPollingInput(e) {
    this.setData({ pollingDelayInput: e.detail.value });
  },

  async activateDevice() {
    const bleService = app.globalData.bleService;
    if (!bleService || !bleService.isConnected) {
      wx.showToast({ title: '请先连接设备', icon: 'none' });
      return;
    }
    if (!this.data.chipId) {
      wx.showToast({ title: '无法获取设备 ID', icon: 'none' });
      return;
    }
    if (!this.data.inputCode.trim()) {
      wx.showToast({ title: '请输入激活码', icon: 'none' });
      return;
    }

    try {
      this.setData({ activating: true });
      const cleaned = act.cleanActivationCode(this.data.inputCode);
      const valid = act.validateActivationCode(this.data.chipId, cleaned);
      if (!valid) {
        wx.showToast({ title: '激活码无效', icon: 'none' });
        return;
      }
      act.saveActivation(this.data.chipId);
      app.globalData.slotCount = act.getEffectiveSlotCount();
      this.setData({ activated: true });
      wx.showToast({ title: '激活成功', icon: 'success' });
    } catch (err) {
      wx.showToast({ title: err.message || '激活失败', icon: 'none' });
    } finally {
      this.setData({ activating: false });
    }
  },

  async savePollingDelay() {
    const bleService = app.globalData.bleService;
    if (!bleService || !bleService.isConnected) {
      wx.showToast({ title: '请先连接设备', icon: 'none' });
      return;
    }
    const ms = parseInt(this.data.pollingDelayInput);
    if (isNaN(ms) || ms < 0) {
      wx.showToast({ title: '请输入有效毫秒值', icon: 'none' });
      return;
    }

    try {
      this.setData({ savingPolling: true, pollingMsg: '' });
      await bleService.sendCommand(CHAMELEON_COMMANDS.SET_POLLING_DELAY, [ms]);
      const settings = st.getSettings();
      settings.pollingDelay = ms;
      st.saveSettings(settings);
      this.setData({
        savingPolling: false,
        pollingDelay: ms,
        pollingMsg: '已保存',
        pollingOk: true
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
      title: '撤销激活',
      content: '确定撤销激活？',
      success: (res) => {
        if (res.confirm) {
          wx.setStorageSync('app_activated', false);
          wx.setStorageSync('app_activated_chip_id', '');
          app.globalData.slotCount = 8;
          this.setData({ activated: false });
          wx.showToast({ title: '已撤销激活' });
        }
      }
    });
  }
});
