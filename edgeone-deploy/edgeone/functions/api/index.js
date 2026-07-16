/**
 * EdgeOne Functions — AI代理服务（v0.7.3 加 court_opening 模块）
 *
 * 负责：
 * - CORS 跨域处理
 * - 接收前端 JSON 请求，注入 DeepSeek API Key，转发到 DeepSeek API
 * - 三模块路由：witness_chat / ai_assistant / court_opening
 *
 * 运行时：EdgeOne Functions（fetch handler 模式，类似 Cloudflare Workers）
 * 环境变量：DEEPSEEK_API_KEY — DeepSeek API 密钥（在 EdgeOne 控制台配置）
 */

export default {
  async fetch(request, env) {
    // ==========================================
    // CORS 配置
    // ==========================================
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    };

    // OPTIONS 预检
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // 快捷构造 CORS JSON 响应
    function corsJson(body, status = 200) {
      return new Response(JSON.stringify(body), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
      });
    }

    function errorJson(code, message, status = 500) {
      return corsJson({ module: "error", error: { code, message } }, status);
    }

    // 只接受 POST
    if (request.method !== "POST") {
      return errorJson("METHOD_NOT_ALLOWED", "仅支持 POST 请求", 405);
    }

    // 解析 JSON + 路由
    let body;
    try {
      body = await request.json();
    } catch {
      return errorJson("INVALID_JSON", "请求体不是有效的 JSON", 400);
    }

    const module = body.module;
    if (!module) {
      return errorJson("MISSING_MODULE", "请求体缺少 module 字段", 400);
    }

    const apiKey = env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return errorJson("NO_API_KEY", "服务端未配置 DEEPSEEK_API_KEY 环境变量", 500);
    }

    try {
      switch (module) {
        case "witness_chat":
          return await handleWitnessChat(body, apiKey, corsJson);
        case "ai_assistant":
          return await handleAiAssistant(body, apiKey, corsJson);
        case "court_opening":
          return await handleCourtOpening(body, apiKey, corsJson);
        default:
          return errorJson("UNKNOWN_MODULE", `未知模块: ${module}`, 400);
      }
    } catch (err) {
      console.error("[ai-proxy]", err);
      return errorJson("INTERNAL_ERROR", err.message, 500);
    }
  },
};

// ==========================================
// AI 调用底层
// ==========================================
async function callDeepSeek(apiKey, messages, temperature = 0.7) {
  const resp = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages,
      temperature,
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`DeepSeek API 返回 ${resp.status}: ${errText}`);
  }

  const data = await resp.json();
  return data.choices?.[0]?.message?.content ?? "";
}

// ==========================================
// 模块1：AI证人对话
// ==========================================
async function handleWitnessChat(body, apiKey, corsJson) {
  const { npc_data, question, dialogue_history, temperature } = body;

  const persona = npc_data?.persona || "";
  const knowledge = npc_data?.knowledge || {};
  const responseRules = npc_data?.response_rules || {};

  // 构建 System Prompt（约束 AI 不越界、不编造事实）
  let systemPrompt = "你是法庭游戏中的NPC证人，正在接受律师询问。\n\n";
  systemPrompt += `## 你的性格\n${persona}\n\n`;
  systemPrompt += "## 你知道的事实（只能基于这些回答）\n";
  for (const fact of (knowledge.knows || [])) {
    systemPrompt += `- ${fact}\n`;
  }
  systemPrompt += "\n## 你不知道的事实（被问到时回答\"不知道\"或\"不记得\"）\n";
  for (const fact of (knowledge.does_not_know || [])) {
    systemPrompt += `- ${fact}\n`;
  }
  systemPrompt += "\n## 你的谎言（在未出示证据前坚持原说法）\n";
  for (const lie of (knowledge.lies_about || [])) {
    systemPrompt += `- ${lie}\n`;
  }
  systemPrompt += "\n## 响应规则\n";
  for (const [trigger, response] of Object.entries(responseRules)) {
    systemPrompt += `- ${trigger}：${response}\n`;
  }
  systemPrompt += "\n## 重要约束\n";
  systemPrompt += "1. 绝不捏造你不知道的事实，超出知识边界统一回答\"不知道\"或\"不记得\"\n";
  systemPrompt += "2. 在未出示证据前，坚持你的谎言\n";
  systemPrompt += "3. 当律师出示了与谎言矛盾的证据时，你可以崩溃承认\n";
  systemPrompt += "4. 回答简短（2-4句话），不要长篇大论\n";
  systemPrompt += "5. 保持角色性格，用符合人设的语气说话\n";

  const messages = [{ role: "system", content: systemPrompt }];

  // 拼接对话历史
  for (const entry of (dialogue_history || [])) {
    messages.push({ role: entry.role, content: entry.content });
  }
  // 当前提问
  messages.push({ role: "user", content: question || "……" });

  const content = await callDeepSeek(apiKey, messages, temperature ?? 0.7);
  return corsJson({ module: "witness_chat", content });
}

