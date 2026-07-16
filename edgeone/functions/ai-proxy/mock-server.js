/**
 * 本地 Mock 服务器 — 模拟 EdgeOne Functions AI 代理
 *
 * 用途：
 *   在没有 EdgeOne 环境和 DeepSeek API 密钥时，验证 Godot → 代理 → 响应解析链路通畅。
 *   Mock 服务器会返回预设的假响应，让前端链路可以独立测试。
 *
 * 启动方式：
 *   cd edgeone/functions/ai-proxy
 *   node mock-server.js
 *
 * 默认监听端口：8787
 * 端点：http://localhost:8787/api/ai-proxy
 *
 * 测试完成后，部署真实 EdgeOne Functions 并配置 DEEPSEEK_API_KEY，
 * 前端只需把代理URL切换为线上地址即可。
 */

const http = require("http");
const PORT = 8787;
const PATH = "/api/ai-proxy";

// CORS 头
const CORS_HEADERS = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "POST, OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type",
	"Access-Control-Max-Age": "86400",
	"Content-Type": "application/json; charset=utf-8",
};

function sendJson(res, body, status = 200) {
	const payload = JSON.stringify(body);
	res.writeHead(status, CORS_HEADERS);
	res.end(payload);
}

// 模拟 witness_chat 响应
function mockWitnessChat(body) {
	const question = body.question || "";
	const npcPersona = body.npc_data?.persona || "未知角色";

	// 根据提问关键词返回不同的模拟回答
	let content;
	if (question.includes("几点") || question.includes("离开") || question.includes("时间")) {
		content = "我...我21:30才离开办公室的，真的，我没说谎...（眼神躲闪，声音发抖）";
	} else if (question.includes("凶手") || question.includes("谁")) {
		content = "我不知道凶手是谁！我真的什么都不知道！";
	} else if (question.includes("监控") || question.includes("证据")) {
		content = "（看到证据后崩溃）好...好吧，我承认，我21:00就离开了...但我没杀人！";
	} else {
		content = `（${npcPersona}）这个...我不太清楚你问的是什么...`;
	}

	return { module: "witness_chat", content };
}

// 模拟 ai_assistant 响应
function mockAiAssistant(body) {
	return {
		module: "ai_assistant",
		analysis: {
			hints: [
				"证人张某称21:30离开，但监控显示21:00已离开——时间存在30分钟矛盾",
				"值班记录显示张某当晚应在岗，但他却离开了岗位——存在脱岗嫌疑"
			],
			suggestions: [
				"在法庭上出示监控录像，质问证人离开时间的矛盾",
				"追问证人脱岗期间的去向和所见"
			],
			status: { exposed: 0, target: 2 }
		}
	};
}

const server = http.createServer((req, res) => {
	// CORS 预检
	if (req.method === "OPTIONS") {
		res.writeHead(204, CORS_HEADERS);
		res.end();
		return;
	}

	if (req.method !== "POST") {
		sendJson(res, {
			module: "error",
			error: { code: "METHOD_NOT_ALLOWED", message: "仅支持 POST 请求" }
		}, 405);
		return;
	}

	if (req.url !== PATH) {
		sendJson(res, {
			module: "error",
			error: { code: "NOT_FOUND", message: `路径不存在: ${req.url}（应为 ${PATH}）` }
		}, 404);
		return;
	}

	// 读取请求体
	let chunks = [];
	req.on("data", (c) => chunks.push(c));
	req.on("end", () => {
		const raw = Buffer.concat(chunks).toString("utf8");
		let body;
		try {
			body = JSON.parse(raw);
		} catch {
			sendJson(res, {
				module: "error",
				error: { code: "INVALID_JSON", message: "请求体不是有效的 JSON" }
			}, 400);
			return;
		}

		console.log(`[Mock] 收到请求: module=${body.module}`);

		// 模拟网络延迟 500ms
		setTimeout(() => {
			switch (body.module) {
				case "witness_chat":
					sendJson(res, mockWitnessChat(body));
					break;
				case "ai_assistant":
					sendJson(res, mockAiAssistant(body));
					break;
				default:
					sendJson(res, {
						module: "error",
						error: { code: "UNKNOWN_MODULE", message: `未知模块: ${body.module}` }
					}, 400);
			}
		}, 500);
	});
});

server.listen(PORT, () => {
	console.log("========================================");
	console.log("  AI 代理 Mock 服务器已启动");
	console.log("========================================");
	console.log(`  监听地址: http://localhost:${PORT}${PATH}`);
	console.log(`  支持模块: witness_chat, ai_assistant`);
	console.log("");
	console.log("  在 Godot 测试场景中：");
	console.log("  1. 代理URL 保持默认 http://localhost:8787/api/ai-proxy");
	console.log("  2. 点击「发送证人提问」或「请求AI分析」");
	console.log("  3. 观察是否收到 Mock 响应");
	console.log("");
	console.log("  按 Ctrl+C 停止服务器");
	console.log("========================================");
});
