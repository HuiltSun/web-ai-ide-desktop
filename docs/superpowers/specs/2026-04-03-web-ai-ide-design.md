# Web AI IDE - Design Specification / 设计规范

**Date/日期:** 2026-04-03
**Status/状态:** Updated / 已更新
**Version:** 2.0

---

## 1. Overview / 概述

### 1.1 Project Name / 项目名称

**Web AI IDE** - 一个基于 Web + Electron 的 AI 辅助编程环境，类似于 Claude Code。
**Web AI IDE** - A browser-based + Electron desktop AI-assisted coding environment similar to Claude Code.

### 1.2 Core Functionality / 核心功能

A full-featured desktop application that combines AI conversation, code editing, and development task automation. Users can chat with AI assistants, edit code files, execute shell commands, and manage projects through an Electron desktop interface.

一个功能完整的桌面应用，结合了 AI 对话、代码编辑和开发任务自动化。用户可以通过 Electron 桌面界面与 AI 助手对话、编辑代码文件、执行 Shell 命令和管理项目。

### 1.3 Target Users / 目标用户

- Software developers wanting a native desktop IDE experience / 需要原生桌面 IDE 体验的软件开发者
- Teams working with cloud-based development environments / 使用基于云的开发环境的团队
- Users who prefer desktop apps over web browsers / 相比 Web 浏览器更喜欢桌面应用的用户

---

## 2. Architecture / 架构

### 2.1 High-Level Architecture / 高层架构

```
┌─────────────────────────────────────────────────────────────┐
│                    Desktop App (Electron)                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                  React Frontend                       │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │   │
│  │  │ Chat UI     │  │ Monaco IDE  │  │ File Explorer│ │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘ │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │ WebSocket + REST API             │
└──────────────────────────┼──────────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────────┐
│                  Backend (Fastify)                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ AI Gateway  │  │ File Ops    │  │ Exec Engine │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└──────────────────────────┼──────────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────────┐
│                    PostgreSQL 16                              │
│  Users │ Projects │ Sessions │ Messages                      │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Project Structure / 项目结构 (Monorepo)

```
web-ai-ide/
├── packages/
│   ├── electron/           # Electron Desktop App / Electron 桌面应用
│   │   ├── electron/      # Main process (main.ts, preload.ts)
│   │   ├── src/           # React Frontend
│   │   │   ├── components/ # UI Components
│   │   │   ├── services/  # API Client
│   │   │   ├── types.ts   # Type Definitions
│   │   │   └── App.tsx
│   │   ├── dist/          # Build output
│   │   └── package.json
│   │
│   ├── cli/               # Standalone Web App (optional)
│   │
│   ├── core/              # AI Core Logic / AI 核心逻辑
│   │   └── src/
│   │       ├── ai/        # AI Gateway and Providers
│   │       ├── models/     # Model Configuration
│   │       └── tools/      # Tool System
│   │
│   ├── server/            # Fastify Backend
│   │   ├── src/
│   │   │   ├── routes/    # API Routes
│   │   │   └── services/  # Business Logic
│   │   └── prisma/        # Database Schema
│   │
│   └── shared/             # Shared Type Definitions
│
├── docs/                   # Documentation
├── docker-compose.yml      # Docker Orchestration
└── package.json
```

---

## 3. Technology Stack / 技术栈

### 3.1 Frontend / 前端

| Component / 组件 | Technology / 技术 | Version / 版本 |
|------------------|-------------------|----------------|
| Framework / 框架 | React | 18.x |
| Language / 语言 | TypeScript | 5.x |
| Build Tool / 构建工具 | Vite | 5.x |
| Desktop / 桌面 | Electron | 30.x |
| Code Editor / 代码编辑器 | Monaco Editor | Latest |
| Styling / 样式 | TailwindCSS | 3.x |

### 3.2 Backend / 后端

| Component / 组件 | Technology / 技术 | Version / 版本 |
|------------------|-------------------|----------------|
| Framework / 框架 | Fastify | 4.x |
| Language / 语言 | TypeScript | 5.x |
| Database ORM / 数据库 ORM | Prisma | 5.x |
| Database / 数据库 | PostgreSQL | 16 |
| WebSocket | @fastify/websocket | - |

### 3.3 AI Integration / AI 集成

| Provider / 提供商 | Models / 模型 | Protocol / 协议 |
|-------------------|---------------|-----------------|
| OpenAI | gpt-4o, gpt-4o-mini | OpenAI-compatible |
| Anthropic | claude-3-5-sonnet, claude-3-opus | Anthropic |
| Qwen/DashScope | qwen-coder-plus, qwen3-coder | OpenAI-compatible |

---

## 4. Functionality Specification / 功能规范

### 4.1 Chat Interface / 聊天界面

**Features / 功能:**
- Real-time streaming responses from AI / AI 实时流式响应
- Markdown rendering with syntax highlighting / Markdown 渲染及代码高亮
- Tool call display (read, write, edit, shell, etc.) / 工具调用显示
- Conversation history with session management / 会话管理中的对话历史
- User confirmation for dangerous operations / 危险操作需用户确认

### 4.2 Code Editor / 代码编辑器 (Monaco)

**Features / 功能:**
- Full Monaco Editor integration / 完整 Monaco Editor 集成
- Syntax highlighting for 50+ languages / 50+ 编程语言语法高亮
- IntelliSense/autocomplete / 智能提示/自动完成
- Multi-file editing with tabs / 多文件标签编辑

### 4.3 File Explorer / 文件资源管理器

**Features / 功能:**
- Hierarchical file tree display / 层级文件树显示
- Create, rename, delete files/folders / 创建、重命名、删除文件/文件夹
- File type icons / 文件类型图标

### 4.4 Project Management / 项目管理

**Features / 功能:**
- Create, delete projects / 创建、删除项目
- Projects stored in PostgreSQL / 项目存储在 PostgreSQL
- Project-specific sessions / 项目特定会话

### 4.5 Session Management / 会话管理 (参考 qwen-code)

**Features / 功能:**
- Create multiple sessions per project / 每个项目多个会话
- Save/resume conversations / 保存/恢复对话
- Session supports cwd, gitBranch / 会话支持 cwd、gitBranch
- UUID-based message chain for tree structure / 基于 UUID 的消息链支持树形结构

### 4.6 Settings - Dynamic AI Providers / 设置 - 动态 AI 提供商

**Features / 功能:**
- User-configurable AI providers / 用户可配置的 AI 提供商
- Each provider has: name, API endpoint, API key / 每个提供商有：名称、API 端点、API 密钥
- Multiple models per provider / 每个提供商多个模型
- Custom model ID and display name / 自定义模型 ID 和显示名称
- Select active provider and model / 选择当前提供商和模型

**Data Structure / 数据结构:**
```typescript
interface AIProvider {
  id: string;           // Provider unique ID
  name: string;         // Display name
  apiEndpoint: string;  // API endpoint
  apiKey: string;       // API key
  models: AIModel[];    // Model list
}

