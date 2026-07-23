const activation = require('./activation');

function activate(activationCode) {
  return new Promise((resolve, reject) => {
    try {
      const chipId = activation.getActivatedChipId() || wx.getStorageSync('chipId') || 'UNKNOWN';
      const valid = activation.validateActivationCode(chipId, activationCode);
      if (valid) {
        activation.saveActivation(chipId);
        resolve({ success: true, licenses: [{ module: 'full', id: chipId, expiry: '永久' }] });
      } else {
        reject(new Error('无效的激活码'));
      }
    } catch (e) {
      reject(e);
    }
  });
}

function deactivate() {
  wx.setStorageSync('activation', null);
}

function getActivationData() {
  return wx.getStorageSync('activation') || { activated: false, licenses: [] };
}

module.exports = { ActivationManager: { activate, deactivate, getActivationData } };
