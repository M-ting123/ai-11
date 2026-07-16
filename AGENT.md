# AGENT.md — 逆转AI·法庭 项目工作流

> **⚠️ 使用规则**：每次执行任何操作前，必须先通读本文件，了解当前进度、PR状态、待澄清问题、已知问题，避免重复工作或遗漏依赖。
> **每次生成答案、每次修改代码前都必须调用并读取本文件。**
> **每次任务尽量调用 agent（task 工具）并行完成，提高效率。**
>
> **文档驱动开发**：所有开发以 `游戏设计文档_敲定版.md`（v0.4）为唯一需求源。
> 用户提新要求 → 先更新设计文档 → 再按文档改动代码。
> **本文件由 Agent 维护**，记录工作流、进度、PR 规划、审计结果、测试策略、不确定点。
>
> **测试是交付前置条件**：Agent 在每次把结果交给用户前，必须完成 5.1 中规定的测试职责，不能只甩代码给用户。若发现 bug，必须自行修复后再交付。

---

## 一、工作流（文档驱动 + PR 分批）

### 1.1 核心原则

1. **文档是唯一需求源**：`游戏设计文档_敲定版.md` 是 source of truth，代码必须与文档一致
2. **文档先行**：用户提新需求 → 先更新文档 → 再改代码（不允许"代码先行、文档补档"）
3. **PR 分批推进**：每个 PR 是一个可独立验证的功能单元，合并前必须通过测试
4. **多 Agent 协作**：复杂任务拆分后由多个 agent 并行完成（见第六节）

### 1.2 单个 PR 的生命周期

```
[需求确认] → [更新设计文档] → [规划PR范围] → [编码]
  → [代码审计] → [测试验证] → [PR完成] → [更新本文件进度]
```

### 1.2.1 测试验证职责（Agent 必做）

测试是 Agent 工作流的一环，**不能把测试甩给用户**。每个 PR 编码完成后，Agent 必须：

1. **Lint 检查**：`read_lints` 覆盖所有改动文件，确保零错误
2. **逻辑自检**：逐行审查关键交互逻辑（坐标、信号、节点引用、类型匹配）
3. **坐标系统一**：项目用 `stretch_mode=canvas_items`，鼠标坐标必须用 `get_global_mouse_position()`（CanvasItem坐标），**禁止用 `event.global_position`**（视口坐标，两者不一致）
4. **节点引用验证**：`@onready` 引用的节点路径必须与 `.tscn` 中的节点树完全匹配
5. **信号连接验证**：所有 `connect()` 的信号名和回调方法必须存在且签名匹配
6. **实例化验证**：`instance=ExtResource()` 引用的场景文件必须存在且可加载

只有以上全部通过，才标记 PR 完成并请用户验证。

### 1.3 文档变更协议

- 用户口头提要求 → Agent 更新 `游戏设计文档_敲定版.md` 对应章节 → 用户确认 → 才动代码
- 文档版本号规则：小改 +0.1（如 v0.4→v0.5），大改 +1.0
- 每次文档变更在文档头部 `> **更新**` 行记录日期和变更摘要

---

## 二、项目现状总览

### 2.1 基本信息

| 项 | 内容 |
|:---|:---|
| 项目名 | 逆转AI·法庭 |
| 引擎 | Godot 4.x（导出Web） |
| 语言 | GDScript |
| AI | DeepSeek API（经 EdgeOne Functions 代理） |
| 部署 | EdgeOne Pages |
| 赛事 | 腾讯云黑客松 2026（叙事剧情赛道） |
| 设计文档 | `游戏设计文档_敲定版.md` v0.4 |
| 设计分辨率 | 1920x1080 |

### 2.2 已完成（骨架阶段）

| # | 任务 | 状态 | 产出 |
|:---|:---|:---:|:---|
| 1 | Godot 项目骨架 + 3 个 Autoload | ✅ | `project.godot`、SceneManager/GameState/AIService |
| 2 | 7 个游戏场景 + 4 个 UI 组件（.tscn） | ✅ | `scenes/` 下 11 个场景文件 |
| 3 | 场景脚本 + UI 组件脚本（.gd） | ✅ | `scripts/scenes/` + `scripts/ui/` 共 12 个脚本 |
| 4 | 数据结构与系统类 | ✅ | CaseData/CaseManager/WitnessSystem/CourtSystem |
| 5 | 关卡 1 案件数据模板 | ✅ | `data/cases/case_01.json` |
| 6 | EdgeOne Functions AI 代理 | ✅ | `edgeone/functions/ai-proxy/index.js` |
| 7 | AI 链路测试场景 + Mock 服务器 | ✅ | `scenes/ai_test.tscn` + `mock-server.js` |

