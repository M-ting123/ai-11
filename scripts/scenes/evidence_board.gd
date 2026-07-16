extends Control
## EvidenceBoard — 简化稳定版：GridContainer 自动排列 + Line2D 节点连线
##
## 进入时显示档案袋封面，2秒后打开显示证据卡片
## 点击两张证据卡片建立连线，发现矛盾
## 左侧证据区 + 右侧 AI助手区（3:1比例）

@onready var _evidence_panel: Control = $HSplitContainer/EvidencePanel
@onready var _cards_container: GridContainer = $HSplitContainer/EvidencePanel/CardsContainer
@onready var _ai_panel: Panel = $HSplitContainer/AIAssistantPanel
@onready var _enter_btn: Button = $EnterCourtBtn
@onready var _folder_cover: Panel = $FolderCover

const CARD_SIZE: Vector2 = Vector2(280, 180)

var _cards: Array = []  # [{node, evidence_id}]
var _established_connections: Array = []
var _line_layer: Node2D
var _found_contradictions: Array = []
var _folder_opened: bool = false
var _open_countdown: float = 2.0
var _selected_for_connect: int = -1


func _ready() -> void:
	set_process(true)

	if _enter_btn != null:
		_enter_btn.pressed.connect(_on_enter_pressed)
		_enter_btn.visible = false

	_line_layer = Node2D.new()
	_line_layer.z_index = 10
	_evidence_panel.add_child(_line_layer)

	_load_evidence_cards()
	_restore_connections_from_game_state()
	_update_ai_panel()
	_show_initial_hint()

	if _folder_cover == null and get_node_or_null("FolderCover") == null:
		_folder_opened = true


## 档案袋打开完成
func _open_folder_now() -> void:
	if _folder_opened:
		return

	var folder_cover: Node = get_node_or_null("FolderCover")
	if folder_cover != null:
		folder_cover.visible = false
		folder_cover.modulate = Color(1, 1, 1, 0)
		get_tree().create_timer(0.5).timeout.connect(func():
			if is_instance_valid(folder_cover):
				folder_cover.queue_free()
		)
	elif _folder_cover != null:
		_folder_cover.visible = false
		_folder_cover.modulate = Color(1, 1, 1, 0)
		get_tree().create_timer(0.5).timeout.connect(func():
			if is_instance_valid(_folder_cover):
				_folder_cover.queue_free()
		)

	_folder_opened = true
	if _enter_btn != null:
		_enter_btn.visible = true


## 加载证据卡片到网格
func _load_evidence_cards() -> void:
	var evidence_list: Array = CaseManager.get_evidence()
	for ev in evidence_list:
		var card_idx: int = _cards.size()
		var card: Control = _create_card(ev, card_idx)
		_cards_container.add_child(card)
		_cards.append({
			"node": card,
			"evidence_id": ev.get("id", ""),
		})


## 创建一张证据卡片
func _create_card(evidence: Dictionary, idx: int) -> Control:
	var panel: Panel = Panel.new()
	panel.custom_minimum_size = CARD_SIZE
	panel.size = CARD_SIZE
	panel.mouse_filter = Control.MOUSE_FILTER_STOP
	panel.gui_input.connect(_on_card_gui_input.bind(idx))

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
	panel.add_theme_stylebox_override("panel", stylebox)

	var vbox: VBoxContainer = VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 6)
	vbox.set_anchors_preset(Control.PRESET_FULL_RECT)
	vbox.offset_left = 10
	vbox.offset_top = 10
	vbox.offset_right = -10
	vbox.offset_bottom = -10

	var name_label: Label = Label.new()
	name_label.text = evidence.get("name", "?")
	name_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	name_label.add_theme_font_size_override("font_size", 17)
	name_label.add_theme_color_override("font_color", Color(0.93, 0.81, 0.67, 1))
	vbox.add_child(name_label)

	var type_label: Label = Label.new()
	type_label.text = "[%s] 可信度%d" % [evidence.get("type", "物证"), evidence.get("credibility", 0)]
	type_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	type_label.add_theme_font_size_override("font_size", 13)
	type_label.add_theme_color_override("font_color", Color(0.7, 0.58, 0.47, 1))
	vbox.add_child(type_label)

	var desc_label: Label = Label.new()
	desc_label.text = evidence.get("description", "")
	desc_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	desc_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	desc_label.add_theme_font_size_override("font_size", 13)
	desc_label.add_theme_color_override("font_color", Color(0.82, 0.74, 0.65, 1))
	desc_label.size_flags_vertical = Control.SIZE_EXPAND_FILL
	vbox.add_child(desc_label)

	if evidence.get("forged", false):
		var forged_label: Label = Label.new()
		forged_label.text = "⚠ 疑似伪造"
		forged_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		forged_label.add_theme_font_size_override("font_size", 13)
		forged_label.add_theme_color_override("font_color", Color(1, 0.4, 0.3, 1))
		vbox.add_child(forged_label)

	panel.add_child(vbox)
	return panel


