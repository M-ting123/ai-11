
      var require = await (async () => {
        var { createRequire } = await import("node:module");
        return createRequire(import.meta.url);
      })();
    
import {
  require_out
} from "../../esm-chunks/chunk-5J3FID2N.js";
import {
  trace,
  wrapTracer
} from "../../esm-chunks/chunk-FKDTZJRV.js";
import {
  __toESM
} from "../../esm-chunks/chunk-6BT4RYQJ.js";

// src/build/content/static.ts
import { existsSync } from "node:fs";
import { cp, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { basename, join, dirname } from "node:path";
var import_fast_glob = __toESM(require_out(), 1);
var tracer = wrapTracer(trace.getTracer("Next runtime"));
var copyStaticContent = async (ctx) => {
  return tracer.withActiveSpan("copyStaticContent", async () => {
    const srcDir = join(ctx.publishDir, "server/pages");
    const destDir = ctx.staticDir;
    const paths = await (0, import_fast_glob.default)("**/*.+(html|json)", {
      cwd: srcDir,
      extglob: true
    });
    try {
      await mkdir(destDir, { recursive: true });
      await Promise.all(
        paths.filter((path) => !paths.includes(`${path.slice(0, -5)}.json`)).map(async (path) => {
          const html = await readFile(join(srcDir, path));
          await mkdir(dirname(join(destDir, path)), { recursive: true });
          await writeFile(join(destDir, path), html);
        })
      );
    } catch (error) {
      ctx.failBuild("Failed assembling static pages for upload", error);
    }
  });
};
var copyStaticAssets = async (ctx) => {
  return tracer.withActiveSpan(
    "copyStaticAssets",
    async (span) => {
      try {
        const { basePath } = await ctx.getRoutesManifest();
        if (existsSync(ctx.resolveFromSiteDir("public"))) {
          await cp(
            ctx.resolveFromSiteDir("public"),
            join(ctx.staticDir, basePath),
            {
              recursive: true
            }
          );
        }
        if (existsSync(join(ctx.publishDir, "static"))) {
          await cp(
            join(ctx.publishDir, "static"),
            join(ctx.staticDir, basePath, "_next/static"),
            {
              recursive: true
            }
          );
        }
      } catch (error) {
        span.end();
        ctx.failBuild("Failed copying static assets", error);
      }
    }
  );
};
var copyStaticExport = async (ctx) => {
  await tracer.withActiveSpan("copyStaticExport", async () => {
    if (!ctx.exportDetail?.outDirectory) {
      ctx.failBuild("Export directory not found");
    }
    try {
      await cp(ctx.exportDetail.outDirectory, ctx.staticDir, {
        recursive: true
      });
    } catch (error) {
      ctx.failBuild("Failed copying static export", error);
    }
  });
};
var publishStaticDir = async (ctx) => {
  try {
    await rm(ctx.tempPublishDir, { recursive: true, force: true });
    await mkdir(basename(ctx.tempPublishDir), { recursive: true });
    await rename(ctx.publishDir, ctx.tempPublishDir);
    await rename(ctx.staticDir, ctx.publishDir);
  } catch (error) {
    ctx.failBuild(
      "Failed publishing static content",
      error instanceof Error ? { error } : {}
    );
  }
};
var unpublishStaticDir = async (ctx) => {
  try {
    if (existsSync(ctx.tempPublishDir)) {
      await rename(ctx.publishDir, ctx.staticDir);
      await rename(ctx.tempPublishDir, ctx.publishDir);
    }
  } catch {
  }
};
export {
  copyStaticAssets,
  copyStaticContent,
  copyStaticExport,
  publishStaticDir,
  unpublishStaticDir
};
