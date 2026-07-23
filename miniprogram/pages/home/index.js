const { CHAMELEON_COMMANDS } = require('../../utils/constants');

Page({
  data: {
    ble: { connected: false, deviceName: '' },
    deviceInfo: {},
    gpio: { gpo: false, gpi: false },
    batteryLevel: 0,
    scanResults: []
  },

  onLoad() {
    this._app = getApp();
    this._ble = this._app.globalData.bleService;
  },

  onShow() {
    this._updateBleState();
  },

  onConnectionStateChanged() {
    this._updateBleState();
  },

  _updateBleState() {
    const connected = this._app.globalData.isConnected;
    this.setData({ 'ble.connected': connected });
    if (connected && !this._fetched) {
      this._fetchDeviceInfo();
    }
    if (!connected) {
      this._fetched = false;
      this.setData({ deviceInfo: {}, batteryLevel: 0 });
    }
  },

  async _fetchDeviceInfo() {
    if (!this._ble || !this._ble.isConnected) return;
    try {
      const typeResult = await this._ble.sendCommand(CHAMELEON_COMMANDS.GET_DEVICE_TYPE);
      const typeData = typeResult.data;
      const deviceType = typeData[0] || 0;
      const model = deviceType === 0 ? 'Ultra' : 'Lite';

      const verResult = await this._ble.sendCommand(CHAMELEON_COMMANDS.GET_APP_VERSION);
      const verData = verResult.data;
      const fwVersion = Array.from(verData).slice(0, 4).join('.');

      const batResult = await this._ble.sendCommand(CHAMELEON_COMMANDS.GET_BATTERY_CHARGE);
      const batData = batResult.data;
      const batteryLevel = batData[0] || 0;

      this.setData({
        deviceInfo: { model, fwVersion },
        batteryLevel
      });
      this._fetched = true;
    } catch (e) {
      console.error('Fetch device info failed:', e);
    }
  },

  connectDevice() {
    if (!this._ble || this._ble.isConnected) return;
    if (!this._connectTarget) {
      wx.showToast({ title: '请先扫描设备', icon: 'none' });
      return;
    }
    wx.showLoading({ title: '连接中...' });
    this._ble.initBluetooth().then(() => {
      return this._ble.connect(this._connectTarget.deviceId, this._connectTarget.isDFU || false);
    }).then(() => {
      wx.hideLoading();
      this._app.globalData.isConnected = true;
      this._app.globalData.currentDevice = this._connectTarget.deviceId;
      this._fetched = false;
      this._updateBleState();
      wx.showToast({ title: '连接成功', icon: 'success' });
    }).catch(err => {
      wx.hideLoading();
      wx.showToast({ title: err.message || '连接失败', icon: 'none' });
    });
  },

  disconnectDevice() {
    this._app.disconnect();
  },

  scanDevices() {
    if (!this._ble) return;
    this.setData({ scanResults: [] });
    this._ble.initBluetooth().then(() => {
      this._ble.startScan(5000, (devices, err) => {
        if (err) {
          wx.showToast({ title: err.message || '扫描失败', icon: 'none' });
          return;
        }
        this.setData({ scanResults: this._formatDevices(devices) });
      });
    }).catch(err => {
      wx.showToast({ title: err.message || '蓝牙初始化失败', icon: 'none' });
    });
  },

  _formatDevices(devices) {
    return devices.map(d => ({
      name: d.name || 'Unknown',
      deviceId: d.deviceId || '',
      RSSI: d.RSSI !== undefined ? d.RSSI : 0,
      isDFU: d.isDFU || false
    }));
  },

  onDeviceTap(e) {
    const idx = e.currentTarget.dataset.index;
    const dev = this.data.scanResults[idx];
    if (!dev) return;
    this._ble.stopScan();
    this._connectTarget = dev;
    this.connectDevice();
  },

  goRead() { wx.switchTab({ url: '/pages/read/index' }); },
  goWrite() { wx.switchTab({ url: '/pages/write/index' }); },
  goSlots() { wx.switchTab({ url: '/pages/slots/index' }); },
  goTools() { wx.navigateTo({ url: '/pages/tools/index' }); }
});
