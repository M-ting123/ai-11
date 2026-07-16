extends Control
## CourtTrial — 法庭对决关卡（v0.7.3 AI 开庭词接入）
##
## 流程：
##   1. OPENING         开庭：法官开庭词（优先 AI 生成，失败回落预设；打字机呈现）
##   2. STATEMENTS      陈述：证人陈述 + 对方律师陈词合并显示
##   3. CROSS_EXAMINATION 质询：逐句重放证词，玩家用疑点+证据双重异议
##   4. WITNESS_BREAKDOWN 证人崩溃痛哭
##   5. TRUTH_REVEAL    法官发问 → 真相揭示（打字机）
##   6. VICTORY/DEFEAT  胜利宣告 / 失败结局

@onready var _phase_label: Label = $PhaseLabel
@onready var _speaker_label: Label = $HSplitContainer/MainPanel/MainVBox/SpeakerLabel
@onready var _content_text: RichTextLabel = $HSplitContainer/MainPanel/MainVBox/ContentText
@onready var _objection_btn: Button = $BottomBar/ObjectionBtn
@onready var _next_btn: Button = $BottomBar/NextBtn
@onready var _ai_panel: Panel = $HSplitContainer/AIAssistantPanel

## 打字机（开庭词 / 真相揭示用）
var _type_timer: Timer
var _typewriter_text: String = ""
var _typewriter_index: int = 0
var _typewriter_active: bool = false

## 质询阶段：当前是否正在显示情绪反应（暂停推进）
var _showing_emotion: bool = false

## 开庭词是否已解决（AI 成功或回落预设，防覆盖）
var _opening_resolved: bool = false


func _ready() -> void:
	CourtSystem.init_court()

	_objection_btn.pressed.connect(_on_objection_pressed)
	_next_btn.pressed.connect(_on_next_pressed)
	AIService.court_opening_completed.connect(_on_court_opening_received)
	AIService.court_opening_failed.connect(_on_court_opening_failed)

	_enter_phase(CourtSystem.Phase.OPENING)


## 进入指定阶段
func _enter_phase(p: CourtSystem.Phase) -> void:
	CourtSystem.set_phase(p)
	match p:
		CourtSystem.Phase.OPENING:
			_phase_label.text = "开庭"
			_speaker_label.text = "法官"
			_objection_btn.disabled = true
			_next_btn.text = "继续"
			_next_btn.disabled = true
			_content_text.text = "[color=#888888]（法官正在宣告开庭...）[/color]"
			_opening_resolved = false
			_request_court_opening()

		CourtSystem.Phase.STATEMENTS:
			_phase_label.text = "双方陈词"
			_speaker_label.text = "证人 · 王保安 ／ 对方律师"
			_content_text.text = CourtSystem.get_statements_text()
			_objection_btn.disabled = true
			_next_btn.text = "开始质询"
			_next_btn.disabled = false

		CourtSystem.Phase.CROSS_EXAMINATION:
			_phase_label.text = "第三阶段 · 质询证词"
			_showing_emotion = false
			CourtSystem.current_line_index = 0
			_show_current_line()

		CourtSystem.Phase.WITNESS_BREAKDOWN:
			_phase_label.text = "证人崩溃"
			_speaker_label.text = "证人 · 王保安"
			_content_text.text = "[color=#FF9500]【证人彻底崩溃】[/color]\n\n" + CourtSystem.get_emotion_reaction(CourtSystem.get_required_exposed())
			_objection_btn.disabled = true
			_next_btn.text = "陈述真相"
			_next_btn.disabled = false

		CourtSystem.Phase.TRUTH_REVEAL:
			_phase_label.text = "最终阶段 · 揭示真相"
			_speaker_label.text = "法官"
			_content_text.text = CourtSystem.get_judge_question()
			_objection_btn.disabled = true
			_next_btn.text = "陈述真相"
			_next_btn.disabled = false

		CourtSystem.Phase.VICTORY:
			_phase_label.text = "胜诉！真相大白"
			_speaker_label.text = "辩护人 · 你"
			_objection_btn.disabled = true
			_next_btn.text = "查看判决"
			_next_btn.disabled = true
			_start_typewriter(CourtSystem.get_truth_text())

		CourtSystem.Phase.DEFEAT:
			_phase_label.text = "未能揭穿全部矛盾"
			_speaker_label.text = "法庭"
			var exposed: int = GameState.exposed_contradictions.size()
			var required: int = CourtSystem.get_required_exposed()
			_content_text.text = "你只点出了 %d / %d 处矛盾，未能拼凑出完整的真相。\n证人虽狼狈，但对方律师的[color=#FFD700]证据链[/color]仍站得住脚——被告含冤入狱……" % [exposed, required]
			_objection_btn.disabled = true
			_next_btn.text = "查看判决"
			_next_btn.disabled = false


