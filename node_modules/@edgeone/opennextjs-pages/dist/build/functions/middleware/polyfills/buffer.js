
      var require = await (async () => {
        var { createRequire } = await import("node:module");
        return createRequire(import.meta.url);
      })();
    
import "../../../../esm-chunks/chunk-6BT4RYQJ.js";

// src/build/functions/middleware/polyfills/buffer.ts
var bufferPolyfill = `
// === Buffer Polyfill ===
const Buffer = (function() {
  class BufferPolyfill extends Uint8Array {
    static isBuffer(obj) {
      return obj instanceof BufferPolyfill || obj instanceof Uint8Array;
    }

    static from(value, encodingOrOffset, length) {
      if (typeof value === 'string') {
        const encoding = encodingOrOffset || 'utf8';
        if (encoding === 'base64') {
          const binaryString = atob(value);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          return new BufferPolyfill(bytes);
        } else if (encoding === 'hex') {
          const bytes = new Uint8Array(value.length / 2);
          for (let i = 0; i < value.length; i += 2) {
            bytes[i / 2] = parseInt(value.substr(i, 2), 16);
          }
          return new BufferPolyfill(bytes);
        } else {
          // utf8
          const encoder = new TextEncoder();
          return new BufferPolyfill(encoder.encode(value));
        }
      }
      if (Array.isArray(value) || value instanceof Uint8Array) {
        return new BufferPolyfill(value);
      }
      if (value instanceof ArrayBuffer) {
        return new BufferPolyfill(new Uint8Array(value, encodingOrOffset, length));
      }
      throw new TypeError('Invalid argument type for Buffer.from');
    }

    static alloc(size, fill, encoding) {
      const buf = new BufferPolyfill(size);
      if (fill !== undefined) {
        if (typeof fill === 'number') {
          buf.fill(fill);
        } else if (typeof fill === 'string') {
          const fillBuf = BufferPolyfill.from(fill, encoding);
          for (let i = 0; i < size; i++) {
            buf[i] = fillBuf[i % fillBuf.length];
          }
        }
      }
      return buf;
    }

    static allocUnsafe(size) {
      return new BufferPolyfill(size);
    }

    static concat(list, totalLength) {
      if (totalLength === undefined) {
        totalLength = list.reduce((acc, buf) => acc + buf.length, 0);
      }
      const result = new BufferPolyfill(totalLength);
      let offset = 0;
      for (const buf of list) {
        result.set(buf, offset);
        offset += buf.length;
      }
      return result;
    }

    static byteLength(string, encoding) {
      if (typeof string !== 'string') {
        return string.length || string.byteLength || 0;
      }
      if (encoding === 'base64') {
        return Math.ceil(string.length * 3 / 4);
      }
      return new TextEncoder().encode(string).length;
    }

    toString(encoding = 'utf8', start = 0, end = this.length) {
      const slice = this.subarray(start, end);
      if (encoding === 'base64') {
        let binary = '';
        for (let i = 0; i < slice.length; i++) {
          binary += String.fromCharCode(slice[i]);
        }
        return btoa(binary);
      } else if (encoding === 'hex') {
        return Array.from(slice)
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
      } else {
        // utf8
        return new TextDecoder().decode(slice);
      }
    }

    write(string, offset = 0, length, encoding = 'utf8') {
      const buf = BufferPolyfill.from(string, encoding);
      const bytesToWrite = Math.min(buf.length, length || this.length - offset);
      this.set(buf.subarray(0, bytesToWrite), offset);
      return bytesToWrite;
    }

    copy(target, targetStart = 0, sourceStart = 0, sourceEnd = this.length) {
      const slice = this.subarray(sourceStart, sourceEnd);
      target.set(slice, targetStart);
      return slice.length;
    }

    slice(start, end) {
      return new BufferPolyfill(this.subarray(start, end));
    }

    equals(otherBuffer) {
      if (this.length !== otherBuffer.length) return false;
      for (let i = 0; i < this.length; i++) {
        if (this[i] !== otherBuffer[i]) return false;
      }
      return true;
    }

    compare(otherBuffer) {
      const len = Math.min(this.length, otherBuffer.length);
      for (let i = 0; i < len; i++) {
        if (this[i] < otherBuffer[i]) return -1;
        if (this[i] > otherBuffer[i]) return 1;
      }
      if (this.length < otherBuffer.length) return -1;
      if (this.length > otherBuffer.length) return 1;
      return 0;
    }

    indexOf(value, byteOffset = 0, encoding) {
      if (typeof value === 'string') {
        value = BufferPolyfill.from(value, encoding);
      }
      if (typeof value === 'number') {
        for (let i = byteOffset; i < this.length; i++) {
          if (this[i] === value) return i;
        }
        return -1;
      }
      outer: for (let i = byteOffset; i <= this.length - value.length; i++) {
        for (let j = 0; j < value.length; j++) {
          if (this[i + j] !== value[j]) continue outer;
        }
        return i;
      }
      return -1;
    }

    includes(value, byteOffset, encoding) {
      return this.indexOf(value, byteOffset, encoding) !== -1;
    }

    // \u8BFB\u5199\u65B9\u6CD5
    readUInt8(offset = 0) { return this[offset]; }
    readUInt16BE(offset = 0) { return (this[offset] << 8) | this[offset + 1]; }
    readUInt16LE(offset = 0) { return this[offset] | (this[offset + 1] << 8); }
    readUInt32BE(offset = 0) {
      return (this[offset] * 0x1000000) + ((this[offset + 1] << 16) | (this[offset + 2] << 8) | this[offset + 3]);
    }
    readUInt32LE(offset = 0) {
      return ((this[offset + 3] * 0x1000000) + ((this[offset + 2] << 16) | (this[offset + 1] << 8) | this[offset])) >>> 0;
    }
    readInt8(offset = 0) { return this[offset] > 127 ? this[offset] - 256 : this[offset]; }
    readInt16BE(offset = 0) { const val = this.readUInt16BE(offset); return val > 0x7FFF ? val - 0x10000 : val; }
    readInt16LE(offset = 0) { const val = this.readUInt16LE(offset); return val > 0x7FFF ? val - 0x10000 : val; }
    readInt32BE(offset = 0) { return (this[offset] << 24) | (this[offset + 1] << 16) | (this[offset + 2] << 8) | this[offset + 3]; }
    readInt32LE(offset = 0) { return this[offset] | (this[offset + 1] << 8) | (this[offset + 2] << 16) | (this[offset + 3] << 24); }

    writeUInt8(value, offset = 0) { this[offset] = value & 0xFF; return offset + 1; }
    writeUInt16BE(value, offset = 0) { this[offset] = (value >> 8) & 0xFF; this[offset + 1] = value & 0xFF; return offset + 2; }
    writeUInt16LE(value, offset = 0) { this[offset] = value & 0xFF; this[offset + 1] = (value >> 8) & 0xFF; return offset + 2; }
    writeUInt32BE(value, offset = 0) {
      this[offset] = (value >>> 24) & 0xFF;
      this[offset + 1] = (value >>> 16) & 0xFF;
      this[offset + 2] = (value >>> 8) & 0xFF;
      this[offset + 3] = value & 0xFF;
      return offset + 4;
    }
    writeUInt32LE(value, offset = 0) {
      this[offset] = value & 0xFF;
      this[offset + 1] = (value >>> 8) & 0xFF;
      this[offset + 2] = (value >>> 16) & 0xFF;
      this[offset + 3] = (value >>> 24) & 0xFF;
      return offset + 4;
    }

    toJSON() {
      return { type: 'Buffer', data: Array.from(this) };
    }
  }

  return BufferPolyfill;
})();

globalThis.Buffer = Buffer;
`;
export {
  bufferPolyfill
};
