/**
 * dev-server.js — 本地开发用 AI 代理（真实 DeepSeek API）
 *
 * 用途：本地开发时替代 EdgeOne Functions，让 Godot 游戏调用真实 DeepSeek
 * 运行：
 *   Windows:  set DEEPSEEK_API_KEY=sk-xxx && node edgeone/functions/dev-server.js
 *   Linux/Mac: DEEPSEEK_API_KEY=sk-xxx node edgeone/functions/dev-server.js
 * 端口：8787（与 AIService.proxy_url 默认值一致）
 *
 * 路由：POST /api/ai-proxy
 * 模块：
 *   - witness_chat   AI 证人对话
 *   - ai_assistant   AI 助手分析矛盾
 *   - court_opening  AI 生成法官开庭词（v0.7.3 新增）
 */

import http from "node:http";

const API_KEY = process.env.DEEPSEEK_API_KEY;
const PORT = parseInt(process.env.PORT || "8787", 10);

if (!API_KEY) {
	console.error("❌ 未设置 DEEPSEEK_API_KEY 环境变量");
	console.error("   申请地址: https://platform.deepseek.com/");
	console.error("   Windows:  set DEEPSEEK_API_KEY=sk-xxx");
	console.error("   Linux/Mac: export DEEPSEEK_API_KEY=sk-xxx");
	process.exit(1);
}

console.log(`[dev-server] DeepSeek 本地代理启动中... 端口 ${PORT}`);

// ==========================================
// CORS 头
// ==========================================
const CORS_HEADERS = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "POST, OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type",
	"Access-Control-Max-Age": "86400",
	"Content-Type": "application/json; charset=utf-8",
};

function corsJson(body, status = 200) {
	return JSON.stringify(body);
	// 实际响应在 server 里构造，这里只返回 body 字符串
}

function makeResponse(bodyObj, status = 200) {
	return {
		status,
		headers: CORS_HEADERS,
		body: JSON.stringify(bodyObj),
	};
}

// ==========================================
// DeepSeek API 调用
// ==========================================
async function callDeepSeek(messages, temperature = 0.7) {
	const resp = await fetch("https://api.deepseek.com/v1/chat/completions", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${API_KEY}`,
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
// 模块1：AI 证人对话
// ==========================================
async function handleWitnessChat(body) {
	const { npc_data, question, dialogue_history, temperature } = body;
	const persona = npc_data?.persona || "";
	const knowledge = npc_data?.knowledge || {};
	const responseRules = npc_data?.response_rules || {};

	let systemPrompt = "你是法庭游戏中的NPC证人，正在接受律师询问。\n\n";
	systemPrompt += `## 你的性格\n${persona}\n\n`;
	systemPrompt += "## 你知道的事实（只能基于这些回答）\n";
	for (const fact of (knowledge.knows || [])) {
		systemPrompt += `- ${fact}\n`;
	}
	systemPrompt += '\n## 你不知道的事实（被问到时回答"不知道"或"不记得"）\n';
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
	systemPrompt += '1. 绝不捏造你不知道的事实，超出知识边界统一回答"不知道"或"不记得"\n';
	systemPrompt += "2. 在未出示证据前，坚持你的谎言\n";
	systemPrompt += "3. 当律师出示了与谎言矛盾的证据时，你可以崩溃承认\n";
	systemPrompt += "4. 回答简短（2-4句话），不要长篇大论\n";
	systemPrompt += "5. 保持角色性格，用符合人设的语气说话\n";

	const messages = [{ role: "system", content: systemPrompt }];
	for (const entry of (dialogue_history || [])) {
		messages.push({ role: entry.role, content: entry.content });
	}
	messages.push({ role: "user", content: question || "……" });

	const content = await callDeepSeek(messages, temperature ?? 0.7);
	return makeResponse({ module: "witness_chat", content });
}

// ==========================================
// 模块2：AI 助手分析
// ==========================================
async function handleAiAssistant(body) {
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

	const raw = await callDeepSeek(messages, temperature ?? 0.3);

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

	return makeResponse({ module: "ai_assistant", analysis });
}

// ==========================================
// 模块3：AI 生成法官开庭词（v0.7.3 新增）
// ==========================================
async function handleCourtOpening(body) {
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

	const content = await callDeepSeek(messages, temperature ?? 0.7);
	return makeResponse({ module: "court_opening", content });
}

// ==========================================
// HTTP 服务器
// ==========================================
const server = http.createServer(async (req, res) => {
	// CORS 预检
	if (req.method === "OPTIONS") {
		res.writeHead(204, CORS_HEADERS);
		res.end();
		return;
	}

	// 只接受 POST /api/ai-proxy
	if (req.method !== "POST" || !req.url.startsWith("/api/ai-proxy")) {
		res.writeHead(404, CORS_HEADERS);
		res.end(JSON.stringify({ error: "Not Found" }));
		return;
	}

	// 读取 body
	let bodyStr = "";
	for await (const chunk of req) {
		bodyStr += chunk;
	}

	let body;
	try {
		body = JSON.parse(bodyStr);
	} catch {
		res.writeHead(400, CORS_HEADERS);
		res.end(JSON.stringify({ module: "error", error: { code: "INVALID_JSON", message: "请求体不是有效的 JSON" } }));
		return;
	}

	const mod = body.module;
	if (!mod) {
		res.writeHead(400, CORS_HEADERS);
		res.end(JSON.stringify({ module: "error", error: { code: "MISSING_MODULE", message: "请求体缺少 module 字段" } }));
		return;
	}

	console.log(`[dev-server] 收到请求: module=${mod}`);

	try {
		let result;
		switch (mod) {
			case "witness_chat":
				result = await handleWitnessChat(body);
				break;
			case "ai_assistant":
				result = await handleAiAssistant(body);
				break;
			case "court_opening":
				result = await handleCourtOpening(body);
				break;
			default:
				res.writeHead(400, CORS_HEADERS);
				res.end(JSON.stringify({ module: "error", error: { code: "UNKNOWN_MODULE", message: `未知模块: ${mod}` } }));
				return;
		}

		res.writeHead(result.status, result.headers);
		res.end(result.body);
		console.log(`[dev-server] 响应完成: module=${mod}`);
	} catch (err) {
		console.error(`[dev-server] 错误: ${err.message}`);
		res.writeHead(500, CORS_HEADERS);
		res.end(JSON.stringify({ module: "error", error: { code: "INTERNAL_ERROR", message: err.message } }));
	}
});

server.listen(PORT, () => {
	console.log(`[dev-server] ✅ DeepSeek 本地代理已启动: http://localhost:${PORT}/api/ai-proxy`);
	console.log(`[dev-server] 在 Godot 中 AIService.proxy_url 应为: http://localhost:${PORT}/api/ai-proxy`);
	console.log(`[dev-server] 按 Ctrl+C 停止`);
});
