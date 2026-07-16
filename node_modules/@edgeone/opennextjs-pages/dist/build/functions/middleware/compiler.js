
      var require = await (async () => {
        var { createRequire } = await import("node:module");
        return createRequire(import.meta.url);
      })();
    
import {
  __commonJS,
  __require,
  __toESM
} from "../../../esm-chunks/chunk-6BT4RYQJ.js";

// node_modules/esbuild/lib/main.js
var require_main = __commonJS({
  "node_modules/esbuild/lib/main.js"(exports, module) {
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
    var node_exports = {};
    __export(node_exports, {
      analyzeMetafile: () => analyzeMetafile,
      analyzeMetafileSync: () => analyzeMetafileSync,
      build: () => build2,
      buildSync: () => buildSync,
      context: () => context,
      default: () => node_default,
      formatMessages: () => formatMessages,
      formatMessagesSync: () => formatMessagesSync,
      initialize: () => initialize,
      stop: () => stop,
      transform: () => transform,
      transformSync: () => transformSync,
      version: () => version
    });
    module.exports = __toCommonJS(node_exports);
    function encodePacket(packet) {
      let visit = (value) => {
        if (value === null) {
          bb.write8(0);
        } else if (typeof value === "boolean") {
          bb.write8(1);
          bb.write8(+value);
        } else if (typeof value === "number") {
          bb.write8(2);
          bb.write32(value | 0);
        } else if (typeof value === "string") {
          bb.write8(3);
          bb.write(encodeUTF8(value));
        } else if (value instanceof Uint8Array) {
          bb.write8(4);
          bb.write(value);
        } else if (value instanceof Array) {
          bb.write8(5);
          bb.write32(value.length);
          for (let item of value) {
            visit(item);
          }
        } else {
          let keys = Object.keys(value);
          bb.write8(6);
          bb.write32(keys.length);
          for (let key of keys) {
            bb.write(encodeUTF8(key));
            visit(value[key]);
          }
        }
      };
      let bb = new ByteBuffer();
      bb.write32(0);
      bb.write32(packet.id << 1 | +!packet.isRequest);
      visit(packet.value);
      writeUInt32LE(bb.buf, bb.len - 4, 0);
      return bb.buf.subarray(0, bb.len);
    }
    function decodePacket(bytes) {
      let visit = () => {
        switch (bb.read8()) {
          case 0:
            return null;
          case 1:
            return !!bb.read8();
          case 2:
            return bb.read32();
          case 3:
            return decodeUTF8(bb.read());
          case 4:
            return bb.read();
          case 5: {
            let count = bb.read32();
            let value2 = [];
            for (let i = 0; i < count; i++) {
              value2.push(visit());
            }
            return value2;
          }
          case 6: {
            let count = bb.read32();
            let value2 = {};
            for (let i = 0; i < count; i++) {
              value2[decodeUTF8(bb.read())] = visit();
            }
            return value2;
          }
          default:
            throw new Error("Invalid packet");
        }
      };
      let bb = new ByteBuffer(bytes);
      let id = bb.read32();
      let isRequest = (id & 1) === 0;
      id >>>= 1;
      let value = visit();
      if (bb.ptr !== bytes.length) {
        throw new Error("Invalid packet");
      }
      return { id, isRequest, value };
    }
    var ByteBuffer = class {
      constructor(buf = new Uint8Array(1024)) {
        this.buf = buf;
        this.len = 0;
        this.ptr = 0;
      }
      _write(delta) {
        if (this.len + delta > this.buf.length) {
          let clone = new Uint8Array((this.len + delta) * 2);
          clone.set(this.buf);
          this.buf = clone;
        }
        this.len += delta;
        return this.len - delta;
      }
      write8(value) {
        let offset = this._write(1);
        this.buf[offset] = value;
      }
      write32(value) {
        let offset = this._write(4);
        writeUInt32LE(this.buf, value, offset);
      }
      write(bytes) {
        let offset = this._write(4 + bytes.length);
        writeUInt32LE(this.buf, bytes.length, offset);
        this.buf.set(bytes, offset + 4);
      }
      _read(delta) {
        if (this.ptr + delta > this.buf.length) {
          throw new Error("Invalid packet");
        }
        this.ptr += delta;
        return this.ptr - delta;
      }
      read8() {
        return this.buf[this._read(1)];
      }
      read32() {
        return readUInt32LE(this.buf, this._read(4));
      }
      read() {
        let length = this.read32();
        let bytes = new Uint8Array(length);
        let ptr = this._read(bytes.length);
        bytes.set(this.buf.subarray(ptr, ptr + length));
        return bytes;
      }
    };
    var encodeUTF8;
    var decodeUTF8;
    var encodeInvariant;
    if (typeof TextEncoder !== "undefined" && typeof TextDecoder !== "undefined") {
      let encoder = new TextEncoder();
      let decoder = new TextDecoder();
      encodeUTF8 = (text) => encoder.encode(text);
      decodeUTF8 = (bytes) => decoder.decode(bytes);
      encodeInvariant = 'new TextEncoder().encode("")';
    } else if (typeof Buffer !== "undefined") {
      encodeUTF8 = (text) => Buffer.from(text);
      decodeUTF8 = (bytes) => {
        let { buffer, byteOffset, byteLength } = bytes;
        return Buffer.from(buffer, byteOffset, byteLength).toString();
      };
      encodeInvariant = 'Buffer.from("")';
    } else {
      throw new Error("No UTF-8 codec found");
    }
    if (!(encodeUTF8("") instanceof Uint8Array))
      throw new Error(`Invariant violation: "${encodeInvariant} instanceof Uint8Array" is incorrectly false

This indicates that your JavaScript environment is broken. You cannot use
esbuild in this environment because esbuild relies on this invariant. This
is not a problem with esbuild. You need to fix your environment instead.
`);
    function readUInt32LE(buffer, offset) {
      return buffer[offset++] | buffer[offset++] << 8 | buffer[offset++] << 16 | buffer[offset++] << 24;
    }
    function writeUInt32LE(buffer, value, offset) {
      buffer[offset++] = value;
      buffer[offset++] = value >> 8;
      buffer[offset++] = value >> 16;
      buffer[offset++] = value >> 24;
    }
    var quote = JSON.stringify;
    var buildLogLevelDefault = "warning";
    var transformLogLevelDefault = "silent";
    function validateAndJoinStringArray(values, what) {
      const toJoin = [];
      for (const value of values) {
        validateStringValue(value, what);
        if (value.indexOf(",") >= 0) throw new Error(`Invalid ${what}: ${value}`);
        toJoin.push(value);
      }
      return toJoin.join(",");
    }
    var canBeAnything = () => null;
    var mustBeBoolean = (value) => typeof value === "boolean" ? null : "a boolean";
    var mustBeString = (value) => typeof value === "string" ? null : "a string";
    var mustBeRegExp = (value) => value instanceof RegExp ? null : "a RegExp object";
    var mustBeInteger = (value) => typeof value === "number" && value === (value | 0) ? null : "an integer";
    var mustBeValidPortNumber = (value) => typeof value === "number" && value === (value | 0) && value >= 0 && value <= 65535 ? null : "a valid port number";
    var mustBeFunction = (value) => typeof value === "function" ? null : "a function";
    var mustBeArray = (value) => Array.isArray(value) ? null : "an array";
    var mustBeArrayOfStrings = (value) => Array.isArray(value) && value.every((x) => typeof x === "string") ? null : "an array of strings";
    var mustBeObject = (value) => typeof value === "object" && value !== null && !Array.isArray(value) ? null : "an object";
    var mustBeEntryPoints = (value) => typeof value === "object" && value !== null ? null : "an array or an object";
    var mustBeWebAssemblyModule = (value) => value instanceof WebAssembly.Module ? null : "a WebAssembly.Module";
    var mustBeObjectOrNull = (value) => typeof value === "object" && !Array.isArray(value) ? null : "an object or null";
    var mustBeStringOrBoolean = (value) => typeof value === "string" || typeof value === "boolean" ? null : "a string or a boolean";
    var mustBeStringOrObject = (value) => typeof value === "string" || typeof value === "object" && value !== null && !Array.isArray(value) ? null : "a string or an object";
    var mustBeStringOrArrayOfStrings = (value) => typeof value === "string" || Array.isArray(value) && value.every((x) => typeof x === "string") ? null : "a string or an array of strings";
    var mustBeStringOrUint8Array = (value) => typeof value === "string" || value instanceof Uint8Array ? null : "a string or a Uint8Array";
    var mustBeStringOrURL = (value) => typeof value === "string" || value instanceof URL ? null : "a string or a URL";
    function getFlag(object, keys, key, mustBeFn) {
      let value = object[key];
      keys[key + ""] = true;
      if (value === void 0) return void 0;
      let mustBe = mustBeFn(value);
      if (mustBe !== null) throw new Error(`${quote(key)} must be ${mustBe}`);
      return value;
    }
    function checkForInvalidFlags(object, keys, where) {
      for (let key in object) {
        if (!(key in keys)) {
          throw new Error(`Invalid option ${where}: ${quote(key)}`);
        }
      }
    }
    function validateInitializeOptions(options) {
      let keys = /* @__PURE__ */ Object.create(null);
      let wasmURL = getFlag(options, keys, "wasmURL", mustBeStringOrURL);
      let wasmModule = getFlag(options, keys, "wasmModule", mustBeWebAssemblyModule);
      let worker = getFlag(options, keys, "worker", mustBeBoolean);
      checkForInvalidFlags(options, keys, "in initialize() call");
      return {
        wasmURL,
        wasmModule,
        worker
      };
    }
    function validateMangleCache(mangleCache) {
      let validated;
      if (mangleCache !== void 0) {
        validated = /* @__PURE__ */ Object.create(null);
        for (let key in mangleCache) {
          let value = mangleCache[key];
          if (typeof value === "string" || value === false) {
            validated[key] = value;
          } else {
            throw new Error(`Expected ${quote(key)} in mangle cache to map to either a string or false`);
          }
        }
      }
      return validated;
    }
    function pushLogFlags(flags, options, keys, isTTY2, logLevelDefault) {
      let color = getFlag(options, keys, "color", mustBeBoolean);
      let logLevel = getFlag(options, keys, "logLevel", mustBeString);
      let logLimit = getFlag(options, keys, "logLimit", mustBeInteger);
      if (color !== void 0) flags.push(`--color=${color}`);
      else if (isTTY2) flags.push(`--color=true`);
      flags.push(`--log-level=${logLevel || logLevelDefault}`);
      flags.push(`--log-limit=${logLimit || 0}`);
    }
    function validateStringValue(value, what, key) {
      if (typeof value !== "string") {
        throw new Error(`Expected value for ${what}${key !== void 0 ? " " + quote(key) : ""} to be a string, got ${typeof value} instead`);
      }
      return value;
    }
    function pushCommonFlags(flags, options, keys) {
      let legalComments = getFlag(options, keys, "legalComments", mustBeString);
      let sourceRoot = getFlag(options, keys, "sourceRoot", mustBeString);
      let sourcesContent = getFlag(options, keys, "sourcesContent", mustBeBoolean);
      let target = getFlag(options, keys, "target", mustBeStringOrArrayOfStrings);
      let format = getFlag(options, keys, "format", mustBeString);
      let globalName = getFlag(options, keys, "globalName", mustBeString);
      let mangleProps = getFlag(options, keys, "mangleProps", mustBeRegExp);
      let reserveProps = getFlag(options, keys, "reserveProps", mustBeRegExp);
      let mangleQuoted = getFlag(options, keys, "mangleQuoted", mustBeBoolean);
      let minify = getFlag(options, keys, "minify", mustBeBoolean);
      let minifySyntax = getFlag(options, keys, "minifySyntax", mustBeBoolean);
      let minifyWhitespace = getFlag(options, keys, "minifyWhitespace", mustBeBoolean);
      let minifyIdentifiers = getFlag(options, keys, "minifyIdentifiers", mustBeBoolean);
      let lineLimit = getFlag(options, keys, "lineLimit", mustBeInteger);
      let drop = getFlag(options, keys, "drop", mustBeArrayOfStrings);
      let dropLabels = getFlag(options, keys, "dropLabels", mustBeArrayOfStrings);
      let charset = getFlag(options, keys, "charset", mustBeString);
      let treeShaking = getFlag(options, keys, "treeShaking", mustBeBoolean);
      let ignoreAnnotations = getFlag(options, keys, "ignoreAnnotations", mustBeBoolean);
      let jsx = getFlag(options, keys, "jsx", mustBeString);
      let jsxFactory = getFlag(options, keys, "jsxFactory", mustBeString);
      let jsxFragment = getFlag(options, keys, "jsxFragment", mustBeString);
      let jsxImportSource = getFlag(options, keys, "jsxImportSource", mustBeString);
      let jsxDev = getFlag(options, keys, "jsxDev", mustBeBoolean);
      let jsxSideEffects = getFlag(options, keys, "jsxSideEffects", mustBeBoolean);
      let define = getFlag(options, keys, "define", mustBeObject);
      let logOverride = getFlag(options, keys, "logOverride", mustBeObject);
      let supported = getFlag(options, keys, "supported", mustBeObject);
      let pure = getFlag(options, keys, "pure", mustBeArrayOfStrings);
      let keepNames = getFlag(options, keys, "keepNames", mustBeBoolean);
      let platform = getFlag(options, keys, "platform", mustBeString);
      let tsconfigRaw = getFlag(options, keys, "tsconfigRaw", mustBeStringOrObject);
      if (legalComments) flags.push(`--legal-comments=${legalComments}`);
      if (sourceRoot !== void 0) flags.push(`--source-root=${sourceRoot}`);
      if (sourcesContent !== void 0) flags.push(`--sources-content=${sourcesContent}`);
      if (target) flags.push(`--target=${validateAndJoinStringArray(Array.isArray(target) ? target : [target], "target")}`);
      if (format) flags.push(`--format=${format}`);
      if (globalName) flags.push(`--global-name=${globalName}`);
      if (platform) flags.push(`--platform=${platform}`);
      if (tsconfigRaw) flags.push(`--tsconfig-raw=${typeof tsconfigRaw === "string" ? tsconfigRaw : JSON.stringify(tsconfigRaw)}`);
      if (minify) flags.push("--minify");
      if (minifySyntax) flags.push("--minify-syntax");
      if (minifyWhitespace) flags.push("--minify-whitespace");
      if (minifyIdentifiers) flags.push("--minify-identifiers");
      if (lineLimit) flags.push(`--line-limit=${lineLimit}`);
      if (charset) flags.push(`--charset=${charset}`);
      if (treeShaking !== void 0) flags.push(`--tree-shaking=${treeShaking}`);
      if (ignoreAnnotations) flags.push(`--ignore-annotations`);
      if (drop) for (let what of drop) flags.push(`--drop:${validateStringValue(what, "drop")}`);
      if (dropLabels) flags.push(`--drop-labels=${validateAndJoinStringArray(dropLabels, "drop label")}`);
      if (mangleProps) flags.push(`--mangle-props=${jsRegExpToGoRegExp(mangleProps)}`);
      if (reserveProps) flags.push(`--reserve-props=${jsRegExpToGoRegExp(reserveProps)}`);
      if (mangleQuoted !== void 0) flags.push(`--mangle-quoted=${mangleQuoted}`);
      if (jsx) flags.push(`--jsx=${jsx}`);
      if (jsxFactory) flags.push(`--jsx-factory=${jsxFactory}`);
      if (jsxFragment) flags.push(`--jsx-fragment=${jsxFragment}`);
      if (jsxImportSource) flags.push(`--jsx-import-source=${jsxImportSource}`);
      if (jsxDev) flags.push(`--jsx-dev`);
      if (jsxSideEffects) flags.push(`--jsx-side-effects`);
      if (define) {
        for (let key in define) {
          if (key.indexOf("=") >= 0) throw new Error(`Invalid define: ${key}`);
          flags.push(`--define:${key}=${validateStringValue(define[key], "define", key)}`);
        }
      }
      if (logOverride) {
        for (let key in logOverride) {
          if (key.indexOf("=") >= 0) throw new Error(`Invalid log override: ${key}`);
          flags.push(`--log-override:${key}=${validateStringValue(logOverride[key], "log override", key)}`);
        }
      }
      if (supported) {
        for (let key in supported) {
          if (key.indexOf("=") >= 0) throw new Error(`Invalid supported: ${key}`);
          const value = supported[key];
          if (typeof value !== "boolean") throw new Error(`Expected value for supported ${quote(key)} to be a boolean, got ${typeof value} instead`);
          flags.push(`--supported:${key}=${value}`);
        }
      }
      if (pure) for (let fn of pure) flags.push(`--pure:${validateStringValue(fn, "pure")}`);
      if (keepNames) flags.push(`--keep-names`);
    }
    function flagsForBuildOptions(callName, options, isTTY2, logLevelDefault, writeDefault) {
      var _a2;
      let flags = [];
      let entries = [];
      let keys = /* @__PURE__ */ Object.create(null);
      let stdinContents = null;
      let stdinResolveDir = null;
      pushLogFlags(flags, options, keys, isTTY2, logLevelDefault);
      pushCommonFlags(flags, options, keys);
      let sourcemap = getFlag(options, keys, "sourcemap", mustBeStringOrBoolean);
      let bundle = getFlag(options, keys, "bundle", mustBeBoolean);
      let splitting = getFlag(options, keys, "splitting", mustBeBoolean);
      let preserveSymlinks = getFlag(options, keys, "preserveSymlinks", mustBeBoolean);
      let metafile = getFlag(options, keys, "metafile", mustBeBoolean);
      let outfile = getFlag(options, keys, "outfile", mustBeString);
      let outdir = getFlag(options, keys, "outdir", mustBeString);
      let outbase = getFlag(options, keys, "outbase", mustBeString);
      let tsconfig = getFlag(options, keys, "tsconfig", mustBeString);
      let resolveExtensions = getFlag(options, keys, "resolveExtensions", mustBeArrayOfStrings);
      let nodePathsInput = getFlag(options, keys, "nodePaths", mustBeArrayOfStrings);
      let mainFields = getFlag(options, keys, "mainFields", mustBeArrayOfStrings);
      let conditions = getFlag(options, keys, "conditions", mustBeArrayOfStrings);
      let external = getFlag(options, keys, "external", mustBeArrayOfStrings);
      let packages = getFlag(options, keys, "packages", mustBeString);
      let alias = getFlag(options, keys, "alias", mustBeObject);
      let loader = getFlag(options, keys, "loader", mustBeObject);
      let outExtension = getFlag(options, keys, "outExtension", mustBeObject);
      let publicPath = getFlag(options, keys, "publicPath", mustBeString);
      let entryNames = getFlag(options, keys, "entryNames", mustBeString);
      let chunkNames = getFlag(options, keys, "chunkNames", mustBeString);
      let assetNames = getFlag(options, keys, "assetNames", mustBeString);
      let inject = getFlag(options, keys, "inject", mustBeArrayOfStrings);
      let banner = getFlag(options, keys, "banner", mustBeObject);
      let footer = getFlag(options, keys, "footer", mustBeObject);
      let entryPoints = getFlag(options, keys, "entryPoints", mustBeEntryPoints);
      let absWorkingDir = getFlag(options, keys, "absWorkingDir", mustBeString);
      let stdin = getFlag(options, keys, "stdin", mustBeObject);
      let write = (_a2 = getFlag(options, keys, "write", mustBeBoolean)) != null ? _a2 : writeDefault;
      let allowOverwrite = getFlag(options, keys, "allowOverwrite", mustBeBoolean);
      let mangleCache = getFlag(options, keys, "mangleCache", mustBeObject);
      keys.plugins = true;
      checkForInvalidFlags(options, keys, `in ${callName}() call`);
      if (sourcemap) flags.push(`--sourcemap${sourcemap === true ? "" : `=${sourcemap}`}`);
      if (bundle) flags.push("--bundle");
      if (allowOverwrite) flags.push("--allow-overwrite");
      if (splitting) flags.push("--splitting");
      if (preserveSymlinks) flags.push("--preserve-symlinks");
      if (metafile) flags.push(`--metafile`);
      if (outfile) flags.push(`--outfile=${outfile}`);
      if (outdir) flags.push(`--outdir=${outdir}`);
      if (outbase) flags.push(`--outbase=${outbase}`);
      if (tsconfig) flags.push(`--tsconfig=${tsconfig}`);
      if (packages) flags.push(`--packages=${packages}`);
      if (resolveExtensions) flags.push(`--resolve-extensions=${validateAndJoinStringArray(resolveExtensions, "resolve extension")}`);
      if (publicPath) flags.push(`--public-path=${publicPath}`);
      if (entryNames) flags.push(`--entry-names=${entryNames}`);
      if (chunkNames) flags.push(`--chunk-names=${chunkNames}`);
      if (assetNames) flags.push(`--asset-names=${assetNames}`);
      if (mainFields) flags.push(`--main-fields=${validateAndJoinStringArray(mainFields, "main field")}`);
      if (conditions) flags.push(`--conditions=${validateAndJoinStringArray(conditions, "condition")}`);
      if (external) for (let name of external) flags.push(`--external:${validateStringValue(name, "external")}`);
      if (alias) {
        for (let old in alias) {
          if (old.indexOf("=") >= 0) throw new Error(`Invalid package name in alias: ${old}`);
          flags.push(`--alias:${old}=${validateStringValue(alias[old], "alias", old)}`);
        }
      }
      if (banner) {
        for (let type in banner) {
          if (type.indexOf("=") >= 0) throw new Error(`Invalid banner file type: ${type}`);
          flags.push(`--banner:${type}=${validateStringValue(banner[type], "banner", type)}`);
        }
      }
      if (footer) {
        for (let type in footer) {
          if (type.indexOf("=") >= 0) throw new Error(`Invalid footer file type: ${type}`);
          flags.push(`--footer:${type}=${validateStringValue(footer[type], "footer", type)}`);
        }
      }
      if (inject) for (let path3 of inject) flags.push(`--inject:${validateStringValue(path3, "inject")}`);
      if (loader) {
        for (let ext in loader) {
          if (ext.indexOf("=") >= 0) throw new Error(`Invalid loader extension: ${ext}`);
          flags.push(`--loader:${ext}=${validateStringValue(loader[ext], "loader", ext)}`);
        }
      }
      if (outExtension) {
        for (let ext in outExtension) {
          if (ext.indexOf("=") >= 0) throw new Error(`Invalid out extension: ${ext}`);
          flags.push(`--out-extension:${ext}=${validateStringValue(outExtension[ext], "out extension", ext)}`);
        }
      }
      if (entryPoints) {
        if (Array.isArray(entryPoints)) {
          for (let i = 0, n = entryPoints.length; i < n; i++) {
            let entryPoint = entryPoints[i];
            if (typeof entryPoint === "object" && entryPoint !== null) {
              let entryPointKeys = /* @__PURE__ */ Object.create(null);
              let input = getFlag(entryPoint, entryPointKeys, "in", mustBeString);
              let output = getFlag(entryPoint, entryPointKeys, "out", mustBeString);
              checkForInvalidFlags(entryPoint, entryPointKeys, "in entry point at index " + i);
              if (input === void 0) throw new Error('Missing property "in" for entry point at index ' + i);
              if (output === void 0) throw new Error('Missing property "out" for entry point at index ' + i);
              entries.push([output, input]);
            } else {
              entries.push(["", validateStringValue(entryPoint, "entry point at index " + i)]);
            }
          }
        } else {
          for (let key in entryPoints) {
            entries.push([key, validateStringValue(entryPoints[key], "entry point", key)]);
          }
        }
      }
      if (stdin) {
        let stdinKeys = /* @__PURE__ */ Object.create(null);
        let contents = getFlag(stdin, stdinKeys, "contents", mustBeStringOrUint8Array);
        let resolveDir = getFlag(stdin, stdinKeys, "resolveDir", mustBeString);
        let sourcefile = getFlag(stdin, stdinKeys, "sourcefile", mustBeString);
        let loader2 = getFlag(stdin, stdinKeys, "loader", mustBeString);
        checkForInvalidFlags(stdin, stdinKeys, 'in "stdin" object');
        if (sourcefile) flags.push(`--sourcefile=${sourcefile}`);
        if (loader2) flags.push(`--loader=${loader2}`);
        if (resolveDir) stdinResolveDir = resolveDir;
        if (typeof contents === "string") stdinContents = encodeUTF8(contents);
        else if (contents instanceof Uint8Array) stdinContents = contents;
      }
      let nodePaths = [];
      if (nodePathsInput) {
        for (let value of nodePathsInput) {
          value += "";
          nodePaths.push(value);
        }
      }
      return {
        entries,
        flags,
        write,
        stdinContents,
        stdinResolveDir,
        absWorkingDir,
        nodePaths,
        mangleCache: validateMangleCache(mangleCache)
      };
    }
    function flagsForTransformOptions(callName, options, isTTY2, logLevelDefault) {
      let flags = [];
      let keys = /* @__PURE__ */ Object.create(null);
      pushLogFlags(flags, options, keys, isTTY2, logLevelDefault);
      pushCommonFlags(flags, options, keys);
      let sourcemap = getFlag(options, keys, "sourcemap", mustBeStringOrBoolean);
      let sourcefile = getFlag(options, keys, "sourcefile", mustBeString);
      let loader = getFlag(options, keys, "loader", mustBeString);
      let banner = getFlag(options, keys, "banner", mustBeString);
      let footer = getFlag(options, keys, "footer", mustBeString);
      let mangleCache = getFlag(options, keys, "mangleCache", mustBeObject);
      checkForInvalidFlags(options, keys, `in ${callName}() call`);
      if (sourcemap) flags.push(`--sourcemap=${sourcemap === true ? "external" : sourcemap}`);
      if (sourcefile) flags.push(`--sourcefile=${sourcefile}`);
      if (loader) flags.push(`--loader=${loader}`);
      if (banner) flags.push(`--banner=${banner}`);
      if (footer) flags.push(`--footer=${footer}`);
      return {
        flags,
        mangleCache: validateMangleCache(mangleCache)
      };
    }
    function createChannel(streamIn) {
      const requestCallbacksByKey = {};
      const closeData = { didClose: false, reason: "" };
      let responseCallbacks = {};
      let nextRequestID = 0;
      let nextBuildKey = 0;
      let stdout = new Uint8Array(16 * 1024);
      let stdoutUsed = 0;
      let readFromStdout = (chunk) => {
        let limit = stdoutUsed + chunk.length;
        if (limit > stdout.length) {
          let swap = new Uint8Array(limit * 2);
          swap.set(stdout);
          stdout = swap;
        }
        stdout.set(chunk, stdoutUsed);
        stdoutUsed += chunk.length;
        let offset = 0;
        while (offset + 4 <= stdoutUsed) {
          let length = readUInt32LE(stdout, offset);
          if (offset + 4 + length > stdoutUsed) {
            break;
          }
          offset += 4;
          handleIncomingPacket(stdout.subarray(offset, offset + length));
          offset += length;
        }
        if (offset > 0) {
          stdout.copyWithin(0, offset, stdoutUsed);
          stdoutUsed -= offset;
        }
      };
      let afterClose = (error) => {
        closeData.didClose = true;
        if (error) closeData.reason = ": " + (error.message || error);
        const text = "The service was stopped" + closeData.reason;
        for (let id in responseCallbacks) {
          responseCallbacks[id](text, null);
        }
        responseCallbacks = {};
      };
      let sendRequest = (refs, value, callback) => {
        if (closeData.didClose) return callback("The service is no longer running" + closeData.reason, null);
        let id = nextRequestID++;
        responseCallbacks[id] = (error, response) => {
          try {
            callback(error, response);
          } finally {
            if (refs) refs.unref();
          }
        };
        if (refs) refs.ref();
        streamIn.writeToStdin(encodePacket({ id, isRequest: true, value }));
      };
      let sendResponse = (id, value) => {
        if (closeData.didClose) throw new Error("The service is no longer running" + closeData.reason);
        streamIn.writeToStdin(encodePacket({ id, isRequest: false, value }));
      };
      let handleRequest = async (id, request) => {
        try {
          if (request.command === "ping") {
            sendResponse(id, {});
            return;
          }
          if (typeof request.key === "number") {
            const requestCallbacks = requestCallbacksByKey[request.key];
            if (!requestCallbacks) {
              return;
            }
            const callback = requestCallbacks[request.command];
            if (callback) {
              await callback(id, request);
              return;
            }
          }
          throw new Error(`Invalid command: ` + request.command);
        } catch (e) {
          const errors = [extractErrorMessageV8(e, streamIn, null, void 0, "")];
          try {
            sendResponse(id, { errors });
          } catch {
          }
        }
      };
      let isFirstPacket = true;
      let handleIncomingPacket = (bytes) => {
        if (isFirstPacket) {
          isFirstPacket = false;
          let binaryVersion = String.fromCharCode(...bytes);
          if (binaryVersion !== "0.25.5") {
            throw new Error(`Cannot start service: Host version "${"0.25.5"}" does not match binary version ${quote(binaryVersion)}`);
          }
          return;
        }
        let packet = decodePacket(bytes);
        if (packet.isRequest) {
          handleRequest(packet.id, packet.value);
        } else {
          let callback = responseCallbacks[packet.id];
          delete responseCallbacks[packet.id];
          if (packet.value.error) callback(packet.value.error, {});
          else callback(null, packet.value);
        }
      };
      let buildOrContext = ({ callName, refs, options, isTTY: isTTY2, defaultWD: defaultWD2, callback }) => {
        let refCount = 0;
        const buildKey = nextBuildKey++;
        const requestCallbacks = {};
        const buildRefs = {
          ref() {
            if (++refCount === 1) {
              if (refs) refs.ref();
            }
          },
          unref() {
            if (--refCount === 0) {
              delete requestCallbacksByKey[buildKey];
              if (refs) refs.unref();
            }
          }
        };
        requestCallbacksByKey[buildKey] = requestCallbacks;
        buildRefs.ref();
        buildOrContextImpl(
          callName,
          buildKey,
          sendRequest,
          sendResponse,
          buildRefs,
          streamIn,
          requestCallbacks,
          options,
          isTTY2,
          defaultWD2,
          (err, res) => {
            try {
              callback(err, res);
            } finally {
              buildRefs.unref();
            }
          }
        );
      };
      let transform2 = ({ callName, refs, input, options, isTTY: isTTY2, fs: fs3, callback }) => {
        const details = createObjectStash();
        let start = (inputPath) => {
          try {
            if (typeof input !== "string" && !(input instanceof Uint8Array))
              throw new Error('The input to "transform" must be a string or a Uint8Array');
            let {
              flags,
              mangleCache
            } = flagsForTransformOptions(callName, options, isTTY2, transformLogLevelDefault);
            let request = {
              command: "transform",
              flags,
              inputFS: inputPath !== null,
              input: inputPath !== null ? encodeUTF8(inputPath) : typeof input === "string" ? encodeUTF8(input) : input
            };
            if (mangleCache) request.mangleCache = mangleCache;
            sendRequest(refs, request, (error, response) => {
              if (error) return callback(new Error(error), null);
              let errors = replaceDetailsInMessages(response.errors, details);
              let warnings = replaceDetailsInMessages(response.warnings, details);
              let outstanding = 1;
              let next = () => {
                if (--outstanding === 0) {
                  let result = {
                    warnings,
                    code: response.code,
                    map: response.map,
                    mangleCache: void 0,
                    legalComments: void 0
                  };
                  if ("legalComments" in response) result.legalComments = response == null ? void 0 : response.legalComments;
                  if (response.mangleCache) result.mangleCache = response == null ? void 0 : response.mangleCache;
                  callback(null, result);
                }
              };
              if (errors.length > 0) return callback(failureErrorWithLog("Transform failed", errors, warnings), null);
              if (response.codeFS) {
                outstanding++;
                fs3.readFile(response.code, (err, contents) => {
                  if (err !== null) {
                    callback(err, null);
                  } else {
                    response.code = contents;
                    next();
                  }
                });
              }
              if (response.mapFS) {
                outstanding++;
                fs3.readFile(response.map, (err, contents) => {
                  if (err !== null) {
                    callback(err, null);
                  } else {
                    response.map = contents;
                    next();
                  }
                });
              }
              next();
            });
          } catch (e) {
            let flags = [];
            try {
              pushLogFlags(flags, options, {}, isTTY2, transformLogLevelDefault);
            } catch {
            }
            const error = extractErrorMessageV8(e, streamIn, details, void 0, "");
            sendRequest(refs, { command: "error", flags, error }, () => {
              error.detail = details.load(error.detail);
              callback(failureErrorWithLog("Transform failed", [error], []), null);
            });
          }
        };
        if ((typeof input === "string" || input instanceof Uint8Array) && input.length > 1024 * 1024) {
          let next = start;
          start = () => fs3.writeFile(input, next);
        }
        start(null);
      };
      let formatMessages2 = ({ callName, refs, messages, options, callback }) => {
        if (!options) throw new Error(`Missing second argument in ${callName}() call`);
        let keys = {};
        let kind = getFlag(options, keys, "kind", mustBeString);
        let color = getFlag(options, keys, "color", mustBeBoolean);
        let terminalWidth = getFlag(options, keys, "terminalWidth", mustBeInteger);
        checkForInvalidFlags(options, keys, `in ${callName}() call`);
        if (kind === void 0) throw new Error(`Missing "kind" in ${callName}() call`);
        if (kind !== "error" && kind !== "warning") throw new Error(`Expected "kind" to be "error" or "warning" in ${callName}() call`);
        let request = {
          command: "format-msgs",
          messages: sanitizeMessages(messages, "messages", null, "", terminalWidth),
          isWarning: kind === "warning"
        };
        if (color !== void 0) request.color = color;
        if (terminalWidth !== void 0) request.terminalWidth = terminalWidth;
        sendRequest(refs, request, (error, response) => {
          if (error) return callback(new Error(error), null);
          callback(null, response.messages);
        });
      };
      let analyzeMetafile2 = ({ callName, refs, metafile, options, callback }) => {
        if (options === void 0) options = {};
        let keys = {};
        let color = getFlag(options, keys, "color", mustBeBoolean);
        let verbose = getFlag(options, keys, "verbose", mustBeBoolean);
        checkForInvalidFlags(options, keys, `in ${callName}() call`);
        let request = {
          command: "analyze-metafile",
          metafile
        };
        if (color !== void 0) request.color = color;
        if (verbose !== void 0) request.verbose = verbose;
        sendRequest(refs, request, (error, response) => {
          if (error) return callback(new Error(error), null);
          callback(null, response.result);
        });
      };
      return {
        readFromStdout,
        afterClose,
        service: {
          buildOrContext,
          transform: transform2,
          formatMessages: formatMessages2,
          analyzeMetafile: analyzeMetafile2
        }
      };
    }
    function buildOrContextImpl(callName, buildKey, sendRequest, sendResponse, refs, streamIn, requestCallbacks, options, isTTY2, defaultWD2, callback) {
      const details = createObjectStash();
      const isContext = callName === "context";
      const handleError = (e, pluginName) => {
        const flags = [];
        try {
          pushLogFlags(flags, options, {}, isTTY2, buildLogLevelDefault);
        } catch {
        }
        const message = extractErrorMessageV8(e, streamIn, details, void 0, pluginName);
        sendRequest(refs, { command: "error", flags, error: message }, () => {
          message.detail = details.load(message.detail);
          callback(failureErrorWithLog(isContext ? "Context failed" : "Build failed", [message], []), null);
        });
      };
      let plugins;
      if (typeof options === "object") {
        const value = options.plugins;
        if (value !== void 0) {
          if (!Array.isArray(value)) return handleError(new Error(`"plugins" must be an array`), "");
          plugins = value;
        }
      }
      if (plugins && plugins.length > 0) {
        if (streamIn.isSync) return handleError(new Error("Cannot use plugins in synchronous API calls"), "");
        handlePlugins(
          buildKey,
          sendRequest,
          sendResponse,
          refs,
          streamIn,
          requestCallbacks,
          options,
          plugins,
          details
        ).then(
          (result) => {
            if (!result.ok) return handleError(result.error, result.pluginName);
            try {
              buildOrContextContinue(result.requestPlugins, result.runOnEndCallbacks, result.scheduleOnDisposeCallbacks);
            } catch (e) {
              handleError(e, "");
            }
          },
          (e) => handleError(e, "")
        );
        return;
      }
      try {
        buildOrContextContinue(null, (result, done) => done([], []), () => {
        });
      } catch (e) {
        handleError(e, "");
      }
      function buildOrContextContinue(requestPlugins, runOnEndCallbacks, scheduleOnDisposeCallbacks) {
        const writeDefault = streamIn.hasFS;
        const {
          entries,
          flags,
          write,
          stdinContents,
          stdinResolveDir,
          absWorkingDir,
          nodePaths,
          mangleCache
        } = flagsForBuildOptions(callName, options, isTTY2, buildLogLevelDefault, writeDefault);
        if (write && !streamIn.hasFS) throw new Error(`The "write" option is unavailable in this environment`);
        const request = {
          command: "build",
          key: buildKey,
          entries,
          flags,
          write,
          stdinContents,
          stdinResolveDir,
          absWorkingDir: absWorkingDir || defaultWD2,
          nodePaths,
          context: isContext
        };
        if (requestPlugins) request.plugins = requestPlugins;
        if (mangleCache) request.mangleCache = mangleCache;
        const buildResponseToResult = (response, callback2) => {
          const result = {
            errors: replaceDetailsInMessages(response.errors, details),
            warnings: replaceDetailsInMessages(response.warnings, details),
            outputFiles: void 0,
            metafile: void 0,
            mangleCache: void 0
          };
          const originalErrors = result.errors.slice();
          const originalWarnings = result.warnings.slice();
          if (response.outputFiles) result.outputFiles = response.outputFiles.map(convertOutputFiles);
          if (response.metafile) result.metafile = JSON.parse(response.metafile);
          if (response.mangleCache) result.mangleCache = response.mangleCache;
          if (response.writeToStdout !== void 0) console.log(decodeUTF8(response.writeToStdout).replace(/\n$/, ""));
          runOnEndCallbacks(result, (onEndErrors, onEndWarnings) => {
            if (originalErrors.length > 0 || onEndErrors.length > 0) {
              const error = failureErrorWithLog("Build failed", originalErrors.concat(onEndErrors), originalWarnings.concat(onEndWarnings));
              return callback2(error, null, onEndErrors, onEndWarnings);
            }
            callback2(null, result, onEndErrors, onEndWarnings);
          });
        };
        let latestResultPromise;
        let provideLatestResult;
        if (isContext)
          requestCallbacks["on-end"] = (id, request2) => new Promise((resolve2) => {
            buildResponseToResult(request2, (err, result, onEndErrors, onEndWarnings) => {
              const response = {
                errors: onEndErrors,
                warnings: onEndWarnings
              };
              if (provideLatestResult) provideLatestResult(err, result);
              latestResultPromise = void 0;
              provideLatestResult = void 0;
              sendResponse(id, response);
              resolve2();
            });
          });
        sendRequest(refs, request, (error, response) => {
          if (error) return callback(new Error(error), null);
          if (!isContext) {
            return buildResponseToResult(response, (err, res) => {
              scheduleOnDisposeCallbacks();
              return callback(err, res);
            });
          }
          if (response.errors.length > 0) {
            return callback(failureErrorWithLog("Context failed", response.errors, response.warnings), null);
          }
          let didDispose = false;
          const result = {
            rebuild: () => {
              if (!latestResultPromise) latestResultPromise = new Promise((resolve2, reject) => {
                let settlePromise;
                provideLatestResult = (err, result2) => {
                  if (!settlePromise) settlePromise = () => err ? reject(err) : resolve2(result2);
                };
                const triggerAnotherBuild = () => {
                  const request2 = {
                    command: "rebuild",
                    key: buildKey
                  };
                  sendRequest(refs, request2, (error2, response2) => {
                    if (error2) {
                      reject(new Error(error2));
                    } else if (settlePromise) {
                      settlePromise();
                    } else {
                      triggerAnotherBuild();
                    }
                  });
                };
                triggerAnotherBuild();
              });
              return latestResultPromise;
            },
            watch: (options2 = {}) => new Promise((resolve2, reject) => {
              if (!streamIn.hasFS) throw new Error(`Cannot use the "watch" API in this environment`);
              const keys = {};
              checkForInvalidFlags(options2, keys, `in watch() call`);
              const request2 = {
                command: "watch",
                key: buildKey
              };
              sendRequest(refs, request2, (error2) => {
                if (error2) reject(new Error(error2));
                else resolve2(void 0);
              });
            }),
            serve: (options2 = {}) => new Promise((resolve2, reject) => {
              if (!streamIn.hasFS) throw new Error(`Cannot use the "serve" API in this environment`);
              const keys = {};
              const port = getFlag(options2, keys, "port", mustBeValidPortNumber);
              const host = getFlag(options2, keys, "host", mustBeString);
              const servedir = getFlag(options2, keys, "servedir", mustBeString);
              const keyfile = getFlag(options2, keys, "keyfile", mustBeString);
              const certfile = getFlag(options2, keys, "certfile", mustBeString);
              const fallback = getFlag(options2, keys, "fallback", mustBeString);
              const cors = getFlag(options2, keys, "cors", mustBeObject);
              const onRequest = getFlag(options2, keys, "onRequest", mustBeFunction);
              checkForInvalidFlags(options2, keys, `in serve() call`);
              const request2 = {
                command: "serve",
                key: buildKey,
                onRequest: !!onRequest
              };
              if (port !== void 0) request2.port = port;
              if (host !== void 0) request2.host = host;
              if (servedir !== void 0) request2.servedir = servedir;
              if (keyfile !== void 0) request2.keyfile = keyfile;
              if (certfile !== void 0) request2.certfile = certfile;
              if (fallback !== void 0) request2.fallback = fallback;
              if (cors) {
                const corsKeys = {};
                const origin = getFlag(cors, corsKeys, "origin", mustBeStringOrArrayOfStrings);
                checkForInvalidFlags(cors, corsKeys, `on "cors" object`);
                if (Array.isArray(origin)) request2.corsOrigin = origin;
                else if (origin !== void 0) request2.corsOrigin = [origin];
              }
              sendRequest(refs, request2, (error2, response2) => {
                if (error2) return reject(new Error(error2));
                if (onRequest) {
                  requestCallbacks["serve-request"] = (id, request3) => {
                    onRequest(request3.args);
                    sendResponse(id, {});
                  };
                }
                resolve2(response2);
              });
            }),
            cancel: () => new Promise((resolve2) => {
              if (didDispose) return resolve2();
              const request2 = {
                command: "cancel",
                key: buildKey
              };
              sendRequest(refs, request2, () => {
                resolve2();
              });
            }),
            dispose: () => new Promise((resolve2) => {
              if (didDispose) return resolve2();
              didDispose = true;
              const request2 = {
                command: "dispose",
                key: buildKey
              };
              sendRequest(refs, request2, () => {
                resolve2();
                scheduleOnDisposeCallbacks();
                refs.unref();
              });
            })
          };
          refs.ref();
          callback(null, result);
        });
      }
    }
    var handlePlugins = async (buildKey, sendRequest, sendResponse, refs, streamIn, requestCallbacks, initialOptions, plugins, details) => {
      let onStartCallbacks = [];
      let onEndCallbacks = [];
      let onResolveCallbacks = {};
      let onLoadCallbacks = {};
      let onDisposeCallbacks = [];
      let nextCallbackID = 0;
      let i = 0;
      let requestPlugins = [];
      let isSetupDone = false;
      plugins = [...plugins];
      for (let item of plugins) {
        let keys = {};
        if (typeof item !== "object") throw new Error(`Plugin at index ${i} must be an object`);
        const name = getFlag(item, keys, "name", mustBeString);
        if (typeof name !== "string" || name === "") throw new Error(`Plugin at index ${i} is missing a name`);
        try {
          let setup = getFlag(item, keys, "setup", mustBeFunction);
          if (typeof setup !== "function") throw new Error(`Plugin is missing a setup function`);
          checkForInvalidFlags(item, keys, `on plugin ${quote(name)}`);
          let plugin = {
            name,
            onStart: false,
            onEnd: false,
            onResolve: [],
            onLoad: []
          };
          i++;
          let resolve2 = (path3, options = {}) => {
            if (!isSetupDone) throw new Error('Cannot call "resolve" before plugin setup has completed');
            if (typeof path3 !== "string") throw new Error(`The path to resolve must be a string`);
            let keys2 = /* @__PURE__ */ Object.create(null);
            let pluginName = getFlag(options, keys2, "pluginName", mustBeString);
            let importer = getFlag(options, keys2, "importer", mustBeString);
            let namespace = getFlag(options, keys2, "namespace", mustBeString);
            let resolveDir = getFlag(options, keys2, "resolveDir", mustBeString);
            let kind = getFlag(options, keys2, "kind", mustBeString);
            let pluginData = getFlag(options, keys2, "pluginData", canBeAnything);
            let importAttributes = getFlag(options, keys2, "with", mustBeObject);
            checkForInvalidFlags(options, keys2, "in resolve() call");
            return new Promise((resolve22, reject) => {
              const request = {
                command: "resolve",
                path: path3,
                key: buildKey,
                pluginName: name
              };
              if (pluginName != null) request.pluginName = pluginName;
              if (importer != null) request.importer = importer;
              if (namespace != null) request.namespace = namespace;
              if (resolveDir != null) request.resolveDir = resolveDir;
              if (kind != null) request.kind = kind;
              else throw new Error(`Must specify "kind" when calling "resolve"`);
              if (pluginData != null) request.pluginData = details.store(pluginData);
              if (importAttributes != null) request.with = sanitizeStringMap(importAttributes, "with");
              sendRequest(refs, request, (error, response) => {
                if (error !== null) reject(new Error(error));
                else resolve22({
                  errors: replaceDetailsInMessages(response.errors, details),
                  warnings: replaceDetailsInMessages(response.warnings, details),
                  path: response.path,
                  external: response.external,
                  sideEffects: response.sideEffects,
                  namespace: response.namespace,
                  suffix: response.suffix,
                  pluginData: details.load(response.pluginData)
                });
              });
            });
          };
          let promise = setup({
            initialOptions,
            resolve: resolve2,
            onStart(callback) {
              let registeredText = `This error came from the "onStart" callback registered here:`;
              let registeredNote = extractCallerV8(new Error(registeredText), streamIn, "onStart");
              onStartCallbacks.push({ name, callback, note: registeredNote });
              plugin.onStart = true;
            },
            onEnd(callback) {
              let registeredText = `This error came from the "onEnd" callback registered here:`;
              let registeredNote = extractCallerV8(new Error(registeredText), streamIn, "onEnd");
              onEndCallbacks.push({ name, callback, note: registeredNote });
              plugin.onEnd = true;
            },
            onResolve(options, callback) {
              let registeredText = `This error came from the "onResolve" callback registered here:`;
              let registeredNote = extractCallerV8(new Error(registeredText), streamIn, "onResolve");
              let keys2 = {};
              let filter = getFlag(options, keys2, "filter", mustBeRegExp);
              let namespace = getFlag(options, keys2, "namespace", mustBeString);
              checkForInvalidFlags(options, keys2, `in onResolve() call for plugin ${quote(name)}`);
              if (filter == null) throw new Error(`onResolve() call is missing a filter`);
              let id = nextCallbackID++;
              onResolveCallbacks[id] = { name, callback, note: registeredNote };
              plugin.onResolve.push({ id, filter: jsRegExpToGoRegExp(filter), namespace: namespace || "" });
            },
            onLoad(options, callback) {
              let registeredText = `This error came from the "onLoad" callback registered here:`;
              let registeredNote = extractCallerV8(new Error(registeredText), streamIn, "onLoad");
              let keys2 = {};
              let filter = getFlag(options, keys2, "filter", mustBeRegExp);
              let namespace = getFlag(options, keys2, "namespace", mustBeString);
              checkForInvalidFlags(options, keys2, `in onLoad() call for plugin ${quote(name)}`);
              if (filter == null) throw new Error(`onLoad() call is missing a filter`);
              let id = nextCallbackID++;
              onLoadCallbacks[id] = { name, callback, note: registeredNote };
              plugin.onLoad.push({ id, filter: jsRegExpToGoRegExp(filter), namespace: namespace || "" });
            },
            onDispose(callback) {
              onDisposeCallbacks.push(callback);
            },
            esbuild: streamIn.esbuild
          });
          if (promise) await promise;
          requestPlugins.push(plugin);
        } catch (e) {
          return { ok: false, error: e, pluginName: name };
        }
      }
      requestCallbacks["on-start"] = async (id, request) => {
        details.clear();
        let response = { errors: [], warnings: [] };
        await Promise.all(onStartCallbacks.map(async ({ name, callback, note }) => {
          try {
            let result = await callback();
            if (result != null) {
              if (typeof result !== "object") throw new Error(`Expected onStart() callback in plugin ${quote(name)} to return an object`);
              let keys = {};
              let errors = getFlag(result, keys, "errors", mustBeArray);
              let warnings = getFlag(result, keys, "warnings", mustBeArray);
              checkForInvalidFlags(result, keys, `from onStart() callback in plugin ${quote(name)}`);
              if (errors != null) response.errors.push(...sanitizeMessages(errors, "errors", details, name, void 0));
              if (warnings != null) response.warnings.push(...sanitizeMessages(warnings, "warnings", details, name, void 0));
            }
          } catch (e) {
            response.errors.push(extractErrorMessageV8(e, streamIn, details, note && note(), name));
          }
        }));
        sendResponse(id, response);
      };
      requestCallbacks["on-resolve"] = async (id, request) => {
        let response = {}, name = "", callback, note;
        for (let id2 of request.ids) {
          try {
            ({ name, callback, note } = onResolveCallbacks[id2]);
            let result = await callback({
              path: request.path,
              importer: request.importer,
              namespace: request.namespace,
              resolveDir: request.resolveDir,
              kind: request.kind,
              pluginData: details.load(request.pluginData),
              with: request.with
            });
            if (result != null) {
              if (typeof result !== "object") throw new Error(`Expected onResolve() callback in plugin ${quote(name)} to return an object`);
              let keys = {};
              let pluginName = getFlag(result, keys, "pluginName", mustBeString);
              let path3 = getFlag(result, keys, "path", mustBeString);
              let namespace = getFlag(result, keys, "namespace", mustBeString);
              let suffix = getFlag(result, keys, "suffix", mustBeString);
              let external = getFlag(result, keys, "external", mustBeBoolean);
              let sideEffects = getFlag(result, keys, "sideEffects", mustBeBoolean);
              let pluginData = getFlag(result, keys, "pluginData", canBeAnything);
              let errors = getFlag(result, keys, "errors", mustBeArray);
              let warnings = getFlag(result, keys, "warnings", mustBeArray);
              let watchFiles = getFlag(result, keys, "watchFiles", mustBeArrayOfStrings);
              let watchDirs = getFlag(result, keys, "watchDirs", mustBeArrayOfStrings);
              checkForInvalidFlags(result, keys, `from onResolve() callback in plugin ${quote(name)}`);
              response.id = id2;
              if (pluginName != null) response.pluginName = pluginName;
              if (path3 != null) response.path = path3;
              if (namespace != null) response.namespace = namespace;
              if (suffix != null) response.suffix = suffix;
              if (external != null) response.external = external;
              if (sideEffects != null) response.sideEffects = sideEffects;
              if (pluginData != null) response.pluginData = details.store(pluginData);
              if (errors != null) response.errors = sanitizeMessages(errors, "errors", details, name, void 0);
              if (warnings != null) response.warnings = sanitizeMessages(warnings, "warnings", details, name, void 0);
              if (watchFiles != null) response.watchFiles = sanitizeStringArray(watchFiles, "watchFiles");
              if (watchDirs != null) response.watchDirs = sanitizeStringArray(watchDirs, "watchDirs");
              break;
            }
          } catch (e) {
            response = { id: id2, errors: [extractErrorMessageV8(e, streamIn, details, note && note(), name)] };
            break;
          }
        }
        sendResponse(id, response);
      };
      requestCallbacks["on-load"] = async (id, request) => {
        let response = {}, name = "", callback, note;
        for (let id2 of request.ids) {
          try {
            ({ name, callback, note } = onLoadCallbacks[id2]);
            let result = await callback({
              path: request.path,
              namespace: request.namespace,
              suffix: request.suffix,
              pluginData: details.load(request.pluginData),
              with: request.with
            });
            if (result != null) {
              if (typeof result !== "object") throw new Error(`Expected onLoad() callback in plugin ${quote(name)} to return an object`);
              let keys = {};
              let pluginName = getFlag(result, keys, "pluginName", mustBeString);
              let contents = getFlag(result, keys, "contents", mustBeStringOrUint8Array);
              let resolveDir = getFlag(result, keys, "resolveDir", mustBeString);
              let pluginData = getFlag(result, keys, "pluginData", canBeAnything);
              let loader = getFlag(result, keys, "loader", mustBeString);
              let errors = getFlag(result, keys, "errors", mustBeArray);
              let warnings = getFlag(result, keys, "warnings", mustBeArray);
              let watchFiles = getFlag(result, keys, "watchFiles", mustBeArrayOfStrings);
              let watchDirs = getFlag(result, keys, "watchDirs", mustBeArrayOfStrings);
              checkForInvalidFlags(result, keys, `from onLoad() callback in plugin ${quote(name)}`);
              response.id = id2;
              if (pluginName != null) response.pluginName = pluginName;
              if (contents instanceof Uint8Array) response.contents = contents;
              else if (contents != null) response.contents = encodeUTF8(contents);
              if (resolveDir != null) response.resolveDir = resolveDir;
              if (pluginData != null) response.pluginData = details.store(pluginData);
              if (loader != null) response.loader = loader;
              if (errors != null) response.errors = sanitizeMessages(errors, "errors", details, name, void 0);
              if (warnings != null) response.warnings = sanitizeMessages(warnings, "warnings", details, name, void 0);
              if (watchFiles != null) response.watchFiles = sanitizeStringArray(watchFiles, "watchFiles");
              if (watchDirs != null) response.watchDirs = sanitizeStringArray(watchDirs, "watchDirs");
              break;
            }
          } catch (e) {
            response = { id: id2, errors: [extractErrorMessageV8(e, streamIn, details, note && note(), name)] };
            break;
          }
        }
        sendResponse(id, response);
      };
      let runOnEndCallbacks = (result, done) => done([], []);
      if (onEndCallbacks.length > 0) {
        runOnEndCallbacks = (result, done) => {
          (async () => {
            const onEndErrors = [];
            const onEndWarnings = [];
            for (const { name, callback, note } of onEndCallbacks) {
              let newErrors;
              let newWarnings;
              try {
                const value = await callback(result);
                if (value != null) {
                  if (typeof value !== "object") throw new Error(`Expected onEnd() callback in plugin ${quote(name)} to return an object`);
                  let keys = {};
                  let errors = getFlag(value, keys, "errors", mustBeArray);
                  let warnings = getFlag(value, keys, "warnings", mustBeArray);
                  checkForInvalidFlags(value, keys, `from onEnd() callback in plugin ${quote(name)}`);
                  if (errors != null) newErrors = sanitizeMessages(errors, "errors", details, name, void 0);
                  if (warnings != null) newWarnings = sanitizeMessages(warnings, "warnings", details, name, void 0);
                }
              } catch (e) {
                newErrors = [extractErrorMessageV8(e, streamIn, details, note && note(), name)];
              }
              if (newErrors) {
                onEndErrors.push(...newErrors);
                try {
                  result.errors.push(...newErrors);
                } catch {
                }
              }
              if (newWarnings) {
                onEndWarnings.push(...newWarnings);
                try {
                  result.warnings.push(...newWarnings);
                } catch {
                }
              }
            }
            done(onEndErrors, onEndWarnings);
          })();
        };
      }
      let scheduleOnDisposeCallbacks = () => {
        for (const cb of onDisposeCallbacks) {
          setTimeout(() => cb(), 0);
        }
      };
      isSetupDone = true;
      return {
        ok: true,
        requestPlugins,
        runOnEndCallbacks,
        scheduleOnDisposeCallbacks
      };
    };
    function createObjectStash() {
      const map = /* @__PURE__ */ new Map();
      let nextID = 0;
      return {
        clear() {
          map.clear();
        },
        load(id) {
          return map.get(id);
        },
        store(value) {
          if (value === void 0) return -1;
          const id = nextID++;
          map.set(id, value);
          return id;
        }
      };
    }
    function extractCallerV8(e, streamIn, ident) {
      let note;
      let tried = false;
      return () => {
        if (tried) return note;
        tried = true;
        try {
          let lines = (e.stack + "").split("\n");
          lines.splice(1, 1);
          let location = parseStackLinesV8(streamIn, lines, ident);
          if (location) {
            note = { text: e.message, location };
            return note;
          }
        } catch {
        }
      };
    }
    function extractErrorMessageV8(e, streamIn, stash, note, pluginName) {
      let text = "Internal error";
      let location = null;
      try {
        text = (e && e.message || e) + "";
      } catch {
      }
      try {
        location = parseStackLinesV8(streamIn, (e.stack + "").split("\n"), "");
      } catch {
      }
      return { id: "", pluginName, text, location, notes: note ? [note] : [], detail: stash ? stash.store(e) : -1 };
    }
    function parseStackLinesV8(streamIn, lines, ident) {
      let at = "    at ";
      if (streamIn.readFileSync && !lines[0].startsWith(at) && lines[1].startsWith(at)) {
        for (let i = 1; i < lines.length; i++) {
          let line = lines[i];
          if (!line.startsWith(at)) continue;
          line = line.slice(at.length);
          while (true) {
            let match = /^(?:new |async )?\S+ \((.*)\)$/.exec(line);
            if (match) {
              line = match[1];
              continue;
            }
            match = /^eval at \S+ \((.*)\)(?:, \S+:\d+:\d+)?$/.exec(line);
            if (match) {
              line = match[1];
              continue;
            }
            match = /^(\S+):(\d+):(\d+)$/.exec(line);
            if (match) {
              let contents;
              try {
                contents = streamIn.readFileSync(match[1], "utf8");
              } catch {
                break;
              }
              let lineText = contents.split(/\r\n|\r|\n|\u2028|\u2029/)[+match[2] - 1] || "";
              let column = +match[3] - 1;
              let length = lineText.slice(column, column + ident.length) === ident ? ident.length : 0;
              return {
                file: match[1],
                namespace: "file",
                line: +match[2],
                column: encodeUTF8(lineText.slice(0, column)).length,
                length: encodeUTF8(lineText.slice(column, column + length)).length,
                lineText: lineText + "\n" + lines.slice(1).join("\n"),
                suggestion: ""
              };
            }
            break;
          }
        }
      }
      return null;
    }
    function failureErrorWithLog(text, errors, warnings) {
      let limit = 5;
      text += errors.length < 1 ? "" : ` with ${errors.length} error${errors.length < 2 ? "" : "s"}:` + errors.slice(0, limit + 1).map((e, i) => {
        if (i === limit) return "\n...";
        if (!e.location) return `
error: ${e.text}`;
        let { file, line, column } = e.location;
        let pluginText = e.pluginName ? `[plugin: ${e.pluginName}] ` : "";
        return `
${file}:${line}:${column}: ERROR: ${pluginText}${e.text}`;
      }).join("");
      let error = new Error(text);
      for (const [key, value] of [["errors", errors], ["warnings", warnings]]) {
        Object.defineProperty(error, key, {
          configurable: true,
          enumerable: true,
          get: () => value,
          set: (value2) => Object.defineProperty(error, key, {
            configurable: true,
            enumerable: true,
            value: value2
          })
        });
      }
      return error;
    }
    function replaceDetailsInMessages(messages, stash) {
      for (const message of messages) {
        message.detail = stash.load(message.detail);
      }
      return messages;
    }
    function sanitizeLocation(location, where, terminalWidth) {
      if (location == null) return null;
      let keys = {};
      let file = getFlag(location, keys, "file", mustBeString);
      let namespace = getFlag(location, keys, "namespace", mustBeString);
      let line = getFlag(location, keys, "line", mustBeInteger);
      let column = getFlag(location, keys, "column", mustBeInteger);
      let length = getFlag(location, keys, "length", mustBeInteger);
      let lineText = getFlag(location, keys, "lineText", mustBeString);
      let suggestion = getFlag(location, keys, "suggestion", mustBeString);
      checkForInvalidFlags(location, keys, where);
      if (lineText) {
        const relevantASCII = lineText.slice(
          0,
          (column && column > 0 ? column : 0) + (length && length > 0 ? length : 0) + (terminalWidth && terminalWidth > 0 ? terminalWidth : 80)
        );
        if (!/[\x7F-\uFFFF]/.test(relevantASCII) && !/\n/.test(lineText)) {
          lineText = relevantASCII;
        }
      }
      return {
        file: file || "",
        namespace: namespace || "",
        line: line || 0,
        column: column || 0,
        length: length || 0,
        lineText: lineText || "",
        suggestion: suggestion || ""
      };
    }
    function sanitizeMessages(messages, property, stash, fallbackPluginName, terminalWidth) {
      let messagesClone = [];
      let index = 0;
      for (const message of messages) {
        let keys = {};
        let id = getFlag(message, keys, "id", mustBeString);
        let pluginName = getFlag(message, keys, "pluginName", mustBeString);
        let text = getFlag(message, keys, "text", mustBeString);
        let location = getFlag(message, keys, "location", mustBeObjectOrNull);
        let notes = getFlag(message, keys, "notes", mustBeArray);
        let detail = getFlag(message, keys, "detail", canBeAnything);
        let where = `in element ${index} of "${property}"`;
        checkForInvalidFlags(message, keys, where);
        let notesClone = [];
        if (notes) {
          for (const note of notes) {
            let noteKeys = {};
            let noteText = getFlag(note, noteKeys, "text", mustBeString);
            let noteLocation = getFlag(note, noteKeys, "location", mustBeObjectOrNull);
            checkForInvalidFlags(note, noteKeys, where);
            notesClone.push({
              text: noteText || "",
              location: sanitizeLocation(noteLocation, where, terminalWidth)
            });
          }
        }
        messagesClone.push({
          id: id || "",
          pluginName: pluginName || fallbackPluginName,
          text: text || "",
          location: sanitizeLocation(location, where, terminalWidth),
          notes: notesClone,
          detail: stash ? stash.store(detail) : -1
        });
        index++;
      }
      return messagesClone;
    }
    function sanitizeStringArray(values, property) {
      const result = [];
      for (const value of values) {
        if (typeof value !== "string") throw new Error(`${quote(property)} must be an array of strings`);
        result.push(value);
      }
      return result;
    }
    function sanitizeStringMap(map, property) {
      const result = /* @__PURE__ */ Object.create(null);
      for (const key in map) {
        const value = map[key];
        if (typeof value !== "string") throw new Error(`key ${quote(key)} in object ${quote(property)} must be a string`);
        result[key] = value;
      }
      return result;
    }
    function convertOutputFiles({ path: path3, contents, hash }) {
      let text = null;
      return {
        path: path3,
        contents,
        hash,
        get text() {
          const binary = this.contents;
          if (text === null || binary !== contents) {
            contents = binary;
            text = decodeUTF8(binary);
          }
          return text;
        }
      };
    }
    function jsRegExpToGoRegExp(regexp) {
      let result = regexp.source;
      if (regexp.flags) result = `(?${regexp.flags})${result}`;
      return result;
    }
    var fs = __require("fs");
    var os = __require("os");
    var path = __require("path");
    var ESBUILD_BINARY_PATH = process.env.ESBUILD_BINARY_PATH || ESBUILD_BINARY_PATH;
    var isValidBinaryPath = (x) => !!x && x !== "/usr/bin/esbuild";
    var packageDarwin_arm64 = "@esbuild/darwin-arm64";
    var packageDarwin_x64 = "@esbuild/darwin-x64";
    var knownWindowsPackages = {
      "win32 arm64 LE": "@esbuild/win32-arm64",
      "win32 ia32 LE": "@esbuild/win32-ia32",
      "win32 x64 LE": "@esbuild/win32-x64"
    };
    var knownUnixlikePackages = {
      "aix ppc64 BE": "@esbuild/aix-ppc64",
      "android arm64 LE": "@esbuild/android-arm64",
      "darwin arm64 LE": "@esbuild/darwin-arm64",
      "darwin x64 LE": "@esbuild/darwin-x64",
      "freebsd arm64 LE": "@esbuild/freebsd-arm64",
      "freebsd x64 LE": "@esbuild/freebsd-x64",
      "linux arm LE": "@esbuild/linux-arm",
      "linux arm64 LE": "@esbuild/linux-arm64",
      "linux ia32 LE": "@esbuild/linux-ia32",
      "linux mips64el LE": "@esbuild/linux-mips64el",
      "linux ppc64 LE": "@esbuild/linux-ppc64",
      "linux riscv64 LE": "@esbuild/linux-riscv64",
      "linux s390x BE": "@esbuild/linux-s390x",
      "linux x64 LE": "@esbuild/linux-x64",
      "linux loong64 LE": "@esbuild/linux-loong64",
      "netbsd arm64 LE": "@esbuild/netbsd-arm64",
      "netbsd x64 LE": "@esbuild/netbsd-x64",
      "openbsd arm64 LE": "@esbuild/openbsd-arm64",
      "openbsd x64 LE": "@esbuild/openbsd-x64",
      "sunos x64 LE": "@esbuild/sunos-x64"
    };
    var knownWebAssemblyFallbackPackages = {
      "android arm LE": "@esbuild/android-arm",
      "android x64 LE": "@esbuild/android-x64"
    };
    function pkgAndSubpathForCurrentPlatform() {
      let pkg;
      let subpath;
      let isWASM = false;
      let platformKey = `${process.platform} ${os.arch()} ${os.endianness()}`;
      if (platformKey in knownWindowsPackages) {
        pkg = knownWindowsPackages[platformKey];
        subpath = "esbuild.exe";
      } else if (platformKey in knownUnixlikePackages) {
        pkg = knownUnixlikePackages[platformKey];
        subpath = "bin/esbuild";
      } else if (platformKey in knownWebAssemblyFallbackPackages) {
        pkg = knownWebAssemblyFallbackPackages[platformKey];
        subpath = "bin/esbuild";
        isWASM = true;
      } else {
        throw new Error(`Unsupported platform: ${platformKey}`);
      }
      return { pkg, subpath, isWASM };
    }
    function pkgForSomeOtherPlatform() {
      const libMainJS = __require.resolve("esbuild");
      const nodeModulesDirectory = path.dirname(path.dirname(path.dirname(libMainJS)));
      if (path.basename(nodeModulesDirectory) === "node_modules") {
        for (const unixKey in knownUnixlikePackages) {
          try {
            const pkg = knownUnixlikePackages[unixKey];
            if (fs.existsSync(path.join(nodeModulesDirectory, pkg))) return pkg;
          } catch {
          }
        }
        for (const windowsKey in knownWindowsPackages) {
          try {
            const pkg = knownWindowsPackages[windowsKey];
            if (fs.existsSync(path.join(nodeModulesDirectory, pkg))) return pkg;
          } catch {
          }
        }
      }
      return null;
    }
    function downloadedBinPath(pkg, subpath) {
      const esbuildLibDir = path.dirname(__require.resolve("esbuild"));
      return path.join(esbuildLibDir, `downloaded-${pkg.replace("/", "-")}-${path.basename(subpath)}`);
    }
    function generateBinPath() {
      if (isValidBinaryPath(ESBUILD_BINARY_PATH)) {
        if (!fs.existsSync(ESBUILD_BINARY_PATH)) {
          console.warn(`[esbuild] Ignoring bad configuration: ESBUILD_BINARY_PATH=${ESBUILD_BINARY_PATH}`);
        } else {
          return { binPath: ESBUILD_BINARY_PATH, isWASM: false };
        }
      }
      const { pkg, subpath, isWASM } = pkgAndSubpathForCurrentPlatform();
      let binPath;
      try {
        binPath = __require.resolve(`${pkg}/${subpath}`);
      } catch (e) {
        binPath = downloadedBinPath(pkg, subpath);
        if (!fs.existsSync(binPath)) {
          try {
            __require.resolve(pkg);
          } catch {
            const otherPkg = pkgForSomeOtherPlatform();
            if (otherPkg) {
              let suggestions = `
Specifically the "${otherPkg}" package is present but this platform
needs the "${pkg}" package instead. People often get into this
situation by installing esbuild on Windows or macOS and copying "node_modules"
into a Docker image that runs Linux, or by copying "node_modules" between
Windows and WSL environments.

If you are installing with npm, you can try not copying the "node_modules"
directory when you copy the files over, and running "npm ci" or "npm install"
on the destination platform after the copy. Or you could consider using yarn
instead of npm which has built-in support for installing a package on multiple
platforms simultaneously.

If you are installing with yarn, you can try listing both this platform and the
other platform in your ".yarnrc.yml" file using the "supportedArchitectures"
feature: https://yarnpkg.com/configuration/yarnrc/#supportedArchitectures
Keep in mind that this means multiple copies of esbuild will be present.
`;
              if (pkg === packageDarwin_x64 && otherPkg === packageDarwin_arm64 || pkg === packageDarwin_arm64 && otherPkg === packageDarwin_x64) {
                suggestions = `
Specifically the "${otherPkg}" package is present but this platform
needs the "${pkg}" package instead. People often get into this
situation by installing esbuild with npm running inside of Rosetta 2 and then
trying to use it with node running outside of Rosetta 2, or vice versa (Rosetta
2 is Apple's on-the-fly x86_64-to-arm64 translation service).

If you are installing with npm, you can try ensuring that both npm and node are
not running under Rosetta 2 and then reinstalling esbuild. This likely involves
changing how you installed npm and/or node. For example, installing node with
the universal installer here should work: https://nodejs.org/en/download/. Or
you could consider using yarn instead of npm which has built-in support for
installing a package on multiple platforms simultaneously.

If you are installing with yarn, you can try listing both "arm64" and "x64"
in your ".yarnrc.yml" file using the "supportedArchitectures" feature:
https://yarnpkg.com/configuration/yarnrc/#supportedArchitectures
Keep in mind that this means multiple copies of esbuild will be present.
`;
              }
              throw new Error(`
You installed esbuild for another platform than the one you're currently using.
This won't work because esbuild is written with native code and needs to
install a platform-specific binary executable.
${suggestions}
Another alternative is to use the "esbuild-wasm" package instead, which works
the same way on all platforms. But it comes with a heavy performance cost and
can sometimes be 10x slower than the "esbuild" package, so you may also not
want to do that.
`);
            }
            throw new Error(`The package "${pkg}" could not be found, and is needed by esbuild.

If you are installing esbuild with npm, make sure that you don't specify the
"--no-optional" or "--omit=optional" flags. The "optionalDependencies" feature
of "package.json" is used by esbuild to install the correct binary executable
for your current platform.`);
          }
          throw e;
        }
      }
      if (/\.zip\//.test(binPath)) {
        let pnpapi;
        try {
          pnpapi = __require("pnpapi");
        } catch (e) {
        }
        if (pnpapi) {
          const root = pnpapi.getPackageInformation(pnpapi.topLevel).packageLocation;
          const binTargetPath = path.join(
            root,
            "node_modules",
            ".cache",
            "esbuild",
            `pnpapi-${pkg.replace("/", "-")}-${"0.25.5"}-${path.basename(subpath)}`
          );
          if (!fs.existsSync(binTargetPath)) {
            fs.mkdirSync(path.dirname(binTargetPath), { recursive: true });
            fs.copyFileSync(binPath, binTargetPath);
            fs.chmodSync(binTargetPath, 493);
          }
          return { binPath: binTargetPath, isWASM };
        }
      }
      return { binPath, isWASM };
    }
    var child_process = __require("child_process");
    var crypto = __require("crypto");
    var path2 = __require("path");
    var fs2 = __require("fs");
    var os2 = __require("os");
    var tty = __require("tty");
    var worker_threads;
    if (process.env.ESBUILD_WORKER_THREADS !== "0") {
      try {
        worker_threads = __require("worker_threads");
      } catch {
      }
      let [major, minor] = process.versions.node.split(".");
      if (
        // <v12.17.0 does not work
        +major < 12 || +major === 12 && +minor < 17 || +major === 13 && +minor < 13
      ) {
        worker_threads = void 0;
      }
    }
    var _a;
    var isInternalWorkerThread = ((_a = worker_threads == null ? void 0 : worker_threads.workerData) == null ? void 0 : _a.esbuildVersion) === "0.25.5";
    var esbuildCommandAndArgs = () => {
      if ((!ESBUILD_BINARY_PATH || false) && (path2.basename(__filename) !== "main.js" || path2.basename(__dirname) !== "lib")) {
        throw new Error(
          `The esbuild JavaScript API cannot be bundled. Please mark the "esbuild" package as external so it's not included in the bundle.

More information: The file containing the code for esbuild's JavaScript API (${__filename}) does not appear to be inside the esbuild package on the file system, which usually means that the esbuild package was bundled into another file. This is problematic because the API needs to run a binary executable inside the esbuild package which is located using a relative path from the API code to the executable. If the esbuild package is bundled, the relative path will be incorrect and the executable won't be found.`
        );
      }
      if (false) {
        return ["node", [path2.join(__dirname, "..", "bin", "esbuild")]];
      } else {
        const { binPath, isWASM } = generateBinPath();
        if (isWASM) {
          return ["node", [binPath]];
        } else {
          return [binPath, []];
        }
      }
    };
    var isTTY = () => tty.isatty(2);
    var fsSync = {
      readFile(tempFile, callback) {
        try {
          let contents = fs2.readFileSync(tempFile, "utf8");
          try {
            fs2.unlinkSync(tempFile);
          } catch {
          }
          callback(null, contents);
        } catch (err) {
          callback(err, null);
        }
      },
      writeFile(contents, callback) {
        try {
          let tempFile = randomFileName();
          fs2.writeFileSync(tempFile, contents);
          callback(tempFile);
        } catch {
          callback(null);
        }
      }
    };
    var fsAsync = {
      readFile(tempFile, callback) {
        try {
          fs2.readFile(tempFile, "utf8", (err, contents) => {
            try {
              fs2.unlink(tempFile, () => callback(err, contents));
            } catch {
              callback(err, contents);
            }
          });
        } catch (err) {
          callback(err, null);
        }
      },
      writeFile(contents, callback) {
        try {
          let tempFile = randomFileName();
          fs2.writeFile(tempFile, contents, (err) => err !== null ? callback(null) : callback(tempFile));
        } catch {
          callback(null);
        }
      }
    };
    var version = "0.25.5";
    var build2 = (options) => ensureServiceIsRunning().build(options);
    var context = (buildOptions) => ensureServiceIsRunning().context(buildOptions);
    var transform = (input, options) => ensureServiceIsRunning().transform(input, options);
    var formatMessages = (messages, options) => ensureServiceIsRunning().formatMessages(messages, options);
    var analyzeMetafile = (messages, options) => ensureServiceIsRunning().analyzeMetafile(messages, options);
    var buildSync = (options) => {
      if (worker_threads && !isInternalWorkerThread) {
        if (!workerThreadService) workerThreadService = startWorkerThreadService(worker_threads);
        return workerThreadService.buildSync(options);
      }
      let result;
      runServiceSync((service) => service.buildOrContext({
        callName: "buildSync",
        refs: null,
        options,
        isTTY: isTTY(),
        defaultWD,
        callback: (err, res) => {
          if (err) throw err;
          result = res;
        }
      }));
      return result;
    };
    var transformSync = (input, options) => {
      if (worker_threads && !isInternalWorkerThread) {
        if (!workerThreadService) workerThreadService = startWorkerThreadService(worker_threads);
        return workerThreadService.transformSync(input, options);
      }
      let result;
      runServiceSync((service) => service.transform({
        callName: "transformSync",
        refs: null,
        input,
        options: options || {},
        isTTY: isTTY(),
        fs: fsSync,
        callback: (err, res) => {
          if (err) throw err;
          result = res;
        }
      }));
      return result;
    };
    var formatMessagesSync = (messages, options) => {
      if (worker_threads && !isInternalWorkerThread) {
        if (!workerThreadService) workerThreadService = startWorkerThreadService(worker_threads);
        return workerThreadService.formatMessagesSync(messages, options);
      }
      let result;
      runServiceSync((service) => service.formatMessages({
        callName: "formatMessagesSync",
        refs: null,
        messages,
        options,
        callback: (err, res) => {
          if (err) throw err;
          result = res;
        }
      }));
      return result;
    };
    var analyzeMetafileSync = (metafile, options) => {
      if (worker_threads && !isInternalWorkerThread) {
        if (!workerThreadService) workerThreadService = startWorkerThreadService(worker_threads);
        return workerThreadService.analyzeMetafileSync(metafile, options);
      }
      let result;
      runServiceSync((service) => service.analyzeMetafile({
        callName: "analyzeMetafileSync",
        refs: null,
        metafile: typeof metafile === "string" ? metafile : JSON.stringify(metafile),
        options,
        callback: (err, res) => {
          if (err) throw err;
          result = res;
        }
      }));
      return result;
    };
    var stop = () => {
      if (stopService) stopService();
      if (workerThreadService) workerThreadService.stop();
      return Promise.resolve();
    };
    var initializeWasCalled = false;
    var initialize = (options) => {
      options = validateInitializeOptions(options || {});
      if (options.wasmURL) throw new Error(`The "wasmURL" option only works in the browser`);
      if (options.wasmModule) throw new Error(`The "wasmModule" option only works in the browser`);
      if (options.worker) throw new Error(`The "worker" option only works in the browser`);
      if (initializeWasCalled) throw new Error('Cannot call "initialize" more than once');
      ensureServiceIsRunning();
      initializeWasCalled = true;
      return Promise.resolve();
    };
    var defaultWD = process.cwd();
    var longLivedService;
    var stopService;
    var ensureServiceIsRunning = () => {
      if (longLivedService) return longLivedService;
      let [command, args] = esbuildCommandAndArgs();
      let child = child_process.spawn(command, args.concat(`--service=${"0.25.5"}`, "--ping"), {
        windowsHide: true,
        stdio: ["pipe", "pipe", "inherit"],
        cwd: defaultWD
      });
      let { readFromStdout, afterClose, service } = createChannel({
        writeToStdin(bytes) {
          child.stdin.write(bytes, (err) => {
            if (err) afterClose(err);
          });
        },
        readFileSync: fs2.readFileSync,
        isSync: false,
        hasFS: true,
        esbuild: node_exports
      });
      child.stdin.on("error", afterClose);
      child.on("error", afterClose);
      const stdin = child.stdin;
      const stdout = child.stdout;
      stdout.on("data", readFromStdout);
      stdout.on("end", afterClose);
      stopService = () => {
        stdin.destroy();
        stdout.destroy();
        child.kill();
        initializeWasCalled = false;
        longLivedService = void 0;
        stopService = void 0;
      };
      let refCount = 0;
      child.unref();
      if (stdin.unref) {
        stdin.unref();
      }
      if (stdout.unref) {
        stdout.unref();
      }
      const refs = {
        ref() {
          if (++refCount === 1) child.ref();
        },
        unref() {
          if (--refCount === 0) child.unref();
        }
      };
      longLivedService = {
        build: (options) => new Promise((resolve2, reject) => {
          service.buildOrContext({
            callName: "build",
            refs,
            options,
            isTTY: isTTY(),
            defaultWD,
            callback: (err, res) => err ? reject(err) : resolve2(res)
          });
        }),
        context: (options) => new Promise((resolve2, reject) => service.buildOrContext({
          callName: "context",
          refs,
          options,
          isTTY: isTTY(),
          defaultWD,
          callback: (err, res) => err ? reject(err) : resolve2(res)
        })),
        transform: (input, options) => new Promise((resolve2, reject) => service.transform({
          callName: "transform",
          refs,
          input,
          options: options || {},
          isTTY: isTTY(),
          fs: fsAsync,
          callback: (err, res) => err ? reject(err) : resolve2(res)
        })),
        formatMessages: (messages, options) => new Promise((resolve2, reject) => service.formatMessages({
          callName: "formatMessages",
          refs,
          messages,
          options,
          callback: (err, res) => err ? reject(err) : resolve2(res)
        })),
        analyzeMetafile: (metafile, options) => new Promise((resolve2, reject) => service.analyzeMetafile({
          callName: "analyzeMetafile",
          refs,
          metafile: typeof metafile === "string" ? metafile : JSON.stringify(metafile),
          options,
          callback: (err, res) => err ? reject(err) : resolve2(res)
        }))
      };
      return longLivedService;
    };
    var runServiceSync = (callback) => {
      let [command, args] = esbuildCommandAndArgs();
      let stdin = new Uint8Array();
      let { readFromStdout, afterClose, service } = createChannel({
        writeToStdin(bytes) {
          if (stdin.length !== 0) throw new Error("Must run at most one command");
          stdin = bytes;
        },
        isSync: true,
        hasFS: true,
        esbuild: node_exports
      });
      callback(service);
      let stdout = child_process.execFileSync(command, args.concat(`--service=${"0.25.5"}`), {
        cwd: defaultWD,
        windowsHide: true,
        input: stdin,
        // We don't know how large the output could be. If it's too large, the
        // command will fail with ENOBUFS. Reserve 16mb for now since that feels
        // like it should be enough. Also allow overriding this with an environment
        // variable.
        maxBuffer: +process.env.ESBUILD_MAX_BUFFER || 16 * 1024 * 1024
      });
      readFromStdout(stdout);
      afterClose(null);
    };
    var randomFileName = () => {
      return path2.join(os2.tmpdir(), `esbuild-${crypto.randomBytes(32).toString("hex")}`);
    };
    var workerThreadService = null;
    var startWorkerThreadService = (worker_threads2) => {
      let { port1: mainPort, port2: workerPort } = new worker_threads2.MessageChannel();
      let worker = new worker_threads2.Worker(__filename, {
        workerData: { workerPort, defaultWD, esbuildVersion: "0.25.5" },
        transferList: [workerPort],
        // From node's documentation: https://nodejs.org/api/worker_threads.html
        //
        //   Take care when launching worker threads from preload scripts (scripts loaded
        //   and run using the `-r` command line flag). Unless the `execArgv` option is
        //   explicitly set, new Worker threads automatically inherit the command line flags
        //   from the running process and will preload the same preload scripts as the main
        //   thread. If the preload script unconditionally launches a worker thread, every
        //   thread spawned will spawn another until the application crashes.
        //
        execArgv: []
      });
      let nextID = 0;
      let fakeBuildError = (text) => {
        let error = new Error(`Build failed with 1 error:
error: ${text}`);
        let errors = [{ id: "", pluginName: "", text, location: null, notes: [], detail: void 0 }];
        error.errors = errors;
        error.warnings = [];
        return error;
      };
      let validateBuildSyncOptions = (options) => {
        if (!options) return;
        let plugins = options.plugins;
        if (plugins && plugins.length > 0) throw fakeBuildError(`Cannot use plugins in synchronous API calls`);
      };
      let applyProperties = (object, properties) => {
        for (let key in properties) {
          object[key] = properties[key];
        }
      };
      let runCallSync = (command, args) => {
        let id = nextID++;
        let sharedBuffer = new SharedArrayBuffer(8);
        let sharedBufferView = new Int32Array(sharedBuffer);
        let msg = { sharedBuffer, id, command, args };
        worker.postMessage(msg);
        let status = Atomics.wait(sharedBufferView, 0, 0);
        if (status !== "ok" && status !== "not-equal") throw new Error("Internal error: Atomics.wait() failed: " + status);
        let { message: { id: id2, resolve: resolve2, reject, properties } } = worker_threads2.receiveMessageOnPort(mainPort);
        if (id !== id2) throw new Error(`Internal error: Expected id ${id} but got id ${id2}`);
        if (reject) {
          applyProperties(reject, properties);
          throw reject;
        }
        return resolve2;
      };
      worker.unref();
      return {
        buildSync(options) {
          validateBuildSyncOptions(options);
          return runCallSync("build", [options]);
        },
        transformSync(input, options) {
          return runCallSync("transform", [input, options]);
        },
        formatMessagesSync(messages, options) {
          return runCallSync("formatMessages", [messages, options]);
        },
        analyzeMetafileSync(metafile, options) {
          return runCallSync("analyzeMetafile", [metafile, options]);
        },
        stop() {
          worker.terminate();
          workerThreadService = null;
        }
      };
    };
    var startSyncServiceWorker = () => {
      let workerPort = worker_threads.workerData.workerPort;
      let parentPort = worker_threads.parentPort;
      let extractProperties = (object) => {
        let properties = {};
        if (object && typeof object === "object") {
          for (let key in object) {
            properties[key] = object[key];
          }
        }
        return properties;
      };
      try {
        let service = ensureServiceIsRunning();
        defaultWD = worker_threads.workerData.defaultWD;
        parentPort.on("message", (msg) => {
          (async () => {
            let { sharedBuffer, id, command, args } = msg;
            let sharedBufferView = new Int32Array(sharedBuffer);
            try {
              switch (command) {
                case "build":
                  workerPort.postMessage({ id, resolve: await service.build(args[0]) });
                  break;
                case "transform":
                  workerPort.postMessage({ id, resolve: await service.transform(args[0], args[1]) });
                  break;
                case "formatMessages":
                  workerPort.postMessage({ id, resolve: await service.formatMessages(args[0], args[1]) });
                  break;
                case "analyzeMetafile":
                  workerPort.postMessage({ id, resolve: await service.analyzeMetafile(args[0], args[1]) });
                  break;
                default:
                  throw new Error(`Invalid command: ${command}`);
              }
            } catch (reject) {
              workerPort.postMessage({ id, reject, properties: extractProperties(reject) });
            }
            Atomics.add(sharedBufferView, 0, 1);
            Atomics.notify(sharedBufferView, 0, Infinity);
          })();
        });
      } catch (reject) {
        parentPort.on("message", (msg) => {
          let { sharedBuffer, id } = msg;
          let sharedBufferView = new Int32Array(sharedBuffer);
          workerPort.postMessage({ id, reject, properties: extractProperties(reject) });
          Atomics.add(sharedBufferView, 0, 1);
          Atomics.notify(sharedBufferView, 0, Infinity);
        });
      }
    };
    if (isInternalWorkerThread) {
      startSyncServiceWorker();
    }
    var node_default = node_exports;
  }
});

