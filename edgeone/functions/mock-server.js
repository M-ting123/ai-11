/**
 * 本地 Mock 服务器 — 模拟 EdgeOne Functions AI 代理
 *
 * 用途：在无需 DeepSeek API 密钥、无需 EdgeOne 部署的情况下，
 *      验证 Godot(AIService) → 代理 → 响应 的端到端链路通畅。
 *
 * 运行：node edgeone/functions/mock-server.js
 * 默认端口：8787
 * 路径：/api/ai-proxy
 *
 * 与真实 EdgeOne 代理(index.js)行为一致：
 * - CORS 预检（OPTIONS → 204）
 * - POST + JSON body，按 module 字段路由
 * - witness_chat 返回 { module, content }
 * - ai_assistant 返回 { module, analysis:{ hints, suggestions, status } }
 */
const http = require("http");

const PORT = 8787;
const PATH = "/api/ai-proxy";

const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "POST, OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type",
	"Access-Control-Max-Age": "86400",
};

function corsJson(res, body, status = 200) {
	const json = JSON.stringify(body);
	res.writeHead(status, {
		...corsHeaders,
		"Content-Type": "application/json; charset=utf-8",
	});
	res.end(json);
}

// ---- 模块1：证人对话 ----
function handleWitnessChat(body) {
	const question = String(body.question || "");
	const persona = (body.npc_data && body.npc_data.persona) || "证人";
	let content;
	if (question.includes("几点") || question.includes("时间") || question.includes("离开")) {
		content = `（${persona}）我……我那天21:30才离开的，一直在岗亭值班，真的没离开过。你、你别这样问。`;
	} else if (question.includes("凶手") || question.includes("杀人")) {
		content = `（${persona}）我不知道凶手是谁，我那时候已经不在现场了，别问我！`;
	} else if (question.includes("监控") || question.includes("证据")) {
		content = `（${persona}）这、这个……监控？我不清楚你说的是什么，我什么都没干。`;
	} else {
		content = `（${persona}）这个……我记不太清了，那天太紧张了，真不记得了。`;
	}
	return { module: "witness_chat", content };
}

// ---- 模块2：AI 助手分析 ----
function handleAiAssistant(body) {
	return {
		module: "ai_assistant",
		analysis: {
			hints: [
				"证人声称21:30离开，但监控显示21:00就离开了——可能存在时间矛盾",
				"值班记录显示证人应在岗，但监控拍到其离开——行踪矛盾",
			],
			suggestions: [
				"重点质询证人当晚的离开时间",
				"出示监控录像追问证人不一致",
			],
			status: { exposed: 0, target: 2 },
		},
	};
}

const server = http.createServer((req, res) => {
	// CORS 预检
	if (req.method === "OPTIONS") {
		res.writeHead(204, corsHeaders);
		res.end();
		return;
	}

	if (req.method !== "POST") {
		corsJson(res, { module: "error", error: { code: "METHOD_NOT_ALLOWED", message: "仅支持 POST 请求" } }, 405);
		return;
	}

	if (!req.url || !req.url.startsWith(PATH)) {
		corsJson(res, { module: "error", error: { code: "NOT_FOUND", message: "路径不存在: " + req.url } }, 404);
		return;
	}

	let data = "";
	req.on("data", (chunk) => (data += chunk));
	req.on("end", () => {
		let body;
		try {
			body = JSON.parse(data);
		} catch {
			corsJson(res, { module: "error", error: { code: "INVALID_JSON", message: "请求体不是有效的 JSON" } }, 400);
			return;
		}

		const mod = body.module;
		console.log(`[mock] 收到请求 module=${mod} url=${req.url}`);

		// 模拟网络延迟（300ms），更接近真实 AI 调用体感
		setTimeout(() => {
			switch (mod) {
				case "witness_chat":
					corsJson(res, handleWitnessChat(body));
					break;
				case "ai_assistant":
					corsJson(res, handleAiAssistant(body));
					break;
				default:
					corsJson(res, { module: "error", error: { code: "UNKNOWN_MODULE", message: `未知模块: ${mod}` } }, 400);
			}
		}, 300);
	});
});

server.on("error", (err) => {
	if (err.code === "EADDRINUSE") {
		console.error(`[mock-server] 端口 ${PORT} 已被占用，请先关闭占用进程或修改 PORT`);
	} else {
		console.error("[mock-server] 服务器错误:", err.message);
	}
	process.exit(1);
});

server.listen(PORT, () => {
	console.log(`[mock-server] 已启动: http://localhost:${PORT}${PATH}`);
	console.log("[mock-server] 在 Godot 中打开 ai_test.tscn 按 F6 运行即可测试链路");
	console.log("[mock-server] 按 Ctrl+C 停止");
});
