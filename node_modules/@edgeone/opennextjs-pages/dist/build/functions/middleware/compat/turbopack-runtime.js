
      var require = await (async () => {
        var { createRequire } = await import("node:module");
        return createRequire(import.meta.url);
      })();
    
import "../../../../esm-chunks/chunk-6BT4RYQJ.js";

// src/build/functions/middleware/compat/turbopack-runtime.ts
function getTurbopackCompatCode() {
  return `
// ============================================================
// Turbopack Runtime \u517C\u5BB9\u5C42 (\u57FA\u4E8E Next.js \u5B98\u65B9\u5B9E\u73B0)
// ============================================================

const REEXPORTED_OBJECTS = new WeakMap();

// Context \u6784\u9020\u51FD\u6570 - \u7528\u4E8E\u521B\u5EFA __turbopack_context__
function Context(module, exports) {
  this.m = module;
  this.e = exports;
}

const contextPrototype = Context.prototype;
const hasOwnProperty = Object.prototype.hasOwnProperty;
const toStringTag = typeof Symbol !== 'undefined' && Symbol.toStringTag;

function defineProp(obj, name, options) {
  if (!hasOwnProperty.call(obj, name)) Object.defineProperty(obj, name, options);
}

function createModuleObject(id) {
  return {
    exports: {},
    error: undefined,
    id,
    loaded: false,
    namespaceObject: undefined
  };
}

function getOverwrittenModule(moduleCache, id) {
  let module = moduleCache[id];
  if (!module) {
    module = createModuleObject(id);
    moduleCache[id] = module;
  }
  return module;
}

const BindingTag_Value = 0;

// esm() - \u6DFB\u52A0 getters \u5230 exports \u5BF9\u8C61
function esm(exports, bindings) {
  defineProp(exports, '__esModule', { value: true });
  if (toStringTag) defineProp(exports, toStringTag, { value: 'Module' });
  
  let i = 0;
  while (i < bindings.length) {
    const propName = bindings[i++];
    const tagOrFunction = bindings[i++];
    if (typeof tagOrFunction === 'number') {
      if (tagOrFunction === BindingTag_Value) {
        defineProp(exports, propName, {
          value: bindings[i++],
          enumerable: true,
          writable: false
        });
      } else {
        throw new Error('unexpected tag: ' + tagOrFunction);
      }
    } else {
      const getterFn = tagOrFunction;
      if (typeof bindings[i] === 'function') {
        const setterFn = bindings[i++];
        defineProp(exports, propName, {
          get: getterFn,
          set: setterFn,
          enumerable: true
        });
      } else {
        defineProp(exports, propName, {
          get: getterFn,
          enumerable: true
        });
      }
    }
  }
  Object.seal(exports);
}

// e.s() - ESM export
function esmExport(bindings, id) {
  let module, exports;
  if (id != null) {
    module = getOverwrittenModule(moduleCache, id);
    exports = module.exports;
  } else {
    module = this.m;
    exports = this.e;
  }
  module.namespaceObject = exports;
  esm(exports, bindings);
}
contextPrototype.s = esmExport;

function ensureDynamicExports(module, exports) {
  let reexportedObjects = REEXPORTED_OBJECTS.get(module);
  if (!reexportedObjects) {
    REEXPORTED_OBJECTS.set(module, reexportedObjects = []);
    module.exports = module.namespaceObject = new Proxy(exports, {
      get(target, prop) {
        if (hasOwnProperty.call(target, prop) || prop === 'default' || prop === '__esModule') {
          return Reflect.get(target, prop);
        }
        for (const obj of reexportedObjects) {
          const value = Reflect.get(obj, prop);
          if (value !== undefined) return value;
        }
        return undefined;
      },
      ownKeys(target) {
        const keys = Reflect.ownKeys(target);
        for (const obj of reexportedObjects) {
          for (const key of Reflect.ownKeys(obj)) {
            if (key !== 'default' && !keys.includes(key)) keys.push(key);
          }
        }
        return keys;
      }
    });
  }
  return reexportedObjects;
}

// e.j() - \u52A8\u6001\u5BFC\u51FA
function dynamicExport(object, id) {
  let module, exports;
  if (id != null) {
    module = getOverwrittenModule(moduleCache, id);
    exports = module.exports;
  } else {
    module = this.m;
    exports = this.e;
  }
  const reexportedObjects = ensureDynamicExports(module, exports);
  if (typeof object === 'object' && object !== null) {
    reexportedObjects.push(object);
  }
}
contextPrototype.j = dynamicExport;

// e.v() - \u5BFC\u51FA\u503C
function exportValue(value, id) {
  let module;
  if (id != null) {
    module = getOverwrittenModule(moduleCache, id);
  } else {
    module = this.m;
  }
  module.exports = value;
}
contextPrototype.v = exportValue;

// e.n() - \u5BFC\u51FA\u547D\u540D\u7A7A\u95F4
function exportNamespace(namespace, id) {
  let module;
  if (id != null) {
    module = getOverwrittenModule(moduleCache, id);
  } else {
    module = this.m;
  }
  module.exports = module.namespaceObject = namespace;
}
contextPrototype.n = exportNamespace;

function createGetter(obj, key) {
  return () => obj[key];
}

const getProto = Object.getPrototypeOf ? (obj) => Object.getPrototypeOf(obj) : (obj) => obj.__proto__;
const LEAF_PROTOTYPES = [null, getProto({}), getProto([]), getProto(getProto)];

function interopEsm(raw, ns, allowExportDefault) {
  const bindings = [];
  let defaultLocation = -1;
  for (let current = raw; (typeof current === 'object' || typeof current === 'function') && !LEAF_PROTOTYPES.includes(current); current = getProto(current)) {
    for (const key of Object.getOwnPropertyNames(current)) {
      bindings.push(key, createGetter(raw, key));
      if (defaultLocation === -1 && key === 'default') {
        defaultLocation = bindings.length - 1;
      }
    }
  }
  if (!(allowExportDefault && defaultLocation >= 0)) {
    if (defaultLocation >= 0) {
      bindings.splice(defaultLocation, 1, BindingTag_Value, raw);
    } else {
      bindings.push('default', BindingTag_Value, raw);
    }
  }
  esm(ns, bindings);
  return ns;
}

function createNS(raw) {
  if (typeof raw === 'function') {
    return function(...args) {
      return raw.apply(this, args);
    };
  } else {
    return Object.create(null);
  }
}

// e.i() - ESM import
function esmImport(id) {
  const module = getOrInstantiateModuleFromParent(id, this.m);
  if (module.namespaceObject) return module.namespaceObject;
  const raw = module.exports;
  return module.namespaceObject = interopEsm(raw, createNS(raw), raw && raw.__esModule);
}
contextPrototype.i = esmImport;

// e.A() - \u5F02\u6B65\u52A0\u8F7D\u5668
function asyncLoader(moduleId) {
  const loader = this.r(moduleId);
  return loader(esmImport.bind(this));
}
contextPrototype.A = asyncLoader;

// e.t() - runtime require
const runtimeRequire = typeof require === 'function' ? require : function require() {
  throw new Error('Unexpected use of runtime require');
};
contextPrototype.t = runtimeRequire;

// e.r() - CommonJS require
function commonJsRequire(id) {
  return getOrInstantiateModuleFromParent(id, this.m).exports;
}
contextPrototype.r = commonJsRequire;

// e.f() - module context
function parseRequest(request) {
  const hashIndex = request.indexOf('#');
  if (hashIndex !== -1) {
    request = request.substring(0, hashIndex);
  }
  const queryIndex = request.indexOf('?');
  if (queryIndex !== -1) {
    request = request.substring(0, queryIndex);
  }
  return request;
}

function moduleContext(map) {
  function moduleContext(id) {
    id = parseRequest(id);
    if (hasOwnProperty.call(map, id)) {
      return map[id].module();
    }
    const e = new Error("Cannot find module '" + id + "'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
  }
  moduleContext.keys = () => Object.keys(map);
  moduleContext.resolve = (id) => {
    id = parseRequest(id);
    if (hasOwnProperty.call(map, id)) {
      return map[id].id();
    }
    const e = new Error("Cannot find module '" + id + "'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
  };
  moduleContext.import = async (id) => await moduleContext(id);
  return moduleContext;
}
contextPrototype.f = moduleContext;

// e.g - globalThis
contextPrototype.g = globalThis;

// e.z() - require stub
function requireStub(_moduleId) {
  throw new Error('dynamic usage of require is not supported');
}
contextPrototype.z = requireStub;

// e.x() - external require (Edge \u73AF\u5883 mock)
function externalRequire(id, thunk, esm = false) {
  let raw;
  try {
    if (thunk) {
      raw = thunk();
    } else {
      // Edge \u73AF\u5883\u4E0B\u7684 mock
      raw = getExternalMock(id);
    }
  } catch (err) {
    console.warn('[Turbopack] Failed to load external module:', id, err);
    raw = getExternalMock(id);
  }
  if (!esm || (raw && raw.__esModule)) {
    return raw;
  }
  return interopEsm(raw, createNS(raw), true);
}
externalRequire.resolve = (id, options) => id;
contextPrototype.x = externalRequire;

// e.y() - external import (async)
async function externalImport(id) {
  let raw;
  try {
    raw = await import(id);
  } catch (err) {
    console.warn('[Turbopack] Failed to import external module:', id, err);
    raw = getExternalMock(id);
  }
  if (raw && raw.__esModule && raw.default && 'default' in raw.default) {
    return interopEsm(raw.default, createNS(raw), true);
  }
  return raw;
}
contextPrototype.y = externalImport;

// \u5916\u90E8\u6A21\u5757 mock
function getExternalMock(id) {
  // AsyncLocalStorage mock
  if (id.includes('async_hooks') || id.includes('async-storage') || id.includes('AsyncLocalStorage')) {
    const AsyncLocalStorageMock = function() {};
    AsyncLocalStorageMock.prototype.getStore = function() { return undefined; };
    AsyncLocalStorageMock.prototype.run = function(store, fn) { return fn(); };
    AsyncLocalStorageMock.prototype.enterWith = function() {};
    AsyncLocalStorageMock.prototype.disable = function() {};
    AsyncLocalStorageMock.prototype.exit = function(fn) { return fn(); };
    return { AsyncLocalStorage: AsyncLocalStorageMock, default: { AsyncLocalStorage: AsyncLocalStorageMock } };
  }
  
  // Work unit storage mock
  if (id.includes('work-unit') || id.includes('work-async') || id.includes('workUnitAsyncStorage')) {
    return { getStore: () => undefined, run: (store, fn) => fn() };
  }
  
  // Request storage mock
  if (id.includes('request-async') || id.includes('requestAsyncStorage')) {
    return { getStore: () => undefined, run: (store, fn) => fn() };
  }
  
  // Static generation storage mock
  if (id.includes('static-generation') || id.includes('staticGenerationAsyncStorage')) {
    return { getStore: () => undefined, run: (store, fn) => fn() };
  }
  
  // \u901A\u7528 mock
  return {};
}

// Turbopack async module \u652F\u6301
const turbopackQueues = Symbol('turbopack queues');
const turbopackExports = Symbol('turbopack exports');
const turbopackError = Symbol('turbopack error');

function resolveQueue(queue) {
  if (queue && queue.status !== 1) {
    queue.status = 1;
    queue.forEach((fn) => fn.queueCount--);
    queue.forEach((fn) => fn.queueCount-- ? fn.queueCount++ : fn());
  }
}

function isPromise(maybePromise) {
  return maybePromise != null && typeof maybePromise === 'object' && 'then' in maybePromise && typeof maybePromise.then === 'function';
}

function isAsyncModuleExt(obj) {
  return turbopackQueues in obj;
}

function createPromise() {
  let resolve, reject;
  const promise = new Promise((res, rej) => {
    reject = rej;
    resolve = res;
  });
  return { promise, resolve, reject };
}

function wrapDeps(deps) {
  return deps.map((dep) => {
    if (dep !== null && typeof dep === 'object') {
      if (isAsyncModuleExt(dep)) return dep;
      if (isPromise(dep)) {
        const queue = Object.assign([], { status: 0 });
        const obj = {
          [turbopackExports]: {},
          [turbopackQueues]: (fn) => fn(queue)
        };
        dep.then((res) => {
          obj[turbopackExports] = res;
          resolveQueue(queue);
        }, (err) => {
          obj[turbopackError] = err;
          resolveQueue(queue);
        });
        return obj;
      }
    }
    return {
      [turbopackExports]: dep,
      [turbopackQueues]: () => {}
    };
  });
}

// e.a() - async module
function asyncModule(body, hasAwait) {
  const module = this.m;
  const queue = hasAwait ? Object.assign([], { status: -1 }) : undefined;
  const depQueues = new Set();
  const { resolve, reject, promise: rawPromise } = createPromise();
  const promise = Object.assign(rawPromise, {
    [turbopackExports]: module.exports,
    [turbopackQueues]: (fn) => {
      queue && fn(queue);
      depQueues.forEach(fn);
      promise['catch'](() => {});
    }
  });
  const attributes = {
    get() { return promise; },
    set(v) {
      if (v !== promise) {
        promise[turbopackExports] = v;
      }
    }
  };
  Object.defineProperty(module, 'exports', attributes);
  Object.defineProperty(module, 'namespaceObject', attributes);
  
  function handleAsyncDependencies(deps) {
    const currentDeps = wrapDeps(deps);
    const getResult = () => currentDeps.map((d) => {
      if (d[turbopackError]) throw d[turbopackError];
      return d[turbopackExports];
    });
    const { promise, resolve } = createPromise();
    const fn = Object.assign(() => resolve(getResult), { queueCount: 0 });
    function fnQueue(q) {
      if (q !== queue && !depQueues.has(q)) {
        depQueues.add(q);
        if (q && q.status === 0) {
          fn.queueCount++;
          q.push(fn);
        }
      }
    }
    currentDeps.map((dep) => dep[turbopackQueues](fnQueue));
    return fn.queueCount ? promise : getResult();
  }
  
  function asyncResult(err) {
    if (err) {
      reject(promise[turbopackError] = err);
    } else {
      resolve(promise[turbopackExports]);
    }
    resolveQueue(queue);
  }
  
  body(handleAsyncDependencies, asyncResult);
  if (queue && queue.status === -1) {
    queue.status = 0;
  }
}
contextPrototype.a = asyncModule;

// e.U() - relative URL
const relativeURL = function relativeURL(inputUrl) {
  const realUrl = new URL(inputUrl, 'x:/');
  const values = {};
  for (const key in realUrl) values[key] = realUrl[key];
  values.href = inputUrl;
  values.pathname = inputUrl.replace(/[?#].*/, '');
  values.origin = values.protocol = '';
  values.toString = values.toJSON = (..._args) => inputUrl;
  for (const key in values) Object.defineProperty(this, key, {
    enumerable: true,
    configurable: true,
    value: values[key]
  });
};
relativeURL.prototype = URL.prototype;
contextPrototype.U = relativeURL;

// e.l() - load chunk async (Edge \u73AF\u5883 mock)
function loadChunkAsync(chunkData) {
  // Edge \u73AF\u5883\u4E0B chunks \u5DF2\u5185\u8054\uFF0C\u76F4\u63A5\u8FD4\u56DE resolved promise
  return Promise.resolve(undefined);
}
contextPrototype.l = loadChunkAsync;

// e.L() - load chunk by URL
function loadChunkAsyncByUrl(chunkUrl) {
  return Promise.resolve(undefined);
}
contextPrototype.L = loadChunkAsyncByUrl;

// e.w() - load WebAssembly
function loadWebAssembly(chunkPath, _edgeModule, imports) {
  throw new Error('WebAssembly loading not supported in Edge environment');
}
contextPrototype.w = loadWebAssembly;

// e.u() - load WebAssembly module
function loadWebAssemblyModule(chunkPath, _edgeModule) {
  throw new Error('WebAssembly module loading not supported in Edge environment');
}
contextPrototype.u = loadWebAssemblyModule;

// e.P() - resolve absolute path (Edge \u73AF\u5883 mock)
function resolveAbsolutePath(modulePath) {
  return modulePath || '/';
}
contextPrototype.P = resolveAbsolutePath;

// e.R() - resolve path from module
function resolvePathFromModule(moduleId) {
  const exported = this.r(moduleId);
  return exported?.default ?? exported;
}
contextPrototype.R = resolvePathFromModule;

// e.M - module factories
contextPrototype.M = null; // \u5C06\u5728\u521D\u59CB\u5316\u65F6\u8BBE\u7F6E

// e.c - module cache
contextPrototype.c = null; // \u5C06\u5728\u521D\u59CB\u5316\u65F6\u8BBE\u7F6E

// ============================================================
// \u6A21\u5757\u7CFB\u7EDF
// ============================================================

const moduleFactories = new Map();
const moduleCache = Object.create(null);

// \u66F4\u65B0 context prototype \u7684\u7F13\u5B58\u5F15\u7528
contextPrototype.M = moduleFactories;
contextPrototype.c = moduleCache;

// \u5B89\u88C5\u538B\u7F29\u683C\u5F0F\u7684\u6A21\u5757\u5DE5\u5382
function installCompressedModuleFactories(chunkModules, offset) {
  let i = offset;
  while (i < chunkModules.length) {
    let moduleId = chunkModules[i];
    let end = i + 1;
    while (end < chunkModules.length && typeof chunkModules[end] !== 'function') {
      end++;
    }
    if (end === chunkModules.length) {
      throw new Error('malformed chunk format, expected a factory function');
    }
    if (!moduleFactories.has(moduleId)) {
      const moduleFactoryFn = chunkModules[end];
      for (; i < end; i++) {
        moduleId = chunkModules[i];
        moduleFactories.set(moduleId, moduleFactoryFn);
      }
    }
    i = end + 1;
  }
}

// \u5B9E\u4F8B\u5316\u6A21\u5757
function instantiateModule(id, sourceType, sourceData) {
  const moduleFactory = moduleFactories.get(id);
  if (typeof moduleFactory !== 'function') {
    let reason = sourceType === 0 
      ? 'as a runtime entry of chunk ' + sourceData
      : 'because it was required from module ' + sourceData;
    throw new Error('Module ' + id + ' was instantiated ' + reason + ', but the module factory is not available.');
  }
  
  const module = createModuleObject(id);
  const exports = module.exports;
  moduleCache[id] = module;
  
  const context = new Context(module, exports);
  
  try {
    moduleFactory(context, module, exports);
  } catch (error) {
    module.error = error;
    throw error;
  }
  
  module.loaded = true;
  if (module.namespaceObject && module.exports !== module.namespaceObject) {
    interopEsm(module.exports, module.namespaceObject);
  }
  
  return module;
}

// \u4ECE\u7236\u6A21\u5757\u83B7\u53D6\u6216\u5B9E\u4F8B\u5316\u6A21\u5757
function getOrInstantiateModuleFromParent(id, sourceModule) {
  const module = moduleCache[id];
  if (module) {
    if (module.error) {
      throw module.error;
    }
    return module;
  }
  return instantiateModule(id, 1, sourceModule.id);
}

// \u5B9E\u4F8B\u5316\u8FD0\u884C\u65F6\u6A21\u5757
function instantiateRuntimeModule(chunkPath, moduleId) {
  return instantiateModule(moduleId, 0, chunkPath);
}

// \u83B7\u53D6\u6216\u5B9E\u4F8B\u5316\u8FD0\u884C\u65F6\u6A21\u5757
function getOrInstantiateRuntimeModule(chunkPath, moduleId) {
  const module = moduleCache[moduleId];
  if (module) {
    if (module.error) {
      throw module.error;
    }
    return module;
  }
  return instantiateRuntimeModule(chunkPath, moduleId);
}

// \u52A0\u8F7D\u8FD0\u884C\u65F6 chunk
function loadRuntimeChunk(sourcePath, chunkData) {
  const chunkPath = typeof chunkData === 'string' ? chunkData : chunkData.path;
  // Edge \u73AF\u5883\u4E0B chunks \u5DF2\u5185\u8054\uFF0C\u8FD9\u91CC\u53EA\u9700\u8981\u5904\u7406\u5DF2\u52A0\u8F7D\u7684\u6A21\u5757
}

// \u5168\u5C40 _ENTRIES \u5BF9\u8C61
globalThis._ENTRIES = globalThis._ENTRIES || {};

// Turbopack runtime \u5BFC\u51FA
globalThis.__turbopack_runtime__ = {
  m: (id) => getOrInstantiateRuntimeModule('edge', id),
  c: (chunkData) => loadRuntimeChunk('edge', chunkData),
  installModules: installCompressedModuleFactories,
  moduleFactories,
  moduleCache,
  Context,
  instantiateModule,
  getOrInstantiateModuleFromParent
};
`;
}
var turbopack_runtime_default = { getTurbopackCompatCode };
export {
  turbopack_runtime_default as default,
  getTurbopackCompatCode
};
