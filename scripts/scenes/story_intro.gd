extends Control
## StoryIntro — 剧情黑场开场场景

@onready var _label: RichTextLabel = $TextContainer/ContentLabel
@onready var _hint: Label = $ClickHint

var _full_text: String = ""
var _char_index: int = 0
var _is_finished: bool = false


func _ready() -> void:
	_full_text = "[color=#E94560][b]案件编号：NO.2026-001[/b][/color]\n[b]被告[/b]：李明\n[b]罪名[/b]：故意杀人\n\n[color=#888888]————— 案情简述 —————[/color]\n\n深夜，某住宅小区。\n一名住户倒在血泊中，身旁的烟灰缸染满血迹。\n值班保安王保安「亲眼所见」——\n闯入者李明手持凶器，慌张逃离现场。\n\n证据看似确凿。\n证词看似无懈可击。\n\n但……真相，真的如此简单吗？\n\n[color=#888888]作为刚执业的辩护律师，这是你职业生涯的第一战。\n被告的命运，握在你的手中。[/color]\n\n[color=#E94560][b]——法庭，等你来逆转。[/b][/color]"
	_hint.visible = false
	_start_typing()


func _start_typing() -> void:
	_label.text = ""
	_char_index = 0
	_is_finished = false
	_type_next_char()


func _type_next_char() -> void:
	if _char_index >= _full_text.length():
		_is_finished = true
		_hint.visible = true
		return
	_label.text += _full_text[_char_index]
	_char_index += 1
	get_tree().create_timer(0.03).timeout.connect(_type_next_char, CONNECT_ONE_SHOT)


func _input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.pressed:
		if not _is_finished:
			_skip()
		else:
			SceneManager.change_scene("case_accept")


func _skip() -> void:
	_label.text = _full_text
	_char_index = _full_text.length()
	_is_finished = true
	_hint.visible = true
