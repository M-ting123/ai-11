extends Node
## SceneManager — 全局场景切换管理器（Autoload单例）
##
## 职责：
## - 持有场景路径映射表
## - 提供 change_scene() 统一入口
## - 通过 CanvasLayer + ColorRect + Tween 实现黑屏 fade 过渡
## 所有场景切换必须走此入口，禁止散落的 get_tree().change_scene_to_file()

# ---- 场景路径映射表 ----
const SCENE_PATHS: Dictionary = {
	"main_menu": "res://scenes/main_menu.tscn",
	"story_intro": "res://scenes/story_intro.tscn",
	"case_accept": "res://scenes/case_accept.tscn",
	"evidence_board": "res://scenes/evidence_board.tscn",
	"witness_interrogation": "res://scenes/witness_interrogation.tscn",
	"court_trial": "res://scenes/court_trial.tscn",
	"verdict": "res://scenes/verdict.tscn",
	"ai_test": "res://scenes/ai_test.tscn",
}

# 过渡参数
const FADE_DURATION: float = 0.4
const FADE_COLOR: Color = Color(0.06, 0.06, 0.1, 1.0)  # #0F0F1A

# 过渡用的节点
var _fade_layer: CanvasLayer
var _fade_rect: ColorRect
var _is_transitioning: bool = false

# 排队等待切换的场景名（过渡中再次调用时排队）
var _queued_scene: StringName = &""


func _ready() -> void:
	# 创建 fade 过渡层（最高层级，覆盖一切）
	_fade_layer = CanvasLayer.new()
	_fade_layer.layer = 100
	add_child(_fade_layer)

	_fade_rect = ColorRect.new()
	_fade_rect.color = FADE_COLOR
	_fade_rect.set_anchors_preset(Control.PRESET_FULL_RECT)
	# 修复：初始设为 IGNORE，透明的 ColorRect 仍会拦截点击！
	# 只有过渡期间才设为 STOP 拦截，过渡结束恢复 IGNORE
	_fade_rect.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_fade_rect.modulate.a = 0.0  # 初始透明
	_fade_layer.add_child(_fade_rect)


## 切换场景（带 fade 过渡）
func change_scene(scene_name: StringName) -> void:
	if not SCENE_PATHS.has(scene_name):
		push_error("[SceneManager] 未知场景名: %s" % scene_name)
		return

	if _is_transitioning:
		# 过渡中，排队最后一个请求
		_queued_scene = scene_name
		return

	_is_transitioning = true
	# 过渡期间拦截点击，防止误操作
	_fade_rect.mouse_filter = Control.MOUSE_FILTER_STOP
	_fade_in(_get_path(scene_name))


## 直接切换场景（无过渡，用于初始化）
func change_scene_immediate(scene_name: StringName) -> void:
	if not SCENE_PATHS.has(scene_name):
		push_error("[SceneManager] 未知场景名: %s" % scene_name)
		return
	get_tree().change_scene_to_file(_get_path(scene_name))


func _get_path(scene_name: StringName) -> String:
	return SCENE_PATHS[scene_name]


## 淡入黑屏 → 切换场景 → 淡出黑屏
func _fade_in(target_path: String) -> void:
	var tween: Tween = create_tween()
	tween.tween_property(_fade_rect, "modulate:a", 1.0, FADE_DURATION)
	tween.tween_callback(func() -> void:
		get_tree().change_scene_to_file(target_path)
	)
	# 等待一帧确保新场景加载，再淡出
	tween.tween_interval(0.05)
	tween.tween_property(_fade_rect, "modulate:a", 0.0, FADE_DURATION)
	tween.tween_callback(func() -> void:
		_is_transitioning = false
		# 过渡结束，恢复不拦截点击
		_fade_rect.mouse_filter = Control.MOUSE_FILTER_IGNORE
		if _queued_scene != &"":
			var next: StringName = _queued_scene
			_queued_scene = &""
			change_scene(next)
	)


## 获取当前是否正在过渡
func is_transitioning() -> bool:
	return _is_transitioning
