class_name CourtSystem
extends RefCounted
## CourtSystem — 法庭系统（纯逻辑类，非Node）
## v0.7.2 法庭对决关卡流程：
##   开庭(法官开庭词·打字机) → 陈述(证人+律师陈词合并) → 质询(逐句重放异议) → 崩溃 → 真相 → 胜利
##
## 核心玩法：
## - 审讯阶段搜集的"疑点"(suspects_db)是法庭弹药
## - 法庭逐句重放证词，玩家用疑点提出异议
## - 每异议成功1处，证人情绪分级反应（狡辩→混乱→崩溃）
## - 必须3处全点出才能揭示真相并胜诉

## 法庭阶段枚举
enum Phase {
	OPENING,               # 开庭：法官开庭词（打字机呈现）
	STATEMENTS,            # 陈述：证人陈述 + 对方律师陈词（合并显示）
	CROSS_EXAMINATION,     # 逐句质询（异议/下一句）
	WITNESS_BREAKDOWN,     # 证人崩溃痛哭
	TRUTH_REVEAL,          # 法官发问 → 真相揭示
	VICTORY,               # 胜利宣告
	DEFEAT,                # 未能揭穿全部矛盾
	VERDICT,               # 判决
}

## 当前阶段
static var current_phase: Phase = Phase.OPENING

## 当前重放句子索引
static var current_line_index: int = 0

## 法庭数据（取自 case.court）
static var _court_data: Dictionary = {}


## 初始化法庭
static func init_court() -> void:
	current_phase = Phase.OPENING
	current_line_index = 0
	_court_data = CaseManager.get_current_case().get("court", {})
	GameState.reset_objections()
	# 确保进入法庭前矛盾计数为空（审讯只存疑点，不点出矛盾）
	GameState.exposed_contradictions.clear()
	print("[CourtSystem] 法庭初始化，异议次数:%d，所需点出:%d，重放句数:%d" % [
		GameState.objections_remaining,
		get_required_exposed(),
		get_replay_lines().size(),
	])


static func get_court_data() -> Dictionary:
	return _court_data


static func get_phase() -> Phase:
	return current_phase


static func set_phase(p: Phase) -> void:
	current_phase = p


## 法官开庭词
static func get_opening_statement() -> String:
	return _court_data.get("opening_statement", "")


## 证人陈述
static func get_witness_statement() -> String:
	return _court_data.get("witness_statement", "")


## 对方律师陈词
static func get_lawyer_reconstruction() -> String:
	return _court_data.get("lawyer_reconstruction", "")


## 陈述阶段合并文本（证人陈述 + 对方律师陈词）
## 用 BBCode 拼接，带说话人前缀
static func get_statements_text() -> String:
	var witness_name: String = CaseManager.get_current_case().get("defendant", "")
	# 从 witnesses 第一个取证人名
	var witnesses: Array = CaseManager.get_witnesses()
	var wname: String = "证人"
	if not witnesses.is_empty():
		wname = witnesses[0].get("name", "证人")
	var txt: String = ""
	txt += "[color=#E94560][b]【%s · 陈词】[/b][/color]\n\n" % wname
	txt += _court_data.get("witness_statement", "")
	txt += "\n\n[color=#888888]————— 证人陈词完毕 —————[/color]\n\n"
	txt += "[color=#FFB347][b]【对方律师 · 陈词】[/b][/color]\n\n"
	txt += _court_data.get("lawyer_reconstruction", "")
	txt += "\n\n[color=#888888]————— 双方陈词完毕 —————[/color]"
	return txt


static func get_replay_lines() -> Array:
	return _court_data.get("replay_lines", [])


## 获取当前重放句子
static func get_current_line() -> Dictionary:
	var lines: Array = get_replay_lines()
	if current_line_index >= 0 and current_line_index < lines.size():
		return lines[current_line_index]
	return {}


## 推进到下一句，返回是否还有句子
static func next_line() -> bool:
	current_line_index += 1
	return current_line_index < get_replay_lines().size()


## 是否还有句子
static func has_more_lines() -> bool:
	return current_line_index < get_replay_lines().size()


## 异议：用疑点+证据双重判定当前句
## 第一重：suspect.contradiction_id 必须匹配当前句的 contradiction_id
## 第二重：evidence_id 必须等于该疑点在审讯时绑定的 evidence_id
## 返回 { success, message, contradiction_id, emotion, exposed_count }
static func object_line(suspect: Dictionary, evidence_id: String = "") -> Dictionary:
	var line: Dictionary = get_current_line()
	if line.is_empty():
		return {"success": false, "message": "没有可异议的句子", "emotion": ""}

	if not line.get("objectionable", false):
		return {"success": false, "message": "这句话没有问题，无法异议。", "emotion": ""}

	var line_cid: String = line.get("contradiction_id", "")
	var suspect_cid: String = suspect.get("contradiction_id", "")

	# 第一重：疑点的矛盾必须匹配当前句的矛盾
	if suspect_cid == "" or suspect_cid != line_cid:
		GameState.use_objection()
		return {"success": false, "message": "异议失败！这个疑点与当前证词不符。", "emotion": ""}

	# 第二重：出示的证据必须与该疑点绑定的证据一致（疑点在审讯时已绑定 evidence_id）
	if evidence_id != "":
		var suspect_eid: String = suspect.get("evidence_id", "")
		if suspect_eid != "" and suspect_eid != evidence_id:
			GameState.use_objection()
			return {"success": false, "message": "异议失败！出示的证据与该疑点不符。", "emotion": ""}

	# 该矛盾已被点出（防重复）
	if line_cid in GameState.exposed_contradictions:
		return {"success": false, "message": "这个矛盾已经揭穿过了，换一句吧。", "emotion": ""}

	# 成功！点出矛盾
	GameState.expose_contradiction(line_cid)
	var exposed_count: int = GameState.exposed_contradictions.size()
	var emotion: String = get_emotion_reaction(exposed_count)
	return {
		"success": true,
		"message": "异议成立！矛盾已被揭穿！",
		"contradiction_id": line_cid,
		"emotion": emotion,
		"exposed_count": exposed_count,
	}


## 根据已点出数量获取证人情绪反应文本
static func get_emotion_reaction(exposed_count: int) -> String:
	var reactions: Dictionary = _court_data.get("emotion_reactions", {})
	return reactions.get(str(exposed_count), "")


## 需要点出的矛盾数（胜诉条件）
static func get_required_exposed() -> int:
	return int(_court_data.get("required_exposed", 3))


static func get_judge_question() -> String:
	return _court_data.get("judge_question", "")


static func get_truth_text() -> String:
	return _court_data.get("truth_text", "")


static func get_victory_pose() -> String:
	return _court_data.get("victory_pose", "异议！")


## 质询阶段判定：句子过完时调用
## 返回 "win"(找齐，进入崩溃) 或 "fail"(未找齐)
static func get_cross_exam_result() -> String:
	var exposed: int = GameState.exposed_contradictions.size()
	if exposed >= get_required_exposed():
		return "win"
	return "fail"


## 判决结果（供 verdict 场景使用）
static func get_verdict() -> String:
	return GameState.get_verdict()


## 判决描述
static func get_verdict_text() -> String:
	var verdict: String = get_verdict()
	match verdict:
		"win":
			return "胜诉！你成功为被告洗清了冤屈，真凶伏法。"
		"partial":
			return "部分胜诉。虽然揭穿了一些矛盾，但证据还不够充分。"
		"lose":
			return "败诉。未能揭穿足够的矛盾，被告含冤入狱。"
		_:
			return "未知结果"
