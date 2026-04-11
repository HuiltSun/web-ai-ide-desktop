# Web AI IDE

一个基于 Web + Electron 的 AI 辅助编程环境，类似于 Claude Code。

[English](README.md) | [中文](README_zh.md)

---

## 功能特点

- 🤖 **AI 对话** - 与 AI 助手实时对话，支持流式响应
- 💻 **代码编辑器** - 基于 Monaco Editor 的专业代码编辑
- 📁 **文件管理器** - 项目文件树，支持创建、编辑、删除
- 🖥️ **终端模拟器** - 内置 Web 终端
- 🔧 **工具系统** - AI 可调用文件读写、Shell 命令等工具
- 🔄 **多模型支持** - OpenAI GPT、Anthropic Claude、Qwen 等
- 💾 **会话管理** - 保存和恢复对话历史（PostgreSQL 存储）
- 🗄️ **项目管理** - 项目持久化存储（PostgreSQL）
- 🐳 **Docker 部署** - 快速部署到任何环境
- 💻 **桌面应用** - Windows EXE 原生桌面应用
- 🌐 **国际化** - 支持中英文界面切换
- 📋 **自定义菜单栏** - 自定义深色主题菜单栏，与设计系统统一

---

## 技术栈

| 模块 | 技术 |
|------|------|
| 前端 | React 18, TypeScript, Vite, TailwindCSS |
| 桌面 | Electron 30 |
| 代码编辑器 | Monaco Editor |
| 后端 | Fastify 4, Node.js |
| 数据库 | PostgreSQL 16, Prisma ORM |
| AI 集成 | OpenAI, Anthropic, Qwen |
| 容器化 | Docker, Docker Compose |
| 打包 | Electron Builder |

---

## 快速开始

### 环境要求

- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 16+ (如不使用 Docker)

### 方式一：桌面应用（推荐）- 一键启动

**使用 debug.ps1 脚本一键启动：**
```powershell
cd web-ai-ide
# 设置数据库凭据（必需）
$env:POSTGRES_USER="your_username"
$env:POSTGRES_PASSWORD="your_strong_password"
.\debug.ps1
```

**⚠️ 安全配置要求：**
- `POSTGRES_USER` 和 `POSTGRES_PASSWORD` 必须通过环境变量设置
- 请使用强密码，不要使用默认值或弱密码
- 凭据不会存储在脚本中，每次运行需重新设置

该脚本自动完成：
- 启动 PostgreSQL 数据库 (Docker)
- 初始化数据库 Schema (Prisma)
- 在新窗口启动后端服务器
- 启动最新版本的桌面应用

**手动启动步骤（可选）：**

1. 构建 EXE：
```bash
cd packages/electron
npm install
$env:POSTGRES_USER="myuser"; $env:POSTGRES_PASSWORD="StrongPass123!"; .\debug.ps1
```

2. 启动 PostgreSQL 数据库：
```bash
docker run -d --name webaiide-postgres \
  -e POSTGRES_USER=your_username \
  -e POSTGRES_PASSWORD=your_strong_password \
  -e POSTGRES_DB=webaiide \
  -p 5432:5432 postgres:16
```

3. 启动后端服务器：
```bash
cd packages/server
npm install
npx prisma generate
npx prisma db push
npm run dev
```

4. 运行桌面应用：
```
web-ai-ide\launch.bat
```
或直接运行：
```
web-ai-ide\release\release-{timestamp}\Web AI IDE Setup 1.0.0.exe
```

**💡 提示**：构建后 `launch.bat` 会自动更新为最新构建的 EXE 路径。

### 方式二：Docker 部署

```bash
docker-compose up -d
```

### 方式三：开发模式

**后端：**
```bash
cd packages/server
npm run dev  # http://localhost:3001
```

**桌面应用：**
```bash
cd packages/electron
npm run dev
```

### 方式四：gRPC 服务（AI Agent 引擎）

`openclaude-temp` 提供了一个无头 gRPC 服务器，通过双向流暴露 AI Agent 能力（工具调用、bash、文件编辑等）。服务器处理完整的 AI 工作流，包括工具执行和用户权限提示。

#### 快速开始

**1. 安装依赖：**
```bash
cd packages/openclaude-temp
bun install
bun run build
```

**2. 配置 AI Provider：**

创建 `packages/openclaude-temp/.env` 文件：
```bash
# 通义千问（默认）
OPENAI_API_KEY="your-qwen-api-key"
OPENAI_BASE_URL="https://dashscope.aliyuncs.com/compatible-mode/v1"
OPENAI_MODEL="qwen3.5-plus"

# OpenAI
CLAUDE_CODE_USE_OPENAI=1
OPENAI_API_KEY="your-openai-key"
OPENAI_MODEL="gpt-4o"

# Anthropic
ANTHROPIC_API_KEY="your-anthropic-key"
ANTHROPIC_MODEL="claude-sonnet-4-5"
```

