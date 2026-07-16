
      var require = await (async () => {
        var { createRequire } = await import("node:module");
        return createRequire(import.meta.url);
      })();
    
import {
  __commonJS,
  __toESM
} from "../esm-chunks/chunk-6BT4RYQJ.js";

// node_modules/path-to-regexp/dist/index.js
var require_dist = __commonJS({
  "node_modules/path-to-regexp/dist/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.pathToRegexp = exports.tokensToRegexp = exports.regexpToFunction = exports.match = exports.tokensToFunction = exports.compile = exports.parse = void 0;
    function lexer(str) {
      var tokens = [];
      var i = 0;
      while (i < str.length) {
        var char = str[i];
        if (char === "*" || char === "+" || char === "?") {
          tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
          continue;
        }
        if (char === "\\") {
          tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
          continue;
        }
        if (char === "{") {
          tokens.push({ type: "OPEN", index: i, value: str[i++] });
          continue;
        }
        if (char === "}") {
          tokens.push({ type: "CLOSE", index: i, value: str[i++] });
          continue;
        }
        if (char === ":") {
          var name = "";
          var j = i + 1;
          while (j < str.length) {
            var code = str.charCodeAt(j);
            if (
              // `0-9`
              code >= 48 && code <= 57 || // `A-Z`
              code >= 65 && code <= 90 || // `a-z`
              code >= 97 && code <= 122 || // `_`
              code === 95
            ) {
              name += str[j++];
              continue;
            }
            break;
          }
          if (!name)
            throw new TypeError("Missing parameter name at ".concat(i));
          tokens.push({ type: "NAME", index: i, value: name });
          i = j;
          continue;
        }
        if (char === "(") {
          var count = 1;
          var pattern = "";
          var j = i + 1;
          if (str[j] === "?") {
            throw new TypeError('Pattern cannot start with "?" at '.concat(j));
          }
          while (j < str.length) {
            if (str[j] === "\\") {
              pattern += str[j++] + str[j++];
              continue;
            }
            if (str[j] === ")") {
              count--;
              if (count === 0) {
                j++;
                break;
              }
            } else if (str[j] === "(") {
              count++;
              if (str[j + 1] !== "?") {
                throw new TypeError("Capturing groups are not allowed at ".concat(j));
              }
            }
            pattern += str[j++];
          }
          if (count)
            throw new TypeError("Unbalanced pattern at ".concat(i));
          if (!pattern)
            throw new TypeError("Missing pattern at ".concat(i));
          tokens.push({ type: "PATTERN", index: i, value: pattern });
          i = j;
          continue;
        }
        tokens.push({ type: "CHAR", index: i, value: str[i++] });
      }
      tokens.push({ type: "END", index: i, value: "" });
      return tokens;
    }
    function parse(str, options) {
      if (options === void 0) {
        options = {};
      }
      var tokens = lexer(str);
      var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
      var result = [];
      var key = 0;
      var i = 0;
      var path = "";
      var tryConsume = function(type) {
        if (i < tokens.length && tokens[i].type === type)
          return tokens[i++].value;
      };
      var mustConsume = function(type) {
        var value2 = tryConsume(type);
        if (value2 !== void 0)
          return value2;
        var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
        throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
      };
      var consumeText = function() {
        var result2 = "";
        var value2;
        while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
          result2 += value2;
        }
        return result2;
      };
      var isSafe = function(value2) {
        for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
          var char2 = delimiter_1[_i];
          if (value2.indexOf(char2) > -1)
            return true;
        }
        return false;
      };
      var safePattern = function(prefix2) {
        var prev = result[result.length - 1];
        var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
        if (prev && !prevText) {
          throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
        }
        if (!prevText || isSafe(prevText))
          return "[^".concat(escapeString(delimiter), "]+?");
        return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
      };
      while (i < tokens.length) {
        var char = tryConsume("CHAR");
        var name = tryConsume("NAME");
        var pattern = tryConsume("PATTERN");
        if (name || pattern) {
          var prefix = char || "";
          if (prefixes.indexOf(prefix) === -1) {
            path += prefix;
            prefix = "";
          }
          if (path) {
            result.push(path);
            path = "";
          }
          result.push({
            name: name || key++,
            prefix,
            suffix: "",
            pattern: pattern || safePattern(prefix),
            modifier: tryConsume("MODIFIER") || ""
          });
          continue;
        }
        var value = char || tryConsume("ESCAPED_CHAR");
        if (value) {
          path += value;
          continue;
        }
        if (path) {
          result.push(path);
          path = "";
        }
        var open = tryConsume("OPEN");
        if (open) {
          var prefix = consumeText();
          var name_1 = tryConsume("NAME") || "";
          var pattern_1 = tryConsume("PATTERN") || "";
          var suffix = consumeText();
          mustConsume("CLOSE");
          result.push({
            name: name_1 || (pattern_1 ? key++ : ""),
            pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
            prefix,
            suffix,
            modifier: tryConsume("MODIFIER") || ""
          });
          continue;
        }
        mustConsume("END");
      }
      return result;
    }
    exports.parse = parse;
    function compile2(str, options) {
      return tokensToFunction(parse(str, options), options);
    }
    exports.compile = compile2;
    function tokensToFunction(tokens, options) {
      if (options === void 0) {
        options = {};
      }
      var reFlags = flags(options);
      var _a = options.encode, encode = _a === void 0 ? function(x) {
        return x;
      } : _a, _b = options.validate, validate = _b === void 0 ? true : _b;
      var matches = tokens.map(function(token) {
        if (typeof token === "object") {
          return new RegExp("^(?:".concat(token.pattern, ")$"), reFlags);
        }
      });
      return function(data) {
        var path = "";
        for (var i = 0; i < tokens.length; i++) {
          var token = tokens[i];
          if (typeof token === "string") {
            path += token;
            continue;
          }
          var value = data ? data[token.name] : void 0;
          var optional = token.modifier === "?" || token.modifier === "*";
          var repeat = token.modifier === "*" || token.modifier === "+";
          if (Array.isArray(value)) {
            if (!repeat) {
              throw new TypeError('Expected "'.concat(token.name, '" to not repeat, but got an array'));
            }
            if (value.length === 0) {
              if (optional)
                continue;
              throw new TypeError('Expected "'.concat(token.name, '" to not be empty'));
            }
            for (var j = 0; j < value.length; j++) {
              var segment = encode(value[j], token);
              if (validate && !matches[i].test(segment)) {
                throw new TypeError('Expected all "'.concat(token.name, '" to match "').concat(token.pattern, '", but got "').concat(segment, '"'));
              }
              path += token.prefix + segment + token.suffix;
            }
            continue;
          }
          if (typeof value === "string" || typeof value === "number") {
            var segment = encode(String(value), token);
            if (validate && !matches[i].test(segment)) {
              throw new TypeError('Expected "'.concat(token.name, '" to match "').concat(token.pattern, '", but got "').concat(segment, '"'));
            }
            path += token.prefix + segment + token.suffix;
            continue;
          }
          if (optional)
            continue;
          var typeOfMessage = repeat ? "an array" : "a string";
          throw new TypeError('Expected "'.concat(token.name, '" to be ').concat(typeOfMessage));
        }
        return path;
      };
    }
    exports.tokensToFunction = tokensToFunction;
    function match(str, options) {
      var keys = [];
      var re = pathToRegexp2(str, keys, options);
      return regexpToFunction(re, keys, options);
    }
    exports.match = match;
    function regexpToFunction(re, keys, options) {
      if (options === void 0) {
        options = {};
      }
      var _a = options.decode, decode = _a === void 0 ? function(x) {
        return x;
      } : _a;
      return function(pathname) {
        var m = re.exec(pathname);
        if (!m)
          return false;
        var path = m[0], index = m.index;
        var params = /* @__PURE__ */ Object.create(null);
        var _loop_1 = function(i2) {
          if (m[i2] === void 0)
            return "continue";
          var key = keys[i2 - 1];
          if (key.modifier === "*" || key.modifier === "+") {
            params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
              return decode(value, key);
            });
          } else {
            params[key.name] = decode(m[i2], key);
          }
        };
        for (var i = 1; i < m.length; i++) {
          _loop_1(i);
        }
        return { path, index, params };
      };
    }
    exports.regexpToFunction = regexpToFunction;
    function escapeString(str) {
      return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
    }
    function flags(options) {
      return options && options.sensitive ? "" : "i";
    }
    function regexpToRegexp(path, keys) {
      if (!keys)
        return path;
      var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
      var index = 0;
      var execResult = groupsRegex.exec(path.source);
      while (execResult) {
        keys.push({
          // Use parenthesized substring match if available, index otherwise
          name: execResult[1] || index++,
          prefix: "",
          suffix: "",
          modifier: "",
          pattern: ""
        });
        execResult = groupsRegex.exec(path.source);
      }
      return path;
    }
    function arrayToRegexp(paths, keys, options) {
      var parts = paths.map(function(path) {
        return pathToRegexp2(path, keys, options).source;
      });
      return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
    }
    function stringToRegexp(path, keys, options) {
      return tokensToRegexp(parse(path, options), keys, options);
    }
    function tokensToRegexp(tokens, keys, options) {
      if (options === void 0) {
        options = {};
      }
      var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
        return x;
      } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
      var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
      var delimiterRe = "[".concat(escapeString(delimiter), "]");
      var route = start ? "^" : "";
      for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
        var token = tokens_1[_i];
        if (typeof token === "string") {
          route += escapeString(encode(token));
        } else {
          var prefix = escapeString(encode(token.prefix));
          var suffix = escapeString(encode(token.suffix));
          if (token.pattern) {
            if (keys)
              keys.push(token);
            if (prefix || suffix) {
              if (token.modifier === "+" || token.modifier === "*") {
                var mod = token.modifier === "*" ? "?" : "";
                route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
              } else {
                route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
              }
            } else {
              if (token.modifier === "+" || token.modifier === "*") {
                throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
              }
              route += "(".concat(token.pattern, ")").concat(token.modifier);
            }
          } else {
            route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
          }
        }
      }
      if (end) {
        if (!strict)
          route += "".concat(delimiterRe, "?");
        route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
      } else {
        var endToken = tokens[tokens.length - 1];
        var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
        if (!strict) {
          route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
        }
        if (!isEndDelimited) {
          route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
        }
      }
      return new RegExp(route, flags(options));
    }
    exports.tokensToRegexp = tokensToRegexp;
    function pathToRegexp2(path, keys, options) {
      if (path instanceof RegExp)
        return regexpToRegexp(path, keys);
      if (Array.isArray(path))
        return arrayToRegexp(path, keys, options);
      return stringToRegexp(path, keys, options);
    }
    exports.pathToRegexp = pathToRegexp2;
  }
});

