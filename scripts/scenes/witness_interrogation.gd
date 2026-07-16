extends Control
## WitnessInterrogation — 审讯证人场景（v0.7 玩法重做）
##
## 核心玩法：找疑点
## 1. 选提问方向 → 选具体问题 → AI/预设回答
## 2. 点[整理] → 当前证词变卡片 → 点击证词再点证据判定关系
## 3. 证词与证据矛盾 → 标记疑点；一致 → 正常；无关联 → 提示再试试
## 4. 右侧AI下方显示已找到的疑点列表

const EVIDENCE_CARD_WIDTH: float = 150.0
const EVIDENCE_CARD_HEIGHT: float = 45.0
const TESTIMONY_CARD_WIDTH: float = 220.0
const TESTIMONY_CARD_HEIGHT: float = 50.0

@onready var _connection_graph: Control = $TopSection/ConnectionGraph
@onready var _witness_name: Label = $BottomSection/WitnessPanel/WitnessVBox/WitnessName
@onready var _witness_status: Label = $BottomSection/WitnessPanel/WitnessVBox/WitnessStatus
@onready var _dialogue_text: RichTextLabel = $BottomSection/DialoguePanel/DialogueVBox/DialogueText
@onready var _direction_container: HBoxContainer = $BottomSection/DialoguePanel/DialogueVBox/DirectionContainer
@onready var _question_container: VBoxContainer = $BottomSection/DialoguePanel/DialogueVBox/QuestionContainer
@onready var _doubt_btn: Button = $BottomSection/DialoguePanel/DialogueVBox/ButtonBar/DoubtBtn
@onready var _organize_btn: Button = $BottomSection/DialoguePanel/DialogueVBox/ButtonBar/OrganizeBtn
@onready var _enter_court_btn: Button = $BottomSection/DialoguePanel/DialogueVBox/ButtonBar/EnterCourtBtn
@onready var _ai_panel: Panel = $BottomSection/RightPanel/AIAssistantPanel
@onready var _suspect_list: VBoxContainer = $BottomSection/RightPanel/SuspectListPanel/SuspectListVBox/SuspectList

var _current_witness: Dictionary = {}
var _witness_index: int = 0

# 当前选中的问题数据
var _current_question: Dictionary = {}
var _current_answer: String = ""

# 上方连线区状态
var _evidence_buttons: Dictionary = {}  # {evidence_id: Button}
var _testimony_cards: Array = []  # [{button, question_id, question_text, answer, evidence_relations}]
var _selected_testimony_idx: int = -1
var _testimony_connections: Array = []  # [{from_idx, to_evidence_id, relation, color}]
var _connect_mode: bool = false  # 是否在连线模式（点[整理]后）


func _ready() -> void:
	# 连线图绘制
	_connection_graph.draw.connect(_draw_connections)

	# 按钮信号
	_doubt_btn.pressed.connect(_on_doubt_pressed)
	_organize_btn.pressed.connect(_on_organize_pressed)
	_enter_court_btn.pressed.connect(_on_enter_court)

	# AI信号（用于真实AI调用，骨架阶段用预设回答）
	AIService.witness_chat_completed.connect(_on_witness_response)
	AIService.witness_chat_failed.connect(_on_witness_error)
	AIService.assistant_analysis_completed.connect(_on_analysis_completed)

	# 等待一帧让布局完成
	await get_tree().process_frame
	_load_witness()
	_create_evidence_cards()
	_update_ai_panel()


## 加载证人，显示提问方向
func _load_witness() -> void:
	var witnesses: Array = CaseManager.get_witnesses()
	if _witness_index >= witnesses.size():
		_dialogue_text.text = "所有证人已询问完毕。点击[进入法庭]继续。"
		return

	_current_witness = witnesses[_witness_index]
	_witness_name.text = _current_witness.get("name", "?")
	_witness_status.text = "状态：在场"

	# 显示初始证词
	var testimony: String = _current_witness.get("testimony", "")
	if testimony != "":
		_dialogue_text.text = "[color=#E94560][" + _current_witness.get("name", "证人") + "]：[/color]" + testimony

	_show_directions()


## 显示提问方向按钮
func _show_directions() -> void:
	for child in _direction_container.get_children():
		child.queue_free()

	var directions: Array = _current_witness.get("question_directions", [])
	for dir in directions:
		var btn: Button = Button.new()
		btn.text = dir.get("label", "?")
		btn.custom_minimum_size = Vector2(120, 40)
		btn.add_theme_font_size_override("font_size", 15)
		btn.add_theme_color_override("font_color", Color(0.93, 0.81, 0.67, 1))
		btn.pressed.connect(_on_direction_pressed.bind(dir.get("id", "")))
		_direction_container.add_child(btn)


