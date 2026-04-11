# WebSocket 消息协议文档

**日期**：2026-04-10
**状态**：进行中

---

## 概述

本文档定义了前端与后端之间的 WebSocket 通信协议，用于 AI Chat 功能。底层使用 gRPC 与 openclaude sidecar 进程通信。

---

## 协议版本

- **当前版本**：1.0
- **基于**：gRPC openclaude.proto v1

---

## 连接方式

### WebSocket 端点

```
ws://localhost:3001/api/chat/:sessionId/stream?token=<jwt_token>
```

### 认证

通过 query 参数传递 JWT token，或通过 `x-api-key` header 认证。

---

## 消息类型

### 1. 客户端 → 服务器

| 消息类型 | 方向 | 字段 | 说明 |
|---------|------|------|------|
| `message` | 前端→后端 | `{ type, content }` | 用户发送消息 |
| `approve` | 前端→后端 | `{ type, toolCallId }` | 批准工具调用（已废弃，使用 `user_confirm`） |
| `reject` | 前端→后端 | `{ type, toolCallId }` | 拒绝工具调用（已废弃，使用 `user_confirm`） |
| `user_confirm` | 前端→后端 | `{ type, promptId, approved }` | 用户确认/拒绝危险操作 |

### 2. 服务器 → 客户端

| 消息类型 | 方向 | 字段 | 说明 |
|---------|------|------|------|
| `text` | 后端→前端 | `{ type, content }` | AI 文本响应片段 |
| `tool_call` | 后端→前端 | `{ type, toolCallId, toolName, arguments }` | 工具调用请求 |
| `tool_result` | 后端→前端 | `{ type, toolCallId, result }` | 工具执行结果 |
| `action_required` | 后端→前端 | `{ type, promptId, question, actionType }` | 需用户确认的危险操作 |
| `done` | 后端→前端 | `{ type }` | AI 响应完成 |
| `error` | 后端→前端 | `{ type, content, code? }` | 错误信息 |

---

## 消息格式

### 1. message（客户端发送）

```json
{
  "type": "message",
  "content": "帮我分析项目结构"
}
```

### 2. text（服务端推送）

```json
{
  "type": "text",
  "content": "我来帮你分析项目结构..."
}
```

### 3. tool_call（服务端推送）

```json
{
  "type": "tool_call",
  "toolCallId": "tool_abc123",
  "toolName": "Bash",
  "arguments": {
    "command": "ls -la"
  }
}
```

### 4. tool_result（服务端推送）

```json
{
  "type": "tool_result",
  "toolCallId": "tool_abc123",
  "result": {
    "success": true,
    "output": "total 32\ndrwxr-xr-x  12 user  staff   384 Apr 10 10:00 .\n"
  }
}
```

失败情况：

```json
{
  "type": "tool_result",
  "toolCallId": "tool_abc123",
  "result": {
    "success": false,
    "error": "Command failed with exit code 1"
  }
}
```

### 5. action_required（服务端推送）

```json
{
  "type": "action_required",
  "promptId": "tool_123456_abc",
  "question": "确认执行危险命令？\n\n`rm -rf /tmp/test`\n\n匹配危险模式: rm -rf",
  "actionType": "CONFIRM_COMMAND"
}
```

### 6. user_confirm（客户端发送）

```json
{
  "type": "user_confirm",
  "promptId": "tool_123456_abc",
  "approved": true
}
```

或拒绝：

```json
{
  "type": "user_confirm",
  "promptId": "tool_123456_abc",
  "approved": false
}
```

### 7. done（服务端推送）

```json
{
  "type": "done"
}
```

### 8. error（服务端推送）

```json
{
  "type": "error",
  "content": "Failed to process message",
  "code": "INTERNAL_ERROR"
}
```

---

## user_confirm 回路流程