## 卡片点击事件
func _on_card_gui_input(event: InputEvent, idx: int) -> void:
	if not _folder_opened:
		return
	if event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT and event.pressed:
		_on_card_clicked(idx)


## 点击卡片：选中连线起点 / 完成连线
func _on_card_clicked(card_idx: int) -> void:
	if _selected_for_connect < 0:
		_selected_for_connect = card_idx
		_highlight_card(card_idx, true)
	else:
		if _selected_for_connect == card_idx:
			_highlight_card(_selected_for_connect, false)
			_selected_for_connect = -1
		else:
			_highlight_card(_selected_for_connect, false)
			_try_connect(_selected_for_connect, card_idx)
			_selected_for_connect = -1


## 高亮/取消高亮卡片
func _highlight_card(card_idx: int, highlighted: bool) -> void:
	if card_idx < 0 or card_idx >= _cards.size():
		return
	var card: Panel = _cards[card_idx].node
	if not is_instance_valid(card):
		return
	var stylebox: StyleBoxFlat = StyleBoxFlat.new()
	stylebox.bg_color = Color(0.32, 0.22, 0.18, 1)
	if highlighted:
		stylebox.border_color = Color(1, 0.85, 0.3, 1)
		stylebox.border_width_left = 4
		stylebox.border_width_right = 4
		stylebox.border_width_top = 4
		stylebox.border_width_bottom = 4
	else:
		stylebox.border_color = Color(0.55, 0.43, 0.38, 0.8)
		stylebox.border_width_left = 2
		stylebox.border_width_right = 2
		stylebox.border_width_top = 2
		stylebox.border_width_bottom = 2
	stylebox.corner_radius_top_left = 4
	stylebox.corner_radius_top_right = 4
	stylebox.corner_radius_bottom_left = 4
	stylebox.corner_radius_bottom_right = 4
	card.add_theme_stylebox_override("panel", stylebox)


## 尝试连接两张卡片
func _try_connect(from_idx: int, to_idx: int) -> void:
	var from_id: String = _cards[from_idx].evidence_id
	var to_id: String = _cards[to_idx].evidence_id

	for conn in _established_connections:
		if (conn["from_id"] == from_id and conn["to_id"] == to_id) or \
		   (conn["from_id"] == to_id and conn["to_id"] == from_id):
			_ai_panel.update_hints(["这两项已经连接过了。"])
			return

	var connections: Array = CaseManager.get_connections()
	var matched: bool = false
	for preset in connections:
		var p_from: String = preset.get("from", "")
		var p_to: String = preset.get("to", "")
		if (p_from == from_id and p_to == to_id) or (p_from == to_id and p_to == from_id):
			matched = true
			var contradiction_id: String = ""
			var result: String = preset.get("result", "")
			if result.begins_with("unlock_contradiction_"):
				contradiction_id = result.replace("unlock_contradiction_", "")
				if contradiction_id not in _found_contradictions:
					_found_contradictions.append(contradiction_id)
					GameState.expose_contradiction(contradiction_id)

			_established_connections.append({
				"from_id": from_id,
				"to_id": to_id,
				"from_idx": from_idx,
				"to_idx": to_idx,
			})
			GameState.add_connection(from_id, to_id, contradiction_id)
			_draw_connection_line(from_idx, to_idx)
			_on_connection_matched(preset, contradiction_id)
			break

	if not matched:
		_ai_panel.update_hints(["这个关联不太对，再想想？"])
		_ai_panel.update_suggestions(["尝试把时间相关的证据和证词连起来"])

	_update_ai_panel()