## 选了方向，显示该方向下的问题
func _on_direction_pressed(direction_id: String) -> void:
	for child in _question_container.get_children():
		child.queue_free()

	var questions: Array = CaseManager.get_questions_by_direction(_current_witness.get("id", ""), direction_id)
	for q in questions:
		var btn: Button = Button.new()
		btn.text = q.get("text", "?")
		btn.alignment = HORIZONTAL_ALIGNMENT_LEFT
		btn.custom_minimum_size = Vector2(0, 38)
		btn.add_theme_font_size_override("font_size", 14)
		btn.add_theme_color_override("font_color", Color(0.9, 0.9, 0.9, 1))
		btn.pressed.connect(_on_question_pressed.bind(q))
		_question_container.add_child(btn)


## 选了问题，显示回答
func _on_question_pressed(question: Dictionary) -> void:
	_current_question = question
	_current_answer = question.get("answer", "（无回答）")

	# 显示玩家提问和证人回答
	var q_text: String = question.get("text", "")
	_dialogue_text.text = ""
	_dialogue_text.append_text("[color=#7CFC00][你]：[/color]" + q_text)
	_dialogue_text.append_text("\n\n[color=#E94560][" + _current_witness.get("name", "证人") + "]：[/color]" + _current_answer)

	# 启用整理和疑问按钮
	_doubt_btn.disabled = false
	_organize_btn.disabled = false

	# 记录到证词库
	var question_id: String = question.get("id", "")
	GameState.add_testimony(_current_witness.get("id", ""), q_text, _current_answer, question.has("unlocks_contradiction"))

	# AI软提示：如果该问题有矛盾关系，提示玩家
	var has_contradiction: bool = false
	for rel in question.get("evidence_relations", []):
		if rel.get("relation", "") == "contradiction":
			has_contradiction = true
			break
	if has_contradiction:
		_ai_panel.update_hints(["好像有些矛盾？点击[整理]连线证据试试"])
		_ai_panel.update_suggestions(["把证词和证据连起来，矛盾的连接就是疑点"])
	else:
		_ai_panel.update_hints(["这条证词看起来没有明显矛盾"])
		_ai_panel.update_suggestions(["试试问其他方向的问题"])

	print("[WitnessInterrogation] 问题已选: %s, 有矛盾: %s" % [question_id, has_contradiction])


## 点[整理]：当前证词变卡片，进入连线模式
func _on_organize_pressed() -> void:
	if _current_question.is_empty():
		return

	var question_id: String = _current_question.get("id", "")
	# 检查是否已整理过这个问题
	for tc in _testimony_cards:
		if tc["question_id"] == question_id:
			_dialogue_text.append_text("\n\n[color=yellow]这条证词已经整理过了。[/color]")
			return

	# 创建证词卡片
	var card_idx: int = _testimony_cards.size()
	var btn: Button = Button.new()
	btn.text = _current_question.get("text", "?").substr(0, 15) + "..."
	btn.custom_minimum_size = Vector2(TESTIMONY_CARD_WIDTH, TESTIMONY_CARD_HEIGHT)
	btn.add_theme_font_size_override("font_size", 12)

	# 橙红色边框样式（区分于证据卡片）
	var stylebox: StyleBoxFlat = StyleBoxFlat.new()
	stylebox.bg_color = Color(0.4, 0.2, 0.15, 1)
	stylebox.border_color = Color(1, 0.55, 0.3, 1)
	stylebox.border_width_left = 3
	stylebox.border_width_right = 3
	stylebox.border_width_top = 3
	stylebox.border_width_bottom = 3
	stylebox.corner_radius_top_left = 4
	stylebox.corner_radius_top_right = 4
	stylebox.corner_radius_bottom_left = 4
	stylebox.corner_radius_bottom_right = 4
	btn.add_theme_stylebox_override("normal", stylebox)
	btn.add_theme_stylebox_override("hover", stylebox)
	btn.add_theme_stylebox_override("pressed", stylebox)

	btn.pressed.connect(_on_testimony_card_pressed.bind(card_idx))
	_connection_graph.add_child(btn)

	# 证词卡片位置：下方一行排列
	var graph_size: Vector2 = _connection_graph.size
	var x: float = 30.0 + card_idx * (TESTIMONY_CARD_WIDTH + 20.0)
	var y: float = graph_size.y - TESTIMONY_CARD_HEIGHT - 10.0
	btn.position = Vector2(x, y)
	btn.size = Vector2(TESTIMONY_CARD_WIDTH, TESTIMONY_CARD_HEIGHT)

	_testimony_cards.append({
		"button": btn,
		"question_id": question_id,
		"question_text": _current_question.get("text", ""),
		"answer": _current_answer,
		"evidence_relations": _current_question.get("evidence_relations", []),
		"unlocks_contradiction": _current_question.get("unlocks_contradiction", ""),
	})

	_connect_mode = true
	_dialogue_text.append_text("\n\n[color=yellow][整理中] 证词已变卡片。点击证词卡片选中，再点击证据卡片判定关系。[/color]")
	print("[WitnessInterrogation] 证词卡片已创建: %s, 进入连线模式" % question_id)