### 2.3 当前文件清单（29 个文件）

```
游戏项目1/
├── project.godot                    # 项目配置
├── export_presets.cfg               # Web导出预设
├── icon.svg                         # 项目图标
├── README.md
├── AGENT.md                         # ← 本文件
├── 游戏设计文档_敲定版.md            # ★ 唯一需求源
├── scripts/
│   ├── autoload/
│   │   ├── SceneManager.gd          # 场景切换管理
│   │   ├── GameState.gd             # 游戏状态
│   │   └── AIService.gd             # AI调用服务
│   ├── data/
│   │   └── CaseData.gd              # 案件数据结构
│   ├── systems/
│   │   ├── CaseManager.gd           # 案件管理
│   │   ├── WitnessSystem.gd         # 证人系统（Persona构建）
│   │   └── CourtSystem.gd           # 法庭系统（威慑/异议/判决）
│   ├── scenes/
│   │   ├── main_menu.gd
│   │   ├── story_intro.gd
│   │   ├── case_accept.gd
│   │   ├── evidence_board.gd
│   │   ├── witness_interrogation.gd
│   │   ├── court_trial.gd
│   │   ├── verdict.gd
│   │   └── ai_test.gd
│   └── ui/
│       ├── AIAssistantPanel.gd
│       ├── EvidenceCard.gd
│       ├── DialogueBox.gd
│       └── TypewriterLabel.gd
├── scenes/
│   ├── main_menu.tscn
│   ├── story_intro.tscn
│   ├── case_accept.tscn
│   ├── evidence_board.tscn
│   ├── witness_interrogation.tscn
│   ├── court_trial.tscn
│   ├── verdict.tscn
│   ├── ai_test.tscn
│   └── ui/
│       ├── ai_assistant_panel.tscn
│       ├── evidence_card.tscn
│       ├── dialogue_box.tscn
│       └── typewriter_label.tscn
├── data/cases/case_01.json
└── edgeone/functions/ai-proxy/
    ├── index.js                     # EdgeOne AI代理
    ├── mock-server.js               # 本地Mock服务器
    └── package.json
```

---

## 三、代码审计报告（2026-07-15）

> 审计由 code-explorer agent 执行，覆盖全部 29 个文件。

### 3.1 致命错误 P0（会导致运行崩溃/功能失效）

| # | 文件 | 问题 | 影响 |
|:---|:---|:---|:---|
| P0-1 | `evidence_board.tscn` / `witness_interrogation.tscn` / `court_trial.tscn` | AIAssistantPanel 节点是裸 Panel，未实例化 `ai_assistant_panel.tscn`，也无脚本 | 右侧 AI 助手面板完全空白，调用 `update_hints()` 等方法会报错 |
| P0-2 | `court_trial.gd` | `_selected_line_index` 永远是 -1，威慑/异议按钮点击后直接 return | 法庭威慑和异议功能完全无效 |
| P0-3 | `court_trial.gd` | 函数名 `RenderTestimonyText()` 首字母大写，违反 GDScript snake_case 规范 | 潜在命名冲突/lint 报错 |
| P0-4 | `evidence_board.tscn` | `CardsContainer` 是 Control 类型，无自动布局 | 证据卡片全部堆叠在 (0,0)，看不见 |
| P0-5 | `CaseManager.gd` | 引用不存在的 `case_02.json` | 调用 `load_case("case_02")` 会失败（当前流程未触发） |

### 3.2 逻辑错误 P1（能运行但行为不对）

| # | 文件 | 问题 | 影响 |
|:---|:---|:---|:---|
| P1-1 | `witness_interrogation.gd` | CONNECT_ONE_SHOT 信号 + 单 HTTPRequest 节点，连续提问会丢失响应 | 玩家快速连点提问，第二次无回答 |
| P1-2 | `witness_interrogation.gd` | `add_dialogue()` 的 question 参数传空字符串 | AI 对话历史丢失上下文 |
| P1-3 | `court_trial.gd` | 异议操作硬编码用第一个证据，无证据选择 UI | 玩家无法选择出示哪个证据 |
| P1-4 | `court_trial.gd` | 无 `next_witness()` 调用，多证人场景无法推进 | 关卡2（2-3个证人）无法支持 |

