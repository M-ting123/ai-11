
      let global = globalThis;
      globalThis.global = globalThis;

      if (typeof global.navigator === 'undefined') {
        global.navigator = {
          userAgent: 'edge-runtime',
          language: 'en-US',
          languages: ['en-US'],
        };
      } else {
        if (typeof global.navigator.language === 'undefined') {
          global.navigator.language = 'en-US';
        }
        if (!global.navigator.languages || global.navigator.languages.length === 0) {
          global.navigator.languages = [global.navigator.language];
        }
        if (typeof global.navigator.userAgent === 'undefined') {
          global.navigator.userAgent = 'edge-runtime';
        }
      }

      class MessageChannel {
        constructor() {
          this.port1 = new MessagePort();
          this.port2 = new MessagePort();
        }
      }
      class MessagePort {
        constructor() {
          this.onmessage = null;
        }
        postMessage(data) {
          if (this.onmessage) {
            setTimeout(() => this.onmessage({ data }), 0);
          }
        }
      }
      global.MessageChannel = MessageChannel;

      '__MIDDLEWARE_BUNDLE_CODE__'

      function recreateRequest(request, overrides = {}) {
        const cloned = typeof request.clone === 'function' ? request.clone() : request;
        const headers = new Headers(cloned.headers);

        if (overrides.headerPatches) {
          Object.keys(overrides.headerPatches).forEach((key) => {
            const value = overrides.headerPatches[key];
            if (value === null || typeof value === 'undefined') {
              headers.delete(key);
            } else {
              headers.set(key, value);
            }
          });
        }

        if (overrides.headers) {
          const extraHeaders = new Headers(overrides.headers);
          extraHeaders.forEach((value, key) => headers.set(key, value));
        }

        const url = overrides.url || cloned.url;
        const method = overrides.method || cloned.method || 'GET';
        const canHaveBody = method && method.toUpperCase() !== 'GET' && method.toUpperCase() !== 'HEAD';
        const body = overrides.body !== undefined ? overrides.body : canHaveBody ? cloned.body : undefined;

        // 如果rewrite传入的是完整URL（第三方地址），需要更新host
        if (overrides.url) {
          try {
            const newUrl = new URL(overrides.url, cloned.url);
            // 只有当新URL是绝对路径（包含协议和host）时才更新host
            if (overrides.url.startsWith('http://') || overrides.url.startsWith('https://')) {
              headers.set('host', newUrl.host);
            }
            // 相对路径时保持原有host不变
          } catch (e) {
            // URL解析失败时保持原有host
          }
        }

        const init = {
          method,
          headers,
          redirect: cloned.redirect,
          credentials: cloned.credentials,
          cache: cloned.cache,
          mode: cloned.mode,
          referrer: cloned.referrer,
          referrerPolicy: cloned.referrerPolicy,
          integrity: cloned.integrity,
          keepalive: cloned.keepalive,
          signal: cloned.signal,
        };

        if (canHaveBody && body !== undefined) {
          init.body = body;
        }

        if ('duplex' in cloned) {
          init.duplex = cloned.duplex;
        }

        return new Request(url, init);

      }

      
      async function executeMiddleware(context) {
        return null; // 没有中间件，继续执行后续函数
      }
    

      function usercode(ev, hookCtx) {
        hookCtx = hookCtx || { fetch: globalThis.fetch };
        const { fetch } = hookCtx;
        const globalthis = hookCtx;
        "use strict";
        // ↓ 用户原始代码
        return (async function handleRequest(context) {
          let routeParams = {};
          let pagesFunctionResponse = null;
          let request = context.request;
          const waitUntil = context.waitUntil;
          let urlInfo = new URL(request.url);
          const eo = request.eo || {};


          const normalizePathname = () => {
            if (urlInfo.pathname !== '/' && urlInfo.pathname.endsWith('/')) {
              urlInfo.pathname = urlInfo.pathname.slice(0, -1);
            }
          };

          function getSuffix(pathname = '') {
            // Use a regular expression to extract the file extension from the URL
            const suffix = pathname.match(/\.([^\.]+)$/);
            // If an extension is found, return it, otherwise return an empty string
            return suffix ? '.' + suffix[1] : null;
          }

          normalizePathname();

          let matchedFunc = false;

          
        const runEdgeFunctions = () => {
          
          if(!matchedFunc && '/api/ai-proxy' === urlInfo.pathname) {
            matchedFunc = true;
              (() => {
  // edge-functions/api/ai-proxy.js
  function jsonResponse(data, status = 200) {
    const body = JSON.stringify(data);
    return new Response(body, {
      status,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Encoding": "identity",
        "Cache-Control": "no-transform",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
  function errorResponse(code, message, status = 500) {
    return jsonResponse({ module: "error", error: { code, message } }, status);
  }
  async function callDeepSeek(apiKey, messages, temperature = 0.7) {
    const resp = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ model: "deepseek-chat", messages, temperature })
    });
    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`DeepSeek API \u8FD4\u56DE ${resp.status}: ${errText}`);
    }
    const data = await resp.json();
    return data.choices?.[0]?.message?.content ?? "";
  }
  async function handleWitnessChat(body, apiKey) {
    const { npc_data, question, dialogue_history, temperature } = body;
    const persona = npc_data?.persona || "";
    const knowledge = npc_data?.knowledge || {};
    const responseRules = npc_data?.response_rules || {};
    let systemPrompt = "\u4F60\u662F\u6CD5\u5EAD\u6E38\u620F\u4E2D\u7684NPC\u8BC1\u4EBA\uFF0C\u6B63\u5728\u63A5\u53D7\u5F8B\u5E08\u8BE2\u95EE\u3002\n\n";
    systemPrompt += `## \u4F60\u7684\u6027\u683C
${persona}

`;
    systemPrompt += "## \u4F60\u77E5\u9053\u7684\u4E8B\u5B9E\uFF08\u53EA\u80FD\u57FA\u4E8E\u8FD9\u4E9B\u56DE\u7B54\uFF09\n";
    for (const fact of knowledge.knows || []) {
      systemPrompt += `- ${fact}
`;
    }
    systemPrompt += '\n## \u4F60\u4E0D\u77E5\u9053\u7684\u4E8B\u5B9E\uFF08\u88AB\u95EE\u5230\u65F6\u56DE\u7B54"\u4E0D\u77E5\u9053"\u6216"\u4E0D\u8BB0\u5F97"\uFF09\n';
    for (const fact of knowledge.does_not_know || []) {
      systemPrompt += `- ${fact}
`;
    }
    systemPrompt += "\n## \u4F60\u7684\u8C0E\u8A00\uFF08\u5728\u672A\u51FA\u793A\u8BC1\u636E\u524D\u575A\u6301\u539F\u8BF4\u6CD5\uFF09\n";
    for (const lie of knowledge.lies_about || []) {
      systemPrompt += `- ${lie}
`;
    }
    systemPrompt += "\n## \u54CD\u5E94\u89C4\u5219\n";
    for (const [trigger, response] of Object.entries(responseRules)) {
      systemPrompt += `- ${trigger}\uFF1A${response}
`;
    }
    systemPrompt += "\n## \u91CD\u8981\u7EA6\u675F\n";
    systemPrompt += '1. \u7EDD\u4E0D\u634F\u9020\u4F60\u4E0D\u77E5\u9053\u7684\u4E8B\u5B9E\uFF0C\u8D85\u51FA\u77E5\u8BC6\u8FB9\u754C\u7EDF\u4E00\u56DE\u7B54"\u4E0D\u77E5\u9053"\u6216"\u4E0D\u8BB0\u5F97"\n';
    systemPrompt += "2. \u5728\u672A\u51FA\u793A\u8BC1\u636E\u524D\uFF0C\u575A\u6301\u4F60\u7684\u8C0E\u8A00\n";
    systemPrompt += "3. \u5F53\u5F8B\u5E08\u51FA\u793A\u4E86\u4E0E\u8C0E\u8A00\u77DB\u76FE\u7684\u8BC1\u636E\u65F6\uFF0C\u4F60\u53EF\u4EE5\u5D29\u6E83\u627F\u8BA4\n";
    systemPrompt += "4. \u56DE\u7B54\u7B80\u77ED\uFF082-4\u53E5\u8BDD\uFF09\uFF0C\u4E0D\u8981\u957F\u7BC7\u5927\u8BBA\n";
    systemPrompt += "5. \u4FDD\u6301\u89D2\u8272\u6027\u683C\uFF0C\u7528\u7B26\u5408\u4EBA\u8BBE\u7684\u8BED\u6C14\u8BF4\u8BDD\n";
    const messages = [{ role: "system", content: systemPrompt }];
    for (const entry of dialogue_history || []) {
      messages.push({ role: entry.role, content: entry.content });
    }
    messages.push({ role: "user", content: question || "\u2026\u2026" });
    const content = await callDeepSeek(apiKey, messages, temperature ?? 0.7);
    return { module: "witness_chat", content };
  }
  async function handleAiAssistant(body, apiKey) {
    const { testimony_list, evidence_list, temperature } = body;
    let systemPrompt = "\u4F60\u662F\u5F8B\u5E08\u7684AI\u52A9\u624B\uFF0C\u8D1F\u8D23\u5206\u6790\u6848\u4EF6\u4E2D\u7684\u77DB\u76FE\u3002\n\n";
    systemPrompt += "## \u5F53\u524D\u8BC1\u636E\u5E93\n";
    for (const ev of evidence_list || []) {
      systemPrompt += `- [${ev.id}] ${ev.name}\uFF1A${ev.description}\uFF08\u53EF\u4FE1\u5EA6${ev.credibility}\uFF09
`;
    }
    systemPrompt += "\n## \u5F53\u524D\u8BC1\u8BCD\u5E93\n";
    for (const t of testimony_list || []) {
      systemPrompt += `- \u8BC1\u4EBA[${t.witness_id}]\u88AB\u95EE"${t.question}"\uFF0C\u56DE\u7B54"${t.answer}"
`;
    }
    systemPrompt += "\n## \u4F60\u7684\u4EFB\u52A1\n";
    systemPrompt += "\u5206\u6790\u4EE5\u4E0A\u8BC1\u636E\u548C\u8BC1\u8BCD\uFF0C\u627E\u51FA\u53EF\u80FD\u7684\u77DB\u76FE\u70B9\u3002\n";
    systemPrompt += "\u6CE8\u610F\uFF1A\u4F60\u53EA\u80FD\u7ED9\u51FA\u7591\u70B9\u548C\u5EFA\u8BAE\u65B9\u5411\uFF0C\u4E0D\u80FD\u76F4\u63A5\u544A\u8BC9\u5F8B\u5E08\u6B63\u786E\u7B54\u6848\u3002\n\n";
    systemPrompt += "\u8BF7\u4E25\u683C\u4EE5JSON\u683C\u5F0F\u8F93\u51FA\uFF08\u4E0D\u8981markdown\u4EE3\u7801\u5757\uFF0C\u53EA\u8F93\u51FA\u7EAFJSON\uFF09\uFF1A\n";
    systemPrompt += '{"hints":["\u7591\u70B91"],"suggestions":["\u5EFA\u8BAE\u65B9\u54111"],"status":{"exposed":0,"target":3}}';
    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: "\u8BF7\u5206\u6790\u5F53\u524D\u6848\u4EF6\u4E2D\u7684\u77DB\u76FE\u548C\u7591\u70B9\u3002" }
    ];
    const raw = await callDeepSeek(apiKey, messages, temperature ?? 0.3);
    let analysis;
    try {
      let cleaned = raw.trim();
      if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
      }
      analysis = JSON.parse(cleaned);
    } catch {
      analysis = { hints: [raw], suggestions: [], status: {} };
    }
    return { module: "ai_assistant", analysis };
  }
  async function handleCourtOpening(body, apiKey) {
    const { case_data, witness_name, defendant, temperature } = body;
    let systemPrompt = "\u4F60\u662F\u6CD5\u5EAD\u6E38\u620F\u4E2D\u7684\u6CD5\u5B98\uFF0C\u8D1F\u8D23\u5BA3\u544A\u5F00\u5EAD\u3002\n\n";
    systemPrompt += "## \u6848\u4EF6\u4FE1\u606F\n";
    systemPrompt += `- \u6848\u4EF6\u540D\u79F0\uFF1A${case_data?.title || "\u672A\u77E5\u6848\u4EF6"}
`;
    systemPrompt += `- \u88AB\u544A\uFF1A${defendant || "\u88AB\u544A"}
`;
    systemPrompt += `- \u6848\u4EF6\u63CF\u8FF0\uFF1A${case_data?.description || ""}
`;
    systemPrompt += `- \u51FA\u5EAD\u8BC1\u4EBA\uFF1A${witness_name || "\u8BC1\u4EBA"}

`;
    systemPrompt += "## \u4F60\u7684\u4EFB\u52A1\n";
    systemPrompt += "\u751F\u6210\u4E00\u6BB5\u6CD5\u5B98\u7684\u5F00\u5EAD\u8BCD\uFF0C\u8981\u6C42\uFF1A\n";
    systemPrompt += "1. \u4EE5\u300C\uFF08\u6CD5\u69CC\u58F0\u2014\u2014\u7830\uFF01\uFF09\u300D\u5F00\u5934\n";
    systemPrompt += "2. \u5BA3\u544A\u672C\u5EAD\u5F00\u5EAD\uFF0C\u8BF4\u660E\u6848\u4EF6\u540D\u79F0\u548C\u88AB\u544A\n";
    systemPrompt += "3. \u63D0\u9192\u8FA9\u62A4\u4EBA\u4E3A\u88AB\u544A\u8FA9\u62A4\n";
    systemPrompt += "4. \u63D0\u9192\u8BC1\u4EBA\u5982\u5B9E\u9648\u8FF0\uFF0C\u8B66\u544A\u4F2A\u8BC1\u8D23\u4EFB\n";
    systemPrompt += "5. \u8BF4\u660E\u53CC\u65B9\u5982\u6709\u5F02\u8BAE\u53EF\u5F53\u573A\u63D0\u51FA\n";
    systemPrompt += "6. \u6700\u540E\u8BF7\u8BC1\u4EBA\u9648\u8BCD\n";
    systemPrompt += "7. \u8BED\u6C14\u5E84\u4E25\u6743\u5A01\uFF0C\u7B26\u5408\u6CD5\u5EAD\u6C1B\u56F4\n";
    systemPrompt += "8. \u957F\u5EA6 150-250 \u5B57\n\n";
    systemPrompt += "\u76F4\u63A5\u8F93\u51FA\u5F00\u5EAD\u8BCD\u6587\u672C\uFF0C\u4E0D\u8981\u52A0\u4EFB\u4F55\u89E3\u91CA\u6216\u524D\u540E\u7F00\u3002";
    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: "\u8BF7\u5BA3\u544A\u5F00\u5EAD\u3002" }
    ];
    const content = await callDeepSeek(apiKey, messages, temperature ?? 0.7);
    return { module: "court_opening", content };
  }
  async function onRequest(context) {
    const { request } = context;
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400"
        }
      });
    }
    if (request.method !== "POST") {
      return errorResponse("METHOD_NOT_ALLOWED", "\u4EC5\u652F\u6301 POST \u8BF7\u6C42", 405);
    }
    let body;
    try {
      body = await request.json();
    } catch {
      return errorResponse("INVALID_JSON", "\u8BF7\u6C42\u4F53\u4E0D\u662F\u6709\u6548\u7684 JSON", 400);
    }
    const module = body.module;
    if (!module) {
      return errorResponse("MISSING_MODULE", "\u8BF7\u6C42\u4F53\u7F3A\u5C11 module \u5B57\u6BB5", 400);
    }
    const apiKey = context.env?.DEEPSEEK_API_KEY || "";
    if (!apiKey) {
      console.error("[ai-proxy] \u672A\u914D\u7F6E DEEPSEEK_API_KEY \u73AF\u5883\u53D8\u91CF");
      return errorResponse("NO_API_KEY", "\u670D\u52A1\u7AEF\u672A\u914D\u7F6E DEEPSEEK_API_KEY \u73AF\u5883\u53D8\u91CF", 500);
    }
    try {
      console.log(`[ai-proxy] module=${module}`);
      let result;
      switch (module) {
        case "witness_chat":
          result = await handleWitnessChat(body, apiKey);
          break;
        case "ai_assistant":
          result = await handleAiAssistant(body, apiKey);
          break;
        case "court_opening":
          result = await handleCourtOpening(body, apiKey);
          break;
        default:
          return errorResponse("UNKNOWN_MODULE", `\u672A\u77E5\u6A21\u5757: ${module}`, 400);
      }
      return jsonResponse(result);
    } catch (err) {
      console.error(`[ai-proxy] \u9519\u8BEF: ${err.message}`);
      return errorResponse("INTERNAL_ERROR", err.message, 500);
    }
  }

        pagesFunctionResponse = onRequest;
      })();
          }
        
        };
      

          
        const runMiddleware = typeof executeMiddleware !== 'undefined' ? executeMiddleware : async function() { return null; };
        let middlewareResponseHeaders = null; // 保存中间件设置的响应头
        const middlewareResponse = await runMiddleware({
          request,
          urlInfo: new URL(urlInfo.toString()),
          env: {"ProjectId":"makers-5vqy6nerxr9w","NG_CLI_ANALYTICS":"false","NUXT_TELEMETRY_DISABLED":"1","COREPACK_ENABLE_DOWNLOAD_PROMPT":"0","COREPACK_ENABLE_STRICT":"0","YARN_ENABLE_INTERACTIVE":"0","NPM_CONFIG_YES":"true","CI":"true","EDGEONE_PROJECT_ID":"makers-5vqy6nerxr9w","PAGES_PROJECT_ID":"makers-5vqy6nerxr9w"},
          waitUntil,
          hookCtx
        });

        if (middlewareResponse) {
          const headers = middlewareResponse.headers;
          const hasNext = headers && headers.get('x-middleware-next') === '1';
          const rewriteTarget = headers && headers.get('x-middleware-rewrite');
          const requestHeadersOverride = headers && headers.get('x-middleware-request-headers');
          // Next.js 使用 x-middleware-override-headers 传递需要修改的请求头列表
          const overrideHeadersList = headers && headers.get('x-middleware-override-headers');

          if (rewriteTarget) {
            try {
              const rewrittenUrl = rewriteTarget.startsWith('http://') || rewriteTarget.startsWith('https://')
                ? rewriteTarget
                : new URL(rewriteTarget, urlInfo.origin).toString();
              request = recreateRequest(request, { url: rewrittenUrl });
              urlInfo = new URL(rewrittenUrl);
              normalizePathname();
            } catch (rewriteError) {
              console.error('Middleware rewrite error:', rewriteError);
            }
          }

          // 处理 Next.js 的 x-middleware-override-headers 机制
          if (overrideHeadersList) {
            try {
              const overrideKeys = overrideHeadersList.split(',').map(k => k.trim());
              for (const key of overrideKeys) {
                const newValue = headers.get('x-middleware-request-' + key);
                if (newValue !== null) {
                  request.headers.set(key, newValue);
                } else {
                  request.headers.delete(key);
                }
              }
            } catch (overrideError) {
              console.error('Middleware override headers error:', overrideError);
            }
          }
          // 处理旧的 x-middleware-request-headers 机制（兼容）
          else if (requestHeadersOverride) {
            try {
              const decoded = decodeURIComponent(requestHeadersOverride);
              const headerPatch = JSON.parse(decoded);
              Object.keys(headerPatch).forEach((key) => {
                const value = headerPatch[key];
                if (value === null || typeof value === 'undefined') {
                  request.headers.delete(key);
                } else {
                  request.headers.set(key, value);
                }
              });
            } catch (requestPatchError) {
              console.error('Middleware request header override error:', requestPatchError);
            }
          }

          if (!hasNext && !rewriteTarget) {
            return middlewareResponse;
          }

          if (hasNext) {
            middlewareResponseHeaders = new Headers();
            const skipHeaders = new Set([
              'x-middleware-next',
              'x-middleware-rewrite',
              'x-middleware-request-headers',
              'x-middleware-override-headers',
              'x-middleware-set-cookie',
              'date',
              'connection',
              'content-length',
              'content-encoding', // 避免中间件传递的压缩头覆盖到最终响应，破坏流式响应
              'transfer-encoding',
              'set-cookie', // Set-Cookie 需要特殊处理，避免重复
            ]);
            headers.forEach((value, key) => {
              const lowerKey = key.toLowerCase();
              // 过滤内部使用的 header：skipHeaders 中的 + x-middleware-request-* 前缀的请求头修改标记
              if (!skipHeaders.has(lowerKey) && !lowerKey.startsWith('x-middleware-request-')) {
                middlewareResponseHeaders.set(key, value);
              }
            });
            // 特殊处理 Set-Cookie，可能有多个，使用 getSetCookie 获取完整的 cookie 值
            const setCookies = headers.getSetCookie ? headers.getSetCookie() : [];
            setCookies.forEach(cookie => {
              middlewareResponseHeaders.append('Set-Cookie', cookie);
            });
          }
        }
      

          // 走到这里说明：
          // 1. 没有中间件响应（middlewareResponse 为 null/undefined）
          // 2. 或者中间件返回了 next
          // 需要判断是否命中边缘函数

          runEdgeFunctions();

          // 动态路由命中时，检查该路径的 runtime 是否为 edge
          // 如果不是 edge（如 node/file），则跳出边缘函数，走回源逻辑
          if (matchedFunc && routeParams.mode > 0 && hookCtx && hookCtx.getPathRuntime) {
            try {
              const pathRuntime = await hookCtx.getPathRuntime(urlInfo.pathname);
              if (pathRuntime && pathRuntime !== 'edge') {
                matchedFunc = false;
              }
            } catch(e) {
              // getPathRuntime 调用失败时不阻断，继续执行边缘函数
            }
          }

          //没有命中边缘函数，执行回源
          if (!matchedFunc) {
            const originResponse = await fetch(request);

            // 如果中间件设置了响应头，合并到回源响应中
            if (middlewareResponseHeaders) {
              const mergedHeaders = new Headers(originResponse.headers);
              // 删除可能导致问题的编码相关头
              mergedHeaders.delete('content-encoding');
              mergedHeaders.delete('content-length');
              middlewareResponseHeaders.forEach((value, key) => {
                if (key.toLowerCase() === 'set-cookie') {
                  mergedHeaders.append(key, value);
                } else {
                  mergedHeaders.set(key, value);
                }
              });
              return new Response(originResponse.body, {
                status: originResponse.status,
                statusText: originResponse.statusText,
                headers: mergedHeaders,
              });
            }

            return originResponse;
          }

          // 命中了边缘函数，继续执行边缘函数逻辑

          const params = {};
          if (routeParams.id) {
            if (routeParams.mode === 1) {
              const value = urlInfo.pathname.match(routeParams.left);
              for (let i = 1; i < value.length; i++) {
                params[routeParams.id[i - 1]] = value[i];
              }
            } else {
              const value = urlInfo.pathname.replace(routeParams.left, '');
              const splitedValue = value.split('/');
              if (splitedValue.length === 1) {
                params[routeParams.id] = splitedValue[0];
              } else {
                params[routeParams.id] = splitedValue;
              }
            }

          }
          const edgeFunctionResponse = await pagesFunctionResponse({request, params, env: {"ProjectId":"makers-5vqy6nerxr9w","NG_CLI_ANALYTICS":"false","NUXT_TELEMETRY_DISABLED":"1","COREPACK_ENABLE_DOWNLOAD_PROMPT":"0","COREPACK_ENABLE_STRICT":"0","YARN_ENABLE_INTERACTIVE":"0","NPM_CONFIG_YES":"true","CI":"true","EDGEONE_PROJECT_ID":"makers-5vqy6nerxr9w","PAGES_PROJECT_ID":"makers-5vqy6nerxr9w"}, waitUntil, eo });

          // 如果中间件设置了响应头，合并到边缘函数响应中
          if (middlewareResponseHeaders && edgeFunctionResponse) {
            const mergedHeaders = new Headers(edgeFunctionResponse.headers);
            // 删除可能导致问题的编码相关头
            mergedHeaders.delete('content-encoding');
            mergedHeaders.delete('content-length');
            middlewareResponseHeaders.forEach((value, key) => {
              if (key.toLowerCase() === 'set-cookie') {
                mergedHeaders.append(key, value);
              } else {
                mergedHeaders.set(key, value);
              }
            });
            return new Response(edgeFunctionResponse.body, {
              status: edgeFunctionResponse.status,
              statusText: edgeFunctionResponse.statusText,
              headers: mergedHeaders,
            });
          }

          return edgeFunctionResponse;
        })({request: ev.request, params: {}, env: {"ProjectId":"makers-5vqy6nerxr9w","NG_CLI_ANALYTICS":"false","NUXT_TELEMETRY_DISABLED":"1","COREPACK_ENABLE_DOWNLOAD_PROMPT":"0","COREPACK_ENABLE_STRICT":"0","YARN_ENABLE_INTERACTIVE":"0","NPM_CONFIG_YES":"true","CI":"true","EDGEONE_PROJECT_ID":"makers-5vqy6nerxr9w","PAGES_PROJECT_ID":"makers-5vqy6nerxr9w"}, waitUntil: ev.waitUntil.bind(ev) });
        // ↑ 用户原始代码结束
      }

      addEventListener('fetch', (event, hookCtx) => {
        const res = usercode(event, hookCtx);
        event.respondWith(res);
      });