## 点[疑问]：直接标记当前证词为可疑
func _on_doubt_pressed() -> void:
	if _current_question.is_empty():
		return
	_dialogue_text.append_text("\n\n[color=#FF9500][疑问] 你觉得这条证词有问题。点击[整理]连线证据来确认疑点。[/color]")
	_ai_panel.update_hints(["点击[整理]把证词变卡片，连线证据确认矛盾"])
	print("[WitnessInterrogation] 标记疑问: %s" % _current_question.get("id", ""))


## 证词卡片被点击：选中/取消选中
func _on_testimony_card_pressed(card_idx: int) -> void:
	if not _connect_mode:
		return
	if _selected_testimony_idx == card_idx:
		# 取消选中
		_selected_testimony_idx = -1
		_highlight_testimony_card(card_idx, false)
		_dialogue_text.append_text("\n[color=gray]取消选中[/color]")
	else:
		# 取消之前的选中
		if _selected_testimony_idx >= 0:
			_highlight_testimony_card(_selected_testimony_idx, false)
		_selected_testimony_idx = card_idx
		_highlight_testimony_card(card_idx, true)
		_dialogue_text.append_text("\n[color=yellow]证词已选中，点击证据卡片判定关系[/color]")
	_connection_graph.queue_redraw()


## 高亮/取消高亮证词卡片
func _highlight_testimony_card(card_idx: int, highlighted: bool) -> void:
	if card_idx < 0 or card_idx >= _testimony_cards.size():
		return
	var btn: Button = _testimony_cards[card_idx]["button"]
	var stylebox: StyleBoxFlat = StyleBoxFlat.new()
	if highlighted:
		stylebox.bg_color = Color(0.5, 0.3, 0.15, 1)
		stylebox.border_color = Color(1, 0.85, 0.3, 1)
		stylebox.border_width_left = 4
		stylebox.border_width_right = 4
		stylebox.border_width_top = 4
		stylebox.border_width_bottom = 4
	else:
		stylebox.bg_color = Color(0.4, 0.2, 0.15, 1)
		stylebox.border_color = Color(1, 0.55, 0.3, 1)
		stylebox.border_width_left = 3
		stylebox.border_width_right = 3
		stylebox.border_width_top = 3
		stylebox.border_width_bottom = 3
	stylebox.corner_radius_top_left = 4
	stylebox.corner_radius_top_right = 4
	stylebox.corner_radius_bottom_left = 4
	stylebox.corner_radius_bottom_right = 4
	btn.add_theme_stylebox_override("normal", stylebox)
	btn.add_theme_stylebox_override("hover", stylebox)
	btn.add_theme_stylebox_override("pressed", stylebox)


