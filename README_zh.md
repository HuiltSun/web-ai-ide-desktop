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
.\debug.ps1
```

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
npm run build
```

2. 启动 PostgreSQL 数据库：
```bash
docker run -d --name webaiide-postgres \
  -e POSTGRES_USER=user \
  -e POSTGRES_PASSWORD=password \
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
web-ai-ide/release/release-{timestamp}/Web AI IDE Setup 1.0.0.exe
```

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

---

## 项目结构

```
web-ai-ide/
├── packages/
│   ├── electron/             # Electron 桌面应用
│   │   ├── electron/         # 主进程 (main.ts, preload.ts)
│   │   ├── src/             # React 前端
│   │   │   ├── components/   # Chat, Editor, FileExplorer, Terminal, Settings...
│   │   │   ├── hooks/       # useChat, useFileSystem, useTerminal
│   │   │   ├── services/    # api.ts, websocket.ts
│   │   │   └── contexts/    # SettingsContext
│   │   ├── scripts/         # 构建脚本
│   │   └── dist/            # 构建输出
│   │
│   ├── cli/                  # 独立 React Web 应用
│   │   └── src/
│   │       ├── components/   # UI 组件
│   │       ├── hooks/        # useChat, useFileSystem, useTerminal
│   │       ├── services/     # api.ts, websocket.ts
│   │       └── contexts/     # SettingsContext
│   │
│   ├── core/                  # AI 核心逻辑
│   │   └── src/
│   │       ├── ai/           # gateway.ts + providers (openai, anthropic, qwen)
│   │       ├── models/        # config.ts
│   │       └── tools/        # edit, file-read, file-write, glob, grep, shell, registry
│   │
│   ├── server/               # Fastify 后端
│   │   ├── src/
│   │   │   ├── routes/       # auth, chat, files, projects, sessions
│   │   │   └── services/    # auth, project, session services
│   │   └── prisma/           # 数据库 schema
│   │
│   └── shared/               # 共享类型定义
│
├── release/                  # 构建输出 (release-{timestamp}/)
├── docs/                     # 设计文档
├── docker-compose.yml         # Docker 编排
├── debug.ps1                 # 一键启动脚本
└── package.json
```

---

## 数据库

### PostgreSQL 配置

环境变量 (`packages/server/.env`)：
```
DATABASE_URL="postgresql://user:password@localhost:5432/webaiide?schema=public"
```

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

---

## AI 模型配置

### 支持的模型

| 模型 | 提供商 | 描述 |
|------|--------|------|
| GPT-4o | OpenAI | 最强能力的模型 |
| GPT-4o Mini | OpenAI | 快速且成本效益高 |
| Claude 3.5 Sonnet | Anthropic | 平衡性能和智能 |
| Claude 3 Opus | Anthropic | 最强的 Claude 模型 |
| Qwen Coder Plus | Qwen | 专为代码优化 |
| Qwen3 Coder | Qwen | 最新开源 coder 模型 |

### API 密钥设置

在 Settings 面板中配置 API 密钥，或设置环境变量：
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
