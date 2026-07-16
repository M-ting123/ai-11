// server.js — Godot Web 静态服务器 + AI 代理（同源部署）
// 路由：
//   POST /api/ai-proxy  → AI 代理（witness_chat / ai_assistant / court_opening）
//   其他                → 静态文件（Godot Web 导出）
//
// 环境变量：DEEPSEEK_API_KEY — DeepSeek API 密钥（未设置时 AI 调用返回错误，游戏回落预设）

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 8080;
const API_KEY = process.env.DEEPSEEK_API_KEY || "";

const MIME = {
	".html": "text/html; charset=utf-8",
	".js": "application/javascript; charset=utf-8",
	".mjs": "application/javascript; charset=utf-8",
	".css": "text/css; charset=utf-8",
	".json": "application/json; charset=utf-8",
	".svg": "image/svg+xml; charset=utf-8",
	".xml": "application/xml; charset=utf-8",
	".txt": "text/plain; charset=utf-8",
	".wasm": "application/wasm",
	".wasm.gz": "application/wasm",
	".gz": "application/octet-stream",
	".pck": "application/octet-stream",
	".png": "image/png",
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".mp3": "audio/mpeg",
	".ico": "image/x-icon",
};

// ==========================================
// AI 代理（DeepSeek API）
// ==========================================
async function callDeepSeek(messages, temperature = 0.7) {
	const resp = await fetch("https://api.deepseek.com/v1/chat/completions", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${API_KEY}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ model: "deepseek-chat", messages, temperature }),
	});
	if (!resp.ok) {
		const errText = await resp.text();
		throw new Error(`DeepSeek API ${resp.status}: ${errText}`);
	}
	const data = await resp.json();
	return data.choices?.[0]?.message?.content ?? "";
}

async function handleWitnessChat(body) {
	const { npc_data, question, dialogue_history, temperature } = body;
	const persona = npc_data?.persona || "";
	const knowledge = npc_data?.knowledge || {};
	const responseRules = npc_data?.response_rules || {};

	let sp = "你是法庭游戏中的NPC证人，正在接受律师询问。\n\n";
	sp += `## 你的性格\n${persona}\n\n## 你知道的事实\n`;
	for (const f of (knowledge.knows || [])) sp += `- ${f}\n`;
	sp += '\n## 你不知道的（回答"不知道"）\n';
	for (const f of (knowledge.does_not_know || [])) sp += `- ${f}\n`;
	sp += "\n## 你的谎言（坚持原说法）\n";
	for (const lie of (knowledge.lies_about || [])) sp += `- ${lie}\n`;
	sp += "\n## 响应规则\n";
	for (const [t, r] of Object.entries(responseRules)) sp += `- ${t}：${r}\n`;
	sp += "\n## 约束\n1. 不捏造事实\n2. 坚持谎言\n3. 出示矛盾证据可崩溃\n4. 简短回答(2-4句)\n5. 保持角色性格\n";

	const messages = [{ role: "system", content: sp }];
	for (const e of (dialogue_history || [])) messages.push({ role: e.role, content: e.content });
	messages.push({ role: "user", content: question || "……" });

	const content = await callDeepSeek(messages, temperature ?? 0.7);
	return { module: "witness_chat", content };
}

async function handleAiAssistant(body) {
	const { testimony_list, evidence_list, temperature } = body;
	let sp = "你是律师的AI助手，分析案件矛盾。\n\n## 证据库\n";
	for (const ev of (evidence_list || [])) sp += `- [${ev.id}] ${ev.name}：${ev.description}\n`;
	sp += "\n## 证词库\n";
	for (const t of (testimony_list || [])) sp += `- 证人[${t.witness_id}]被问"${t.question}"，答"${t.answer}"\n`;
	sp += "\n## 任务\n分析矛盾，只给疑点和建议，不给答案。\n严格JSON输出：\n";
	sp += '{"hints":["疑点1"],"suggestions":["建议1"]}';

	const raw = await callDeepSeek([{ role: "system", content: sp }, { role: "user", content: "分析矛盾" }], temperature ?? 0.3);
	let analysis;
	try {
		let c = raw.trim();
		if (c.startsWith("```")) c = c.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
		analysis = JSON.parse(c);
	} catch { analysis = { hints: [raw], suggestions: [] }; }
	return { module: "ai_assistant", analysis };
}

