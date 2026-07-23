const { ACTIVATION_SECRET } = require('../utils/constants');

function sha256(str) {
  // 微信小程序不支持 crypto.subtle，简化实现用于激活码校验
  // 实际使用中替换为完整的 SHA-256 实现
  const crypto = require('../utils/sha256');
  return crypto.sha256Hex(str);
}

function generateActivationCode(chipId) {
  const input = chipId + ':' + ACTIVATION_SECRET;
  const hash = sha256(input);
  return hash.substring(0, 16).toUpperCase();
}

function formatActivationCode(code) {
  return code.match(/.{1,4}/g).join('-');
}

function cleanActivationCode(input) {
  return input.replace(/[^0-9A-Fa-f]/g, '').toUpperCase();
}

function validateActivationCode(chipId, inputCode) {
  const cleaned = cleanActivationCode(inputCode);
  if (!/^[0-9A-F]{16}$/.test(cleaned)) return false;
  const expected = generateActivationCode(chipId);
  return cleaned === expected;
}

function isActivated() {
  return wx.getStorageSync('app_activated') || false;
}

function saveActivation(chipId) {
  wx.setStorageSync('app_activated', true);
  wx.setStorageSync('app_activated_chip_id', chipId);
}

function getActivatedChipId() {
  return wx.getStorageSync('app_activated_chip_id') || '';
}

function getEffectiveSlotCount() {
  return isActivated() ? 80 : 8;
}

module.exports = {
  generateActivationCode, formatActivationCode, cleanActivationCode,
  validateActivationCode, isActivated, saveActivation, getActivatedChipId,
  getEffectiveSlotCount
};