// src/build/functions/middleware/compiler.ts
var esbuild = __toESM(require_main(), 1);
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname, join } from "path";
import { getPolyfillsCode } from "./polyfills/index.js";
import { getCompatCode } from "./compat/index.js";
import { getEdgeOneWrapperCode } from "./wrapper.js";
function detectBuildType(code) {
  if (code.includes("webpackChunk_N_E")) {
    return "webpack";
  }
  if (code.includes("[turbopack]_runtime.js") || code.includes("R.c(") && code.includes("server/chunks/")) {
    return "turbopack";
  }
  if (code.includes("export function") || code.includes("export const") || code.includes("export async function") || /:\s*(string|number|boolean|any)\s*[=\)\{,]/.test(code)) {
    return "raw";
  }
  return "webpack";
}
async function transformSourceCode(code, filePath) {
  const absolutePath = resolve(filePath);
  const fileDir = dirname(absolutePath);
  const result = await esbuild.build({
    stdin: {
      contents: code,
      resolveDir: fileDir,
      // 用于解析相对路径 import
      sourcefile: absolutePath,
      loader: filePath.endsWith(".ts") || filePath.endsWith(".tsx") ? "ts" : "js"
    },
    bundle: true,
    // 打包所有依赖
    format: "iife",
    // 立即执行函数
    globalName: "__MIDDLEWARE_EXPORTS__",
    // 将导出暴露到全局变量
    target: "es2020",
    minify: false,
    keepNames: true,
    write: false,
    // 不写入文件，返回结果
    platform: "browser",
    // 边缘运行时类似浏览器环境
    // 外部化 Node.js 内置模块（我们会用 polyfill 处理）
    external: ["node:*"],
    // 定义全局变量
    define: {
      "process.env.NODE_ENV": '"production"'
    }
  });
  if (result.errors.length > 0) {
    throw new Error(`esbuild errors: ${result.errors.map((e) => e.text).join(", ")}`);
  }
  let transformed = result.outputFiles[0].text;
  transformed += `
// === Expose middleware exports to global scope ===
if (typeof __MIDDLEWARE_EXPORTS__ !== 'undefined') {
  if (typeof __MIDDLEWARE_EXPORTS__.middleware === 'function') {
    globalThis.middleware = __MIDDLEWARE_EXPORTS__.middleware;
  }
  if (typeof __MIDDLEWARE_EXPORTS__.default === 'function') {
    globalThis.middleware = __MIDDLEWARE_EXPORTS__.default;
  }
  if (typeof __MIDDLEWARE_EXPORTS__.config === 'object') {
    globalThis.config = __MIDDLEWARE_EXPORTS__.config;
  }
}
`;
  return transformed;
}
function detectMiddlewareEntry(code) {
  const bracketPattern = /_ENTRIES\s*\[\s*["']((?:middleware|proxy)[_\/a-zA-Z0-9]+)["']\s*\]/g;
  const bracketMatches = [...code.matchAll(bracketPattern)];
  for (const match of bracketMatches) {
    const entry = match[1];
    if (entry && /^(middleware|proxy)[_\/a-zA-Z0-9]+$/.test(entry)) {
      return entry;
    }
  }
  const dotPattern = /_ENTRIES\s*\)?\.((middleware|proxy)[_a-zA-Z0-9]+)\s*=/g;
  const dotMatches = [...code.matchAll(dotPattern)];
  for (const match of dotMatches) {
    const entry = match[1];
    if (entry && /^(middleware|proxy)[_a-zA-Z0-9]+$/.test(entry)) {
      return entry;
    }
  }
  const stringPattern = /["'](middleware_[a-zA-Z0-9_\/]+|proxy_[a-zA-Z0-9_\/]+)["']/g;
  const stringMatches = [...code.matchAll(stringPattern)];
  if (stringMatches.length > 0) {
    return stringMatches[0][1];
  }
  return "middleware_src/middleware";
}
function extractMiddlewareConfig(code) {
  const matcherPattern = /matcher\s*:\s*\[([^\]]+)\]/;
  const match = code.match(matcherPattern);
  if (match) {
    try {
      const matcherStr = match[1];
      const matchers = matcherStr.split(",").map((s) => s.trim().replace(/^["']|["']$/g, "")).filter((s) => s.length > 0);
      return { matcher: matchers };
    } catch {
    }
  }
  return {};
}
function transformRequires(code) {
  code = code.replace(/require\s*\(\s*["']node:buffer["']\s*\)/g, "nodeBuffer");
  code = code.replace(/require\s*\(\s*["']node:async_hooks["']\s*\)/g, "nodeAsyncHooks");
  code = code.replace(/require\s*\(\s*["']buffer["']\s*\)/g, "nodeBuffer");
  code = code.replace(/require\s*\(\s*["']async_hooks["']\s*\)/g, "nodeAsyncHooks");
  return code;
}
function fixEdgeOneCompatibility(code) {
  return code;
}
function transformForEdgeOneRuntime(code) {
  let transformed = code;
  let transformCount = 0;
  const requestSymbolPattern = /(?:let|var|const|,)\s*([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*Symbol\s*\(\s*["']internal request["']\s*\)/g;
  transformed = transformed.replace(requestSymbolPattern, (match, varName) => {
    transformCount++;
    const prefix = match.match(/^(let|var|const|,)\s*/)?.[1] || "let";
    return `${prefix} ${varName}="__edgeone_nextInternal"`;
  });
  const responseSymbolPattern = /(?:let|var|const|,)\s*([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*Symbol\s*\(\s*["']internal response["']\s*\)/g;
  transformed = transformed.replace(responseSymbolPattern, (match, varName) => {
    transformCount++;
    const prefix = match.match(/^(let|var|const|,)\s*/)?.[1] || "let";
    return `${prefix} ${varName}="__edgeone_nextResponseInternal"`;
  });
  const nextRequestSubclassPattern = /class\s+(\w+)\s+extends\s+(\w+)\s*\{\s*constructor\s*\(\s*(\w+)\s*\)\s*\{\s*super\s*\(\s*\3\.input\s*,\s*\3\.init\s*\)\s*,\s*this\.sourcePage\s*=\s*\3\.page\s*;?\s*\}/g;
  transformed = transformed.replace(nextRequestSubclassPattern, (_match, className, parentClass, paramName) => {
    transformCount++;
    const patchedConstructor = `class ${className} extends ${parentClass}{constructor(${paramName}){super(${paramName}.input,${paramName}.init),this.sourcePage=${paramName}.page;var __k="__edgeone_nextInternal",__self=this;if(this[__k]){Object.defineProperty(this,"nextUrl",{get:function(){return __self[__k]?__self[__k].nextUrl:undefined},enumerable:true,configurable:true});Object.defineProperty(this,"cookies",{get:function(){return __self[__k]?__self[__k].cookies:undefined},enumerable:true,configurable:true})}}`;
    return patchedConstructor;
  });
  const baseClassInternalAssignPattern = /this\[(\w+)\]\s*=\s*\{\s*cookies\s*:\s*new\s+([\w.]+)\.RequestCookies\s*\(\s*this\.headers\s*\)\s*,\s*nextUrl\s*:\s*(\w+)\s*,\s*url\s*:\s*\3\.toString\s*\(\s*\)\s*\}/g;
  transformed = transformed.replace(baseClassInternalAssignPattern, (match, internalVar, cookiesModule, nextUrlVar) => {
    transformCount++;
    const patchedAssignment = `Object.defineProperty(this,${internalVar},{value:{cookies:new ${cookiesModule}.RequestCookies(this.headers),nextUrl:${nextUrlVar},url:${nextUrlVar}.toString()},writable:true,enumerable:true,configurable:true});var __self=this;Object.defineProperty(this,"nextUrl",{get:function(){return __self[${internalVar}]?__self[${internalVar}].nextUrl:undefined},enumerable:true,configurable:true});Object.defineProperty(this,"cookies",{get:function(){return __self[${internalVar}]?__self[${internalVar}].cookies:undefined},enumerable:true,configurable:true})`;
    return patchedAssignment;
  });
  const baseClassInternalAssignPatternMultiline = /this\[(\w+)\]\s*=\s*\{\s*cookies\s*:\s*new\s+[\w.]+\.RequestCookies\s*\(\s*this\.headers\s*\)\s*,\s*geo\s*:\s*[^,]+,\s*ip\s*:\s*[^,]+,\s*nextUrl\s*,\s*url\s*:\s*[^}]+\}/g;
  transformed = transformed.replace(baseClassInternalAssignPatternMultiline, (match, internalVar) => {
    transformCount++;
    const objContent = match.replace(/^this\[\w+\]\s*=\s*/, "");
    const patchedAssignment = `Object.defineProperty(this,${internalVar},{value:${objContent},writable:true,enumerable:true,configurable:true});var __self=this;Object.defineProperty(this,"nextUrl",{get:function(){return __self[${internalVar}]?__self[${internalVar}].nextUrl:undefined},enumerable:true,configurable:true});Object.defineProperty(this,"cookies",{get:function(){return __self[${internalVar}]?__self[${internalVar}].cookies:undefined},enumerable:true,configurable:true});Object.defineProperty(this,"geo",{get:function(){return __self[${internalVar}]?__self[${internalVar}].geo:undefined},enumerable:true,configurable:true});Object.defineProperty(this,"ip",{get:function(){return __self[${internalVar}]?__self[${internalVar}].ip:undefined},enumerable:true,configurable:true})`;
    return patchedAssignment;
  });
  const responseInternalAssignPattern = /this\[(\w+)\]\s*=\s*\{\s*cookies\s*:\s*(\w+)\s*,\s*url\s*:\s*([^}]+)\}/g;
  if (transformed.includes("ResponseCookies")) {
    transformed = transformed.replace(responseInternalAssignPattern, (match, internalVar, _cookiesVar, _urlExpr) => {
      if (match.includes("Proxy") || match.includes("ResponseCookies")) {
        transformCount++;
        const patchedAssignment = match + `;var __respSelf=this;Object.defineProperty(this,"cookies",{get:function(){return __respSelf[${internalVar}]?__respSelf[${internalVar}].cookies:undefined},enumerable:true,configurable:true})`;
        return patchedAssignment;
      }
      return match;
    });
  }
  return transformed;
}
function fixWebpackConfigExport(code) {
  let transformed = code;
  let configVarName = null;
  let configValue = null;
  const exportPattern = /c\.d\s*\(\s*\w+\s*,\s*\{[^}]*config\s*:\s*\(\s*\)\s*=>\s*([a-zA-Z_$][a-zA-Z0-9_$]*)/s;
  const exportMatch = code.match(exportPattern);
  if (exportMatch) {
    configVarName = exportMatch[1];
  }
  if (configVarName) {
    const escapedVarName = configVarName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const defPattern = new RegExp(
      `(?:let|var|const|[;,])\\s*${escapedVarName}\\s*=\\s*\\{\\s*matcher\\s*:`
    );
    const defMatch = defPattern.exec(code);
    if (defMatch) {
      const matchStr = defMatch[0];
      const openBraceOffset = matchStr.indexOf("{");
      const assignStart = defMatch.index + openBraceOffset;
      let depth = 0;
      let endIdx = -1;
      for (let i = assignStart; i < code.length; i++) {
        if (code[i] === "{") {
          depth++;
        } else if (code[i] === "}") {
          depth--;
          if (depth === 0) {
            endIdx = i + 1;
            break;
          }
        }
      }
      if (endIdx !== -1) {
        configValue = code.slice(assignStart, endIdx);
      }
    }
  }
  if (!configVarName || !configValue) {
    const simplePatterns = [
      // 字符串 matcher（简单路径，不含特殊字符）
      /(?:let|var|const)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*\{\s*matcher\s*:\s*"([^"]+)"\s*\}/,
      // 压缩格式字符串
      /[;,]([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*\{\s*matcher\s*:\s*"([^"]+)"\s*\}/
    ];
    for (const pattern of simplePatterns) {
      const match = pattern.exec(code);
      if (match) {
        configVarName = match[1];
        configValue = `{matcher:"${match[2]}"}`;
        break;
      }
    }
  }
  if (configVarName && configValue) {
    const entriesPatterns = [
      // 带条件判断的格式: _ENTRIES)["middleware_src/middleware"]=b
      /(_ENTRIES\s*\)\s*\[\s*["'][^"']+["']\s*\]\s*=\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)(?=\s*[}\];,)])/g,
      // 简单方括号访问: _ENTRIES["middleware_src/middleware"]=b
      /(_ENTRIES\s*\[\s*["'][^"']+["']\s*\]\s*=\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)(?=\s*[}\];,)])/g,
      // 点号访问 (带括号): _ENTRIES).middleware_middleware=b
      /(_ENTRIES\s*\)?\.(?:middleware|proxy)[_a-zA-Z0-9]*\s*=\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)(?=\s*[}\];,)])/g
    ];
    for (const pattern of entriesPatterns) {
      transformed = transformed.replace(pattern, (match, prefix, varName) => {
        if (match.includes("config:")) {
          return match;
        }
        const replacement = `${prefix}Object.assign({},${varName},{config:${configValue}})`;
        return replacement;
      });
    }
  }
  return transformed;
}
async function compileTurbopack(inputPath, middlewareCode, options = {}) {
  const warnings = [];
  const errors = [];
  const middlewareDir = dirname(inputPath);
  const chunksDir = join(middlewareDir, "chunks");
  const chunkPattern = /R\.c\s*\(\s*["']([^"']+)["']\s*\)/g;
  const modulePattern = /R\.m\s*\(\s*(\d+)\s*\)/g;
  const chunkPaths = [];
  let match;
  while ((match = chunkPattern.exec(middlewareCode)) !== null) {
    chunkPaths.push(match[1]);
  }
  let entryModuleId = "";
  while ((match = modulePattern.exec(middlewareCode)) !== null) {
    entryModuleId = match[1];
  }
  const externalChunks = [];
  const middlewareChunks = [];
  const libraryChunks = [];
  for (const chunkPath of chunkPaths) {
    if (chunkPath.includes("[externals]")) {
      externalChunks.push(chunkPath);
    } else if (chunkPath.includes("[root-of-the-server]")) {
      middlewareChunks.push(chunkPath);
    } else {
      libraryChunks.push(chunkPath);
    }
  }
  const chunksCode = [];
  for (const chunkPath of externalChunks) {
    const relativePath = chunkPath.replace(/^server\//, "");
    const fullPath = join(middlewareDir, relativePath);
    if (existsSync(fullPath)) {
      let code = readFileSync(fullPath, "utf-8");
      code = transformForEdgeOneRuntime(code);
      chunksCode.push(code);
    } else {
      warnings.push(`External chunk not found: ${fullPath}`);
    }
  }
  for (const chunkPath of libraryChunks) {
    const relativePath = chunkPath.replace(/^server\//, "");
    const fullPath = join(middlewareDir, relativePath);
    if (existsSync(fullPath)) {
      let code = readFileSync(fullPath, "utf-8");
      code = transformForEdgeOneRuntime(code);
      chunksCode.push(code);
    } else {
      warnings.push(`Library chunk not found: ${fullPath}`);
    }
  }
  for (const chunkPath of middlewareChunks) {
    const relativePath = chunkPath.replace(/^server\//, "");
    const fullPath = join(middlewareDir, relativePath);
    if (existsSync(fullPath)) {
      let code = readFileSync(fullPath, "utf-8");
      code = transformForEdgeOneRuntime(code);
      chunksCode.push(code);
    } else {
      warnings.push(`Chunk not found: ${fullPath}`);
    }
  }
  if (chunksCode.length === 0) {
    errors.push("No middleware chunk found");
    return { code: "", warnings, errors };
  }
  const polyfillsCode = getPolyfillsCode();
  const turbopackCompatCode = getSimplifiedTurbopackCompat(entryModuleId);
  const outputCode = `
// ============================================================
// Next.js Middleware compiled for EdgeOne Pages
// Build type: Turbopack (Next.js 16+)
// Generated at: ${(/* @__PURE__ */ new Date()).toISOString()}
// ============================================================

${polyfillsCode}

${turbopackCompatCode}

// ============================================================
// Turbopack Middleware Chunks
// ============================================================

${chunksCode.map((code, i) => `
// --- Chunk ${i + 1} ---
${code}
`).join("\n")}
`;
  return {
    code: outputCode,
    warnings,
    errors
  };
}
function getSimplifiedTurbopackCompat(entryModuleId) {
  return `
// ============================================================
// Turbopack Runtime Compatibility Layer (\u57FA\u4E8E Next.js \u5B98\u65B9\u5B9E\u73B0)
// ============================================================

// Edge \u73AF\u5883\u4E2D require \u4E0D\u5B58\u5728\uFF0C\u9700\u8981 mock
if (typeof require === 'undefined') {
  globalThis.require = function(id) {
    throw new Error('require is not available in Edge environment: ' + id);
  };
  globalThis.require.resolve = function(id) { return id; };
}

const REEXPORTED_OBJECTS = new WeakMap();
const hasOwnProperty = Object.prototype.hasOwnProperty;
const toStringTag = typeof Symbol !== 'undefined' && Symbol.toStringTag;

// \u6A21\u5757\u5DE5\u5382\u548C\u7F13\u5B58
const moduleFactories = new Map();
const moduleCache = Object.create(null);

// \u8F85\u52A9\u51FD\u6570
function defineProp(obj, name, options) {
  if (!hasOwnProperty.call(obj, name)) Object.defineProperty(obj, name, options);
}

function createModuleObject(id) {
  return {
    exports: {},
    error: undefined,
    id,
    loaded: false,
    namespaceObject: undefined
  };
}

function getOverwrittenModule(id) {
  let module = moduleCache[id];
  if (!module) {
    module = createModuleObject(id);
    moduleCache[id] = module;
  }
  return module;
}

const BindingTag_Value = 0;

// esm() - \u6DFB\u52A0 getters \u5230 exports \u5BF9\u8C61
function esm(exports, bindings) {
  defineProp(exports, '__esModule', { value: true });
  if (toStringTag) defineProp(exports, toStringTag, { value: 'Module' });
  
  let i = 0;
  while (i < bindings.length) {
    const propName = bindings[i++];
    const tagOrFunction = bindings[i++];
    if (typeof tagOrFunction === 'number') {
      if (tagOrFunction === BindingTag_Value) {
        defineProp(exports, propName, {
          value: bindings[i++],
          enumerable: true,
          writable: false
        });
      }
    } else {
      const getterFn = tagOrFunction;
      if (typeof bindings[i] === 'function') {
        const setterFn = bindings[i++];
        defineProp(exports, propName, {
          get: getterFn,
          set: setterFn,
          enumerable: true
        });
      } else {
        defineProp(exports, propName, {
          get: getterFn,
          enumerable: true
        });
      }
    }
  }
  Object.seal(exports);
}

// interopEsm - \u5904\u7406 ESM/CJS \u4E92\u64CD\u4F5C
const getProto = Object.getPrototypeOf ? (obj) => Object.getPrototypeOf(obj) : (obj) => obj.__proto__;
const LEAF_PROTOTYPES = [null, getProto({}), getProto([]), getProto(getProto)];

function createGetter(obj, key) {
  return () => obj[key];
}

function createNS(raw) {
  if (typeof raw === 'function') {
    return function(...args) { return raw.apply(this, args); };
  } else {
    return Object.create(null);
  }
}

function interopEsm(raw, ns, allowExportDefault) {
  const bindings = [];
  let defaultLocation = -1;
  for (let current = raw; (typeof current === 'object' || typeof current === 'function') && !LEAF_PROTOTYPES.includes(current); current = getProto(current)) {
    for (const key of Object.getOwnPropertyNames(current)) {
      bindings.push(key, createGetter(raw, key));
      if (defaultLocation === -1 && key === 'default') {
        defaultLocation = bindings.length - 1;
      }
    }
  }
  if (!(allowExportDefault && defaultLocation >= 0)) {
    if (defaultLocation >= 0) {
      bindings.splice(defaultLocation, 1, BindingTag_Value, raw);
    } else {
      bindings.push('default', BindingTag_Value, raw);
    }
  }
  esm(ns, bindings);
  return ns;
}

// Context \u6784\u9020\u51FD\u6570
function Context(module, exports) {
  this.m = module;
  this.e = exports;
}

const contextPrototype = Context.prototype;

// e.c - \u6A21\u5757\u7F13\u5B58
contextPrototype.c = moduleCache;

// e.M - \u6A21\u5757\u5DE5\u5382
contextPrototype.M = moduleFactories;

// e.g - globalThis
contextPrototype.g = globalThis;

// e.s() - ESM export
contextPrototype.s = function esmExport(bindings, id) {
  let module, exports;
  if (id != null) {
    module = getOverwrittenModule(id);
    exports = module.exports;
  } else {
    module = this.m;
    exports = this.e;
  }
  module.namespaceObject = exports;
  esm(exports, bindings);
};

// e.j() - \u52A8\u6001\u5BFC\u51FA
function ensureDynamicExports(module, exports) {
  let reexportedObjects = REEXPORTED_OBJECTS.get(module);
  if (!reexportedObjects) {
    REEXPORTED_OBJECTS.set(module, reexportedObjects = []);
    module.exports = module.namespaceObject = new Proxy(exports, {
      get(target, prop) {
        if (hasOwnProperty.call(target, prop) || prop === 'default' || prop === '__esModule') {
          return Reflect.get(target, prop);
        }
        for (const obj of reexportedObjects) {
          const value = Reflect.get(obj, prop);
          if (value !== undefined) return value;
        }
        return undefined;
      },
      ownKeys(target) {
        const keys = Reflect.ownKeys(target);
        for (const obj of reexportedObjects) {
          for (const key of Reflect.ownKeys(obj)) {
            if (key !== 'default' && !keys.includes(key)) keys.push(key);
          }
        }
        return keys;
      }
    });
  }
  return reexportedObjects;
}

contextPrototype.j = function dynamicExport(object, id) {
  let module, exports;
  if (id != null) {
    module = getOverwrittenModule(id);
    exports = module.exports;
  } else {
    module = this.m;
    exports = this.e;
  }
  const reexportedObjects = ensureDynamicExports(module, exports);
  if (typeof object === 'object' && object !== null) {
    reexportedObjects.push(object);
  }
};

// e.v() - \u5BFC\u51FA\u503C
contextPrototype.v = function exportValue(value, id) {
  let module;
  if (id != null) {
    module = getOverwrittenModule(id);
  } else {
    module = this.m;
  }
  module.exports = value;
};

// e.n() - \u5BFC\u51FA\u547D\u540D\u7A7A\u95F4
contextPrototype.n = function exportNamespace(namespace, id) {
  let module;
  if (id != null) {
    module = getOverwrittenModule(id);
  } else {
    module = this.m;
  }
  module.exports = module.namespaceObject = namespace;
};

// e.i() - ESM import
contextPrototype.i = function esmImport(id) {
  const module = getOrInstantiateModuleFromParent(id, this.m);
  if (module.namespaceObject) return module.namespaceObject;
  const raw = module.exports;
  return module.namespaceObject = interopEsm(raw, createNS(raw), raw && raw.__esModule);
};

// e.r() - CommonJS require (\u5173\u952E\uFF01\u4E0D\u662F ESM \u6807\u8BB0)
contextPrototype.r = function commonJsRequire(id) {
  return getOrInstantiateModuleFromParent(id, this.m).exports;
};

// e.t() - runtime require
contextPrototype.t = typeof require === 'function' ? require : function() {
  throw new Error('Unexpected use of runtime require');
};

// e.z() - require stub
contextPrototype.z = function requireStub(_moduleId) {
  throw new Error('dynamic usage of require is not supported');
};

// e.x() - external require (Edge \u73AF\u5883 mock)
function externalRequire(id, thunk, esmFlag) {
  let raw;
  try {
    if (thunk) {
      raw = thunk();
    } else {
      raw = getExternalMock(id);
    }
  } catch (err) {
    raw = getExternalMock(id);
  }
  
  if (!esmFlag || (raw && raw.__esModule)) {
    return raw;
  }
  return interopEsm(raw, createNS(raw), true);
}
externalRequire.resolve = (id, options) => id;
contextPrototype.x = externalRequire;

// e.y() - external import (async)
contextPrototype.y = async function externalImport(id) {
  return getExternalMock(id);
};

// \u5916\u90E8\u6A21\u5757 mock
function getExternalMock(id) {
  // Work unit storage mock - \u8FD9\u4E9B\u662F Next.js \u5185\u90E8\u4F7F\u7528\u7684 AsyncLocalStorage
  // \u6CE8\u610F\uFF1A\u5FC5\u987B\u5728\u901A\u7528 async-storage \u4E4B\u524D\u5339\u914D
  if (id.includes('work-unit-async-storage') || id.includes('work-async-storage') || id.includes('workUnitAsyncStorage') || id.includes('workAsyncStorage')) {
    // \u521B\u5EFA AsyncLocalStorage mock
    const createAsyncLocalStorage = () => ({
      getStore: () => undefined,
      run: (store, fn, ...args) => {
        if (typeof fn === 'function') {
          return fn(...args);
        }
        return undefined;
      },
      enterWith: () => {},
      disable: () => {},
      exit: (fn) => fn ? fn() : undefined
    });
    
    const result = {
      workAsyncStorage: createAsyncLocalStorage(),
      workUnitAsyncStorage: createAsyncLocalStorage(),
      getStore: () => undefined,
      run: (store, fn, ...args) => {
        if (typeof fn === 'function') {
          return fn(...args);
        }
        return undefined;
      }
    };
    Object.defineProperty(result, '__esModule', { value: true });
    return result;
  }
  
  // after-task-async-storage mock
  if (id.includes('after-task-async-storage')) {
    const createAsyncLocalStorage = () => ({
      getStore: () => undefined,
      run: (store, fn, ...args) => {
        if (typeof fn === 'function') {
          return fn(...args);
        }
        return undefined;
      },
      enterWith: () => {},
      disable: () => {},
      exit: (fn) => fn ? fn() : undefined
    });
    
    const result = { 
      afterTaskAsyncStorage: createAsyncLocalStorage(),
      getStore: () => undefined,
      run: (store, fn, ...args) => {
        if (typeof fn === 'function') {
          return fn(...args);
        }
        return undefined;
      }
    };
    Object.defineProperty(result, '__esModule', { value: true });
    return result;
  }
  
  // AsyncLocalStorage mock (\u901A\u7528)
  if (id.includes('async_hooks') || id.includes('AsyncLocalStorage')) {
    const AsyncLocalStorageMock = function() {};
    AsyncLocalStorageMock.prototype.getStore = function() { return undefined; };
    AsyncLocalStorageMock.prototype.run = function(store, fn, ...args) { return typeof fn === 'function' ? fn(...args) : undefined; };
    AsyncLocalStorageMock.prototype.enterWith = function() {};
    AsyncLocalStorageMock.prototype.disable = function() {};
    AsyncLocalStorageMock.prototype.exit = function(fn) { return fn ? fn() : undefined; };
    const result = { AsyncLocalStorage: AsyncLocalStorageMock };
    Object.defineProperty(result, '__esModule', { value: true });
    return result;
  }
  
  // app-page-turbo.runtime.prod.js mock (\u5305\u542B vendored React)
  if (id.includes('app-page-turbo.runtime') || id.includes('app-page.runtime')) {
    // \u521B\u5EFA React mock
    const ReactMock = {
      createElement: function(type, props, ...children) { return { type, props, children }; },
      Fragment: Symbol.for('react.fragment'),
      useState: function(init) { return [init, function() {}]; },
      useEffect: function() {},
      useCallback: function(fn) { return fn; },
      useMemo: function(fn) { return fn(); },
      useRef: function(init) { return { current: init }; },
      useContext: function() { return undefined; },
      createContext: function(def) { return { Provider: function() {}, Consumer: function() {}, _currentValue: def }; },
      forwardRef: function(render) { return render; },
      memo: function(component) { return component; },
      lazy: function(factory) { return factory; },
      Suspense: function() {},
      Component: function() {},
      PureComponent: function() {},
      Children: { map: function(c, fn) { return Array.isArray(c) ? c.map(fn) : fn ? [fn(c)] : []; }, forEach: function() {}, count: function(c) { return Array.isArray(c) ? c.length : 1; }, only: function(c) { return c; }, toArray: function(c) { return Array.isArray(c) ? c : [c]; } },
      isValidElement: function() { return false; },
      cloneElement: function(el) { return el; },
      version: '18.0.0',
      __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: {}
    };
    
    // \u521B\u5EFA ReactDOM mock
    const ReactDOMMock = {
      render: function() {},
      hydrate: function() {},
      createRoot: function() { return { render: function() {}, unmount: function() {} }; },
      hydrateRoot: function() { return { render: function() {}, unmount: function() {} }; },
      flushSync: function(fn) { return fn(); },
      createPortal: function(children) { return children; },
      findDOMNode: function() { return null; },
      unmountComponentAtNode: function() { return false; }
    };
    
    // \u521B\u5EFA vendored \u7ED3\u6784
    const result = {
      vendored: {
        'react-rsc': {
          React: ReactMock,
          ReactDOM: ReactDOMMock,
          ReactJsxRuntime: {
            jsx: ReactMock.createElement,
            jsxs: ReactMock.createElement,
            Fragment: ReactMock.Fragment
          }
        },
        react: ReactMock,
        'react-dom': ReactDOMMock
      }
    };
    Object.defineProperty(result, '__esModule', { value: true });
    return result;
  }
  
  // shared-cache-controls mock - must be matched before the general incremental-cache mock
  // Next.js 16+ uses SharedCacheControls from this module in IncrementalCache constructor
  if (id.includes('shared-cache-controls')) {
    class SharedCacheControls {
      constructor(prerenderManifest) {
        this.prerenderManifest = prerenderManifest;
        this.controls = new Map();
      }
      get(key) { return this.controls.get(key); }
      set(key, value) { this.controls.set(key, value); }
    }
    const result = {
      SharedCacheControls,
      default: { SharedCacheControls }
    };
    Object.defineProperty(result, '__esModule', { value: true });
    return result;
  }

  // shared-revalidate-timings mock - similarly used by IncrementalCache in older versions
  if (id.includes('shared-revalidate-timings')) {
    class SharedRevalidateTimings {
      constructor(prerenderManifest) {
        this.prerenderManifest = prerenderManifest;
        this.timings = new Map();
      }
      get(key) { return this.timings.get(key); }
      set(key, value) { this.timings.set(key, value); }
    }
    const result = {
      SharedRevalidateTimings,
      default: { SharedRevalidateTimings }
    };
    Object.defineProperty(result, '__esModule', { value: true });
    return result;
  }

  // incremental-cache/tags-manifest mock
  if (id.includes('incremental-cache') || id.includes('tags-manifest')) {
    const result = {
      getTagsManifest: function() { return {}; },
      saveTagsManifest: function() {},
      default: {}
    };
    Object.defineProperty(result, '__esModule', { value: true });
    return result;
  }
  
  // path mock
  if (id === 'path') {
    return {
      join: (...args) => args.join('/').replace(/\\/\\/+/g, '/'),
      resolve: (...args) => args.join('/').replace(/\\/\\/+/g, '/'),
      dirname: (p) => p.split('/').slice(0, -1).join('/') || '/',
      basename: (p) => p.split('/').pop() || '',
      extname: (p) => { const m = p.match(/\\.[^.]+$/); return m ? m[0] : ''; },
      relative: (from, to) => to,
      sep: '/',
      default: null
    };
  }
  
  // os mock
  if (id === 'os') {
    return {
      platform: () => 'linux',
      homedir: () => '/home/user',
      tmpdir: () => '/tmp',
      default: null
    };
  }
  
  // fs mock
  if (id === 'fs') {
    return {
      existsSync: () => false,
      readFileSync: () => '',
      writeFileSync: () => {},
      mkdirSync: () => {},
      chmodSync: () => {},
      default: null
    };
  }
  
  // OpenTelemetry API mock - Next.js 16+ \u4F7F\u7528 OpenTelemetry \u8FDB\u884C\u8FFD\u8E2A
  if (id.includes('opentelemetry') || id.includes('@opentelemetry/api')) {
    // createContextKey - \u521B\u5EFA\u4E0A\u4E0B\u6587\u952E
    const createContextKey = (name) => Symbol.for(name);
    
    // ROOT_CONTEXT - \u6839\u4E0A\u4E0B\u6587
    class Context {
      constructor(parentContext) {
        this._currentContext = parentContext ? new Map(parentContext._currentContext) : new Map();
      }
      getValue(key) { return this._currentContext.get(key); }
      setValue(key, value) {
        const ctx = new Context(this);
        ctx._currentContext.set(key, value);
        return ctx;
      }
      deleteValue(key) {
        const ctx = new Context(this);
        ctx._currentContext.delete(key);
        return ctx;
      }
    }
    const ROOT_CONTEXT = new Context();
    
    // NoopContextManager - \u7A7A\u64CD\u4F5C\u4E0A\u4E0B\u6587\u7BA1\u7406\u5668
    class NoopContextManager {
      active() { return ROOT_CONTEXT; }
      with(context, fn, thisArg, ...args) { return fn.call(thisArg, ...args); }
      bind(context, target) { return target; }
      enable() { return this; }
      disable() { return this; }
    }
    
    // NoopSpan - \u7A7A\u64CD\u4F5C Span
    class NoopSpan {
      constructor() {}
      spanContext() { return { traceId: '', spanId: '', traceFlags: 0 }; }
      setAttribute() { return this; }
      setAttributes() { return this; }
      addEvent() { return this; }
      setStatus() { return this; }
      updateName() { return this; }
      end() {}
      isRecording() { return false; }
      recordException() {}
    }
    
    // NoopTracer - \u7A7A\u64CD\u4F5C\u8FFD\u8E2A\u5668
    class NoopTracer {
      startSpan() { return new NoopSpan(); }
      startActiveSpan(name, ...args) {
        const span = new NoopSpan();
        const fn = args[args.length - 1];
        if (typeof fn === 'function') {
          return fn(span);
        }
        return span;
      }
    }
    
    // NoopTracerProvider - \u7A7A\u64CD\u4F5C\u8FFD\u8E2A\u5668\u63D0\u4F9B\u8005
    class NoopTracerProvider {
      getTracer() { return new NoopTracer(); }
    }
    
    // NoopMeter - \u7A7A\u64CD\u4F5C\u8BA1\u91CF\u5668
    class NoopMeter {
      createCounter() { return { add: () => {} }; }
      createHistogram() { return { record: () => {} }; }
      createUpDownCounter() { return { add: () => {} }; }
      createObservableGauge() { return { addCallback: () => {} }; }
      createObservableCounter() { return { addCallback: () => {} }; }
      createObservableUpDownCounter() { return { addCallback: () => {} }; }
    }
    
    // NoopMeterProvider - \u7A7A\u64CD\u4F5C\u8BA1\u91CF\u5668\u63D0\u4F9B\u8005
    class NoopMeterProvider {
      getMeter() { return new NoopMeter(); }
    }
    
    // DiagLogLevel \u679A\u4E3E
    const DiagLogLevel = {
      NONE: 0,
      ERROR: 30,
      WARN: 50,
      INFO: 60,
      DEBUG: 70,
      VERBOSE: 80,
      ALL: 9999
    };
    
    // DiagConsoleLogger - \u63A7\u5236\u53F0\u8BCA\u65AD\u65E5\u5FD7\u8BB0\u5F55\u5668
    class DiagConsoleLogger {
      error(...args) { console.error('[OTel]', ...args); }
      warn(...args) { console.warn('[OTel]', ...args); }
      info(...args) { console.info('[OTel]', ...args); }
      debug(...args) { console.debug('[OTel]', ...args); }
      verbose(...args) { console.log('[OTel]', ...args); }
    }
    
    // API \u5355\u4F8B
    const contextAPI = {
      active: () => ROOT_CONTEXT,
      with: (ctx, fn, thisArg, ...args) => fn.call(thisArg, ...args),
      bind: (ctx, target) => target,
      setGlobalContextManager: () => true,
      disable: () => {}
    };
    
    const traceAPI = {
      getTracer: () => new NoopTracer(),
      getTracerProvider: () => new NoopTracerProvider(),
      setGlobalTracerProvider: () => new NoopTracerProvider(),
      getSpan: () => undefined,
      getActiveSpan: () => undefined,
      getSpanContext: () => undefined,  // \u83B7\u53D6 span \u4E0A\u4E0B\u6587
      setSpan: (ctx) => ctx,
      setSpanContext: (ctx) => ctx,  // \u8BBE\u7F6E span \u4E0A\u4E0B\u6587
      deleteSpan: (ctx) => ctx,
      isSpanContextValid: () => false,
      wrapSpanContext: (spanContext) => new NoopSpan()
    };
    
    const metricsAPI = {
      getMeter: () => new NoopMeter(),
      getMeterProvider: () => new NoopMeterProvider(),
      setGlobalMeterProvider: () => new NoopMeterProvider()
    };
    
    const propagationAPI = {
      inject: () => {},
      extract: (ctx) => ctx,
      fields: () => [],
      setGlobalPropagator: () => true,
      createBaggage: () => ({
        getEntry: () => undefined,
        getAllEntries: () => [],
        setEntry: () => ({}),
        removeEntry: () => ({}),
        clear: () => ({})
      }),
      getBaggage: () => undefined,
      setBaggage: (ctx) => ctx,
      deleteBaggage: (ctx) => ctx,
      getActiveBaggage: () => undefined
    };
    
    const diagAPI = {
      setLogger: () => {},
      disable: () => {},
      createComponentLogger: () => new DiagConsoleLogger(),
      verbose: () => {},
      debug: () => {},
      info: () => {},
      warn: () => {},
      error: () => {}
    };
    
    // \u5B8C\u6574\u7684 OpenTelemetry API mock
    const result = {
      // \u4E0A\u4E0B\u6587
      createContextKey,
      ROOT_CONTEXT,
      Context,
      context: contextAPI,
      ContextAPI: { getInstance: () => contextAPI },
      NoopContextManager,
      
      // \u8FFD\u8E2A
      trace: traceAPI,
      TraceAPI: { getInstance: () => traceAPI },
      SpanKind: { INTERNAL: 0, SERVER: 1, CLIENT: 2, PRODUCER: 3, CONSUMER: 4 },
      SpanStatusCode: { UNSET: 0, OK: 1, ERROR: 2 },
      TraceFlags: { NONE: 0, SAMPLED: 1 },
      isSpanContextValid: () => false,
      isValidTraceId: () => false,
      isValidSpanId: () => false,
      INVALID_SPANID: '',
      INVALID_TRACEID: '',
      INVALID_SPAN_CONTEXT: { traceId: '', spanId: '', traceFlags: 0 },
      NoopTracer,
      NoopTracerProvider,
      NoopSpan,
      
      // \u8BA1\u91CF
      metrics: metricsAPI,
      MetricsAPI: { getInstance: () => metricsAPI },
      ValueType: { INT: 0, DOUBLE: 1 },
      NoopMeter,
      NoopMeterProvider,
      
      // \u4F20\u64AD
      propagation: propagationAPI,
      PropagationAPI: { getInstance: () => propagationAPI },
      
      // \u8BCA\u65AD
      diag: diagAPI,
      DiagAPI: { getInstance: () => diagAPI },
      DiagLogLevel,
      DiagConsoleLogger,
      
      // Baggage
      baggageEntryMetadataFromString: () => ({ toString: () => '' }),
      createBaggage: () => ({
        getEntry: () => undefined,
        getAllEntries: () => [],
        setEntry: () => ({}),
        removeEntry: () => ({}),
        clear: () => ({})
      }),
      
      // \u9ED8\u8BA4\u5BFC\u51FA
      default: {
        context: contextAPI,
        trace: traceAPI,
        metrics: metricsAPI,
        propagation: propagationAPI,
        diag: diagAPI
      }
    };
    Object.defineProperty(result, '__esModule', { value: true });
    return result;
  }
  
  // \u901A\u7528 mock
  const result = {};
  Object.defineProperty(result, '__esModule', { value: true });
  return result;
}

// e.A() - async loader
contextPrototype.A = function asyncLoader(moduleId) {
  const loader = this.r(moduleId);
  return loader(contextPrototype.i.bind(this));
};

// e.l() - load chunk async
contextPrototype.l = function loadChunkAsync(chunkData) {
  return Promise.resolve(undefined);
};

// e.L() - load chunk by URL
contextPrototype.L = function loadChunkAsyncByUrl(chunkUrl) {
  return Promise.resolve(undefined);
};

// e.f() - module context
contextPrototype.f = function moduleContext(map) {
  function ctx(id) {
    if (hasOwnProperty.call(map, id)) {
      return map[id].module();
    }
    const e = new Error("Cannot find module '" + id + "'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
  }
  ctx.keys = () => Object.keys(map);
  ctx.resolve = (id) => {
    if (hasOwnProperty.call(map, id)) return map[id].id();
    const e = new Error("Cannot find module '" + id + "'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
  };
  ctx.import = async (id) => await ctx(id);
  return ctx;
};

// e.P() - resolve absolute path
contextPrototype.P = function resolveAbsolutePath(modulePath) {
  return modulePath || '/';
};

// e.R() - resolve path from module
contextPrototype.R = function resolvePathFromModule(moduleId) {
  const exported = this.r(moduleId);
  return exported?.default ?? exported;
};

// e.U() - relative URL
const relativeURL = function relativeURL(inputUrl) {
  const realUrl = new URL(inputUrl, 'x:/');
  const values = {};
  for (const key in realUrl) values[key] = realUrl[key];
  values.href = inputUrl;
  values.pathname = inputUrl.replace(/[?#].*/, '');
  values.origin = values.protocol = '';
  values.toString = values.toJSON = () => inputUrl;
  for (const key in values) Object.defineProperty(this, key, {
    enumerable: true,
    configurable: true,
    value: values[key]
  });
};
relativeURL.prototype = URL.prototype;
contextPrototype.U = relativeURL;

// e.w() - load WebAssembly
contextPrototype.w = function loadWebAssembly() {
  throw new Error('WebAssembly loading not supported in Edge environment');
};

// e.u() - load WebAssembly module
contextPrototype.u = function loadWebAssemblyModule() {
  throw new Error('WebAssembly module loading not supported in Edge environment');
};

// e.a() - async module (\u7B80\u5316\u7248)
const turbopackQueues = Symbol('turbopack queues');
const turbopackExports = Symbol('turbopack exports');
const turbopackError = Symbol('turbopack error');

function resolveQueue(queue) {
  if (queue && queue.status !== 1) {
    queue.status = 1;
    queue.forEach((fn) => fn.queueCount--);
    queue.forEach((fn) => fn.queueCount-- ? fn.queueCount++ : fn());
  }
}

function createPromise() {
  let resolve, reject;
  const promise = new Promise((res, rej) => {
    reject = rej;
    resolve = res;
  });
  return { promise, resolve, reject };
}

function isPromise(maybePromise) {
  return maybePromise != null && typeof maybePromise === 'object' && 'then' in maybePromise && typeof maybePromise.then === 'function';
}

function isAsyncModuleExt(obj) {
  return turbopackQueues in obj;
}

function wrapDeps(deps) {
  return deps.map((dep) => {
    if (dep !== null && typeof dep === 'object') {
      if (isAsyncModuleExt(dep)) return dep;
      if (isPromise(dep)) {
        const queue = Object.assign([], { status: 0 });
        const obj = {
          [turbopackExports]: {},
          [turbopackQueues]: (fn) => fn(queue)
        };
        dep.then((res) => {
          obj[turbopackExports] = res;
          resolveQueue(queue);
        }, (err) => {
          obj[turbopackError] = err;
          resolveQueue(queue);
        });
        return obj;
      }
    }
    return {
      [turbopackExports]: dep,
      [turbopackQueues]: () => {}
    };
  });
}

contextPrototype.a = function asyncModule(body, hasAwait) {
  const module = this.m;
  const queue = hasAwait ? Object.assign([], { status: -1 }) : undefined;
  const depQueues = new Set();
  const { resolve, reject, promise: rawPromise } = createPromise();
  const promise = Object.assign(rawPromise, {
    [turbopackExports]: module.exports,
    [turbopackQueues]: (fn) => {
      queue && fn(queue);
      depQueues.forEach(fn);
      promise['catch'](() => {});
    }
  });
  const attributes = {
    get() { return promise; },
    set(v) {
      if (v !== promise) {
        promise[turbopackExports] = v;
      }
    }
  };
  Object.defineProperty(module, 'exports', attributes);
  Object.defineProperty(module, 'namespaceObject', attributes);
  
  function handleAsyncDependencies(deps) {
    const currentDeps = wrapDeps(deps);
    const getResult = () => currentDeps.map((d) => {
      if (d[turbopackError]) throw d[turbopackError];
      return d[turbopackExports];
    });
    const { promise, resolve } = createPromise();
    const fn = Object.assign(() => resolve(getResult), { queueCount: 0 });
    function fnQueue(q) {
      if (q !== queue && !depQueues.has(q)) {
        depQueues.add(q);
        if (q && q.status === 0) {
          fn.queueCount++;
          q.push(fn);
        }
      }
    }
    currentDeps.map((dep) => dep[turbopackQueues](fnQueue));
    return fn.queueCount ? promise : getResult();
  }
  
  function asyncResult(err) {
    if (err) {
      reject(promise[turbopackError] = err);
    } else {
      resolve(promise[turbopackExports]);
    }
    resolveQueue(queue);
  }
  
  body(handleAsyncDependencies, asyncResult);
  if (queue && queue.status === -1) {
    queue.status = 0;
  }
};

// ============================================================
// \u6A21\u5757\u5B9E\u4F8B\u5316
// ============================================================

function instantiateModule(id, sourceType, sourceData) {
  const moduleFactory = moduleFactories.get(id);
  if (typeof moduleFactory !== 'function') {
    let reason = sourceType === 0 
      ? 'as a runtime entry of chunk ' + sourceData
      : 'because it was required from module ' + sourceData;
    throw new Error('Module ' + id + ' was instantiated ' + reason + ', but the module factory is not available. Available: ' + Array.from(moduleFactories.keys()).join(', '));
  }
  
  const module = createModuleObject(id);
  const exports = module.exports;
  moduleCache[id] = module;
  
  const context = new Context(module, exports);
  
  try {
    moduleFactory(context, module, exports);
  } catch (error) {
    module.error = error;
    throw error;
  }
  
  module.loaded = true;
  if (module.namespaceObject && module.exports !== module.namespaceObject) {
    interopEsm(module.exports, module.namespaceObject);
  }
  
  return module;
}

function getOrInstantiateModuleFromParent(id, sourceModule) {
  const module = moduleCache[id];
  if (module) {
    if (module.error) {
      throw module.error;
    }
    return module;
  }
  return instantiateModule(id, 1, sourceModule.id);
}

function getOrInstantiateRuntimeModule(chunkPath, moduleId) {
  const module = moduleCache[moduleId];
  if (module) {
    if (module.error) {
      throw module.error;
    }
    return module;
  }
  return instantiateModule(moduleId, 0, chunkPath);
}

// ============================================================
// Chunk \u52A0\u8F7D
// ============================================================

// \u5B89\u88C5\u538B\u7F29\u683C\u5F0F\u7684\u6A21\u5757\u5DE5\u5382
// Chunk \u683C\u5F0F: [moduleId1, factory1, moduleId2, factory2, ...]
function installCompressedModuleFactories(chunkModules, offset) {
  let i = offset || 0;
  while (i < chunkModules.length) {
    let moduleId = chunkModules[i];
    let end = i + 1;
    // \u627E\u5230\u5DE5\u5382\u51FD\u6570
    while (end < chunkModules.length && typeof chunkModules[end] !== 'function') {
      end++;
    }
    if (end === chunkModules.length) {
      break;
    }
    if (!moduleFactories.has(moduleId)) {
      const moduleFactoryFn = chunkModules[end];
      for (; i < end; i++) {
        moduleId = chunkModules[i];
        moduleFactories.set(moduleId, moduleFactoryFn);
      }
    }
    i = end + 1;
  }
}

// \u5168\u5C40 _ENTRIES \u5BF9\u8C61
globalThis._ENTRIES = globalThis._ENTRIES || {};

// \u4E3A chunk \u6587\u4EF6\u521B\u5EFA module \u5BF9\u8C61
var module = (function() {
  let _exports = {};
  return {
    get exports() { return _exports; },
    set exports(value) {
      if (Array.isArray(value)) {
        installCompressedModuleFactories(value, 0);
      }
      _exports = value;
    }
  };
})();

// ============================================================
// Middleware \u8BF7\u6C42\u5904\u7406
// ============================================================

// \u5B58\u50A8 middleware \u51FD\u6570\u548C\u914D\u7F6E
let __middleware_fn__ = null;
let __middleware_config__ = null;

/**
 * \u68C0\u67E5 URL \u662F\u5426\u5339\u914D matcher \u89C4\u5219
 * Next.js matcher \u652F\u6301\u8DEF\u5F84\u6A21\u5F0F\u548C\u6B63\u5219\u8868\u8FBE\u5F0F
 */
function matchesPath(pathname, matcher) {
  if (!matcher) return true;
  
  const matchers = Array.isArray(matcher) ? matcher : [matcher];
  
  for (const pattern of matchers) {
    if (typeof pattern === 'string') {
      let regex;
      
      // \u68C0\u6D4B\u662F\u5426\u662F\u6B63\u5219\u8868\u8FBE\u5F0F\u683C\u5F0F
      const isRegexPattern = pattern.includes('(?') || pattern.includes('[^') || pattern.includes('.*') || pattern.endsWith('$');
      
      if (isRegexPattern) {
        try {
          regex = new RegExp('^' + pattern + '$');
        } catch (e) {
          console.warn('[Middleware] Invalid regex pattern:', pattern, e);
          continue;
        }
      } else {
        // \u8DEF\u5F84\u6A21\u5F0F\uFF0C\u9700\u8981\u8F6C\u6362\u4E3A\u6B63\u5219\u8868\u8FBE\u5F0F
        // Next.js middleware matcher \u4F7F\u7528\u7C7B\u4F3C path-to-regexp \u7684\u8BED\u6CD5:
        //   /dashboard/:path*  -> \u5339\u914D /dashboard \u548C /dashboard/xxx\uFF08\u96F6\u4E2A\u6216\u591A\u4E2A\u8DEF\u5F84\u6BB5\uFF09
        //   /api/:path         -> \u5339\u914D /api/xxx\uFF08\u4E00\u4E2A\u8DEF\u5F84\u6BB5\uFF09
        //   /api/:path+        -> \u5339\u914D /api/xxx/yyy\uFF08\u4E00\u4E2A\u6216\u591A\u4E2A\u8DEF\u5F84\u6BB5\uFF09
        let regexPattern = '';
        let ci = 0;
        const p = pattern;
        while (ci < p.length) {
          if (p[ci] === ':') {
            // \u89E3\u6790\u53C2\u6570\u540D
            ci++;
            while (ci < p.length && /[a-zA-Z0-9_]/.test(p[ci])) {
              ci++;
            }
            // \u68C0\u67E5\u4FEE\u9970\u7B26
            if (ci < p.length && p[ci] === '*') {
              // :param* -> \u96F6\u4E2A\u6216\u591A\u4E2A\u8DEF\u5F84\u6BB5\uFF0C\u524D\u9762\u7684 / \u4E5F\u53D8\u4E3A\u53EF\u9009
              if (regexPattern.endsWith('\\\\/')) {
                regexPattern = regexPattern.slice(0, -2);
              }
              regexPattern += '(?:\\\\/.*)?';
              ci++;
            } else if (ci < p.length && p[ci] === '+') {
              // :param+ -> \u4E00\u4E2A\u6216\u591A\u4E2A\u8DEF\u5F84\u6BB5
              regexPattern += '.+';
              ci++;
            } else {
              // :param -> \u5339\u914D\u4E00\u4E2A\u8DEF\u5F84\u6BB5
              regexPattern += '[^/]+';
            }
          } else if (p[ci] === '/') {
            regexPattern += '\\\\/';
            ci++;
          } else if (p[ci] === '*') {
            if (ci + 1 < p.length && p[ci + 1] === '*') {
              regexPattern += '.*';
              ci += 2;
            } else {
              regexPattern += '[^/]*';
              ci++;
            }
          } else {
            // \u8F6C\u4E49\u6B63\u5219\u7279\u6B8A\u5B57\u7B26
            const ch = p[ci];
            const specialChars = '.+?^$|(){}[]\\\\';
            if (specialChars.indexOf(ch) !== -1) {
              regexPattern += '\\\\' + ch;
            } else {
              regexPattern += ch;
            }
            ci++;
          }
        }
        
        regex = new RegExp('^' + regexPattern + '$');
      }
      
      if (regex.test(pathname)) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * \u8FD0\u884C\u4E2D\u95F4\u4EF6\u7684\u4E3B\u51FD\u6570
 * @param {Request} request - \u539F\u59CB\u8BF7\u6C42\u5BF9\u8C61
 * @returns {Promise<Response|null|{__rewrite: string}>} - \u4E2D\u95F4\u4EF6\u5904\u7406\u540E\u7684\u54CD\u5E94\uFF0Cnull \u8868\u793A\u4E0D\u5904\u7406
 */
async function executeMiddleware({request}) {
  try {
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    // \u5982\u679C\u8FD8\u6CA1\u6709\u52A0\u8F7D middleware\uFF0C\u5C1D\u8BD5\u52A0\u8F7D
    if (!__middleware_fn__) {
      // \u5C1D\u8BD5\u4ECE\u5165\u53E3\u6A21\u5757\u83B7\u53D6
      const entryModule = getOrInstantiateRuntimeModule('edge', ${entryModuleId || "86311"});
      
      if (entryModule && entryModule.exports) {
        // Turbopack \u5BFC\u51FA\u7684 default \u53EF\u80FD\u662F\u4E00\u4E2A\u5305\u88C5\u51FD\u6570
        let exportedFn = entryModule.exports.default || entryModule.exports.middleware || entryModule.exports.proxy;
        
        // \u83B7\u53D6 middleware \u914D\u7F6E\uFF08\u5305\u542B matcher\uFF09
        // \u6CE8\u610F\uFF1ATurbopack \u53EF\u80FD\u5C06 config \u5BFC\u51FA\u5230\u5165\u53E3\u6A21\u5757\uFF0C\u4E5F\u53EF\u80FD\u5BFC\u51FA\u5230\u5176\u4ED6\u6A21\u5757
        if (entryModule.exports.config) {
          __middleware_config__ = entryModule.exports.config;
        }
        
        // \u5982\u679C\u5BFC\u51FA\u7684\u662F\u4E00\u4E2A\u5BF9\u8C61\uFF0C\u5C1D\u8BD5\u83B7\u53D6\u5176\u4E2D\u7684 handler \u6216 default
        if (exportedFn && typeof exportedFn === 'object') {
          exportedFn = exportedFn.handler || exportedFn.default || exportedFn.middleware || exportedFn.proxy;
        }
        
        // \u5982\u679C\u662F\u51FD\u6570\uFF0C\u68C0\u67E5\u5B83\u662F\u5426\u662F middleware \u5305\u88C5\u5668
        if (typeof exportedFn === 'function') {
          __middleware_fn__ = exportedFn;
        }
      }
      
      // \u5982\u679C\u6CA1\u6709\u627E\u5230 config\uFF0C\u904D\u5386\u6240\u6709\u5DF2\u52A0\u8F7D\u7684\u6A21\u5757\u67E5\u627E
      // Turbopack \u6709\u65F6\u4F1A\u5C06 config \u5BFC\u51FA\u5230\u5355\u72EC\u7684\u6A21\u5757\u4E2D
      if (!__middleware_config__) {
        for (const [moduleId, mod] of Object.entries(moduleCache)) {
          if (mod && mod.exports && mod.exports.config && mod.exports.config.matcher) {
            __middleware_config__ = mod.exports.config;
            break;
          }
        }
      }
    }
    
    if (!__middleware_fn__ || typeof __middleware_fn__ !== 'function') {
      console.error('[Middleware] No middleware function found');
      return fetch(request);
    }
    
    // \u68C0\u67E5\u8DEF\u5F84\u662F\u5426\u5339\u914D matcher \u914D\u7F6E
    if (__middleware_config__ && __middleware_config__.matcher) {
      if (!matchesPath(pathname, __middleware_config__.matcher)) {
        // \u8DEF\u5F84\u4E0D\u5339\u914D\uFF0C\u8DF3\u8FC7\u4E2D\u95F4\u4EF6
        return null;
      }
    }
    
    // \u5C1D\u8BD5\u83B7\u53D6 NextRequest \u7C7B\uFF08\u4ECE\u5DF2\u52A0\u8F7D\u7684\u6A21\u5757\u4E2D\uFF09
    let NextRequestClass = null;
    let NextResponseClass = null;
    
    // \u67E5\u627E NextRequest \u548C NextResponse \u6A21\u5757
    for (const [moduleId, factory] of moduleFactories) {
      try {
        const mod = moduleCache[moduleId];
        if (mod && mod.exports) {
          if (mod.exports.NextRequest) {
            NextRequestClass = mod.exports.NextRequest;
          }
          if (mod.exports.NextResponse) {
            NextResponseClass = mod.exports.NextResponse;
          }
        }
      } catch (e) {}
    }
    
    // \u5982\u679C\u6CA1\u6709\u627E\u5230 NextRequest\uFF0C\u5C1D\u8BD5\u5B9E\u4F8B\u5316\u53EF\u80FD\u5305\u542B\u5B83\u7684\u6A21\u5757
    if (!NextRequestClass) {
      // \u6A21\u5757 49779 \u901A\u5E38\u662F next/server \u7684\u5165\u53E3
      try {
        const nextServerModule = getOrInstantiateRuntimeModule('edge', 49779);
        if (nextServerModule && nextServerModule.exports) {
          NextRequestClass = nextServerModule.exports.NextRequest;
          NextResponseClass = nextServerModule.exports.NextResponse;
        }
      } catch (e) {}
    }

    // \u4ECE EdgeOne request.eo \u83B7\u53D6 geo \u548C ip \u4FE1\u606F
    const eoData = request.eo || {};
    const eoGeo = eoData.geo || {};
    
    // \u5C06 EdgeOne geo \u683C\u5F0F\u8F6C\u6362\u4E3A Next.js geo \u683C\u5F0F
    // EdgeOne: { countryCodeAlpha2, regionCode, cityName, latitude, longitude, ... }
    // Next.js: { country, region, city, latitude, longitude }
    const nextGeo = {
      country: eoGeo.countryCodeAlpha2 || undefined,
      region: eoGeo.regionCode || undefined,
      city: eoGeo.cityName || undefined,
      latitude: eoGeo.latitude !== undefined ? String(eoGeo.latitude) : undefined,
      longitude: eoGeo.longitude !== undefined ? String(eoGeo.longitude) : undefined,
    };
    const clientIp = eoData.clientIp || request.headers.get('x-forwarded-for') || '';
    
    // \u6784\u9020\u8BF7\u6C42\u5BF9\u8C61
    let nextRequest;
    
    if (NextRequestClass) {
      try {
        // NextRequest \u6784\u9020\u51FD\u6570\u7B7E\u540D: new NextRequest(input, init?)
        // input \u53EF\u4EE5\u662F URL \u5B57\u7B26\u4E32\u6216 Request \u5BF9\u8C61
        nextRequest = new NextRequestClass(request, {
          nextConfig: {},
          geo: nextGeo,
          ip: clientIp
        });
      } catch (e) {
        nextRequest = null;
      }
    }
    
    // \u5982\u679C\u65E0\u6CD5\u521B\u5EFA NextRequest\uFF0C\u4F7F\u7528\u589E\u5F3A\u7684 Request
    if (!nextRequest) {
      nextRequest = new Request(request.url, {
        method: request.method,
        headers: request.headers,
        body: request.body,
      });
      
      // \u6DFB\u52A0 nextUrl (\u6A21\u62DF NextURL)
      const parsedUrl = new URL(request.url);
      nextRequest.nextUrl = {
        href: parsedUrl.href,
        origin: parsedUrl.origin,
        protocol: parsedUrl.protocol,
        host: parsedUrl.host,
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        pathname: parsedUrl.pathname,
        search: parsedUrl.search,
        searchParams: parsedUrl.searchParams,
        hash: parsedUrl.hash,
        toString: () => parsedUrl.href,
        clone: () => new URL(parsedUrl.href)
      };
      
      // \u6DFB\u52A0 cookies API
      nextRequest.cookies = {
        get: (name) => {
          const cookies = request.headers.get('cookie') || '';
          const match = cookies.match(new RegExp('(^|;\\\\s*)' + name + '=([^;]*)'));
          return match ? { name, value: decodeURIComponent(match[2]) } : undefined;
        },
        getAll: () => {
          const cookies = request.headers.get('cookie') || '';
          return cookies.split(';').filter(c => c.trim()).map(c => {
            const [name, ...rest] = c.trim().split('=');
            return { name, value: decodeURIComponent(rest.join('=')) };
          });
        },
        has: (name) => {
          const cookies = request.headers.get('cookie') || '';
          return cookies.includes(name + '=');
        },
        set: () => {},
        delete: () => {}
      };
      
      // \u6DFB\u52A0 geo \u548C ip\uFF08\u4F7F\u7528\u4ECE EdgeOne \u8F6C\u6362\u540E\u7684\u6570\u636E\uFF09
      nextRequest.geo = nextGeo;
      nextRequest.ip = clientIp;
    }
    
    // \u8BBE\u7F6E\u5168\u5C40 NextResponse\uFF08\u5982\u679C\u53EF\u7528\uFF09
    if (NextResponseClass) {
      globalThis.NextResponse = NextResponseClass;
    }
    
    // \u8C03\u7528 middleware
    // Turbopack \u7684 middleware \u5305\u88C5\u5668\u671F\u671B\u4E00\u4E2A\u7279\u6B8A\u7684\u53C2\u6570\u5BF9\u8C61
    
    // \u6784\u9020 Turbopack \u671F\u671B\u7684\u8BF7\u6C42\u53C2\u6570
    // \u5173\u952E\uFF1ATurbopack \u7684 to \u51FD\u6570\u671F\u671B\uFF1A
    // 1. request.url \u662F\u53EF\u5199\u7684\uFF08\u4F1A\u6267\u884C t.request.url = t.request.url.replace(...)\uFF09
    // 2. request.headers \u662F\u666E\u901A\u5BF9\u8C61\uFF08\u4F1A\u6267\u884C Object.entries(t.request.headers)\uFF09
    // 3. request.nextConfig \u5B58\u5728\uFF08\u7528\u4E8E\u521B\u5EFA NextURL\uFF09
    
    // \u8C03\u7528 middleware
    // Turbopack \u7684 middleware \u5305\u88C5\u5668\u671F\u671B\u4E00\u4E2A\u7279\u6B8A\u7684\u53C2\u6570\u5BF9\u8C61
    
    // \u6784\u9020 Turbopack \u671F\u671B\u7684\u8BF7\u6C42\u53C2\u6570
    // \u5173\u952E\uFF1ATurbopack \u7684 to \u51FD\u6570\u671F\u671B\uFF1A
    // 1. request.url \u662F\u53EF\u5199\u7684\uFF08\u4F1A\u6267\u884C t.request.url = t.request.url.replace(...)\uFF09
    // 2. request.headers \u662F\u666E\u901A\u5BF9\u8C61\uFF08\u4F1A\u6267\u884C Object.entries(t.request.headers)\uFF09
    // 3. request.nextConfig \u5B58\u5728\uFF08\u7528\u4E8E\u521B\u5EFA NextURL\uFF09
    
    // \u5C06 Headers \u8F6C\u6362\u4E3A\u666E\u901A\u5BF9\u8C61
    // \u622A\u65AD\u8D85\u8FC7 4095 \u5B57\u8282\u7684 header \u503C\uFF08EdgeOne \u8FD0\u884C\u65F6\u9650\u5236\uFF09
    // \u4F8B\u5982 CDN \u6CE8\u5165\u7684 XX-Script-Ssl-Info (5331 bytes) \u4F1A\u5BFC\u81F4
    // Turbopack \u5185\u90E8 set x-middleware-request-* \u65F6\u8D85\u9650\u62A5\u9519
    const headersObj = {};
    request.headers.forEach((value, key) => {
      // \u622A\u65AD\u5230 4095 \u5B57\u8282\uFF0C\u907F\u514D\u4E22\u5931\u6574\u4E2A header
      headersObj[key] = value.length > 4095 ? value.substring(0, 4095) : value;
    });


    
    // \u6CE8\u5165 geo \u548C clientIp \u5230 headers \u4E2D
    // Next.js 15+ \u79FB\u9664\u4E86 request.geo \u548C request.ip\uFF0C\u7528\u6237\u9700\u8981\u4ECE headers \u4E2D\u8BFB\u53D6
    headersObj['geo'] = JSON.stringify(nextGeo);
    headersObj['clientIp'] = clientIp;
    
    // \u521B\u5EFA\u4E00\u4E2A\u53EF\u5199\u7684 request \u5305\u88C5\u5BF9\u8C61
    const requestWrapper = {
      url: request.url,
      method: request.method,
      headers: headersObj,  // \u5FC5\u987B\u662F\u666E\u901A\u5BF9\u8C61\uFF0Cto \u51FD\u6570\u4F1A\u7528 Object.entries() \u904D\u5386
      body: request.body,
      bodyUsed: request.bodyUsed,
      signal: request.signal,
      nextConfig: {},  // NextURL \u6784\u9020\u51FD\u6570\u9700\u8981\u8FD9\u4E2A
      geo: nextGeo,    // EdgeOne geo \u8F6C\u6362\u4E3A Next.js \u683C\u5F0F\uFF08\u517C\u5BB9 Next.js 14 \u53CA\u4EE5\u4E0B\uFF09
      ip: clientIp,    // \u5BA2\u6237\u7AEF IP\uFF08\u517C\u5BB9 Next.js 14 \u53CA\u4EE5\u4E0B\uFF09
      // \u4FDD\u6301\u539F\u59CB Request \u7684\u65B9\u6CD5\u53EF\u7528
      clone: () => request.clone(),
      arrayBuffer: () => request.arrayBuffer(),
      blob: () => request.blob(),
      formData: () => request.formData(),
      json: () => request.json(),
      text: () => request.text(),
    };
    
    const turbopackParams = {
      request: requestWrapper,
      page: '/',
      waitUntil: (promise) => {},
      bypassNextUrl: false
    };
    
    let result;
    try {
      result = await __middleware_fn__(turbopackParams);
    } catch (e) {
      console.error('[Middleware] Turbopack call failed:', e.message, e.stack);
      throw e;
    }

    // Turbopack \u6A21\u5F0F\u8FD4\u56DE\u7684\u662F { response: Response, waitUntil: {} } \u683C\u5F0F
    // \u9700\u8981\u63D0\u53D6\u5B9E\u9645\u7684 Response \u5BF9\u8C61
    let finalResponse = result;
    if (result && typeof result === 'object' && !(result instanceof Response)) {
      if (result.response && result.response instanceof Response) {
        finalResponse = result.response;
      } else if (result.cookies && typeof result.cookies === 'object') {
        // \u53E6\u4E00\u79CD\u53EF\u80FD\u7684\u683C\u5F0F\uFF1A{ cookies: {...}, ... }
        // \u5C1D\u8BD5\u4ECE response \u5C5E\u6027\u83B7\u53D6
        if (result.response) {
          finalResponse = result.response;
        }
      }
    }

    return finalResponse;
    
  } catch (error) {
    console.error('[Middleware Error]', error);
    return new Response(
      JSON.stringify({ error: 'Middleware execution failed', message: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}`;
}
async function compile(inputPath, options = {}) {
  const warnings = [];
  const errors = [];
  const absoluteInputPath = resolve(inputPath);
  if (!existsSync(absoluteInputPath)) {
    errors.push(`Input file not found: ${absoluteInputPath}`);
    return { code: "", warnings, errors };
  }
  let middlewareCode;
  try {
    middlewareCode = readFileSync(absoluteInputPath, "utf-8");
  } catch (err) {
    errors.push(`Failed to read input file: ${err}`);
    return { code: "", warnings, errors };
  }
  const buildType = detectBuildType(middlewareCode);
  if (buildType === "turbopack") {
    return compileTurbopack(absoluteInputPath, middlewareCode, options);
  }
  const isRawSource = buildType === "raw";
  if (isRawSource) {
    try {
      middlewareCode = await transformSourceCode(middlewareCode, absoluteInputPath);
    } catch (err) {
      errors.push(`Failed to transform source code: ${err}`);
      return { code: "", warnings, errors };
    }
  }
  const middlewareEntry = detectMiddlewareEntry(middlewareCode);
  const config = extractMiddlewareConfig(middlewareCode);
  middlewareCode = transformRequires(middlewareCode);
  middlewareCode = fixEdgeOneCompatibility(middlewareCode);
  middlewareCode = transformForEdgeOneRuntime(middlewareCode);
  middlewareCode = fixWebpackConfigExport(middlewareCode);
  const polyfillsCode = getPolyfillsCode();
  const compatCode = isRawSource ? "" : getCompatCode();
  const wrapperCode = getEdgeOneWrapperCode({
    middlewareEntry,
    debug: options.env?.DEBUG === "true",
    isRawSource
  });
  let envCode = "";
  if (options.env) {
    const envEntries = Object.entries(options.env).map(([key, value]) => `process.env[${JSON.stringify(key)}] = ${JSON.stringify(value)};`).join("\n");
    envCode = `
// === Environment Variables ===
${envEntries}
`;
  }
  const outputCode = `
// ============================================================
// Next.js Middleware compiled for EdgeOne Pages Edge Function
// Generated at: ${(/* @__PURE__ */ new Date()).toISOString()}
// ============================================================

${polyfillsCode}

${compatCode}

${envCode}

// ============================================================
// Original Next.js Middleware Code
// ============================================================

${middlewareCode}

${wrapperCode}
`;
  let finalCode = outputCode;
  if (options.minify) {
    warnings.push("Minification is not implemented yet, outputting unminified code");
  }
  return {
    code: finalCode,
    warnings,
    errors
  };
}
async function compileToFile(inputPath, outputPath, options = {}) {
  const result = await compile(inputPath, options);
  if (result.errors.length > 0) {
    return result;
  }
  try {
    writeFileSync(outputPath, result.code, "utf-8");
  } catch (err) {
    result.errors.push(`Failed to write output file: ${err}`);
  }
  return result;
}
var compiler_default = { compile, compileToFile };
export {
  compile,
  compileToFile,
  compiler_default as default
};
