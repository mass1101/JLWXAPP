const storage = require('./storage');
const { arraybufferToHex } = require('../utils/hex');

function generateBinData(card) {
  // 生成卡片 .bin 字节流的 base64 编码
  let bytes = [];
  if (card.blocks) {
    for (const block of card.blocks) {
      if (Array.isArray(block)) {
        bytes = bytes.concat(block);
      }
    }
  }
  if (card.pages) {
    for (const page of card.pages) {
      if (Array.isArray(page)) {
        bytes = bytes.concat(page);
      }
    }
  }
  if (bytes.length === 0 && card.data) {
    bytes = card.data;
  }
  const uint8 = new Uint8Array(bytes);
  let binary = '';
  for (let i = 0; i < uint8.length; i++) {
    binary += String.fromCharCode(uint8[i]);
  }
  return wx.arrayBufferToBase64(uint8.buffer);
}

function backupCards(chipId, cards, onProgress) {
  return new Promise((resolve, reject) => {
    const cardList = cards.map(card => ({
      name: card.name || 'Untitled',
      uid: card.uid || '',
      tag_type: card.type || 'mifareClassic1k',
      data: card.blocks || card.pages || card.data || [],
      bin_data: generateBinData(card)
    }));

    let completed = 0;
    const total = cardList.length;

    const body = {
      chip_id: chipId,
      cards: cardList
    };

    const requestTask = wx.request({
      url: 'https://your-api-server.com/api/backup',
      method: 'POST',
      header: { 'Content-Type': 'application/json' },
      data: body,
      success: (res) => {
        if (res.statusCode === 201) {
          const backupId = res.data.backup_id;
          cards.forEach(card => {
            storage.updateCard(card.id, { isBackedUp: true, backupId: backupId });
          });
          resolve({ backup_id: backupId, message: res.data.message });
        } else {
          reject(new Error(`Server error: ${res.statusCode}`));
        }
      },
      fail: (err) => {
        reject(new Error(`Network error: ${err.errMsg}`));
      }
    });
  });
}

module.exports = { backupCards, generateBinData };
