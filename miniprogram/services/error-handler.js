function show(err) {
  const msg = err && err.message ? err.message : (typeof err === 'string' ? err : '未知错误');
  wx.showToast({ title: msg, icon: 'none', duration: 3000 });
}

function log(err, context) {
  const ts = new Date().toISOString();
  const logs = wx.getStorageSync('errorLogs') || [];
  logs.push({ ts, msg: err.message || err, context });
  if (logs.length > 50) logs.shift();
  wx.setStorageSync('errorLogs', logs);
}

function getLogs() {
  return wx.getStorageSync('errorLogs') || [];
}

module.exports = { ErrorHandler: { show, log, getLogs } };
