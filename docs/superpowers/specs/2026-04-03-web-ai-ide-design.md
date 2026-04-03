# Web AI Coding IDE - Design Specification
# Web AI 编程 IDE - 设计规范

**Date/日期:** 2026-04-03
**Status/状态:** Draft for Review / 待审核

---

## 1. Overview / 概述

### 1.1 Project Name / 项目名称

**Web AI Coding IDE** - A browser-based AI-assisted coding environment similar to Claude Code.
**Web AI 编程 IDE** - 一个基于浏览器的 AI 辅助编程环境，类似于 Claude Code。

### 1.2 Core Functionality / 核心功能

A full-featured web application that combines AI conversation, code editing, and development task automation. Users can chat with AI assistants, edit code files, execute shell commands, and manage projects entirely through a browser interface.

一个功能完整的 Web 应用，结合了 AI 对话、代码编辑和开发任务自动化。用户可以通过浏览器与 AI 助手对话、编辑代码文件、执行 Shell 命令和管理项目。

### 1.3 Target Users / 目标用户

- Software developers who want to code from any device with a browser
- Teams working remotely needing a cloud-based development environment
- Users who prefer web-based tools over desktop IDEs

- 希望在任何设备上通过浏览器编程的软件开发者
- 需要基于云的开发环境的远程团队
- 相比桌面 IDE 更喜欢基于 Web 工具的用户

---

## 2. Architecture / 架构

### 2.1 High-Level Architecture / 高层架构

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ Chat UI     │  │ Monaco IDE  │  │ File Explorer│        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                          │ WebSocket + REST API             │
└──────────────────────────┼──────────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────────┐
│                  Backend (Fastify)                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ AI Gateway   │  │ File Ops    │  │ Exec Engine │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└──────────────────────────┼──────────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────────┐
│                    PostgreSQL                                │
│  Users │ Projects │ Sessions │ Messages                      │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Project Structure / 项目结构 (Monorepo)

```
web-ai-ide/
├── packages/
│   ├── cli/              # React Frontend / React 前端
│   │   ├── src/
│   │   │   ├── components/    # UI Components / UI 组件
│   │   │   ├── contexts/       # React Contexts / React 上下文
│   │   │   ├── hooks/          # Custom Hooks / 自定义 Hooks
│   │   │   ├── services/       # API Client / API 客户端
│   │   │   └── App.tsx
│   │   ├── package.json
│   │   └── vite.config.ts
│   │
│   ├── core/             # Core Logic / 核心逻辑 (AI Agent)
│   │   ├── src/
│   │   │   ├── agents/       # AI Agent Implementation / AI Agent 实现
│   │   │   ├── tools/        # Tool System / 工具系统
│   │   │   │   ├── shell.ts
│   │   │   │   ├── file-read.ts
│   │   │   │   ├── file-write.ts
│   │   │   │   ├── edit.ts
│   │   │   │   ├── glob.ts
│   │   │   │   ├── grep.ts
│   │   │   │   └── web-fetch.ts
│   │   │   ├── models/       # Multi-Model Support / 多模型支持
│   │   │   └── api/          # API Client / API 客户端
│   │   └── package.json
│   │
│   ├── server/           # Fastify Backend / Fastify 后端
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   │   ├── chat.ts
│   │   │   │   ├── files.ts
│   │   │   │   ├── projects.ts
│   │   │   │   └── sessions.ts
│   │   │   ├── services/
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── shared/           # Shared Types / 共享类型
│       ├── src/
│       │   └── types.ts
│       └── package.json
│
├── docker-compose.yml
├── Dockerfile
├── package.json          # Root package.json for monorepo
└── README.md
```

---

## 3. Technology Stack / 技术栈

### 3.1 Frontend / 前端

| Component / 组件 | Technology / 技术 | Version / 版本 |
|------------------|-------------------|----------------|
| Framework / 框架 | React | 18.x |
| Language / 语言 | TypeScript | 5.x |
| Build Tool / 构建工具 | Vite | 5.x |
| Code Editor / 代码编辑器 | Monaco Editor | Latest / 最新 |
| Styling / 样式 | TailwindCSS | 3.x |
| State Management / 状态管理 | React Context + useReducer | - |
| HTTP Client / HTTP 客户端 | Fetch API | - |

### 3.2 Backend / 后端

| Component / 组件 | Technology / 技术 | Version / 版本 |
|------------------|-------------------|----------------|
| Framework / 框架 | Fastify | 4.x |
| Language / 语言 | TypeScript | 5.x |
| Database ORM / 数据库 ORM | Prisma | 5.x |
| Database / 数据库 | PostgreSQL | 15+ |
| WebSocket | @fastify/websocket | - |
| Validation / 验证 | Zod | - |

### 3.3 AI Integration / AI 集成

