# Web AI IDE

一个基于 Web + Electron 的 AI 辅助编程环境，支持多 AI 模型协作、代码编辑、终端模拟。

---

## 技术栈

| 模块 | 技术 | 版本 |
|------|------|------|
| 前端 | React, TypeScript, Vite, TailwindCSS | React 18, TypeScript 5.x |
| 桌面 | Electron | 30.x |
| 代码编辑器 | Monaco Editor | 最新稳定版 |
| 后端 | Fastify, Node.js | Fastify 4 |
| 数据库 | PostgreSQL, Prisma ORM | PostgreSQL 16 |
| 容器 | Docker, Docker Compose | - |

---

## 目录结构

```
web-ai-ide/
├── packages/
│   ├── electron/                        # Electron 桌面应用
│   │   ├── electron/                    # 主进程代码
│   │   │   ├── main.ts                  # Electron 主进程入口
│   │   │   └── preload.ts               # 预加载脚本，安全暴露 IPC
│   │   ├── src/                         # React 前端
│   │   │   ├── App.tsx                  # 根组件
│   │   │   ├── main.tsx                 # 前端入口
│   │   │   ├── index.css                # 全局样式 (Tailwind)
│   │   │   ├── types.ts                  # 共享类型定义
│   │   │   ├── components/               # UI 组件
│   │   │   │   ├── Layout.tsx            # 布局组件 (Header + Sidebar)
│   │   │   │   ├── Chat.tsx              # AI 对话面板
│   │   │   │   ├── ChatInput.tsx         # 对话输入框
│   │   │   │   ├── ChatMessage.tsx       # 消息气泡
│   │   │   │   ├── Editor.tsx            # Monaco 编辑器
│   │   │   │   ├── EditorTabs.tsx        # 编辑器标签页
│   │   │   │   ├── FileExplorer.tsx      # 文件浏览器
│   │   │   │   ├── FileTree.tsx          # 文件树组件
│   │   │   │   ├── Header.tsx            # 顶部导航栏
│   │   │   │   ├── MenuBar.tsx           # 菜单栏
│   │   │   │   ├── Sidebar.tsx           # 侧边栏
│   │   │   │   ├── PTYTerminal.tsx      # WebSocket PTY 终端
│   │   │   │   ├── LoginModal.tsx        # 登录弹窗
│   │   │   │   ├── Settings.tsx          # 设置面板
│   │   │   │   ├── WelcomeScreen.tsx    # 欢迎页
│   │   │   │   ├── ToolCallCard.tsx      # 工具调用卡片
│   │   │   │   ├── AboutDialog.tsx       # 关于对话框
│   │   │   │   ├── AppHeader.tsx         # 应用头部
│   │   │   │   ├── ErrorBoundary.tsx      # 错误边界
│   │   │   │   ├── Icons.tsx             # SVG 图标
│   │   │   │   └── settings/             # 设置子面板
│   │   │   │       ├── SettingsAITab.tsx       # AI 设置
│   │   │   │       ├── SettingsAppearanceTab.tsx  # 外观设置
│   │   │   │       ├── SettingsDatabaseTab.tsx   # 数据库设置
│   │   │   │       ├── SettingsEditorTab.tsx     # 编辑器设置
│   │   │   │       ├── SettingsLanguageTab.tsx   # 语言设置
│   │   │   │       └── index.ts
│   │   │   ├── contexts/                 # React Context
│   │   │   │   ├── SettingsContext.tsx   # 设置上下文 (Reducer 模式)
│   │   │   │   ├── settingsReducer.ts    # 设置 Reducer 和 Action 类型
│   │   │   │   ├── settingsTypes.ts     # 设置接口和默认值
│   │   │   │   ├── settingsTheme.ts     # 主题切换逻辑
│   │   │   │   ├── settingsStorage.ts   # 设置持久化
│   │   │   │   └── settingsHelpers.ts   # 设置辅助函数
│   │   │   ├── hooks/                    # 自定义 Hooks
│   │   │   │   ├── useChat.ts           # AI 对话逻辑
│   │   │   │   ├── useFileSystem.ts     # 文件系统操作
│   │   │   │   └── usePTY.ts            # PTY 终端连接
│   │   │   ├── services/                 # 客户端服务
│   │   │   │   ├── api.ts               # REST API 客户端
│   │   │   │   ├── websocket.ts         # WebSocket 客户端
│   │   │   │   └── pty-client.ts        # PTY WebSocket 客户端
│   │   │   ├── config/                   # 配置文件
│   │   │   │   ├── providerPresets.ts   # AI provider 预设
│   │   │   │   └── provider-presets.json
│   │   │   └── i18n/                    # 国际化
│   │   │       ├── translations.ts      # 翻译入口
│   │   │       ├── translations.types.ts # 翻译类型定义
│   │   │       ├── translations.utils.ts # 翻译工具函数
│   │   │       ├── en.translations.ts   # 英文翻译
│   │   │       └── zh.translations.ts   # 中文翻译
│   │   ├── public/                       # 静态资源
│   │   │   ├── favicon.svg              # 网站图标
│   │   │   └── sw.js                    # Service Worker
│   │   ├── scripts/                      # 构建脚本
│   │   ├── index.html                    # HTML 模板
│   │   ├── vite.config.ts               # Vite 配置
│   │   ├── tailwind.config.js           # Tailwind 配置
│   │   ├── postcss.config.js            # PostCSS 配置
│   │   └── package.json
│   ├── cli/                             # 独立 React Web 应用
│   │   └── src/
│   │       ├── services/                 # API 客户端
│   │       │   ├── api.ts               # REST API
│   │       │   ├── websocket.ts         # WebSocket
│   │       │   └── pty-client.ts        # PTY
│   │       └── types.ts                 # 类型定义
│   ├── core/                           # AI 核心逻辑
│   │   └── src/
│   │       ├── ai/
│   │       │   ├── gateway.ts           # AI 网关 (统一接口)
│   │       │   └── providers/           # AI Provider 实现
│   │       │       ├── openai.ts      # OpenAI GPT
│   │       │       ├── anthropic.ts   # Anthropic Claude
│   │       │       └── qwen.ts        # 阿里 Qwen
│   │       ├── tools/                  # 工具实现
│   │       │   ├── registry.ts         # 工具注册表
│   │       │   ├── edit.ts            # 文件编辑
│   │       │   ├── file-read.ts       # 文件读取
│   │       │   ├── file-write.ts      # 文件写入
│   │       │   ├── glob.ts            # 文件匹配
│   │       │   ├── grep.ts            # 内容搜索
│   │       │   └── shell.ts           # Shell 执行
│   │       └── models/
│   │           └── config.ts           # 模型配置
│   ├── openclaude-temp/                # AI Agent gRPC 服务 (外部依赖)
│   │   ├── src/                        # 服务源码
│   │   ├── python/                     # Python Provider
│   │   ├── scripts/                    # 启动脚本
│   │   └── proto/                      # gRPC 协议定义
│   ├── server/                        # Fastify 后端 API
│   │   └── src/
│   │       └── ...                    # 后端路由、Service、Prisma Schema
│   └── shared/                        # 共享类型定义
│       └── ...
├── docs/                              # 设计文档
│   ├── frontend_zh.md                  # 前端设计文档
│   ├── websocket-protocol.md           # WebSocket 协议
│   └── ...
├── release/                           # 构建输出
├── docker-compose.yml                 # Docker 编排
├── debug.ps1                         # 一键启动脚本
├── Dockerfile                        # Docker 镜像
├── nginx.conf                        # Nginx 配置
├── package.json                      # 根 package.json
└── README.md
```