**3. 启动 gRPC Server：**
```bash
cd packages/openclaude-temp
bun run dev:grpc
```
Server 默认运行在 `localhost:50051`。可通过 `GRPC_PORT` 和 `GRPC_HOST` 环境变量配置。

**4. 使用 gRPC CLI 测试：**
```bash
cd packages/openclaude-temp
bun run dev:grpc:cli
```

#### gRPC CLI 使用方法

交互式 CLI 会流式输出 token、显示工具调用，并在需要时提示用户授权（y/n）：

```bash
> 当前目录下有哪些文件？
[Tool Call] Bash
{"command": "ls -la"}

工具执行成功。

[生成完成]
```

输入 `/exit` 或 `/quit` 结束会话。

#### 协议定义

gRPC 接口定义在 `src/proto/openclaude.proto`：

```protobuf
service AgentService {
  rpc Chat(stream ClientMessage) returns (stream ServerMessage);
}
```

**ClientMessage 类型：**
- `ChatRequest` - 初始请求，包含 session_id、message 和 working_directory
- `UserInput` - 用户对权限提示的响应（reply + prompt_id）
- `CancelSignal` - 中断当前生成

**ServerMessage 类型：**
- `TextChunk` - 流式文本 token
- `ToolCallStart` - Agent 开始执行工具
- `ToolCallResult` - 工具执行结果
- `ActionRequired` - 需要用户授权
- `FinalResponse` - 生成完成，包含 token 统计
- `ErrorResponse` - 发生错误

#### 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `GRPC_PORT` | `50051` | gRPC 服务器端口 |
| `GRPC_HOST` | `localhost` | gRPC 服务器绑定地址 |
| `OPENAI_API_KEY` | - | OpenAI 兼容 Provider 的 API Key |
| `OPENAI_BASE_URL` | - | API 端点基础 URL |
| `OPENAI_MODEL` | - | 模型名称 |
| `ANTHROPIC_API_KEY` | - | Anthropic 的 API Key |
| `ANTHROPIC_MODEL` | - | Anthropic 模型名称 |

#### 运行时兼容性

gRPC 客户端**必须使用 Bun 运行**（不能使用 Node.js 或 npx tsx）。Node.js gRPC 实现与 Bun 运行时存在协议兼容性问题。

**正确方式：**
```bash
bun run dev:grpc:cli
```

**错误方式（会失败）：**
```bash
npx tsx scripts/grpc-cli.ts  # ❌ 协议错误
node scripts/grpc-cli.ts     # ❌ 协议错误
```

---

## 项目结构

```
web-ai-ide/
├── packages/
│   ├── electron/             # Electron 桌面应用
│   │   ├── electron/         # 主进程 (main.ts, preload.ts)
│   │   ├── src/             # React 前端
│   │   │   ├── components/   # Chat, Editor, FileExplorer, Terminal, Settings, MenuBar, AboutDialog...
│   │   │   ├── hooks/       # useChat, useFileSystem, useTerminal
│   │   │   ├── services/    # api.ts, websocket.ts
│   │   │   ├── contexts/    # SettingsContext
│   │   │   ├── i18n/       # translations.ts (国际化)
│   │   │   └── index.css   # 设计系统 (CSS 变量)
│   │   ├── scripts/         # build-with-timestamp.cjs
│   │   └── dist/           # 构建输出
│   │
│   ├── cli/                  # 独立 React Web 应用
│   │   └── src/
│   │       ├── components/   # UI 组件
│   │       ├── hooks/        # useChat, useFileSystem, useTerminal
│   │       ├── services/     # api.ts, websocket.ts
│   │       └── contexts/     # SettingsContext
│   │
│   ├── core/                  # AI 核心逻辑 (AIGateway + Providers)
│   │   └── src/
│   │       ├── ai/           # gateway.ts + providers (openai, anthropic, qwen)
│   │       ├── models/        # config.ts
│   │       └── tools/        # edit, file-read, file-write, glob, grep, registry
│   │
│   ├── openclaude-temp/       # AI Agent gRPC 服务
│   │   └── src/
│   │       ├── grpc/         # gRPC server (QueryEngine)
│   │       ├── tools/        # Agent tools (Bash, Read, Write, Grep...)
│   │       └── proto/        # openclaude.proto 定义
│   │
│   ├── server/               # Fastify 后端 API
│   │   ├── src/
│   │   │   ├── routes/       # auth, chat, files, projects, sessions, terminal
│   │   │   ├── services/      # auth, project, session, tenant, pty, shellRegistry, agent-*
│   │   │   └── utils/        # encryption, prisma, redis, rabbitmq
│   │   └── prisma/           # 数据库 schema
│   │
│   └── shared/               # 共享类型定义

├── release/                  # 构建输出 (release-{timestamp}/)
├── docs/                     # 设计文档
├── docker-compose.yml        # Docker 编排
├── debug.ps1                 # 一键启动脚本
├── launch.bat                # 快捷启动脚本 (自动生成)
└── package.json
```

