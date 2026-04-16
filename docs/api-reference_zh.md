# Web AI IDE - API 参考文档

**版本**: 1.0
**最后更新**: 2026-04-16
**Base URL**: `http://localhost:3001`

---

## 目录

1. [认证](#authentication)
2. [REST API](#rest-api)
   - [Auth](#auth)
   - [Projects](#projects)
   - [Sessions](#sessions)
   - [Chat Messages](#chat-messages)
   - [Files](#files)
3. [WebSocket API](#websocket-api)
   - [对话流](#chat-stream)
   - [PTY 终端](#pty-terminal)
   - [本地终端](#local-terminal)
4. [gRPC 接口](#grpc-interface)
5. [AI 核心模块](#core-ai-module)
   - [AI 网关](#ai-gateway)
   - [提供商](#providers)
   - [工具注册表](#tool-registry)
6. [数据库 Schema](#database-schema)
7. [错误码](#error-codes)
8. [环境变量](#environment-variables)

---

## 认证

### JWT 认证

服务端使用 `@fastify/jwt` 进行 JSON Web Token 认证。JWT 密钥通过 `JWT_SECRET` 环境变量配置。

**请求头格式：**

```
Authorization: Bearer <token>
```

**JWT 载荷：**

```json
{
  "id": "uuid",
  "email": "user@example.com"
}
```

### API Key 认证（租户隔离）

用于多租户隔离，API Key 通过 `x-api-key` 请求头传递。密钥必须以 `sk_` 开头且长度恰好为 40 个字符。服务端使用 SHA-256 对密钥进行哈希，并查找关联的租户以设置 PostgreSQL `search_path`。

**请求头格式：**

```
x-api-key: sk_<37-character-key>
```

### WebSocket 认证

WebSocket 连接通过 `token` 查询参数进行认证，该参数接受有效的 JWT。

**连接 URL 格式：**

```
ws://localhost:3001/api/chat/:sessionId/stream?token=<jwt>
```

---

## REST API

### Auth

#### POST /api/auth/register

注册新用户账号。

**认证：** 无

**请求体：**

| 字段 | 类型 | 是否必填 | 说明 |
|-------|------|----------|-------------|
| email | string | 是 | 有效的邮箱地址 |
| password | string | 是 | 最少 8 个字符 |
| name | string | 否 | 显示名称 |

**请求示例：**

```json
{
  "email": "user@example.com",
  "password": "MyP@ss1234",
  "name": "John Doe"
}
```

**响应 (201)：**

```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2026-04-16T10:00:00.000Z"
  }
}
```

**错误响应 (400)：**

```json
{
  "error": "User with this email already exists"
}
```

```json
{
  "error": "Invalid input",
  "details": [
    {
      "message": "Invalid email",
      "path": ["email"]
    }
  ]
}
```

---

#### POST /api/auth/login

认证用户并获取 JWT 令牌。

**认证：** 无

**请求体：**

| 字段 | 类型 | 是否必填 | 说明 |
|-------|------|----------|-------------|
| email | string | 是 | 有效的邮箱地址 |
| password | string | 是 | 用户密码 |

**请求示例：**

```json
{
  "email": "user@example.com",
  "password": "MyP@ss1234"
}
```

**响应 (200)：**

```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**错误响应 (401)：**

```json
{
  "error": "Invalid email or password"
}
```

---

#### GET /api/auth/me

获取当前认证用户的资料。

**认证：** JWT

**请求头：**

```
Authorization: Bearer <token>
```

**响应 (200)：**

```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2026-04-16T10:00:00.000Z"
  }
}
```

**错误响应 (401)：**

```json
{
  "error": "Unauthorized"
}
```

**错误响应 (404)：**

```json
{
  "error": "User not found"
}
```

---

### Projects

所有项目端点都需要 JWT 认证，并支持通过 `x-api-key` 请求头进行可选的租户隔离。

#### GET /api/projects

列出认证用户的所有项目。

**认证：** JWT + 可选 API Key

**响应 (200)：**

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "My Project",
    "path": "./projects/my-project",
    "userId": "550e8400-e29b-41d4-a716-446655440001",
    "createdAt": "2026-04-16T10:00:00.000Z",
    "updatedAt": "2026-04-16T10:00:00.000Z"
  }
]
```

---

#### GET /api/projects/:id

获取项目及其最新的会话。

**认证：** JWT + 可选 API Key

**路径参数：**

| 参数 | 类型 | 说明 |
|-----------|------|-------------|
| id | string | 项目 UUID |

**响应 (200)：**

```json
{
  "project": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "My Project",
    "path": "./projects/my-project",
    "userId": "550e8400-e29b-41d4-a716-446655440001",
    "createdAt": "2026-04-16T10:00:00.000Z",
    "updatedAt": "2026-04-16T10:00:00.000Z",
    "sessions": []
  },
  "session": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "projectId": "550e8400-e29b-41d4-a716-446655440000",
    "cwd": null,
    "gitBranch": null,
    "model": "gpt-4o",
    "createdAt": "2026-04-16T10:00:00.000Z",
    "updatedAt": "2026-04-16T10:00:00.000Z"
  }
}
```

**错误响应 (404)：**

```json
{
  "error": "Project not found"
}
```

---

#### POST /api/projects

创建新项目。系统会自动为项目创建一个默认会话。

**认证：** JWT + 可选 API Key

**请求体：**

| 字段 | 类型 | 是否必填 | 说明 |
|-------|------|----------|-------------|
| name | string | 是 | 项目名称 |
| path | string | 是 | 项目路径 |
| userId | string | 否 | 所有者用户 ID（默认为系统默认用户） |

**请求示例：**

```json
{
  "name": "My Project",
  "path": "./projects/my-project",
  "userId": "550e8400-e29b-41d4-a716-446655440001"
}
```

**响应 (201)：**

```json
{
  "project": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "My Project",
    "path": "./projects/my-project",
    "userId": "550e8400-e29b-41d4-a716-446655440001",
    "createdAt": "2026-04-16T10:00:00.000Z",
    "updatedAt": "2026-04-16T10:00:00.000Z",
    "sessions": []
  },
  "session": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "projectId": "550e8400-e29b-41d4-a716-446655440000",
    "cwd": null,
    "gitBranch": null,
    "model": "gpt-4o",
    "createdAt": "2026-04-16T10:00:00.000Z",
    "updatedAt": "2026-04-16T10:00:00.000Z"
  }
}
```

---

#### DELETE /api/projects/:id

删除项目及其所有关联的会话和消息。

**认证：** JWT + 可选 API Key

**路径参数：**

| 参数 | 类型 | 说明 |
|-----------|------|-------------|
| id | string | 项目 UUID |

**响应 (204)：** 无内容

---

### Sessions

所有会话端点都需要 JWT 认证，并支持通过 `x-api-key` 请求头进行可选的租户隔离。

#### GET /api/sessions/project/:projectId

列出项目的所有会话。

**认证：** JWT + 可选 API Key

**路径参数：**

| 参数 | 类型 | 说明 |
|-----------|------|-------------|
| projectId | string | 项目 UUID |

**响应 (200)：**

```json
[
  {
    "sessionId": "550e8400-e29b-41d4-a716-446655440002",
    "cwd": "/home/user/project",
    "startTime": "2026-04-16T10:00:00.000Z",
    "prompt": "Hello, can you help me with...",
    "gitBranch": "main",
    "messageCount": 5
  }
]
```

---

#### GET /api/sessions/:id

获取会话及其消息和项目信息。

**认证：** JWT + 可选 API Key

**路径参数：**

| 参数 | 类型 | 说明 |
|-----------|------|-------------|
| id | string | 会话 UUID |

**响应 (200)：**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440002",
  "projectId": "550e8400-e29b-41d4-a716-446655440000",
  "cwd": "/home/user/project",
  "gitBranch": "main",
  "model": "gpt-4o",
  "createdAt": "2026-04-16T10:00:00.000Z",
  "updatedAt": "2026-04-16T10:00:00.000Z",
  "messages": [],
  "project": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "My Project",
    "path": "./projects/my-project",
    "userId": "550e8400-e29b-41d4-a716-446655440001",
    "createdAt": "2026-04-16T10:00:00.000Z",
    "updatedAt": "2026-04-16T10:00:00.000Z"
  }
}
```

**错误响应 (404)：**

```json
{
  "error": "Session not found"
}
```

---

#### GET /api/sessions/:id/conversation

重建会话的完整对话记录。

**认证：** JWT + 可选 API Key

**路径参数：**

| 参数 | 类型 | 说明 |
|-----------|------|-------------|
| id | string | 会话 UUID |

**响应 (200)：**

```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440002",
  "projectId": "550e8400-e29b-41d4-a716-446655440000",
  "startTime": "2026-04-16T10:00:00.000Z",
  "lastUpdated": "2026-04-16T10:30:00.000Z",
  "messages": [
    {
      "uuid": "msg-uuid-1",
      "parentUuid": null,
      "type": "user",
      "subtype": null,
      "role": "user",
      "content": "Hello, can you help me?",
      "toolCalls": null,
      "toolCallResult": null,
      "usageMetadata": null,
      "model": null,
      "systemPayload": null
    },
    {
      "uuid": "msg-uuid-2",
      "parentUuid": "msg-uuid-1",
      "type": "assistant",
      "subtype": null,
      "role": "assistant",
      "content": "Of course! How can I assist you?",
      "toolCalls": null,
      "toolCallResult": null,
      "usageMetadata": { "promptTokens": 10, "completionTokens": 8 },
      "model": "gpt-4o",
      "systemPayload": null
    }
  ]
}
```

**错误响应 (404)：**

```json
{
  "error": "Session not found"
}
```

---

#### POST /api/sessions

创建新会话。

**认证：** JWT + 可选 API Key

**请求体：**

| 字段 | 类型 | 是否必填 | 说明 |
|-------|------|----------|-------------|
| projectId | string | 是 | 关联的项目 UUID |
| cwd | string | 否 | 工作目录 |
| gitBranch | string | 否 | Git 分支名称 |
| model | string | 否 | AI 模型（默认为 `gpt-4o`） |

**请求示例：**

```json
{
  "projectId": "550e8400-e29b-41d4-a716-446655440000",
  "cwd": "/home/user/project",
  "gitBranch": "main",
  "model": "gpt-4o"
}
```

**响应 (201)：**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440002",
  "projectId": "550e8400-e29b-41d4-a716-446655440000",
  "cwd": "/home/user/project",
  "gitBranch": "main",
  "model": "gpt-4o",
  "createdAt": "2026-04-16T10:00:00.000Z",
  "updatedAt": "2026-04-16T10:00:00.000Z"
}
```

---

#### DELETE /api/sessions/:id

删除会话及其所有消息。

**认证：** JWT + 可选 API Key

**路径参数：**

| 参数 | 类型 | 说明 |
|-----------|------|-------------|
| id | string | 会话 UUID |

**响应 (204)：** 无内容

---

### Chat Messages

#### GET /api/chat/:sessionId/messages

获取会话的聊天消息历史。

**认证：** JWT

**路径参数：**

| 参数 | 类型 | 说明 |
|-----------|------|-------------|
| sessionId | string | 会话 UUID |

**响应 (200)：**

```json
[
  {
    "role": "user",
    "content": "Hello, can you help me?"
  },
  {
    "role": "assistant",
    "content": "Of course! How can I assist you?"
  }
]
```

---

### Files

#### GET /api/files/:projectId/*

读取项目中的文件。

**认证：** API Key + JWT

**路径参数：**

| 参数 | 类型 | 说明 |
|-----------|------|-------------|
| projectId | string | 项目 UUID |
| * | string | 项目内的文件路径 |

**状态：** 未实现 - 返回 `{ "error": "Not implemented" }`

**响应 (200)：**

```json
{
  "error": "Not implemented"
}
```

---

## WebSocket API

### 对话流

**端点：** `ws://localhost:3001/api/chat/:sessionId/stream?token=<jwt>`

建立用于流式 AI 对话的 WebSocket 连接。`token` 查询参数接受 JWT 用于认证。

> **默认 Provider 配置：** 服务端当前默认使用 Qwen 提供商，模型为 `qwen3.5-plus`。此配置通过聊天路由中的 `QWEN_API_KEY` 和 `OPENAI_BASE_URL` 环境变量进行设置。

#### 客户端 → 服务端 消息

**发送聊天消息：**

```json
{
  "type": "message",
  "content": "Hello, can you help me with my code?"
}
```

**批准工具调用（已弃用，请使用 `user_confirm`）：**

```json
{
  "type": "approve",
  "toolCallId": "tool-call-uuid"
}
```

**拒绝工具调用（已弃用，请使用 `user_confirm`）：**

```json
{
  "type": "reject",
  "toolCallId": "tool-call-uuid"
}
```

**确认或拒绝操作提示：**

```json
{
  "type": "user_confirm",
  "promptId": "prompt-uuid",
  "approved": true
}
```

| 字段 | 类型 | 是否必填 | 说明 |
|-------|------|----------|-------------|
| type | string | 是 | 必须为 `"user_confirm"` |
| promptId | string | 是 | 来自 `action_required` 事件的提示 ID |
| approved | boolean | 是 | `true` 表示批准，`false` 表示拒绝 |

#### 服务端 → 客户端 消息

**文本块：**

```json
{
  "type": "text",
  "content": "I can help you with that."
}
```

**工具调用开始：**

```json
{
  "type": "tool_call",
  "toolCallId": "tool-use-uuid",
  "toolName": "read_file",
  "arguments": {
    "path": "/home/user/project/src/index.ts"
  }
}
```

**工具结果：**

```json
{
  "type": "tool_result",
  "toolCallId": "tool-use-uuid",
  "result": {
    "success": true,
    "output": "file contents here..."
  }
}
```

```json
{
  "type": "tool_result",
  "toolCallId": "tool-use-uuid",
  "result": {
    "success": false,
    "error": "Error reading file: ENOENT"
  }
}
```

**需要操作（需要用户确认）：**

```json
{
  "type": "action_required",
  "promptId": "prompt-uuid",
  "question": "Approve shell command: rm -rf /tmp/build?",
  "actionType": "CONFIRM_COMMAND"
}
```

`actionType` 字段可以是以下值之一：

| 值 | 说明 |
|-------|-------------|
| `CONFIRM_COMMAND` | 命令的是/否确认 |
| `REQUEST_INFORMATION` | 请求用户输入自由文本 |

**生成完成：**

```json
{
  "type": "done",
  "fullText": "The complete generated response text..."
}
```

**错误：**

```json
{
  "type": "error",
  "content": "Provider not configured",
  "code": "PROVIDER_NOT_CONFIGURED"
}
```

---

### PTY 终端

**端点：** `ws://localhost:3001/ws/pty`

用于 OpenClaude PTY 终端会话的 WebSocket 端点。使用 `ptyService` 后端。

#### 客户端 → 服务端 消息

**创建新的 PTY 会话：**

```json
{
  "type": "create",
  "payload": {
    "cols": 80,
    "rows": 24
  }
}
```

| 字段 | 类型 | 是否必填 | 说明 |
|-------|------|----------|-------------|
| type | string | 是 | `"create"` |
| payload.cols | number | 否 | 终端列数（默认：80） |
| payload.rows | number | 否 | 终端行数（默认：24） |

**向会话发送输入：**

```json
{
  "type": "input",
  "payload": {
    "sessionId": "oc_1713264000000_abc123",
    "data": "ls -la\n"
  }
}
```

| 字段 | 类型 | 是否必填 | 说明 |
|-------|------|----------|-------------|
| type | string | 是 | `"input"` |
| payload.sessionId | string | 是 | PTY 会话 ID |
| payload.data | string | 是 | 输入数据字符串 |

**调整终端大小：**

```json
{
  "type": "resize",
  "payload": {
    "sessionId": "oc_1713264000000_abc123",
    "cols": 120,
    "rows": 40
  }
}
```

| 字段 | 类型 | 是否必填 | 说明 |
|-------|------|----------|-------------|
| type | string | 是 | `"resize"` |
| payload.sessionId | string | 是 | PTY 会话 ID |
| payload.cols | number | 是 | 新的列数 |
| payload.rows | number | 是 | 新的行数 |

**终止会话：**

```json
{
  "type": "kill",
  "payload": {
    "sessionId": "oc_1713264000000_abc123"
  }
}
```

**列出活跃会话：**

```json
{
  "type": "list"
}
```

#### 服务端 → 客户端 消息

**会话已创建：**

```json
{
  "type": "created",
  "sessionId": "oc_1713264000000_abc123",
  "payload": {
    "success": true
  }
}
```

**终端输出：**

```json
{
  "type": "output",
  "sessionId": "oc_1713264000000_abc123",
  "payload": {
    "sessionId": "oc_1713264000000_abc123",
    "data": "total 32\ndrwxr-xr-x  5 user  staff  160 Apr 16 10:00 .\n"
  }
}
```

**会话已退出：**

```json
{
  "type": "exit",
  "sessionId": "oc_1713264000000_abc123",
  "payload": {
    "sessionId": "oc_1713264000000_abc123",
    "exitCode": 0
  }
}
```

**活跃会话列表：**

```json
{
  "type": "list",
  "payload": {
    "sessions": ["oc_1713264000000_abc123", "oc_1713264000000_def456"]
  }
}
```

**错误：**

```json
{
  "type": "error",
  "payload": {
    "error": "Failed to create session"
  }
}
```

---

### 本地终端

**端点：** `ws://localhost:3001/ws/terminal`

用于本地 Shell 终端会话的 WebSocket 端点。使用 `shellRegistry` 后端。消息协议与 PTY 终端相同，但有以下差异：

- 会话 ID 以 `term_` 前缀而非 `oc_`
- 使用本地 Shell 策略而非 OpenClaude PTY 服务
- `create` 载荷支持额外的字段：

**创建本地终端会话：**

```json
{
  "type": "create",
  "payload": {
    "shellType": "local",
    "shell": "/bin/bash",
    "cols": 80,
    "rows": 24,
    "cwd": "/home/user/project",
    "command": "/bin/bash",
    "args": ["-l"],
    "env": {
      "TERM": "xterm-256color"
    }
  }
}
```

| 字段 | 类型 | 是否必填 | 说明 |
|-------|------|----------|-------------|
| shellType | string | 否 | `"local"`（默认） |
| shell | string | 否 | Shell 可执行文件路径 |
| cols | number | 否 | 终端列数（默认：80） |
| rows | number | 否 | 终端行数（默认：24） |
| cwd | string | 否 | 工作目录 |
| command | string | 否 | 要执行的命令 |
| args | string[] | 否 | 命令参数 |
| env | object | 否 | 环境变量 |

所有其他消息类型（`input`、`resize`、`kill`、`list`、`created`、`output`、`exit`、`error`）的格式与 PTY 终端相同。

---

## gRPC 接口

gRPC 接口由作为独立 Bun 进程运行的 OpenClaude Agent 引擎提供。服务端通过 `AgentProcessManager` 管理 Agent 进程，并通过 `BunGrpcChatBridge` 进行通信。

**端口范围：** 50052-50151（100 个端口，按会话动态分配）。端口 50051 为保留端口，不会被分配。

**Proto 包：** `openclaude.v1`

### 服务定义

```protobuf
service AgentService {
  rpc Chat(stream ClientMessage) returns (stream ServerMessage);
}
```

### 客户端消息

**ClientMessage** 使用 `oneof payload` 发送以下三种消息类型之一：

#### ChatRequest

作为第一条消息发送以发起对话。

| 字段 | 类型 | 说明 |
|-------|------|-------------|
| message | string | 用户消息文本 |
| working_directory | string | Agent 执行命令的目录 |
| model | string | 可选的模型覆盖 |
| session_id | string | 非空值启用跨流会话持久化 |

```json
{
  "request": {
    "message": "Read the main.ts file",
    "working_directory": "/home/user/project",
    "model": "gpt-4o",
    "session_id": "session-uuid"
  }
}
```

#### UserInput

用于响应 `ActionRequired` 提示。

| 字段 | 类型 | 说明 |
|-------|------|-------------|
| reply | string | 文本回复（例如 `"yes"`、`"no"` 或澄清说明） |
| prompt_id | string | 来自 `ActionRequired` 消息的提示 ID |

```json
{
  "input": {
    "prompt_id": "prompt-uuid",
    "reply": "yes"
  }
}
```

#### CancelSignal

用于中断当前生成。

| 字段 | 类型 | 说明 |
|-------|------|-------------|
| reason | string | 取消原因 |

```json
{
  "cancel": {
    "reason": "User stopped generation"
  }
}
```

### 服务端消息

**ServerMessage** 使用 `oneof event` 流式传输以下六种事件类型之一：

#### TextChunk

| 字段 | 类型 | 说明 |
|-------|------|-------------|
| text | string | 生成的文本块 |

#### ToolCallStart

| 字段 | 类型 | 说明 |
|-------|------|-------------|
| tool_name | string | 被调用的工具名称 |
| arguments_json | string | 工具参数的 JSON 字符串 |
| tool_use_id | string | 与 `ToolCallResult` 匹配的关联 ID |

#### ToolCallResult

| 字段 | 类型 | 说明 |
|-------|------|-------------|
| tool_name | string | 已执行的工具名称 |
| output | string | 标准输出/标准错误或文件内容 |
| is_error | bool | 工具执行是否失败 |
| tool_use_id | string | 与 `ToolCallStart` 匹配的关联 ID |

#### ActionRequired

| 字段 | 类型 | 说明 |
|-------|------|-------------|
| prompt_id | string | 在 `UserInput` 中返回的 ID |
| question | string | 向用户提问的文本 |
| type | ActionType | `CONFIRM_COMMAND`（0）或 `REQUEST_INFORMATION`（1） |

#### FinalResponse

| 字段 | 类型 | 说明 |
|-------|------|-------------|
| full_text | string | 完整的生成文本 |
| prompt_tokens | int32 | 使用的提示 Token 数 |
| completion_tokens | int32 | 使用的补全 Token 数 |

#### ErrorResponse

| 字段 | 类型 | 说明 |
|-------|------|-------------|
| message | string | 错误描述 |
| code | string | 错误码字符串 |

---

## AI 核心模块

AI 核心模块（`@web-ai-ide/core`）提供 AI 网关、Provider 实现和工具注册表。

### AI 网关

`AIGateway` 类提供跨多个 AI 提供商的流式聊天补全统一接口。

```typescript
import { AIGateway } from '@web-ai-ide/core';

const gateway = new AIGateway({
  provider: 'openai',
  apiKey: 'sk-...',
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4o',
});

for await (const chunk of gateway.streamChat(messages)) {
  process.stdout.write(chunk);
}
```

**AIGatewayConfig：**

| 字段 | 类型 | 是否必填 | 说明 |
|-------|------|----------|-------------|
| provider | string | 是 | 提供商类型：`"openai"`、`"anthropic"`、`"qwen"`、`"gemini"`、`"github"` 或 `"ollama"` |
| apiKey | string | 是 | 提供商的 API 密钥 |
| baseUrl | string | 否 | 提供商 API 的自定义 Base URL |
| model | string | 否 | 模型标识符（省略时使用提供商默认值） |

**方法：**

| 方法 | 签名 | 说明 |
|--------|-----------|-------------|
| streamChat | `(messages: ChatMessage[]) => AsyncGenerator<string>` | 以文本块流式传输聊天补全 |

---

### 提供商

#### OpenAIProvider

| 属性 | 默认值 |
|----------|---------------|
| Base URL | `https://api.openai.com/v1` |
| 模型 | `gpt-4o` |
| 端点 | `/chat/completions` |
| 流式传输 | SSE（`data: [DONE]` 终止符） |

**配置：**

| 字段 | 类型 | 是否必填 | 说明 |
|-------|------|----------|-------------|
| apiKey | string | 是 | OpenAI API 密钥 |
| baseUrl | string | 否 | 自定义 Base URL |
| model | string | 否 | 模型标识符 |

#### AnthropicProvider

| 属性 | 默认值 |
|----------|---------------|
| Base URL | `https://api.anthropic.com/v1` |
| 模型 | `claude-3-5-sonnet-20240620` |
| 端点 | `/messages` |
| 流式传输 | SSE（`content_block_delta` 事件） |
| 最大 Token 数 | 4096 |

**配置：**

| 字段 | 类型 | 是否必填 | 说明 |
|-------|------|----------|-------------|
| apiKey | string | 是 | Anthropic API 密钥 |
| model | string | 否 | 模型标识符 |

**请求头：**

| 请求头 | 值 |
|--------|-------|
| x-api-key | API 密钥 |
| anthropic-version | `2023-06-01` |
| anthropic-dangerous-direct-browser-access | `true` |

#### QwenProvider

| 属性 | 默认值 |
|----------|---------------|
| Base URL | `https://dashscope.aliyuncs.com/compatible-mode/v1` |
| 模型 | `qwen-coder-plus` |
| 端点 | `/chat/completions`（OpenAI 兼容） |

**配置：**

| 字段 | 类型 | 是否必填 | 说明 |
|-------|------|----------|-------------|
| apiKey | string | 是 | DashScope API 密钥 |
| baseUrl | string | 否 | 自定义 Base URL |
| model | string | 否 | 模型标识符 |

QwenProvider 封装了 OpenAIProvider，使用 DashScope 兼容的默认配置，采用 OpenAI 兼容的 API 格式。

#### 可用模型配置

| 模型 ID | 名称 | 提供商 | API Key 环境变量 |
|----------|------|----------|-----------------|
| `gpt-4o` | GPT-4o | openai | `OPENAI_API_KEY` |
| `gpt-4o-mini` | GPT-4o Mini | openai | `OPENAI_API_KEY` |
| `claude-3-5-sonnet` | Claude 3.5 Sonnet | anthropic | `ANTHROPIC_API_KEY` |
| `claude-3-opus` | Claude 3 Opus | anthropic | `ANTHROPIC_API_KEY` |
| `qwen-coder-plus` | Qwen Coder Plus | qwen | `DASHSCOPE_API_KEY` |
| `qwen3-coder` | Qwen3 Coder | qwen | `DASHSCOPE_API_KEY` |

> **注意：** `gemini`、`github` 和 `ollama` 提供商类型在 `AgentProcessManager` 层级已支持用于 Agent 进程环境配置，但在 `AIGateway` 核心模块中尚未有专门的 Provider 实现。

---

### 工具注册表

`ToolRegistry` 类管理 AI Agent 工具的注册和执行。

**Tool 接口：**

| 字段 | 类型 | 说明 |
|-------|------|-------------|
| name | string | 唯一工具标识符 |
| description | string | 工具的可读描述 |
| inputSchema | object | 用于工具输入验证的 JSON Schema |
| requiresApproval | boolean | 执行前是否需要用户确认 |
| execute | `(args: Record<string, unknown>) => Promise<string>` | 工具执行函数 |

**注册表方法：**

| 方法 | 签名 | 说明 |
|--------|-----------|-------------|
| register | `(tool: Tool) => void` | 注册新工具 |
| get | `(name: string) => Tool \| undefined` | 按名称获取工具 |
| listTools | `() => Tool[]` | 列出所有已注册的工具 |
| listToolNames | `() => string[]` | 列出所有已注册的工具名称 |
| executeTool | `(name: string, args: Record<string, unknown>) => Promise<string>` | 按名称执行工具 |

**内置工具：**

| 工具名称 | 说明 | 需要审批 | 输入 Schema |
|-----------|-------------|-------------------|--------------|
| `read_file` | 读取文件内容 | 否 | `{ path: string }` |
| `write_file` | 创建或覆盖文件 | 是 | `{ path: string, content: string }` |
| `edit` | 在文件中进行定向字符串替换 | 是 | `{ path: string, search: string, replace: string }` |
| `glob` | 按模式查找文件 | 否 | `{ pattern: string, path?: string }` |
| `grep` | 按正则表达式搜索文件内容 | 否 | `{ pattern: string, path?: string, filePattern?: string }` |
| `shell` | 执行 Shell 命令 | 是 | `{ command: string, timeout?: number }` |

**工具详情：**

`read_file` - 读取指定路径文件的完整内容。

`write_file` - 创建或覆盖文件。如果父目录不存在，会自动创建。

`edit` - 在文件中执行单次字符串替换。如果未找到搜索字符串，则返回错误。

`glob` - 搜索匹配 glob 模式的文件。返回匹配的文件路径列表。

`grep` - 使用正则表达式模式搜索文件内容。返回包含文件名和行号的匹配行。结果限制为 100 条匹配。

`shell` - 使用 `child_process.exec` 执行 Shell 命令。默认超时为 30000 毫秒。返回标准输出、标准错误和执行时长。

---

## 数据库 Schema

应用使用 PostgreSQL 和 Prisma ORM。模型支持通过 PostgreSQL 基于 Schema 的隔离实现多租户。

### 模型

#### Tenant

| 字段 | 类型 | 说明 |
|-------|------|-------------|
| id | String (UUID) | 主键，自动生成 |
| name | String | 租户显示名称 |
| schema | String | PostgreSQL Schema 名称（唯一） |
| apiKeys | ApiKey[] | 关联的 API Key |
| createdAt | DateTime | 创建时间戳 |
| updatedAt | DateTime | 最后更新时间戳 |

#### ApiKey

| 字段 | 类型 | 说明 |
|-------|------|-------------|
| id | String (UUID) | 主键，自动生成 |
| keyHash | String | API Key 的 SHA-256 哈希（唯一） |
| name | String | 密钥显示名称（默认：`"Default"`） |
| tenantId | String | 指向 Tenant 的外键 |
| tenant | Tenant | 与 Tenant 的关联 |
| createdAt | DateTime | 创建时间戳 |

#### User

| 字段 | 类型 | 说明 |
|-------|------|-------------|
| id | String (UUID) | 主键，自动生成 |
| email | String | 邮箱地址（唯一） |
| name | String? | 显示名称（可选） |
| password | String | Bcrypt 哈希密码 |
| apiKeys | Json? | AI 提供商的加密 API Key |
| projects | Project[] | 关联的项目 |
| createdAt | DateTime | 创建时间戳 |
| updatedAt | DateTime | 最后更新时间戳 |

#### Project

| 字段 | 类型 | 说明 |
|-------|------|-------------|
| id | String (UUID) | 主键，自动生成 |
| name | String | 项目名称 |
| path | String | 项目路径（加密） |
| userId | String | 指向 User 的外键 |
| user | User | 与 User 的关联 |
| sessions | Session[] | 关联的会话 |
| createdAt | DateTime | 创建时间戳 |
| updatedAt | DateTime | 最后更新时间戳 |

**索引：** `userId`

#### Session

| 字段 | 类型 | 说明 |
|-------|------|-------------|
| id | String (UUID) | 主键，自动生成 |
| projectId | String | 指向 Project 的外键 |
| project | Project | 与 Project 的关联 |
| cwd | String? | 工作目录（加密） |
| gitBranch | String? | Git 分支名称 |
| model | String | AI 模型标识符（默认：`"gpt-4o"`） |
| messages | Message[] | 关联的消息 |
| createdAt | DateTime | 创建时间戳 |
| updatedAt | DateTime | 最后更新时间戳 |

**索引：** `projectId`

#### Message

| 字段 | 类型 | 说明 |
|-------|------|-------------|
| id | String (UUID) | 主键，自动生成 |
| uuid | String | 消息 UUID（唯一，自动生成） |
| parentUuid | String? | 父消息 UUID，用于线程化 |
| sessionId | String | 指向 Session 的外键 |
| session | Session | 与 Session 的关联 |
| type | String | 消息类型（默认：`"user"`） |
| subtype | String? | 消息子类型 |
| role | String | 消息角色：`"user"`、`"assistant"` 或 `"system"` |
| content | String | 消息内容（加密） |
| toolCalls | Json? | 工具调用数据 |
| toolCallResult | Json? | 工具执行结果 |
| usageMetadata | Json? | Token 使用元数据 |
| model | String? | 用于生成的模型 |
| systemPayload | Json? | 系统提示载荷（加密） |
| createdAt | DateTime | 创建时间戳 |

**索引：** `sessionId`

### 加密

敏感字段在存储时通过 Prisma 中间件使用 AES-256-GCM 进行加密。

**算法：** AES-256-GCM

**密钥派生：** PBKDF2 使用 SHA-256，100,000 次迭代

**加密格式：** `<iv_hex>:<authTag_hex>:<ciphertext_hex>`

**加密字段：**

| 模型 | 字段 |
|-------|--------|
| User | `apiKeys` |
| Project | `path` |
| Session | `cwd` |
| Message | `content`、`systemPayload` |

加密在 `create`、`update` 和 `upsert` 操作时透明应用。解密在 `findUnique`、`findFirst`、`findMany` 和 `update` 结果处理时透明应用。

---

## 错误码

| 错误码 | HTTP 状态码 | 说明 |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | 缺少或无效的 JWT 令牌 |
| `SESSION_NOT_FOUND` | 404 | 请求的会话不存在 |
| `PROVIDER_NOT_CONFIGURED` | 500 | AI 提供商 API 密钥缺失 |
| `GRPC_CONNECTION_FAILED` | 500 | 无法连接到 gRPC Agent 进程 |
| `INTERNAL_ERROR` | 500 | 意外的服务端错误 |

---

## 环境变量

### 数据库

| 变量 | 是否必填 | 说明 |
|----------|----------|-------------|
| `DATABASE_URL` | 是 | 主数据库的 PostgreSQL 连接字符串 |
| `DATABASE_REPLICA_URL` | 否 | 读副本的 PostgreSQL 连接字符串（回退到 `DATABASE_URL`） |

### 认证与加密

| 变量 | 是否必填 | 说明 |
|----------|----------|-------------|
| `JWT_SECRET` | 是 | JWT 令牌签名的密钥 |
| `ENCRYPTION_SECRET` | 是 | AES-256-GCM 字段加密的密钥 |
| `ENCRYPTION_SALT` | 否 | 密钥派生的固定盐值（16 字节十六进制）。**生产环境必须设置** - 如果未设置，每次重启时会生成随机盐值，导致之前加密的数据无法恢复。 |

### 消息队列与缓存

| 变量 | 是否必填 | 说明 |
|----------|----------|-------------|
| `REDIS_URL` | 否 | 用于会话缓存的 Redis 连接 URL |
| `RABBITMQ_URL` | 否 | 用于任务队列的 RabbitMQ 连接 URL |

### AI 提供商密钥

| 变量 | 是否必填 | 说明 |
|----------|----------|-------------|
| `OPENAI_API_KEY` | 否 | OpenAI API 密钥 |
| `OPENAI_BASE_URL` | 否 | 自定义 OpenAI 兼容 Base URL |
| `OPENAI_MODEL` | 否 | OpenAI 提供商的默认模型 |
| `ANTHROPIC_API_KEY` | 否 | Anthropic API 密钥 |
| `ANTHROPIC_BASE_URL` | 否 | 自定义 Anthropic Base URL |
| `ANTHROPIC_MODEL` | 否 | Anthropic 提供商的默认模型 |
| `DASHSCOPE_API_KEY` | 否 | DashScope（Qwen）API 密钥 |
| `QWEN_API_KEY` | 否 | Qwen API 密钥（DashScope 的别名） |
| `GEMINI_API_KEY` | 否 | Google Gemini API 密钥 |
| `GEMINI_BASE_URL` | 否 | 自定义 Gemini Base URL |
| `GEMINI_MODEL` | 否 | Gemini 提供商的默认模型 |

### 应用

| 变量 | 是否必填 | 说明 |
|----------|----------|-------------|
| `WORKSPACE_ROOT` | 否 | 项目工作区的根目录 |
| `BUN_PATH` | 否 | Bun 可执行文件的自定义路径 |
| `AGENT_BUN_PATH` | 否 | Agent 进程使用的 Bun 可执行文件的自定义路径 |
| `NODE_ENV` | 否 | 环境：`development` 或 `production` |
| `LOG_LEVEL` | 否 | 日志级别（默认：`info`） |
| `DEFAULT_USER_PASSWORD` | 否 | 自动创建的默认用户的密码 |
| `GRPC_HOST` | 否 | gRPC 服务端主机（默认：`localhost`） |
| `GRPC_PORT` | 否 | gRPC 服务端端口范围起始值（默认：`50052`） |
