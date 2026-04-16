# Web AI IDE

一个基于 Web + Electron 的 AI 辅助编程环境，支持多 AI 模型协作、代码编辑、终端模拟。

---

## 技术栈

| 模块 | 技术 | 版本 |
|------|------|------|
| 前端 | React, TypeScript, Vite, TailwindCSS | React 18.3, TypeScript 5.4, Vite 5.4, TailwindCSS 3.4 |
| 桌面 | Electron | 30.5 |
| 代码编辑器 | Monaco Editor | @monaco-editor/react 4.6 |
| 终端 | xterm.js | @xterm/xterm 5.5 |
| 后端 | Fastify, Node.js | Fastify 4.28 |
| 数据库 | PostgreSQL, Prisma ORM | Prisma 5.14 |
| 消息队列 | RabbitMQ, amqplib | amqplib 0.10 |
| 缓存 | Redis, ioredis | ioredis 5.4 |
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
│   │   │   ├── types.ts                 # 共享类型定义
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
│   │   │   │   ├── PTYTerminal.tsx        # WebSocket PTY 终端
│   │   │   │   ├── TerminalPanel.tsx      # 终端面板，支持多标签页
│   │   │   │   ├── terminal/              # 终端子组件
│   │   │   │   │   ├── TerminalContent.tsx  # 终端内容区，管理 PTY 连接
│   │   │   │   │   └── TerminalRenderer.tsx # xterm.js 渲染器，管理 Terminal 实例
│   │   │   │   ├── ResizeHandle.tsx      # 拖拽调整大小手柄（水平/垂直）
│   │   │   │   ├── LoginModal.tsx         # 登录弹窗
│   │   │   │   ├── Settings.tsx           # 设置面板
│   │   │   │   ├── WelcomeScreen.tsx     # 欢迎页
│   │   │   │   ├── ToolCallCard.tsx       # 工具调用卡片
│   │   │   │   ├── AboutDialog.tsx        # 关于对话框
│   │   │   │   ├── AppHeader.tsx          # 应用头部
│   │   │   │   ├── ErrorBoundary.tsx      # 错误边界
│   │   │   │   ├── Icons.tsx              # SVG 图标
│   │   │   │   └── settings/              # 设置子面板
│   │   │   │       ├── SettingsAITab.tsx         # AI 设置（Provider、API Key、模型）
│   │   │   │       ├── SettingsGeneralTab.tsx    # 通用设置（编辑器字体/Tab、UI 风格、颜色模式、语言）
│   │   │   │       └── index.ts
│   │   │   ├── contexts/                  # React Context
│   │   │   │   ├── SettingsContext.tsx    # 设置上下文 (Reducer 模式)
│   │   │   │   ├── settingsReducer.ts     # 设置 Reducer 和 Action 类型
│   │   │   │   ├── settingsTypes.ts        # 设置接口和默认值
│   │   │   │   ├── settingsTheme.ts       # 主题切换逻辑
│   │   │   │   ├── settingsStorage.ts     # 设置持久化
│   │   │   │   └── settingsHelpers.ts     # 设置辅助函数
│   │   │   ├── hooks/                     # 自定义 Hooks
│   │   │   │   ├── useChat.ts            # AI 对话逻辑
│   │   │   │   ├── useFileSystem.ts      # 文件系统操作
│   │   │   │   └── usePTY.ts            # PTY 终端连接
│   │   │   ├── services/                  # 客户端服务
│   │   │   │   ├── api.ts                # REST API 客户端
│   │   │   │   ├── websocket.ts          # WebSocket 客户端
│   │   │   │   └── pty/                  # PTY 模块（4 个文件）
│   │   │   │       ├── index.ts              # PTY 模块入口
│   │   │   │       ├── message-parser.ts     # PTY 消息协议解析器
│   │   │   │       ├── pty-connection.ts     # PTY 连接管理器
│   │   │   │       └── websocket-client.ts   # WebSocket 客户端，支持自动重连
│   │   │   ├── config/                    # 配置文件
│   │   │   │   ├── providerPresets.ts    # AI Provider 预设
│   │   │   │   └── provider-presets.json # Provider 预设数据
│   │   │   └── i18n/                     # 国际化
│   │   │       ├── translations.ts        # 翻译入口
│   │   │       ├── translations.types.ts  # 翻译类型定义
│   │   │       ├── translations.utils.ts   # 翻译工具函数
│   │   │       ├── en.translations.ts     # 英文翻译
│   │   │       └── zh.translations.ts      # 中文翻译
│   │   ├── public/                        # 静态资源
│   │   │   ├── favicon.ico               # 网站图标（ICO 格式）
│   │   │   ├── favicon.svg               # 网站图标（SVG 格式）
│   │   │   └── sw.js                     # Service Worker
│   │   ├── scripts/                       # 构建脚本
│   │   ├── index.html                     # HTML 模板
│   │   ├── vite.config.ts                # Vite 配置
│   │   ├── tailwind.config.js            # Tailwind 配置
│   │   ├── postcss.config.js             # PostCSS 配置
│   │   └── package.json
│   ├── cli/                              # 独立 React Web 应用
│   │   └── src/
│   │       ├── services/                  # API 客户端
│   │       │   ├── api.ts                # REST API
│   │       │   ├── websocket.ts          # WebSocket
│   │       │   └── pty-client.ts         # PTY
│   │       └── types.ts                  # 类型定义
│   ├── core/                            # AI 核心逻辑
│   │   └── src/
│   │       ├── index.ts                 # 模块入口，导出 AIGateway、providers、tools
│   │       ├── ai/
│   │       │   ├── gateway.ts             # AI 网关（统一接口）
│   │       │   └── providers/             # AI Provider 实现
│   │       │       ├── openai.ts        # OpenAI GPT
│   │       │       ├── anthropic.ts     # Anthropic Claude
│   │       │       └── qwen.ts         # 阿里 Qwen
│   │       ├── tools/                   # 工具实现
│   │       │   ├── registry.ts          # 工具注册表
│   │       │   ├── edit.ts             # 文件编辑
│   │       │   ├── file-read.ts        # 文件读取
│   │       │   ├── file-write.ts       # 文件写入
│   │       │   ├── glob.ts             # 文件匹配
│   │       │   ├── grep.ts             # 内容搜索
│   │       │   └── shell.ts            # Shell 执行
│   │       └── models/
│   │           └── config.ts            # 模型配置
│   ├── openclaude-temp/                 # AI Agent gRPC 服务（外部依赖）
│   │   ├── src/                        # 服务源码
│   │   ├── python/                     # Python Provider
│   │   └── scripts/                    # 启动脚本
│   ├── server/                         # Fastify 后端 API
│   │   ├── prisma/                     # 数据库 Schema 和迁移
│   │   │   ├── schema.prisma           # Prisma Schema
│   │   │   └── migrations/             # 数据库迁移
│   │   ├── scripts/                    # 管理脚本
│   │   │   ├── add-admin.ts            # 创建管理员用户
│   │   │   └── agent-grpc-sidecar.ts   # gRPC sidecar 启动器
│   │   └── src/
│   │       ├── index.ts                # 服务入口
│   │       ├── routes/                 # API 路由
│   │       │   ├── auth.ts             # 认证
│   │       │   ├── projects.ts         # 项目 CRUD
│   │       │   ├── sessions.ts         # 会话 CRUD
│   │       │   ├── chat.ts             # 聊天 WebSocket
│   │       │   ├── files.ts            # 文件操作
│   │       │   ├── terminal.ts         # 终端 WebSocket
│   │       │   └── pty.ts              # PTY WebSocket
│   │       ├── services/               # 业务逻辑
│   │       │   ├── auth.service.ts
│   │       │   ├── project.service.ts
│   │       │   ├── session.service.ts
│   │       │   ├── session-cache.service.ts
│   │       │   ├── tenant.service.ts
│   │       │   ├── pty.service.ts
│   │       │   ├── queue.service.ts
│   │       │   ├── tool-whitelist.ts
│   │       │   ├── shellRegistry.ts
│   │       │   ├── agent-session-manager.ts
│   │       │   ├── agent-process-manager.ts
│   │       │   └── bun-grpc-chat-bridge.ts
│   │       ├── middleware/             # 中间件
│   │       │   └── tenant.ts           # 租户中间件
│   │       ├── plugins/                # Fastify 插件
│   │       │   └── tenant.plugin.ts    # 租户插件
│   │       ├── utils/                  # 工具函数
│   │       │   ├── encryption.ts       # AES-256-GCM 加密
│   │       │   ├── prisma.ts           # Prisma 客户端
│   │       │   ├── redis.ts            # Redis 客户端
│   │       │   └── rabbitmq.ts         # RabbitMQ 客户端
│   │       └── types/                  # 类型定义
│   │           └── grpc.ts             # gRPC 类型定义
│   ├── worker/                         # RabbitMQ 工作进程
│   │   └── src/
│   │       └── index.ts                # Worker 入口，消费 AI 任务队列
│   └── shared/                         # 共享类型定义
│       └── src/
│           ├── index.ts                # 共享导出
│           └── types.ts                # 共享类型
├── docs/                               # 设计文档
│   ├── frontend_zh.md                  # 前端设计文档
│   ├── websocket-protocol.md           # WebSocket 协议
│   └── ...
├── docker-compose.yml                  # Docker 编排
├── debug.ps1                          # 一键启动脚本
├── Dockerfile                         # Docker 镜像
├── nginx.conf                         # Nginx 配置
├── package.json                       # 根 package.json
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

