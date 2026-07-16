# 部署「逆转AI·法庭」到 Vercel

## 项目结构

```
export/web/                    ← Vercel 项目根目录（部署此目录）
├── api/
│   └── ai-proxy.js            ← Vercel Serverless Function（AI 代理）
├── index.html                 ← Godot Web 导出（HTML5）
├── index.js                   ← Godot 引擎 JS
├── index.wasm                 ← WebAssembly（43MB，Vercel 自动 Gzip → 9MB）
├── index.pck                  ← 游戏数据包
├── index.audio.worklet.js     ← 音频处理
├── index.icon.png             ← 图标
├── index.png                  ← 启动画面
├── index.apple-touch-icon.png
├── vercel.json                ← Vercel 配置（COOP/COEP 头 + API 路由）
├── package.json
└── .vercelignore
```

## 一、前置准备

### 1. 安装 Vercel CLI
```bash
npm i -g vercel
```

### 2. 注册 DeepSeek API Key
- 访问 https://platform.deepseek.com/
- 注册并创建 API Key

## 二、部署步骤

### 1. 进入部署目录
```bash
cd export/web
```

### 2. 首次部署（交互式）
```bash
vercel
```

按提示：
- **Set up and deploy?** → Y
- **Which scope?** → 选择你的团队/个人账户
- **Link to existing project?** → N（首次）
- **Project name?** → `reverse-ai-court`（或自定义）
- **In which directory is your code located?** → `./`（当前目录）
- **Want to override settings?** → N

### 3. 配置环境变量
```bash
vercel env add DEEPSEEK_API_KEY
```

粘贴你的 DeepSeek API Key，选择所有环境（Production / Preview / Development）。

### 4. 部署到生产环境
```bash
vercel --prod
```

## 三、Godot 游戏端配置

部署到 Vercel 后，**Godot 代码中的 `AIService.proxy_url` 需要改为同源路径**：

### 修改 `scripts/autoload/AIService.gd`

```gdscript
# 部署到 Vercel 时改为同源相对路径
var proxy_url: String = "/api/ai-proxy"
```

### 重新导出 Godot Web 版本
1. 在 Godot 编辑器中打开项目
2. 菜单：Project → Export → Web (HTML5)
3. 导出到 `export/web/` 目录
4. 或者导出到临时目录，然后复制以下文件到 `export/web/`：
   - `index.html`
   - `index.js`
   - `index.wasm`
   - `index.pck`
   - `index.audio.worklet.js`
   - `index.icon.png`
   - `index.apple-touch-icon.png`
   - `index.png`

### 5. 重新部署
```bash
cd export/web
vercel --prod
```

## 四、本地开发测试

### 方式 A：用 Godot 直接运行（F5）
在 Godot 编辑器中使用 Mock 服务器或本地 dev-server。

Godot 中 `AIService.proxy_url` 设为本地地址：
```gdscript
var proxy_url: String = "http://localhost:8787/api/ai-proxy"
```

启动本地 AI 代理（需安装 Node.js ≥18）：
```bash
cd export/web
DEEPSEEK_API_KEY=sk-你的密钥 node server.js
```

### 方式 B：用 Vercel CLI 本地模拟
```bash
cd export/web
vercel dev
```
浏览器访问 `http://localhost:3000`，API 路由 `/api/ai-proxy` 自动模拟。

## 五、环境变量参考

| 变量名 | 必填 | 说明 | 配置位置 |
|:---|:---|:---|:---|
| `DEEPSEEK_API_KEY` | ✅ | DeepSeek API 密钥 | Vercel Dashboard → Settings → Environment Variables |

## 六、重要说明

### COOP/COEP 安全头
`vercel.json` 已配置以下 HTTP 响应头，确保 Godot Web SharedArrayBuffer 正常运行：

- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Embedder-Policy: require-corp`
- `Cross-Origin-Resource-Policy: cross-origin`

### WASM 文件大小
- `index.wasm` 原始大小 43MB
- Vercel 自动 Gzip 压缩后约 9MB 传输
- Vercel 静态文件限制 100MB（安全）

### Serverless Function 限制
- 执行超时：30 秒（Hobby 计划 10s，Pro 可达 60s）
- 内存：512MB
- 请求体大小：4.5MB（游戏 AI 请求远小于此限制）