| Provider / 提供商 | Models / 模型 | Protocol / 协议 |
|-------------------|---------------|-----------------|
| OpenAI | gpt-4o, gpt-4o-mini | OpenAI-compatible / 兼容 |
| Anthropic | claude-3-5-sonnet, claude-3-opus | Anthropic |
| Qwen/DashScope | qwen-coder-plus, qwen3-coder | OpenAI-compatible / 兼容 |

---

## 4. Functionality Specification / 功能规范

### 4.1 Chat Interface / 聊天界面

**Features / 功能:**
- Real-time streaming responses from AI / AI 实时流式响应
- Markdown rendering with syntax highlighting for code blocks / Markdown 渲染及代码块语法高亮
- Support for @file references to include file context / 支持 @file 引用文件上下文
- Tool call display (read, write, edit, shell, etc.) / 工具调用显示
- Conversation history with session management / 会话管理中的对话历史
- User confirmation for dangerous operations / 危险操作需用户确认

**User Interactions / 用户交互:**
1. User types message in input field /用户在输入框中输入消息
2. Message sent to backend via WebSocket / 消息通过 WebSocket 发送到后端
3. AI response streams back in real-time / AI 响应实时流式返回
4. Tool calls are displayed with results / 工具调用及结果展示
5. User can approve/reject sensitive operations / 用户可批准/拒绝敏感操作

### 4.2 Code Editor / 代码编辑器 (Monaco)

**Features / 功能:**
- Full Monaco Editor integration (VS Code engine) / 完整 Monaco Editor 集成（VS Code 引擎）
- Syntax highlighting for 50+ languages / 50+ 编程语言语法高亮
- IntelliSense/autocomplete / 智能提示/自动完成
- Multi-file editing with tabs / 多文件标签编辑
- File tree integration / 文件树集成
- Diff view for changes / 差异对比视图

**User Interactions / 用户交互:**
1. Click file in explorer to open in editor / 点击资源管理器中的文件在编辑器中打开
2. Edit file content / 编辑文件内容
3. Save triggers file write operation / 保存触发文件写入操作
4. AI can suggest edits which user accepts/rejects / AI 可建议修改，用户接受/拒绝

### 4.3 File Explorer / 文件资源管理器

**Features / 功能:**
- Hierarchical file tree display / 层级文件树显示
- Create, rename, delete files/folders / 创建、重命名、删除文件/文件夹
- Drag and drop support / 拖拽支持
- File type icons / 文件类型图标
- Search/filter files / 搜索/过滤文件

**User Interactions / 用户交互:**
1. View project structure / 查看项目结构
2. Create new files/folders via context menu / 通过右键菜单创建新文件/文件夹
3. Right-click to delete or rename / 右键删除或重命名
4. Double-click to open in editor / 双击在编辑器中打开

### 4.4 Terminal / 终端

**Features / 功能:**
- Web-based terminal emulator / 基于 Web 的终端模拟器
- Command input and output display / 命令输入和输出显示
- Command history / 命令历史
- Working directory awareness / 工作目录感知

**User Interactions / 用户交互:**
1. Type shell commands / 输入 Shell 命令
2. View command output / 查看命令输出
3. AI can execute commands on user's behalf / AI 可代表用户执行命令

### 4.5 AI Tool System / AI 工具系统

**Available Tools / 可用工具:**

| Tool / 工具 | Description / 描述 | Requires Approval / 需批准 |
|-------------|-------------------|---------------------------|
| `read_file` | Read file contents / 读取文件内容 | No / 否 |
| `write_file` | Create or overwrite file / 创建或覆盖文件 | Yes / 是 |
| `edit_file` | Make targeted changes / 目标性修改 | Yes / 是 |
| `glob` | Find files by pattern / 按模式查找文件 | No / 否 |
| `grep` | Search file contents / 搜索文件内容 | No / 否 |
| `shell` | Execute shell commands / 执行 Shell 命令 | Yes / 是 |
| `web_fetch` | Fetch URL content / 获取 URL 内容 | No / 否 |
| `todo_write` | Manage task list / 管理任务列表 | No / 否 |

### 4.6 Session Management / 会话管理

**Features / 功能:**
- Create multiple projects / 创建多个项目
- Save/resume conversations / 保存/恢复对话
- Session history / 会话历史
- Project-specific settings / 项目特定设置

### 4.7 Multi-Model Support / 多模型支持

**Features / 功能:**
- Switch between AI providers / 在 AI 提供商间切换
- Configure API keys per provider / 为每个提供商配置 API 密钥
- Model selection per session / 每个会话的模型选择
- Fallback support / 降级支持

---

## 5. Data Model / 数据模型

### 5.1 Database Schema / 数据库架构