## 证据卡片被点击：判定证词-证据关系
func _on_evidence_card_pressed(evidence_id: String) -> void:
	if not _connect_mode or _selected_testimony_idx < 0:
		return

	var card_idx: int = _selected_testimony_idx
	var testimony: Dictionary = _testimony_cards[card_idx]
	var relations: Array = testimony.get("evidence_relations", [])

	# 查找该证据的关系
	var relation: String = ""
	var hint: String = ""
	var unlocks_contradiction: String = ""
	for rel in relations:
		if rel.get("evidence_id", "") == evidence_id:
			relation = rel.get("relation", "")
			hint = rel.get("hint", "")
			unlocks_contradiction = testimony.get("unlocks_contradiction", "")
			break

	# 检查是否已连过
	for conn in _testimony_connections:
		if conn["from_idx"] == card_idx and conn["to_evidence_id"] == evidence_id:
			_dialogue_text.append_text("\n[color=gray]这条证词和这个证据已经连过了。[/color]")
			return

	if relation == "contradiction":
		# 矛盾！标记疑点
		var contradiction_id: String = unlocks_contradiction
		var desc: String = hint
		if contradiction_id != "":
			var contradiction: Dictionary = CaseManager.get_contradiction_by_id(contradiction_id)
			desc = contradiction.get("description", hint)
			# v0.7: 审讯只记录疑点（法庭弹药），法庭异议时才 expose_contradiction 点出矛盾
			GameState.add_suspect(testimony["question_id"], evidence_id, contradiction_id, desc)
		else:
			GameState.add_suspect(testimony["question_id"], evidence_id, "", desc)

		_testimony_connections.append({
			"from_idx": card_idx,
			"to_evidence_id": evidence_id,
			"relation": "contradiction",
			"color": Color(0.91, 0.27, 0.38, 0.9),
		})
		_dialogue_text.append_text("\n[color=#E94560]✓ 疑点已找到！" + desc + "[/color]")
		_update_suspect_list()
		_highlight_testimony_card(card_idx, false)
		_selected_testimony_idx = -1
		_ai_panel.update_hints(["✓ 疑点已确认！" + desc])
		_ai_panel.update_suggestions(["继续询问其他问题找更多疑点"])
		print("[WitnessInterrogation] 疑点确认: %s <-> %s" % [testimony["question_id"], evidence_id])

	elif relation == "consistent":
		# 一致，正常
		_testimony_connections.append({
			"from_idx": card_idx,
			"to_evidence_id": evidence_id,
			"relation": "consistent",
			"color": Color(0.3, 0.8, 0.4, 0.8),
		})
		var hint_text: String = ""
		if hint != "":
			hint_text = "(" + hint + ")"
		_dialogue_text.append_text("\n[color=#7CFC00]✓ 证词与证据一致，正常。" + hint_text + "[/color]")
		print("[WitnessInterrogation] 证词一致: %s <-> %s" % [testimony["question_id"], evidence_id])

	else:
		# 无关联
		_dialogue_text.append_text("\n[color=gray]这个证据和这条证词似乎没有直接关系，再试试？[/color]")
		_ai_panel.update_hints(["这个关联不太对，试试其他证据"])

	_connection_graph.queue_redraw()


## 创建证据卡片（上方连线区，缩略可点击）
func _create_evidence_cards() -> void:
	_evidence_buttons.clear()
	var evidence_list: Array = CaseManager.get_evidence()
	var graph_size: Vector2 = _connection_graph.size
	var count: int = evidence_list.size()
	if count == 0:
		return

	# 均匀分布在画布顶部
	var total_width: float = count * EVIDENCE_CARD_WIDTH + (count - 1) * 20.0
	var start_x: float = max(20.0, (graph_size.x - total_width) / 2.0)

	for i in range(count):
		var ev: Dictionary = evidence_list[i]
		var ev_id: String = ev.get("id", "")
		var btn: Button = Button.new()
		btn.text = ev.get("name", "?")
		btn.custom_minimum_size = Vector2(EVIDENCE_CARD_WIDTH, EVIDENCE_CARD_HEIGHT)
		btn.add_theme_font_size_override("font_size", 12)

		# 棕色样式（证据卡片）
		var stylebox: StyleBoxFlat = StyleBoxFlat.new()
		stylebox.bg_color = Color(0.32, 0.22, 0.18, 1)
		stylebox.border_color = Color(0.55, 0.43, 0.38, 0.8)
		stylebox.border_width_left = 2
		stylebox.border_width_right = 2
		stylebox.border_width_top = 2
		stylebox.border_width_bottom = 2
		stylebox.corner_radius_top_left = 4
		stylebox.corner_radius_top_right = 4
		stylebox.corner_radius_bottom_left = 4
		stylebox.corner_radius_bottom_right = 4
		btn.add_theme_stylebox_override("normal", stylebox)
		btn.add_theme_stylebox_override("hover", stylebox)
		btn.add_theme_stylebox_override("pressed", stylebox)

		btn.pressed.connect(_on_evidence_card_pressed.bind(ev_id))
		_connection_graph.add_child(btn)
		btn.position = Vector2(start_x + i * (EVIDENCE_CARD_WIDTH + 20.0), 10.0)
		btn.size = Vector2(EVIDENCE_CARD_WIDTH, EVIDENCE_CARD_HEIGHT)
		_evidence_buttons[ev_id] = btn


