"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/run/next.cts
var next_exports = {};
__export(next_exports, {
  getMockedRequestHandler: () => getMockedRequestHandler
});
module.exports = __toCommonJS(next_exports);
var import_node_async_hooks = require("node:async_hooks");
var import_promises = __toESM(require("node:fs/promises"));
var import_request_context = require("./handlers/request-context.cjs");
var import_tracer = require("./handlers/tracer.cjs");
process.env.NODE_ENV = "production";
var { getRequestHandlers } = require("next/dist/server/lib/start-server.js");
var ResponseCache = require("next/dist/server/response-cache/index.js").default;
var originalGet = ResponseCache.prototype.get;
ResponseCache.prototype.get = function get(...getArgs) {
  if (!this.didAddBackgroundWorkTracking) {
    if (typeof this.batcher !== "undefined") {
      const originalBatcherBatch = this.batcher.batch;
      this.batcher.batch = async (key, fn) => {
        const trackedFn = async (...workFnArgs) => {
          const workPromise = fn(...workFnArgs);
          const requestContext = (0, import_request_context.getRequestContext)();
          if (requestContext && workPromise instanceof Promise) {
            requestContext.trackBackgroundWork(workPromise);
          }
          return await workPromise;
        };
        return originalBatcherBatch.call(this.batcher, key, trackedFn);
      };
    } else if (typeof this.pendingResponses !== "undefined") {
      const backgroundWork = /* @__PURE__ */ new Map();
      const originalPendingResponsesSet = this.pendingResponses.set;
      this.pendingResponses.set = async (key, value) => {
        const requestContext = (0, import_request_context.getRequestContext)();
        if (requestContext && !this.pendingResponses.has(key)) {
          const workPromise = new Promise((_resolve) => {
            backgroundWork.set(key, _resolve);
          });
          requestContext.trackBackgroundWork(workPromise);
        }
        return originalPendingResponsesSet.call(this.pendingResponses, key, value);
      };
      const originalPendingResponsesDelete = this.pendingResponses.delete;
      this.pendingResponses.delete = async (key) => {
        const _resolve = backgroundWork.get(key);
        if (_resolve) {
          _resolve();
        }
        return originalPendingResponsesDelete.call(this.pendingResponses, key);
      };
    }
    this.didAddBackgroundWorkTracking = true;
  }
  return originalGet.apply(this, getArgs);
};
async function getMockedRequestHandler(...args) {
  const initContext = { initializingServer: true };
  const initAsyncLocalStorage = new import_node_async_hooks.AsyncLocalStorage();
  const tracer = (0, import_tracer.getTracer)();
  return tracer.withActiveSpan("mocked request handler", async () => {
    const ofs = { ...import_promises.default };
    const requestHandlers = await initAsyncLocalStorage.run(initContext, async () => {
      return await getRequestHandlers(...args);
    });
    return Array.isArray(requestHandlers) ? requestHandlers[0] : requestHandlers.requestHandler;
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getMockedRequestHandler
});
