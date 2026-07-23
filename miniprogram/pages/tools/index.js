const { CHAMELEON_COMMANDS } = require('../../utils/constants');

const TOOLS = [
  { id: 'hf14a-sniff', name: 'HF14A 嗅探', desc: '抓取高频 14A 通信数据', icon: '\u2302' },
  { id: 'lf-sniff', name: 'LF 嗅探', desc: '抓取低频通信数据', icon: '\u2302' },
  { id: 'mfkey32', name: 'MFKey32', desc: 'MIFARE Key32 密钥检测', icon: '\u26BF' },
  { id: 'mf1-detect', name: 'MIFARE 检测', desc: '检测 MIFARE 卡类型', icon: '\u2316' },
  { id: 'mf1-nested', name: 'MIFARE Nested', desc: 'Nested 密钥获取', icon: '\u26A1' },
  { id: 'ntag-detect', name: 'NTAG 检测', desc: 'NTAG 标签检测', icon: '\u2316' },
  { id: 'device-info', name: '设备信息', desc: '查看设备详细信息', icon: '\u2139' },
  { id: 'device-settings', name: '设备设置', desc: '调整设备参数', icon: '\u2699' },
  { id: 'factory-reset', name: '恢复出厂', desc: '重置设备到出厂状态', icon: '\u26A0' }
];

Page({
  data: {
    tools: TOOLS
  },

  onToolTap(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/tools/tool/index?id=' + id });
  }
});
