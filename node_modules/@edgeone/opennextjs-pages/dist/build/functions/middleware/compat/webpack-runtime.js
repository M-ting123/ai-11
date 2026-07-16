
      var require = await (async () => {
        var { createRequire } = await import("node:module");
        return createRequire(import.meta.url);
      })();
    
import "../../../../esm-chunks/chunk-6BT4RYQJ.js";

// src/build/functions/middleware/compat/webpack-runtime.ts
var webpackRuntimeCode = `
// ============================================================
// Webpack Runtime Environment (\u7B80\u5316\u7248)
// ============================================================

// Webpack \u6A21\u5757\u7F13\u5B58
const __webpack_module_cache__ = {};

// Webpack \u6A21\u5757\u5B9A\u4E49
const __webpack_modules__ = {};

// Webpack require \u51FD\u6570
function __webpack_require__(moduleId) {
  // \u68C0\u67E5\u7F13\u5B58
  const cachedModule = __webpack_module_cache__[moduleId];
  if (cachedModule !== undefined) {
    return cachedModule.exports;
  }
  
  // \u521B\u5EFA\u65B0\u6A21\u5757\u5E76\u7F13\u5B58
  const module = __webpack_module_cache__[moduleId] = {
    id: moduleId,
    loaded: false,
    exports: {}
  };
  
  // \u6267\u884C\u6A21\u5757\u51FD\u6570
  __webpack_modules__[moduleId].call(
    module.exports,
    module,
    module.exports,
    __webpack_require__
  );
  
  // \u6807\u8BB0\u4E3A\u5DF2\u52A0\u8F7D
  module.loaded = true;
  
  return module.exports;
}

// \u6807\u8BB0\u4E3A ES \u6A21\u5757
__webpack_require__.r = (exports) => {
  if (typeof Symbol !== 'undefined' && Symbol.toStringTag) {
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
  }
  Object.defineProperty(exports, '__esModule', { value: true });
};

// \u5B9A\u4E49 getter \u5BFC\u51FA
__webpack_require__.d = (exports, definition) => {
  for (const key in definition) {
    if (__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
      Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
    }
  }
};

// hasOwnProperty \u7B80\u5199
__webpack_require__.o = (obj, prop) => Object.prototype.hasOwnProperty.call(obj, prop);

// \u83B7\u53D6\u9ED8\u8BA4\u5BFC\u51FA
__webpack_require__.n = (module) => {
  const getter = module && module.__esModule
    ? () => module['default']
    : () => module;
  __webpack_require__.d(getter, { a: getter });
  return getter;
};

// \u521B\u5EFA\u5047\u547D\u540D\u7A7A\u95F4\u5BF9\u8C61 (webpack runtime 't' function)
// mode & 1: value is a module id, require it
// mode & 2: merge all properties of value into the ns
// mode & 4: return value when already ns object
// mode & 8|1: behave like require
__webpack_require__.t = function(value, mode) {
  if (mode & 1) value = __webpack_require__(value);
  if (mode & 8) return value;
  if ((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
  var ns = Object.create(null);
  __webpack_require__.r(ns);
  Object.defineProperty(ns, 'default', { enumerable: true, value: value });
  if (mode & 2 && typeof value != 'string') {
    for (var key in value) {
      // __webpack_require__.d \u671F\u671B { key: getter } \u683C\u5F0F
      __webpack_require__.d(ns, { [key]: ((k) => () => value[k])(key) });
    }
  }
  return ns;
};

// \u5168\u5C40\u5BF9\u8C61
__webpack_require__.g = globalThis;

// \u516C\u5171\u8DEF\u5F84
__webpack_require__.p = '';

// \u6A21\u5757\u5DE5\u5382\u5F15\u7528
__webpack_require__.m = __webpack_modules__;

// \u6A21\u5757\u7F13\u5B58\u5F15\u7528
__webpack_require__.c = __webpack_module_cache__;

// \u517C\u5BB9 CommonJS
__webpack_require__.nmd = (module) => {
  module.paths = [];
  if (!module.children) module.children = [];
  return module;
};

// ============================================================
// Node.js \u6A21\u5757 Polyfill
// ============================================================

const nodeModules = {
  'node:buffer': { Buffer },
  'node:async_hooks': async_hooks,
  'node:crypto': crypto,
  'node:process': process,
  'node:url': { URL, URLSearchParams },
  'node:util': {
    promisify: (fn) => (...args) => new Promise((resolve, reject) => {
      fn(...args, (err, result) => err ? reject(err) : resolve(result));
    }),
    deprecate: (fn) => fn,
    inspect: (obj) => JSON.stringify(obj, null, 2),
    types: {
      isPromise: (val) => val instanceof Promise,
      isDate: (val) => val instanceof Date,
      isRegExp: (val) => val instanceof RegExp,
    }
  },
  'node:events': {
    EventEmitter: class EventEmitter {
      constructor() { this._events = {}; }
      on(event, listener) { (this._events[event] = this._events[event] || []).push(listener); return this; }
      off(event, listener) { 
        if (this._events[event]) {
          this._events[event] = this._events[event].filter(l => l !== listener);
        }
        return this;
      }
      emit(event, ...args) {
        if (this._events[event]) {
          this._events[event].forEach(listener => listener(...args));
          return true;
        }
        return false;
      }
      once(event, listener) {
        const onceListener = (...args) => {
          this.off(event, onceListener);
          listener(...args);
        };
        return this.on(event, onceListener);
      }
      removeAllListeners(event) {
        if (event) delete this._events[event];
        else this._events = {};
        return this;
      }
      listeners(event) { return this._events[event] || []; }
      listenerCount(event) { return (this._events[event] || []).length; }
    }
  },
  'node:path': {
    join: (...parts) => parts.join('/').replace(/\\/+/g, '/'),
    resolve: (...parts) => parts.join('/').replace(/\\/+/g, '/'),
    basename: (path, ext) => {
      const base = path.split('/').pop() || '';
      return ext && base.endsWith(ext) ? base.slice(0, -ext.length) : base;
    },
    dirname: (path) => path.split('/').slice(0, -1).join('/') || '/',
    extname: (path) => {
      const base = path.split('/').pop() || '';
      const idx = base.lastIndexOf('.');
      return idx > 0 ? base.slice(idx) : '';
    },
    parse: (path) => ({
      root: path.startsWith('/') ? '/' : '',
      dir: path.split('/').slice(0, -1).join('/'),
      base: path.split('/').pop() || '',
      ext: '',
      name: ''
    }),
    sep: '/',
    delimiter: ':'
  }
};

// ============================================================
// webpackChunk \u52A0\u8F7D\u5668 (\u7B80\u5316\u7248 - \u5355 chunk \u573A\u666F)
// ============================================================

// webpackChunk \u56DE\u8C03\u5904\u7406\u51FD\u6570
const webpackJsonpCallback = (data) => {
  const [chunkIds, moreModules, runtime] = data;
  
  // \u6CE8\u518C\u6A21\u5757
  for (const moduleId in moreModules) {
    if (__webpack_require__.o(moreModules, moduleId)) {
      __webpack_modules__[moduleId] = moreModules[moduleId];
    }
  }
  
  // \u6267\u884C runtime\uFF08\u6CE8\u518C _ENTRIES\uFF09
  if (runtime) {
    try {
      runtime(__webpack_require__);
    } catch (e) {
      console.error('[webpack] Runtime error:', e);
    }
  }
};

// \u521D\u59CB\u5316 webpackChunk \u5168\u5C40\u6570\u7EC4
// \u6CE8\u610F\uFF1Awebpack bundle \u4F1A\u6267\u884C (self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push(...)
// \u8FD9\u4E2A\u8D4B\u503C\u8868\u8FBE\u5F0F\u4F1A\u5148\u68C0\u67E5\u662F\u5426\u5B58\u5728\uFF0C\u5982\u679C\u5B58\u5728\u5C31\u4F7F\u7528\u73B0\u6709\u7684
// \u5173\u952E\uFF1A\u8D4B\u503C\u8868\u8FBE\u5F0F (a=b||c) \u8FD4\u56DE\u7684\u662F\u8D4B\u503C\u540E\u7684\u503C\uFF0C\u7136\u540E\u5728\u8FD9\u4E2A\u503C\u4E0A\u8C03\u7528 .push()
// \u6240\u4EE5\u5373\u4F7F\u6211\u4EEC\u8BBE\u7F6E\u4E86\u5E26\u91CD\u5199 push \u7684\u6570\u7EC4\uFF0C\u8D4B\u503C\u540E\u8FD4\u56DE\u7684\u662F\u540C\u4E00\u4E2A\u6570\u7EC4\uFF0Cpush \u4ECD\u7136\u662F\u91CD\u5199\u7684

// \u5982\u679C\u5DF2\u6709\u6570\u636E\uFF0C\u5148\u4FDD\u5B58
const existingChunks = self.webpackChunk_N_E || [];

// \u521B\u5EFA\u4E00\u4E2A\u7279\u6B8A\u7684\u6570\u7EC4\uFF0C\u5176 push \u65B9\u6CD5\u88AB\u91CD\u5199
const chunkArray = [...existingChunks];  // \u590D\u5236\u5DF2\u6709\u6570\u636E
const originalPush = Array.prototype.push;

// \u91CD\u5199 push \u65B9\u6CD5
chunkArray.push = function(...args) {
  for (const data of args) {
    webpackJsonpCallback(data);
  }
  return originalPush.apply(this, args);
};

// \u5904\u7406\u5DF2\u5B58\u5728\u7684 chunks\uFF08\u5982\u679C\u6709\u7684\u8BDD\uFF09
existingChunks.forEach(webpackJsonpCallback);

// \u8BBE\u7F6E\u5168\u5C40\u6570\u7EC4
// \u4F7F\u7528 getter/setter \u6765\u786E\u4FDD\u5373\u4F7F\u88AB"\u8D4B\u503C"\u4E5F\u8FD4\u56DE\u6211\u4EEC\u7684\u6570\u7EC4
let _webpackChunk = chunkArray;
Object.defineProperty(self, 'webpackChunk_N_E', {
  get() {
    return _webpackChunk;
  },
  set(value) {
    // \u5FFD\u7565\u8D4B\u503C\uFF0C\u59CB\u7EC8\u8FD4\u56DE\u6211\u4EEC\u7684\u6570\u7EC4
    // webpack bundle \u7684 (self.webpackChunk_N_E=self.webpackChunk_N_E||[]) \u4F1A\u89E6\u53D1\u8FD9\u4E2A setter
    // \u4F46\u6211\u4EEC\u4E0D\u6539\u53D8 _webpackChunk\uFF0C\u6240\u4EE5\u540E\u7EED\u7684 .push() \u4ECD\u7136\u662F\u6211\u4EEC\u91CD\u5199\u7684
    return _webpackChunk;
  },
  configurable: true
});
`;
export {
  webpackRuntimeCode
};
