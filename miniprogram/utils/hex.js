function hexToBytes(hex) {
  hex = hex.replace(/[^0-9A-Fa-f]/g, '');
  const bytes = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.substring(i, i + 2), 16));
  }
  return bytes;
}

function bytesToHex(bytes) {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

function byteToHex(b) {
  return b.toString(16).padStart(2, '0').toUpperCase();
}

function hexToStr(hex) {
  const bytes = hexToBytes(hex);
  return String.fromCharCode(...bytes);
}

function strToHex(str) {
  const bytes = [];
  for (let i = 0; i < str.length; i++) {
    bytes.push(str.charCodeAt(i));
  }
  return bytesToHex(bytes);
}

function bytesToUint16(bytes, offset) {
  return (bytes[offset] << 8) | bytes[offset + 1];
}

function arraybufferToHex(buffer) {
  return bytesToHex(new Uint8Array(buffer));
}

module.exports = { hexToBytes, bytesToHex, byteToHex, hexToStr, strToHex, bytesToUint16, arraybufferToHex };