---

## 安装 / 快速上手

### 环境要求

- Node.js >= 20.0
- Docker >= 24.0
- PostgreSQL >= 16（不使用 Docker 时）

### 桌面应用（推荐）

```powershell
# 1. 克隆
git clone https://github.com/your/web-ai-ide.git
cd web-ai-ide

# 2. 设置数据库凭据（必需）
$env:POSTGRES_USER="your_username"
$env:POSTGRES_PASSWORD="your_strong_password"

# 3. 一键启动
.\debug.ps1
```

`debug.ps1` 脚本自动完成：
- 启动 PostgreSQL（Docker）
- 初始化数据库（Prisma）
- 启动后端服务
- 启动桌面应用

### Docker 部署

```bash
# 1. 克隆
git clone https://github.com/your/web-ai-ide.git
cd web-ai-ide

# 2. 启动
docker-compose up -d
```

### 开发模式

```bash
# 后端
cd packages/server
npm install
npx prisma generate
npx prisma db push
npm run dev

# 桌面应用
cd packages/electron
npm install
npm run dev
```

---

## 功能说明

### AI 对话

与 AI 助手实时对话，支持流式响应。

```typescript
// 发送消息
ws.send(JSON.stringify({
  type: 'chat:message',
  sessionId: 'session_xxx',
  message: '解释这段代码'
}));
```

### 代码编辑器

基于 Monaco Editor，支持多标签页、语法高亮。

```typescript
// 打开文件
const content = await api.readFile(projectId, '/src/index.ts');
```

### 文件管理器

项目文件树，支持创建、编辑、删除。

```typescript
// 创建文件
await api.writeFile(projectId, '/src/utils.ts', 'export function helper() {}');
```

### 终端模拟器

内置 Web 终端，支持 WebSocket PTY 连接。

### 多模型支持

支持 OpenAI GPT、Anthropic Claude、Qwen 等。

```typescript
// 在 Settings 面板配置 API Key
// 或通过环境变量
env OPENAI_API_KEY=sk-...
```

---

## API 文档

### REST Endpoints

#### GET /api/projects

列出用户所有项目。

返回值：`Project[]` — 项目数组

**示例**
```typescript
const projects = await fetch('/api/projects', {
  headers: { 'Authorization': `Bearer ${token}` }
});
// [{ id: "proj_xxx", name: "my-project", path: "/path/to/project" }, ...]
```

#### POST /api/projects

创建新项目。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 项目名称，1-50 字符 |
| path | string | 是 | 项目路径 |
| userId | string | 是 | 用户 ID |