### 终端

内置 Web 终端，支持 WebSocket PTY 连接。

### 多模型支持

支持 OpenAI GPT、Anthropic Claude、Qwen 等。

```typescript
// 在 Settings 面板配置 API Key
// 或通过环境变量:
// bash: export OPENAI_API_KEY=sk-...
// PowerShell: $env:OPENAI_API_KEY="sk-..."
```

---

## API 文档

### REST 端点

#### POST /api/auth/register

注册新用户。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| email | string | 是 | 有效邮箱地址 |
| password | string | 是 | 最少 8 个字符 |
| name | string | 否 | 显示名称 |

返回值: `{ user }` - 创建的用户对象

#### POST /api/auth/login

登录并获取 JWT 令牌。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| email | string | 是 | 邮箱地址 |
| password | string | 是 | 密码 |

返回值: `{ user, token }` - 用户对象和 JWT 令牌

#### GET /api/auth/me

获取当前用户信息（需认证）。

返回值: `{ user }` - 当前用户对象

#### GET /api/projects

列出用户所有项目。

返回值: `Project[]` — 项目数组

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

返回值: `Project` — 创建的项目对象

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

返回值: `{ success: boolean }`

#### GET /api/sessions/:id

获取会话详情。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 会话 ID |

返回值: `Session` — 会话对象

