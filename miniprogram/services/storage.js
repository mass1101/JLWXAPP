const STORAGE_KEYS = {
  CARDS: 'cards',
  DICTIONARY_PREFIX: 'dict:',
  SETTINGS: 'settings',
  DEVICE_SETTINGS: 'device_settings',
  DEVICE_CHIP_ID: 'device_chip_id',
  APP_ACTIVATED: 'app_activated',
  APP_ACTIVATED_CHIP_ID: 'app_activated_chip_id',
  LAST_CONNECTED_DEVICE: 'last_connected_device'
};

// ========== 卡库 CRUD ==========
function getCards(filter = null) {
  const raw = wx.getStorageSync(STORAGE_KEYS.CARDS) || '[]';
  let cards = JSON.parse(raw);
  if (filter) {
    if (filter.type) cards = cards.filter(c => c.type === filter.type);
    if (filter.search) {
      const q = filter.search.toLowerCase();
      cards = cards.filter(c => (c.name && c.name.toLowerCase().includes(q)) ||
                                 (c.uid && c.uid.toLowerCase().includes(q)));
    }
  }
  return cards;
}

function saveCard(cardData) {
  const cards = getCards();
  cardData.id = Date.now().toString(36) + Math.random().toString(36).substr(2);
  cardData.created = Date.now();
  cardData.modified = Date.now();
  cardData.isBackedUp = false;
  cardData.backupId = null;
  cards.push(cardData);
  wx.setStorageSync(STORAGE_KEYS.CARDS, JSON.stringify(cards));
  return cardData;
}

function updateCard(id, data) {
  const cards = getCards();
  const idx = cards.findIndex(c => c.id === id);
  if (idx === -1) return null;
  cards[idx] = { ...cards[idx], ...data, modified: Date.now() };
  wx.setStorageSync(STORAGE_KEYS.CARDS, JSON.stringify(cards));
  return cards[idx];
}

function deleteCard(id) {
  let cards = getCards();
  cards = cards.filter(c => c.id !== id);
  wx.setStorageSync(STORAGE_KEYS.CARDS, JSON.stringify(cards));
}

// ========== 词典管理 ==========
function getDictionaries() {
  const keys = wx.getStorageInfoSync().keys || [];
  return keys.filter(k => k.startsWith(STORAGE_KEYS.DICTIONARY_PREFIX))
             .map(k => k.substring(STORAGE_KEYS.DICTIONARY_PREFIX.length));
}

function getDictionary(name) {
  const raw = wx.getStorageSync(STORAGE_KEYS.DICTIONARY_PREFIX + name);
  return raw ? JSON.parse(raw) : [];
}

function saveDictionary(name, entries) {
  wx.setStorageSync(STORAGE_KEYS.DICTIONARY_PREFIX + name, JSON.stringify(entries));
}

function deleteDictionary(name) {
  wx.removeStorageSync(STORAGE_KEYS.DICTIONARY_PREFIX + name);
}

// ========== 设置管理 ==========
function getSettings() {
  const raw = wx.getStorageSync(STORAGE_KEYS.SETTINGS);
  return raw ? JSON.parse(raw) : {
    themeColor: '#3AD9F7',
    autoScan: true,
    autoConnect: true,
    confirmDelete: true,
    language: 'zh-CN'
  };
}

function saveSettings(settings) {
  wx.setStorageSync(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}

function getDeviceSettings() {
  const raw = wx.getStorageSync(STORAGE_KEYS.DEVICE_SETTINGS);
  return raw ? JSON.parse(raw) : {
    animationMode: 0,
    sleepTimeout: 10,
    buttonA: { press: 0, longPress: 0 },
    buttonB: { press: 0, longPress: 0 },
    blePairingEnabled: false,
    bleConnectKey: ''
  };
}

function saveDeviceSettings(settings) {
  wx.setStorageSync(STORAGE_KEYS.DEVICE_SETTINGS, JSON.stringify(settings));
}

function getChipId() {
  return wx.getStorageSync(STORAGE_KEYS.DEVICE_CHIP_ID) || '';
}

function setChipId(chipId) {
  wx.setStorageSync(STORAGE_KEYS.DEVICE_CHIP_ID, chipId);
}

function exportAll() {
  return JSON.stringify({
    cards: getCards(),
    settings: getSettings(),
    deviceSettings: getDeviceSettings()
  });
}

function importAll(jsonData) {
  const data = JSON.parse(jsonData);
  if (data.cards) wx.setStorageSync(STORAGE_KEYS.CARDS, JSON.stringify(data.cards));
  if (data.settings) saveSettings(data.settings);
  if (data.deviceSettings) saveDeviceSettings(data.deviceSettings);
}

module.exports = {
  getCards, saveCard, updateCard, deleteCard,
  getDictionaries, getDictionary, saveDictionary, deleteDictionary,
  getSettings, saveSettings,
  getDeviceSettings, saveDeviceSettings,
  getChipId, setChipId,
  exportAll, importAll
};
