const { CHAMELEON_COMMANDS } = require('../utils/constants');
const { bytesToHex, byteToHex } = require('../utils/hex');

const FRAME_HEADER = [0x11, 0xEF];
const FRAME_SIZE = 128;

function buildFrame(commandId, payload = []) {
  const frame = new Uint8Array(FRAME_SIZE);
  frame[0] = FRAME_HEADER[0];
  frame[1] = FRAME_HEADER[1];
  frame[2] = (commandId >> 8) & 0xFF;
  frame[3] = commandId & 0xFF;
  frame[4] = 0x00;
  frame[5] = (payload.length >> 8) & 0xFF;
  frame[6] = payload.length & 0xFF;
  for (let i = 0; i < payload.length && i < FRAME_SIZE - 7; i++) {
    frame[7 + i] = payload[i];
  }
  return frame;
}

function parseFrame(bytes) {
  if (bytes.length < 7) return null;

  const view = Array.isArray(bytes) ? bytes : Array.from(new Uint8Array(bytes));

  // 查找帧头
  let start = 0;
  while (start < view.length - 1) {
    if (view[start] === FRAME_HEADER[0] && view[start + 1] === FRAME_HEADER[1]) break;
    start++;
  }
  if (start >= view.length - 6) return null;

  const cmdHigh = view[start + 2];
  const cmdLow = view[start + 3];
  const status = view[start + 4];
  const lenHigh = view[start + 5];
  const lenLow = view[start + 6];
  const dataLen = (lenHigh << 8) | lenLow;

  const dataEnd = Math.min(start + 7 + dataLen, view.length);
  const data = view.slice(start + 7, dataEnd);

  return {
    commandId: (cmdHigh << 8) | cmdLow,
    status: status,
    dataLength: dataLen,
    data: data,
    hex: bytesToHex(view.slice(start, dataEnd))
  };
}

function parseMultiFrameResponse(frames) {
  let allData = [];
  for (const frame of frames) {
    const result = parseFrame(frame);
    if (result && result.status === 0) {
      allData = allData.concat(result.data);
    }
  }
  return allData;
}

// 创建 payload 常用方法
function createPayload(...args) {
  const bytes = [];
  for (const arg of args) {
    if (typeof arg === 'number') {
      bytes.push(arg & 0xFF);
    } else if (Array.isArray(arg)) {
      bytes.push(...arg);
    } else if (arg instanceof Uint8Array) {
      bytes.push(...Array.from(arg));
    }
  }
  return bytes;
}

module.exports = { buildFrame, parseFrame, parseMultiFrameResponse, createPayload };