### 3.3 设计文档一致性 P2

| # | 文档要求 | 当前实现 | 差距 |
|:---|:---|:---|:---|
| P2-1 | 证词画线机制（点击句子高亮选中） | 未实现 | 需在法庭场景实现可点击证词句 |
| P2-2 | 连线玩法（拖拽证据卡片连线） | 只有卡片，无连线绘制/判定 | 需实现 Line2D 连线 + 匹配判定 |
| P2-3 | AI 助手面板三区域（疑点/建议/局势） | 组件已建但未实例化到场景 | 见 P0-1 |
| P2-4 | 关卡2案件数据 | 无 `case_02.json` | 待设计后创建 |

### 3.4 总体评价

骨架代码结构清晰、分层合理（autoload/data/systems/scenes/ui），但存在 **5 个 P0 致命问题**导致核心玩法（连线、法庭威慑/异议、AI助手面板）当前不可用。需在 PR-2 中集中修复。

---

## 四、PR 规划

> 每个 PR = 一个可验证里程碑。PR 编号即执行顺序。

### PR-1：骨架搭建 ✅ 已完成

- Godot 项目配置 + Autoload + 场景骨架 + AI 代理 + 测试场景
- **验证方式**：Godot 能打开项目，F5 能启动到主菜单

### PR-2：P0 致命问题修复 ✅ 已完成

**目标**：让骨架真正可运行，核心交互不报错

| 子任务 | 对应审计项 | 状态 |
|:---|:---|:---:|
| 修复 AIAssistantPanel 实例化（3个场景） | P0-1 | ✅ |
| 实现法庭证词点击选中（meta_clicked + 高亮） | P0-2 | ✅ |
| 重命名 `RenderTestimonyText` → `render_testimony_text` | P0-3 | ✅ |
| CardsContainer 改为 GridContainer（3列布局） | P0-4 | ✅ |
| 修复 witness_interrogation 信号竞争（禁用按钮+不用ONE_SHOT） | P1-1 | ✅ |
| 修复 add_dialogue question 参数（传入实际提问） | P1-2 | ✅ |
| 实现证据选择弹窗（动态 AcceptDialog） | P1-3 | ✅ |
| 实现判决条件检查（_check_trial_end） | P1-4 | ✅ |
| case_01.json 场景改为住宅 + 保安证人 | grill决策 | ✅ |
| case_accept 案件信息动态加载 | 一致性 | ✅ |

**验证方式**：F5 启动 → 主菜单 → 剧情 → 案件受理（动态显示住宅案）→ 连线（卡片3列排列）→ 传唤（提问有响应，连点不丢）→ 法庭（点击证词选中、异议弹证据选择）→ 判决

### PR-3：关卡1内容填充 ✅ 已完成

**目标**：关卡1变成完整可玩的教学案（10-15分钟）

| 子任务 | 说明 | 状态 |
|:---|:---|:---:|
| 连线玩法 | 拖拽证据卡片+draw_line绘制+匹配CaseManager预设判定 | ✅ |
| 证词画线机制 | 法庭meta_clicked点击证词句选中高亮 | ✅ |
| 证据选择UI | 动态AcceptDialog弹出证据列表 | ✅ |
| 法庭完整流程 | 威慑/异议/出示证据+判决判定 | ✅ |
| 判决逻辑修复 | get_verdict使用动态目标（关卡1揭穿1个即胜诉） | ✅ |
| 关卡1案件数据 | case_01.json住宅盗窃+保安证人+时间矛盾 | ✅ |

**验证方式**：F5 启动 → 主菜单 → 剧情 → 案件受理 → 连线（拖拽卡片连线发现矛盾）→ 传唤（提问）→ 法庭（点击证词选中→异议→选证据→揭穿矛盾→判决胜诉）

### PR-4：AI 链路真实打通 🟡 待开始

**目标**：EdgeOne 部署 + DeepSeek 真实调用

| 子任务 | 说明 |
|:---|:---|
| 部署 EdgeOne Functions | 上传 `index.js`，配置 `DEEPSEEK_API_KEY` |
| AIService 对接线上地址 | 切换 `proxy_url` |
| 端到端测试 | 真实 AI 证人对话 + AI 助手分析 |
| Web 导出测试 | Godot 导出 HTML5，浏览器中验证 CORS |

