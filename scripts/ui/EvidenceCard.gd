extends Panel
class_name EvidenceCard
## EvidenceCard — 证据卡片（可复用组件）

signal card_clicked(card: EvidenceCard)
signal drag_started(card: EvidenceCard)
signal drag_ended(card: EvidenceCard)

var evidence_id: String = ""
var evidence_name: String = ""
var evidence_desc: String = ""


func setup(id: String, name: String, desc: String) -> void:
	evidence_id = id
	evidence_name = name
	evidence_desc = desc

	if has_node("VBoxContainer/NameLabel"):
		$VBoxContainer/NameLabel.text = name
	if has_node("VBoxContainer/DescLabel"):
		$VBoxContainer/DescLabel.text = desc


func _gui_input(event: InputEvent) -> void:
	if event is InputEventMouseButton:
		if event.button_index == MOUSE_BUTTON_LEFT:
			if event.pressed:
				drag_started.emit(self)
				card_clicked.emit(self)
			else:
				drag_ended.emit(self)
