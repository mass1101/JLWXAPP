const act = require('../../services/activation');
const st = require('../../services/storage');
const { CHAMELEON_COMMANDS, BLE_UUIDS } = require('../../utils/constants');

const FW_80SLOT_URL = 'https://raw.githubusercontent.com/RfidResearchGroup/ChameleonUltra/main/firmware/ChameleonUltra-80Slots.bin';

Page({
  data: {
    connected: false,
    fwVersion: '',
    deviceModel: '',
    bootVersion: '',
    fwSource: '',
    fwFile: null,
    activated: false,
    updating: false,
    progress: 0,
    statusText: '',
    steps: [],
    errorMsg: ''
  },

  onShow() {
    const app = getApp();
    const bleService = app.globalData.bleService;
    const connected = bleService ? bleService.isConnected : false;
    const activated = act.isActivated();
    const activatedChipId = act.getActivatedChipId();
    const storedChipId = st.getChipId();
    const is80SlotAvailable = activated && storedChipId && activatedChipId === storedChipId;

    this.setData({ connected, activated, is80SlotAvailable });

    if (bleService) {
      bleService.onConnectionStateChanged((info) => {
        this.setData({ connected: info.state === 'connected' });
      });
    }

    if (connected && bleService) {
      this.loadDeviceInfo(bleService);
    }
  },

  async loadDeviceInfo(bleService) {
    try {
      const verResult = await bleService.sendCommand(CHAMELEON_COMMANDS.GET_APP_VERSION, []);
      if (verResult && verResult.data && verResult.data.length > 0) {
        const verBytes = Array.from(verResult.data);
        this.setData({ fwVersion: verBytes.join('.') });
      }
    } catch (e) {
      // 静默失败
    }
  },

  selectFirmware() {
    wx.showToast({ title: '请在开发者工具中手动选择文件', icon: 'none' });
    this.setData({ fwSource: 'local', fwFile: { name: 'firmware.bin', size: 524288 } });
  },

  start80SlotDFU() {
    this.setData({
      fwSource: '80slot',
      fwFile: { name: 'ultra-dfu.bin', size: 0 }
    });
    wx.showToast({ title: '80卡槽固件已就绪，点击开始升级', icon: 'none' });
  },

  async startDFU() {
    const app = getApp();
    const bleService = app.globalData.bleService;
    if (!bleService || !bleService.isConnected) {
      wx.showToast({ title: '请先连接设备', icon: 'none' });
      return;
    }

    const sourceLabel = this.data.fwSource === '80slot' ? '80卡槽固件' : '固件';

    try {
      this.setData({ updating: true, progress: 0, steps: [], errorMsg: '', statusText: '' });

      this.addStep('正在进入 Bootloader 模式...', 'active');
      await bleService.sendCommand(CHAMELEON_COMMANDS.ENTER_BOOTLOADER, []);
      this.addStep('已进入 Bootloader 模式', 'done');

      const deviceId = bleService.deviceId;
      this.addStep('正在断开主连接...', 'active');
      app.disconnect();
      this.addStep('已断开主连接', 'done');

      this.addStep('等待设备重启...', 'active');
      await new Promise(resolve => setTimeout(resolve, 2000));
      this.addStep('设备已就绪', 'done');

      this.addStep('正在连接 DFU 模式...', 'active');
      await bleService.connect(deviceId, true);
      this.addStep('DFU 模式连接成功', 'done');

      this.addStep('正在传输固件数据...', 'active');
      await this.transferFirmware(bleService);

      this.addStep(sourceLabel + '升级完成，请重启设备', 'done');
      this.setData({ updating: false, progress: 100, statusText: '升级完成' });
      wx.showToast({ title: '升级完成', icon: 'success' });
    } catch (err) {
      const msg = '升级失败: ' + (err.message || '未知错误');
      this.setData({ updating: false, errorMsg: msg });
      this.addStep(msg, 'error');
    }
  },

  async transferFirmware(bleService) {
    if (this.data.fwSource === '80slot') {
      return this.downloadAndTransfer80Slot(bleService);
    }
    if (this.data.fwFile && this.data.fwFile.size) {
      wx.showToast({ title: '请在开发者工具中手动传输固件', icon: 'none' });
    }
  },

  downloadAndTransfer80Slot(bleService) {
    return new Promise((resolve, reject) => {
      wx.downloadFile({
        url: FW_80SLOT_URL,
        success: (res) => {
          if (res.statusCode === 200) {
            const fs = wx.getFileSystemManager();
            try {
              const data = fs.readFileSync(res.tempFilePath);
              this.sendFirmwareChunks(bleService, data).then(resolve).catch(reject);
            } catch (e) {
              reject(new Error('固件读取失败'));
            }
          } else {
            reject(new Error('固件下载失败'));
          }
        },
        fail: () => {
          reject(new Error('固件下载失败'));
        }
      });
    });
  },

  async sendFirmwareChunks(bleService, data) {
    const CHUNK_SIZE = 20;
    const totalChunks = Math.ceil(data.length / CHUNK_SIZE);
    const serviceId = BLE_UUIDS.DFU_SERVICE;
    const charId = BLE_UUIDS.DFU_FIRMWARE;

    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
      const chunk = data.slice(i, Math.min(i + CHUNK_SIZE, data.length));
      await new Promise((resolve, reject) => {
        wx.writeBLECharacteristicValue({
          deviceId: bleService.deviceId,
          serviceId: serviceId,
          characteristicId: charId,
          value: chunk.buffer,
          success: resolve,
          fail: reject
        });
      });
      const progress = Math.round(((i + CHUNK_SIZE) / data.length) * 100);
      this.setData({ progress: Math.min(progress, 100), statusText: '传输中 ' + Math.min(progress, 100) + '%' });
    }
  },

  addStep(text, status) {
    const steps = [...this.data.steps, { text, status }];
    this.setData({ steps });
  },

  cancelDFU() {
    this.setData({ fwSource: '', fwFile: null, updating: false, progress: 0, steps: [], errorMsg: '', statusText: '' });
  }
});