interface AIModel {
  id: string;           // Model ID (e.g., gpt-4o)
  name: string;         // Display name
}
```

### 4.7 Data Encryption / 数据加密

**Features / 功能:**
- AES-256-GCM authenticated encryption / AES-256-GCM 认证加密
- PBKDF2 key derivation with 100,000 iterations / PBKDF2 密钥派生，100,000 次迭代
- Per-field encryption middleware / 字段级加密中间件
- Optional ENCRYPTION_SALT for consistency / 可选 ENCRYPTION_SALT 保持一致性
- Warning in production when using fixed salt / 生产环境使用固定盐值时输出警告

**Encrypted Fields / 加密字段:**
| Model | Encrypted Fields |
|-------|-----------------|
| User | apiKeys |
| Project | path |
| Session | cwd |
| Message | content, systemPayload |

---

## 5. Data Model / 数据模型

### 5.1 Database Schema / 数据库架构 (PostgreSQL + Prisma)

```prisma
model User {
  id        String    @id @default(uuid())
  email     String    @unique
  name      String?
  apiKeys   Json?
  projects  Project[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

model Project {
  id        String    @id @default(uuid())
  name      String
  path      String
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  sessions  Session[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
}

model Session {
  id         String    @id @default(uuid())
  projectId  String
  project    Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  cwd        String?
  gitBranch  String?
  model      String    @default("gpt-4o")
  messages   Message[]
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt

  @@index([projectId])
}

model Message {
  id             String    @id @default(uuid())
  uuid           String    @unique @default(uuid())
  parentUuid     String?
  sessionId      String
  session        Session   @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  type           String    @default("user")
  subtype        String?
  role           String
  content        String
  toolCalls      Json?
  toolCallResult Json?
  usageMetadata  Json?
  model          String?
  systemPayload  Json?
  createdAt      DateTime  @default(now())

  @@index([sessionId])
}
```

### 5.2 Session List Item (参考 qwen-code)

```typescript
interface SessionListItem {
  sessionId: string;
  cwd: string | null;
  startTime: string;
  prompt: string;        // 首条消息摘要
  gitBranch: string | null;
  messageCount: number;
}
```

---

## 6. API Design / API 设计

### 6.1 REST Endpoints / REST 端点

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List all projects |
| POST | `/api/projects` | Create new project |
| DELETE | `/api/projects/:id` | Delete project |
| GET | `/api/sessions/project/:projectId` | Get project's sessions |
| GET | `/api/sessions/:id` | Get session details |
| GET | `/api/sessions/:id/conversation` | Reconstruct full conversation |
| POST | `/api/sessions` | Create new session |
| DELETE | `/api/sessions/:id` | Delete session |

### 6.2 WebSocket Events / WebSocket 事件

| Event | Direction | Description |
|-------|-----------|-------------|
| `chat:message` | Client → Server | Send chat message |
| `chat:stream` | Server → Client | Stream AI response |
| `chat:tool_call` | Server → Client | Tool call request |
| `chat:approve` | Client → Server | Approve operation |
| `chat:reject` | Client → Server | Reject operation |

---

## 7. Desktop App / 桌面应用

### 7.1 Electron Configuration

- **App ID:** com.webaiide.app
- **Product Name:** Web AI IDE
- **Output:** `packages/electron/release/win-unpacked/Web AI IDE.exe`

### 7.2 Build Process

```bash
cd packages/electron
npm run build:exe
```

---

## 8. Reference Projects / 参考项目

- **Qwen Code** (https://github.com/QwenLM/qwen-code) - Architecture reference
- **Claude Code** - Feature inspiration
- **VS Code Web** - Monaco Editor integration
