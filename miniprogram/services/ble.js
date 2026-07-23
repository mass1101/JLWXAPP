const { BLE_UUIDS } = require('../utils/constants');
const { arraybufferToHex } = require('../utils/hex');

const STATE = { IDLE: 'idle', SCANNING: 'scanning', CONNECTING: 'connecting', CONNECTED: 'connected', DISCONNECTING: 'disconnecting' };

class BLEService {
  constructor() {
    this._state = STATE.IDLE;
    this._deviceId = null;
    this._isDFU = false;
    this._txChar = null;
    this._rxChar = null;
    this._fwChar = null;
    this._dataCallback = null;
    this._stateCallback = null;
    this._scanCallback = null;
    this._retryCount = 0;
    this._maxRetries = 5;
    this._pendingCommands = [];
    this._isProcessing = false;
    this._cmdTimeout = 5000;
  }

  get state() { return this._state; }
  get isConnected() { return this._state === STATE.CONNECTED; }
  get deviceId() { return this._deviceId; }
  get isDFU() { return this._isDFU; }

  // ========== 蓝牙适配器初始化 ==========
  initBluetooth() {
    return new Promise((resolve, reject) => {
      wx.openBluetoothAdapter({
        success: () => resolve(),
        fail: (err) => {
          if (err.errCode === 10001) {
            wx.showModal({
              title: '蓝牙未开启',
              content: '请在系统设置中开启蓝牙',
              confirmText: '去开启',
              success: (res) => {
                if (res.confirm) wx.openSystemBluetoothSetting();
              }
            });
          }
          reject(err);
        }
      });
    });
  }

  // ========== 设备扫描 ==========
  startScan(timeoutMs = 3000, callback) {
    if (this._state === STATE.SCANNING) return;
    this._state = STATE.SCANNING;
    this._scanCallback = callback;
    this._foundDevices = [];

    wx.startBluetoothDevicesDiscovery({
      services: [BLE_UUIDS.NRF_SERVICE, BLE_UUIDS.DFU_SERVICE],
      allowDuplicatesKey: false,
      interval: 0,
      success: () => {
        wx.onBluetoothDeviceFound((res) => {
          res.devices.forEach(device => {
            if (!device.name) return;
            const name = device.name;
            const isChameleon = name.startsWith('ChameleonUltra') ||
                                name.startsWith('ChameleonLite') ||
                                name.startsWith('CU-') ||
                                name.startsWith('CL-');
            if (!isChameleon) return;
            const exists = this._foundDevices.find(d => d.deviceId === device.deviceId);
            if (exists) return;
            const entry = {
              deviceId: device.deviceId,
              name: device.name,
              RSSI: device.RSSI,
              isDFU: name.startsWith('CU-') || name.startsWith('CL-'),
              device: name.startsWith('ChameleonLite') || name.startsWith('CL-') ? 'Lite' : 'Ultra'
            };
            this._foundDevices.push(entry);
            if (this._scanCallback) this._scanCallback([...this._foundDevices]);
          });
        });
        setTimeout(() => this.stopScan(), timeoutMs);
      },
      fail: (err) => {
        this._state = STATE.IDLE;
        if (callback) callback([], err);
      }
    });
  }

  stopScan() {
    wx.stopBluetoothDevicesDiscovery();
    wx.offBluetoothDeviceFound();
    this._state = STATE.IDLE;
    if (this._scanCallback) {
      this._scanCallback(this._foundDevices || [], null);
      this._scanCallback = null;
    }
  }

  // ========== 设备连接 ==========
  connect(deviceId, isDFU = false) {
    this._state = STATE.CONNECTING;
    this._deviceId = deviceId;
    this._isDFU = isDFU;
    this._retryCount = 0;
    this._notifyState();

    return this._connectInternal();
  }

