const BLEService = require('./ble');
const Protocol = require('./protocol');
const { CHAMELEON_COMMANDS } = require('../utils/constants');

const COMMAND_MAP = {
  GET_VERSION:      CHAMELEON_COMMANDS.GET_APP_VERSION,
  GET_GIT_VERSION:  CHAMELEON_COMMANDS.GET_GIT_VERSION,
  GET_BATTERY:      CHAMELEON_COMMANDS.GET_BATTERY_CHARGE,
  GET_CHIP_ID:      CHAMELEON_COMMANDS.GET_DEVICE_CHIP_ID,
  GET_DEVICE_TYPE:  CHAMELEON_COMMANDS.GET_DEVICE_TYPE,
  GET_DEVICE_MODE:  CHAMELEON_COMMANDS.GET_DEVICE_MODE,
  SET_DEVICE_MODE:  CHAMELEON_COMMANDS.CHANGE_DEVICE_MODE,

  SLOT_SET_ACTIVE:  CHAMELEON_COMMANDS.SET_ACTIVE_SLOT,
  SLOT_GET_ACTIVE:  CHAMELEON_COMMANDS.GET_ACTIVE_SLOT,
  SLOT_GET_INFO:    CHAMELEON_COMMANDS.GET_SLOT_INFO,
  SLOT_SET_TYPE:    CHAMELEON_COMMANDS.SET_SLOT_TAG_TYPE,
  SLOT_SET_ENABLE:  CHAMELEON_COMMANDS.SET_SLOT_ENABLE,
  SLOT_SET_NICK:    CHAMELEON_COMMANDS.SET_SLOT_TAG_NICK,
  SLOT_GET_NICK:    CHAMELEON_COMMANDS.GET_SLOT_TAG_NICK,
  SLOT_SAVE_NICKS:  CHAMELEON_COMMANDS.SAVE_SLOT_NICKS,
  SLOT_GET_ALL_NICKS: CHAMELEON_COMMANDS.GET_ALL_SLOT_NICKS,

  HF14A_SCAN:       CHAMELEON_COMMANDS.SCAN_14A_TAG,
  MF1_READ_BLOCK:   CHAMELEON_COMMANDS.MF1_READ_BLOCK,
  MF1_WRITE_BLOCK:  CHAMELEON_COMMANDS.MF1_WRITE_BLOCK,
  MF1_READ_SECTOR:  CHAMELEON_COMMANDS.MF1_READ_SECTOR,
  MF1_WRITE_SECTOR: CHAMELEON_COMMANDS.MF1_WRITE_SECTOR,
  MF1_CHECK_KEY:    CHAMELEON_COMMANDS.MF1_CHECK_KEY,
  MF1_CHECK_KEYS:   CHAMELEON_COMMANDS.MF1_CHECK_KEYS_ON_BLOCK,
  MF1_NESTED:       CHAMELEON_COMMANDS.MF1_NESTED_ACQUIRE,
  MF1_DARKSIDE:     CHAMELEON_COMMANDS.MF1_DARKSIDE_ACQUIRE,
  MF1_NT_LEVEL:     CHAMELEON_COMMANDS.MF1_NT_LEVEL_DETECT,
  MF1_STATIC_NESTED:CHAMELEON_COMMANDS.MF1_STATIC_NESTED_ACQUIRE,
  MF1_DETECT_ENABLE:CHAMELEON_COMMANDS.MF1_SET_DETECTION_ENABLE,

  HF_SNIFF:         CHAMELEON_COMMANDS.HF14A_SNIFF,
  HF_SNIFF_STOP:    CHAMELEON_COMMANDS.HF14A_SNIFF_STOP,
  LF_SNIFF:         CHAMELEON_COMMANDS.LF_SNIFF,
  LF_SNIFF_STOP:    CHAMELEON_COMMANDS.LF_SNIFF_STOP,

  LF_EM410X_READ:   CHAMELEON_COMMANDS.EM410X_READ,
  LF_EM410X_WRITE:  CHAMELEON_COMMANDS.EM410X_WRITE,
  LF_EM410X_T55XX:  CHAMELEON_COMMANDS.EM410X_WRITE_TO_T55XX,

  NTAG_READ_PAGE:   CHAMELEON_COMMANDS.MF0_READ_PAGE,
  NTAG_WRITE_PAGE:  CHAMELEON_COMMANDS.MF0_WRITE_PAGE,
  NTAG_DETECT_ENABLE: CHAMELEON_COMMANDS.MF0_NTAG_SET_DETECTION_ENABLE,

  ENTER_BOOTLOADER: CHAMELEON_COMMANDS.ENTER_BOOTLOADER,
  SAVE_SETTINGS:    CHAMELEON_COMMANDS.SAVE_SETTINGS,
  RESET_SETTINGS:   CHAMELEON_COMMANDS.RESET_SETTINGS,
  FACTORY_RESET:    CHAMELEON_COMMANDS.FACTORY_RESET,

  GET_CAPABILITIES: CHAMELEON_COMMANDS.GET_DEVICE_CAPABILITIES,
  GET_DEVICE_SETTINGS: CHAMELEON_COMMANDS.GET_DEVICE_SETTINGS,

  SET_SLEEP_TIMEOUT: CHAMELEON_COMMANDS.SET_SLEEP_TIMEOUT,
  GET_SLEEP_TIMEOUT: CHAMELEON_COMMANDS.GET_SLEEP_TIMEOUT,

  GET_POLLING_DELAY: CHAMELEON_COMMANDS.GET_POLLING_DELAY,
  SET_POLLING_DELAY: CHAMELEON_COMMANDS.SET_POLLING_DELAY,

  SET_ANIMATION:    CHAMELEON_COMMANDS.SET_ANIMATION_MODE,
  GET_ANIMATION:    CHAMELEON_COMMANDS.GET_ANIMATION_MODE,

  BUTTON_PRESS_GET: CHAMELEON_COMMANDS.GET_BUTTON_PRESS_CONFIG,
  BUTTON_PRESS_SET: CHAMELEON_COMMANDS.SET_BUTTON_PRESS_CONFIG,
  BUTTON_LONG_GET:  CHAMELEON_COMMANDS.GET_LONG_BUTTON_PRESS_CONFIG,
  BUTTON_LONG_SET:  CHAMELEON_COMMANDS.SET_LONG_BUTTON_PRESS_CONFIG,

  MFKEY32_DETECT:   CHAMELEON_COMMANDS.MFKEY32_SET_DETECT,
  MFKEY32_NONCES:   CHAMELEON_COMMANDS.MFKEY32_GET_NONCES,

  BLE_SET_KEY:      CHAMELEON_COMMANDS.BLE_SET_CONNECT_KEY,
  BLE_GET_KEY:      CHAMELEON_COMMANDS.BLE_GET_CONNECT_KEY,
  BLE_CLEAR_BONDED: CHAMELEON_COMMANDS.BLE_CLEAR_BONDED_DEVICES,
  BLE_PAIR_ENABLE_GET: CHAMELEON_COMMANDS.BLE_GET_PAIR_ENABLE,
  BLE_PAIR_ENABLE_SET: CHAMELEON_COMMANDS.BLE_SET_PAIR_ENABLE,
  BLE_GET_ADDRESS:  CHAMELEON_COMMANDS.GET_DEVICE_BLE_ADDRESS
};

