extends Control
## AI 链路测试场景
##
## 用途：验证 Godot → EdgeOne 代理 → DeepSeek 端到端调用链路
## 运行方式：在 Godot 编辑器中打开此场景，按 F6（运行当前场景）
##
## 两步验证：
## 1. 本地 Mock 模式：先用 mock-server.js 验证链路通畅（不需要 API 密钥）
## 2. 真实模式：部署 EdgeOne Functions + 配置 DEEPSEEK_API_KEY 后验证真实 AI 响应

# ---- UI 节点引用 ----
var _url_input: LineEdit
var _witness_question_input: LineEdit
var _witness_response: RichTextLabel
var _assistant_response: RichTextLabel
var _log_output: RichTextLabel
var _send_witness_btn: Button
var _send_assistant_btn: Button
var _status_label: Label

# ---- 测试用 NPC 数据（模拟案件中的证人） ----
const TEST_NPC: Dictionary = {
	"persona": "紧张、回避眼神、说话结巴。张某，案发当晚的保安。",
	"knowledge": {
		"knows": ["案发时间是21:00", "被害人是办公室的李总", "当晚自己值班"],
		"does_not_know": ["凶手身份", "被害人具体死因"],
		"lies_about": ["离开时间（实际21:00离开，谎称21:30）"]
	},
	"response_rules": {
		"被问及离开时间": "坚持说21:30，表现紧张",
		"被出示监控证据": "崩溃，承认21:00离开",
		"被问及凶手": "表示不知道"
	}
}

# ---- 测试用证据库 ----
const TEST_EVIDENCE: Array = [
	{"id": "ev_01", "name": "监控录像", "description": "显示张某21:00离开办公室", "credibility": 4},
	{"id": "ev_02", "name": "值班记录", "description": "显示张某当晚应在岗", "credibility": 3}
]

# ---- 测试用证词库 ----
const TEST_TESTIMONY: Array = [
	{"witness_id": "w_01", "question": "你几点离开的？", "answer": "我21:30才离开办公室..."}
]


func _ready() -> void:
	_build_ui()
	_connect_signals()
	_log("[就绪] 测试场景已加载")
	_log("[提示] 默认代理URL: %s" % AIService.proxy_url)
	_log("[提示] 按 F6 运行此场景，先启动 mock-server.js 进行本地测试")


func _build_ui() -> void:
	# 根节点背景
	var bg := ColorRect.new()
	bg.color = Color(0.06, 0.06, 0.1, 1)
	bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(bg)

	# 主容器
	var root := VBoxContainer.new()
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.offset_left = 20
	root.offset_top = 20
	root.offset_right = -20
	root.offset_bottom = -20
	root.add_theme_constant_override("separation", 10)
	add_child(root)

	# ---- 顶部：标题 + 代理URL ----
	var top_bar := HBoxContainer.new()
	top_bar.add_theme_constant_override("separation", 10)
	root.add_child(top_bar)

	var title := Label.new()
	title.text = "AI 链路测试"
	title.add_theme_font_size_override("font_size", 24)
	top_bar.add_child(title)

	var url_label := Label.new()
	url_label.text = "代理URL:"
	url_label.custom_minimum_size = Vector2(70, 0)
	top_bar.add_child(url_label)

	_url_input = LineEdit.new()
	_url_input.text = AIService.proxy_url
	_url_input.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	top_bar.add_child(_url_input)

	var apply_url_btn := Button.new()
	apply_url_btn.text = "应用URL"
	apply_url_btn.pressed.connect(_on_apply_url)
	top_bar.add_child(apply_url_btn)

	_status_label = Label.new()
	_status_label.text = "状态: 空闲"
	_status_label.custom_minimum_size = Vector2(120, 0)
	top_bar.add_child(_status_label)

	# ---- 中部：左右两栏 ----
	var middle := HSplitContainer.new()
	middle.size_flags_vertical = Control.SIZE_EXPAND_FILL
	middle.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	root.add_child(middle)

	# 左栏：证人对话测试
	var left_panel := _build_panel("证人对话测试 (witness_chat)")
	middle.add_child(left_panel)

	var q_label := Label.new()
	q_label.text = "提问："
	left_panel.add_child(q_label)

	_witness_question_input = LineEdit.new()
	_witness_question_input.text = "你当晚几点离开的？"
	_witness_question_input.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	left_panel.add_child(_witness_question_input)

	_send_witness_btn = Button.new()
	_send_witness_btn.text = "发送证人提问"
	left_panel.add_child(_send_witness_btn)

	_witness_response = RichTextLabel.new()
	_witness_response.size_flags_vertical = Control.SIZE_EXPAND_FILL
	_witness_response.bbcode_enabled = true
	_witness_response.text = "[color=gray]证人回答将显示在这里...[/color]"
	left_panel.add_child(_witness_response)

	# 右栏：AI助手分析测试
	var right_panel := _build_panel("AI助手分析测试 (ai_assistant)")
	middle.add_child(right_panel)

	var ev_label := Label.new()
	ev_label.text = "证据库：2件（监控录像、值班记录）\n证词库：1条（张某说21:30离开）"
	right_panel.add_child(ev_label)

	_send_assistant_btn = Button.new()
	_send_assistant_btn.text = "请求AI分析"
	right_panel.add_child(_send_assistant_btn)

	_assistant_response = RichTextLabel.new()
	_assistant_response.size_flags_vertical = Control.SIZE_EXPAND_FILL
	_assistant_response.bbcode_enabled = true
	_assistant_response.text = "[color=gray]AI分析结果将显示在这里...[/color]"
	right_panel.add_child(_assistant_response)

	# ---- 底部：日志 ----
	var log_label := Label.new()
	log_label.text = "调用日志："
	root.add_child(log_label)

	_log_output = RichTextLabel.new()
	_log_output.custom_minimum_size = Vector2(0, 180)
	_log_output.bbcode_enabled = true
	_log_output.scroll_following = true
	root.add_child(_log_output)