```
1. 后端→前端：发送 action_required 事件
   {
     "type": "action_required",
     "promptId": "tool_xxx",
     "question": "确认执行 rm -rf /?",
     "actionType": "CONFIRM_COMMAND"
   }

2. 前端弹出确认对话框，显示问题内容

3. 前端→后端：用户点击确认后发送 user_confirm
   {
     "type": "user_confirm",
     "promptId": "tool_xxx",
     "approved": true
   }

   或用户拒绝：
   {
     "type": "user_confirm",
     "promptId": "tool_xxx",
     "approved": false
   }

   或超时（60s）：
   由产品策略决定（当前未在 WebSocket 层实现自动拒绝）。

4. 后端将确认结果通过 gRPC `ClientMessage` 发给 openclaude（proto 字段名为 **`input`**，对应 `UserInput`）：
   `{ "input": { "prompt_id": "<uuid>", "reply": "yes" | "no" } }`（与 `keepCase` 下的字段名一致）

5. openclaude 根据用户选择继续或终止操作
```

---

## gRPC 事件到 WebSocket 协议映射

| gRPC ServerMessage | WebSocket 事件 | 转换说明 |
|-------------------|----------------|----------|
| `text_chunk` | `text` | `text_chunk.text` → `content` |
| `tool_start` | `tool_call` | `tool_start.tool_use_id` → `toolCallId`<br>`tool_start.tool_name` → `toolName`<br>`tool_start.arguments_json` → `arguments`（需 JSON.parse） |
| `tool_result` | `tool_result` | `tool_result.tool_use_id` → `toolCallId`<br>`tool_result.is_error` → `success = !is_error`<br>`tool_result.output` → `output` |
| `action_required` | `action_required` | 直接传递 `prompt_id`, `question`, `type` |
| `done` | `done` | 直接传递 |
| `error` | `error` | `error.message` → `content`<br>`error.code` → `code` |

---

## 状态机

```
WebSocket 连接建立
       │
       ▼
   会话初始化
       │
       ▼
   等待用户输入 ◄────────┐
       │                │
       ▼                │
   发送消息到            │
   openclaude           │
       │                │
       ▼                │
   处理来自             │
   openclaude 的        │
   响应事件              │
       │                │
       ├────────────────┤
       │                │
       ▼                │
  action_required ──► 用户确认后继续
       │
       ▼
   done / error
       │
       ▼
   WebSocket 断开
```

---

## 错误处理

| 错误码 | 说明 | 处理方式 |
|--------|------|----------|
| `UNAUTHORIZED` | 未授权 | 关闭 WebSocket 连接 |
| `SESSION_NOT_FOUND` | 会话不存在 | 创建新会话或返回错误 |
| `PROVIDER_NOT_CONFIGURED` | AI Provider 未配置 | 提示用户配置 API Key |
| `GRPC_CONNECTION_FAILED` | gRPC 连接失败 | 重试或返回错误 |
| `INTERNAL_ERROR` | 内部错误 | 返回错误信息 |

---

## 示例对话流程

### 1. 用户发送消息

**客户端**：
```json
{"type": "message", "content": "帮我分析项目结构"}
```

### 2. AI 开始响应

**服务端**：
```json
{"type": "text", "content": "我来帮你分析项目结构..."}
```

### 3. AI 调用工具

**服务端**：
```json
{"type": "tool_call", "toolCallId": "tool_001", "toolName": "Bash", "arguments": {"command": "find . -type f -name '*.ts' | head -20"}}
```

### 4. 工具执行完成

**服务端**：
```json
{"type": "tool_result", "toolCallId": "tool_001", "result": {"success": true, "output": "src/index.ts\nsrc/routes/chat.ts\n..."}}
```

### 5. AI 继续响应

**服务端**：
```json
{"type": "text", "content": "根据分析，你的项目有以下 TypeScript 文件..."}
```

### 6. 对话完成

**服务端**：
```json
{"type": "done"}
```

---

## 安全考虑

1. **用户确认机制**：危险命令需要用户明确确认后才能执行
2. **超时机制**：`action_required` 等待用户确认的超时时间为 60 秒
3. **API Key 隔离**：每个用户的 sidecar 进程有独立的环境变量
4. **路径限制**：工具只能在允许的工作目录内操作

---

*文档版本：1.0*
*最后更新：2026-04-10*
