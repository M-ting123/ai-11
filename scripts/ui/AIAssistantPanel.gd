extends Panel
## AIAssistantPanel — AI助手侧边面板（可复用组件）
## v0.7.2: 移除「局势评估 / 已揭穿矛盾」状态条——
## 玩家用审讯找的疑点直接异议即可，不需要数字提示进度

@onready var _hints_label: RichTextLabel = $VBoxContainer/HintsSection/HintsLabel
@onready var _suggestions_label: RichTextLabel = $VBoxContainer/SuggestionsSection/SuggestionsLabel


func _ready() -> void:
	pass


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
