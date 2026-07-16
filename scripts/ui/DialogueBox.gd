extends Panel
## DialogueBox — 对话气泡（可复用组件）

signal option_selected(index: int)

@onready var _dialogue_text: RichTextLabel = $VBoxContainer/DialogueText
@onready var _options_container: VBoxContainer = $VBoxContainer/OptionsContainer


func set_dialogue(text: String) -> void:
	_dialogue_text.text = text


func append_text(text: String) -> void:
	_dialogue_text.text += "\n" + text


func set_options(options: Array) -> void:
	_clear_options()
	for i in range(options.size()):
		var btn: Button = Button.new()
		btn.text = "%d. %s" % [i + 1, options[i]]
		btn.alignment = HORIZONTAL_ALIGNMENT_LEFT
		btn.pressed.connect(_on_option_pressed.bind(i))
		_options_container.add_child(btn)


func _clear_options() -> void:
	for child in _options_container.get_children():
		child.queue_free()


func _on_option_pressed(index: int) -> void:
	option_selected.emit(index)
