
      var require = await (async () => {
        var { createRequire } = await import("node:module");
        return createRequire(import.meta.url);
      })();
    
import "../../../../esm-chunks/chunk-6BT4RYQJ.js";

// src/build/functions/middleware/compat/index.ts
import { webpackRuntimeCode } from "./webpack-runtime.js";
import { globalsCode } from "./globals.js";
function getCompatCode() {
  return `
// ============================================================
// Next.js Compatibility Layer
// ============================================================

${globalsCode}

${webpackRuntimeCode}
`;
}
export {
  getCompatCode,
  globalsCode,
  webpackRuntimeCode
};
