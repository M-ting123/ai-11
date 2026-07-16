
      var require = await (async () => {
        var { createRequire } = await import("node:module");
        return createRequire(import.meta.url);
      })();
    
import "../esm-chunks/chunk-6BT4RYQJ.js";

// src/build/image-optimization.ts
import { existsSync, readFileSync, writeFileSync, renameSync, unlinkSync, mkdirSync } from "node:fs";
import { join } from "node:path";
var IMAGE_LOADER_CONTENT = `'use client'

export default function edgeoneImageLoader({ src, width, quality }) {
  // \u5916\u90E8\u56FE\u7247\uFF08http/https \u5F00\u5934\uFF09\u4E0D\u8D70\u4E07\u8C61\u5904\u7406\uFF0C\u56DE\u9000\u5230\u9ED8\u8BA4\u884C\u4E3A
  // if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('//')) {
  //   return '/_next/image?url=' + encodeURIComponent(src) + '&w=' + (width || 0) + '&q=' + (quality || 75);
  // }

  // \u8DF3\u8FC7 SVG/GIF/ICO\uFF08\u4E0D\u9002\u5408\u5149\u6805\u4F18\u5316\uFF09
  var ext = src.split('?')[0].split('#')[0].split('.').pop();
  if (ext && ['svg', 'gif', 'ico'].indexOf(ext.toLowerCase()) !== -1) {
    return src;
  }

  var q = quality || 75;
  var params = [];
  if (width) params.push('thumbnail/' + width + 'x');
  params.push('quality/' + q);
  params.push('format/webp');

  var sep = src.indexOf('?') !== -1 ? '&' : '?';
  return src + sep + 'imageMogr2/' + params.join('/');
}
`;
function findNextConfig(cwd) {
  const candidates = ["next.config.ts", "next.config.mts", "next.config.js", "next.config.mjs"];
  for (const name of candidates) {
    const fullPath = join(cwd, name);
    if (existsSync(fullPath)) {
      const ext = name.replace("next.config", "");
      return { path: fullPath, ext };
    }
  }
  return null;
}
function getBackupMarker(cwd) {
  return join(cwd, ".edgeone", ".image-loader-injected");
}
function generateWrapperConfig(ext, importPath) {
  const isTS = ext.includes("ts");
  const isMJS = ext.includes("mjs") || ext.includes("mts");
  if (isTS) {
    return `import originalExport from '${importPath}'
import type { NextConfig } from 'next'

let config: NextConfig;
if (typeof originalExport === 'function') {
  // Function-style config: (phase, context) => NextConfig
  // Wrap it to inject images config after resolution
  const origFn = originalExport as any;
  config = ((...args: any[]) => {
    const resolved = origFn(...args);
    if (resolved && typeof resolved.then === 'function') {
      return (resolved as Promise<NextConfig>).then((c: any) => {
        c.images = { ...c.images, loader: 'custom', loaderFile: './.edgeone/image-loader.mjs' };
        return c;
      });
    }
    (resolved as any).images = { ...(resolved as any).images, loader: 'custom', loaderFile: './.edgeone/image-loader.mjs' };
    return resolved;
  }) as any;
} else {
  config = { ...(originalExport as any) };
  config.images = { ...config.images, loader: 'custom', loaderFile: './.edgeone/image-loader.mjs' };
}

export default config;
`;
  }
  if (isMJS) {
    return `import originalExport from '${importPath}';

let config;
if (typeof originalExport === 'function') {
  const origFn = originalExport;
  config = (...args) => {
    const resolved = origFn(...args);
    if (resolved && typeof resolved.then === 'function') {
      return resolved.then((c) => {
        c.images = { ...c.images, loader: 'custom', loaderFile: './.edgeone/image-loader.mjs' };
        return c;
      });
    }
    resolved.images = { ...resolved.images, loader: 'custom', loaderFile: './.edgeone/image-loader.mjs' };
    return resolved;
  };
} else {
  config = { ...originalExport };
  config.images = { ...config.images, loader: 'custom', loaderFile: './.edgeone/image-loader.mjs' };
}

export default config;
`;
  }
  return `const originalExport = require('${importPath}');
const resolved = originalExport.default || originalExport;

let config;
if (typeof resolved === 'function') {
  const origFn = resolved;
  config = (...args) => {
    const result = origFn(...args);
    if (result && typeof result.then === 'function') {
      return result.then((c) => {
        c.images = { ...c.images, loader: 'custom', loaderFile: './.edgeone/image-loader.mjs' };
        return c;
      });
    }
    result.images = { ...result.images, loader: 'custom', loaderFile: './.edgeone/image-loader.mjs' };
    return result;
  };
} else {
  config = { ...resolved };
  config.images = { ...config.images, loader: 'custom', loaderFile: './.edgeone/image-loader.mjs' };
}

module.exports = config;
`;
}
function injectImageLoader(cwd) {
  const config = findNextConfig(cwd);
  if (!config) {
    console.log("[opennext] next.config not found, skipping image loader injection");
    return;
  }
  const originalContent = readFileSync(config.path, "utf-8");
  if (originalContent.includes("loaderFile")) {
    console.log("[opennext] images.loaderFile already configured, skipping injection");
    return;
  }
  const contentWithoutComments = originalContent.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
  if (/unoptimized\s*:\s*true/.test(contentWithoutComments)) {
    console.log("[opennext] images.unoptimized detected, skipping image loader injection");
    return;
  }
  const edgeoneDir = join(cwd, ".edgeone");
  if (!existsSync(edgeoneDir)) {
    mkdirSync(edgeoneDir, { recursive: true });
  }
  const loaderPath = join(edgeoneDir, "image-loader.mjs");
  writeFileSync(loaderPath, IMAGE_LOADER_CONTENT, "utf-8");
  const configDir = config.path.substring(0, config.path.lastIndexOf("/"));
  const backupPath = join(configDir, `next.config.original${config.ext}`);
  renameSync(config.path, backupPath);
  const isTS = config.ext.includes("ts");
  const importPath = isTS ? "./next.config.original" : `./next.config.original${config.ext}`;
  writeFileSync(config.path, generateWrapperConfig(config.ext, importPath), "utf-8");
  writeFileSync(getBackupMarker(cwd), JSON.stringify({
    configPath: config.path,
    backupPath,
    ext: config.ext
  }), "utf-8");
  console.log("[opennext] Image optimization loader injected");
}
function restoreNextConfig(cwd) {
  const loaderPath = join(cwd, ".edgeone", "image-loader.mjs");
  if (existsSync(loaderPath)) {
    try {
      unlinkSync(loaderPath);
    } catch {
    }
  }
  const markerPath = getBackupMarker(cwd);
  if (!existsSync(markerPath)) {
    return;
  }
  try {
    const info = JSON.parse(readFileSync(markerPath, "utf-8"));
    if (existsSync(info.backupPath)) {
      unlinkSync(info.configPath);
      renameSync(info.backupPath, info.configPath);
    }
    unlinkSync(markerPath);
    console.log("[opennext] Restored original next.config");
  } catch (e) {
    console.warn("[opennext] Failed to restore next.config:", e);
  }
}
export {
  injectImageLoader,
  restoreNextConfig
};
