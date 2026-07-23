import { BLEManager } from '../../services/ble-manager';

Page({
  data: {
    ble: { connected: false, deviceName: '' },
    deviceInfo: {},
    gpio: { gpo: false, gpi: false },
    batteryLevel: 0,
    scanResults: []
  },
  onShow() {
    this.stateListener = (state) => { this.setData({ ble: state }); };
    this.infoListener = (info) => { this.setData({ deviceInfo: info }); };
    this.batListener = (lv) => { this.setData({ batteryLevel: lv }); };
    BLEManager.on('state', this.stateListener);
    BLEManager.on('deviceInfo', this.infoListener);
    BLEManager.on('battery', this.batListener);
    this.setData({ ble: BLEManager.getState() });
  },
  onHide() {
    BLEManager.off('state', this.stateListener);
    BLEManager.off('deviceInfo', this.infoListener);
    BLEManager.off('battery', this.batListener);
  },
  connectDevice() {
    wx.showLoading({ title: '连接中...' });
    BLEManager.connect().then(() => {
      wx.hideLoading();
      wx.showToast({ title: '连接成功', icon: 'success' });
      return BLEManager.fetchDeviceInfo();
    }).catch(err => {
      wx.hideLoading();
      wx.showToast({ title: err.message || '连接失败', icon: 'none' });
    });
  },
  disconnectDevice() {
    BLEManager.disconnect();
  },
  scanDevices() {
    this.setData({ scanResults: [] });
    wx.showLoading({ title: '扫描中...' });
    BLEManager.scan().then(devices => {
      wx.hideLoading();
      this.setData({ scanResults: devices });
    }).catch(err => {
      wx.hideLoading();
      wx.showToast({ title: err.message, icon: 'none' });
    });
  },
  onDeviceTap(e) {
    const dev = this.data.scanResults[e.currentTarget.dataset.index];
    if (!dev) return;
    BLEManager.setDevice(dev);
    this.connectDevice();
  },
  goRead() { wx.navigateTo({ url: '/pages/read/index' }); },
  goWrite() { wx.navigateTo({ url: '/pages/write/index' }); },
  goSlots() { wx.switchTab({ url: '/pages/slots/index' }); },
  goTools() { wx.navigateTo({ url: '/pages/tools/index' }); }
});
