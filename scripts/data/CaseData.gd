class_name CaseData
extends RefCounted
## CaseData — 案件数据类型定义（纯Resource类，非Node）
##
## 定义证据、证人、矛盾、连线的数据结构
## 案件数据从JSON文件加载，映射到这些类型

## 证据结构
## { id, name, type, credibility, image, description, forged }
const EvidenceSchema: Dictionary = {
	"id": TYPE_STRING,
	"name": TYPE_STRING,
	"type": TYPE_STRING,        # "物证" / "文字证据" / "证词"
	"credibility": TYPE_INT,    # 1-5
	"image": TYPE_STRING,       # 资源路径，可为空
	"description": TYPE_STRING,
	"forged": TYPE_BOOL,        # 是否为伪造证据
}

## 证人结构
## { id, name, persona, knowledge, lies, testimony, response_rules }
const WitnessSchema: Dictionary = {
	"id": TYPE_STRING,
	"name": TYPE_STRING,
	"persona": TYPE_STRING,     # 性格描述
	"knowledge": TYPE_DICTIONARY,  # { knows: [], does_not_know: [], lies_about: [] }
	"lies": TYPE_ARRAY,          # 谎言主题列表
	"testimony": TYPE_STRING,    # 初始证词
	"response_rules": TYPE_DICTIONARY,  # 响应规则
}

## 矛盾结构
## { id, evidence, witness, type, description }
const ContradictionSchema: Dictionary = {
	"id": TYPE_STRING,
	"evidence": TYPE_ARRAY,      # 关联证据ID列表
	"witness": TYPE_STRING,      # 关联证人ID
	"type": TYPE_STRING,         # "时间矛盾" / "地点矛盾" / "行为矛盾" 等
	"description": TYPE_STRING,
}

## 连线结构
## { from, to, result }
const ConnectionSchema: Dictionary = {
	"from": TYPE_STRING,         # 证据ID 或 证词引用
	"to": TYPE_STRING,           # 证据ID 或 证词引用
	"result": TYPE_STRING,       # 连对后解锁的矛盾ID
}

## 案件结构
## { case_id, title, defendant, evidence, witnesses, contradictions, connections }
const CaseSchema: Dictionary = {
	"case_id": TYPE_STRING,
	"title": TYPE_STRING,
	"defendant": TYPE_STRING,
	"evidence": TYPE_ARRAY,       # EvidenceSchema 列表
	"witnesses": TYPE_ARRAY,      # WitnessSchema 列表
	"contradictions": TYPE_ARRAY, # ContradictionSchema 列表
	"connections": TYPE_ARRAY,    # ConnectionSchema 列表
}


## 从JSON文件加载案件数据
static func load_from_file(path: String) -> Dictionary:
	if not FileAccess.file_exists(path):
		push_error("[CaseData] 案件文件不存在: %s" % path)
		return {}

	var file: FileAccess = FileAccess.open(path, FileAccess.READ)
	if file == null:
		push_error("[CaseData] 无法打开文件: %s (错误: %s)" % [path, FileAccess.get_open_error()])
		return {}

	var json_string: String = file.get_as_text()
	file.close()

	var json: JSON = JSON.new()
	var err: int = json.parse(json_string)
	if err != OK:
		push_error("[CaseData] JSON解析失败: %s (行%d: %s)" % [path, json.get_error_line(), json.get_error_message()])
		return {}

	var data: Dictionary = json.data
	print("[CaseData] 案件已加载: %s" % data.get("title", "未知"))
	return data


## 验证案件数据结构完整性
static func validate(data: Dictionary) -> bool:
	for key in CaseSchema.keys():
		if not data.has(key):
			push_error("[CaseData] 缺少字段: %s" % key)
			return false
	return true
