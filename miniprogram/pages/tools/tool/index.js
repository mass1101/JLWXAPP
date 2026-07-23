const { CHAMELEON_COMMANDS } = require('../../../utils/constants');
const { bytesToHex } = require('../../../utils/hex');

const TOOL_CONFIGS = {
  'hf14a-sniff': { name: 'HF14A 嗅探', desc: '抓取高频14A通信数据', cmd: CHAMELEON_COMMANDS.HF14A_SNIFF, stopCmd: CHAMELEON_COMMANDS.HF14A_SNIFF_STOP, hasDuration: true },
  'lf-sniff': { name: 'LF 嗅探', desc: '抓取低频通信数据', cmd: CHAMELEON_COMMANDS.LF_SNIFF, stopCmd: CHAMELEON_COMMANDS.LF_SNIFF_STOP, hasDuration: true },
  'mfkey32': { name: 'MFKey32', desc: 'MIFARE Key32 密钥检测', cmd: CHAMELEON_COMMANDS.MFKEY32_SET_DETECT, hasPayload: true },
  'mf1-detect': { name: 'MIFARE 检测', desc: '检测 MIFARE 卡类型', cmd: CHAMELEON_COMMANDS.MF1_SUPPORT_DETECT },
  'mf1-nested': { name: 'MIFARE Nested', desc: 'Nested 密钥获取', cmd: CHAMELEON_COMMANDS.MF1_NESTED_ACQUIRE, hasParams: true },
  'ntag-detect': { name: 'NTAG 检测', desc: 'NTAG 标签检测', cmd: CHAMELEON_COMMANDS.MF0_NTAG_SET_DETECTION_ENABLE },
  'device-info': { name: '设备信息', desc: '查看设备详细信息', multiCmd: true },
  'device-settings': { name: '设备设置', desc: '调整设备参数', multiCmd: true },
  'factory-reset': { name: '恢复出厂', desc: '重置设备', cmd: CHAMELEON_COMMANDS.FACTORY_RESET, dangerous: true }
};

Page({
  data: {
    connected: false,
    toolName: '',
    toolDesc: '',
    executing: false,
    result: '',
    resultHex: '',
    tool: null
  },

  onLoad(opts) {
    const id = opts.id || '';
    const config = TOOL_CONFIGS[id] || { name: '工具', desc: '' };
    wx.setNavigationBarTitle({ title: config.name });
    this.setData({ toolName: config.name, toolDesc: config.desc, tool: config });
  },

  onShow() {
    const bleService = getApp().globalData.bleService;
    const connected = bleService ? bleService.isConnected : false;
    this.setData({ connected });

    if (bleService) {
      bleService.onConnectionStateChanged((info) => {
        this.setData({ connected: info.state === 'connected' });
      });
    }
  },

  async execute() {
    const bleService = getApp().globalData.bleService;
    if (!bleService || !bleService.isConnected) {
      wx.showToast({ title: '请先连接设备', icon: 'none' });
      return;
    }

    const tool = this.data.tool;
    if (!tool || !tool.cmd) {
      wx.showToast({ title: '无可用命令', icon: 'none' });
      return;
    }

    if (tool.dangerous) {
      wx.showModal({
        title: '危险操作',
        content: '恢复出厂设置将清除所有数据，确定继续？',
        success: (res) => {
          if (res.confirm) {
            wx.showModal({
              title: '再次确认',
              content: '此操作不可撤销，确定恢复出厂？',
              success: (res2) => {
                if (res2.confirm) this.doExecute(bleService, tool);
              }
            });
          }
        }
      });
      return;
    }

    await this.doExecute(bleService, tool);
  },

  async doExecute(bleService, tool) {
    try {
      this.setData({ executing: true, result: '', resultHex: '' });

      if (tool.multiCmd) {
        const results = await this.executeMultiCmd(bleService, tool);
        this.setData({ result: JSON.stringify(results, null, 2), executing: false });
        return;
      }

      const payload = tool.hasPayload ? [1] : [];
      const result = await bleService.sendCommand(tool.cmd, payload);

      let resultText = '';
      let resultHex = '';
      if (result && result.data && result.data.length > 0) {
        resultHex = bytesToHex(result.data);
        resultText = '状态: ' + result.status + '\n长度: ' + result.dataLength + '\n数据: ' + resultHex;
      } else {
        resultText = '状态: ' + (result ? result.status : '?') + '\n无返回数据';
      }
      this.setData({ result: resultText, resultHex, executing: false });
    } catch (err) {
      this.setData({
        executing: false,
        result: '错误: ' + (err.message || err),
        resultHex: ''
      });
    }
  },

  async executeMultiCmd(bleService, tool) {
    const results = {};
    const commands = [
      { key: 'version', cmd: CHAMELEON_COMMANDS.GET_APP_VERSION },
      { key: 'chipId', cmd: CHAMELEON_COMMANDS.GET_DEVICE_CHIP_ID },
      { key: 'deviceType', cmd: CHAMELEON_COMMANDS.GET_DEVICE_TYPE },
      { key: 'battery', cmd: CHAMELEON_COMMANDS.GET_BATTERY_CHARGE }
    ];

    for (const item of commands) {
      try {
        const result = await bleService.sendCommand(item.cmd, []);
        if (result && result.data && result.data.length > 0) {
          results[item.key] = bytesToHex(result.data);
        } else {
          results[item.key] = '(无数据)';
        }
      } catch (e) {
        results[item.key] = '读取失败';
      }
    }
    return results;
  },

  onConnectionStateChanged() {
    const bleService = getApp().globalData.bleService;
    this.setData({ connected: bleService ? bleService.isConnected : false });
  },

  copyResult() {
    if (!this.data.result) return;
    wx.setClipboardData({
      data: this.data.result,
      success: () => { wx.showToast({ title: '已复制' }); }
    });
  }
});
