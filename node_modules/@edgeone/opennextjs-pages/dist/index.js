
      var require = await (async () => {
        var { createRequire } = await import("node:module");
        return createRequire(import.meta.url);
      })();
    
import "./esm-chunks/chunk-6BT4RYQJ.js";

// src/index.ts
import { rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { copyPrerenderedContent } from "./build/content/prerendered.js";
import {
  copyStaticAssets,
  copyStaticContent,
  copyStaticExport
} from "./build/content/static.js";
import { compileMiddleware } from "./build/functions/middleware/middleware.js";
import { createServerHandler } from "./build/functions/server.js";
import { PluginContext } from "./build/plugin-context.js";
import { createRouteMeta } from "./build/routes.js";
import { injectImageLoader, restoreNextConfig } from "./build/image-optimization.js";
var onPreBuild = async (options) => {
  process.env.NEXT_PRIVATE_STANDALONE = "true";
  const cwd = options.cwd || process.cwd();
  injectImageLoader(cwd);
};
var onBuild = async (options) => {
  const ctx = new PluginContext(options);
  await rm(ctx.staticDir, { recursive: true, force: true });
  if (existsSync(ctx.serverHandlerDir)) {
    await rm(ctx.serverHandlerDir, { recursive: true, force: true });
  }
  if (ctx.buildConfig.output === "export") {
    return Promise.all([copyStaticExport(ctx)]);
  }
  await copyStaticAssets(ctx);
  await Promise.all([
    // copyStaticAssets(ctx),
    copyStaticContent(ctx),
    copyPrerenderedContent(ctx),
    createServerHandler(ctx)
  ]);
  await createRouteMeta(ctx);
};
var onPostBuild = async (options) => {
  const ctx = new PluginContext(options);
  await compileMiddleware(ctx);
  const cwd = options.cwd || process.cwd();
  restoreNextConfig(cwd);
};
export {
  onBuild,
  onPostBuild,
  onPreBuild
};
