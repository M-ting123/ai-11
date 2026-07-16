
      var require = await (async () => {
        var { createRequire } = await import("node:module");
        return createRequire(import.meta.url);
      })();
    
import "../../../esm-chunks/chunk-6BT4RYQJ.js";

// src/build/functions/middleware/wrapper.ts
function getEdgeOneWrapperCode(options = {}) {
  const {
    middlewareEntry = "middleware_src/middleware",
    debug = false,
    isRawSource = false
  } = options;
  const isProxyFormat = middlewareEntry.includes("proxy");
  const functionName = isProxyFormat ? "proxy" : "middleware";
  if (isRawSource) {
    return `
// ============================================================
// Middleware Runner (Raw Source Mode)
// ============================================================

/**
 * \u5C06 EdgeOne geo \u683C\u5F0F\u8F6C\u6362\u4E3A Next.js geo \u683C\u5F0F
 * EdgeOne: { countryCodeAlpha2, regionCode, cityName, latitude, longitude, ... }
 * Next.js: { country, region, city, latitude, longitude }
 */
function convertEoGeoToNextGeo(eoGeo) {
  if (!eoGeo || typeof eoGeo !== 'object') {
    return {};
  }
  return {
    country: eoGeo.countryCodeAlpha2 || undefined,
    region: eoGeo.regionCode || undefined,
    city: eoGeo.cityName || undefined,
    latitude: eoGeo.latitude !== undefined ? String(eoGeo.latitude) : undefined,
    longitude: eoGeo.longitude !== undefined ? String(eoGeo.longitude) : undefined,
  };
}

/**
 * \u8FD0\u884C\u4E2D\u95F4\u4EF6\u7684\u4E3B\u51FD\u6570
 * @param {Request} request - \u539F\u59CB\u8BF7\u6C42\u5BF9\u8C61
 * @returns {Promise<any>} - middleware \u51FD\u6570\u7684\u539F\u59CB\u8FD4\u56DE\u503C
 */
async function executeMiddleware({request}) {
  // \u68C0\u67E5 middleware \u51FD\u6570\u662F\u5426\u5B58\u5728
  if (typeof middleware !== 'function') {
    throw new Error('middleware function not found');
  }

  // \u68C0\u67E5\u8DEF\u5F84\u5339\u914D\uFF08\u5982\u679C\u6709 config.matcher\uFF09
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  if (typeof config !== 'undefined' && config.matcher) {
    const matchers = Array.isArray(config.matcher) ? config.matcher : [config.matcher];
    
    let matched = false;
    for (const pattern of matchers) {
      if (typeof pattern === 'string') {
        if (pattern === pathname) {
          matched = true;
          break;
        }
        try {
          let regexPattern = pattern
            .replace(/\\./g, '\\\\.')
            .replace(/\\/:([^/]+)\\*/g, '(?:/.*)?')
            .replace(/\\/:([^/]+)/g, '/[^/]+')
            .replace(/\\/\\*\\*/g, '/.*')
            .replace(/\\/\\*/g, '/[^/]*')
            .replace(/^\\((.+)\\)$/, '$1');
          
          if (!regexPattern.startsWith('^')) {
            regexPattern = '^' + regexPattern;
          }
          if (!regexPattern.endsWith('$')) {
            regexPattern = regexPattern + '(?:/.*)?$';
          }
          
          if (new RegExp(regexPattern).test(pathname)) {
            matched = true;
            break;
          }
        } catch (e) {
          // Regex error, skip this pattern
        }
      }
    }
    
    if (!matched) {
      return null;
    }
  }

  // \u4ECE EdgeOne request.eo \u83B7\u53D6 geo \u548C ip \u4FE1\u606F
  const eoData = request.eo || {};
  const nextGeo = convertEoGeoToNextGeo(eoData.geo);
  const clientIp = eoData.clientIp || request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '';

  // \u521B\u5EFA\u65B0\u7684 Headers\uFF0C\u6CE8\u5165 geo \u548C clientIp
  // Next.js 15+ \u79FB\u9664\u4E86 request.geo \u548C request.ip\uFF0C\u7528\u6237\u9700\u8981\u4ECE headers \u4E2D\u8BFB\u53D6
  const newHeaders = new Headers(request.headers);
  newHeaders.set('geo', JSON.stringify(nextGeo));
  newHeaders.set('clientIp', clientIp);

  // \u521B\u5EFA\u5E26\u6709\u65B0 headers \u7684 request
  const newRequest = new Request(request.url, {
    method: request.method,
    headers: newHeaders,
    body: request.body,
  });

  // \u4E3A request \u6DFB\u52A0 nextUrl \u5C5E\u6027
  Object.defineProperty(newRequest, 'nextUrl', {
    value: {
      pathname: pathname,
      search: url.search,
      searchParams: url.searchParams,
      hash: url.hash,
      host: url.host,
      hostname: url.hostname,
      port: url.port,
      protocol: url.protocol,
      href: url.href,
      origin: url.origin,
      basePath: '',
      locale: '',
      defaultLocale: '',
      toString: () => url.href,
      clone: () => new URL(url.href)
    },
    writable: true,
    enumerable: true
  });

  // \u4E3A request \u6DFB\u52A0 cookies \u5C5E\u6027
  const cookieHeader = newRequest.headers.get('cookie') || '';
  const cookieMap = new Map();
  
  if (cookieHeader) {
    cookieHeader.split(';').forEach(cookie => {
      const [name, ...valueParts] = cookie.trim().split('=');
      if (name) {
        cookieMap.set(name.trim(), { 
          name: name.trim(), 
          value: valueParts.join('=') || '' 
        });
      }
    });
  }
  
  Object.defineProperty(newRequest, 'cookies', {
    value: {
      get: (name) => cookieMap.get(name),
      has: (name) => cookieMap.has(name),
      getAll: () => Array.from(cookieMap.values()),
      set: () => {},
      delete: () => {},
      clear: () => {},
      [Symbol.iterator]: () => cookieMap.values(),
      size: cookieMap.size
    },
    writable: true,
    enumerable: true
  });

  // \u8C03\u7528 middleware \u51FD\u6570
  const result = await middleware(newRequest);

  return result;
}
`;
  }
  return `
// ============================================================
// Middleware Runner (Webpack Bundle Mode)
// ============================================================

/**
 * \u4ECE _ENTRIES \u83B7\u53D6 ${functionName} \u51FD\u6570
 */
async function getMiddleware() {
  const entry = _ENTRIES['${middlewareEntry}'];
  ${debug ? "console.log('[getMiddleware] entry:', entry, 'type:', typeof entry);" : ""}
  
  if (!entry) {
    throw new Error('Entry not found: ${middlewareEntry}. Available entries: ' + Object.keys(_ENTRIES).join(', '));
  }
  
  let handler;
  
  if (entry.default !== undefined) {
    handler = entry.default;
  } else if (typeof entry === 'function') {
    handler = entry;
  } else if ('proxy' in entry) {
    handler = entry.proxy;
  } else if ('middleware' in entry) {
    handler = entry.middleware;
  } else {
    for (const key of Object.keys(entry)) {
      if (typeof entry[key] === 'function') {
        handler = entry[key];
        break;
      }
    }
  }
  
  if (handler && typeof handler.then === 'function') {
    handler = await handler;
  }
  
  if (typeof handler !== 'function') {
    throw new Error('Handler is not a function. Type: ' + typeof handler);
  }
  
  return handler;
}

/**
 * \u83B7\u53D6 middleware \u914D\u7F6E
 */
function getMiddlewareConfig() {
  const entry = _ENTRIES['${middlewareEntry}'];
  return entry?.config || {};
}

/**
 * \u68C0\u67E5 URL \u662F\u5426\u5339\u914D matcher \u89C4\u5219
 * 
 * Next.js matcher \u652F\u6301\u4E24\u79CD\u683C\u5F0F\uFF1A
 * 1. \u8DEF\u5F84\u6A21\u5F0F\uFF1A\u5982 /dashboard/:path*\uFF0C\u9700\u8981\u8F6C\u6362\u4E3A\u6B63\u5219
 * 2. \u6B63\u5219\u8868\u8FBE\u5F0F\uFF1A\u5982 /((?!api|_next/static).*)\uFF0C\u76F4\u63A5\u4F7F\u7528
 */
function matchesPath(pathname, matcher) {
  if (!matcher) return true;
  
  const matchers = Array.isArray(matcher) ? matcher : [matcher];
  
  for (const pattern of matchers) {
    if (typeof pattern === 'string') {
      let regex;
      
      // \u68C0\u6D4B\u662F\u5426\u662F\u6B63\u5219\u8868\u8FBE\u5F0F\u683C\u5F0F
      // \u6B63\u5219\u8868\u8FBE\u5F0F\u901A\u5E38\u5305\u542B (?! (?= (?:  \u7B49\u7279\u6B8A\u8BED\u6CD5
      // \u4F7F\u7528\u5B57\u7B26\u4E32\u65B9\u6CD5\u907F\u514D\u6B63\u5219\u8F6C\u4E49\u95EE\u9898
      const isRegexPattern = pattern.includes('(?') || pattern.includes('[^') || pattern.includes('.*') || pattern.endsWith('$');
      
      if (isRegexPattern) {
        // \u76F4\u63A5\u4F5C\u4E3A\u6B63\u5219\u8868\u8FBE\u5F0F\u4F7F\u7528
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
 * \u5C06 EdgeOne geo \u683C\u5F0F\u8F6C\u6362\u4E3A Next.js geo \u683C\u5F0F
 * EdgeOne: { countryCodeAlpha2, regionCode, cityName, latitude, longitude, ... }
 * Next.js: { country, region, city, latitude, longitude }
 */
function convertEoGeoToNextGeo(eoGeo) {
  if (!eoGeo || typeof eoGeo !== 'object') {
    return {};
  }
  return {
    country: eoGeo.countryCodeAlpha2 || undefined,
    region: eoGeo.regionCode || undefined,
    city: eoGeo.cityName || undefined,
    latitude: eoGeo.latitude !== undefined ? String(eoGeo.latitude) : undefined,
    longitude: eoGeo.longitude !== undefined ? String(eoGeo.longitude) : undefined,
  };
}

/**
 * \u8FD0\u884C\u4E2D\u95F4\u4EF6\u7684\u4E3B\u51FD\u6570
 * @param {Request} request - \u539F\u59CB\u8BF7\u6C42\u5BF9\u8C61
 * @returns {Promise<any>} - middleware \u51FD\u6570\u7684\u539F\u59CB\u8FD4\u56DE\u503C
 */
async function executeMiddleware({request}) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // \u83B7\u53D6 middleware \u914D\u7F6E\u5E76\u68C0\u67E5\u662F\u5426\u5339\u914D
  const config = getMiddlewareConfig();
  if (!matchesPath(pathname, config.matcher)) {
    return null;
  }

  // \u83B7\u53D6 middleware \u51FD\u6570
  const middlewareFn = await getMiddleware();
  
  // \u5C06\u539F\u59CB Headers \u8F6C\u6362\u4E3A\u666E\u901A\u5BF9\u8C61\u683C\u5F0F
  // Next.js adapter \u5185\u90E8\u7684 fromNodeOutgoingHttpHeaders \u671F\u671B\u5BF9\u8C61\u683C\u5F0F
  const headersObject = {};
  request.headers.forEach((value, key) => {
    headersObject[key] = value;
  });

  // \u4ECE EdgeOne request.eo \u83B7\u53D6 geo \u548C ip \u4FE1\u606F
  const eoData = request.eo || {};
  const nextGeo = convertEoGeoToNextGeo(eoData.geo);
  const clientIp = eoData.clientIp || request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '';
  
  // \u6CE8\u5165 geo \u548C clientIp \u5230 headers \u4E2D
  // Next.js 15+ \u79FB\u9664\u4E86 request.geo \u548C request.ip\uFF0C\u7528\u6237\u9700\u8981\u4ECE headers \u4E2D\u8BFB\u53D6
  // \u4F7F\u7528 'geo' (JSON \u5B57\u7B26\u4E32) \u548C 'clientIp' \u4F5C\u4E3A header \u540D\u79F0
  headersObject['geo'] = JSON.stringify(nextGeo);
  headersObject['clientIp'] = clientIp;
  
  // \u6784\u9020 Next.js middleware adapter \u671F\u671B\u7684\u53C2\u6570\u683C\u5F0F
  // \u53C2\u8003 Next.js \u6E90\u7801\u4E2D\u7684 adapter \u51FD\u6570
  const middlewareParams = {
    request: {
      url: request.url,
      method: request.method,
      headers: headersObject,
      body: request.body,
      nextConfig: {
        basePath: '',
        i18n: null,
        trailingSlash: false
      },
      geo: nextGeo,
      ip: clientIp,
      signal: request.signal || null
    },
    page: '/',
    // \u6DFB\u52A0 waitUntil \u65B9\u6CD5
    waitUntil: (promise) => {}
  };

  const result = await middlewareFn(middlewareParams);

  // Webpack \u6A21\u5F0F\u8FD4\u56DE\u7684\u662F { response: Response, waitUntil: {} } \u683C\u5F0F
  // \u9700\u8981\u63D0\u53D6\u5B9E\u9645\u7684 Response \u5BF9\u8C61
  let finalResponse = result;
  if (result && typeof result === 'object' && !(result instanceof Response)) {
    if (result.response && result.response instanceof Response) {
      finalResponse = result.response;
    }
  }

  return finalResponse;
}
`;
}
export {
  getEdgeOneWrapperCode
};