func _on_connection_matched(preset: Dictionary, contradiction_id: String) -> void:
	if contradiction_id != "":
		var contradiction: Dictionary = CaseManager.get_contradiction_by_id(contradiction_id)
		var desc: String = contradiction.get("description", "发现一个矛盾点")
		_ai_panel.update_hints(["✓ 连线成功！" + desc])
		_ai_panel.update_suggestions(["进入传唤询问，向证人核实这个矛盾"])
	else:
		_ai_panel.update_hints(["✓ 连线成功！"] )


## 用 Line2D 节点绘制一条连线（不使用 to_local）
func _draw_connection_line(from_idx: int, to_idx: int) -> void:
	var from_card: Control = _cards[from_idx].node
	var to_card: Control = _cards[to_idx].node
	if not is_instance_valid(from_card) or not is_instance_valid(to_card):
		return

	var from_pos: Vector2 = from_card.global_position + from_card.size / 2
	var to_pos: Vector2 = to_card.global_position + to_card.size / 2
	# 手动计算本地坐标，避免 Control.to_local 在某些运行时不可用
	var local_from: Vector2 = from_pos - _line_layer.global_position
	var local_to: Vector2 = to_pos - _line_layer.global_position

	var line: Line2D = Line2D.new()
	line.width = 3.5
	line.default_color = Color(0.91, 0.27, 0.38, 0.9)
	line.points = PackedVector2Array([local_from, local_to])
	_line_layer.add_child(line)


## 从 GameState 恢复已保存的连线
func _restore_connections_from_game_state() -> void:
	for conn in GameState.connection_db:
		var from_id: String = conn.get("from_id", "")
		var to_id: String = conn.get("to_id", "")
		var from_idx: int = _find_card_idx_by_evidence_id(from_id)
		var to_idx: int = _find_card_idx_by_evidence_id(to_id)
		if from_idx < 0 or to_idx < 0:
			continue
		var already: bool = false
		for ec in _established_connections:
			if (ec["from_id"] == from_id and ec["to_id"] == to_id) or \
			   (ec["from_id"] == to_id and ec["to_id"] == from_id):
				already = true
				break
		if already:
			continue
		_established_connections.append({
			"from_id": from_id,
			"to_id": to_id,
			"from_idx": from_idx,
			"to_idx": to_idx,
		})
		_draw_connection_line(from_idx, to_idx)
		var contradiction_id: String = conn.get("contradiction_id", "")
		if contradiction_id != "" and contradiction_id not in _found_contradictions:
			_found_contradictions.append(contradiction_id)


func _find_card_idx_by_evidence_id(ev_id: String) -> int:
	for i in range(_cards.size()):
		if _cards[i].evidence_id == ev_id:
			return i
	return -1


func _show_initial_hint() -> void:
	if _ai_panel == null:
		return
	_ai_panel.update_hints(["点击两张证据卡片建立连线"])
	_ai_panel.update_suggestions(["把时间相关的证据和证词连起来"])


func _update_ai_panel() -> void:
	if _ai_panel == null:
		return
	var exposed: int = GameState.exposed_contradictions.size()
	var target: int = CaseManager.get_required_contradictions()
	_ai_panel.update_status(exposed, target)


func _process(delta: float) -> void:
	if not _folder_opened:
		_open_countdown -= delta
		if _open_countdown <= 0.0:
			_open_folder_now()
		return

	var folder_cover: Node = get_node_or_null("FolderCover")
	if folder_cover != null and folder_cover.visible:
		folder_cover.visible = false
		folder_cover.modulate = Color(1, 1, 1, 0)


func _on_enter_pressed() -> void:
	if not _folder_opened:
		_open_folder_now()
	SceneManager.change_scene("witness_interrogation")