function buildPayload(cmdName, params = {}) {
  switch (cmdName) {
    case 'SLOT_SET_ACTIVE':
      return [(params.slot || 0) & 0xFF];
    case 'SLOT_GET_INFO':
      return [(params.slot || 0) & 0xFF];
    case 'SLOT_SET_TYPE':
      return [(params.slot || 0) & 0xFF, (params.hfType || 0) & 0xFF, (params.lfType || 0) & 0xFF];
    case 'SLOT_SET_ENABLE':
      return [(params.slot || 0) & 0xFF, params.hfEnable ? 1 : 0, params.lfEnable ? 1 : 0];
    case 'SLOT_SET_NICK': {
      const nick = (params.nickname || '').substring(0, 32);
      const bytes = [(params.slot || 0) & 0xFF];
      for (let i = 0; i < nick.length; i++) bytes.push(nick.charCodeAt(i) & 0xFF);
      return bytes;
    }
    case 'SLOT_GET_NICK':
      return [(params.slot || 0) & 0xFF];

    case 'HF14A_SCAN':
      return [(params.slot || 0) & 0xFF];
    case 'MF1_READ_BLOCK':
      return [(params.slot || 0) & 0xFF, (params.block || 0) & 0xFF, (params.keyType || 0) & 0xFF];
    case 'MF1_WRITE_BLOCK': {
      const data = hexToBytes(params.data || '');
      const header = [(params.slot || 0) & 0xFF, (params.block || 0) & 0xFF, (params.keyType || 0) & 0xFF];
      return header.concat(data.slice(0, 16));
    }
    case 'MF1_READ_SECTOR':
      return [(params.slot || 0) & 0xFF, (params.sector || 0) & 0xFF, (params.keyType || 0) & 0xFF];
    case 'MF1_WRITE_SECTOR': {
      const data = hexToBytes(params.data || '');
      return [(params.slot || 0) & 0xFF, (params.sector || 0) & 0xFF, (params.keyType || 0) & 0xFF].concat(data);
    }
    case 'MF1_CHECK_KEY':
      return [(params.slot || 0) & 0xFF, (params.block || 0) & 0xFF, (params.keyType || 0) & 0xFF].concat(hexToBytes(params.key || ''));
    case 'MF1_CHECK_KEYS': {
      const keys = params.keys || [];
      const bytes = [(params.slot || 0) & 0xFF, (params.block || 0) & 0xFF, (params.keyType || 0) & 0xFF, keys.length & 0xFF];
      keys.forEach(k => bytes.push(...hexToBytes(k).slice(0, 6)));
      return bytes;
    }

    case 'LF_EM410X_READ':
      return [(params.slot || 0) & 0xFF];
    case 'LF_EM410X_WRITE': {
      const data = hexToBytes(params.data || '');
      return [(params.slot || 0) & 0xFF].concat(data.slice(0, 5));
    }

    case 'NTAG_READ_PAGE':
      return [(params.slot || 0) & 0xFF, (params.page || 0) & 0xFF];
    case 'NTAG_WRITE_PAGE': {
      const data = hexToBytes(params.data || '');
      return [(params.slot || 0) & 0xFF, (params.page || 0) & 0xFF].concat(data.slice(0, 4));
    }

    case 'SET_DEVICE_MODE':
      return [(params.mode || 0) & 0xFF];

    case 'SET_SLEEP_TIMEOUT':
      return [(params.timeout || 0) & 0xFF];
    case 'SET_POLLING_DELAY': {
      const ms = (params.delay || params.ms || 0);
      return [(ms >> 8) & 0xFF, ms & 0xFF];
    }
    case 'SET_ANIMATION':
      return [(params.mode || 0) & 0xFF];
    case 'BUTTON_PRESS_SET':
      return [(params.config || 0) & 0xFF];
    case 'BUTTON_LONG_SET':
      return [(params.config || 0) & 0xFF];

    case 'BLE_PAIR_ENABLE_SET':
      return [params.enable ? 1 : 0];
    case 'BLE_SET_KEY': {
      const key = hexToBytes(params.key || '');
      return key.slice(0, 16);
    }

    case 'MFKEY32_DETECT':
      return [params.enable ? 1 : 0];

    case 'MF1_NESTED':
    case 'MF1_DARKSIDE':
    case 'MF1_STATIC_NESTED':
      return [(params.slot || 0) & 0xFF, (params.block || 0) & 0xFF, (params.keyType || 0) & 0xFF];

    default:
      return [];
  }
}

