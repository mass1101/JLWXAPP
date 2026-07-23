const BLEService = require('./services/ble');
const storage = require('./services/storage');
const activation = require('./services/activation');

App({
  globalData: {
    bleService: null,
    storage: storage,
    activation: activation,
    isConnected: false,
    currentDevice: null,
    isDFU: false,
    chipId: null,
    batteryLevel: null,
    activeSlot: 0,
    deviceMode: 0,
    slotCount: 8
  },

  onLaunch() {
    this.globalData.bleService = new BLEService();
    this.globalData.slotCount = activation.getEffectiveSlotCount();
    this.globalData.bleService.onConnectionStateChanged((info) => {
      const wasConnected = this.globalData.isConnected;
      this.globalData.isConnected = info.state === 'connected';
      this.globalData.isDFU = info.isDFU || false;
      this.globalData.currentDevice = info.deviceId || null;
      if (wasConnected !== this.globalData.isConnected) {
        this.notifyPages();
      }
    });
  },

  onShow() {
    if (this.globalData.bleService) {
      const connected = this.globalData.bleService.isConnected;
      if (connected !== this.globalData.isConnected) {
        this.globalData.isConnected = connected;
        this.notifyPages();
      }
    }
  },

  disconnect() {
    if (this.globalData.bleService) {
      this.globalData.bleService.disconnect();
      this.globalData.isConnected = false;
      this.globalData.currentDevice = null;
      this.globalData.chipId = null;
      this.notifyPages();
    }
  },

  notifyPages() {
    const pages = getCurrentPages();
    pages.forEach(page => {
      if (page.onConnectionStateChanged) {
        page.onConnectionStateChanged();
      }
    });
  }
});
