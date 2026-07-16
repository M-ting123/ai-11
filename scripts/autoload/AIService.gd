extends Node
## AIService — AI调用服务（Autoload单例）
##
## 职责：
## - 封装 HTTPRequest，异步调用 EdgeOne Functions 代理 / 本地 dev-server
## - 提供三个核心方法：chat_with_witness() / analyze_evidence() / generate_court_opening()
## - 通过信号通知调用方结果
## - 代理URL配置在实例变量中，密钥不进前端（由EdgeOne代理或dev-server注入）
##
## v0.7.3 新增 court_opening 模块：AI 生成法官开庭词

# ---- 代理URL ----
# 本地开发：http://localhost:PORT/api/ai-proxy（配合 server.js 或 mock-server.js）
# Vercel 部署：/api/ai-proxy（同源相对路径，游戏与 API 同域）
# EdgeOne 部署：https://你的域名/api/ai-proxy
var proxy_url: String = "/api/ai-proxy"

# DeepSeek 模型参数
const DEFAULT_TEMPERATURE: float = 0.7
const REQUEST_TIMEOUT: float = 20.0  # 秒

# ---- 信号 ----
signal witness_chat_completed(response: String)
signal witness_chat_failed(error: String)
signal assistant_analysis_completed(result: Dictionary)
signal assistant_analysis_failed(error: String)
signal court_opening_completed(content: String)
signal court_opening_failed(error: String)
signal request_started()
signal request_finished()

# 内部 HTTPRequest 节点
var _http_request: HTTPRequest

# 当前请求模块（用于失败信号精准分发）+ 并发保护
var _current_module: String = ""
var _busy: bool = false


func _ready() -> void:
	_http_request = HTTPRequest.new()
	_http_request.timeout = REQUEST_TIMEOUT
	add_child(_http_request)
	_http_request.request_completed.connect(_on_request_completed)


## 证人对话 — 向 AI 证人提问
##
## npc_data: NPC Persona数据（persona, knowledge_boundary, response_rules）
## question: 玩家的提问文本
## dialogue_history: 之前的对话记录 Array[Dictionary]{role, content}
func chat_with_witness(npc_data: Dictionary, question: String, dialogue_history: Array = []) -> void:
	var body: Dictionary = {
		"module": "witness_chat",
		"npc_data": npc_data,
		"question": question,
		"dialogue_history": dialogue_history,
		"temperature": DEFAULT_TEMPERATURE,
	}
	_send_request(body, "witness_chat")


## AI助手分析 — 分析证词与证据的矛盾
##
## testimony_list: 当前证词库
## evidence_list: 当前证据库
func analyze_evidence(testimony_list: Array, evidence_list: Array) -> void:
	var body: Dictionary = {
		"module": "ai_assistant",
		"testimony_list": testimony_list,
		"evidence_list": evidence_list,
		"temperature": 0.3,  # 分析用低温度，更稳定
	}
	_send_request(body, "ai_assistant")


## AI 生成法官开庭词（v0.7.3 新增）
## case_data: 案件数据（含 title/description）
## witness_name: 出庭证人名
## defendant: 被告名
func generate_court_opening(case_data: Dictionary, witness_name: String, defendant: String) -> void:
	var body: Dictionary = {
		"module": "court_opening",
		"case_data": case_data,
		"witness_name": witness_name,
		"defendant": defendant,
		"temperature": DEFAULT_TEMPERATURE,
	}
	_send_request(body, "court_opening")


## 是否正在请求中（供调用方判断）
func is_busy() -> bool:
	return _busy


## 发送请求到代理
func _send_request(body: Dictionary, module: String) -> void:
	# 并发保护：同一时刻只允许一个请求
	if _busy:
		print("[AIService] 已有请求进行中，拒绝并发请求: module=%s" % module)
		_emit_fail(module, "已有请求进行中，请稍候")
		return

	_current_module = module
	_busy = true
	request_started.emit()

	var json_string: String = JSON.stringify(body)
	var headers: PackedStringArray = ["Content-Type: application/json"]

	print("[AIService] 发送请求: module=%s" % module)

	var err: int = _http_request.request(
		proxy_url,
		headers,
		HTTPClient.METHOD_POST,
		json_string
	)

	if err != OK:
		print("[AIService] 请求失败: HTTPRequest.error=%d" % err)
		_busy = false
		request_finished.emit()
		_emit_fail(module, "请求发送失败 (错误码: %d)" % err)


## HTTPRequest 回调
func _on_request_completed(result: int, response_code: int, headers: PackedStringArray, body: PackedByteArray) -> void:
	_busy = false
	var mod: String = _current_module
	request_finished.emit()

	# 失败时按当前请求模块精准分发信号
	if result != HTTPRequest.RESULT_SUCCESS:
		var err_msg: String = "网络请求失败 (result=%d)" % result
		print("[AIService] %s" % err_msg)
		_emit_fail(mod, err_msg)
		return

	if response_code != 200:
		var err_msg: String = "服务器返回错误 (HTTP %d)" % response_code
		print("[AIService] %s" % err_msg)
		_emit_fail(mod, err_msg)
		return

	# 解析JSON响应
	var json: JSON = JSON.new()
	var parse_err: int = json.parse(body.get_string_from_utf8())

	if parse_err != OK:
		var err_msg: String = "响应解析失败: %s" % json.get_error_message()
		print("[AIService] %s" % err_msg)
		_emit_fail(mod, err_msg)
		return

	var response: Dictionary = json.data

	# 根据响应中的module字段分发信号
	var resp_module: String = response.get("module", "")

	if resp_module == "witness_chat":
		var content: String = response.get("content", "...")
		print("[AIService] 证人对话完成: %s..." % content.substr(0, 50))
		witness_chat_completed.emit(content)

	elif resp_module == "ai_assistant":
		var analysis: Dictionary = response.get("analysis", {})
		print("[AIService] AI分析完成: hints=%d, suggestions=%d" % [
			analysis.get("hints", []).size(),
			analysis.get("suggestions", []).size()
		])
		assistant_analysis_completed.emit(analysis)

	elif resp_module == "court_opening":
		var content: String = response.get("content", "")
		print("[AIService] 开庭词生成完成: %s..." % content.substr(0, 50))
		court_opening_completed.emit(content)

	else:
		var err_msg: String = "未知响应模块: %s" % resp_module
		print("[AIService] %s" % err_msg)
		_emit_fail(mod, err_msg)


## 按模块精准分发失败信号
func _emit_fail(mod: String, msg: String) -> void:
	match mod:
		"witness_chat":
			witness_chat_failed.emit(msg)
		"court_opening":
			court_opening_failed.emit(msg)
		_:
			assistant_analysis_failed.emit(msg)


## 设置代理URL（运行时可切换，用于开发/生产环境切换）
func set_proxy_url(url: String) -> void:
	proxy_url = url
	print("[AIService] 代理URL已切换: %s" % url)