// ==========================================
// 模块2：AI助手分析
// ==========================================
async function handleAiAssistant(body, apiKey, corsJson) {
  const { testimony_list, evidence_list, temperature } = body;

  let systemPrompt = "你是律师的AI助手，负责分析案件中的矛盾。\n\n";
  systemPrompt += "## 当前证据库\n";
  for (const ev of (evidence_list || [])) {
    systemPrompt += `- [${ev.id}] ${ev.name}：${ev.description}（可信度${ev.credibility}）\n`;
  }
  systemPrompt += "\n## 当前证词库\n";
  for (const t of (testimony_list || [])) {
    systemPrompt += `- 证人[${t.witness_id}]被问"${t.question}"，回答"${t.answer}"\n`;
  }
  systemPrompt += "\n## 你的任务\n";
  systemPrompt += "分析以上证据和证词，找出可能的矛盾点。\n";
  systemPrompt += "注意：你只能给出疑点和建议方向，不能直接告诉律师正确答案。\n\n";
  systemPrompt += "请严格以JSON格式输出（不要markdown代码块，只输出纯JSON）：\n";
  systemPrompt += '{"hints":["疑点1"],"suggestions":["建议方向1"],"status":{"exposed":0,"target":3}}';

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: "请分析当前案件中的矛盾和疑点。" },
  ];

  const raw = await callDeepSeek(apiKey, messages, temperature ?? 0.3);

  // 解析AI返回的JSON
  let analysis;
  try {
    let cleaned = raw.trim();
    // 移除可能的 markdown 包裹
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
    }
    analysis = JSON.parse(cleaned);
  } catch {
    analysis = { hints: [raw], suggestions: [], status: {} };
  }

  return corsJson({ module: "ai_assistant", analysis });
}

// ==========================================
// 模块3：AI 生成法官开庭词（v0.7.3 新增）
// ==========================================
async function handleCourtOpening(body, apiKey, corsJson) {
  const { case_data, witness_name, defendant, temperature } = body;

  let systemPrompt = "你是法庭游戏中的法官，负责宣告开庭。\n\n";
  systemPrompt += "## 案件信息\n";
  systemPrompt += `- 案件名称：${case_data?.title || "未知案件"}\n`;
  systemPrompt += `- 被告：${defendant || "被告"}\n`;
  systemPrompt += `- 案件描述：${case_data?.description || ""}\n`;
  systemPrompt += `- 出庭证人：${witness_name || "证人"}\n\n`;
  systemPrompt += "## 你的任务\n";
  systemPrompt += "生成一段法官的开庭词，要求：\n";
  systemPrompt += "1. 以「（法槌声——砰！）」开头\n";
  systemPrompt += "2. 宣告本庭开庭，说明案件名称和被告\n";
  systemPrompt += "3. 提醒辩护人为被告辩护\n";
  systemPrompt += "4. 提醒证人如实陈述，警告伪证责任\n";
  systemPrompt += "5. 说明双方如有异议可当场提出\n";
  systemPrompt += "6. 最后请证人陈词\n";
  systemPrompt += "7. 语气庄严权威，符合法庭氛围\n";
  systemPrompt += "8. 长度 150-250 字\n\n";
  systemPrompt += "直接输出开庭词文本，不要加任何解释或前后缀。";

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: "请宣告开庭。" },
  ];

  const content = await callDeepSeek(apiKey, messages, temperature ?? 0.7);
  return corsJson({ module: "court_opening", content });
}
