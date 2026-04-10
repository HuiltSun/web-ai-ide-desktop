# openclaude 集成到 web-ai-ide 设计规格

**日期**：2026-04-10
**状态**：草稿
**版本**：1.0

---

## 一、概述

### 1.1 目标

将 openclaude 的 Agent 核心能力集成到 web-ai-ide，实现：

- AI Agent 多步推理和任务分解
- 完整的工具系统（bash, file, grep, glob, agents, tasks, MCP）
- Streaming 实时输出
- 复用 web-ai-ide 的 AI Provider 配置
- 混合 UI 风格（openclaude 交互 + web-ai-ide 设计系统）

### 1.2 集成方式

- **源码管理**：Git Submodule（保持与上游同步）
- **集成位置**：`packages/openclaude/`
- **后端集成**：直接集成到 `server/routes/chat.ts`
- **工具桥接**：openclaude 原生工具 + Web-ai-ide 适配层

---

## 二、架构设计

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  Chat.tsx   │  │ToolCallCard │  │  SettingsContext        │  │
│  │  (混合UI)   │  │(glass-panel)│  │  (AI Provider 配置)    │  │
│  └──────┬──────┘  └──────┬──────┘  └────────────┬────────────┘  │
│         │                │                      │                │
│         └────────────────┼──────────────────────┘                │
│                          │ WebSocket                              │
└──────────────────────────┼───────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Backend (server)                            │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  chat.ts (WebSocket)                                         │ │
│  │  - 处理消息流                                                │ │
│  │  - 调用 openclaude Agent                                     │ │
│  │  - 转发 streaming 响应到前端                                  │ │
│  └──────────────────────────┬────────────────────────────────────┘ │
│                             │                                      │
│  ┌──────────────────────────▼────────────────────────────────────┐│
│  │  ToolAdapter (工具适配层)                                      ││
│  │  - bash → PTYService                                         ││
│  │  - file R/W → /api/files/*                                   ││
│  │  - grep/glob → /api/files/* + 算法                           ││
│  │  - agents/tasks → 子 Agent                                   ││
│  └──────────────────────────┬────────────────────────────────────┘│
│                             │                                      │
│  ┌──────────────────────────▼────────────────────────────────────┐│
│  │  openclaude Agent核心 (submodule)                             ││
│  │  - Agent 推理引擎                                              ││
│  │  - 工具注册表                                                  ││
│  │  - Streaming 输出                                              ││
│  └───────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 数据流

1. **用户发送消息** → Frontend Chat.tsx → WebSocket
2. **后端接收** → chat.ts WebSocket handler
3. **消息持久化** → sessionService.addMessage()
4. **AI 处理** → openclaude Agent（使用 ToolAdapter 执行工具）
5. **Streaming 输出** → WebSocket → Frontend
6. **UI 展示** → Chat.tsx + ToolCallCard

---

## 三、目录结构

```
packages/
├── openclaude/                    # Git Submodule (新增)
│   ├── src/
│   │   ├── agents/               # Agent 核心
│   │   ├── tools/                # 工具定义
│   │   ├── runtime/              # 运行时
│   │   └── ...
│   └── package.json
│
├── server/
│   └── src/
│       ├── services/
│       │   ├── tool-adapter.ts   # 工具适配层 (新增)
│       │   └── agent-service.ts   # Agent 服务封装 (新增)
│       └── routes/
│           └── chat.ts            # 修改：集成 openclaude
│
├── core/
│   └── src/
│       ├── ai/
│       │   ├── gateway.ts         # 修改：支持外部 Agent
│       │   └── providers/         # 保持不变
│       └── tools/                 # 保留，可与 openclaude 共存
│
└── electron/
    └── src/
        ├── components/
        │   ├── Chat.tsx          # 修改：混合 UI
        │   ├── ChatMessage.tsx   # 修改：streaming 样式
        │   └── ToolCallCard.tsx  # 修改：glass-panel 样式
        └── contexts/
            └── SettingsContext.tsx  # 修改：导出 AI Provider 配置
```

---

## 四、核心组件

### 4.1 ToolAdapter（工具适配层）

**文件**：`packages/server/src/services/tool-adapter.ts`

**职责**：桥接 openclaude 工具到 web-ai-ide API

```typescript
export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
}

export class ToolAdapter {
  constructor(
    private ptyService: PTYService,
    private fileService: typeof filesRouter
  );

  // bash → PTYService
  async bash(command: string, cwd?: string): Promise<ToolResult>;

  // file read → /api/files/read
  async fileRead(path: string): Promise<ToolResult>;

  // file write → /api/files/write
  async fileWrite(path: string, content: string): Promise<ToolResult>;

  // file edit → /api/files/update
  async fileEdit(path: string, oldStr: string, newStr: string): Promise<ToolResult>;

  // grep → 本地算法 + /api/files/*
  async grep(pattern: string, path?: string, options?: GrepOptions): Promise<ToolResult>;

  // glob → 本地算法
  async glob(pattern: string, path?: string): Promise<ToolResult>;

  // 获取所有工具定义（供 openclaude 注册）
  getToolDefinitions(): Tool[];
}
```

### 4.2 AgentService（Agent 服务封装）

**文件**：`packages/server/src/services/agent-service.ts`

**职责**：封装 openclaude Agent，提供统一的流式接口

```typescript
export interface AgentConfig {
  sessionId: string;
  provider: AIProviderConfig;
  model?: string;
}

export class AgentService {
  constructor(
    private toolAdapter: ToolAdapter,
    private gatewayFactory: (config: AIProviderConfig) => AIGateway
  );

  // 获取或创建 agent 实例
  getOrCreateAgent(sessionId: string, config: AgentConfig): OpenClaudeAgent;

  // 创建流式对话
  streamChat(sessionId: string, messages: ChatMessage[]): AsyncGenerator<AgentEvent>;

  // 终止当前 agent
  kill(sessionId: string): void;

  // 从 session 加载 provider 配置（内部使用）
  private loadProviderConfig(sessionId: string): Promise<AIProviderConfig>;
}
```

**设计说明**：
- 使用 `gatewayFactory` 工厂函数注入 AIGateway 创建逻辑，便于测试
- `loadProviderConfig()` 为私有方法，负责从 session 解密加载配置

### 4.3 chat.ts 修改

**文件**：`packages/server/src/routes/chat.ts`

**修改点**：

1. 导入 AgentService
2. 消息处理逻辑改为调用 AgentService
3. streaming 响应转发到前端

```typescript
// 修改后的流程
socket.on('message', async (message: Buffer) => {
  const data = JSON.parse(message.toString());

  if (data.type === 'message' && data.content) {
    // 1. 保存用户消息
    await sessionService.addMessage({
      sessionId: activeSessionId,
      role: 'user',
      content: data.content,
    });

    // 2. 调用 openclaude Agent (streaming)
    const agent = agentService.getAgent(activeSessionId);

    for await (const event of agent.streamChat(activeSessionId, messages)) {
      switch (event.type) {
        case 'text':
          // 3. 转发文本响应到前端
          socket.send(JSON.stringify({ type: 'text', content: event.content }));
          break;
        case 'tool_call':
          // 4. 发送工具调用卡片到前端
          socket.send(JSON.stringify({ type: 'tool_call', ...event }));
          break;
        case 'tool_result':
          // 5. 发送工具执行结果
          socket.send(JSON.stringify({ type: 'tool_result', ...event }));
          break;
        case 'done':
          socket.send(JSON.stringify({ type: 'done' }));
          break;
      }
    }
  }
});
```

---

## 五、AI Provider 配置

### 5.1 配置来源

AI Provider 配置来自前端 SettingsContext，通过 session 关联。

### 5.2 配置传递流程

```
SettingsContext (前端)
    ↓ 用户配置 AI Provider
    ↓ 保存到 electron-store
    ↓ 通过登录传递给后端
Session.apiKeys (加密存储)
    ↓
AgentService
    ↓ 创建 AIGateway
openclaude Agent
```

### 5.3 Provider 适配

```typescript
// agent-service.ts
private async loadProviderConfig(sessionId: string): Promise<AIProviderConfig> {
  const session = await sessionService.getSession(sessionId);
  const encryptedKeys = session.project.user.apiKeys;

  // 解密获取 provider 配置
  const config = decryptProviderConfig(encryptedKeys);

  return config.providers.find(p => p.id === config.currentProviderId);
}

private createGateway(sessionId: string): AIGateway {
  // 注意：此方法为同步，loadProviderConfig 在调用前已完成
  const config = this.loadProviderConfigSync(sessionId);
  return this.gatewayFactory({
    provider: config.type,  // 'openai' | 'anthropic' | 'qwen'
    apiKey: config.apiKey,
    baseUrl: config.baseUrl,
    model: config.model,
  });
}
```

**说明**：
- `loadProviderConfig` 是 async 方法
- `createGateway` 是同步方法，通过预先加载的配置创建 Gateway
- 实际实现中可在 `getOrCreateAgent` 时先 await 加载配置

---

## 六、UI 设计

### 6.1 Chat 界面布局

```
┌─────────────────────────────────────────────────────────┐
│  Chat                                                    │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐│
│  │ 🤖 AI:                                              ││
│  │                                                     ││
│  │ Here's the analysis of your project...              ││
│  │                                                     ││
│  └─────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────┐│
│  │ 🔧 Tool: bash                                       ││
│  │ ┌─────────────────────────────────────────────────┐ ││
│  │ │ $ ls -la                                        │ ││
│  │ │ total 128                                      │ ││
│  │ │ drwxr-xr-x  12 user  staff   384 Apr 10 ...    │ ││
│  │ └─────────────────────────────────────────────────┘ ││
│  │ ✅ Done (0.23s)                                    ││
│  └─────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────┐│
│  │ 🤖 AI:                                              ││
│  │ Based on the directory listing, I can see...       ││
│  └─────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐│
│  │ [Type your message...]                        [Send]││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

### 6.2 组件样式

#### ChatMessage（AI 消息）

- 背景：`var(--color-bg-secondary)` 或 `glass-panel`
- AI 前缀：🤖 或 indigo 强调色图标
- 文本：`var(--color-text-primary)`
- streaming 时使用渐变高亮

#### ToolCallCard（工具调用卡片）

- 使用 `glass-panel` 效果
- 边框：`1px solid rgba(99, 102, 241, 0.2)`
- 工具图标：indigo 强调色
- 终端输出：JetBrains Mono 字体，等宽显示
- 背景：`rgba(10, 10, 13, 0.8)` + `backdrop-filter: blur(12px)`

### 6.3 颜色变量

```css
:root {
  --color-accent: #6366f1;
  --color-tool-bg: rgba(10, 10, 13, 0.8);
  --color-tool-border: rgba(99, 102, 241, 0.2);
  --color-success: #22c55e;
  --color-error: #ef4444;
  --color-warning: #f59e0b;
}
```

---

## 七、实现步骤

### Phase 1：基础设施（第 1-2 周）

1. 添加 openclaude 作为 git submodule
   ```bash
   git submodule add git@github.com:Gitlawb/openclaude.git packages/openclaude
   ```

2. 创建 ToolAdapter 基础实现
   - 实现 bash → PTYService 桥接
   - 实现 file R/W → /api/files/* 桥接

3. 验证工具适配层
   - 单元测试 PTY 调用
   - 单元测试文件操作

### Phase 2：核心集成（第 3-4 周）

4. 创建 AgentService 封装
   - 封装 openclaude Agent
   - 实现流式接口

5. 集成到 chat.ts
   - 修改 WebSocket handler
   - 实现 streaming 响应
   - 测试多轮对话

6. AI Provider 配置桥接
   - 从 session 加载加密配置
   - 解密并创建 AIGateway

### Phase 3：UI 优化（第 5-6 周）

7. 修改 Chat.tsx
   - 集成 streaming 显示
   - 添加工具卡片展示

8. 优化 ToolCallCard 样式
   - 应用 glass-panel 效果
   - 添加动画

9. 完善错误处理和边界情况

### Phase 4：测试与优化（第 7-8 周）

10. 端到端测试
11. 性能优化
12. 文档完善

---

## 八、依赖关系

### 8.1 数据流依赖

```
packages/openclaude (submodule)
       ↓
packages/core/src/ai/gateway.ts
       ↓
packages/server/src/services/tool-adapter.ts
       ↓
packages/server/src/services/agent-service.ts
       ↓
packages/server/src/routes/chat.ts
       ↓
packages/electron/src/components/Chat.tsx
```

### 8.2 配置流向（独立）

```
SettingsContext.tsx (前端配置来源)
        │
        ▼ 保存到 electron-store
        │
        ▼ 登录时传递给后端
session.apiKeys (加密存储)
        │
        ▼ AgentService.loadProviderConfig()
openclaude Agent
```

**说明**：SettingsContext 是 AI Provider 配置的**来源**，通过 session 关联传递给后端 AgentService，与数据流依赖链独立。

### 8.3 工具实现阶段

| 阶段 | 工具 | 说明 |
|------|------|------|
| Phase 1 | bash, fileRead, fileWrite | 基础工具桥接 |
| Phase 2 | fileEdit, grep, glob | 增强工具桥接 |

**实现策略**：Phase 1 先实现核心工具，确保基本流程跑通；Phase 2 补充高级工具，保持实现节奏。

---

## 九、风险与应对

| 风险 | 影响 | 应对措施 |
|------|------|----------|
| openclaude API 变更 | 集成代码失效 | 使用 submodule，定期同步上游 |
| 流式输出延迟 | 用户体验差 | 实现 chunked 传输，优化 buffer |
| 工具执行超时 | 会话卡住 | 添加超时控制，实现 abort 机制 |
| AI Provider 配置同步 | 配置丢失 | 加密存储，支持重新配置 |

---

## 十、测试计划

### 10.1 单元测试

- ToolAdapter 各方法测试
- AgentService 流式输出测试
- 配置加密/解密测试

### 10.2 集成测试

- WebSocket 端到端流式测试
- 多轮对话上下文测试
- 工具调用链路测试

### 10.3 UI 测试

- Streaming 显示测试
- 工具卡片样式测试
- 错误状态显示测试

---

## 十一、待确定事项

- [x] openclaude 具体版本/ commit - **已验证：v0.1.8，无导出类**
- [ ] 是否需要支持 MCP (Model Context Protocol)
- [x] 是否需要保留 core/ai/gateway.ts 作为备用 - **建议保留，作为独立 AI 能力**

---

## 十二、Spike 验证结论（2026-04-10）

### 验证方法
克隆 openclaude v0.1.8，审查源码结构。

### 关键发现

1. **openclaude 不能作为库直接调用**
   - `package.json` 只暴露 `bin/openclaude` CLI 入口
   - 核心类（`runAgent.ts`、`QueryEngine.ts`）无导出
   - `src/index.ts` 只导出工具函数，无 Agent 类

2. **openclaude 有内置 gRPC 服务器**
   - 位置：`src/grpc/server.ts`
   - Service：`openclaude.v1.AgentService.Chat`
   - 启动命令：`npm run dev:grpc`
   - 支持 bidirectional streaming

3. **gRPC 集成的限制**
   - 工具系统仍使用 openclaude 原生 `getTools()`
   - Provider 配置仍通过环境变量（CLI 方式）
   - 无法直接注入 web-ai-ide 的 `AIGateway`

### 集成方案调整

| 原方案 | 问题 | 调整后方案 |
|--------|------|------------|
| `new OpenClaudeAgent(gateway, toolAdapter)` | 无此类可导出 | 使用 gRPC 服务器 |
| 工具桥接到 PTY/File API | openclaude 工具内联 | 保留原生工具，限制命令白名单 |
| 直接复用 web-ai-ide AI Provider | 不可注入 | 通过环境变量传递 API Key |

---

## 十三、修正后的架构设计

### 13.1 最终架构方案

**核心问题**：openclaude 的 gRPC server 设计为**单用户进程**，使用进程级 `process.env` 配置 Provider，无法 per-request 隔离。

**解决方案**：为每个用户启动**独立的 gRPC sidecar 进程**，实现真正的多用户隔离。

```
┌─────────────────────────────────────────────────────────────────┐
│  web-ai-ide Backend (server)                                     │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  AgentProcessManager                                          │ │
│  │  - 为每个用户创建独立的 gRPC sidecar 进程                     │ │
│  │  - 管理进程生命周期                                            │ │
│  │  - 隔离环境变量                                               │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                              │                                  │
│         ┌────────────────────┼────────────────────┐           │
│         ▼                    ▼                    ▼           │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐     │
│  │ User A      │      │ User B      │      │ User C      │     │
│  │ sidecar     │      │ sidecar     │      │ sidecar     │     │
│  │ (port 50052)│      │ (port 50053)│      │ (port 50054)│     │
│  └─────────────┘      └─────────────┘      └─────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

### 13.2 AgentProcessManager（进程管理器）

```typescript
interface AgentProcess {
  pid: number;
  port: number;
  userId: string;
  sessionId: string;
  lastActivity: number;
  proc: ChildProcess;
}

export class AgentProcessManager {
  private processes: Map<string, AgentProcess> = new Map();
  private portCounter = 50052; // 起始端口
  private readonly MAX_PROCESSES = 50; // 每个用户最大并发进程

  async createProcess(userId: string, sessionId: string, provider: ProviderConfig): Promise<AgentProcess> {
    const port = this.portCounter++;
    const env = {
      ...process.env,
      ANTHROPIC_API_KEY: provider.apiKey,
      ANTHROPIC_BASE_URL: provider.baseUrl,
      ANTHROPIC_MODEL: provider.model,
    };

    const proc = spawn('node', ['dist/cli.mjs', 'dev:grpc'], {
      cwd: path.join(__dirname, '../../openclaude'),
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const process: AgentProcess = {
      pid: proc.pid!,
      port,
      userId,
      sessionId,
      lastActivity: Date.now(),
      proc,
    };

    this.processes.set(`${userId}:${sessionId}`, process);
    return process;
  }

  async getOrCreateProcess(userId: string, sessionId: string, provider: ProviderConfig): Promise<AgentProcess> {
    const key = `${userId}:${sessionId}`;
    const existing = this.processes.get(key);

    if (existing && existing.pid) {
      return existing;
    }

    return this.createProcess(userId, sessionId, provider);
  }

  async destroyProcess(userId: string, sessionId: string): Promise<void> {
    const key = `${userId}:${sessionId}`;
    const process = this.processes.get(key);

    if (process) {
      process.proc.kill();
      this.processes.delete(key);
    }
  }

  // 清理超时进程
  cleanup(): void {
    const TIMEOUT_MS = 30 * 60 * 1000;
    const now = Date.now();

    for (const [key, proc] of this.processes) {
      if (now - proc.lastActivity > TIMEOUT_MS) {
        proc.proc.kill();
        this.processes.delete(key);
      }
    }
  }
}
```

### 13.3 命令白名单（通过 ActionRequired 拦截）

由于 openclaude 的 `canUseTool` 钩子会发送 `ActionRequired`，我们可以在**拦截层**实现白名单：

```typescript
// 在 gRPC server 启动时配置 canUseTool 钩子
const canUseTool: CanUseToolFn = async (tool, input, context, assistantMsg, toolUseID) => {
  // 1. 发送 tool_start 事件
  call.write({
    tool_start: {
      tool_name: tool.name,
      arguments_json: JSON.stringify(input),
      tool_use_id: toolUseID
    }
  });

  // 2. 白名单检查
  if (!isCommandAllowed(tool.name, input)) {
    // 直接拒绝，不发送 action_required
    return { behavior: 'deny', reason: 'Command not in whitelist' };
  }

  // 3. 工作目录检查
  if (input.cwd && !isPathAllowed(input.cwd)) {
    return { behavior: 'deny', reason: 'Path outside workspace' };
  }

  // 4. 发送 action_required 请求用户确认
  const promptId = randomUUID();
  call.write({
    action_required: {
      prompt_id: promptId,
      question: `Approve ${tool.name}?`,
      type: 'CONFIRM_COMMAND'
    }
  });

  // 5. 等待用户响应
  return new Promise((resolve) => {
    pendingRequests.set(promptId, (reply) => {
      resolve(reply.toLowerCase() === 'yes' || reply.toLowerCase() === 'y'
        ? { behavior: 'allow' }
        : { behavior: 'deny', reason: 'User denied' }
      );
    });
  });
};
```

### 13.4 gRPC 事件到 WebSocket 协议转换（基于实际 proto）

```typescript
interface GrpcEvent {
  text_chunk?: { text: string };
  tool_start?: { tool_name: string; arguments_json: string; tool_use_id: string };
  tool_result?: { tool_name: string; output: string; is_error: boolean; tool_use_id: string };
  action_required?: { prompt_id: string; question: string; type: string };
  done?: { full_text: string; prompt_tokens: number; completion_tokens: number };
  error?: { message: string; code: string };
}

function translateToWebSocket(event: GrpcEvent, socket: any): void {
  if (event.text_chunk) {
    socket.send(JSON.stringify({ type: 'text', content: event.text_chunk.text }));
  }

  if (event.tool_start) {
    socket.send(JSON.stringify({
      type: 'tool_call',
      toolCallId: event.tool_start.tool_use_id,
      toolName: event.tool_start.tool_name,
      arguments: JSON.parse(event.tool_start.arguments_json),
    }));
  }

  if (event.tool_result) {
    socket.send(JSON.stringify({
      type: 'tool_result',
      toolCallId: event.tool_result.tool_use_id,
      result: {
        success: !event.tool_result.is_error,
        output: event.tool_result.output,
        error: event.tool_result.is_error ? event.tool_result.output : undefined,
      },
    }));
  }

  if (event.action_required) {
    socket.send(JSON.stringify({
      type: 'action_required',
      promptId: event.action_required.prompt_id,
      question: event.action_required.question,
      actionType: event.action_required.type,
    }));
  }

  if (event.done) {
    socket.send(JSON.stringify({ type: 'done', stats: event.done }));
  }

  if (event.error) {
    socket.send(JSON.stringify({ type: 'error', content: event.error.message, code: event.error.code }));
  }
}
```

### 13.5 工具安全边界设计

```typescript
const ALLOWED_TOOLS = new Set([
  'Bash', 'Read', 'Write', 'Edit', 'Grep', 'Glob',
  'Notebook', 'WebSearch', 'WebFetch', 'TodoWrite',
]);

const BLOCKED_PATTERNS = [
  /sudo/, /su /, /chmod \d{4}/, /chown/,
  /curl.*-T/, /wget.*-O.*\//,
  /nc .*-e/, /:\(.*:\|.*&\);:/, // Fork bomb
];

function isCommandAllowed(toolName: string, input: any): boolean {
  // 工具名必须在白名单
  if (!ALLOWED_TOOLS.has(toolName)) {
    return false;
  }

  // 检查命令内容
  if (toolName === 'Bash' && input.command) {
    for (const pattern of BLOCKED_PATTERNS) {
      if (pattern.test(input.command)) {
        return false;
      }
    }
  }

  return true;
}

const WORKSPACE_ROOT = '/tmp/web-ai-ide/workspaces';

function isPathAllowed(targetPath: string): boolean {
  // resolve 解析后会消除 ..，所以只需检查是否在 WORKSPACE_ROOT 内
  return targetPath.startsWith(WORKSPACE_ROOT);
}
```

### 13.6 WebSocket 消息协议（更新版）

| 事件类型 | 方向 | 字段 | 说明 |
|---------|------|------|------|
| `message` | 前端→后端 | `{ type, content }` | 用户发送消息 |
| `text` | 后端→前端 | `{ type, content }` | AI 文本响应 |
| `tool_call` | 后端→前端 | `{ type, toolCallId, toolName, arguments }` | 工具调用请求 |
| `tool_result` | 后端→前端 | `{ type, toolCallId, result }` | 工具执行结果 |
| `action_required` | 后端→前端 | `{ type, promptId, question, actionType }` | 请求用户确认 |
| `user_confirm` | 前端→后端 | `{ type, promptId, approved }` | 用户确认响应 |
| `done` | 后端→前端 | `{ type, stats }` | AI 响应完成 |
| `error` | 后端→前端 | `{ type, content, code }` | 错误信息 |

---

*最后更新：2026-04-10（proto 验证 + 多用户架构修正）*