## 请求 AI 生成开庭词，3 秒超时回落预设
func _request_court_opening() -> void:
	var case_data: Dictionary = CaseManager.get_current_case()
	var witnesses: Array = CaseManager.get_witnesses()
	var wname: String = ""
	if not witnesses.is_empty():
		wname = witnesses[0].get("name", "证人")
	var defendant: String = CaseManager.get_defendant()
	# 3 秒超时保护，防止 AI 慢响应卡住玩家
	get_tree().create_timer(3.0).timeout.connect(_on_court_opening_timeout)
	AIService.generate_court_opening(case_data, wname, defendant)


## AI 开庭词生成成功
func _on_court_opening_received(content: String) -> void:
	if _opening_resolved:
		return
	if CourtSystem.get_phase() != CourtSystem.Phase.OPENING:
		return
	if content.strip_edges() == "":
		_on_court_opening_failed("AI 返回空内容")
		return
	_opening_resolved = true
	_start_typewriter(content)


## AI 开庭词生成失败 → 回落预设
func _on_court_opening_failed(error: String) -> void:
	if _opening_resolved:
		return
	if CourtSystem.get_phase() != CourtSystem.Phase.OPENING:
		return
	print("[CourtTrial] 开庭词 AI 生成失败，回落预设: %s" % error)
	_opening_resolved = true
	_start_typewriter(CourtSystem.get_opening_statement())


## AI 超时保护：3 秒未响应回落预设
func _on_court_opening_timeout() -> void:
	if _opening_resolved:
		return
	if CourtSystem.get_phase() != CourtSystem.Phase.OPENING:
		return
	if _typewriter_active:
		return  # 已经在打字了，AI 已响应
	print("[CourtTrial] 开庭词 AI 超时 3 秒，回落预设")
	_on_court_opening_failed("AI 响应超时")


## 显示当前重放句子
func _show_current_line() -> void:
	var line: Dictionary = CourtSystem.get_current_line()
	if line.is_empty():
		_check_cross_exam_end()
		return

	_speaker_label.text = "证人 · 王保安（重放证词）"
	var idx: int = CourtSystem.current_line_index + 1
	var total: int = CourtSystem.get_replay_lines().size()
	var prefix: String = "[color=#888888]第 %d / %d 句 —— 点击 [异议] 用疑点反驳，或 [下一句] 跳过：[/color]\n\n" % [idx, total]
	_content_text.text = prefix + line.get("text", "")
	_objection_btn.disabled = not line.get("objectionable", false)
	_next_btn.text = "下一句"
	_next_btn.disabled = false
	_showing_emotion = false


## 异议按钮：弹出疑点选择
func _on_objection_pressed() -> void:
	if CourtSystem.get_phase() != CourtSystem.Phase.CROSS_EXAMINATION:
		return
	if _showing_emotion:
		return
	_show_suspect_selector()


## 第一步：弹出疑点选择弹窗
func _show_suspect_selector() -> void:
	var suspects: Array = GameState.get_suspects()
	if suspects.is_empty():
		_content_text.append_text("\n\n[color=red][你还没有找到任何疑点，无法提出异议！请在审讯阶段搜集疑点。][/color]")
		return

	var dialog: AcceptDialog = AcceptDialog.new()
	dialog.title = "第一步：选择一个疑点"
	dialog.ok_button_text = "取消"

	var vbox: VBoxContainer = VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 8)

	for s in suspects:
		var btn: Button = Button.new()
		var desc: String = s.get("description", "疑点")
		if desc.length() > 45:
			desc = desc.substr(0, 45) + "..."
		btn.text = desc
		btn.alignment = HORIZONTAL_ALIGNMENT_LEFT
		btn.custom_minimum_size = Vector2(0, 42)
		btn.add_theme_font_size_override("font_size", 13)
		btn.add_theme_color_override("font_color", Color(0.94, 0.92, 0.86, 1))
		var suspect: Dictionary = s
		btn.pressed.connect(func():
			dialog.queue_free()
			_show_evidence_selector(suspect)
		)
		vbox.add_child(btn)

	dialog.add_child(vbox)
	add_child(dialog)
	dialog.popup_centered(Vector2i(520, 420))


## 第二步：弹出证据选择弹窗（玩家当庭出示证据支持该疑点）
func _show_evidence_selector(suspect: Dictionary) -> void:
	var evidence_list: Array = CaseManager.get_evidence()
	if evidence_list.is_empty():
		_content_text.append_text("\n\n[color=red][没有可出示的证据！][/color]")
		return

	var dialog: AcceptDialog = AcceptDialog.new()
	dialog.title = "第二步：出示证据支持异议"
	dialog.ok_button_text = "取消"

	var vbox: VBoxContainer = VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 8)

	for ev in evidence_list:
		var btn: Button = Button.new()
		btn.text = ev.get("name", "?")
		btn.alignment = HORIZONTAL_ALIGNMENT_LEFT
		btn.custom_minimum_size = Vector2(0, 42)
		btn.add_theme_font_size_override("font_size", 13)
		btn.add_theme_color_override("font_color", Color(0.93, 0.81, 0.67, 1))
		var evidence_id: String = ev.get("id", "")
		btn.pressed.connect(func():
			dialog.queue_free()
			_resolve_objection(suspect, evidence_id)
		)
		vbox.add_child(btn)

	dialog.add_child(vbox)
	add_child(dialog)
	dialog.popup_centered(Vector2i(520, 420))


