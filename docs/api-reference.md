# Web AI IDE - API Reference

**Version**: 1.0
**Last Updated**: 2026-04-16
**Base URL**: `http://localhost:3001`

---

## Table of Contents

1. [Authentication](#authentication)
2. [REST API](#rest-api)
   - [Auth](#auth)
   - [Projects](#projects)
   - [Sessions](#sessions)
   - [Chat Messages](#chat-messages)
   - [Files](#files)
3. [WebSocket API](#websocket-api)
   - [Chat Stream](#chat-stream)
   - [PTY Terminal](#pty-terminal)
   - [Local Terminal](#local-terminal)
4. [gRPC Interface](#grpc-interface)
5. [Core AI Module](#core-ai-module)
   - [AI Gateway](#ai-gateway)
   - [Providers](#providers)
   - [Tool Registry](#tool-registry)
6. [Database Schema](#database-schema)
7. [Error Codes](#error-codes)
8. [Environment Variables](#environment-variables)

---

## Authentication

### JWT Authentication

The server uses `@fastify/jwt` for JSON Web Token authentication. The JWT secret is configured via the `JWT_SECRET` environment variable.

**Header format:**

```
Authorization: Bearer <token>
```

**JWT Payload:**

```json
{
  "id": "uuid",
  "email": "user@example.com"
}
```

### API Key Authentication (Tenant Isolation)

For multi-tenant isolation, API keys are passed via the `x-api-key` header. The key must start with `sk_` and be exactly 40 characters long (validated by the tenant plugin). The server hashes the key with SHA-256 and looks up the associated tenant to set the PostgreSQL `search_path`.

**Header format:**

```
x-api-key: sk_<37-character-key>
```

### WebSocket Authentication

WebSocket connections authenticate via the `token` query parameter, which accepts a valid JWT.

**Connection URL format:**

```
ws://localhost:3001/api/chat/:sessionId/stream?token=<jwt>
```

---

## REST API

### Auth

#### POST /api/auth/register

Register a new user account.

**Authentication:** None

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | Valid email address |
| password | string | Yes | Minimum 8 characters |
| name | string | No | Display name |

**Request Example:**

```json
{
  "email": "user@example.com",
  "password": "MyP@ss1234",
  "name": "John Doe"
}
```

**Response (201):**

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

**Error Response (400):**

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

Authenticate a user and receive a JWT token.

**Authentication:** None

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | Valid email address |
| password | string | Yes | User password |

**Request Example:**

```json
{
  "email": "user@example.com",
  "password": "MyP@ss1234"
}
```

**Response (200):**

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

**Error Response (401):**

```json
{
  "error": "Invalid email or password"
}
```

---

#### GET /api/auth/me

Get the currently authenticated user's profile.

**Authentication:** JWT required

**Request Headers:**

```
Authorization: Bearer <token>
```

**Response (200):**

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

**Error Response (401):**

```json
{
  "error": "Unauthorized"
}
```

**Error Response (404):**

```json
{
  "error": "User not found"
}
```

---

### Projects

All project endpoints require JWT authentication and support optional tenant isolation via the `x-api-key` header.

#### GET /api/projects

List all projects for the authenticated user.

**Authentication:** JWT + optional API Key

**Response (200):**

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

Get a project with its latest session.

**Authentication:** JWT + optional API Key

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Project UUID |

**Response (200):**

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

**Error Response (404):**

```json
{
  "error": "Project not found"
}
```

---

#### POST /api/projects

Create a new project. A default session is automatically created for the project.

**Authentication:** JWT + optional API Key

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Project name |
| path | string | Yes | Project path |
| userId | string | No | Owner user ID (defaults to system default user) |

**Request Example:**

```json
{
  "name": "My Project",
  "path": "./projects/my-project",
  "userId": "550e8400-e29b-41d4-a716-446655440001"
}
```

**Response (201):**

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

Delete a project and all associated sessions and messages.

**Authentication:** JWT + optional API Key

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Project UUID |

**Response (204):** No content

---

### Sessions

All session endpoints require JWT authentication and support optional tenant isolation via the `x-api-key` header.

#### GET /api/sessions/project/:projectId

List sessions for a project.

**Authentication:** JWT + optional API Key

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| projectId | string | Project UUID |

**Response (200):**

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

Get a session with its messages and project.

**Authentication:** JWT + optional API Key

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Session UUID |

**Response (200):**

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

**Error Response (404):**

```json
{
  "error": "Session not found"
}
```

---

#### GET /api/sessions/:id/conversation

Reconstruct the full conversation for a session.

**Authentication:** JWT + optional API Key

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Session UUID |

**Response (200):**

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

**Error Response (404):**

```json
{
  "error": "Session not found"
}
```

---

#### POST /api/sessions

Create a new session.

**Authentication:** JWT + optional API Key

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| projectId | string | Yes | Associated project UUID |
| cwd | string | No | Working directory |
| gitBranch | string | No | Git branch name |
| model | string | No | AI model (defaults to `gpt-4o`) |

**Request Example:**

```json
{
  "projectId": "550e8400-e29b-41d4-a716-446655440000",
  "cwd": "/home/user/project",
  "gitBranch": "main",
  "model": "gpt-4o"
}
```

**Response (201):**

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

Delete a session and all its messages.

**Authentication:** JWT + optional API Key

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Session UUID |

**Response (204):** No content

---

### Chat Messages

#### GET /api/chat/:sessionId/messages

Get chat message history for a session.

**Authentication:** JWT required

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| sessionId | string | Session UUID |

**Response (200):**

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

Read a file from a project.

**Authentication:** API Key + JWT

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| projectId | string | Project UUID |
| * | string | File path within the project |

**Status:** NOT IMPLEMENTED - Returns `{ "error": "Not implemented" }`

**Response (200):**

```json
{
  "error": "Not implemented"
}
```

---

## WebSocket API

### Chat Stream

**Endpoint:** `ws://localhost:3001/api/chat/:sessionId/stream?token=<jwt>`

Establishes a WebSocket connection for streaming AI chat. The `token` query parameter accepts a JWT for authentication.

> **Default Provider Configuration:** The server currently defaults to the Qwen provider with model `qwen3.5-plus`. This is configured via `QWEN_API_KEY` and `OPENAI_BASE_URL` environment variables in the chat route.

#### Client -> Server Messages

**Send a chat message:**

```json
{
  "type": "message",
  "content": "Hello, can you help me with my code?"
}
```

**Approve a tool call (deprecated, use `user_confirm`):**

```json
{
  "type": "approve",
  "toolCallId": "tool-call-uuid"
}
```

**Reject a tool call (deprecated, use `user_confirm`):**

```json
{
  "type": "reject",
  "toolCallId": "tool-call-uuid"
}
```

**Confirm or deny an action prompt:**

```json
{
  "type": "user_confirm",
  "promptId": "prompt-uuid",
  "approved": true
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| type | string | Yes | Must be `"user_confirm"` |
| promptId | string | Yes | The prompt ID from `action_required` event |
| approved | boolean | Yes | `true` to approve, `false` to deny |

#### Server -> Client Messages

**Text chunk:**

```json
{
  "type": "text",
  "content": "I can help you with that."
}
```

**Tool call started:**

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

**Tool result:**

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

**Action required (user confirmation needed):**

```json
{
  "type": "action_required",
  "promptId": "prompt-uuid",
  "question": "Approve shell command: rm -rf /tmp/build?",
  "actionType": "CONFIRM_COMMAND"
}
```

The `actionType` field can be one of:

| Value | Description |
|-------|-------------|
| `CONFIRM_COMMAND` | Yes/No confirmation for a command |
| `REQUEST_INFORMATION` | Free-text input requested from user |

**Generation complete:**

```json
{
  "type": "done",
  "fullText": "The complete generated response text..."
}
```

**Error:**

```json
{
  "type": "error",
  "content": "Provider not configured",
  "code": "PROVIDER_NOT_CONFIGURED"
}
```

---

### PTY Terminal

**Endpoint:** `ws://localhost:3001/ws/pty`

WebSocket endpoint for OpenClaude PTY terminal sessions. Uses the `ptyService` backend.

#### Client -> Server Messages

**Create a new PTY session:**

```json
{
  "type": "create",
  "payload": {
    "cols": 80,
    "rows": 24
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| type | string | Yes | `"create"` |
| payload.cols | number | No | Terminal columns (default: 80) |
| payload.rows | number | No | Terminal rows (default: 24) |

**Send input to a session:**

```json
{
  "type": "input",
  "payload": {
    "sessionId": "oc_1713264000000_abc123",
    "data": "ls -la\n"
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| type | string | Yes | `"input"` |
| payload.sessionId | string | Yes | PTY session ID |
| payload.data | string | Yes | Input data string |

**Resize terminal:**

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

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| type | string | Yes | `"resize"` |
| payload.sessionId | string | Yes | PTY session ID |
| payload.cols | number | Yes | New column count |
| payload.rows | number | Yes | New row count |

**Kill a session:**

```json
{
  "type": "kill",
  "payload": {
    "sessionId": "oc_1713264000000_abc123"
  }
}
```

**List active sessions:**

```json
{
  "type": "list"
}
```

#### Server -> Client Messages

**Session created:**

```json
{
  "type": "created",
  "sessionId": "oc_1713264000000_abc123",
  "payload": {
    "success": true
  }
}
```

**Terminal output:**

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

**Session exited:**

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

**Active sessions list:**

```json
{
  "type": "list",
  "payload": {
    "sessions": ["oc_1713264000000_abc123", "oc_1713264000000_def456"]
  }
}
```

**Error:**

```json
{
  "type": "error",
  "payload": {
    "error": "Failed to create session"
  }
}
```

---

### Local Terminal

**Endpoint:** `ws://localhost:3001/ws/terminal`

WebSocket endpoint for local shell terminal sessions. Uses the `shellRegistry` backend. The message protocol is identical to the PTY Terminal, with the following differences:

- Session IDs are prefixed with `term_` instead of `oc_`
- Uses the local shell strategy instead of the OpenClaude PTY service
- The `create` payload supports additional fields:

**Create a local terminal session:**

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

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| shellType | string | No | `"local"` (default) |
| shell | string | No | Shell executable path |
| cols | number | No | Terminal columns (default: 80) |
| rows | number | No | Terminal rows (default: 24) |
| cwd | string | No | Working directory |
| command | string | No | Command to execute |
| args | string[] | No | Command arguments |
| env | object | No | Environment variables |

All other message types (`input`, `resize`, `kill`, `list`, `created`, `output`, `exit`, `error`) follow the same format as the PTY Terminal.

---

## gRPC Interface

The gRPC interface is provided by the OpenClaude agent engine running as a separate Bun process. The server manages agent processes via `AgentProcessManager` and communicates through `BunGrpcChatBridge`.

**Port Range:** 50052-50151 (100 ports, dynamically allocated per-session). Port 50051 is reserved and not assigned.

**Proto Package:** `openclaude.v1`

### Service Definition

```protobuf
service AgentService {
  rpc Chat(stream ClientMessage) returns (stream ServerMessage);
}
```

### Client Messages

**ClientMessage** uses a `oneof payload` to send one of three message types:

#### ChatRequest

Sent as the first message to initiate a chat.

| Field | Type | Description |
|-------|------|-------------|
| message | string | The user's message text |
| working_directory | string | Directory where the agent executes commands |
| model | string | Optional model override |
| session_id | string | Non-empty value enables cross-stream session persistence |

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

Sent in response to an `ActionRequired` prompt.

| Field | Type | Description |
|-------|------|-------------|
| reply | string | Text response (e.g., `"yes"`, `"no"`, or clarification) |
| prompt_id | string | The prompt ID from the `ActionRequired` message |

```json
{
  "input": {
    "prompt_id": "prompt-uuid",
    "reply": "yes"
  }
}
```

#### CancelSignal

Sent to interrupt the current generation.

| Field | Type | Description |
|-------|------|-------------|
| reason | string | Reason for cancellation |

```json
{
  "cancel": {
    "reason": "User stopped generation"
  }
}
```

### Server Messages

**ServerMessage** uses a `oneof event` to stream one of six event types:

#### TextChunk

| Field | Type | Description |
|-------|------|-------------|
| text | string | Chunk of generated text |

#### ToolCallStart

| Field | Type | Description |
|-------|------|-------------|
| tool_name | string | Name of the tool being invoked |
| arguments_json | string | Tool arguments as JSON string |
| tool_use_id | string | Correlation ID matching `ToolCallResult` |

#### ToolCallResult

| Field | Type | Description |
|-------|------|-------------|
| tool_name | string | Name of the tool that was executed |
| output | string | stdout/stderr or file contents |
| is_error | bool | Whether the tool execution failed |
| tool_use_id | string | Correlation ID matching `ToolCallStart` |

#### ActionRequired

| Field | Type | Description |
|-------|------|-------------|
| prompt_id | string | ID to return in `UserInput` |
| question | string | Question text for the user |
| type | ActionType | `CONFIRM_COMMAND` (0) or `REQUEST_INFORMATION` (1) |

#### FinalResponse

| Field | Type | Description |
|-------|------|-------------|
| full_text | string | The complete generated text |
| prompt_tokens | int32 | Number of prompt tokens used |
| completion_tokens | int32 | Number of completion tokens used |

#### ErrorResponse

| Field | Type | Description |
|-------|------|-------------|
| message | string | Error description |
| code | string | Error code string |

---

## Core AI Module

The Core AI module (`@web-ai-ide/core`) provides the AI gateway, provider implementations, and tool registry.

### AI Gateway

The `AIGateway` class provides a unified interface for streaming chat completions across multiple AI providers.

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

**AIGatewayConfig:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| provider | string | Yes | Provider type: `"openai"`, `"anthropic"`, `"qwen"`, `"gemini"`, `"github"`, or `"ollama"` |
| apiKey | string | Yes | API key for the provider |
| baseUrl | string | No | Custom base URL for the provider API |
| model | string | No | Model identifier (uses provider default if omitted) |

**Methods:**

| Method | Signature | Description |
|--------|-----------|-------------|
| streamChat | `(messages: ChatMessage[]) => AsyncGenerator<string>` | Stream chat completions as text chunks |

---

### Providers

#### OpenAIProvider

| Property | Default Value |
|----------|---------------|
| Base URL | `https://api.openai.com/v1` |
| Model | `gpt-4o` |
| Endpoint | `/chat/completions` |
| Streaming | SSE (`data: [DONE]` terminator) |

**Configuration:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| apiKey | string | Yes | OpenAI API key |
| baseUrl | string | No | Custom base URL |
| model | string | No | Model identifier |

#### AnthropicProvider

| Property | Default Value |
|----------|---------------|
| Base URL | `https://api.anthropic.com/v1` |
| Model | `claude-3-5-sonnet-20240620` |
| Endpoint | `/messages` |
| Streaming | SSE (`content_block_delta` events) |
| Max Tokens | 4096 |

**Configuration:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| apiKey | string | Yes | Anthropic API key |
| model | string | No | Model identifier |

**Headers:**

| Header | Value |
|--------|-------|
| x-api-key | API key |
| anthropic-version | `2023-06-01` |
| anthropic-dangerous-direct-browser-access | `true` |

#### QwenProvider

| Property | Default Value |
|----------|---------------|
| Base URL | `https://dashscope.aliyuncs.com/compatible-mode/v1` |
| Model | `qwen-coder-plus` |
| Endpoint | `/chat/completions` (OpenAI-compatible) |

**Configuration:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| apiKey | string | Yes | DashScope API key |
| baseUrl | string | No | Custom base URL |
| model | string | No | Model identifier |

The QwenProvider wraps OpenAIProvider with DashScope-compatible defaults, using the OpenAI-compatible API format.

#### Available Model Configurations

| Model ID | Name | Provider | API Key Env Var |
|----------|------|----------|-----------------|
| `gpt-4o` | GPT-4o | openai | `OPENAI_API_KEY` |
| `gpt-4o-mini` | GPT-4o Mini | openai | `OPENAI_API_KEY` |
| `claude-3-5-sonnet` | Claude 3.5 Sonnet | anthropic | `ANTHROPIC_API_KEY` |
| `claude-3-opus` | Claude 3 Opus | anthropic | `ANTHROPIC_API_KEY` |
| `qwen-coder-plus` | Qwen Coder Plus | qwen | `DASHSCOPE_API_KEY` |
| `qwen3-coder` | Qwen3 Coder | qwen | `DASHSCOPE_API_KEY` |

> **Note:** The `gemini`, `github`, and `ollama` provider types are supported at the `AgentProcessManager` level for agent process environment configuration, but do not yet have dedicated Provider implementations in the `AIGateway` core module.

---

### Tool Registry

The `ToolRegistry` class manages the registration and execution of AI agent tools.

**Tool Interface:**

| Field | Type | Description |
|-------|------|-------------|
| name | string | Unique tool identifier |
| description | string | Human-readable tool description |
| inputSchema | object | JSON Schema for tool input validation |
| requiresApproval | boolean | Whether user confirmation is required before execution |
| execute | `(args: Record<string, unknown>) => Promise<string>` | Tool execution function |

**Registry Methods:**

| Method | Signature | Description |
|--------|-----------|-------------|
| register | `(tool: Tool) => void` | Register a new tool |
| get | `(name: string) => Tool \| undefined` | Get a tool by name |
| listTools | `() => Tool[]` | List all registered tools |
| listToolNames | `() => string[]` | List all registered tool names |
| executeTool | `(name: string, args: Record<string, unknown>) => Promise<string>` | Execute a tool by name |

**Built-in Tools:**

| Tool Name | Description | Approval Required | Input Schema |
|-----------|-------------|-------------------|--------------|
| `read_file` | Read file contents | No | `{ path: string }` |
| `write_file` | Create or overwrite a file | Yes | `{ path: string, content: string }` |
| `edit` | Make targeted string replacements in a file | Yes | `{ path: string, search: string, replace: string }` |
| `glob` | Find files by pattern | No | `{ pattern: string, path?: string }` |
| `grep` | Search file contents by regex | No | `{ pattern: string, path?: string, filePattern?: string }` |
| `shell` | Execute shell commands | Yes | `{ command: string, timeout?: number }` |

**Tool Details:**

`read_file` - Reads the entire contents of a file at the given path.

`write_file` - Creates or overwrites a file. Parent directories are created automatically if they do not exist.

`edit` - Performs a single string replacement in a file. Returns an error if the search string is not found.

`glob` - Searches for files matching a glob pattern. Returns the list of matching file paths.

`grep` - Searches file contents using a regular expression pattern. Returns matching lines with file name and line number. Results are limited to 100 matches.

`shell` - Executes a shell command using `child_process.exec`. Default timeout is 30000ms. Returns stdout, stderr, and execution duration.

---

## Database Schema

The application uses PostgreSQL with Prisma ORM. The schema supports multi-tenant isolation via PostgreSQL schema-based separation.

### Models

#### Tenant

| Field | Type | Description |
|-------|------|-------------|
| id | String (UUID) | Primary key, auto-generated |
| name | String | Tenant display name |
| schema | String | PostgreSQL schema name (unique) |
| apiKeys | ApiKey[] | Associated API keys |
| createdAt | DateTime | Creation timestamp |
| updatedAt | DateTime | Last update timestamp |

#### ApiKey

| Field | Type | Description |
|-------|------|-------------|
| id | String (UUID) | Primary key, auto-generated |
| keyHash | String | SHA-256 hash of the API key (unique) |
| name | String | Key display name (default: `"Default"`) |
| tenantId | String | Foreign key to Tenant |
| tenant | Tenant | Relation to Tenant |
| createdAt | DateTime | Creation timestamp |

#### User

| Field | Type | Description |
|-------|------|-------------|
| id | String (UUID) | Primary key, auto-generated |
| email | String | Email address (unique) |
| name | String? | Display name (optional) |
| password | String | Bcrypt-hashed password |
| apiKeys | Json? | Encrypted API keys for AI providers |
| projects | Project[] | Associated projects |
| createdAt | DateTime | Creation timestamp |
| updatedAt | DateTime | Last update timestamp |

#### Project

| Field | Type | Description |
|-------|------|-------------|
| id | String (UUID) | Primary key, auto-generated |
| name | String | Project name |
| path | String | Project path (encrypted) |
| userId | String | Foreign key to User |
| user | User | Relation to User |
| sessions | Session[] | Associated sessions |
| createdAt | DateTime | Creation timestamp |
| updatedAt | DateTime | Last update timestamp |

**Index:** `userId`

#### Session

| Field | Type | Description |
|-------|------|-------------|
| id | String (UUID) | Primary key, auto-generated |
| projectId | String | Foreign key to Project |
| project | Project | Relation to Project |
| cwd | String? | Working directory (encrypted) |
| gitBranch | String? | Git branch name |
| model | String | AI model identifier (default: `"gpt-4o"`) |
| messages | Message[] | Associated messages |
| createdAt | DateTime | Creation timestamp |
| updatedAt | DateTime | Last update timestamp |

**Index:** `projectId`

#### Message

| Field | Type | Description |
|-------|------|-------------|
| id | String (UUID) | Primary key, auto-generated |
| uuid | String | Message UUID (unique, auto-generated) |
| parentUuid | String? | Parent message UUID for threading |
| sessionId | String | Foreign key to Session |
| session | Session | Relation to Session |
| type | String | Message type (default: `"user"`) |
| subtype | String? | Message subtype |
| role | String | Message role: `"user"`, `"assistant"`, or `"system"` |
| content | String | Message content (encrypted) |
| toolCalls | Json? | Tool call data |
| toolCallResult | Json? | Tool execution result |
| usageMetadata | Json? | Token usage metadata |
| model | String? | Model used for generation |
| systemPayload | Json? | System prompt payload (encrypted) |
| createdAt | DateTime | Creation timestamp |

**Index:** `sessionId`

### Encryption

Sensitive fields are encrypted at rest using AES-256-GCM via Prisma middleware.

**Algorithm:** AES-256-GCM

**Key Derivation:** PBKDF2 with SHA-256, 100,000 iterations

**Encrypted Format:** `<iv_hex>:<authTag_hex>:<ciphertext_hex>`

**Encrypted Fields:**

| Model | Fields |
|-------|--------|
| User | `apiKeys` |
| Project | `path` |
| Session | `cwd` |
| Message | `content`, `systemPayload` |

Encryption is applied transparently on `create`, `update`, and `upsert` operations. Decryption is applied transparently on `findUnique`, `findFirst`, `findMany`, and `update` result processing.

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid JWT token |
| `SESSION_NOT_FOUND` | 404 | Requested session does not exist |
| `PROVIDER_NOT_CONFIGURED` | 500 | AI provider API key is missing |
| `GRPC_CONNECTION_FAILED` | 500 | Failed to connect to the gRPC agent process |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## Environment Variables

### Database

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string for primary database |
| `DATABASE_REPLICA_URL` | No | PostgreSQL connection string for read replica (falls back to `DATABASE_URL`) |

### Authentication & Encryption

| Variable | Required | Description |
|----------|----------|-------------|
| `JWT_SECRET` | Yes | Secret key for JWT token signing |
| `ENCRYPTION_SECRET` | Yes | Secret for AES-256-GCM field encryption |
| `ENCRYPTION_SALT` | No | Fixed salt for key derivation (16 bytes hex). **Must be set in production** - if not set, random salt is generated on each restart, making previously encrypted data unrecoverable. |

### Message Queue & Cache

| Variable | Required | Description |
|----------|----------|-------------|
| `REDIS_URL` | No | Redis connection URL for session caching |
| `RABBITMQ_URL` | No | RabbitMQ connection URL for job queue |

### AI Provider Keys

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | No | OpenAI API key |
| `OPENAI_BASE_URL` | No | Custom OpenAI-compatible base URL |
| `OPENAI_MODEL` | No | Default model for OpenAI provider |
| `ANTHROPIC_API_KEY` | No | Anthropic API key |
| `ANTHROPIC_BASE_URL` | No | Custom Anthropic base URL |
| `ANTHROPIC_MODEL` | No | Default model for Anthropic provider |
| `DASHSCOPE_API_KEY` | No | DashScope (Qwen) API key |
| `QWEN_API_KEY` | No | Qwen API key (alias for DashScope) |
| `GEMINI_API_KEY` | No | Google Gemini API key |
| `GEMINI_BASE_URL` | No | Custom Gemini base URL |
| `GEMINI_MODEL` | No | Default model for Gemini provider |

### Application

| Variable | Required | Description |
|----------|----------|-------------|
| `WORKSPACE_ROOT` | No | Root directory for project workspaces |
| `BUN_PATH` | No | Custom path to Bun executable |
| `AGENT_BUN_PATH` | No | Custom path to Bun executable for agent processes |
| `NODE_ENV` | No | Environment: `development` or `production` |
| `LOG_LEVEL` | No | Log level (default: `info`) |
| `DEFAULT_USER_PASSWORD` | No | Password for the auto-created default user |
| `GRPC_HOST` | No | gRPC server host (default: `localhost`) |
| `GRPC_PORT` | No | gRPC server port range start (default: `50052`) |