function hexToBytes(hex) {
  const clean = (hex || '').replace(/\s/g, '');
  const bytes = [];
  for (let i = 0; i < clean.length; i += 2) {
    const b = parseInt(clean.substring(i, i + 2), 16);
    if (!isNaN(b)) bytes.push(b);
  }
  return bytes;
}

function parseCommandName(key) {
  for (const k of Object.keys(CHAMELEON_COMMANDS)) {
    if (CHAMELEON_COMMANDS[k] === key) return k;
  }
  return 'UNKNOWN';
}

const events = {};

class BLEManagerClass {
  constructor() {
    this._service = new BLEService();
    this._state = { connected: false, deviceName: '', fwVersion: '', deviceModel: '', chipId: '' };
  }

  on(event, callback) {
    if (!events[event]) events[event] = [];
    events[event].push(callback);

    if (event === 'state') {
      this._service.onConnectionStateChanged((s) => {
        this._state.connected = s && s.state === 'connected';
        if (s && s.deviceId) this._state.deviceId = s.deviceId;
        events['state'] && events['state'].forEach(cb => cb({ ...this._state }));
      });
    }
  }

  off(event, callback) {
    if (events[event]) events[event] = events[event].filter(cb => cb !== callback);
  }

  emit(event, data) {
    if (events[event]) events[event].forEach(cb => cb(data));
  }

