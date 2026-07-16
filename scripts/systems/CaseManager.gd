class_name CaseManager
extends RefCounted
## CaseManager — 案件管理（纯逻辑类，非Node）
##
## 职责：
## - 从JSON加载案件数据
## - 提供证据/证人/矛盾/连线的查询接口
## - 管理当前案件的状态

## 案件文件路径映射
const CASE_PATHS: Dictionary = {
	"case_01": "res://data/cases/case_01.json",
	"case_02": "res://data/cases/case_02.json",
}

## 当前案件数据
static var _current_case: Dictionary = {}


## 加载案件
static func load_case(case_id: String) -> Dictionary:
	if not CASE_PATHS.has(case_id):
		push_error("[CaseManager] 未知案件ID: %s" % case_id)
		return {}

	var path: String = CASE_PATHS[case_id]
	_current_case = CaseData.load_from_file(path)

	if _current_case.is_empty():
		push_error("[CaseManager] 案件加载失败: %s" % case_id)
		return {}

	# 同步到GameState
	GameState.start_case(case_id, _current_case)
	return _current_case


## 获取当前案件
static func get_current_case() -> Dictionary:
	return _current_case


## 获取案件标题
static func get_title() -> String:
	return _current_case.get("title", "")


## 获取被告
static func get_defendant() -> String:
	return _current_case.get("defendant", "")


## 获取所有证据
static func get_evidence() -> Array:
	return _current_case.get("evidence", [])


## 获取所有证人
static func get_witnesses() -> Array:
	return _current_case.get("witnesses", [])


## 获取所有矛盾
static func get_contradictions() -> Array:
	return _current_case.get("contradictions", [])


## 获取所有连线
static func get_connections() -> Array:
	return _current_case.get("connections", [])


## 按ID获取证人
static func get_witness_by_id(witness_id: String) -> Dictionary:
	for w in _current_case.get("witnesses", []):
		if w.get("id", "") == witness_id:
			return w
	return {}


## 按ID获取证据
static func get_evidence_by_id(evidence_id: String) -> Dictionary:
	for ev in _current_case.get("evidence", []):
		if ev.get("id", "") == evidence_id:
			return ev
	return {}


## 按ID获取矛盾
static func get_contradiction_by_id(contradiction_id: String) -> Dictionary:
	for c in _current_case.get("contradictions", []):
		if c.get("id", "") == contradiction_id:
			return c
	return {}


## 获取需要揭穿的关键矛盾数量（用于胜负判定）
static func get_required_contradictions() -> int:
	# v0.7: 优先读 court.required_exposed，否则按关卡默认
	var court: Dictionary = _current_case.get("court", {})
	if court.has("required_exposed"):
		return int(court["required_exposed"])
	var case_id: String = _current_case.get("case_id", "")
	if case_id == "case_01":
		return 3
	return 2


## 获取证人的提问方向列表
static func get_question_directions(witness_id: String) -> Array:
	var witness: Dictionary = get_witness_by_id(witness_id)
	return witness.get("question_directions", [])


## 获取某个方向下的问题列表
static func get_questions_by_direction(witness_id: String, direction_id: String) -> Array:
	var directions: Array = get_question_directions(witness_id)
	for dir in directions:
		if dir.get("id", "") == direction_id:
			return dir.get("questions", [])
	return []


## 获取某个问题的数据（包含answer和evidence_relations）
static func get_question(witness_id: String, question_id: String) -> Dictionary:
	var directions: Array = get_question_directions(witness_id)
	for dir in directions:
		for q in dir.get("questions", []):
			if q.get("id", "") == question_id:
				return q
	return {}
