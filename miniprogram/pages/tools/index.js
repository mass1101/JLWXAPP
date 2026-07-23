Page({
  data: {
    tools: [
      { id: 'uid', name: 'UID 工具', desc: '修改/克隆卡片 UID', icon: '\u2665' },
      { id: 'dump', name: 'DUMP 工具', desc: '导出/导入卡片 dump', icon: '\u21EA' },
      { id: 'keyscan', name: '密钥扫描', desc: '扫描 MIFARE 密钥', icon: '\u26BF' },
      { id: 'emulate', name: '卡模拟', desc: '模拟 NFC 卡片', icon: '\u20DF' },
      { id: 'sniff', name: '嗅探', desc: '抓取通信数据', icon: '\u2302' },
      { id: 'bruteforce', name: '暴力破解', desc: '弱密钥测试', icon: '\u26A1' },
      { id: 'magic', name: '魔卡工具', desc: 'Magic Card 操作', icon: '\u2728' },
      { id: 'ndefformat', name: 'NDEF 格式化', desc: '格式化 NDEF 标签', icon: '\u2630' },
      { id: 'hf14a', name: 'ISO14443A', desc: '高频读卡操作', icon: '\u2316' },
      { id: 'lfcmd', name: '低频探测', desc: '低频卡探测分析', icon: '\u2195' }
    ]
  },
  onToolTap(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/tools/tool/index?id=' + id });
  }
});