// src/build/route-utils.ts
var import_path_to_regexp = __toESM(require_dist(), 1);
import { parse as parseUrl, format as formatUrl } from "url";
var UN_NAMED_SEGMENT = "__UN_NAMED_SEGMENT__";
function sourceToRegex(source) {
  const keys = [];
  const r = (0, import_path_to_regexp.pathToRegexp)(source, keys, {
    strict: true,
    sensitive: true,
    delimiter: "/"
  });
  const segments = keys.map((k) => k.name).map((name) => {
    if (typeof name !== "string") {
      return UN_NAMED_SEGMENT;
    }
    return name;
  });
  return { src: r.source, segments };
}
var namedGroupsRegex = /\(\?<([a-zA-Z][a-zA-Z0-9_]*)>/g;
function normalizeHasKeys(hasItems = []) {
  for (const hasItem of hasItems) {
    if ("key" in hasItem && hasItem.type === "header") {
      hasItem.key = hasItem.key.toLowerCase();
    }
  }
  return hasItems;
}
function collectHasSegments(has) {
  const hasSegments = /* @__PURE__ */ new Set();
  for (const hasItem of has || []) {
    if (!hasItem.value && "key" in hasItem) {
      hasSegments.add(hasItem.key);
    }
    if (typeof hasItem.value === "string") {
      for (const match of hasItem.value.matchAll(namedGroupsRegex)) {
        if (match[1]) {
          hasSegments.add(match[1]);
        }
      }
      if (hasItem.type === "host") {
        hasSegments.add("host");
      }
    }
  }
  return [...hasSegments];
}
function toSegmentDest(index) {
  return "$" + (index + 1).toString();
}
var escapeSegment = (str, segmentName) => str.replace(
  new RegExp(`:${segmentName}`, "g"),
  `__ESC_COLON_${segmentName}`
);
var unescapeSegments = (str) => str.replace(/__ESC_COLON_/gi, ":");
function safelyCompile(value, indexes, attemptDirectCompile) {
  if (!value) {
    return value;
  }
  if (attemptDirectCompile) {
    try {
      return (0, import_path_to_regexp.compile)(value, { validate: false })(indexes);
    } catch (_) {
    }
  }
  for (const key of Object.keys(indexes)) {
    if (value.includes(`:${key}`)) {
      value = value.replace(
        new RegExp(`:${key}\\*`, "g"),
        `:${key}--ESCAPED_PARAM_ASTERISK`
      ).replace(
        new RegExp(`:${key}\\?`, "g"),
        `:${key}--ESCAPED_PARAM_QUESTION`
      ).replace(
        new RegExp(`:${key}\\+`, "g"),
        `:${key}--ESCAPED_PARAM_PLUS`
      ).replace(
        new RegExp(`:${key}(?!\\w)`, "g"),
        `--ESCAPED_PARAM_COLON${key}`
      );
    }
  }
  value = value.replace(/(:|\\*|\\?|\\+|\\(|\\)|\\{|\\})/g, "\\$1").replace(/--ESCAPED_PARAM_PLUS/g, "+").replace(/--ESCAPED_PARAM_COLON/g, ":").replace(/--ESCAPED_PARAM_QUESTION/g, "?").replace(/--ESCAPED_PARAM_ASTERISK/g, "*");
  return (0, import_path_to_regexp.compile)(`/${value}`, { validate: false })(indexes).slice(1);
}
function replaceSegments(segments, hasItemSegments, destination, isRedirect, internalParamNames) {
  const namedSegments = segments.filter((name) => name !== UN_NAMED_SEGMENT);
  const canNeedReplacing = destination.includes(":") && namedSegments.length > 0 || hasItemSegments.length > 0 || !isRedirect;
  if (!canNeedReplacing) {
    return destination;
  }
  let escapedDestination = destination;
  const indexes = {};
  segments.forEach((name, index) => {
    indexes[name] = toSegmentDest(index);
    escapedDestination = escapeSegment(escapedDestination, name);
  });
  hasItemSegments.forEach((name) => {
    indexes[name] = "$" + name;
    escapedDestination = escapeSegment(escapedDestination, name);
  });
  const parsedDestination = parseUrl(escapedDestination, true);
  delete parsedDestination.href;
  delete parsedDestination.path;
  delete parsedDestination.search;
  delete parsedDestination.host;
  let { pathname, hash, query, hostname, ...rest } = parsedDestination;
  pathname = unescapeSegments(pathname || "");
  hash = unescapeSegments(hash || "");
  hostname = unescapeSegments(hostname || "");
  let destParams = /* @__PURE__ */ new Set();
  const pathnameKeys = [];
  const hashKeys = [];
  const hostnameKeys = [];
  try {
    (0, import_path_to_regexp.pathToRegexp)(pathname, pathnameKeys);
    (0, import_path_to_regexp.pathToRegexp)(hash || "", hashKeys);
    (0, import_path_to_regexp.pathToRegexp)(hostname || "", hostnameKeys);
  } catch (_) {
  }
  destParams = new Set(
    [...pathnameKeys, ...hashKeys, ...hostnameKeys].map((key) => key.name).filter((val) => typeof val === "string")
  );
  pathname = safelyCompile(pathname, indexes, true);
  hash = hash ? safelyCompile(hash, indexes, true) : null;
  hostname = hostname ? safelyCompile(hostname, indexes, true) : null;
  for (const [key, strOrArray] of Object.entries(query)) {
    if (Array.isArray(strOrArray)) {
      query[key] = strOrArray.map(
        (str) => safelyCompile(unescapeSegments(str), indexes, true)
      );
    } else {
      query[key] = safelyCompile(
        unescapeSegments(strOrArray),
        indexes,
        true
      );
    }
  }
  const paramKeys = Object.keys(indexes);
  const needsQueryUpdating = !isRedirect && !paramKeys.some(
    (param) => !(internalParamNames && internalParamNames.includes(param)) && destParams.has(param)
  );
  if (needsQueryUpdating) {
    for (const param of paramKeys) {
      if (!(param in query) && param !== UN_NAMED_SEGMENT) {
        query[param] = indexes[param];
      }
    }
  }
  destination = formatUrl({
    ...rest,
    hostname,
    pathname,
    query,
    hash
  });
  return destination.replace(/%24/g, "$");
}
function convertRedirects(redirects, defaultStatus = 308) {
  return redirects.map((r) => {
    const { src, segments } = sourceToRegex(r.source);
    const hasSegments = collectHasSegments(r.has);
    normalizeHasKeys(r.has);
    normalizeHasKeys(r.missing);
    try {
      const loc = replaceSegments(segments, hasSegments, r.destination, true);
      let status;
      if (typeof r.permanent === "boolean") {
        status = r.permanent ? 308 : 307;
      } else if (r.statusCode) {
        status = r.statusCode;
      } else {
        status = defaultStatus;
      }
      const route = {
        src,
        headers: { Location: loc },
        status
      };
      if (r.has) {
        route.has = r.has;
      }
      if (r.missing) {
        route.missing = r.missing;
      }
      return route;
    } catch (e) {
      throw new Error(`Failed to parse redirect: ${JSON.stringify(r)}`);
    }
  });
}
function convertRewrites(rewrites, internalParamNames) {
  return rewrites.map((r) => {
    const { src, segments } = sourceToRegex(r.source);
    const hasSegments = collectHasSegments(r.has);
    normalizeHasKeys(r.has);
    normalizeHasKeys(r.missing);
    try {
      const dest = replaceSegments(
        segments,
        hasSegments,
        r.destination,
        false,
        internalParamNames
      );
      const route = { src, dest, check: true };
      if (r.has) {
        route.has = r.has;
      }
      if (r.missing) {
        route.missing = r.missing;
      }
      if (r.statusCode) {
        route.status = r.statusCode;
      }
      return route;
    } catch (e) {
      throw new Error(`Failed to parse rewrite: ${JSON.stringify(r)}`);
    }
  });
}
function convertHeaders(headers) {
  return headers.map((h) => {
    const obj = {};
    const { src, segments } = sourceToRegex(h.source);
    const hasSegments = collectHasSegments(h.has);
    normalizeHasKeys(h.has);
    normalizeHasKeys(h.missing);
    const namedSegments = segments.filter((name) => name !== UN_NAMED_SEGMENT);
    const indexes = {};
    segments.forEach((name, index) => {
      indexes[name] = toSegmentDest(index);
    });
    hasSegments.forEach((name) => {
      indexes[name] = "$" + name;
    });
    h.headers.forEach(({ key, value }) => {
      if (namedSegments.length > 0 || hasSegments.length > 0) {
        if (key.includes(":")) {
          key = safelyCompile(key, indexes);
        }
        if (value.includes(":")) {
          value = safelyCompile(value, indexes);
        }
      }
      obj[key] = value;
    });
    const route = {
      src,
      headers: obj,
      continue: true
    };
    if (h.has) {
      route.has = h.has;
    }
    if (h.missing) {
      route.missing = h.missing;
    }
    return route;
  });
}
function convertTrailingSlash(enable, status = 308) {
  const routes = [];
  if (enable) {
    routes.push({
      src: "^\\/\\.well-known(?:\\/.*)?$"
    });
    routes.push({
      src: "^/((?:[^/]+/)*[^/\\.]+)$",
      has: [{ type: "header", key: "x-nextjs-data" }],
      headers: { Location: "/$1/" },
      status
    });
    routes.push({
      src: "^/((?:[^/]+/)*[^/]+\\.\\w+)/$",
      headers: { Location: "/$1" },
      status
    });
  } else {
    routes.push({
      src: "^/(.*)\\/$",
      headers: { Location: "/$1" },
      status
    });
  }
  return routes;
}
export {
  collectHasSegments,
  convertHeaders,
  convertRedirects,
  convertRewrites,
  convertTrailingSlash,
  normalizeHasKeys,
  safelyCompile,
  sourceToRegex
};
