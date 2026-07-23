// BLE UUID 常量
const BLE_UUIDS = {
  NRF_SERVICE: '6E400001-B5A3-F393-E0A9-E50E24DCCA9E',
  UART_TX: '6E400002-B5A3-F393-E0A9-E50E24DCCA9E',
  UART_RX: '6E400003-B5A3-F393-E0A9-E50E24DCCA9E',
  DFU_SERVICE: '0000FE59-0000-1000-8000-00805F9B34FB',
  DFU_CONTROL: '8EC90001-F315-4F60-9FB8-838830DAEA50',
  DFU_FIRMWARE: '8EC90002-F315-4F60-9FB8-838830DAEA50'
};

// Chameleon 命令 ID
const CHAMELEON_COMMANDS = {
  // 基础命令
  GET_APP_VERSION: 0x1000,
  CHANGE_DEVICE_MODE: 0x1001,
  GET_DEVICE_MODE: 0x1002,
  GET_GIT_VERSION: 0x1017,
  GET_BATTERY_CHARGE: 0x1025,

  // 卡槽命令
  SET_ACTIVE_SLOT: 0x1003,
  SET_SLOT_TAG_TYPE: 0x1004,
  SET_SLOT_DATA_DEFAULT: 0x1005,
  SET_SLOT_ENABLE: 0x1006,
  SET_SLOT_TAG_NICK: 0x1007,
  GET_SLOT_TAG_NICK: 0x1008,
  SAVE_SLOT_NICKS: 0x1009,
  GET_ACTIVE_SLOT: 0x1018,
  GET_SLOT_INFO: 0x1019,
  GET_ENABLED_SLOTS: 0x1023,
  DELETE_SLOT_INFO: 0x1024,
  GET_ALL_SLOT_NICKS: 0x1038,

  // 设备信息
  GET_DEVICE_CHIP_ID: 0x1011,
  GET_DEVICE_BLE_ADDRESS: 0x1012,
  GET_DEVICE_TYPE: 0x1033,
  GET_DEVICE_SETTINGS: 0x1034,
  GET_DEVICE_CAPABILITIES: 0x1035,

  // Bootloader
  ENTER_BOOTLOADER: 0x1010,

  // 设置
  SAVE_SETTINGS: 0x1013,
  RESET_SETTINGS: 0x1014,
  FACTORY_RESET: 0x1020,

  // 动画
  SET_ANIMATION_MODE: 0x1015,
  GET_ANIMATION_MODE: 0x1016,

  // 休眠
  GET_SLEEP_TIMEOUT: 0x1039,
  SET_SLEEP_TIMEOUT: 0x1040,

  // 卡槽轮询延迟
  GET_POLLING_DELAY: 0x1041,
  SET_POLLING_DELAY: 0x1042,

  // 按键配置
  GET_BUTTON_PRESS_CONFIG: 0x1026,
  SET_BUTTON_PRESS_CONFIG: 0x1027,
  GET_LONG_BUTTON_PRESS_CONFIG: 0x1028,
  SET_LONG_BUTTON_PRESS_CONFIG: 0x1029,

  // BLE 配对
  BLE_SET_CONNECT_KEY: 0x1030,
  BLE_GET_CONNECT_KEY: 0x1031,
  BLE_CLEAR_BONDED_DEVICES: 0x1032,
  BLE_GET_PAIR_ENABLE: 0x1036,
  BLE_SET_PAIR_ENABLE: 0x1037,

  // HF 读卡器
  SCAN_14A_TAG: 0x2000,
  MF1_SUPPORT_DETECT: 0x2001,
  MF1_NT_LEVEL_DETECT: 0x2002,
  MF1_STATIC_NESTED_ACQUIRE: 0x2003,
  MF1_DARKSIDE_ACQUIRE: 0x2004,
  MF1_NT_DISTANCE_DETECT: 0x2005,
  MF1_NESTED_ACQUIRE: 0x2006,
  MF1_CHECK_KEY: 0x2007,
  MF1_CHECK_KEYS_ON_BLOCK: 0x2008,
  MF1_READ_BLOCK: 0x2009,
  MF1_WRITE_BLOCK: 0x200A,
  MF1_READ_SECTOR: 0x200B,
  MF1_WRITE_SECTOR: 0x200C,
  MF1_SET_DETECTION_ENABLE: 0x4004,

  // HF 嗅探
  HF14A_SNIFF: 0x3000,
  HF14A_SNIFF_STOP: 0x3001,

  // LF 命令
  LF_SNIFF: 0x3010,
  LF_SNIFF_STOP: 0x3011,
  EM410X_READ: 0x3012,
  EM410X_WRITE: 0x3013,
  EM410X_WRITE_TO_T55XX: 0x3014,

  // NTAG/Ultralight
  MF0_NTAG_SET_DETECTION_ENABLE: 0x4033,
  MF0_NTAG_GET_DETECTION_ENABLE: 0x4036,
  MF0_READ_PAGE: 0x4037,
  MF0_WRITE_PAGE: 0x4038,

  // Mfkey32
  MFKEY32_SET_DETECT: 0x5000,
  MFKEY32_GET_NONCES: 0x5001
};