  getState() { return { ...this._state }; }

  setDevice(dev) {
    this._device = dev;
    this._state.deviceName = dev.name || dev.deviceId;
  }

  scan() {
    return new Promise((resolve, reject) => {
      let done = false;
      this._service.initBluetooth()
        .then(() => {
          this._service.startScan(5000, (devices, err) => {
            if (done) return;
            if (err) { done = true; reject(err); return; }
            done = true;
            resolve(devices || []);
          });
        })
        .catch((e) => { if (!done) { done = true; reject(e); } });
    });
  }

  connect() {
    return new Promise((resolve, reject) => {
      this._service.initBluetooth()
        .then(() => {
          if (this._device) {
            return this._service.connect(this._device.deviceId, this._device.isDFU || false);
          }
          return new Promise((r, rj) => {
            let connected = false;
            this._service.startScan(3000, (devices, err) => {
              if (connected) return;
              if (err || !devices || !devices.length) {
                connected = true;
                rj(new Error('未发现设备'));
                return;
              }
              connected = true;
              this._service.connect(devices[0].deviceId, devices[0].isDFU || false)
                .then(r).catch((e) => rj(e));
            });
          });
        })
        .then(() => {
          this._state.connected = true;
          this.emit('state', { ...this._state });
          this._service.onDataReceived(() => {});
          resolve();
        })
        .catch(reject);
    });
  }

  disconnect() {
    this._service.disconnect();
    this._state.connected = false;
    this.emit('state', { ...this._state });
  }

  async customCommand(cmdName, params = {}) {
    const cmdId = COMMAND_MAP[cmdName];
    if (cmdId === undefined) throw new Error(`未知命令: ${cmdName}`);
    const payload = buildPayload(cmdName, params);

    const result = await this._service.sendCommand(cmdId, payload);

    if (result && result.data) {
      result.dataHex = result.hex || '';
      result.dataText = String.fromCharCode.apply(null, result.data.filter(b => b >= 32 && b < 127));
    }

    return result;
  }

  async cmdRead(cmdName, params = {}) {
    const result = await this.customCommand(cmdName, params);
    return result;
  }

  async fetchDeviceInfo() {
    try {
      const resp = await this.customCommand('GET_VERSION');
      if (resp && resp.data) {
        const ver = resp.data.filter(b => b >= 32 && b < 127);
        this._state.fwVersion = String.fromCharCode.apply(null, ver);
      }
    } catch (e) { /* ignore */ }

    try {
      const resp = await this.customCommand('GET_CHIP_ID');
      if (resp && resp.dataHex) {
        this._state.chipId = resp.dataHex;
      }
    } catch (e) { /* ignore */ }

    try {
      const resp = await this.customCommand('GET_DEVICE_TYPE');
      if (resp && resp.dataText) {
        this._state.deviceModel = resp.dataText;
      }
    } catch (e) { /* ignore */ }

    try {
      const resp = await this.customCommand('GET_BATTERY');
      if (resp && resp.data && resp.data.length > 0) {
        this._state.batteryLevel = resp.data[0];
        this.emit('battery', resp.data[0]);
      }
    } catch (e) { /* ignore */ }

    this.emit('deviceInfo', { ...this._state });
    return this._state;
  }
}

module.exports = {
  BLEManager: new BLEManagerClass(),
  COMMAND_MAP
};
