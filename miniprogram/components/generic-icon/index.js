Component({
  properties: {
    type: { type: String, value: 'default' },
    size: { type: Number, value: 24 },
    color: { type: String, value: '#6D8090' }
  },
  data: {
    symbols: {
      home: '\u2302', slots: '\u25A6', tools: '\u2699', mine: '\u263A',
      scan: '\u2316', write: '\u270E', nfc: '\u2302', battery: '\u26A1',
      firmware: '\u21BB', lock: '\u26BF', unlock: '\u26BE',
      card: '\u25A3', dictionary: '\u2261', settings: '\u2699',
      about: '\u24D8', save: '\u27BD', share: '\u21AA',
      delete: '\u2717', edit: '\u270E', add: '\u002B',
      back: '\u2190', down: '\u2193', right: '\u2192', up: '\u2191',
      ok: '\u2713', info: '\u24D8', warn: '\u26A0', err: '\u2717',
      close: '\u2715', refresh: '\u21BB', search: '\u2315',
      default: '\u25C9'
    }
  },
  observers: {
    type(t) { const s = this.data.symbols[t] || this.data.symbols.default; this.setData({ symbol: s }); }
  },
  lifetimes: {
    attached() { const s = this.data.symbols[this.data.type] || this.data.symbols.default; this.setData({ symbol: s }); }
  }
});