  _connectInternal() {
    return new Promise((resolve, reject) => {
      wx.createBLEConnection({
        deviceId: this._deviceId,
        timeout: 10000,
        success: () => {
          setTimeout(() => this._discoverServices(resolve, reject), 500);
        },
        fail: (err) => {
          this._retryCount++;
          if (this._retryCount < this._maxRetries) {
            setTimeout(() => this._connectInternal().then(resolve).catch(reject), 1000);
          } else {
            this._state = STATE.IDLE;
            this._notifyState();
            reject(err);
          }
        }
      });
    });
  }

  _discoverServices(resolve, reject) {
    wx.getBLEDeviceServices({
      deviceId: this._deviceId,
      success: (res) => {
        const targetService = this._isDFU ? BLE_UUIDS.DFU_SERVICE : BLE_UUIDS.NRF_SERVICE;
        const svc = res.services.find(s => s.uuid.toUpperCase() === targetService.toUpperCase() ||
                                           s.uuid.toUpperCase().includes(targetService.toUpperCase()));
        if (!svc) { reject(new Error('Service not found')); return; }
        this._discoverCharacteristics(svc.uuid, resolve, reject);
      },
      fail: reject
    });
  }

  _discoverCharacteristics(serviceId, resolve, reject) {
    wx.getBLEDeviceCharacteristics({
      deviceId: this._deviceId,
      serviceId: serviceId,
      success: (res) => {
        if (this._isDFU) this._setupDFU(res.characteristics, resolve, reject);
        else this._setupUART(res.characteristics, resolve, reject);
      },
      fail: reject
    });
  }

  _setupUART(characteristics, resolve, reject) {
    const txUuid = BLE_UUIDS.UART_TX.toUpperCase();
    const rxUuid = BLE_UUIDS.UART_RX.toUpperCase();
    const txChar = characteristics.find(c => c.uuid.toUpperCase() === txUuid);
    const rxChar = characteristics.find(c => c.uuid.toUpperCase() === rxUuid);

    if (!txChar || !rxChar) { reject(new Error('UART characteristics not found')); return; }

    this._txChar = txChar;
    this._rxChar = rxChar;

    const listenerRegistered = (res) => {
      if (res && res.characteristicId === txChar.uuid && this._dataCallback) {
        this._dataCallback(new Uint8Array(res.value));
      }
    };

    const sendHandshake = () => {
      const handshake = new Uint8Array([0x11, 0xEF, 0x03, 0xFB, 0x00, 0x00, 0x00, 0x00, 0x02, 0x00]);
      wx.writeBLECharacteristicValue({
        deviceId: this._deviceId,
        serviceId: BLE_UUIDS.NRF_SERVICE,
        characteristicId: rxChar.uuid,
        value: handshake.buffer,
        success: () => {
          this._state = STATE.CONNECTED;
          this._notifyState();
          resolve();
        },
        fail: (err) => {
          this._state = STATE.IDLE;
          this._notifyState();
          reject(err);
        }
      });
    };

    const tryNotify = () => {
      wx.notifyBLECharacteristicValueChange({
        deviceId: this._deviceId,
        serviceId: BLE_UUIDS.NRF_SERVICE,
        characteristicId: txChar.uuid,
        state: true,
        success: () => {
          wx.onBLECharacteristicValueChange(listenerRegistered);
          sendHandshake();
        },
        fail: (notifyErr) => {
          tryMonitorWithoutNotify();
        }
      });
    };

    const tryMonitorWithoutNotify = () => {
      wx.onBLECharacteristicValueChange(listenerRegistered);
      wx.writeBLECharacteristicValue({
        deviceId: this._deviceId,
        serviceId: BLE_UUIDS.NRF_SERVICE,
        characteristicId: rxChar.uuid,
        value: new Uint8Array([0x01, 0x00]).buffer,
        success: () => {
          setTimeout(sendHandshake, 300);
        },
        fail: () => {
          sendHandshake();
        }
      });
    };

    if (txChar.properties && !(txChar.properties.notify || txChar.properties.indicate)) {
      tryMonitorWithoutNotify();
    } else {
      tryNotify();
    }
  }

