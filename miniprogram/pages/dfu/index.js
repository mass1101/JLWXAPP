import { BLEManager } from '../../services/ble-manager';
import { ErrorHandler } from '../../services/error-handler';
import { ActivationManager } from '../../services/activation-manager';

const FW_80SLOT_URL = 'https://github.com/mass1101/hosts/raw/refs/heads/main/ultra-dfu-full.zip';

Page({
  data: {
    ble: { connected: false }, fwVersion: '', deviceModel: '', bootVersion: '',
    fwFile: null, fwSource: '', inProgress: false, steps: [], errorMsg: '',
    activated: false
  },
  onShow() {
    this.stateListener = (s) => {
      this.setData({ ble: s, fwVersion: s.fwVersion || '', deviceModel: s.deviceModel || '' });
    };
    BLEManager.on('state', this.stateListener);
    this.setData({ ble: BLEManager.getState() });
    const actData = ActivationManager.getActivationData();
    this.setData({ activated: actData.activated || false });
  },
  onHide() { BLEManager.off('state', this.stateListener); },

  selectFirmware() {
    wx.showToast({ title: '请在开发者工具中手动选择文件', icon: 'none' });
    this.setData({ fwSource: 'local', fwFile: { name: 'firmware.bin', size: 524288 } });
  },

  start80SlotDFU() {
    this.setData({
      fwSource: '80slot',
      fwFile: { name: 'ultra-dfu-full.zip', size: 0, url: FW_80SLOT_URL }
    });
    wx.showToast({ title: '80卡槽固件已就绪，点击开始升级', icon: 'none' });
  },

  async startDFU() {
    const sourceLabel = this.data.fwSource === '80slot' ? '80卡槽固件' : '固件';
    try {
      this.setData({ inProgress: true, steps: [], errorMsg: '' });

      this.addStep('正在进入 Bootloader 模式...', 'active');
      await BLEManager.customCommand('ENTER_BOOTLOADER');
      this.addStep('已进入 Bootloader 模式', 'done');

      this.addStep('正在传输' + sourceLabel + '数据...', 'active');

      if (this.data.fwSource === '80slot') {
        await this.download80SlotFirmware();
      }

      this.addStep(sourceLabel + '传输完成，请重新以 DFU 模式连接设备完成刷写', 'done');
      this.setData({ inProgress: false });
      wx.showToast({ title: '已进入 Bootloader', icon: 'success' });
    } catch (err) {
      const msg = '升级失败: ' + (err.message || '未知错误');
      this.setData({ inProgress: false, errorMsg: msg });
      this.addStep(msg, 'error');
      ErrorHandler.show(err);
    }
  },

  download80SlotFirmware() {
    return new Promise((resolve, reject) => {
      wx.downloadFile({
        url: FW_80SLOT_URL,
        success: (res) => {
          if (res.statusCode === 200) {
            resolve(res.tempFilePath);
          } else {
            reject(new Error('下载失败'));
          }
        },
        fail: () => { reject(new Error('下载失败')); }
      });
    });
  },

  addStep(text, status) {
    const steps = [...this.data.steps, { text, status }];
    this.setData({ steps });
  },

  cancelDFU() { this.setData({ fwSource: '', fwFile: null, inProgress: false, steps: [] }); }
});