// 标签类型枚举
const TAG_TYPES = {
  HF: [
    { key: 'disabled', label: '关闭' },
    { key: 'mifare_classic_1k', label: 'MIFARE Classic 1K' },
    { key: 'mifare_classic_2k', label: 'MIFARE Classic 2K' },
    { key: 'mifare_classic_4k', label: 'MIFARE Classic 4K' },
    { key: 'mifare_classic_mini', label: 'MIFARE Classic Mini' },
    { key: 'ntag210', label: 'NTAG 210' },
    { key: 'ntag212', label: 'NTAG 212' },
    { key: 'ntag213', label: 'NTAG 213' },
    { key: 'ntag215', label: 'NTAG 215' },
    { key: 'ntag216', label: 'NTAG 216' },
    { key: 'ultralight', label: 'Ultralight Classic' },
    { key: 'ultralight_c', label: 'Ultralight C' },
    { key: 'ultralight_ev1_11', label: 'Ultralight EV1 11' },
    { key: 'ultralight_ev1_21', label: 'Ultralight EV1 21' }
  ],
  LF: [
    { key: 'disabled', label: '关闭' },
    { key: 'em410x', label: 'EM410x' },
    { key: 'em410x_16', label: 'EM410x 16' },
    { key: 'em410x_32', label: 'EM410x 32' },
    { key: 'em410x_64', label: 'EM410x 64' },
    { key: 'em410x_electra', label: 'EM410x Electra' },
    { key: 'hid', label: 'HID Prox' },
    { key: 'viking', label: 'Viking' },
    { key: 'ioprox', label: 'IoProx' },
    { key: 'pac', label: 'PAC' },
    { key: 'idteck', label: 'Idteck' }
  ]
};

// 设备模式
const DEVICE_MODES = { READER: 0, EMULATOR: 1 };

// 按键配置
const BUTTON_CONFIGS = [
  { key: 0, label: '禁用' },
  { key: 1, label: '向前切换卡槽' },
  { key: 2, label: '向后切换卡槽' },
  { key: 3, label: '克隆 UID' },
  { key: 4, label: '电量显示' }
];

// 动画模式
const ANIMATION_MODES = [
  { key: 0, label: '完整' },
  { key: 1, label: '最小' },
  { key: 2, label: '无' },
  { key: 3, label: '对称' }
];

// 激活码
const ACTIVATION_SECRET = 'CHAMELEON_ULTRA_2024';

module.exports = {
  BLE_UUIDS,
  CHAMELEON_COMMANDS,
  TAG_TYPES,
  DEVICE_MODES,
  BUTTON_CONFIGS,
  ANIMATION_MODES,
  ACTIVATION_SECRET
};