func _build_panel(title_text: String) -> VBoxContainer:
	var panel := PanelContainer.new()
	panel.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	var vb := VBoxContainer.new()
	vb.add_theme_constant_override("separation", 8)
	panel.add_child(vb)
	var t := Label.new()
	t.text = title_text
	t.add_theme_font_size_override("font_size", 16)
	vb.add_child(t)
	# 返回内部容器供外部添加子节点
	return vb


func _connect_signals() -> void:
	_send_witness_btn.pressed.connect(_on_send_witness)
	_send_assistant_btn.pressed.connect(_on_send_assistant)
	AIService.witness_chat_completed.connect(_on_witness_completed)
	AIService.witness_chat_failed.connect(_on_witness_failed)
	AIService.assistant_analysis_completed.connect(_on_assistant_completed)
	AIService.assistant_analysis_failed.connect(_on_assistant_failed)
	AIService.request_started.connect(_on_request_started)
	AIService.request_finished.connect(_on_request_finished)


# ---- 按钮回调 ----
func _on_apply_url() -> void:
	AIService.set_proxy_url(_url_input.text.strip_edges())
	_log("[配置] 代理URL已更新: %s" % AIService.proxy_url)


func _on_send_witness() -> void:
	var question: String = _witness_question_input.text.strip_edges()
	if question.is_empty():
		_log("[警告] 提问内容不能为空")
		return
	_log("[发送] witness_chat: %s" % question)
	_witness_response.text = "[color=yellow]请求中...[/color]"
	_send_witness_btn.disabled = true
	AIService.chat_with_witness(TEST_NPC, question, [])


func _on_send_assistant() -> void:
	_log("[发送] ai_assistant: 请求分析证据矛盾")
	_assistant_response.text = "[color=yellow]请求中...[/color]"
	_send_assistant_btn.disabled = true
	AIService.analyze_evidence(TEST_TESTIMONY, TEST_EVIDENCE)


# ---- AIService 信号回调 ----
func _on_request_started() -> void:
	_status_label.text = "状态: 请求中..."
	_status_label.add_theme_color_override("font_color", Color(1, 0.8, 0))


func _on_request_finished() -> void:
	_status_label.text = "状态: 空闲"
	_status_label.add_theme_color_override("font_color", Color(0.7, 0.7, 0.7))


func _on_witness_completed(content: String) -> void:
	_send_witness_btn.disabled = false
	_witness_response.text = "[color=#7CFC00]证人：[/color]\n" + content
	_log("[成功] 证人回答: %s..." % content.substr(0, 80))


func _on_witness_failed(error: String) -> void:
	_send_witness_btn.disabled = false
	_witness_response.text = "[color=red]失败：[/color]\n" + error
	_log("[失败] witness_chat: %s" % error)


func _on_assistant_completed(analysis: Dictionary) -> void:
	_send_assistant_btn.disabled = false
	var hints: Array = analysis.get("hints", [])
	var suggestions: Array = analysis.get("suggestions", [])
	var status: Dictionary = analysis.get("status", {})

	var text: String = "[color=#7CFC00]分析完成[/color]\n\n"
	text += "[color=#E94560]疑点提示：[/color]\n"
	for h in hints:
		text += "  • " + str(h) + "\n"
	text += "\n[color=#E94560]建议方向：[/color]\n"
	for s in suggestions:
		text += "  • " + str(s) + "\n"
	text += "\n[color=#E94560]局势：[/color] 已揭穿 %s / 目标 %s" % [
		str(status.get("exposed", "?")),
		str(status.get("target", "?"))
	]
	_assistant_response.text = text
	_log("[成功] AI分析: hints=%d, suggestions=%d" % [hints.size(), suggestions.size()])


func _on_assistant_failed(error: String) -> void:
	_send_assistant_btn.disabled = false
	_assistant_response.text = "[color=red]失败：[/color]\n" + error
	_log("[失败] ai_assistant: %s" % error)


# ---- 日志输出 ----
func _log(msg: String) -> void:
	var time := Time.get_time_string_from_system()
	_log_output.append_text("[color=gray][%s][/color] %s\n" % [time, msg])
	print("[AI Test] %s" % msg)