## 绘制证词-证据连线
func _draw_connections() -> void:
	for conn in _testimony_connections:
		var from_idx: int = conn["from_idx"]
		if from_idx < 0 or from_idx >= _testimony_cards.size():
			continue
		var from_btn: Button = _testimony_cards[from_idx]["button"]
		var to_btn: Button = _evidence_buttons.get(conn["to_evidence_id"], null)
		if not is_instance_valid(from_btn) or not is_instance_valid(to_btn):
			continue

		var from_pos: Vector2 = from_btn.position + from_btn.size / 2
		var to_pos: Vector2 = to_btn.position + to_btn.size / 2
		var color: Color = conn["color"]

		_connection_graph.draw_line(from_pos, to_pos, color, 3.0, true)
		_connection_graph.draw_circle(from_pos, 5.0, color)
		# 箭头
		var direction: Vector2 = (to_pos - from_pos).normalized()
		if direction != Vector2.ZERO:
			var perp: Vector2 = Vector2(-direction.y, direction.x)
			var arrow_size: float = 14.0
			var p1: Vector2 = to_pos
			var p2: Vector2 = to_pos - direction * arrow_size + perp * arrow_size * 0.5
			var p3: Vector2 = to_pos - direction * arrow_size - perp * arrow_size * 0.5
			_connection_graph.draw_colored_polygon(PackedVector2Array([p1, p2, p3]), color)

	# 选中证词时画临时连线到鼠标
	if _connect_mode and _selected_testimony_idx >= 0:
		var from_btn: Button = _testimony_cards[_selected_testimony_idx]["button"]
		if is_instance_valid(from_btn):
			var from_pos: Vector2 = from_btn.position + from_btn.size / 2
			var mouse_local: Vector2 = _connection_graph.get_local_mouse_position()
			_connection_graph.draw_line(from_pos, mouse_local, Color(1, 0.85, 0.3, 0.5), 2.0, true)


## 更新右侧疑点列表
func _update_suspect_list() -> void:
	for child in _suspect_list.get_children():
		child.queue_free()

	var suspects: Array = GameState.get_suspects()
	if suspects.is_empty():
		var placeholder: Label = Label.new()
		placeholder.text = "（暂未发现疑点）"
		placeholder.add_theme_font_size_override("font_size", 13)
		placeholder.add_theme_color_override("font_color", Color(0.6, 0.5, 0.45, 1))
		_suspect_list.add_child(placeholder)
		return

	for i in range(suspects.size()):
		var s: Dictionary = suspects[i]
		var label: Label = Label.new()
		var desc: String = s.get("description", "疑点")
		if desc.length() > 30:
			desc = desc.substr(0, 30) + "..."
		label.text = "✓ 疑点%d: %s" % [i + 1, desc]
		label.add_theme_font_size_override("font_size", 12)
		label.add_theme_color_override("font_color", Color(1, 0.7, 0.4, 1))
		label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		_suspect_list.add_child(label)


func _on_witness_response(response: String) -> void:
	# 真实AI回答时替换预设回答（骨架阶段用预设，AI可用时增强）
	if not _current_question.is_empty() and response != "":
		_current_answer = response
		_dialogue_text.text = ""
		_dialogue_text.append_text("[color=#7CFC00][你]：[/color]" + _current_question.get("text", ""))
		_dialogue_text.append_text("\n\n[color=#E94560][" + _current_witness.get("name", "证人") + "]：[/color]" + response)


func _on_witness_error(error: String) -> void:
	_dialogue_text.append_text("\n\n[color=red][系统]：AI响应失败，使用预设回答 — [/color]" + error)


func _on_analysis_completed(analysis: Dictionary) -> void:
	_ai_panel.update_hints(analysis.get("hints", []))
	_ai_panel.update_suggestions(analysis.get("suggestions", []))
	_update_ai_panel()


func _update_ai_panel() -> void:
	# v0.7: 统一用 suspects_db 计数（和 _on_enter_court 判定一致）
	var suspect_count: int = GameState.get_suspects().size()
	var target: int = CaseManager.get_required_contradictions()
	_ai_panel.update_status(suspect_count, target)
	_update_suspect_list()


var _confirm_enter_court: bool = false

func _on_enter_court() -> void:
	var suspect_count: int = GameState.get_suspects().size()
	var target: int = CaseManager.get_required_contradictions()
	print("[WitnessInterrogation] 进入法庭，已找到疑点%d/%d" % [suspect_count, target])
	if suspect_count < target and not _confirm_enter_court:
		_confirm_enter_court = true
		_dialogue_text.append_text("\n\n[color=yellow]提示：你只找到%d个疑点，需要%d个才能在法庭胜诉。再点一次[进入法庭]确认进入。[/color]" % [suspect_count, target])
		return
	SceneManager.change_scene("court_trial")