#### POST /api/sessions

创建新会话。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| projectId | string | 是 | 关联的项目 ID |

返回值: `Session` — 创建的会话对象

#### GET /api/files/:projectId/*

读取项目文件内容（需认证）。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| projectId | string | 是 | 项目 ID（路径参数） |
| * | string | 是 | 项目内文件路径 |

返回值: 文件内容或元数据

### WebSocket 事件

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

**连接端点**: `ws://localhost:3001/ws/pty`

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

#### 列出会话 (Client → Server)

| 参数 | 类型 | 说明 |
|------|------|------|
| type | string | 固定 `"list"` |

#### 会话退出 (Server → Client)

| 参数 | 类型 | 说明 |
|------|------|------|
| type | string | 固定 `"exit"` |
| payload.sessionId | string | 会话 ID |
| payload.exitCode | number | 退出码 |

#### 错误 (Server → Client)

| 参数 | 类型 | 说明 |
|------|------|------|
| type | string | 固定 `"error"` |
| payload.sessionId | string | 会话 ID |
| payload.message | string | 错误消息 |

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

## Worker

`packages/worker` 包是一个 RabbitMQ 消费者进程，负责异步处理 AI 任务。它监听 `ai.tasks` 队列，处理传入的 AI 请求，并将结果发布到 `ai.results` 队列。这使 AI 推理与主服务器解耦，支持 AI 处理能力的水平扩展。

---

## 贡献指南

### 提 Issue

- Bug Report: 使用 [issue 模板](https://github.com/your/web-ai-ide/issues/new?template=bug_report.yml)，描述复现步骤、环境信息
- Feature Request: 使用 [feature 模板](https://github.com/your/web-ai-ide/issues/new?template=feature_request.yml)，说明使用场景和预期行为

### 分支命名

- `feat/xxx` — 新功能
- `fix/xxx` — bug 修复
- `docs/xxx` — 文档更新
- `refactor/xxx` — 代码重构

### 开发流程

1. Fork 本仓库，基于 `main` 创建功能分支: `git checkout -b feat/your-feature`
2. 提交前确保 lint 和类型检查通过: `npm run lint && npm run typecheck`
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
