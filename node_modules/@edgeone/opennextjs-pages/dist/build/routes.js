
      var require = await (async () => {
        var { createRequire } = await import("node:module");
        return createRequire(import.meta.url);
      })();
    
import "../esm-chunks/chunk-6BT4RYQJ.js";

// src/build/routes.ts
import * as fs from "fs";
import * as path from "path";
import {
  convertRedirects,
  convertRewrites,
  convertHeaders,
  convertTrailingSlash
} from "./route-utils.js";
function hasAppRouter(appPathRoutesManifest) {
  return appPathRoutesManifest && Object.keys(appPathRoutesManifest).length > 0;
}
function getBuildId(ctx) {
  try {
    const buildIdPath = path.join(ctx.publishDir, "BUILD_ID");
    if (fs.existsSync(buildIdPath)) {
      return fs.readFileSync(buildIdPath, "utf-8").trim();
    }
  } catch {
  }
  return null;
}
function isRE2Compatible(regex) {
  if (/\(\?[=!<]/.test(regex)) {
    return false;
  }
  if (/\\[1-9]/.test(regex)) {
    return false;
  }
  return true;
}
function convertNamedRegexToSrc(namedRegex, basePath = "") {
  const regexWithoutNamedGroups = namedRegex.replace(/\(\?<[a-zA-Z][a-zA-Z0-9_]*>/g, "(");
  if (!isRE2Compatible(regexWithoutNamedGroups)) {
    console.warn(`[opennext] Warning: Regex not RE2 compatible, skipping: ${namedRegex}`);
    return null;
  }
  let src = namedRegex.replace(/\(\?<[a-zA-Z][a-zA-Z0-9_]*>/g, "(");
  if (basePath && !src.startsWith(`^${basePath}`)) {
    src = src.replace(/^\^/, `^${basePath}`);
  }
  return src;
}
function getDynamicRoutes(dynamicRoutes, basePath = "") {
  const routes = [];
  for (const route of dynamicRoutes) {
    if (route.namedRegex) {
      const src = convertNamedRegexToSrc(route.namedRegex, basePath);
      if (src) {
        routes.push({ src });
      }
    } else if (route.regex) {
      if (isRE2Compatible(route.regex)) {
        let src = route.regex;
        if (basePath && !src.startsWith(`^${basePath}`)) {
          src = src.replace(/^\^/, `^${basePath}`);
        }
        routes.push({ src });
      }
    }
  }
  return routes;
}
function getDataRoutes(dataRoutes, basePath = "") {
  const routes = [];
  for (const route of dataRoutes) {
    if (route.namedDataRouteRegex) {
      const src = convertNamedRegexToSrc(route.namedDataRouteRegex, basePath);
      if (src) {
        routes.push({ src });
      }
    } else if (route.dataRouteRegex) {
      if (isRE2Compatible(route.dataRouteRegex)) {
        let src = route.dataRouteRegex;
        if (basePath && !src.startsWith(`^${basePath}`)) {
          src = src.replace(/^\^/, `^${basePath}`);
        }
        routes.push({ src });
      }
    }
  }
  return routes;
}
function getServerRoutes(staticRoutes, prerenderManifest, basePath = "") {
  const routes = [];
  const prerenderRoutes = prerenderManifest?.routes || {};
  for (const route of staticRoutes) {
    if (route.page.startsWith("/_")) {
      continue;
    }
    const prerenderInfo = prerenderRoutes[route.page];
    if (prerenderInfo && prerenderInfo.initialRevalidateSeconds === false) {
      continue;
    }
    if (route.namedRegex) {
      let src = convertNamedRegexToSrc(route.namedRegex, basePath);
      if (src) {
        routes.push({ src });
      }
    } else if (route.regex) {
      if (isRE2Compatible(route.regex)) {
        let src = route.regex;
        if (basePath && !src.startsWith(`^${basePath}`)) {
          src = src.replace(/^\^/, `^${basePath}`);
        }
        routes.push({ src });
      }
    }
  }
  return routes;
}
function getAppRoutes(appPathsManifest, basePath = "", existingPaths = /* @__PURE__ */ new Set()) {
  if (!appPathsManifest) {
    return [];
  }
  const routes = [];
  const emitted = /* @__PURE__ */ new Set();
  for (const routePath of Object.keys(appPathsManifest)) {
    if (routePath.startsWith("/_")) {
      continue;
    }
    let pagePath;
    if (routePath.endsWith("/route")) {
      pagePath = routePath.replace(/\/route$/, "");
    } else if (routePath.endsWith("/page")) {
      pagePath = routePath.replace(/\/page$/, "") || "/";
    } else {
      continue;
    }
    pagePath = pagePath.replace(/\/\([^)]+\)/g, "");
    if (!pagePath) pagePath = "/";
    if (pagePath.includes("@")) {
      continue;
    }
    if (pagePath.includes("[")) {
      continue;
    }
    if (pagePath === "/") {
      continue;
    }
    if (existingPaths.has(pagePath)) {
      continue;
    }
    if (emitted.has(pagePath)) {
      continue;
    }
    emitted.add(pagePath);
    const escapedPath = pagePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const src = `^${basePath}${escapedPath}(?:/)?$`;
    routes.push({ src });
  }
  return routes;
}
async function getMiddlewareConfig(ctx) {
  try {
    const manifest = await ctx.getMiddlewareManifest();
    if (manifest && manifest.middleware && manifest.middleware["/"]) {
      const middlewareInfo = manifest.middleware["/"];
      const matchers = middlewareInfo.matchers || [];
      const normalizedMatchers = matchers.map((m) => ({
        source: m.originalSource || "/:path*",
        regex: m.regexp
      }));
      const hasIncompatibleRegex = normalizedMatchers.some(
        (item) => item.regex && !isRE2Compatible(item.regex)
      );
      if (hasIncompatibleRegex) {
        return {
          runtime: "edge",
          matcher: [{ source: "/:path*" }]
        };
      }
      return {
        runtime: "edge",
        matcher: normalizedMatchers.map((item) => ({ source: item.source }))
      };
    }
    const nextDistDir = ctx.nextDistDir || ".next";
    const possibleFunctionsConfigPaths = [
      // 1. 使用配置的 distDir
      path.join(ctx.distDir, "server/functions-config-manifest.json"),
      // 2. 相对于当前工作目录（使用配置的 nextDistDir）
      path.join(process.cwd(), nextDistDir, "server/functions-config-manifest.json"),
      // 3. 兼容默认 .next 目录
      path.join(process.cwd(), ".next/server/functions-config-manifest.json")
    ];
    let functionsConfigPath = "";
    for (const p of possibleFunctionsConfigPaths) {
      if (fs.existsSync(p)) {
        functionsConfigPath = p;
        break;
      }
    }
    if (functionsConfigPath) {
      const functionsConfig = JSON.parse(fs.readFileSync(functionsConfigPath, "utf-8"));
      const middlewareConfig = functionsConfig?.functions?.["/_middleware"];
      if (middlewareConfig && middlewareConfig.matchers) {
        const matchers = middlewareConfig.matchers;
        const normalizedMatchers = matchers.map((m) => ({
          source: m.originalSource || "/:path*",
          regex: m.regexp
        }));
        const hasIncompatibleRegex = normalizedMatchers.some(
          (item) => item.regex && !isRE2Compatible(item.regex)
        );
        if (hasIncompatibleRegex) {
          return {
            runtime: middlewareConfig.runtime || "edge",
            matcher: [{ source: "/:path*" }]
          };
        }
        return {
          runtime: middlewareConfig.runtime || "edge",
          matcher: normalizedMatchers.map((item) => ({ source: item.source }))
        };
      }
    }
    return null;
  } catch (error) {
    return null;
  }
}
function updateEdgeFunctionsConfigJson(middlewareConfig) {
  const metaJsonPath = path.join(process.cwd(), ".edgeone/edge-functions/config.json");
  let meta = { routes: [] };
  if (fs.existsSync(metaJsonPath)) {
    try {
      const content = fs.readFileSync(metaJsonPath, "utf-8");
      meta = JSON.parse(content);
    } catch (error) {
    }
  }
  if (middlewareConfig) {
    meta.middleware = middlewareConfig;
  }
  const edgeFunctionsDir = path.dirname(metaJsonPath);
  if (!fs.existsSync(edgeFunctionsDir)) {
    fs.mkdirSync(edgeFunctionsDir, { recursive: true });
  }
  fs.writeFileSync(metaJsonPath, JSON.stringify(meta, null, 2), "utf-8");
}
var createRouteMeta = async (ctx) => {
  const routes = [];
  const routesManifest = await ctx.getRoutesManifest();
  const appPathRoutesManifest = await ctx.getAppPathRoutesManifest();
  const isAppRouter = hasAppRouter(appPathRoutesManifest);
  const basePath = routesManifest?.basePath || "";
  const trailingSlash = ctx.requiredServerFiles?.config?.trailingSlash ?? false;
  const redirects = routesManifest?.redirects || [];
  const headers = routesManifest?.headers || [];
  const rewrites = routesManifest?.rewrites || { beforeFiles: [], afterFiles: [], fallback: [] };
  let beforeFilesRewrites = [];
  let afterFilesRewrites = [];
  let fallbackRewrites = [];
  if (Array.isArray(rewrites)) {
    afterFilesRewrites = rewrites;
  } else {
    beforeFilesRewrites = rewrites.beforeFiles || [];
    afterFilesRewrites = rewrites.afterFiles || [];
    fallbackRewrites = rewrites.fallback || [];
  }
  const dynamicRoutes = routesManifest?.dynamicRoutes || [];
  const dataRoutes = routesManifest?.dataRoutes || [];
  const staticRoutes = routesManifest?.staticRoutes || [];
  const appPathsManifest = await ctx.getAppPathsManifest?.() || null;
  const prerenderManifest = await ctx.getPrerenderManifest?.() || null;
  const buildId = getBuildId(ctx);
  const staticCacheRegex = buildId ? `^${basePath}/_next/static/(?:[^/]+/pages|pages|chunks|runtime|css|image|media|${buildId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})/.+` : `^${basePath}/_next/static/(?:[^/]+/pages|pages|chunks|runtime|css|image|media)/.+`;
  routes.push({
    src: staticCacheRegex,
    headers: {
      "cache-control": "public,max-age=31536000,immutable"
    },
    continue: true
  });
  if (trailingSlash) {
    routes.push(...convertTrailingSlash(true));
  } else {
    routes.push(...convertTrailingSlash(false));
  }
  if (headers.length > 0) {
    try {
      routes.push(...convertHeaders(headers));
    } catch (e) {
      console.warn("[opennext] Warning: Failed to convert some headers:", e);
    }
  }
  const userRedirects = redirects.filter((r) => !r.internal);
  if (userRedirects.length > 0) {
    try {
      routes.push(...convertRedirects(userRedirects));
    } catch (e) {
      console.warn("[opennext] Warning: Failed to convert some redirects:", e);
    }
  }
  if (beforeFilesRewrites.length > 0) {
    try {
      routes.push(...convertRewrites(beforeFilesRewrites));
    } catch (e) {
      console.warn("[opennext] Warning: Failed to convert beforeFiles rewrites:", e);
    }
  }
  if (isAppRouter) {
    const rscVary = "RSC, Next-Router-State-Tree, Next-Router-Prefetch, Next-Router-Segment-Prefetch";
    const rscContentType = "text/x-component";
    routes.push({
      src: `^${basePath}/?$`,
      has: [{ type: "header", key: "rsc", value: "1" }],
      dest: `${basePath}/index.rsc`,
      headers: { vary: rscVary, "content-type": rscContentType },
      continue: true
    });
    routes.push({
      src: `^${basePath}/(.+?)(?:/)?$`,
      exclude: "\\.rsc/?$",
      has: [{ type: "header", key: "rsc", value: "1" }],
      dest: `${basePath}/$1.rsc`,
      headers: { vary: rscVary, "content-type": rscContentType },
      continue: true
    });
  }
  routes.push({
    src: `^${basePath}/404/?$`,
    status: 404,
    continue: true,
    missing: [{ type: "header", key: "x-prerender-revalidate" }]
  });
  routes.push({
    src: `^${basePath}/500$`,
    status: 500,
    continue: true
  });
  routes.push({
    src: `^${basePath}/((?:[^/]+/)*[^/.]+)/$`,
    dest: `${basePath}/$1`,
    continue: true
  });
  routes.push({ handle: "filesystem" });
  if (afterFilesRewrites.length > 0) {
    try {
      routes.push(...convertRewrites(afterFilesRewrites));
    } catch (e) {
      console.warn("[opennext] Warning: Failed to convert afterFiles rewrites:", e);
    }
  }
  if (fallbackRewrites.length > 0) {
    try {
      routes.push(...convertRewrites(fallbackRewrites));
    } catch (e) {
      console.warn("[opennext] Warning: Failed to convert fallback rewrites:", e);
    }
  }
  if (staticRoutes.length > 0) {
    routes.push(...getServerRoutes(staticRoutes, prerenderManifest, basePath));
  }
  if (dynamicRoutes.length > 0) {
    routes.push(...getDynamicRoutes(dynamicRoutes, basePath));
  }
  if (dataRoutes.length > 0) {
    routes.push(...getDataRoutes(dataRoutes, basePath));
  }
  const existingPaths = new Set(staticRoutes.map((r) => r.page));
  const appRoutes = getAppRoutes(appPathsManifest, basePath, existingPaths);
  if (appRoutes.length > 0) {
    routes.push(...appRoutes);
  }
  routes.push({
    src: `^${basePath}/.*$`
  });
  const serverHandlerDir = ctx.serverHandlerRootDir;
  if (!fs.existsSync(serverHandlerDir)) {
    fs.mkdirSync(serverHandlerDir, { recursive: true });
  }
  const nextVersion = ctx.nextVersion || null;
  const config = {
    version: 3,
    routes,
    // conf: {
    //   redirects: updatedRedirects
    // },
    ...nextVersion ? { framework: { version: nextVersion } } : {}
  };
  const configFilePath = path.join(serverHandlerDir, "config.json");
  fs.writeFileSync(
    configFilePath,
    JSON.stringify(config, null, 2),
    "utf-8"
  );
  console.log(`[opennext] Generated ${configFilePath} with ${routes.length} routes`);
  const middlewareConfig = await getMiddlewareConfig(ctx);
  updateEdgeFunctionsConfigJson(middlewareConfig);
};
export {
  createRouteMeta
};
