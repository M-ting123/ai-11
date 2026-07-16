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

// src/run/storage/regional-blob-store.cts
var regional_blob_store_exports = {};
__export(regional_blob_store_exports, {
  getRegionalBlobStore: () => getRegionalBlobStore,
  setFetchBeforeNextPatchedIt: () => setFetchBeforeNextPatchedIt
});
module.exports = __toCommonJS(regional_blob_store_exports);
var FETCH_BEFORE_NEXT_PATCHED_IT = Symbol.for("nf-not-patched-fetch");
var extendedGlobalThis = globalThis;
function attemptToGetOriginalFetch(fetch) {
  return fetch._nextOriginalFetch ?? fetch;
}
function forceOptOutOfUsingDataCache(fetch) {
  return (input, init) => {
    return fetch(input, {
      ...init,
      next: {
        ...init?.next,
        // setting next.internal = true should prevent from trying to use data cache
        // https://github.com/vercel/next.js/blob/fa214c74c1d8023098c0e94e57f917ef9f1afd1a/packages/next/src/server/lib/patch-fetch.ts#L174
        // https://github.com/vercel/next.js/blob/fa214c74c1d8023098c0e94e57f917ef9f1afd1a/packages/next/src/server/lib/patch-fetch.ts#L210-L213
        // this is last line of defense in case we didn't manage to get unpatched fetch that will not affect
        // fetch if it's unpatched so it should be safe to apply always if we aren't sure if we use patched fetch
        // @ts-expect-error - this is an internal field that Next.js doesn't add to its global
        // type overrides for RequestInit type (like `next.revalidate` or `next.tags`)
        internal: true
      }
    });
  };
}
var setFetchBeforeNextPatchedIt = (fetch) => {
  extendedGlobalThis[FETCH_BEFORE_NEXT_PATCHED_IT] = forceOptOutOfUsingDataCache(
    attemptToGetOriginalFetch(fetch)
  );
};
var fetchBeforeNextPatchedItFallback = forceOptOutOfUsingDataCache(
  attemptToGetOriginalFetch(globalThis.fetch)
);
var getRegionalBlobStore = (args = {}) => {
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getRegionalBlobStore,
  setFetchBeforeNextPatchedIt
});
