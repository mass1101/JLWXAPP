const bleService = require('./services/ble');

App({
  globalData: {
    bleService: null,
    protocol: null,
    storage: null,
    activation: null,
    backup: null,
    isConnected: false,
    currentDevice: null,
    connectionType: null,
    isDFU: false,
    chipId: null,
    appVersion: null,
    gitVersion: null,
    batteryLevel: null,
    activeSlot: 0,
    deviceMode: 0,
    slotCount: 8
  },

  onLaunch() {
    const storage = require('./services/storage');
    const activation = require('./services/activation');
    this.globalData.storage = storage;
    this.globalData.activation = activation;
    this.globalData.slotCount = activation.getEffectiveSlotCount();
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
