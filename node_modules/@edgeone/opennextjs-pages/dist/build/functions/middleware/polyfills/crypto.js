
      var require = await (async () => {
        var { createRequire } = await import("node:module");
        return createRequire(import.meta.url);
      })();
    
import "../../../../esm-chunks/chunk-6BT4RYQJ.js";

// src/build/functions/middleware/polyfills/crypto.ts
var cryptoPolyfill = `
// === Crypto Polyfill ===
const crypto = globalThis.crypto || {};

// \u786E\u4FDD getRandomValues \u53EF\u7528
if (!crypto.getRandomValues) {
  crypto.getRandomValues = (array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  };
}

// \u6DFB\u52A0 randomBytes \u65B9\u6CD5\uFF08Node.js \u98CE\u683C\uFF09
crypto.randomBytes = (size) => {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return Buffer.from(bytes);
};

// \u6DFB\u52A0 randomUUID \u65B9\u6CD5
if (!crypto.randomUUID) {
  crypto.randomUUID = () => {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
  };
}

// \u6DFB\u52A0 createHash \u65B9\u6CD5\uFF08\u7B80\u5316\u7248\uFF09
crypto.createHash = (algorithm) => {
  const data = [];
  return {
    update(chunk, encoding) {
      if (typeof chunk === 'string') {
        chunk = new TextEncoder().encode(chunk);
      }
      data.push(chunk);
      return this;
    },
    async digest(encoding) {
      const buffer = Buffer.concat(data);
      const hashBuffer = await crypto.subtle.digest(
        algorithm.toUpperCase().replace('SHA', 'SHA-'),
        buffer
      );
      const result = Buffer.from(hashBuffer);
      if (encoding === 'hex') {
        return result.toString('hex');
      } else if (encoding === 'base64') {
        return result.toString('base64');
      }
      return result;
    }
  };
};

// \u6DFB\u52A0 createHmac \u65B9\u6CD5\uFF08\u7B80\u5316\u7248\uFF09
crypto.createHmac = (algorithm, key) => {
  const data = [];
  return {
    update(chunk, encoding) {
      if (typeof chunk === 'string') {
        chunk = new TextEncoder().encode(chunk);
      }
      data.push(chunk);
      return this;
    },
    async digest(encoding) {
      const keyData = typeof key === 'string' ? new TextEncoder().encode(key) : key;
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: algorithm.toUpperCase().replace('SHA', 'SHA-') },
        false,
        ['sign']
      );
      const buffer = Buffer.concat(data);
      const signature = await crypto.subtle.sign('HMAC', cryptoKey, buffer);
      const result = Buffer.from(signature);
      if (encoding === 'hex') {
        return result.toString('hex');
      } else if (encoding === 'base64') {
        return result.toString('base64');
      }
      return result;
    }
  };
};

// \u65F6\u95F4\u5B89\u5168\u6BD4\u8F83
crypto.timingSafeEqual = (a, b) => {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }
  return result === 0;
};

globalThis.crypto = crypto;
`;
export {
  cryptoPolyfill
};
