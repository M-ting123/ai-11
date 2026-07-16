
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

// src/build/functions/server.ts
import { existsSync, readFileSync } from "node:fs";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { join as posixJoin } from "node:path/posix";
var import_fast_glob = __toESM(require_out(), 1);
import {
  copyNextDependencies,
  copyNextServerCode,
  verifyHandlerDirStructure
} from "../content/server.js";
var tracer = wrapTracer(trace.getTracer("Next runtime"));
function getOutputFileTracingIncludes(appDir) {
  const configFiles = [
    "next.config.original.ts",
    "next.config.original.mjs",
    "next.config.original.js",
    "next.config.original.cjs",
    "next.config.ts",
    "next.config.mjs",
    "next.config.js",
    "next.config.cjs"
  ];
  for (const configFile of configFiles) {
    const configPath = join(appDir, configFile);
    if (!existsSync(configPath)) continue;
    try {
      const content = readFileSync(configPath, "utf-8");
      const match = content.match(
        /outputFileTracingIncludes\s*:\s*\{([\s\S]*?)(?=\n\s*\}[,;\s]*\n|\n\s*\}\s*[,\n])/
      );
      if (!match) continue;
      const body = match[1];
      const result = {};
      const pairPattern = /['"]([^'"]+)['"]\s*:\s*\[([\s\S]*?)\]/g;
      let pairMatch;
      while ((pairMatch = pairPattern.exec(body)) !== null) {
        const key = pairMatch[1];
        const arrayBody = pairMatch[2];
        const patterns = [];
        const strPattern = /['"]([^'"]+)['"]/g;
        let strMatch;
        while ((strMatch = strPattern.exec(arrayBody)) !== null) {
          patterns.push(strMatch[1]);
        }
        if (patterns.length > 0) {
          result[key] = patterns;
        }
      }
      if (Object.keys(result).length > 0) {
        return result;
      }
    } catch {
    }
  }
  return {};
}
var copyHandlerDependencies = async (ctx) => {
  const promises = [];
  const includedFiles = [];
  const appDir = ctx.requiredServerFiles?.appDir || process.cwd();
  const outputFileTracingIncludes = getOutputFileTracingIncludes(appDir);
  for (const patterns of Object.values(outputFileTracingIncludes)) {
    for (const pattern of patterns) {
      includedFiles.push(
        ctx.relativeAppDir ? posixJoin(ctx.relativeAppDir, pattern) : pattern
      );
    }
  }
  includedFiles.push(
    posixJoin(ctx.relativeAppDir, ".env"),
    posixJoin(ctx.relativeAppDir, ".env.production"),
    posixJoin(ctx.relativeAppDir, ".env.local"),
    posixJoin(ctx.relativeAppDir, ".env.production.local")
  );
  const resolvedFiles = await Promise.all(
    includedFiles.map((globPattern) => (0, import_fast_glob.glob)(globPattern, { cwd: process.cwd() }))
  );
  for (const filePath of resolvedFiles.flat()) {
    promises.push(
      cp(
        join(process.cwd(), filePath),
        // the serverHandlerDir is aware of the dist dir.
        // The distDir must not be the package path therefore we need to rely on the
        // serverHandlerDir instead of the serverHandlerRootDir
        // therefore we need to remove the package path from the filePath
        join(ctx.serverHandlerDir, relative(ctx.relativeAppDir, filePath)),
        {
          recursive: true,
          force: true
        }
      )
    );
  }
  promises.push(
    writeFile(
      join(ctx.serverHandlerRuntimeModulesDir, "package.json"),
      JSON.stringify({ type: "module" })
    )
  );
  const fileList = await (0, import_fast_glob.glob)("dist/**/*", { cwd: ctx.pluginDir });
  for (const filePath of fileList) {
    promises.push(
      cp(join(ctx.pluginDir, filePath), join(ctx.serverHandlerRuntimeModulesDir, filePath), {
        recursive: true,
        force: true
      })
    );
  }
  await Promise.all(promises);
};
var writeHandlerManifest = async (ctx) => {
  await writeFile(
    join(ctx.serverHandlerRootDir, `app.json`),
    JSON.stringify({
      config: {
        name: "Next.js Server Handler",
        generator: `${ctx.pluginName}@${ctx.pluginVersion}`,
        nodeBundler: "none",
        // the folders can vary in monorepos based on the folder structure of the user so we have to glob all
        includedFiles: ["**"],
        includedFilesBasePath: ctx.serverHandlerRootDir
      },
      version: 1
    }),
    "utf-8"
  );
};
var applyTemplateVariables = (template, variables) => {
  return Object.entries(variables).reduce((acc, [key, value]) => {
    return acc.replaceAll(key, value);
  }, template);
};
var getHandlerFile = async (ctx) => {
  const templatesDir = join(ctx.pluginDir, "dist/build/templates");
  const templateVariables = {
    "{{useRegionalBlobs}}": ctx.useRegionalBlobs.toString()
  };
  if (ctx.relativeAppDir.length !== 0) {
    const template2 = await readFile(join(templatesDir, "handler-monorepo.tmpl.js"), "utf-8");
    templateVariables["{{cwd}}"] = posixJoin(ctx.lambdaWorkingDirectory);
    templateVariables["{{nextServerHandler}}"] = posixJoin(ctx.nextServerHandler);
    return applyTemplateVariables(template2, templateVariables);
  }
  const template = await readFile(join(templatesDir, "handler.tmpl.js"), "utf-8");
  return applyTemplateVariables(template, templateVariables);
};
var writeHandlerFile = async (ctx) => {
  const handler = await getHandlerFile(ctx);
  await writeFile(join(ctx.serverHandlerRootDir, `handler.js`), handler);
};
var clearStaleServerHandlers = async (ctx) => {
  await rm(ctx.serverFunctionsDir, { recursive: true, force: true });
};
var createServerHandler = async (ctx) => {
  await mkdir(join(ctx.serverHandlerRuntimeModulesDir), { recursive: true });
  await copyNextServerCode(ctx);
  await copyNextDependencies(ctx);
  await copyHandlerDependencies(ctx);
  await writeHandlerManifest(ctx);
  await writeHandlerFile(ctx);
  await verifyHandlerDirStructure(ctx);
};
export {
  clearStaleServerHandlers,
  createServerHandler
};
