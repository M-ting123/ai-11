# 逆转AI·法庭 — Godot 项目骨架

> 腾讯云黑客松2026参赛作品
> 引擎: Godot 4.3 | 语言: GDScript | 导出: Web (HTML5)

## 一、安装 Godot 4.3（首次使用）

Godot 是免安装绿色版，下载解压即可用：

1. **下载 Godot 4.3 标准版**
   - 访问 https://godotengine.org/download/windows/
   - 下载 **Standard** 版本（不是 .NET 版本）
   - 文件名类似 `Godot_v4.3-stable_win64.exe.zip`

2. **解压**
   - 解压 zip 到任意目录，例如 `C:\Tools\Godot\`
   - 里面只有一个 `Godot_v4.3-stable_win64.exe`

3. **下载 Web 导出模板（导出Web时才需要）**
   - 打开 Godot 编辑器
   - 菜单: Editor → Editor Data → Manage Export Templates
   - 点击 Download，等待下载完成

## 二、打开项目

### 方式 A：通过 Godot 项目管理器
1. 双击运行 `Godot_v4.3-stable_win64.exe`
2. 点击 **Import**（导入）
3. 选择 `c:\Users\Mting\WorkBuddy\游戏项目1\project.godot`
4. 点击 **Import & Edit**

### 方式 B：命令行直接打开
```powershell
& "C:\Tools\Godot\Godot_v4.3-stable_win64.exe" --path "c:\Users\Mting\WorkBuddy\游戏项目1"
```

## 三、项目结构

```
游戏项目1/
├── project.godot              # 项目配置（分辨率1920x1080、Autoload注册）
├── export_presets.cfg         # Web导出预设
├── icon.svg                   # 项目图标
│
├── scripts/
│   ├── autoload/              # 全局单例（自动加载）
│   │   ├── SceneManager.gd    # 场景切换管理器（fade过渡）
│   │   ├── GameState.gd       # 游戏状态（证据库/证词库/矛盾列表）
│   │   └── AIService.gd       # AI调用服务（HTTP→EdgeOne→DeepSeek）
│   ├── systems/               # 纯逻辑类（非Node）
│   │   ├── CaseManager.gd     # 案件数据加载与查询
│   │   ├── WitnessSystem.gd   # 证人Prompt构建与对话管理
│   │   └── CourtSystem.gd     # 法庭流程与胜负判定
│   └── data/
│       └── CaseData.gd        # 数据结构定义与JSON加载
│
├── data/cases/
│   └── case_01.json           # 关卡1教学案数据
│
├── scenes/                    # 场景文件（待创建）
├── assets/                    # 美术/音效资源（待创建）
└── edgeone/functions/         # EdgeOne Functions代理（待创建）
```

## 四、3个 Autoload 单例

在代码中直接使用，无需 get_node：

| 单例 | 用途 | 关键方法 |
|:---|:---|:---|
| `SceneManager` | 场景切换 | `SceneManager.change_scene("court_trial")` |
| `GameState` | 游戏状态 | `GameState.add_testimony(...)`, `GameState.get_verdict()` |
| `AIService` | AI调用 | `AIService.chat_with_witness(...)`, `AIService.analyze_evidence(...)` |

## 五、下一步

- [ ] 搭建7个场景骨架（main_menu → verdict）
- [ ] 创建 EdgeOne Functions AI代理
- [ ] 跑通 Godot → EdgeOne → DeepSeek 调用链路
