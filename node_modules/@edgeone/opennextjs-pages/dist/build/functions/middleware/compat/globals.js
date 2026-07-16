
      var require = await (async () => {
        var { createRequire } = await import("node:module");
        return createRequire(import.meta.url);
      })();
    
import "../../../../esm-chunks/chunk-6BT4RYQJ.js";

// src/build/functions/middleware/compat/globals.ts
var globalsCode = `
// ============================================================
// Global Environment for Next.js Middleware
// ============================================================

// _ENTRIES \u5BF9\u8C61 - Next.js middleware \u6CE8\u518C\u5165\u53E3
// \u5FC5\u987B\u540C\u65F6\u5B9A\u4E49\u5728 globalThis \u548C self \u4E0A\uFF0C\u56E0\u4E3A webpack runtime \u53EF\u80FD\u68C0\u67E5\u4EFB\u4E00\u4F5C\u7528\u57DF
// \u4F7F\u7528 var \u58F0\u660E\u4EE5\u4FBF webpack runtime \u53EF\u4EE5\u5728\u5F53\u524D\u4F5C\u7528\u57DF\u627E\u5230\u5B83
var _ENTRIES = {};
globalThis._ENTRIES = _ENTRIES;
self._ENTRIES = _ENTRIES;

// \u786E\u4FDD _ENTRIES \u5728\u6240\u6709\u53EF\u80FD\u7684\u4F5C\u7528\u57DF\u4E2D\u90FD\u53EF\u8BBF\u95EE
// webpack runtime \u4F7F\u7528 typeof _ENTRIES \u68C0\u67E5\uFF0C\u8FD9\u4F1A\u68C0\u67E5\u5F53\u524D\u4F5C\u7528\u57DF\u94FE
if (typeof window !== 'undefined') {
  window._ENTRIES = _ENTRIES;
}

// \u8BBE\u7F6E self \u6307\u5411 globalThis
if (typeof self === 'undefined') {
  globalThis.self = globalThis;
}

// \u8BBE\u7F6E NEXT_PHASE \u73AF\u5883\u53D8\u91CF
process.env.NEXT_PHASE = process.env.NEXT_PHASE || '';

// \u6CE8\u610F\uFF1A__import_unsupported \u7531 Next.js middleware \u4EE3\u7801\u81EA\u5E26\u5B9A\u4E49\uFF0C\u4E0D\u9700\u8981\u5728\u8FD9\u91CC\u5B9A\u4E49
// \u5426\u5219\u4F1A\u56E0\u4E3A configurable: false \u5BFC\u81F4\u91CD\u590D\u5B9A\u4E49\u62A5\u9519

// \u6A21\u62DF __BUILD_MANIFEST
globalThis.__BUILD_MANIFEST = undefined;

// \u6A21\u62DF __incrementalCache
globalThis.__incrementalCache = null;

// \u6A21\u62DF __serverComponentsHmrCache
globalThis.__serverComponentsHmrCache = null;

// \u6A21\u62DF performance\uFF08\u5982\u679C\u4E0D\u5B58\u5728\uFF09
if (typeof performance === 'undefined') {
  globalThis.performance = {
    now: () => Date.now(),
    mark: () => {},
    measure: () => {},
    getEntriesByName: () => [],
    getEntriesByType: () => [],
    clearMarks: () => {},
    clearMeasures: () => {}
  };
}

// \u6A21\u62DF queueMicrotask\uFF08\u5982\u679C\u4E0D\u5B58\u5728\uFF09
if (typeof queueMicrotask === 'undefined') {
  globalThis.queueMicrotask = (callback) => {
    Promise.resolve().then(callback);
  };
}

// \u6A21\u62DF structuredClone\uFF08\u5982\u679C\u4E0D\u5B58\u5728\uFF09
if (typeof structuredClone === 'undefined') {
  globalThis.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));
}

// \u6A21\u62DF AbortController\uFF08\u5982\u679C\u4E0D\u5B58\u5728\uFF09
if (typeof AbortController === 'undefined') {
  globalThis.AbortController = class AbortController {
    constructor() {
      this.signal = { aborted: false, reason: undefined };
    }
    abort(reason) {
      this.signal.aborted = true;
      this.signal.reason = reason;
    }
  };
}

// \u6A21\u62DF Event \u548C EventTarget\uFF08\u5982\u679C\u4E0D\u5B58\u5728\uFF09
if (typeof EventTarget === 'undefined') {
  globalThis.EventTarget = class EventTarget {
    constructor() { this._listeners = {}; }
    addEventListener(type, listener) {
      (this._listeners[type] = this._listeners[type] || []).push(listener);
    }
    removeEventListener(type, listener) {
      if (this._listeners[type]) {
        this._listeners[type] = this._listeners[type].filter(l => l !== listener);
      }
    }
    dispatchEvent(event) {
      if (this._listeners[event.type]) {
        this._listeners[event.type].forEach(listener => listener(event));
      }
      return true;
    }
  };
}

if (typeof Event === 'undefined') {
  globalThis.Event = class Event {
    constructor(type, options = {}) {
      this.type = type;
      this.bubbles = options.bubbles || false;
      this.cancelable = options.cancelable || false;
    }
  };
}
`;
export {
  globalsCode
};
