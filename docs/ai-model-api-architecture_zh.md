# Web AI IDE - AI 大模型 API 调用与存储方法

**版本**: 1.0
**最后更新**: 2026-04-19

---

## 目录

1. [整体架构概览](#1-整体架构概览)
2. [AI 模型 API 调用方法](#2-ai-模型-api-调用方法)
   - [主链路：Electron → gRPC → AI Provider](#21-主链路electrongrpcai-provider)
   - [轻量链路：core 包直连](#22-轻量链路core-包直连)
   - [OpenAI 兼容 Shim 适配层](#23-openai-兼容-shim-适配层)
   - [Anthropic 原生 API 客户端](#24-anthropic-原生-api-客户端)
   - [流式响应处理](#25-流式响应处理)
3. [API 密钥与配置存储方法](#3-api-密钥与配置存储方法)
   - [Electron 主进程存储（electron-store）](#31-electron-主进程存储electron-store)
   - [渲染进程回退存储（localStorage）](#32-渲染进程回退存储localstorage)
   - [服务端环境变量存储](#33-服务端环境变量存储)
   - [数据库存储（SHA-256 哈希）](#34-数据库存储sha-256-哈希)
   - [认证 Token 存储](#35-认证-token-存储)
4. [Provider 预设配置](#4-provider-预设配置)
5. [gRPC 通信机制](#5-grpc-通信机制)
   - [Proto 服务定义](#51-proto-服务定义)
   - [Bun Sidecar 桥接](#52-bun-sidecar-桥接)
   - [Agent 进程管理](#53-agent-进程管理)
6. [完整调用链路图](#6-完整调用链路图)
7. [关键文件索引](#7-关键文件索引)
8. [安全评估](#8-安全评估)

---

## 1. 整体架构概览

本项目采用**分层架构**调用 AI 大模型，核心链路为：

```
前端(Electron/React) → WebSocket → Server(Fastify) → gRPC → OpenClaude Agent → AI Provider API
```

同时还有一个独立的 `core` 包提供轻量级直连 AI Provider 的能力。

**两条主要调用路径：**

| 路径 | 适用场景 | 特点 |
|------|---------|------|
| 主链路（Server + gRPC） | 完整 AI Agent 对话 | 支持工具调用、多轮对话、流式响应 |
| 轻量链路（core 包直连） | 简单聊天补全 | 直接 HTTP 调用，无 Agent 能力 |

---

## 2. AI 模型 API 调用方法

### 2.1 主链路：Electron → gRPC → AI Provider

主链路是完整的 AI Agent 对话通道，支持工具调用、多轮对话和流式响应。

**调用流程：**

```
React 组件 (Chat.tsx)
  → useChat hook
    → WebSocketService.sendMessage()
      → WebSocket /api/chat/:sessionId/stream
        → chatRouter (Fastify)
          → AgentSessionManager.send()
            → BunGrpcChatBridge.write()  (stdin JSON)
              → agent-grpc-sidecar.ts  (Bun 子进程)
                → gRPC Client → Chat()
                  → GrpcServer.handleChat()
                    → QueryEngine.submitMessage()
                      → query() → claude.ts queryAPI()
                        → getAnthropicClient() → 选择 Provider
                          → Anthropic SDK / OpenAI Shim / Bedrock SDK / ...
                            → HTTP POST 到 AI Provider API
```

**流式响应回传：**

```
AI Provider SSE Response
  → openaiStreamToAnthropic() / Anthropic SDK Stream
    → QueryEngine 异步生成器 yield 事件
      → GrpcServer call.write(ServerMessage)
        → gRPC 流 → sidecar stdout JSON
          → BunGrpcChatBridge onDataLine()
            → AgentSessionManager handleGrpcMessage()
              → WebSocket notifyFrontend()
                → React useChat onMessage handler
                  → setStreamingContent / setMessages
```

#### 2.1.1 getAnthropicClient() - Provider 选择器

文件：[client.ts](file:///e:/web/web-ai-ide/packages/openclaude-temp/src/services/api/client.ts)

`getAnthropicClient()` 函数根据环境变量选择不同的 AI Provider 后端：

| 环境变量 | Provider | 实现方式 |
|---------|----------|---------|
| `CLAUDE_CODE_USE_OPENAI=1` | OpenAI 兼容 | `createOpenAIShimClient()` |
| `CLAUDE_CODE_USE_GITHUB=1` | GitHub Copilot | `createOpenAIShimClient()` |
| `CLAUDE_CODE_USE_GEMINI=1` | Google Gemini | `createOpenAIShimClient()` |
| `CLAUDE_CODE_USE_BEDROCK=1` | AWS Bedrock | `AnthropicBedrock` SDK |
| `CLAUDE_CODE_USE_FOUNDRY=1` | Azure Foundry | `AnthropicFoundry` SDK |
| `CLAUDE_CODE_USE_VERTEX=1` | GCP Vertex AI | `AnthropicVertex` SDK |
| 默认 | Anthropic 直连 | `new Anthropic()` SDK |

#### 2.1.2 Claude API 核心调用

文件：[claude.ts](file:///e:/web/web-ai-ide/packages/openclaude-temp/src/services/api/claude.ts)

核心调用使用 Anthropic SDK 的 `beta.messages.create` 方法，启用 `stream: true` 流式模式：

```typescript
const result = await anthropic.beta.messages
  .create(
    { ...params, stream: true },
    { signal, ...(clientRequestId && { headers: { [CLIENT_REQUEST_ID_HEADER]: clientRequestId } }) }
  )
  .withResponse()
```

---

### 2.2 轻量链路：core 包直连

文件：[gateway.ts](file:///e:/web/web-ai-ide/packages/core/src/ai/gateway.ts)

`AIGateway` 类提供跨多个 AI 提供商的流式聊天补全统一接口，直接通过 `fetch()` 调用 AI Provider API，不经过 gRPC。

```typescript
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

#### OpenAIProvider

文件：[openai.ts](file:///e:/web/web-ai-ide/packages/core/src/ai/providers/openai.ts)

```typescript
async *streamChat(messages: ChatMessage[]): AsyncGenerator<string> {
  const response = await fetch(`${this.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
    },
    body: JSON.stringify({ model: this.model, messages, stream: true }),
  });
  // SSE 解析
  if (line.startsWith('data: ')) {
    const content = parsed.choices?.[0]?.delta?.content;
    if (content) yield content;
  }
}
```

#### AnthropicProvider

文件：[anthropic.ts](file:///e:/web/web-ai-ide/packages/core/src/ai/providers/anthropic.ts)

```typescript
async *streamChat(messages: ChatMessage[]): AsyncGenerator<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': this.apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: this.model,
      messages,
      stream: true,
      max_tokens: 4096,
    }),
  });
  // SSE 解析
  if (parsed.type === 'content_block_delta') {
    yield parsed.delta?.text || '';
  }
}
```

#### QwenProvider

文件：[qwen.ts](file:///e:/web/web-ai-ide/packages/core/src/ai/providers/qwen.ts)

复用 `OpenAIProvider`，默认 baseUrl 为 `https://dashscope.aliyuncs.com/compatible-mode/v1`。

---

### 2.3 OpenAI 兼容 Shim 适配层

文件：[openaiShim.ts](file:///e:/web/web-ai-ide/packages/openclaude-temp/src/services/api/openaiShim.ts)

这是最关键的适配层（1576行），将 Anthropic SDK 调用格式翻译为 OpenAI 兼容的 chat completion 请求，并将 SSE 流式响应转回 Anthropic 格式，使上层代码无感知。

**支持的 Provider：**

| Provider | API 端点 | 认证方式 |
|----------|---------|---------|
| OpenAI | `https://api.openai.com/v1` | `Authorization: Bearer {apiKey}` |
| Azure OpenAI | `*.azure.com` | `api-key: {apiKey}` + deployment 路径 |
| Ollama / LM Studio | 本地模型 | `Authorization: Bearer {apiKey}` |
| OpenRouter | - | `Authorization: Bearer {apiKey}` |
| Together / Groq / Fireworks | - | `Authorization: Bearer {apiKey}` |
| DeepSeek / Mistral | - | `Authorization: Bearer {apiKey}` |
| GitHub Copilot | `https://api.githubcopilot.com` | `Authorization: Bearer {apiKey}` |
| Google Gemini | `https://generativelanguage.googleapis.com/v1beta/openai` | `Authorization: Bearer {apiKey}` |

**关键函数：**

| 函数 | 位置 | 说明 |
|------|------|------|
| `createOpenAIShimClient()` | 第1538行 | 创建伪装成 Anthropic 客户端的 OpenAI Shim 客户端 |
| `openaiStreamToAnthropic()` | 第577行 | 异步生成器，将 OpenAI SSE 流转换为 Anthropic 格式事件流 |
| `_convertNonStreamingResponse()` | 第1406行 | 非流式响应转换 |

**请求构建逻辑：**

```typescript
// 标准 OpenAI 兼容
chatCompletionsUrl = `${request.baseUrl}/chat/completions`
headers.Authorization = `Bearer ${apiKey}`

// Azure OpenAI
chatCompletionsUrl = `${base}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`
headers['api-key'] = apiKey
```

---

### 2.4 Anthropic 原生 API 客户端

当不使用 OpenAI Shim 时，直接使用 Anthropic SDK 进行 API 调用。支持以下云平台 SDK：

| SDK | 环境变量 | 说明 |
|-----|---------|------|
| `Anthropic` | 默认 | Anthropic 直连 |
| `AnthropicBedrock` | `CLAUDE_CODE_USE_BEDROCK=1` | AWS Bedrock |
| `AnthropicFoundry` | `CLAUDE_CODE_USE_FOUNDRY=1` | Azure Foundry |
| `AnthropicVertex` | `CLAUDE_CODE_USE_VERTEX=1` | GCP Vertex AI |

---

### 2.5 流式响应处理

#### 2.5.1 OpenAI SSE → Anthropic 格式转换

`openaiStreamToAnthropic()` 是核心流式转换函数：

```typescript
async function* openaiStreamToAnthropic(
  response: Response,
  model: string,
): AsyncGenerator<AnthropicStreamEvent> {
  // 1. 发射 message_start 事件
  // 2. 使用 ReadableStream reader 逐块读取
  // 3. 解析 SSE data: 行
  // 4. 处理 reasoning_content（思考链）→ thinking block
  // 5. 处理 content → text_delta
  // 6. 处理 tool_calls → tool_use block
  // 7. 处理 finish_reason → message_stop
  // 8. 处理 usage → 最终 token 统计
}
```

#### 2.5.2 Anthropic 原生流式处理

```typescript
for await (const part of stream) {
  resetStreamIdleTimer();
  switch (part.type) {
    case 'message_start':        // 消息开始
    case 'content_block_start':  // 内容块开始
    case 'content_block_delta':  // 内容增量
    case 'content_block_stop':   // 内容块结束
    case 'message_delta':        // 消息增量
    case 'message_stop':         // 消息结束
  }
}
```

包含流式空闲超时看门狗（默认90秒）和停滞检测（30秒阈值）。

#### 2.5.3 gRPC 流式事件

```typescript
for await (const msg of generator) {
  if (msg.type === 'stream_event') {
    // content_block_delta → text_chunk
    call.write({ text_chunk: { text: msg.event.delta.text } });
  } else if (msg.type === 'user') {
    // tool_result
  } else if (msg.type === 'result') {
    // FinalResponse with token counts
  }
}
```

#### 2.5.4 前端 WebSocket 流式接收

文件：[useChat.ts](file:///e:/web/web-ai-ide/packages/electron/src/hooks/useChat.ts)

```typescript
wsService.onMessage((event: ChatStreamEvent) => {
  switch (event.type) {
    case 'text':            streamingContentRef.current += event.content; break;
    case 'tool_call':       setPendingToolCall(event.toolCall); break;
    case 'tool_result':     /* 更新工具状态 */ break;
    case 'action_required': /* 显示确认对话框 */ break;
    case 'done':            /* 将流式内容转为完整消息 */ break;
    case 'error':           /* 显示错误 */ break;
  }
});
```

---

## 3. API 密钥与配置存储方法

项目中存在**三层** API 密钥存储架构：

| 层级 | 存储方式 | 位置 | 安全性 |
|------|---------|------|--------|
| Electron 主进程 | `electron-store` (JSON 文件) | 用户数据目录 | **明文存储，无加密** |
| 渲染进程回退 | `localStorage` | 浏览器本地存储 | **明文存储，无加密** |
| 服务端 | 环境变量 + 数据库(SHA256 哈希) | 服务器进程 | **环境变量明文，数据库哈希** |

### 3.1 Electron 主进程存储（electron-store）

文件：[main.ts](file:///e:/web/web-ai-ide/packages/electron/electron/main.ts)

使用 `electron-store` 库（版本 `^8.2.0`），在主进程中创建持久化存储：

```typescript
import Store from 'electron-store';

interface StoreSchema {
  ai_providers: AIProvider[];
  selected_provider: string;
  selected_model: string;
  fontSize: number;
  tabSize: number;
}

const store = new Store<StoreSchema>({
  defaults: {
    ai_providers: [
      {
        id: 'openai',
        name: 'OpenAI',
        apiEndpoint: 'https://api.openai.com/v1',
        apiKey: '',   // API Key 明文存储
        models: [{ id: 'gpt-4o', name: 'GPT-4o' }],
      },
    ],
    selected_provider: 'openai',
    selected_model: 'gpt-4o',
    fontSize: 14,
    tabSize: 2,
  },
});
```

**IPC 通信接口：**

| IPC 通道 | 方向 | 说明 |
|---------|------|------|
| `settings:get` | 渲染→主 | 读取单个设置 |
| `settings:set` | 渲染→主 | 写入单个设置 |
| `settings:getAll` | 渲染→主 | 读取所有设置（包含 API Key） |

**存储位置：** Windows 通常为 `%APPDATA%\Web AI IDE\config.json`

**注意：** `electron-store` 默认不加密，API Key 以明文 JSON 存储。虽然支持 `encryptionKey` 选项，但当前未启用。

### 3.2 渲染进程回退存储（localStorage）

文件：[settingsStorage.ts](file:///e:/web/web-ai-ide/packages/electron/src/contexts/settingsStorage.ts)

渲染进程采用**双重存储策略**：优先使用 `electron-store`（通过 IPC），回退到 `localStorage`：

```typescript
export function saveSettingsToStorage(settings: Settings): void {
  if (window.electronAPI?.settings) {
    // Electron 环境：通过 IPC 存入 electron-store
    window.electronAPI.settings.set('ai_providers', settings.aiProviders);
    window.electronAPI.settings.set('selected_provider', settings.selectedProvider);
    window.electronAPI.settings.set('selected_model', settings.selectedModel);
  } else {
    // Web/浏览器环境：回退到 localStorage
    localStorage.setItem('ai_providers', JSON.stringify(settings.aiProviders));
    localStorage.setItem('selected_provider', settings.selectedProvider);
    localStorage.setItem('selected_model', settings.selectedModel);
  }
}
```

**注意：** `ai_providers` 数组中每个 provider 对象都包含 `apiKey` 字段，两种方式均为明文存储。

### 3.3 服务端环境变量存储

文件：[chat.ts](file:///e:/web/web-ai-ide/packages/server/src/routes/chat.ts)

服务端通过环境变量获取 API Key：

```typescript
const getProviderConfig = (): ProviderConfig => {
  return {
    type: 'qwen',
    apiKey: process.env.QWEN_API_KEY || '',
    baseUrl: process.env.OPENAI_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    model: process.env.OPENAI_MODEL || 'qwen3.5-plus',
  };
};
```

文件：[agent-process-manager.ts](file:///e:/web/web-ai-ide/packages/server/src/services/agent-process-manager.ts)

Agent 进程管理器根据 Provider 类型将 API Key 注入到子进程环境变量中：

```typescript
if (provider.type === 'anthropic') {
  env.ANTHROPIC_API_KEY = provider.apiKey;
} else if (provider.type === 'openai') {
  env.OPENAI_API_KEY = provider.apiKey;
} else if (provider.type === 'gemini') {
  env.GEMINI_API_KEY = provider.apiKey;
} else if (provider.type === 'qwen') {
  env.OPENAI_API_KEY = provider.apiKey;
  env.OPENAI_BASE_URL = provider.baseUrl || 'https://dashscope.aliyuncs.com/compatible-mode/v1';
}
```

**环境变量配置文件（.env）：**

```
QWEN_API_KEY=sk-xxx
OPENAI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
OPENAI_MODEL=qwen3.5-plus
```

### 3.4 数据库存储（SHA-256 哈希）

文件：[tenant.ts](file:///e:/web/web-ai-ide/packages/server/src/middleware/tenant.ts)

租户（多租户架构）的 API Key 在数据库中存储为 **SHA-256 哈希**：

```typescript
const apiKey = request.headers['x-api-key'] as string;
const keyHash = createHash('sha256').update(apiKey).digest('hex');
// 查询数据库匹配哈希值
```

文件：[schema.prisma](file:///e:/web/web-ai-ide/packages/server/prisma/schema.prisma)

```prisma
model ApiKey {
  id        String  @id @default(uuid())
  keyHash   String  @unique    // 存储的是哈希值，不是明文
  name      String  @default("Default")
}
```

### 3.5 认证 Token 存储

文件：[App.tsx](file:///e:/web/web-ai-ide/packages/electron/src/App.tsx)

用户认证 Token 存储在 `localStorage` 中：

```typescript
const savedToken = localStorage.getItem('auth_token');
// 登录成功后
localStorage.setItem('auth_token', data.token);
// 登出时
localStorage.removeItem('auth_token');
```

文件：[api.ts](file:///e:/web/web-ai-ide/packages/electron/src/services/api.ts)

认证 Token 同时保存在内存变量中用于 API 请求：

```typescript
let authToken: string | null = null;

export const api = {
  setAuthToken(token: string | null) { authToken = token; },
  getAuthHeaders(): AuthHeaders {
    if (!authToken) return {};
    return { Authorization: `Bearer ${authToken}` };
  },
};
```

---

## 4. Provider 预设配置

文件：[provider-presets.json](file:///e:/web/web-ai-ide/packages/electron/src/config/provider-presets.json)

预定义了 7 个 AI 提供商的端点和模型：

| ID | 名称 | API 端点 | 默认模型 |
|----|------|---------|---------|
| openai | OpenAI | `https://api.openai.com/v1` | gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-3.5-turbo |
| qwen | Qwen | `https://dashscope.aliyuncs.com/compatible-mode/v1` | qwen-plus, qwen-turbo, qwen-max, qwen-long |
| anthropic | Anthropic | `https://api.anthropic.com/v1` | claude-sonnet-4, claude-3.5-sonnet, claude-3.5-haiku, claude-3-opus |
| gemini | Google Gemini | `https://generativelanguage.googleapis.com/v1beta` | gemini-2.0-flash, gemini-1.5-pro, gemini-1.5-flash |
| deepseek | DeepSeek | `https://api.deepseek.com/v1` | deepseek-chat, deepseek-coder |
| azure | Azure OpenAI | （需用户配置） | gpt-4o, gpt-4-turbo, gpt-35-turbo |
| custom | 自定义 | （需用户配置） | （需用户配置） |

文件：[providerPresets.ts](file:///e:/web/web-ai-ide/packages/electron/src/config/providerPresets.ts)

工厂函数用于从预设创建 provider：

```typescript
export function createProviderFromPreset(preset: ProviderPreset, apiKey: string = ''): AIProvider {
  return {
    id: `${preset.id}-${Date.now()}`,
    name: preset.name,
    apiEndpoint: preset.apiEndpoint,
    apiKey,
    models: preset.models.map(m => ({ ...m })),
  };
}
```

---

## 5. gRPC 通信机制

### 5.1 Proto 服务定义

文件：[openclaude.proto](file:///e:/web/web-ai-ide/packages/openclaude-temp/src/proto/openclaude.proto)

```protobuf
syntax = "proto3";
package openclaude.v1;

service AgentService {
  rpc Chat(stream ClientMessage) returns (stream ServerMessage);
}
```

**ClientMessage 三种载荷：**

| 载荷 | 用途 | 关键字段 |
|------|------|---------|
| `ChatRequest` | 首次请求 | message, working_directory, model, session_id |
| `UserInput` | 用户回复 Agent 提示 | reply, prompt_id |
| `CancelSignal` | 中断信号 | reason |

**ServerMessage 六种事件：**

| 事件 | 用途 | 关键字段 |
|------|------|---------|
| `TextChunk` | LLM 文本增量 | text |
| `ToolCallStart` | Agent 开始使用工具 | tool_name, arguments_json, tool_use_id |
| `ToolCallResult` | 工具执行结果 | tool_name, output, is_error, tool_use_id |
| `ActionRequired` | 需要用户干预 | prompt_id, question, type |
| `FinalResponse` | 生成完成 | full_text, prompt_tokens, completion_tokens |
| `ErrorResponse` | 错误 | message, code |

### 5.2 Bun Sidecar 桥接

文件：[agent-grpc-sidecar.ts](file:///e:/web/web-ai-ide/packages/server/scripts/agent-grpc-sidecar.ts)

由于 Node.js 的 `@grpc/grpc-js` 与 Bun 的 gRPC HTTP/2 栈不兼容，通过 **Bun 子进程侧车** 桥接，使用 stdin/stdout JSON 行协议：

| 方向 | 格式 | 含义 |
|------|------|------|
| Sidecar → 父进程 | `{"t":"r"}` | 就绪信号 |
| Sidecar → 父进程 | `{"t":"d","m":<ServerMessage>}` | gRPC 数据 |
| Sidecar → 父进程 | `{"t":"e","c"?,"m"}` | gRPC 错误 |
| Sidecar → 父进程 | `{"t":"n"}` | 流结束 |
| 父进程 → Sidecar | `{"op":"w","msg":<ClientMessage>}` | 写入流 |
| 父进程 → Sidecar | `{"op":"x"}` | 取消流 |

文件：[bun-grpc-chat-bridge.ts](file:///e:/web/web-ai-ide/packages/server/src/services/bun-grpc-chat-bridge.ts)

`BunGrpcChatBridge` 类封装了 Sidecar 子进程管理：
- `static connect(host, port, absoluteProtoPath)` - 启动 Bun 子进程并等待就绪
- `write(msg)` - 向 gRPC 流写入 ClientMessage
- `cancel()` - 取消 gRPC 流
- 继承 `EventEmitter`，触发 `data`/`error`/`end` 事件
- 就绪超时 25 秒
- 自动剥离代理环境变量（`grpc_proxy`、`http_proxy` 等）

### 5.3 Agent 进程管理

文件：[agent-process-manager.ts](file:///e:/web/web-ai-ide/packages/server/src/services/agent-process-manager.ts)

**端口池：** `50052` ~ `50151`（100 个端口），每个 Agent 进程分配独立端口

**核心流程：**

1. `createProcess()` - 为每个会话启动独立的 OpenClaude gRPC 服务器进程
2. 使用 `crossSpawn(bunExe, ['run', 'dev:grpc'], { cwd: openClaudeDir, env })` 启动
3. 根据 Provider 类型设置不同环境变量（API Key 注入）
4. `waitForPort()` - TCP 探测端口就绪（最多 10 秒）
5. 端口就绪后额外等待 800ms，确保 HTTP/2 完全就绪
6. `openChatBridge()` - 通过 `BunGrpcChatBridge.connect()` 建立到该进程的 gRPC Chat 流

**关键配置：**
- `GRPC_LOOPBACK = '127.0.0.1'` - 避免 Windows 上 IPv4/IPv6 解析不一致
- 30 分钟无活动自动清理进程

---

## 6. 完整调用链路图

### 主链路（Server 模式）

```
┌─────────────────────────────────────────────────────────────────┐
│  Electron 前端 (React)                                          │
│  ┌──────────┐    ┌───────────┐    ┌────────────────┐           │
│  │ Chat.tsx  │───→│ useChat   │───→│ WebSocketSvc   │           │
│  └──────────┘    └───────────┘    └───────┬────────┘           │
└────────────────────────────────────────────┼────────────────────┘
                                             │ WebSocket
                                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  Fastify 后端服务器 (Node.js, 端口 3001)                         │
│  ┌──────────┐    ┌──────────────────┐    ┌─────────────────┐   │
│  │ chat.ts   │───→│ AgentSessionMgr  │───→│ AgentProcessMgr │   │
│  └──────────┘    └──────────────────┘    └───────┬─────────┘   │
└──────────────────────────────────────────────────┼──────────────┘
                                                   │ BunGrpcChatBridge
                                                   │ (stdin/stdout JSON)
                                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│  Bun gRPC Sidecar 子进程                                        │
│  ┌──────────────────────────┐                                   │
│  │ agent-grpc-sidecar.ts    │───→ gRPC Client → Chat()         │
│  └──────────────────────────┘                                   │
└────────────────────────────────────────────┬────────────────────┘
                                             │ gRPC 双向流 (HTTP/2)
                                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  OpenClaude gRPC 服务器 (Bun 进程, 端口 50052+)                  │
│  ┌──────────┐    ┌──────────────┐    ┌─────────────────┐       │
│  │GrpcServer│───→│ QueryEngine  │───→│ claude.ts /     │       │
│  │          │    │              │    │ openaiShim.ts   │       │
│  └──────────┘    └──────────────┘    └───────┬─────────┘       │
└──────────────────────────────────────────────┼──────────────────┘
                                               │ HTTP POST (SSE)
                                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  AI Provider API                                                │
│  ┌────────┐ ┌─────────┐ ┌────────┐ ┌────────┐ ┌─────────┐     │
│  │ OpenAI │ │Anthropic│ │  Qwen  │ │ Gemini │ │ Ollama  │     │
│  └────────┘ └─────────┘ └────────┘ └────────┘ └─────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

### 轻量链路（core 包直连）

```
┌────────────────────────────────────────────────────┐
│  AIGateway                                         │
│  ┌──────────────┐                                  │
│  │ streamChat() │───→ Provider.streamChat()        │
│  └──────────────┘                                  │
│       │                                            │
│       ├── OpenAIProvider ──→ fetch(/chat/completions)  │
│       ├── AnthropicProvider ──→ fetch(/messages)    │
│       └── QwenProvider ──→ fetch(/chat/completions) │
└────────────────────────────────────────────────────┘
```

---

## 7. 关键文件索引

### AI API 调用相关

| 文件 | 作用 |
|------|------|
| [openaiShim.ts](file:///e:/web/web-ai-ide/packages/openclaude-temp/src/services/api/openaiShim.ts) | OpenAI 兼容 Shim 适配层（核心） |
| [client.ts](file:///e:/web/web-ai-ide/packages/openclaude-temp/src/services/api/client.ts) | Anthropic 客户端工厂（Provider 选择器） |
| [claude.ts](file:///e:/web/web-ai-ide/packages/openclaude-temp/src/services/api/claude.ts) | Claude API 核心调用 |
| [gateway.ts](file:///e:/web/web-ai-ide/packages/core/src/ai/gateway.ts) | core 包 AI 网关 |
| [openai.ts](file:///e:/web/web-ai-ide/packages/core/src/ai/providers/openai.ts) | core 包 OpenAI Provider |
| [anthropic.ts](file:///e:/web/web-ai-ide/packages/core/src/ai/providers/anthropic.ts) | core 包 Anthropic Provider |
| [qwen.ts](file:///e:/web/web-ai-ide/packages/core/src/ai/providers/qwen.ts) | core 包 Qwen Provider |

### API 密钥存储相关

| 文件 | 作用 |
|------|------|
| [main.ts](file:///e:/web/web-ai-ide/packages/electron/electron/main.ts) | electron-store 初始化与 IPC 接口 |
| [preload.ts](file:///e:/web/web-ai-ide/packages/electron/electron/preload.ts) | IPC 桥接到渲染进程 |
| [settingsStorage.ts](file:///e:/web/web-ai-ide/packages/electron/src/contexts/settingsStorage.ts) | 双重存储策略（electron-store + localStorage） |
| [SettingsContext.tsx](file:///e:/web/web-ai-ide/packages/electron/src/contexts/SettingsContext.tsx) | 设置加载与管理 |
| [SettingsAITab.tsx](file:///e:/web/web-ai-ide/packages/electron/src/components/settings/SettingsAITab.tsx) | API Key 输入 UI |
| [tenant.ts](file:///e:/web/web-ai-ide/packages/server/src/middleware/tenant.ts) | 租户 API Key 哈希验证 |
| [schema.prisma](file:///e:/web/web-ai-ide/packages/server/prisma/schema.prisma) | 数据库 Schema（ApiKey 模型） |
| [api.ts](file:///e:/web/web-ai-ide/packages/electron/src/services/api.ts) | 认证 Token 管理 |

### gRPC 通信相关

| 文件 | 作用 |
|------|------|
| [openclaude.proto](file:///e:/web/web-ai-ide/packages/openclaude-temp/src/proto/openclaude.proto) | gRPC 服务定义 |
| [server.ts](file:///e:/web/web-ai-ide/packages/openclaude-temp/src/grpc/server.ts) | gRPC 服务端实现 |
| [start-grpc.ts](file:///e:/web/web-ai-ide/packages/openclaude-temp/scripts/start-grpc.ts) | gRPC 服务器启动脚本 |
| [agent-grpc-sidecar.ts](file:///e:/web/web-ai-ide/packages/server/scripts/agent-grpc-sidecar.ts) | Bun gRPC Sidecar |
| [bun-grpc-chat-bridge.ts](file:///e:/web/web-ai-ide/packages/server/src/services/bun-grpc-chat-bridge.ts) | gRPC 桥接封装 |
| [agent-process-manager.ts](file:///e:/web/web-ai-ide/packages/server/src/services/agent-process-manager.ts) | Agent 进程管理 |
| [agent-session-manager.ts](file:///e:/web/web-ai-ide/packages/server/src/services/agent-session-manager.ts) | Agent 会话管理 |
| [chat.ts](file:///e:/web/web-ai-ide/packages/server/src/routes/chat.ts) | Chat WebSocket 路由 |
| [grpc.ts](file:///e:/web/web-ai-ide/packages/server/src/types/grpc.ts) | gRPC 类型定义 |

### 前端相关

| 文件 | 作用 |
|------|------|
| [useChat.ts](file:///e:/web/web-ai-ide/packages/electron/src/hooks/useChat.ts) | 前端 Chat Hook |
| [websocket.ts](file:///e:/web/web-ai-ide/packages/electron/src/services/websocket.ts) | 前端 WebSocket 服务 |
| [types.ts](file:///e:/web/web-ai-ide/packages/electron/src/types.ts) | 前端类型定义（AIProvider 等） |
| [provider-presets.json](file:///e:/web/web-ai-ide/packages/electron/src/config/provider-presets.json) | Provider 预设配置 |
| [providerPresets.ts](file:///e:/web/web-ai-ide/packages/electron/src/config/providerPresets.ts) | Provider 预设工厂函数 |

---

## 8. 安全评估

### 存在的安全问题

| 问题 | 严重程度 | 说明 |
|------|---------|------|
| API Key 明文存储 | 🔴 高 | `electron-store` 默认不加密，API Key 以明文 JSON 存储在用户数据目录 |
| localStorage 明文回退 | 🔴 高 | 非 Electron 环境时，API Key 回退存储到 `localStorage`，同样是明文 |
| 无 keytar/safeStorage | 🟡 中 | 项目未使用 `keytar`、Electron `safeStorage` API 或任何加密/混淆机制 |
| .env 泄露风险 | 🔴 高 | `.env` 文件中包含真实 API Key，仓库公开将直接泄露 |
| IPC 无访问控制 | 🟡 中 | `settings:get`/`settings:set` IPC 通道无权限校验 |
| settings:getAll 暴露 | 🟡 中 | `settings:getAll` 返回完整数据包含所有 API Key |

### 相对安全的部分

| 方面 | 说明 |
|------|------|
| 租户 API Key 哈希存储 | 数据库中使用 SHA-256 哈希存储，不可逆 |
| 前端输入遮掩 | API Key 输入框使用 `type="password"` |
| API Key 不传前端环境变量 | AI API Key 仅在后端环境变量中使用，不通过 Vite 环境变量传递到前端 |
| 数据库字段加密 | 敏感字段（content、path 等）使用 AES-256-GCM 加密 |

### 改进建议

1. **启用 electron-store 加密**：使用 `encryptionKey` 选项或 Electron `safeStorage` API 加密存储的 API Key
2. **使用系统密钥链**：集成 `keytar` 或 Electron `safeStorage` 将 API Key 存储在操作系统密钥链中
3. **移除 .env 中的真实密钥**：将 `.env` 加入 `.gitignore`，使用 `.env.example` 作为模板
4. **IPC 访问控制**：对敏感 IPC 通道添加权限校验
5. **API Key 脱敏返回**：`settings:getAll` 返回时对 API Key 进行脱敏处理（如只返回后4位）