```prisma
model User {
  id        String    @id @default(uuid())
  email     String    @unique
  name      String?
  apiKeys   Json?     // Encrypted API keys per provider
  projects  Project[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

model Project {
  id        String    @id @default(uuid())
  name      String
  path      String    // Workspace directory path
  userId    String
  user      User      @relation(fields: [userId], references: [id])
  sessions  Session[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

model Session {
  id        String    @id @default(uuid())
  projectId String
  project   Project   @relation(fields: [projectId], references: [id])
  model     String    // e.g., "gpt-4o", "claude-3-5-sonnet"
  messages  Message[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

model Message {
  id        String    @id @default(uuid())
  sessionId String
  session   Session   @relation(fields: [sessionId], references: [id])
  role      String    // "user" | "assistant" | "system"
  content   String
  toolCalls Json?    // Array of tool calls if any
  createdAt DateTime  @default(now())
}
```

---

## 6. API Design / API 设计

### 6.1 REST Endpoints / REST 端点

| Method / 方法 | Endpoint / 端点 | Description / 描述 |
|---------------|-----------------|-------------------|
| GET | `/api/projects` | List all projects / 列出所有项目 |
| POST | `/api/projects` | Create new project / 创建新项目 |
| GET | `/api/projects/:id` | Get project details / 获取项目详情 |
| DELETE | `/api/projects/:id` | Delete project / 删除项目 |
| GET | `/api/projects/:id/files` | List project files / 列出项目文件 |
| GET | `/api/projects/:id/files/*` | Read file content / 读取文件内容 |
| PUT | `/api/projects/:id/files/*` | Write file content / 写入文件内容 |
| DELETE | `/api/projects/:id/files/*` | Delete file / 删除文件 |
| GET | `/api/sessions/:id/messages` | Get session messages / 获取会话消息 |
| POST | `/api/sessions` | Create new session / 创建新会话 |

### 6.2 WebSocket Events / WebSocket 事件

| Event / 事件 | Direction / 方向 | Description / 描述 |
|--------------|------------------|-------------------|
| `chat:message` | Client → Server | Send chat message / 发送聊天消息 |
| `chat:stream` | Server → Client | Stream AI response / 流式 AI 响应 |
| `chat:tool_call` | Server → Client | Tool call request / 工具调用请求 |
| `chat:tool_result` | Client → Server | Tool execution result / 工具执行结果 |
| `chat:approve` | Client → Server | Approve operation / 批准操作 |
| `chat:reject` | Client → Server | Reject operation / 拒绝操作 |
| `terminal:output` | Server → Client | Terminal output / 终端输出 |
| `terminal:input` | Client → Server | Terminal input / 终端输入 |

---

## 7. Security Considerations / 安全考虑

### 7.1 API Key Management / API 密钥管理
- API keys stored encrypted in database / API 密钥加密存储在数据库中
- Keys never logged or exposed in frontend / 密钥不会被记录或暴露在前端
- Users provide their own API keys / 用户自行提供 API 密钥

### 7.2 Command Execution / 命令执行
- Shell commands run in isolated environment / Shell 命令在隔离环境中运行
- Dangerous commands require explicit user approval / 危险命令需要用户明确批准
- Execution timeout limits / 执行超时限制

### 7.3 File System Access / 文件系统访问
- Projects isolated to designated workspaces / 项目隔离在指定工作区
- Path traversal prevention / 防止路径遍历
- File type restrictions configurable / 文件类型限制可配置

---

## 8. Deployment / 部署

### 8.1 Docker Configuration / Docker 配置

```yaml
# docker-compose.yml
version: '3.8'
services:
  frontend:
    build: ./packages/cli
    ports:
      - "3000:80"
    depends_on:
      - backend

  backend:
    build: ./packages/server
    ports:
      - "3001:3001"
    environment:
      DATABASE_URL: postgresql://user:pass@db:5432/webaiide
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: webaiide
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

---

## 9. Implementation Phases / 实施阶段

### Phase 1: Foundation / 阶段一：基础
- Project scaffolding (monorepo setup) / 项目脚手架（monorepo 设置）
- Backend API structure / 后端 API 结构
- Database schema / 数据库架构
- Basic frontend layout / 基础前端布局

### Phase 2: Core Features / 阶段二：核心功能
- Monaco Editor integration / Monaco Editor 集成
- File explorer component / 文件资源管理器组件
- Chat interface with streaming / 带流式传输的聊天界面

### Phase 3: AI Integration / 阶段三：AI 集成
- AI Gateway implementation / AI 网关实现
- Tool system / 工具系统
- Multi-model support / 多模型支持

### Phase 4: Polish / 阶段四：完善
- Terminal emulator / 终端模拟器
- Session management / 会话管理
- Settings/preferences / 设置/偏好

---

## 10. Reference Projects / 参考项目

- **Qwen Code** (https://github.com/QwenLM/qwen-code) - Architecture reference / 架构参考
- **Claude Code** - Feature inspiration / 功能灵感
- **VS Code Web** - Monaco Editor integration / Monaco Editor 集成
