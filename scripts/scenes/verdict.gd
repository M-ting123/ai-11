extends Control
## Verdict — 判决界面

@onready var _verdict_title: Label = $VerdictTitle
@onready var _result_label: Label = $ResultLabel
@onready var _stats_label: Label = $StatsLabel
@onready var _next_btn: Button = $Buttons/NextBtn
@onready var _menu_btn: Button = $Buttons/MenuBtn


func _ready() -> void:
	var verdict: String = GameState.get_verdict()
	var text: String = CourtSystem.get_verdict_text()

	_verdict_title.text = {
		"win": "胜诉！",
		"partial": "部分胜诉",
		"lose": "败诉",
	}.get(verdict, "判决")

	_result_label.text = text

	_stats_label.text = "已揭穿矛盾：%d\n异议使用：%d次" % [
		GameState.get_exposed_count(),
		GameState.MAX_OBJECTIONS - GameState.objections_remaining,
	]

	_next_btn.pressed.connect(_on_next)
	_menu_btn.pressed.connect(_on_menu)


func _on_next() -> void:
	SceneManager.change_scene("main_menu")


func _on_menu() -> void:
	SceneManager.change_scene("main_menu")