**验证方式**：浏览器打开导出的 Web 版，完整走通一次真实 AI 调用

### PR-4：审讯玩法重做（v0.7）✅ 已完成

**目标**：审讯从"自由提问"改为"找疑点"核心玩法

| 子任务 | 说明 | 状态 |
|:---|:---|:---:|
| 提问方向+问题两级选项 | 方向按钮→问题按钮→预设回答 | ✅ |
| [整理]按钮机制 | 证词变橙红卡片→点击证词再点证据判定 | ✅ |
| 疑点列表 | 右侧AI下方SuspectListPanel | ✅ |
| AI软提示 | 回答有矛盾时提示"好像有些矛盾？" | ✅ |
| 证词连线判定 | contradiction=疑点/consistent=正常/无关联=提示 | ✅ |
| case_01.json | 住宅+保安+3方向6问题+2矛盾 | ✅ |
| GameState.suspects_db | 新增疑点存储+信号 | ✅ |
| CaseManager接口 | get_question_directions/get_questions_by_direction/get_question | ✅ |
| 进入法庭确认机制 | 疑点不足时需点两次确认 | ✅ |

### PR-5：法庭玩法重做（v0.7）🔴 待开始

**目标**：法庭对方改为律师，异议律师推理

| 子任务 | 说明 |
|:---|:---|
| 律师陈述 | 律师基于证人漏洞证词构建"所谓真相"推理链 |
| 异议律师证词 | 玩家点击律师一句话提出异议 |
| 出示疑点+证据 | 选择对应疑点和证据支持异议 |
| 胜利条件 | 关卡1=2处矛盾全找才胜 |

### PR-6：关卡2主线案 🟢 待开始

**前置依赖**：⚠️ 需要先确定关卡2具体设计（见第七节 grill 清单）

| 子任务 | 说明 |
|:---|:---|
| 设计关卡2案件细节 | 伪造证物/推理漏洞/真凶/2-3个证人 |
| 创建 `case_02.json` | |
| 多证人法庭推进 | `next_witness()` 流程 |
| 对方律师预设行为 | 反击逻辑 |

### PR-6：美术资源接入 🟢 待开始

| 子任务 | 说明 |
|:---|:---|
| AI 生图（Alan Becker 风格） | 法院背景/办公室背景/NPC立绘/证据图（6-9张） |
| 替换占位资源 | |
| 音效接入 | 点击声/异议声/胜败音效 |

### PR-7：打磨与部署 🟢 待开始

| 子任务 | 说明 |
|:---|:---|
| UI 打磨 | 过渡动画、打字机效果调优 |
| EdgeOne Pages 部署 | |
| 路演 Demo 录制 | |

---

## 五、测试策略

### 5.1 测试分层

| 层级 | 范围 | 方式 |
|:---|:---|:---|
| L1 链路测试 | AI 调用链路 | `ai_test.tscn`（F6 运行）+ Mock 服务器 |
| L2 场景测试 | 单场景可运行 | Godot 中 F6 逐场景打开，检查无报错 |
| L3 流程测试 | 端到端通关 | F5 从主菜单到判决完整走一遍 |
| L4 Web 测试 | 浏览器环境 | 导出 HTML5，验证 CORS + 真实 AI |

### 5.2 当前测试状态

- [ ] L1：Mock 链路未实测（需用户本地启动 mock-server.js + Godot F6）
- [ ] L2：场景可打开性未验证（用户反馈"无法运行"，已修6个问题，待复测）
- [ ] L3：端到端流程未跑通（P0 问题未修复）
- [ ] L4：未导出 Web

### 5.3 测试执行计划

每个 PR 完成后执行对应层级测试：
- PR-2 完成 → L2（场景无报错）+ L3（流程跑通，AI 用 Mock）
- PR-3 完成 → L3（关卡1完整通关）
- PR-4 完成 → L1（真实AI）+ L4（Web环境）

---

## 六、多 Agent 协作模式

### 6.1 Agent 角色定义

| 角色 | subagent | 职责 | 何时使用 |
|:---|:---|:---|:---|
| **审计员** | code-explorer | 读取代码，找bug，不改代码 | 每个 PR 编码后、代码审计阶段 |
| **前端开发** | 主 Agent 直接执行 | 改 .gd / .tscn 文件 | 编码阶段 |
| **后端开发** | 主 Agent 直接执行 | 改 EdgeOne index.js / mock | 编码阶段 |
| **并行执行** | task (code-explorer, acceptEdits) | 独立无依赖的任务并行 | 如场景搭建+AI代理可并行 |

