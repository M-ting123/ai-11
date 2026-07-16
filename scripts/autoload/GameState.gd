extends Node
## GameState — 全局游戏状态容器（Autoload单例）
##
## 职责：
## - 持有当前关卡ID、证据库、证词库、已揭穿矛盾列表、异议次数
## - 案件数据引用
## - 场景间数据传递全部通过此单例，不依赖场景树节点引用

# ---- 当前关卡 ----
var current_case_id: String = ""


func _ready() -> void:
	# 确保中文字体在 Web 导出中正确加载
	var font = load("res://fonts/NotoSansSC-Regular.otf")
	if font and get_tree():
		var theme = Theme.new()
		theme.default_font = font
		get_tree().root.theme = theme

# ---- 证据库 ----
# Dictionary[ev_id] -> { id, name, type, credibility, image, description, forged }
var evidence_db: Dictionary = {}

# ---- 证词库 ----
# Array[Dictionary] -> { witness_id, question, answer, is_key_testimony }
var testimony_db: Array = []

# ---- 已揭穿矛盾列表 ----
# Array[String] -> contradiction_id 列表
var exposed_contradictions: Array = []

# ---- 法庭异议次数 ----
var objections_remaining: int = 3
const MAX_OBJECTIONS: int = 3

# ---- 案件原始数据引用 ----
var case_data: Dictionary = {}

# ---- 已建立的连线（跨场景共享，evidence_board 写入，witness_interrogation 读取显示）----
# Array[Dictionary] -> { from_id, to_id, contradiction_id }
var connection_db: Array = []

# ---- 卡片在连线画布上的位置（evidence_board 拖动时写入，witness_interrogation 读取复现连线图）----
# Dictionary -> { "ev_01": Vector2(x,y), ... }
var card_positions: Dictionary = {}

# ---- 已找到的疑点（审讯中证词连线证据判定为矛盾时记录）----
# Array[Dictionary] -> { question_id, evidence_id, contradiction_id, description }
var suspects_db: Array = []

# ---- 游戏进度 ----
var current_level: int = 0  # 0=未开始, 1=关卡1, 2=关卡2

# ---- 信号 ----
signal evidence_added(evidence_id: String)
signal testimony_added(testimony: Dictionary)
signal contradiction_exposed(contradiction_id: String)
signal objections_changed(remaining: int)
signal suspect_found(question_id: String, evidence_id: String, contradiction_id: String)


## 初始化新关卡
func start_case(case_id: String, data: Dictionary) -> void:
	current_case_id = case_id
	case_data = data
	evidence_db.clear()
	testimony_db.clear()
	exposed_contradictions.clear()
	connection_db.clear()
	card_positions.clear()
	suspects_db.clear()
	objections_remaining = MAX_OBJECTIONS

	# 从案件数据加载证据到证据库
	if data.has("evidence"):
		for ev in data["evidence"]:
			evidence_db[ev["id"]] = ev
			evidence_added.emit(ev["id"])

	print("[GameState] 案件已加载: %s (证据%d件)" % [case_id, evidence_db.size()])


## 添加证词
func add_testimony(witness_id: String, question: String, answer: String, is_key: bool = false) -> void:
	var entry: Dictionary = {
		"witness_id": witness_id,
		"question": question,
		"answer": answer,
		"is_key_testimony": is_key,
		"timestamp": Time.get_ticks_msec(),
	}
	testimony_db.append(entry)
	testimony_added.emit(entry)
	print("[GameState] 证词已记录: %s (关键=%s)" % [witness_id, is_key])


## 揭穿矛盾
func expose_contradiction(contradiction_id: String) -> void:
	if contradiction_id not in exposed_contradictions:
		exposed_contradictions.append(contradiction_id)
		contradiction_exposed.emit(contradiction_id)
		print("[GameState] 矛盾已揭穿: %s (总计%d)" % [contradiction_id, exposed_contradictions.size()])


## 添加连线（evidence_board 写入，witness_interrogation 读取）
func add_connection(from_id: String, to_id: String, contradiction_id: String = "") -> void:
	# 检查是否已存在
	for conn in connection_db:
		if (conn["from_id"] == from_id and conn["to_id"] == to_id) or \
		   (conn["from_id"] == to_id and conn["to_id"] == from_id):
			return
	connection_db.append({
		"from_id": from_id,
		"to_id": to_id,
		"contradiction_id": contradiction_id,
	})
	print("[GameState] 连线已记录: %s <-> %s" % [from_id, to_id])


## 清空连线（新案件时调用）
func clear_connections() -> void:
	connection_db.clear()
	card_positions.clear()


## 设置卡片在画布上的位置（evidence_board 拖动时调用）
func set_card_position(evidence_id: String, pos: Vector2) -> void:
	card_positions[evidence_id] = pos


## 获取卡片位置（witness_interrogation 读取复现连线图）
func get_card_position(evidence_id: String) -> Vector2:
	return card_positions.get(evidence_id, Vector2.ZERO)


## 是否有卡片位置记录
func has_card_positions() -> bool:
	return card_positions.size() > 0


## 添加疑点（审讯中证词连线证据判定为矛盾时调用）
func add_suspect(question_id: String, evidence_id: String, contradiction_id: String, description: String) -> void:
	# 避免重复
	for s in suspects_db:
		if s["question_id"] == question_id and s["evidence_id"] == evidence_id:
			return
	suspects_db.append({
		"question_id": question_id,
		"evidence_id": evidence_id,
		"contradiction_id": contradiction_id,
		"description": description,
	})
	suspect_found.emit(question_id, evidence_id, contradiction_id)
	print("[GameState] 疑点已记录: %s <-> %s (矛盾:%s) 总计%d" % [question_id, evidence_id, contradiction_id, suspects_db.size()])


## 获取所有疑点
func get_suspects() -> Array:
	return suspects_db


## 检查某问题是否已找到疑点
func has_suspect_for_question(question_id: String) -> bool:
	for s in suspects_db:
		if s["question_id"] == question_id:
			return true
	return false


## 清空疑点（新案件时调用）
func clear_suspects() -> void:
	suspects_db.clear()


## 消耗一次异议机会
func use_objection() -> bool:
	if objections_remaining <= 0:
		return false
	objections_remaining -= 1
	objections_changed.emit(objections_remaining)
	print("[GameState] 异议机会消耗，剩余: %d" % objections_remaining)
	return true


## 重置异议次数（进入新证人时调用）
func reset_objections() -> void:
	objections_remaining = MAX_OBJECTIONS
	objections_changed.emit(objections_remaining)


## 获取已揭穿的关键矛盾数量
func get_exposed_count() -> int:
	return exposed_contradictions.size()


## 判定胜负
## 返回: "win" (>=目标), "partial" (>=1但<目标), "lose" (==0)
func get_verdict() -> String:
	var count: int = get_exposed_count()
	var target: int = 2  # 默认目标
	if CaseManager.get_current_case().has("case_id"):
		target = CaseManager.get_required_contradictions()
	if count >= target:
		return "win"
	elif count >= 1:
		return "partial"
	else:
		return "lose"
