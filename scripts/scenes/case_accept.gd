extends Control
## CaseAccept — 案件受理场景
## 加载案件数据后，以文件解封形式展示案件信息

@onready var _seal_container: Control = $SealContainer
@onready var _info_container: Control = $InfoContainer
@onready var _case_info_label: RichTextLabel = $InfoContainer/CaseInfoLabel
@onready var _enter_btn: Button = $EnterBtn


func _ready() -> void:
	_info_container.visible = false
	_enter_btn.visible = false
	_enter_btn.pressed.connect(_on_enter_pressed)
	_show_seal_animation()


func _show_seal_animation() -> void:
	# 加载关卡1数据
	CaseManager.load_case("case_01")
	# 2秒封印展示后展开
	get_tree().create_timer(2.0).timeout.connect(_reveal_case)


func _reveal_case() -> void:
	_seal_container.visible = false
	_info_container.visible = true
	_enter_btn.visible = true
	# 从CaseManager动态填充案件信息（不再硬编码）
	var title: String = CaseManager.get_title()
	var defendant: String = CaseManager.get_defendant()
	var desc: String = CaseManager.get_current_case().get("description", "")
	_case_info_label.text = "[color=#E94560]案件名称：[/color]%s\n[color=#E94560]被告：[/color]%s\n\n%s" % [title, defendant, desc]


func _on_enter_pressed() -> void:
	print("[CaseAccept] 进入调查")
	SceneManager.change_scene("evidence_board")
