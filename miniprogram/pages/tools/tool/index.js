import { BLEManager } from '../../../services/ble-manager';
import { ErrorHandler } from '../../../services/error-handler';

const TOOL_INFO = {
  uid:       { name: 'UID 工具',       desc: '修改/克隆卡片 UID',                     cmd: 'MF1_READ_BLOCK', writeCmd: 'MF1_WRITE_BLOCK' },
  dump:      { name: 'DUMP 工具',      desc: '导出/导入卡片 dump',                   cmd: 'MF1_READ_SECTOR', writeCmd: 'MF1_WRITE_SECTOR' },
  keyscan:   { name: '密钥扫描',       desc: '扫描 MIFARE 密钥',                      cmd: 'MF1_CHECK_KEY' },
  emulate:   { name: '卡模拟',          desc: '切换为模拟模式',                          cmd: 'SET_DEVICE_MODE', defaultArgs: '{"mode":1}' },
  sniff:     { name: '嗅探工具',       desc: '抓取 RFID 通信数据',                    cmd: 'HF_SNIFF', stopCmd: 'HF_SNIFF_STOP', lfCmd: 'LF_SNIFF' },
  bruteforce:{ name: '密钥攻击',       desc: '弱密钥测试 Nested/Darkside',            cmd: 'MF1_NESTED', altCmd: 'MF1_DARKSIDE' },
  magic:     { name: '魔卡工具',       desc: 'Gen1a/Gen2 Magic Card 操作',           cmd: 'MF1_WRITE_BLOCK' },
  ndefformat:{ name: 'NDEF 格式化',    desc: '格式化 NDEF 标签',                     cmd: 'NTAG_WRITE_PAGE', readCmd: 'NTAG_READ_PAGE' },
  hf14a:     { name: 'ISO14443A',      desc: '高频 ISO14443A 读卡操作',             cmd: 'HF14A_SCAN' },
  lfcmd:     { name: '低频探测',       desc: '低频卡探测与分析',                       cmd: 'LF_EM410X_READ' }
};

Page({
  data: {
    ble: { connected: false },
    toolName: '', toolDesc: '',
    command: '', args: '', result: null, executing: false,
    toolId: '', altCmd: '', stopCmd: '', writeCmd: ''
  },
  onLoad(opts) {
    const id = opts.id || '';
    const info = TOOL_INFO[id] || { name: '工具', desc: '', cmd: '' };
    wx.setNavigationBarTitle({ title: info.name });
    this.setData({
      toolName: info.name, toolDesc: info.desc, toolId: id,
      command: info.cmd, altCmd: info.altCmd || '', stopCmd: info.stopCmd || '',
      writeCmd: info.writeCmd || '',
      defaultArgs: info.defaultArgs || ''
    });
    if (info.defaultArgs) this.setData({ args: info.defaultArgs });
  },
  onShow() {
    this.stateListener = (s) => { this.setData({ ble: s }); };
    BLEManager.on('state', this.stateListener);
    this.setData({ ble: BLEManager.getState() });
  },
  onHide() { BLEManager.off('state', this.stateListener); },
  onCommand(e) { this.setData({ command: e.detail.value }); },
  onArgs(e) { this.setData({ args: e.detail.value }); },
  async execute() {
    if (!this.data.command) { wx.showToast({ title: '请输入命令', icon: 'none' }); return; }
    try {
      this.setData({ executing: true, result: null });
      let argObj = { slot: 0, block: 0, keyType: 0x60 };
      if (this.data.args.trim()) {
        try { argObj = { ...argObj, ...JSON.parse(this.data.args) }; } catch(e) {}
      }
      const r = await BLEManager.customCommand(this.data.command, argObj);
      this.setData({ result: JSON.stringify(r, null, 2), executing: false });
    } catch (err) {
      this.setData({ executing: false, result: '错误: ' + (err.message || err) });
      ErrorHandler.show(err);
    }
  },
  async executeAlt() {
    if (!this.data.altCmd) { wx.showToast({ title: '无备用命令', icon: 'none' }); return; }
    this.setData({ command: this.data.altCmd });
    await this.execute();
  },
  async stopOp() {
    if (!this.data.stopCmd) { wx.showToast({ title: '无可停止命令', icon: 'none' }); return; }
    this.setData({ command: this.data.stopCmd });
    await this.execute();
  },
  copyResult() {
    wx.setClipboardData({ data: this.data.result, success() { wx.showToast({ title: '已复制' }); } });
  }
});