## 解析异议结果（疑点+证据双重匹配）
func _resolve_objection(suspect: Dictionary, evidence_id: String) -> void:
	var result: Dictionary = CourtSystem.object_line(suspect, evidence_id)
	_content_text.append_text("\n\n[color=#E94560][异议][/color] " + result.get("message", ""))

	if result.get("success", false):
		_showing_emotion = true
		var emotion: String = result.get("emotion", "")
		if emotion != "":
			_content_text.append_text("\n\n[color=#FF9500]【证人反应】[/color] " + emotion)
		_objection_btn.disabled = true
		_next_btn.text = "继续"
		_next_btn.disabled = false

	_update_ai_panel()


## 下一句/继续按钮
func _on_next_pressed() -> void:
	match CourtSystem.get_phase():
		CourtSystem.Phase.OPENING:
			# 打字机未完成时，点继续可跳过打字机直接显示全文
			if _typewriter_active:
				_finish_typewriter_immediately()
				return
			_enter_phase(CourtSystem.Phase.STATEMENTS)

		CourtSystem.Phase.STATEMENTS:
			_enter_phase(CourtSystem.Phase.CROSS_EXAMINATION)

		CourtSystem.Phase.CROSS_EXAMINATION:
			if _showing_emotion:
				# 刚看完情绪反应
				_showing_emotion = false
				# 已点出全部 → 进入崩溃
				if GameState.exposed_contradictions.size() >= CourtSystem.get_required_exposed():
					_enter_phase(CourtSystem.Phase.WITNESS_BREAKDOWN)
					return
				# 否则推进下一句
				if not CourtSystem.next_line():
					_check_cross_exam_end()
					return
				_show_current_line()
			else:
				# 下一句
				if not CourtSystem.next_line():
					_check_cross_exam_end()
					return
				_show_current_line()

		CourtSystem.Phase.WITNESS_BREAKDOWN:
			_enter_phase(CourtSystem.Phase.TRUTH_REVEAL)

		CourtSystem.Phase.TRUTH_REVEAL:
			_enter_phase(CourtSystem.Phase.VICTORY)

		CourtSystem.Phase.VICTORY:
			SceneManager.change_scene("verdict")

		CourtSystem.Phase.DEFEAT:
			SceneManager.change_scene("verdict")

		_:
			pass


## 质询阶段句子过完时的判定
func _check_cross_exam_end() -> void:
	var result: String = CourtSystem.get_cross_exam_result()
	if result == "win":
		_enter_phase(CourtSystem.Phase.WITNESS_BREAKDOWN)
	else:
		_enter_phase(CourtSystem.Phase.DEFEAT)


## 启动打字机
func _start_typewriter(text: String) -> void:
	_typewriter_text = text
	_typewriter_index = 0
	_content_text.text = ""
	_typewriter_active = true
	if _type_timer == null:
		_type_timer = Timer.new()
		_type_timer.wait_time = 0.045
		_type_timer.timeout.connect(_on_type_tick)
		add_child(_type_timer)
	_type_timer.start()


## 打字机逐字回调
func _on_type_tick() -> void:
	_typewriter_index += 1
	if _typewriter_index >= _typewriter_text.length():
		_finish_typewriter_immediately()
	else:
		_content_text.text = _typewriter_text.substr(0, _typewriter_index)


## 打字机立即结束（玩家点继续跳过 / 自然完成）
func _finish_typewriter_immediately() -> void:
	_typewriter_active = false
	if _type_timer != null:
		_type_timer.stop()
	_content_text.text = _typewriter_text

	# 根据当前阶段决定后续动作
	match CourtSystem.get_phase():
		CourtSystem.Phase.OPENING:
			# 开庭词打完，启用继续按钮，等玩家点继续进入 STATEMENTS
			_next_btn.disabled = false
			_content_text.append_text("\n\n[color=#888888]（点击 [继续] 进入双方陈词）[/color]")

		CourtSystem.Phase.VICTORY:
			# 真相陈述完毕，显示胜利手势
			_content_text.append_text("\n\n[color=#FFD700][b]" + CourtSystem.get_victory_pose() + "[/b][/color]")
			_content_text.append_text("\n[color=#7CFC00]（你以经典的指认手势直指证人席——真相大白，真凶伏法！）[/color]")
			_next_btn.disabled = false


## 更新 AI 助手面板（仅右侧 AI 软提示，不显示数字状态条）
func _update_ai_panel() -> void:
	var exposed: int = GameState.exposed_contradictions.size()
	var required: int = CourtSystem.get_required_exposed()
	if _ai_panel.has_method("update_status"):
		_ai_panel.update_status(exposed, required)
	if GameState.testimony_db.size() > 0:
		AIService.analyze_evidence(GameState.testimony_db, CaseManager.get_evidence())