### 6.2 并行策略

- **可并行**：无文件依赖的任务（如 Godot 场景 vs EdgeOne 代理）
- **不可并行**：有依赖的任务（如 PR-3 依赖 PR-2 修复）
- 审计 agent 只读不改，可与开发并行

### 6.3 执行记录

| 时间 | Agent | 任务 | 结果 |
|:---|:---|:---|:---|
| 2026-07-15 | code-explorer | 全量代码审计 | 发现 5 P0 + 4 P1 + 4 P2 |
| 2026-07-15 | 主 Agent | 创建测试场景+Mock服务器 | 完成 |

---

## 七、待澄清问题（Grill 清单）

> 以下问题需用户明确后才能推进对应 PR。使用 grill-me 方式逐一向用户确认。

### 7.1 关卡1具体设计（阻塞 PR-3）

文档只定了"盗窃遇杀人被栽赃"，但缺细节：

1. **盗窃场景**：潜入哪里？（办公室/仓库/住宅？）
2. **栽赃方式**：什么证据指向被告？（凶器上有指纹/监控拍到/现场遗留物？）
3. **证人是谁**：1个证人是什么身份？（保安/同事/目击者？）
4. **证人谎言**：谎在哪儿？（时间/地点/行为？）
5. **矛盾线**：唯一1条矛盾线是什么？（监控vs证词/物证vs陈述？）

### 7.2 关卡2具体设计（阻塞 PR-5）

1. **伪造证物**：具体是什么？破绽在哪？
2. **对方律师推理**：不成立的推理链是什么？逻辑漏洞在哪？
3. **真凶**：是谁？如何揭露？
4. **2-3个证人**：各自身份和谎言？

### 7.3 开发优先级确认

1. **PR-2 是否立即执行**：先修P0让骨架可跑，还是先定关卡1内容？
2. **Demo 截止**：路演 Demo 最晚什么时候要？（影响是否砍关卡2）
3. **AI 密钥**：DeepSeek API Key 是否已申请？（阻塞 PR-4）

### 7.4 其他待定（不阻塞）

- NPC 具体人设（证人性格、对方律师风格）
- 证据具体清单（每案件几张、几张伪造）
- 社交传播设计
- 结局分支（单线/多结局）

---

## 九、Grill 决策记录（2026-07-15）

| 问题 | 用户决策 | 影响 |
|:---|:---|:---|
| 执行顺序 | **先修 P0（PR-2）** | 立即执行 PR-2，关卡1内容延后到 PR-3 |
| 关卡1盗窃场景 | **住宅** | 被告潜入住宅盗窃，恰遇杀人被栽赃。case_01.json 场景从办公室改为住宅 |
| 关卡1证人 | **保安** | 1个证人是当晚值班保安，在离开时间上说谎（唯一矛盾线） |
| Demo截止 | **尽快，快速迭代** | 优先保证关卡1可玩，关卡2视情况后定 |

### 关卡1已定要素（待 PR-3 细化）
- 案件：被告潜入**住宅**盗窃，恰遇杀人案，被栽赃为凶手
- 证人：当晚值班**保安**（在离开时间上说谎）
- 矛盾线：监控/记录 vs 保安证词（时间矛盾，1条）

---

## 八、变更记录