返回值：`Project` — 创建的项目对象

**示例**
```typescript
const project = await fetch('/api/projects', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({ name: 'my-project', path: '/path/to/project', userId: 'user_123' })
});
// { id: "proj_xxx", name: "my-project", path: "/path/to/project", userId: "user_123", createdAt: "..." }
```

#### DELETE /api/projects/:id

删除指定项目。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 项目 ID |

返回值：`{ success: boolean }`

#### GET /api/sessions/:id

获取会话详情。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 会话 ID |

返回值：`Session` — 会话对象

#### POST /api/sessions

创建新会话。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| projectId | string | 是 | 关联的项目 ID |

返回值：`Session` — 创建的会话对象

### WebSocket Events

#### chat:message (Client → Server)

发送聊天消息。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | string | 是 | 固定 `"message"` |
| content | string | 是 | 消息内容 |

**示例**
```typescript
ws.send(JSON.stringify({
  type: 'message',
  content: '解释这段代码'
}));
```

#### chat:stream (Server → Client)

AI 流式响应。

| 参数 | 类型 | 说明 |
|------|------|------|
| type | string | 事件类型 |
| sessionId | string | 会话 ID |
| content | string | 响应内容片段 |

#### chat:tool_call (Server → Client)

工具调用请求。

| 参数 | 类型 | 说明 |
|------|------|------|
| type | string | 事件类型 |
| toolCallId | string | 调用 ID |
| tool | string | 工具名称 |
| params | object | 工具参数 |

#### chat:approve (Client → Server)

批准工具调用。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | string | 是 | 固定 `"approve"` |
| toolCallId | string | 是 | 调用 ID |

#### chat:reject (Client → Server)

拒绝工具调用。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | string | 是 | 固定 `"reject"` |
| toolCallId | string | 是 | 调用 ID |

### PTY WebSocket

内置终端模拟器，通过 WebSocket 连接 PTY 服务。

**连接端点**：`ws://localhost:3001/ws/pty`

#### 创建会话 (Client → Server)

| 参数 | 类型 | 说明 |
|------|------|------|
| type | string | 固定 `"create"` |
| payload.cols | number | 列数，默认 80 |
| payload.rows | number | 行数，默认 24 |

**示例**
```typescript
ws.send(JSON.stringify({
  type: 'create',
  payload: { cols: 80, rows: 24 }
}));
```

#### 会话创建成功 (Server → Client)

| 参数 | 类型 | 说明 |
|------|------|------|
| type | string | 固定 `"created"` |
| sessionId | string | 会话 ID |

#### 输出数据 (Server → Client)

| 参数 | 类型 | 说明 |
|------|------|------|
| type | string | 固定 `"output"` |
| payload.data | string | 终端输出数据 |

#### 输入数据 (Client → Server)

| 参数 | 类型 | 说明 |
|------|------|------|
| type | string | 固定 `"input"` |
| payload.sessionId | string | 会话 ID |
| payload.data | string | 输入数据 |

#### 调整大小 (Client → Server)

| 参数 | 类型 | 说明 |
|------|------|------|
| type | string | 固定 `"resize"` |
| payload.sessionId | string | 会话 ID |
| payload.cols | number | 新列数 |
| payload.rows | number | 新行数 |

#### 断开连接 (Client → Server)

| 参数 | 类型 | 说明 |
|------|------|------|
| type | string | 固定 `"kill"` |
| payload.sessionId | string | 会话 ID |

### gRPC 接口

```protobuf
service AgentService {
  rpc Chat(stream ClientMessage) returns (stream ServerMessage);
}
```

| 参数 | 类型 | 说明 |
|------|------|------|
| GRPC_PORT | number | 默认 `50051` |
| GRPC_HOST | string | 默认 `localhost` |

---

## 数据库

### 环境变量

```
DATABASE_URL="postgresql://user:pass@localhost:5432/db"
```

### 数据加密

敏感字段使用 AES-256-GCM 加密：

| 字段 | 模型 |
|------|------|
| apiKeys | User |
| path | Project |
| cwd | Session |
| content, systemPayload | Message |

---

## 贡献指南

### 提 Issue

- Bug Report：使用 [issue 模板](https://github.com/your/web-ai-ide/issues/new?template=bug_report.yml)，描述复现步骤、环境信息
- Feature Request：使用 [feature 模板](https://github.com/your/web-ai-ide/issues/new?template=feature_request.yml)，说明使用场景和预期行为

### 分支命名

- `feat/xxx` — 新功能
- `fix/xxx` — bug 修复
- `docs/xxx` — 文档更新
- `refactor/xxx` — 代码重构

### 开发流程

1. Fork 本仓库，基于 `main` 创建功能分支：`git checkout -b feat/your-feature`
2. 提交前确保 lint 和类型检查通过：`npm run lint && npm run typecheck`
3. 若涉及公开 API 变更，同步更新 README 文档
4. 发起 Pull Request，描述改动目的和测试方法

### 本地开发

```bash
# lint
npm run lint

# 类型检查
npm run typecheck

# 测试
npm test
```

---

## License

MIT License