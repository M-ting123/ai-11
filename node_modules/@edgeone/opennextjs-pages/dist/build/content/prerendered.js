
      var require = await (async () => {
        var { createRequire } = await import("node:module");
        return createRequire(import.meta.url);
      })();
    
import {
  trace,
  wrapTracer
} from "../../esm-chunks/chunk-FKDTZJRV.js";
import {
  require_semver
} from "../../esm-chunks/chunk-TLQCAGE2.js";
import {
  __toESM
} from "../../esm-chunks/chunk-6BT4RYQJ.js";

// src/build/content/prerendered.ts
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path, { join } from "node:path";

// node_modules/yocto-queue/index.js
var Node = class {
  value;
  next;
  constructor(value) {
    this.value = value;
  }
};
var Queue = class {
  #head;
  #tail;
  #size;
  constructor() {
    this.clear();
  }
  enqueue(value) {
    const node = new Node(value);
    if (this.#head) {
      this.#tail.next = node;
      this.#tail = node;
    } else {
      this.#head = node;
      this.#tail = node;
    }
    this.#size++;
  }
  dequeue() {
    const current = this.#head;
    if (!current) {
      return;
    }
    this.#head = this.#head.next;
    this.#size--;
    return current.value;
  }
  peek() {
    if (!this.#head) {
      return;
    }
    return this.#head.value;
  }
  clear() {
    this.#head = void 0;
    this.#tail = void 0;
    this.#size = 0;
  }
  get size() {
    return this.#size;
  }
  *[Symbol.iterator]() {
    let current = this.#head;
    while (current) {
      yield current.value;
      current = current.next;
    }
  }
  *drain() {
    while (this.#head) {
      yield this.dequeue();
    }
  }
};

// node_modules/p-limit/index.js
function pLimit(concurrency) {
  validateConcurrency(concurrency);
  const queue = new Queue();
  let activeCount = 0;
  const resumeNext = () => {
    if (activeCount < concurrency && queue.size > 0) {
      queue.dequeue()();
      activeCount++;
    }
  };
  const next = () => {
    activeCount--;
    resumeNext();
  };
  const run = async (function_, resolve, arguments_) => {
    const result = (async () => function_(...arguments_))();
    resolve(result);
    try {
      await result;
    } catch {
    }
    next();
  };
  const enqueue = (function_, resolve, arguments_) => {
    new Promise((internalResolve) => {
      queue.enqueue(internalResolve);
    }).then(
      run.bind(void 0, function_, resolve, arguments_)
    );
    (async () => {
      await Promise.resolve();
      if (activeCount < concurrency) {
        resumeNext();
      }
    })();
  };
  const generator = (function_, ...arguments_) => new Promise((resolve) => {
    enqueue(function_, resolve, arguments_);
  });
  Object.defineProperties(generator, {
    activeCount: {
      get: () => activeCount
    },
    pendingCount: {
      get: () => queue.size
    },
    clearQueue: {
      value() {
        queue.clear();
      }
    },
    concurrency: {
      get: () => concurrency,
      set(newConcurrency) {
        validateConcurrency(newConcurrency);
        concurrency = newConcurrency;
        queueMicrotask(() => {
          while (activeCount < concurrency && queue.size > 0) {
            resumeNext();
          }
        });
      }
    }
  });
  return generator;
}
function validateConcurrency(concurrency) {
  if (!((Number.isInteger(concurrency) || concurrency === Number.POSITIVE_INFINITY) && concurrency > 0)) {
    throw new TypeError("Expected `concurrency` to be a number from 1 and up");
  }
}

