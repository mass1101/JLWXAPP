const storage = require('./storage');

const KEYS = {
  CARDS: 'cards',
  HISTORY: 'history',
  SETTINGS: 'settings'
};

function getCards() {
  return wx.getStorageSync(KEYS.CARDS) || [];
}

function saveCard(id, data) {
  const cards = getCards();
  const existing = cards.findIndex(c => c.id === id);
  const entry = { id, ...data };
  if (existing >= 0) {
    cards[existing] = entry;
  } else {
    cards.push(entry);
  }
  wx.setStorageSync(KEYS.CARDS, cards);
}

function deleteCard(id) {
  const cards = getCards().filter(c => c.id !== id);
  wx.setStorageSync(KEYS.CARDS, cards);
}

function getHistory() {
  return wx.getStorageSync(KEYS.HISTORY) || [];
}

function addHistory(item) {
  const h = getHistory();
  h.unshift(item);
  if (h.length > 100) h.length = 100;
  wx.setStorageSync(KEYS.HISTORY, h);
}

function clearHistory() {
  wx.setStorageSync(KEYS.HISTORY, []);
}

function exportAll() {
  return {
    cards: getCards(),
    history: getHistory()
  };
}

function importAll(data) {
  if (data.cards) wx.setStorageSync(KEYS.CARDS, data.cards);
  if (data.history) wx.setStorageSync(KEYS.HISTORY, data.history);
}

module.exports = {
  StorageManager: {
    KEYS,
    getCards, saveCard, deleteCard,
    getHistory, addHistory, clearHistory,
    exportAll, importAll
  }
};
