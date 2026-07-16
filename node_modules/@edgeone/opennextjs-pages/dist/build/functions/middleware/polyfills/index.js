
      var require = await (async () => {
        var { createRequire } = await import("node:module");
        return createRequire(import.meta.url);
      })();
    
import "../../../../esm-chunks/chunk-6BT4RYQJ.js";

// src/build/functions/middleware/polyfills/index.ts
import { bufferPolyfill } from "./buffer.js";
import { processPolyfill } from "./process.js";
import { asyncLocalStoragePolyfill } from "./async-local-storage.js";
import { cryptoPolyfill } from "./crypto.js";
var headersPolyfill = `
// === Headers Polyfill for EdgeOne ===
// EdgeOne Headers \u6784\u9020\u51FD\u6570\u4E0D\u63A5\u53D7 undefined \u53C2\u6570\uFF0C\u9700\u8981\u5305\u88C5\u5904\u7406
(function() {
  const OriginalHeaders = globalThis.Headers;
  
  // \u68C0\u67E5\u662F\u5426\u9700\u8981 polyfill
  let needsPatch = false;
  try {
    new OriginalHeaders(undefined);
  } catch (e) {
    needsPatch = true;
  }
  
  if (needsPatch) {
    // \u4F7F\u7528 Proxy \u5305\u88C5 Headers \u6784\u9020\u51FD\u6570
    globalThis.Headers = new Proxy(OriginalHeaders, {
      construct(target, args) {
        // \u5982\u679C\u7B2C\u4E00\u4E2A\u53C2\u6570\u662F undefined \u6216 null\uFF0C\u4F20\u5165\u7A7A\u5BF9\u8C61
        if (args[0] === undefined || args[0] === null) {
          return new target({});
        }
        return new target(...args);
      },
      get(target, prop, receiver) {
        return Reflect.get(target, prop, receiver);
      }
    });
  }
})();
`;
var responsePolyfill = `
// === Response Polyfill for EdgeOne ===
// \u786E\u4FDD Response \u6784\u9020\u51FD\u6570\u80FD\u6B63\u786E\u5904\u7406\u5404\u79CD\u53C2\u6570
(function() {
  const OriginalResponse = globalThis.Response;
  
  // \u6E05\u7406 ResponseInit \u53C2\u6570\uFF0C\u53EA\u4FDD\u7559 EdgeOne \u652F\u6301\u7684\u5C5E\u6027
  function cleanResponseInit(init) {
    if (init === undefined || init === null) {
      return {};
    }
    if (typeof init !== 'object') {
      return init;
    }
    // \u53EA\u4FDD\u7559 EdgeOne \u652F\u6301\u7684\u5C5E\u6027: status, statusText, headers
    const cleanInit = {};
    if (init.status !== undefined) cleanInit.status = init.status;
    if (init.statusText !== undefined) cleanInit.statusText = init.statusText;
    if (init.headers !== undefined) cleanInit.headers = init.headers;
    return cleanInit;
  }
  
  // \u5305\u88C5 Response.redirect \u9759\u6001\u65B9\u6CD5
  // EdgeOne \u7684 Response.redirect \u53EA\u63A5\u53D7\u5B57\u7B26\u4E32\uFF0C\u4E0D\u63A5\u53D7 URL \u5BF9\u8C61
  const originalRedirect = OriginalResponse.redirect;
  const patchedRedirect = function(url, status) {
    // \u5982\u679C url \u662F URL \u5BF9\u8C61\uFF0C\u8F6C\u6362\u4E3A\u5B57\u7B26\u4E32
    const urlString = (url && typeof url === 'object' && url.toString) ? url.toString() : url;
    return originalRedirect.call(OriginalResponse, urlString, status);
  };
  
  // Response.json \u9759\u6001\u65B9\u6CD5 polyfill
  // \u67D0\u4E9B Edge \u8FD0\u884C\u65F6\u4E0D\u652F\u6301\u8FD9\u4E2A\u8F83\u65B0\u7684 Web API
  const patchedJson = function(data, init) {
    const body = JSON.stringify(data);
    const responseInit = cleanResponseInit(init) || {};
    
    // \u8BBE\u7F6E Content-Type header
    const headers = new Headers(responseInit.headers || {});
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    responseInit.headers = headers;
    
    return new OriginalResponse(body, responseInit);
  };
  
  // \u521B\u5EFA cookies \u5BF9\u8C61\u7684\u5DE5\u5382\u51FD\u6570
  function createResponseCookies(response) {
    const cookieStore = new Map();
    return {
      get: (name) => cookieStore.get(name),
      getAll: () => Array.from(cookieStore.values()),
      has: (name) => cookieStore.has(name),
      set: (nameOrOptions, value, options) => {
        let cookieName, cookieValue, cookieOptions;
        if (typeof nameOrOptions === 'object') {
          cookieName = nameOrOptions.name;
          cookieValue = nameOrOptions.value;
          cookieOptions = nameOrOptions;
        } else {
          cookieName = nameOrOptions;
          cookieValue = value;
          cookieOptions = options || {};
        }
        cookieStore.set(cookieName, { name: cookieName, value: cookieValue, ...cookieOptions });
        // \u540C\u6B65\u5230 Set-Cookie header
        const cookieParts = [cookieName + '=' + encodeURIComponent(cookieValue)];
        if (cookieOptions.path) cookieParts.push('Path=' + cookieOptions.path);
        if (cookieOptions.domain) cookieParts.push('Domain=' + cookieOptions.domain);
        if (cookieOptions.maxAge) cookieParts.push('Max-Age=' + cookieOptions.maxAge);
        if (cookieOptions.expires) cookieParts.push('Expires=' + cookieOptions.expires.toUTCString());
        if (cookieOptions.httpOnly) cookieParts.push('HttpOnly');
        if (cookieOptions.secure) cookieParts.push('Secure');
        if (cookieOptions.sameSite) cookieParts.push('SameSite=' + cookieOptions.sameSite);
        response.headers.append('Set-Cookie', cookieParts.join('; '));
      },
      delete: (name) => {
        cookieStore.delete(name);
        response.headers.append('Set-Cookie', name + '=; Max-Age=0; Path=/');
      },
      clear: () => cookieStore.clear(),
      [Symbol.iterator]: () => cookieStore.values(),
      size: cookieStore.size
    };
  }
  
  // \u4F7F\u7528 Proxy \u5305\u88C5 Response \u6784\u9020\u51FD\u6570
  globalThis.Response = new Proxy(OriginalResponse, {
    construct(target, args) {
      // args[0] = body, args[1] = init
      const body = args[0];
      const init = cleanResponseInit(args[1]);
      const response = new target(body, init);
      
      // \u4E3A response \u6DFB\u52A0 cookies \u5C5E\u6027\uFF08NextResponse \u517C\u5BB9\uFF09
      if (!response.cookies) {
        Object.defineProperty(response, 'cookies', {
          value: createResponseCookies(response),
          writable: true,
          enumerable: true
        });
      }
      
      return response;
    },
    get(target, prop, receiver) {
      // \u62E6\u622A redirect \u9759\u6001\u65B9\u6CD5
      if (prop === 'redirect') {
        return patchedRedirect;
      }
      // \u62E6\u622A json \u9759\u6001\u65B9\u6CD5\uFF08polyfill for Edge runtime\uFF09
      if (prop === 'json') {
        // \u5982\u679C\u539F\u751F\u652F\u6301\u5C31\u7528\u539F\u751F\u7684\uFF0C\u5426\u5219\u7528 polyfill
        if (typeof OriginalResponse.json === 'function') {
          return OriginalResponse.json.bind(OriginalResponse);
        }
        return patchedJson;
      }
      // \u5176\u4ED6\u9759\u6001\u65B9\u6CD5\u76F4\u63A5\u4ECE\u539F\u59CB Response \u83B7\u53D6
      return Reflect.get(target, prop, receiver);
    }
  });
})();
`;
function getPolyfillsCode() {
  return `
// ============================================================
// Node.js Polyfills for Edge Runtime
// ============================================================

${headersPolyfill}

${responsePolyfill}

${bufferPolyfill}

${processPolyfill}

${asyncLocalStoragePolyfill}

${cryptoPolyfill}

// === Additional Globals ===
if (typeof globalThis.self === 'undefined') {
  globalThis.self = globalThis;
}

// === Node.js \u8DEF\u5F84\u76F8\u5173\u5168\u5C40\u53D8\u91CF ===
// \u8FB9\u7F18\u73AF\u5883\u4E0D\u652F\u6301 __dirname \u548C __filename\uFF0C\u63D0\u4F9B\u6A21\u62DF\u503C
if (typeof __dirname === 'undefined') {
  globalThis.__dirname = '/';
}
if (typeof __filename === 'undefined') {
  globalThis.__filename = '/index.js';
}

// === module \u548C exports \u517C\u5BB9 ===
// \u67D0\u4E9B CommonJS \u4EE3\u7801\u53EF\u80FD\u5F15\u7528\u8FD9\u4E9B\u53D8\u91CF
if (typeof module === 'undefined') {
  globalThis.module = { exports: {} };
}
if (typeof exports === 'undefined') {
  globalThis.exports = globalThis.module.exports;
}

// \u6A21\u62DF node:buffer \u6A21\u5757
const nodeBuffer = { Buffer };

// \u6A21\u62DF node:async_hooks \u6A21\u5757\u5BFC\u51FA
const nodeAsyncHooks = async_hooks;
`;
}
export {
  asyncLocalStoragePolyfill,
  bufferPolyfill,
  cryptoPolyfill,
  getPolyfillsCode,
  processPolyfill
};
