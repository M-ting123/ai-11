
      var require = await (async () => {
        var { createRequire } = await import("node:module");
        return createRequire(import.meta.url);
      })();
    
import {
  require_semver
} from "../esm-chunks/chunk-TLQCAGE2.js";
import {
  __toESM
} from "../esm-chunks/chunk-6BT4RYQJ.js";

// src/build/plugin-context.ts
var import_semver = __toESM(require_semver(), 1);
import { existsSync, readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { join, relative, resolve } from "node:path";
import { join as posixJoin, relative as posixRelative } from "node:path/posix";
import { fileURLToPath } from "node:url";
var MODULE_DIR = fileURLToPath(new URL(".", import.meta.url));
var PLUGIN_DIR = join(MODULE_DIR, "../..");
var DEFAULT_PUBLISH_DIR = ".next";
var SERVER_HANDLER_NAME = "cloud-functions/ssr-node";
var EDGE_HANDLER_NAME = "edgeone-edge-handler";
var PluginContext = class {
  edgeoneConfig;
  pluginName;
  pluginVersion;
  utils;
  constants;
  packageJSON;
  /** Absolute path of the next runtime plugin directory */
  pluginDir = PLUGIN_DIR;
  serverlessWrapHandler;
  getRuntimeShim;
  get relPublishDir() {
    return this.constants.PUBLISH_DIR ?? join(this.constants.PACKAGE_PATH || "", DEFAULT_PUBLISH_DIR);
  }
  /** Temporary directory for stashing the build output */
  get tempPublishDir() {
    return this.resolveFromPackagePath(join(".edgeone", this.nextDistDir));
  }
  /** Absolute path of the publish directory */
  get publishDir() {
    return resolve(this.relPublishDir);
  }
  /**
   * Relative package path in non monorepo setups this is an empty string
   * This path is provided by Next.js RequiredServerFiles manifest
   * @example ''
   * @example 'apps/my-app'
   */
  get relativeAppDir() {
    return this.requiredServerFiles.relativeAppDir ?? "";
  }
  /**
   * The working directory inside the lambda that is used for monorepos to execute the serverless function
   */
  get lambdaWorkingDirectory() {
    return join("./", this.distDirParent);
  }
  /**
   * Retrieves the root of the `.next/standalone` directory
   */
  get standaloneRootDir() {
    return join(this.publishDir, "standalone");
  }
  /**
   * The resolved relative next dist directory defaults to `.next`,
   * but can be configured through the next.config.js. For monorepos this will include the packagePath
   * If we need just the plain dist dir use the `nextDistDir`
   */
  get distDir() {
    const dir = this.buildConfig.distDir ?? DEFAULT_PUBLISH_DIR;
    return relative(process.cwd(), resolve(this.relativeAppDir, dir));
  }
  /** Represents the parent directory of the .next folder or custom distDir */
  get distDirParent() {
    return join(this.distDir, "..");
  }
  /** The `.next` folder or what the custom dist dir is set to */
  get nextDistDir() {
    return relative(this.distDirParent, this.distDir);
  }
  /** Retrieves the `.next/standalone/` directory monorepo aware */
  get standaloneDir() {
    return join(this.standaloneRootDir, this.distDirParent);
  }
  /**
   * Absolute path of the directory that is published and deployed to the CDN
   * Will be swapped with the publish directory
   * `.edgeone/static`
   */
  get staticDir() {
    return this.resolveFromPackagePath(".edgeone/assets");
  }
  /**
   * Absolute path of the directory that will be deployed to the blob store
   * region aware: `.edgeone/deploy/v1/blobs/deploy`
   * default: `.edgeone/blobs/deploy`
   */
  get blobDir() {
    if (this.useRegionalBlobs) {
      return this.resolveFromPackagePath(".edgeone/deploy/v1/blobs/deploy");
    }
    return this.resolveFromPackagePath(".edgeone/blobs/deploy");
  }
  get buildVersion() {
    return this.constants.BUILD_VERSION || "v0.0.0";
  }
  get useRegionalBlobs() {
    const REQUIRED_BUILD_VERSION = ">=29.41.5";
    return (0, import_semver.satisfies)(this.buildVersion, REQUIRED_BUILD_VERSION, { includePrerelease: true });
  }
  /**
   * Absolute path of the directory containing the files for the serverless lambda function
   * `.edgeone/functions-internal`
   */
  get serverFunctionsDir() {
    return this.resolveFromPackagePath(".edgeone");
  }
  /** Absolute path of the server handler */
  get serverHandlerRootDir() {
    return join(this.serverFunctionsDir, SERVER_HANDLER_NAME);
  }
  get serverHandlerDir() {
    if (this.relativeAppDir.length === 0) {
      return this.serverHandlerRootDir;
    }
    return join(this.serverHandlerRootDir, this.distDirParent);
  }
  get serverHandlerRuntimeModulesDir() {
    return join(this.serverHandlerDir, ".edgeone");
  }
  get nextServerHandler() {
    if (this.relativeAppDir.length !== 0) {
      return join(this.lambdaWorkingDirectory, ".edgeone/dist/run/handlers/server.js");
    }
    return "./.edgeone/dist/run/handlers/server.js";
  }
  /**
   * Absolute path of the directory containing the files for deno edge functions
   * `.edgeone/edge-functions`
   */
  get edgeFunctionsDir() {
    return this.resolveFromPackagePath(".edgeone/edge-functions");
  }
  /** Absolute path of the edge handler */
  get edgeHandlerDir() {
    return join(this.edgeFunctionsDir, EDGE_HANDLER_NAME);
  }
  constructor(options) {
    const detectedPublishDir = this.detectPublishDir(options?.constants?.PACKAGE_PATH);
    options = {
      ...options,
      functions: {
        "*": {}
      },
      constants: {
        ...options?.constants,
        PUBLISH_DIR: detectedPublishDir
        // BUILD_VERSION: '32.1.4',
      }
    };
    this.constants = options.constants;
    this.edgeoneConfig = options.edgeoneConfig;
    this.packageJSON = JSON.parse(readFileSync(join(PLUGIN_DIR, "package.json"), "utf-8"));
    this.pluginName = this.packageJSON.name;
    this.pluginVersion = this.packageJSON.version;
    this.utils = options.utils;
    this.serverlessWrapHandler = options.serverlessWrapHandler;
    this.getRuntimeShim = options.getRuntimeShim;
  }
  /**
   * 自动检测 Next.js 构建输出目录
   * 搜索包含 BUILD_ID 文件的目录，支持自定义 distDir 配置
   */
  detectPublishDir(packagePath) {
    const basePath = packagePath || process.cwd();
    const possibleDirs = [
      ".next",
      // 默认
      "build",
      // 常见自定义
      "dist",
      // 常见自定义
      "out",
      // 常见自定义
      ".build"
      // 其他可能
    ];
    for (const dir of possibleDirs) {
      const fullPath = resolve(basePath, dir);
      if (existsSync(join(fullPath, "BUILD_ID"))) {
        return dir;
      }
    }
    return DEFAULT_PUBLISH_DIR;
  }
  /** Resolves a path correctly with mono repository awareness for .edgeone directories mainly  */
  resolveFromPackagePath(...args) {
    return resolve(this.constants.PACKAGE_PATH || "", ...args);
  }
  /** Resolves a path correctly from site directory */
  resolveFromSiteDir(...args) {
    return resolve(this.requiredServerFiles.appDir, ...args);
  }
  /** Get the next prerender-manifest.json */
  async getPrerenderManifest() {
    return JSON.parse(await readFile(join(this.publishDir, "prerender-manifest.json"), "utf-8"));
  }
  async getPagesManifest() {
    return JSON.parse(await readFile(join(this.publishDir, "server/pages-manifest.json"), "utf-8"));
  }
  // 获取 next api manifest
  async getAppPathRoutesManifest() {
    const manifestPath = join(this.publishDir, "app-path-routes-manifest.json");
    try {
      if (!existsSync(manifestPath)) {
        return {};
      }
      return JSON.parse(await readFile(manifestPath, "utf-8"));
    } catch (error) {
      return {};
    }
  }
  async getAppPathsManifest() {
    const manifestPath = join(this.publishDir, "server/app-paths-manifest.json");
    try {
      if (!existsSync(manifestPath)) {
        return null;
      }
      return JSON.parse(await readFile(manifestPath, "utf-8"));
    } catch (error) {
      return null;
    }
  }
  /**
   * Uses various heuristics to try to find the .next dir.
   * Works by looking for BUILD_ID, so requires the site to have been built
   * 支持自定义 distDir 配置（如 distDir: 'build'）
   */
  findDotNext() {
    const possibleDirNames = [".next", "build", "dist", "out", ".build"];
    const searchDirs = [
      // The publish directory (已检测的目录)
      this.publishDir
    ];
    for (const dirName of possibleDirNames) {
      searchDirs.push(resolve(dirName));
      searchDirs.push(resolve(this.publishDir, "..", dirName));
      searchDirs.push(resolve(this.constants.PACKAGE_PATH || "", dirName));
    }
    const uniqueDirs = [...new Set(searchDirs)];
    for (const dir of uniqueDirs) {
      if (existsSync(join(dir, "BUILD_ID"))) {
        return dir;
      }
    }
    return false;
  }
  /**
   * Get Next.js middleware config from the build output
   */
  async getMiddlewareManifest() {
    return JSON.parse(
      await readFile(join(this.publishDir, "server/middleware-manifest.json"), "utf-8")
    );
  }
  // don't make private as it is handy inside testing to override the config
  _requiredServerFiles = null;
  /** Get RequiredServerFiles manifest from build output **/
  get requiredServerFiles() {
    if (!this._requiredServerFiles) {
      let requiredServerFilesJson = join(this.publishDir, "required-server-files.json");
      if (!existsSync(requiredServerFilesJson)) {
        const dotNext = this.findDotNext();
        if (dotNext) {
          requiredServerFilesJson = join(dotNext, "required-server-files.json");
        }
      }
      this._requiredServerFiles = JSON.parse(
        readFileSync(requiredServerFilesJson, "utf-8")
      );
    }
    return this._requiredServerFiles;
  }
  #exportDetail = null;
  /** Get metadata when output = export */
  get exportDetail() {
    if (this.buildConfig.output !== "export") {
      return null;
    }
    if (!this.#exportDetail) {
      const detailFile = join(
        this.requiredServerFiles.appDir,
        this.buildConfig.distDir,
        "export-detail.json"
      );
      if (!existsSync(detailFile)) {
        return null;
      }
      try {
        this.#exportDetail = JSON.parse(readFileSync(detailFile, "utf-8"));
      } catch {
      }
    }
    return this.#exportDetail;
  }
  /** Get Next Config from build output **/
  get buildConfig() {
    return this.requiredServerFiles.config;
  }
  /**
   * Get Next.js routes manifest from the build output
   */
  async getRoutesManifest() {
    return JSON.parse(await readFile(join(this.publishDir, "routes-manifest.json"), "utf-8"));
  }
  /**
   * Get Next.js images manifest from the build output
   * This handles the image optimization routes for Next.js Image component
   */
  async getImagesManifest() {
    const imagesManifestPath = join(this.publishDir, "images-manifest.json");
    try {
      if (!existsSync(imagesManifestPath)) {
        return {};
      }
      return JSON.parse(await readFile(imagesManifestPath, "utf-8"));
    } catch (error) {
      return {};
    }
  }
  #nextVersion = void 0;
  /**
   * Get Next.js version that was used to build the site
   */
  get nextVersion() {
    if (this.#nextVersion === void 0) {
      try {
        const serverHandlerRequire = createRequire(posixJoin(this.standaloneRootDir, ":internal:"));
        const { version } = serverHandlerRequire("next/package.json");
        this.#nextVersion = version;
      } catch {
        this.#nextVersion = null;
      }
    }
    return this.#nextVersion;
  }
  #fallbacks = null;
  /**
   * Get an array of localized fallback routes
   *
   * Example return value for non-i18n site: `['blog/[slug]']`
   *
   * Example return value for i18n site: `['en/blog/[slug]', 'fr/blog/[slug]']`
   */
  getFallbacks(prerenderManifest) {
    if (!this.#fallbacks) {
      const locales = this.buildConfig.i18n?.locales ?? [""];
      this.#fallbacks = Object.entries(prerenderManifest.dynamicRoutes).reduce(
        (fallbacks, [route, meta]) => {
          if (typeof meta.fallback === "string") {
            for (const locale of locales) {
              const localizedRoute = posixJoin(locale, route.replace(/^\/+/g, ""));
              fallbacks.push(localizedRoute);
            }
          }
          return fallbacks;
        },
        []
      );
    }
    return this.#fallbacks;
  }
  #fullyStaticHtmlPages = null;
  /**
   * Get an array of fully static pages router pages (no `getServerSideProps` or `getStaticProps`).
   * Those are being served as-is without involving CacheHandler, so we need to keep track of them
   * to make sure we apply permanent caching headers for responses that use them.
   */
  async getFullyStaticHtmlPages() {
    if (!this.#fullyStaticHtmlPages) {
      const pagesManifest = JSON.parse(
        await readFile(join(this.publishDir, "server/pages-manifest.json"), "utf-8")
      );
      this.#fullyStaticHtmlPages = Object.values(pagesManifest).filter(
        (filePath) => (
          // Limit handling to pages router files (App Router pages should not be included in pages-manifest.json
          // as they have their own app-paths-manifest.json)
          filePath.startsWith("pages/") && // Fully static pages will have entries in the pages-manifest.json pointing to .html files.
          // Pages with data fetching exports will point to .js files.
          filePath.endsWith(".html")
        )
      ).map((filePath) => posixRelative("pages", filePath));
    }
    return this.#fullyStaticHtmlPages;
  }
  /** Fails a build with a message and an optional error */
  failBuild(message, error) {
    return console.error(message);
  }
};
export {
  EDGE_HANDLER_NAME,
  PluginContext,
  SERVER_HANDLER_NAME
};
