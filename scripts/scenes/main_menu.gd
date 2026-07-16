extends Control
## MainMenu — 主菜单场景脚本

@onready var _new_game_btn: Button = $VBoxContainer/NewGameBtn
@onready var _continue_btn: Button = $VBoxContainer/ContinueBtn
@onready var _quit_btn: Button = $VBoxContainer/QuitBtn


func _ready() -> void:
	_new_game_btn.pressed.connect(_on_new_game_pressed)
	_continue_btn.pressed.connect(_on_continue_pressed)
	_quit_btn.pressed.connect(_on_quit_pressed)
	_continue_btn.disabled = true
	_continue_btn.modulate = Color(1, 1, 1, 0.4)


func _on_new_game_pressed() -> void:
	print("[MainMenu] 新游戏")
	SceneManager.change_scene("story_intro")


func _on_continue_pressed() -> void:
	print("[MainMenu] 继续游戏 — 功能未实现")


func _on_quit_pressed() -> void:
	print("[MainMenu] 退出游戏")
	get_tree().quit()