async function handleCourtOpening(body) {
	const { case_data, witness_name, defendant, temperature } = body;
	let sp = "你是法庭法官，宣告开庭。\n\n## 案件\n";
	sp += `- 名称：${case_data?.title || "未知"}\n- 被告：${defendant || "被告"}\n- 描述：${case_data?.description || ""}\n- 证人：${witness_name || "证人"}\n\n`;
	sp += "## 要求\n1. 以「（法槌声——砰！）」开头\n2. 宣告开庭+案件+被告\n3. 提醒辩护人\n4. 警告伪证责任\n5. 说明可异议\n6. 请证人陈词\n7. 庄严权威\n8. 150-250字\n\n直接输出文本。";
	const content = await callDeepSeek([{ role: "system", content: sp }, { role: "user", content: "宣告开庭" }], temperature ?? 0.7);
	return { module: "court_opening", content };
}

async function handleAiProxy(req, res) {
	if (!API_KEY) {
		res.writeHead(500, { "Content-Type": "application/json" });
		res.end(JSON.stringify({ module: "error", error: { code: "NO_API_KEY", message: "未配置 DEEPSEEK_API_KEY 环境变量" } }));
		return;
	}

	let bodyStr = "";
	for await (const chunk of req) bodyStr += chunk;
	let body;
	try { body = JSON.parse(bodyStr); } catch {
		res.writeHead(400, { "Content-Type": "application/json" });
		res.end(JSON.stringify({ module: "error", error: { code: "INVALID_JSON" } }));
		return;
	}

	const mod = body.module;
	console.log(`[ai-proxy] module=${mod}`);

	try {
		let result;
		switch (mod) {
			case "witness_chat": result = await handleWitnessChat(body); break;
			case "ai_assistant": result = await handleAiAssistant(body); break;
			case "court_opening": result = await handleCourtOpening(body); break;
			default:
				res.writeHead(400, { "Content-Type": "application/json" });
				res.end(JSON.stringify({ module: "error", error: { code: "UNKNOWN_MODULE", message: mod } }));
				return;
		}
		res.writeHead(200, { "Content-Type": "application/json" });
		res.end(JSON.stringify(result));
	} catch (err) {
		console.error(`[ai-proxy] ${err.message}`);
		res.writeHead(500, { "Content-Type": "application/json" });
		res.end(JSON.stringify({ module: "error", error: { code: "INTERNAL_ERROR", message: err.message } }));
	}
}

// ==========================================
// HTTP 服务器
// ==========================================
const server = http.createServer(async (req, res) => {
	// COOP/COEP（Godot Web SharedArrayBuffer 必需）
	res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
	res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
	res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
	res.setHeader("Access-Control-Allow-Headers", "Content-Type");
	res.setHeader("Cache-Control", "no-cache");

	// .gz 文件自动设置 Content-Encoding: gzip（浏览器 fetch 自动解压）
	const isGzipped = req.url.includes(".gz");
	if (isGzipped) {
		res.setHeader("Content-Encoding", "gzip");
	}

	// CORS 预检
	if (req.method === "OPTIONS") {
		res.writeHead(204);
		res.end();
		return;
	}

	// AI 代理路由
	if (req.url.startsWith("/api/ai-proxy")) {
		if (req.method !== "POST") {
			res.writeHead(405, { "Content-Type": "application/json" });
			res.end(JSON.stringify({ error: "Method Not Allowed" }));
			return;
		}
		await handleAiProxy(req, res);
		return;
	}

	// 静态文件
	let urlPath = decodeURIComponent(req.url.split("?")[0]);
	if (urlPath === "/") urlPath = "/index.html";

	const filePath = path.join(__dirname, urlPath);
	if (!filePath.startsWith(__dirname)) {
		res.writeHead(403);
		res.end("Forbidden");
		return;
	}

	fs.stat(filePath, (err, stat) => {
		if (err || !stat.isFile()) {
			res.writeHead(404, { "Content-Type": "text/plain" });
			res.end("Not Found: " + urlPath);
			return;
		}
		const ext = path.extname(filePath).toLowerCase();
		const mime = MIME[ext] || "application/octet-stream";
		res.setHeader("Content-Type", mime);
		res.setHeader("Content-Length", stat.size);
		fs.createReadStream(filePath).pipe(res);
	});
});

server.listen(PORT, "0.0.0.0", () => {
	console.log(`[server] Listening on http://0.0.0.0:${PORT}`);
	console.log(`[server] AI proxy: POST /api/ai-proxy (DEEPSEEK_API_KEY ${API_KEY ? "✅ 已配置" : "❌ 未配置"})`);
	console.log(`[server] COOP/COEP: enabled`);
	console.log(`[server] .wasm.gz: Content-Encoding: gzip`);
});