---

## 数据库

### PostgreSQL 配置

环境变量 (`packages/server/.env`)：
```
DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:5432/${POSTGRES_DB}?schema=public"
```

**⚠️ 安全提示：** 请在运行前设置 `POSTGRES_USER` 和 `POSTGRES_PASSWORD` 环境变量。

### 数据库模型

- **User** - 用户账户
- **Project** - 项目（关联用户）
- **Session** - 会话（关联项目，支持 cwd、gitBranch）
- **Message** - 消息（支持 uuid 链、工具调用）

### 数据库迁移

```bash
cd packages/server
npx prisma generate    # 生成 Prisma Client
npx prisma db push      # 推送 schema 到数据库
```

### 数据加密

所有敏感数据均使用 AES-256-GCM 加密存储，采用 PBKDF2 密钥派生：

| 模型 | 加密字段 |
|------|---------|
| User | apiKeys |
| Project | path |
| Session | cwd |
| Message | content, systemPayload |

**安全特性：**
- AES-256-GCM 认证加密
- PBKDF2 密钥派生，100,000 次迭代
- 随机 16 字节盐值（或使用 `ENCRYPTION_SALT` 环境变量保持一致）
- 密钥缓存以提高性能（测试时可调用 `clearEncryptionCache()`）

**⚠️ 必需环境变量：**
```
ENCRYPTION_SECRET=your-256-bit-secret-key-here
ENCRYPTION_SALT=optional-16-byte-hex-salt  # 如不设置则自动生成随机盐值
```

**注意**：生产环境使用固定 `ENCRYPTION_SALT` 时会输出警告信息，建议仅在开发/测试环境使用固定盐值。

生成安全密钥：
```bash
openssl rand -hex 32
```

---

## AI 模型配置

### 自定义提供商和模型

Settings 面板允许您配置自定义 AI 提供商和模型。您可以：
- 添加/删除 AI 提供商（OpenAI、Anthropic、自定义端点）
- 配置每个提供商的 API 端点和 API 密钥
- 为每个提供商添加多个模型，自定义模型 ID 和显示名称
- 选择当前使用的提供商和模型

### 环境变量配置

或者，通过环境变量配置 API 密钥：
```env
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
DASHSCOPE_API_KEY=sk-...
```

---

## 构建桌面应用

```bash
cd packages/electron
npm run build
```

**输出目录：** `packages/electron/release/release-{timestamp}/`

| 构建模式 | 命令 | 输出 |
|----------|------|------|
| 正式构建（NSIS 安装程序） | `npm run build` | `release/release-{timestamp}/Web AI IDE Setup 1.0.0.exe` |
| 开发构建（未打包） | `npm run build -- --dir` | `release/dev/win-unpacked/` |

---

## API 文档

### REST Endpoints

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/api/projects` | 列出所有项目 |
| POST | `/api/projects` | 创建新项目 |
| DELETE | `/api/projects/:id` | 删除项目 |
| GET | `/api/sessions/project/:projectId` | 获取项目的会话列表 |
| GET | `/api/sessions/:id` | 获取会话详情 |
| GET | `/api/sessions/:id/conversation` | 重构完整会话历史 |
| POST | `/api/sessions` | 创建新会话 |
| DELETE | `/api/sessions/:id` | 删除会话 |

### WebSocket Events

| 事件 | 方向 | 描述 |
|------|------|------|
| `chat:message` | Client → Server | 发送聊天消息 |
| `chat:stream` | Server → Client | AI 流式响应 |
| `chat:tool_call` | Server → Client | 工具调用请求 |
| `chat:approve` | Client → Server | 批准操作 |
| `chat:reject` | Client → Server | 拒绝操作 |

---

## 安全说明

- API 密钥由用户自行提供，不会存储在服务器端
- Shell 命令执行需要用户明确批准
- 文件操作限制在项目工作区内
- 敏感操作需要二次确认

---

## 参考项目

- [Qwen Code](https://github.com/QwenLM/qwen-code) - 架构参考
- [Claude Code](https://claude.ai/code) - 功能灵感
- [VS Code Web](https://github.com/microsoft/vscode) - Monaco Editor 集成

---

## 许可证

MIT License
