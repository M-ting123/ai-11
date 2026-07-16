class_name WitnessSystem
extends RefCounted
## WitnessSystem — 证人系统（纯逻辑类，非Node）
##
## 职责：
## - 构建NPC Persona的DeepSeek system prompt
## - 管理对话历史
## - 知识边界检查（本地预检，减少无效AI调用）

## 对话历史缓存: Dictionary[witness_id] -> Array[Dictionary]{role, content}
static var _dialogue_histories: Dictionary = {}


## 构建证人对话的system prompt
##
## 注入NPC的persona、知识边界、谎言设定、响应规则
## 约束AI不超出知识边界，不编造事实
static func build_system_prompt(npc_data: Dictionary) -> String:
	var persona: String = npc_data.get("persona", "")
	var knowledge: Dictionary = npc_data.get("knowledge", {})
	var lies: Array = npc_data.get("lies", [])
	var response_rules: Dictionary = npc_data.get("response_rules", {})

	var prompt: String = ""
	prompt += "你是一个法庭游戏中的NPC角色，正在接受律师的询问。\n\n"
	prompt += "## 你的角色设定\n"
	prompt += "性格特征：%s\n\n" % persona

	prompt += "## 你的知识边界（严格遵守）\n"
	prompt += "你知道的事实：\n"
	for fact in knowledge.get("knows", []):
		prompt += "- %s\n" % fact
	prompt += "\n你不知道的事实（被问到时回答\"不知道\"或\"不记得\"）：\n"
	for fact in knowledge.get("does_not_know", []):
		prompt += "- %s\n" % fact

	prompt += "\n## 你的谎言设定\n"
	prompt += "你在以下话题上撒谎（未出示证据前坚持原说法）：\n"
	for lie in knowledge.get("lies_about", []):
		prompt += "- %s\n" % lie

	prompt += "\n## 响应规则\n"
	for trigger in response_rules.keys():
		prompt += "- %s：%s\n" % [trigger, response_rules[trigger]]

	prompt += "\n## 重要约束\n"
	prompt += "1. 绝不能说出你不知道的事实，统一回答\"不知道\"或\"不记得\"\n"
	prompt += "2. 在未出示证据前，坚持你的谎言\n"
	prompt += "3. 当律师出示了与你谎言矛盾的证据时，你可以崩溃承认\n"
	prompt += "4. 保持角色性格，用符合人设的语气说话\n"
	prompt += "5. 回答简短（2-4句话），不要长篇大论\n"
	prompt += "6. 不要透露你是AI或游戏角色\n"

	return prompt


## 获取证人的对话历史
static func get_history(witness_id: String) -> Array:
	return _dialogue_histories.get(witness_id, [])


## 记录一轮对话
static func add_dialogue(witness_id: String, question: String, answer: String) -> void:
	if not _dialogue_histories.has(witness_id):
		_dialogue_histories[witness_id] = []
	_dialogue_histories[witness_id].append({"role": "user", "content": question})
	_dialogue_histories[witness_id].append({"role": "assistant", "content": answer})


## 清除证人对话历史
static func clear_history(witness_id: String) -> void:
	_dialogue_histories.erase(witness_id)


## 清除所有对话历史
static func clear_all() -> void:
	_dialogue_histories.clear()


## 本地预检：判断问题是否在证人知识边界内
## 返回: true=可以问AI, false=直接回答"不知道"
static func is_within_knowledge(npc_data: Dictionary, question: String) -> bool:
	var knowledge: Dictionary = npc_data.get("knowledge", {})
	var does_not_know: Array = knowledge.get("does_not_know", [])

	# 简单关键词匹配（骨架版，后续可优化）
	for topic in does_not_know:
		if question.findn(topic) != -1:
			return false
	return true


## 调用AI与证人对话
## 通过AIService发送请求，返回结果通过信号
static func chat_with_witness(witness_id: String, question: String) -> void:
	var npc_data: Dictionary = CaseManager.get_witness_by_id(witness_id)

	if npc_data.is_empty():
		push_error("[WitnessSystem] 未知证人ID: %s" % witness_id)
		return

	var history: Array = get_history(witness_id)
	AIService.chat_with_witness(npc_data, question, history)


## 构建AI助手的分析prompt
static func build_assistant_prompt(testimony_list: Array, evidence_list: Array) -> String:
	var prompt: String = ""
	prompt += "你是律师的AI助手，负责分析案件中的矛盾。\n\n"
	prompt += "## 当前证据库\n"
	for ev in evidence_list:
		prompt += "- [%s] %s：%s（可信度%d）\n" % [
			ev.get("id", ""),
			ev.get("name", ""),
			ev.get("description", ""),
			ev.get("credibility", 3)
		]

	prompt += "\n## 当前证词库\n"
	for t in testimony_list:
		prompt += "- 证人[%s]被问\"%s\"，回答\"%s\"\n" % [
			t.get("witness_id", ""),
			t.get("question", ""),
			t.get("answer", "")
		]

	prompt += "\n## 你的任务\n"
	prompt += "分析以上证据和证词，找出可能的矛盾点。\n"
	prompt += "注意：你只能给出疑点和建议方向，不能直接告诉律师正确答案。\n\n"
	prompt += "请以JSON格式输出：\n"
	prompt += "{\n"
	prompt += "  \"hints\": [\"疑点提示1\", \"疑点提示2\"],\n"
	prompt += "  \"suggestions\": [\"建议追问方向1\", \"建议追问方向2\"],\n"
	prompt += "  \"status\": {\"exposed\": 已揭穿数, \"target\": 目标数}\n"
	prompt += "}\n"

	return prompt