  _setupDFU(characteristics, resolve, reject) {
    const ctrlUuid = BLE_UUIDS.DFU_CONTROL.toUpperCase();
    const fwUuid = BLE_UUIDS.DFU_FIRMWARE.toUpperCase();
    const ctrlChar = characteristics.find(c => c.uuid.toUpperCase() === ctrlUuid);
    const fwChar = characteristics.find(c => c.uuid.toUpperCase() === fwUuid);
    if (!ctrlChar || !fwChar) { reject(new Error('DFU characteristics not found')); return; }

    this._txChar = ctrlChar;
    this._fwChar = fwChar;
    this._rxChar = ctrlChar;

    wx.notifyBLECharacteristicValueChange({
      deviceId: this._deviceId,
      serviceId: BLE_UUIDS.DFU_SERVICE,
      characteristicId: ctrlChar.uuid,
      state: true,
      success: () => {
        wx.onBLECharacteristicValueChange((res) => {
          if (res.characteristicId === ctrlChar.uuid && this._dataCallback) {
            this._dataCallback(new Uint8Array(res.value));
          }
        });
        this._state = STATE.CONNECTED;
        this._notifyState();
        resolve();
      },
      fail: reject
    });
  }

  // ========== 断开连接 ==========
  disconnect() {
    this._state = STATE.DISCONNECTING;
    this._notifyState();
    if (this._deviceId) {
      wx.closeBLEConnection({ deviceId: this._deviceId });
    }
    wx.closeBluetoothAdapter();
    wx.offBLECharacteristicValueChange();
    this._deviceId = null;
    this._txChar = null;
    this._rxChar = null;
    this._fwChar = null;
    this._pendingCommands = [];
    this._isProcessing = false;
    this._state = STATE.IDLE;
    this._notifyState();
  }

  // ========== 命令发送 ==========
  sendCommand(cmdId, payload = []) {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) { reject(new Error('Not connected')); return; }
      const protocol = require('./protocol');
      const frame = protocol.buildFrame(cmdId, payload);
      const buffer = new Uint8Array(frame).buffer;
      const charId = this._isDFU && this._fwChar ? this._fwChar.uuid : this._rxChar.uuid;
      const serviceId = this._isDFU ? BLE_UUIDS.DFU_SERVICE : BLE_UUIDS.NRF_SERVICE;

      const cmd = {
        cmdId, resolve, reject,
        timeout: setTimeout(() => {
          const idx = this._pendingCommands.indexOf(cmd);
          if (idx >= 0) this._pendingCommands.splice(idx, 1);
          reject(new Error(`Command ${cmdId.toString(16)} timeout`));
        }, this._cmdTimeout)
      };
      this._pendingCommands.push(cmd);

      wx.writeBLECharacteristicValue({
        deviceId: this._deviceId,
        serviceId: serviceId,
        characteristicId: charId,
        value: buffer,
        fail: (err) => {
          clearTimeout(cmd.timeout);
          const idx = this._pendingCommands.indexOf(cmd);
          if (idx >= 0) this._pendingCommands.splice(idx, 1);
          reject(err);
        }
      });
    });
  }

  handleResponse(bytes) {
    const protocol = require('./protocol');
    const result = protocol.parseFrame(bytes);
    if (result && this._pendingCommands.length > 0) {
      const cmd = this._pendingCommands.shift();
      clearTimeout(cmd.timeout);
      if (result.status === 0) cmd.resolve(result);
      else cmd.reject(new Error(`Command failed: status=${result.status}`));
    }
  }

  // ========== 回调注册 ==========
  onDataReceived(callback) {
    this._dataCallback = (bytes) => {
      this.handleResponse(bytes);
      if (callback) callback(bytes);
    };
  }

  onConnectionStateChanged(callback) {
    this._stateCallback = callback;
  }

  _notifyState() {
    if (this._stateCallback) {
      this._stateCallback({ state: this._state, deviceId: this._deviceId, isDFU: this._isDFU });
    }
  }
}

module.exports = BLEService;