| 日期 | 变更 | 操作者 |
|:---|:---|:---|
| 2026-07-15 | 创建 AGENT.md，完成全量代码审计，规划 PR-1~PR-7 | 主 Agent |
| 2026-07-15 | 安装 grill-me skill，grill 用户4个关键决策 | 主 Agent |
| 2026-07-15 | Grill 决策：先修P0、住宅场景、保安证人、快速迭代。启动 PR-2 | 主 Agent |
| 2026-07-15 | PR-2 完成：修复5个P0+4个P1，更新case_01为住宅保安案，case_accept动态加载 | 主 Agent |
| 2026-07-15 | 修复P0致命bug：SceneManager的fade层_fade_rect初始mouse_filter=STOP拦截所有点击，改为IGNORE | 主 Agent |
| 2026-07-15 | PR-3完成：连线玩法(拖拽+绘制+匹配判定)+判决逻辑修复(动态目标)+关卡1数据完善 | 主 Agent |
| 2026-07-15 | 修复连线无法点击：坐标系不匹配(event.global_position视口坐标 vs card.global_position CanvasItem坐标)，改用get_global_mouse_position()。更新AGENT.md测试工作流 | 主 Agent |
| 2026-07-15 | 重写evidence_board为gui_input方案：每卡片mouse_filter=STOP+gui_input信号，避开ScrollContainer对_input的拦截。添加print调试 | 主 Agent |
| 2026-07-15 | UI重设计：evidence_board棕色档案袋风格+打开档案袋动画+箭头连线+左右60/40均匀分栏竖线分隔；court_trial棕色主题+天平符号。更新设计文档v0.5 | 主 Agent |
| 2026-07-15 | 修复连线界面AI在左侧问题：所有HSplitContainer删除多余Divider，只保留两个子节点（左内容+右AI）。court_trial/evidence_board/witness_interrogation AI统一在右侧。修复连线层大小为0：_line_layer启用layout_mode=ANCHORS+set_anchors_and_offsets_preset。witness_interrogation三栏改用HBoxContainer+VSeparator/ColorRect | 主 Agent |
| 2026-07-15 | 调查审讯一体化v0.6：witness_interrogation重设计为上方30%线索图(GameState.connection_db持久化)+下方70%三栏(证人+对话+AI)。GameState新增connection_db+add_connection/clear_connections。evidence_board连线写入持久化。更新设计文档 | 主 Agent |
| 2026-07-15 | 修复档案袋卡住：打开动画Tween移到_ready最前面(确保即使后续代码报错也能打开)+全部null检查+FolderCover mouse_filter=IGNORE。添加print调试 | 主 Agent |
| 2026-07-15 | 改用_process倒计时替代Tween/Timer：_process一定被调用，2秒后_open_folder_now。彻底解决档案袋卡住 | 主 Agent |
| 2026-07-15 | 修复Parser Error: from_id未声明：把GameState.add_connection从_on_connection_matched移到_try_connect（from_id/to_id是_try_connect局部变量） | 主 Agent |
| 2026-07-15 | 修复Parser Error: Control.LAYOUT_MODE_ANCHORS在Godot 4.3中不存在，删除该常量，改用set_anchors_and_offsets_preset+手动设置size | 主 Agent |
| 2026-07-15 | 修改1.2：evidence_board证据区:AI区比例改为3:1(split_offset=1400)。画布层z_index=10确保箭头在卡片之上。箭头加粗+大三角+起点圆点+白色描边，画布风格更明显。更新设计文档 | 主 Agent |
| 2026-07-15 | 卡片自由拖动+点击连线：CardsContainer改为Control自由布局，左键拖动移动卡片位置，短按选中连线起点(黄色高亮)，选中后再点另一张完成连线。位置存入GameState.card_positions跨场景持久化。审讯场景连线图从card_positions读取并居中显示(_compute_graph_transform缩放+居中)。调用code-explorer agent审计，修复P0(字典键点号语法→conn["from_id"]、类型声明Node→Control)和P1(line_layer不再手动设size、await布局完成、draw回调不修改节点属性) | 主 Agent |
| 2026-07-15 | 设计文档v0.7：审讯内[整理]按钮机制(证词变卡片连线证据，成功=正常/失败=疑点)；法庭对方改为律师(异议律师基于证人漏洞证词构建的"所谓真相")；胜利条件关卡1=2处全找；审讯提问改为"方向→具体问题"两级选项。新增PR-4(审讯重做)和PR-5(法庭重做) | 主 Agent |
| 2026-07-15 | PR-4完成：审讯玩法重做。case_01.json重写(住宅+保安+3方向6问题+2矛盾+证词-证据关系)。GameState新增suspects_db+add_suspect/get_suspects/suspect_found信号。CaseManager新增get_question_directions/get_questions_by_direction/get_question，get_required_contradictions改为2。witness_interrogation.gd/.tscn完整重写(方向→问题→回答→[整理]证词变卡片→点击证词再点证据判定→contradiction=疑点/consistent=正常)。右侧AI下方疑点列表。调用code-explorer agent审计，修复P1(疑点计数统一用suspects_db、进入法庭确认机制、consistent hint包裹BBCode) | 主 Agent |
| 2026-07-15 | 修复evidence_board卡片无法拖动和点击：根因=ScrollContainer拦截mouse motion事件。修复=去掉ScrollContainer，EvidencePanel直接作为画布容器，Panel.mouse_filter=IGNORE让所有鼠标事件穿透到_input全局处理（按下记录起点/motion拖动/释放判定点击或拖动） | 主 Agent |
| 2026-07-15 | 修复档案袋仍卡住：_open_folder_now使用get_node_or_null双重获取，visible=false+modulate透明双重隐藏，0.5秒后queue_free删除。_process添加兜底再次隐藏。进入按钮点击也强制打开。同时更新AGENT.md使用规则，强调每次必读本文件、测试是交付前置条件 | 主 Agent |
| 2026-07-15 | 修复证据连线选择时报错 Nonexistent function 'to_local'：evidence_board.gd 中 _line_layer.to_local() 与 _cards_container.to_local() 全部改为手动 global_pos - target.global_position 计算本地坐标，兼容 Godot 4.3 Web 运行时 | 主 Agent |
| 2026-07-15 | 应用户要求还原/简化 evidence_board：CardsContainer 改回 GridContainer 自动排列，移除自由拖动与 draw 绘制，改用 Line2D 节点做连线，不再调用 to_local。GameState.add_connection 字典键点号语法改为下标语法 | 主 Agent |
| 2026-07-15 | PR-5 法庭四阶段重写：case_01.json 新增第3矛盾c_03(凶器矛盾)+court字段(证人陈述/律师还原/replay_lines/情绪反应/真相文本/required_exposed=3)；CourtSystem.gd 重写为6阶段(陈述→律师还原→逐句质询→崩溃→真相→胜利/失败)，异议改用suspects_db疑点判定，init_court清空exposed；court_trial.tscn/gd 全新布局(阶段标题/说话人/主文本/状态栏/异议+下一句按钮)，真相用Timer打字机逐字呈现+胜利手势；CaseManager.get_required_contradictions读court.required_exposed；witness_interrogation.gd移除expose_contradiction(审讯只存疑点，法庭异议才点出矛盾)；设计文档第八章更新为四阶段玩法 | 主 Agent |
| 2026-07-15 | verify-ai-pipeline 完成：新建 edgeone/functions/mock-server.js 本地模拟代理(CORS预检+witness_chat/ai_assistant双模块+错误处理)；端到端测试5项全通过(OPTIONS 204 / witness_chat 200 / ai_assistant 200 / 未知模块400 / 缺module 400)；AIService.gd 修复失败信号乱发(改为按_current_module精准_emit_fail)+新增并发保护(_busy锁)；ai_test.tscn/gd 已就绪可在Godot按F6运行测试 | 主 Agent |
| 2026-07-15 | PR-6 修复：删除法院主面板StatusLabel+AI面板内StatusSection(AIAssistantPanel.gd update_status改pass)；修复witness_interrogation.gd 326行parse error(GDScript中and/or返回bool不能与String相加) | 主 Agent |
| 2026-07-15 | 法庭对决关卡v0.7.2：CourtSystem Phase枚举重排(OPENING→STATEMENTS→CROSS_EXAMINATION...)；case_01.json加opening_statement(法官开庭词)；court_trial.gd重写流程(OPENING打字机呈现开庭词→STATEMENTS合并显示证人+律师陈词→质询) | 主 Agent |
| 2026-07-15 | 异议两步流程：court_trial.gd _show_suspect_selector→_show_evidence_selector→_resolve_objection(suspect,evidence_id)；CourtSystem.object_line加第二重证据匹配判定 | 主 Agent |
| 2026-07-15 | BGM接入：assets/audio/The_Last_Exhibit.mp3 + scripts/autoload/BGMManager.gd(循环播放/暂停/音量控制) + project.godot注册BGMManager autoload | 主 Agent |
| 2026-07-15 | PR-7 前端润色+DeepSeek接入：main_menu.tscn润色(法槌装饰/标题阴影/棕色按钮StyleBox/版本号)；story_intro.gd开场文本扩充为多段氛围文本；新建edgeone/functions/dev-server.js本地真实DeepSeek代理(witness_chat/ai_assistant/court_opening三模块)；.env.example引导配置DEEPSEEK_API_KEY；AIService.gd加court_opening模块(信号+generate_court_opening方法)；court_trial.gd开庭词优先AI生成3秒超时回落预设 | 主 Agent |
