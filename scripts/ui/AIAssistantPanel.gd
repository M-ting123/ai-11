extends Panel
## AIAssistantPanel — AI助手侧边面板（可复用组件）
## v0.8: 新增「提示方向」按钮 — 点击调用 DeepSeek 分析当前证据/证词，给出方向
## v0.7.2: 移除「局势评估 / 已揭穿矛盾」状态条——
## 玩家用审讯找的疑点直接异议即可，不需要数字提示进度

@onready var _hints_label: RichTextLabel = $VBoxContainer/HintsSection/HintsLabel
@onready var _suggestions_label: RichTextLabel = $VBoxContainer/SuggestionsSection/SuggestionsLabel
@onready var _hint_button: Button = $VBoxContainer/HintButton

## 信号：提示请求发出（父场景可选择监听做自定义处理）
signal hint_requested

var _analyzing: bool = false

func _ready() -> void:
	_hint_button.pressed.connect(_on_hint_button_pressed)
	# 监听 AI 分析完成信号（ONE_SHOT 避免重复）
	if not AIService.assistant_analysis_completed.is_connected(_on_analysis_completed):
		AIService.assistant_analysis_completed.connect(_on_analysis_completed)
	if not AIService.assistant_analysis_failed.is_connected(_on_analysis_failed):
		AIService.assistant_analysis_failed.connect(_on_analysis_failed)


## 点击提示按钮
func _on_hint_button_pressed() -> void:
	if _analyzing:
		return

	# 收集当前证据和证词
	var evidence_list: Array = []
	for ev_id in GameState.evidence_db:
		var ev = GameState.evidence_db[ev_id]
		evidence_list.append({
			"id": ev.get("id", ev_id),
			"name": ev.get("name", "未知证据"),
			"description": ev.get("description", ""),
			"credibility": ev.get("credibility", 5)
		})

	var testimony_list: Array = []
	for t in GameState.testimony_db:
		testimony_list.append({
			"witness_id": t.get("witness_id", ""),
			"question": t.get("question", ""),
			"answer": t.get("answer", "")
		})

	# 没有证据和证词时给本地提示
	if evidence_list.is_empty() and testimony_list.is_empty():
		_hints_label.text = "尚无证据和证词可分析。"
		_suggestions_label.text = "先浏览案件信息和证据板。"
		return

	# 调用 AI 分析
	_analyzing = true
	_hint_button.disabled = true
	_hint_button.text = "⏳ AI 分析中..."
	_hints_label.text = "正在分析案件矛盾..."
	_suggestions_label.text = ""

	AIService.analyze_evidence(testimony_list, evidence_list)


## AI 分析完成回调
func _on_analysis_completed(result: Dictionary) -> void:
	if not _analyzing:
		return
	_analyzing = false
	_hint_button.disabled = false
	_hint_button.text = "💡 提示方向"

	var analysis = result.get("analysis", {})
	var hints: Array = analysis.get("hints", [])
	var suggestions: Array = analysis.get("suggestions", [])

	update_hints(hints)
	update_suggestions(suggestions)


## AI 分析失败回调
func _on_analysis_failed(error: String) -> void:
	if not _analyzing:
		return
	_analyzing = false
	_hint_button.disabled = false
	_hint_button.text = "💡 提示方向"

	# 显示真实错误信息 + 本地兜底提示
	_hints_label.text = "[color=red]AI 请求失败: " + error + "[/color]\n\n"
	var suspects = GameState.get_suspects()
	if suspects.is_empty():
		if GameState.testimony_db.is_empty():
			_hints_label.text += "先向证人提问收集证词。"
			_suggestions_label.text = "选择提问方向，向证人询问关键问题。"
		else:
			_hints_label.text += "点击[整理]把证词变卡片，连线证据找矛盾。"
			_suggestions_label.text = "矛盾的连线就是疑点。"
	else:
		_hints_label.text += "已发现 %d 个疑点，可进入法庭。" % suspects.size()
		_suggestions_label.text = "对证人证词提出异议。"


## 更新疑点提示
func update_hints(hints: Array) -> void:
	_hints_label.text = ""
	if hints.is_empty():
		_hints_label.text = "暂无异常发现。"
		return
	for hint in hints:
		_hints_label.text += "• " + hint + "\n"


## 更新建议追问方向
func update_suggestions(suggestions: Array) -> void:
	_suggestions_label.text = ""
	if suggestions.is_empty():
		_suggestions_label.text = "暂无建议方向。"
		return
	for s in suggestions:
		_suggestions_label.text += "→ " + s + "\n"


## 更新局势评估（v0.7.2 已移除，保留空方法以兼容现有调用方）
func update_status(_exposed: int, _target: int) -> void:
	pass