// src/build/content/prerendered.ts
var import_semver = __toESM(require_semver(), 1);
var tracer = wrapTracer(trace.getTracer("Next runtime"));
var routeToFilePath = (path2) => {
  if (path2 === "/") {
    return "/index";
  }
  if (path2.startsWith("/")) {
    return path2;
  }
  return `/${path2}`;
};
var buildPagesCacheValue = async (ctx, key) => {
  const buildId = await readFile(join(ctx.publishDir, "BUILD_ID"), "utf-8");
  const pagePath = join(ctx.publishDir, "server/pages", key);
  const htmlSrc = `${pagePath}.html`;
  const jsonSrc = `${pagePath}.json`;
  const htmlDest = join(ctx.staticDir, `${key}.html`);
  const jsonDest = join(ctx.staticDir, `_next/data/${buildId}`, `${key}.json`);
  if (existsSync(htmlSrc)) {
    await mkdir(path.dirname(htmlDest), { recursive: true });
    await writeFile(htmlDest, await readFile(htmlSrc));
  }
  if (existsSync(jsonSrc)) {
    await mkdir(path.dirname(jsonDest), { recursive: true });
    await writeFile(jsonDest, await readFile(jsonSrc));
  }
};
var buildAppCacheValue = async (ctx, key) => {
  const appPath = join(ctx.publishDir, "server/app", key);
  const htmlAppSrc = `${appPath}.html`;
  const metaAppSrc = `${appPath}.meta`;
  const rscAppSrc = `${appPath}.rsc`;
  const prefetchRscAppSrc = `${appPath}.prefetch.rsc`;
  const htmlAppDest = join(ctx.staticDir, `${key}.html`);
  const metaAppDest = join(ctx.staticDir, `${key}.meta`);
  const rscAppDest = join(ctx.staticDir, `${key}.rsc`);
  const prefetchRscAppDest = join(ctx.staticDir, `${key}.prefetch.rsc`);
  if (existsSync(htmlAppSrc)) {
    await mkdir(path.dirname(htmlAppDest), { recursive: true });
    await writeFile(htmlAppDest, await readFile(htmlAppSrc));
  }
  if (existsSync(metaAppSrc)) {
    await mkdir(path.dirname(metaAppDest), { recursive: true });
    await writeFile(metaAppDest, await readFile(metaAppSrc));
  }
  if (existsSync(rscAppSrc)) {
    await mkdir(path.dirname(rscAppDest), { recursive: true });
    await writeFile(rscAppDest, await readFile(rscAppSrc));
  } else if (existsSync(prefetchRscAppSrc)) {
    await mkdir(path.dirname(prefetchRscAppDest), {
      recursive: true
    });
    await writeFile(prefetchRscAppDest, await readFile(prefetchRscAppSrc));
  }
};
var buildRouteCacheValue = async (ctx, key) => {
  const routePath = join(ctx.publishDir, "server/app", key);
  const bodySrc = `${routePath}.body`;
  const metaSrc = `${routePath}.meta`;
  const bodyDest = join(ctx.staticDir, `${key}`);
  const metaDest = join(ctx.staticDir, `${key}.meta`);
  if (existsSync(bodySrc)) {
    await mkdir(path.dirname(bodyDest), { recursive: true });
    await writeFile(bodyDest, await readFile(bodySrc));
  }
  if (existsSync(metaSrc)) {
    await mkdir(path.dirname(metaDest), { recursive: true });
    await writeFile(metaDest, await readFile(metaSrc));
  }
};
var copyPrerenderedContent = async (ctx) => {
  return tracer.withActiveSpan("copyPrerenderedContent", async () => {
    try {
      const manifest = await ctx.getPrerenderManifest();
      const limitConcurrentPrerenderContentHandling = pLimit(10);
      const shouldUseAppPageKind = ctx.nextVersion ? (0, import_semver.satisfies)(
        ctx.nextVersion,
        ">=15.0.0-canary.13 <15.0.0-d || >15.0.0-rc.0",
        {
          includePrerelease: true
        }
      ) : false;
      const shouldUseEnumKind = ctx.nextVersion ? (0, import_semver.satisfies)(
        ctx.nextVersion,
        ">=15.0.0-canary.114 <15.0.0-d || >15.0.0-rc.0",
        {
          includePrerelease: true
        }
      ) : false;
      await Promise.all([
        ...Object.entries(manifest.routes).map(
          ([route, meta]) => limitConcurrentPrerenderContentHandling(async () => {
            const key = routeToFilePath(route);
            switch (true) {
              // Parallel route default layout has no prerendered page
              case (meta.dataRoute?.endsWith("/default.rsc") && !existsSync(
                join(ctx.publishDir, "server/app", `${key}.html`)
              ) || meta.initialRevalidateSeconds !== false):
                return;
              case meta.dataRoute?.endsWith(".json"):
                if (manifest.notFoundRoutes.includes(route)) {
                  return;
                }
                await buildPagesCacheValue(ctx, key);
                break;
              case meta.dataRoute?.endsWith(".rsc"):
                await buildAppCacheValue(ctx, key);
                break;
              case meta.dataRoute === null:
                await buildRouteCacheValue(ctx, key);
                break;
              default:
                throw new Error(`Unrecognized content: ${route}`);
            }
          })
        ),
        ...ctx.getFallbacks(manifest).map(async (route) => {
          const key = routeToFilePath(route);
          await buildPagesCacheValue(ctx, key);
        })
      ]);
      if (existsSync(join(ctx.publishDir, `server/app/_not-found.html`))) {
        const key = "/404";
        await buildAppCacheValue(ctx, key);
      }
    } catch (error) {
      ctx.failBuild("Failed assembling prerendered content for upload", error);
    }
  });
};
export {
  copyPrerenderedContent
};
