"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/run/storage/storage.cts
var storage_exports = {};
__export(storage_exports, {
  getMemoizedKeyValueStoreBackedByRegionalBlobStore: () => getMemoizedKeyValueStoreBackedByRegionalBlobStore,
  setFetchBeforeNextPatchedIt: () => import_regional_blob_store.setFetchBeforeNextPatchedIt,
  setInMemoryCacheMaxSizeFromNextConfig: () => import_request_scoped_in_memory_cache.setInMemoryCacheMaxSizeFromNextConfig
});
module.exports = __toCommonJS(storage_exports);
var import_request_scoped_in_memory_cache = require("./request-scoped-in-memory-cache.cjs");
var import_regional_blob_store = require("./regional-blob-store.cjs");
var getMemoizedKeyValueStoreBackedByRegionalBlobStore = (...args) => {
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getMemoizedKeyValueStoreBackedByRegionalBlobStore,
  setFetchBeforeNextPatchedIt,
  setInMemoryCacheMaxSizeFromNextConfig
});
