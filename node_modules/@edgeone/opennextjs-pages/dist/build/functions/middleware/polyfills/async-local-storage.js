
      var require = await (async () => {
        var { createRequire } = await import("node:module");
        return createRequire(import.meta.url);
      })();
    
import "../../../../esm-chunks/chunk-6BT4RYQJ.js";

// src/build/functions/middleware/polyfills/async-local-storage.ts
var asyncLocalStoragePolyfill = `
// === AsyncLocalStorage Polyfill ===
const AsyncLocalStorage = (function() {
  // \u4F7F\u7528 WeakMap \u5B58\u50A8\u5F02\u6B65\u4E0A\u4E0B\u6587
  const asyncContexts = new WeakMap();
  let currentContext = null;

  class AsyncLocalStoragePolyfill {
    constructor() {
      this._enabled = true;
      this._store = undefined;
    }

    disable() {
      this._enabled = false;
    }

    getStore() {
      if (!this._enabled) return undefined;
      return this._store;
    }

    run(store, callback, ...args) {
      if (!this._enabled) {
        return callback(...args);
      }
      const previousStore = this._store;
      this._store = store;
      try {
        return callback(...args);
      } finally {
        this._store = previousStore;
      }
    }

    exit(callback, ...args) {
      if (!this._enabled) {
        return callback(...args);
      }
      const previousStore = this._store;
      this._store = undefined;
      try {
        return callback(...args);
      } finally {
        this._store = previousStore;
      }
    }

    enterWith(store) {
      if (!this._enabled) return;
      this._store = store;
    }

    static bind(fn) {
      return fn;
    }

    static snapshot() {
      return (fn, ...args) => fn(...args);
    }
  }

  return AsyncLocalStoragePolyfill;
})();

// \u6A21\u62DF node:async_hooks \u6A21\u5757
const async_hooks = {
  AsyncLocalStorage,
  createHook: () => ({
    enable: () => {},
    disable: () => {}
  }),
  executionAsyncId: () => 0,
  triggerAsyncId: () => 0,
  executionAsyncResource: () => ({}),
  AsyncResource: class AsyncResource {
    constructor(type) { this.type = type; }
    runInAsyncScope(fn, thisArg, ...args) { return fn.call(thisArg, ...args); }
    emitDestroy() { return this; }
    asyncId() { return 0; }
    triggerAsyncId() { return 0; }
    bind(fn) { return fn; }
    static bind(fn) { return fn; }
  }
};

globalThis.AsyncLocalStorage = AsyncLocalStorage;
`;
export {
  asyncLocalStoragePolyfill
};
