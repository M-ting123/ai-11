extends RichTextLabel
## TypewriterLabel — 打字机文字效果（可复用组件）

signal typing_finished()

var _full_text: String = ""
var _char_index: int = 0
var _is_finished: bool = false


## 开始打字效果
func start_typing(text: String, speed: float = 0.03) -> void:
	self.text = ""
	_full_text = text
	_char_index = 0
	_is_finished = false
	_type_next(speed)


func _type_next(speed: float) -> void:
	if _char_index >= _full_text.length():
		_is_finished = true
		typing_finished.emit()
		return
	self.text += _full_text[_char_index]
	_char_index += 1
	get_tree().create_timer(speed).timeout.connect(_type_next.bind(speed), CONNECT_ONE_SHOT)


## 跳过动画，直接显示全文
func skip() -> void:
	self.text = _full_text
	_char_index = _full_text.length()
	if not _is_finished:
		_is_finished = true
		typing_finished.emit()
