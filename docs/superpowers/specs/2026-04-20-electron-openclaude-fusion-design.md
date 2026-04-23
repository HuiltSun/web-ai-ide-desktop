# Electron 与 OpenClaude 深度融合设计文档

> 日期: 2026-04-20
> 状态: 已审核
> 方案: 方案 A — Electron + Bun Sidecar 本地桥接（混合模式）

---

## 1. 背景与目标

### 1.1 当前状态

Electron 前端与 openclaude-temp AI Agent 引擎的现有集成路径：

| 路径 | 方式 | 状态 |
|------|------|------|
| Chat 对话流 | Electron → WebSocket → Server → Bun Sidecar → gRPC | 已实现，链路长 |
| PTY 终端 | Electron → WebSocket → Server → node-pty → CLI 进程 | 已实现，仅 CLI 模式 |
| AI Provider 配置 | Electron → REST → Server → DB → 环境变量注入 | 已实现 |
| 工具调用审批 | Electron → WebSocket → Server → gRPC UserInput | 已实现 |

openclaude-temp 中尚未被 Electron 利用的能力：MCP 工具协议、Skills 技能系统、Bridge 远程控制、Agent/Sub-agent、LSP 集成、丰富的工具系统（11+ 工具）、直接 gRPC 连接。

### 1.2 核心目标

1. **直连 gRPC**：Electron 主进程直接连接 openclaude gRPC 服务，去掉 Server 中间层，降低延迟和复杂度
2. **能力透传**：将 openclaude 的 MCP、Skills、Bridge、LSP、Agent 等能力暴露给 Electron 前端使用
3. **本地文件操作**：AI Agent 能直接读写 Electron 本地文件系统（效仿 Codex 和 Solo in Web）
4. **混合模式**：支持本地模式和远程模式无缝切换

### 1.3 关键约束

- **禁止修改 openclaude-temp 包**：仅使用其提供的 gRPC 接口进行集成
- **Node.js gRPC 客户端无法直连 Bun gRPC 服务**：HTTP/2 协议不兼容（已验证），必须通过 Bun Sidecar 桥接
- **openclaude-temp 强制依赖 Bun 运行时**：大量使用 `bun:bundle` 等 Bun 专有模块
- **用户需安装 Bun 运行时**：本地模式的前置条件

---

## 2. 整体架构

### 2.1 架构图

```
┌──────────────────────────────────────────────────────────────────────┐
│                     Electron 渲染进程 (Renderer)                      │
│                                                                      │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌──────────────────┐  │
│  │ Chat UI    │ │ Editor UI  │ │ Terminal   │ │ Settings UI      │  │
│  │            │ │ (Monaco)   │ │ (xterm.js) │ │ (AI/MCP/Skills)  │  │
│  └─────┬──────┘ └─────┬──────┘ └─────┬──────┘ └───────┬──────────┘  │
│        │              │              │                 │              │
│  ┌─────┴──────────────┴──────────────┴─────────────────┴──────────┐  │
│  │                    useAgent Hook (统一 Agent 接口)               │  │
│  │   - sendMessage() / approveTool() / rejectTool() / cancel()    │  │
│  │   - onStreamData / onStreamError / onStreamEnd                 │  │
│  │   - mode: 'local' | 'remote'                                   │  │
│  └────────────────────────────┬────────────────────────────────────┘  │
│                               │ IPC (invoke / on)                     │
└───────────────────────────────┼──────────────────────────────────────┘
                                │
┌───────────────────────────────┼──────────────────────────────────────┐
│                     Electron 主进程 (Main)                            │
│                               │                                      │
│  ┌────────────────────────────┴──────────────────────────────────┐   │
│  │                    AgentOrchestrator                            │   │
│  │   - 统一入口，路由 local/remote 模式                             │   │
│  │   - 管理 Agent 会话生命周期                                      │   │
│  │   - IPC 桥接：gRPC stream ↔ renderer IPC events                │   │
│  └───────┬──────────────────────────┬────────────────────────────┘   │
│          │ local mode               │ remote mode                    │
│          ▼                          ▼                                │
│  ┌───────────────────┐    ┌────────────────────┐                     │
│  │ LocalAgentBackend │    │ RemoteAgentBackend  │                     │
│  │                   │    │                     │                     │
│  │ ┌───────────────┐ │    │  WebSocket Client   │                     │
│  │ │ GrpcSidecar   │ │    │  → Server API       │                     │
│  │ │ (Bun 子进程)   │ │    │  → Server WS        │                     │
│  │ │ stdin/stdout  │ │    │                     │                     │
│  │ │ JSON 桥接     │ │    │                     │                     │
│  │ └───────┬───────┘ │    │                     │                     │
│  │         │ gRPC    │    │                     │                     │
│  │         ▼         │    │                     │                     │
│  │ ┌───────────────┐ │    │                     │                     │
│  │ │ OpenClaude    │ │    │                     │                     │
│  │ │ gRPC Server   │ │    │                     │                     │
│  │ │ (Bun 子进程)   │ │    │                     │                     │
│  │ └───────────────┘ │    │                     │                     │
│  └───────────────────┘    └────────────────────┘                     │
│                                                                      │
│  ┌───────────────────┐ ┌──────────────────┐ ┌────────────────────┐   │
│  │ ProcessManager    │ │ McpConfigManager │ │ SkillsManager      │   │
│  │ (进程生命周期)     │ │ (MCP 配置管理)   │ │ (Skills 管理)      │   │
│  └───────────────────┘ └──────────────────┘ └────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

### 2.2 模块职责

| 模块 | 位置 | 职责 |
|------|------|------|
| **useAgent Hook** | 渲染进程 | 统一的 Agent 交互接口，替代现有 useChat，支持 local/remote 模式切换 |
| **AgentOrchestrator** | 主进程 | 统一入口，路由 local/remote，管理会话生命周期，IPC 桥接 |
| **LocalAgentBackend** | 主进程 | 本地模式：管理 Bun Sidecar + openclaude gRPC 进程，stdin/stdout JSON 桥接 |
| **RemoteAgentBackend** | 主进程 | 远程模式：复用现有 WebSocket → Server 通信路径 |
| **ProcessManager** | 主进程 | openclaude 子进程的创建/销毁/端口分配/超时清理 |
| **McpConfigManager** | 主进程 | 读写 `.mcp.json` 配置文件，管理 MCP 服务器生命周期 |
| **SkillsManager** | 主进程 | 管理 `.claude/skills/` 目录，技能发现和注册 |

### 2.3 关键设计决策

1. **双后端策略**：`LocalAgentBackend` 和 `RemoteAgentBackend` 实现相同的 `AgentBackend` 接口，`AgentOrchestrator` 根据模式路由
2. **IPC 流式传输**：使用 `webContents.send` 推送 gRPC 流式数据到渲染进程，`ipcRenderer.invoke` 发送用户操作
3. **配置文件驱动**：MCP 和 Skills 通过 openclaude 原生的配置文件格式管理，无需修改 openclaude-temp 代码
4. **进程隔离**：openclaude gRPC server 和 Bun sidecar 都作为独立子进程运行，崩溃不影响 Electron

---

## 3. LocalAgentBackend — gRPC 通信与进程管理

### 3.1 进程管理架构

```
ProcessManager
├── 端口分配: OS 动态分配（bind port 0）
├── 进程表: Map<sessionId, ProcessEntry>
│
│  ProcessEntry {
│    sessionId: string
│    grpcServerProcess: ChildProcess  // openclaude
│    sidecarProcess: ChildProcess     // Bun sidecar
│    grpcPort: number
│    workingDirectory: string
│    provider: AIProvider
│    createdAt: number
│    lastActivityAt: number
│  }
│
├── 预热池: ProcessWarmPool (2 个预创建进程)
└── 超时清理: 30 分钟无活动自动销毁
```

### 3.2 启动流程（原子操作）

```
1. 分配端口（OS 动态分配，bind port 0）
2. spawn openclaude gRPC server
   bun run dev:grpc --port {port}
   env: { GRPC_PORT, GRPC_HOST, API_KEY, MODEL, ... }
3. 渐进式 gRPC 就绪探测（替代 800ms 硬延迟）
   - 阶段 1: TCP 端口可达（间隔 100ms）
   - 阶段 2: gRPC HTTP/2 握手验证（间隔 200ms）
   - 阶段 3: 额外 100ms 让 SETTINGS 帧完全交换
   - 总超时: 10s
4. spawn Bun sidecar
   bun run sidecar.ts --port {port}
5. 等待 sidecar stdin 输出 { "t": "r" } (ready)
6. 注册到进程表（全部成功才注册）
```

任何步骤失败，try/finally 原子清理已创建的资源（kill 子进程、释放端口）。

### 3.3 gRPC 通信协议（复用 Server 的 Sidecar 协议）

**Sidecar → 主进程（stdout JSON 行）：**

| 消息 | 格式 | 说明 |
|------|------|------|
| Ready | `{ "t": "r" }` | Sidecar 已连接 gRPC 服务 |
| Data | `{ "t": "d", "m": ServerMessage }` | gRPC ServerMessage |
| Error | `{ "t": "e", "c"?: string, "m": string }` | 错误 |
| End | `{ "t": "n" }` | 流结束 |

**主进程 → Sidecar（stdin JSON 行）：**

| 消息 | 格式 | 说明 |
|------|------|------|
| Write | `{ "op": "w", "msg": ClientMessage }` | 发送消息/审批/输入 |
| Cancel | `{ "op": "x" }` | 中断当前生成 |

### 3.4 ClientMessage 构造

```typescript
// 发送用户消息
{
  request: {
    message: "用户输入",
    working_directory: "C:/Users/project",
    model: "claude-sonnet-4-20250514",
    session_id: "local-xxx"
  }
}

// 工具审批
{
  input: {
    prompt_id: "tool-xxx",
    reply: "yes"  // 或 "no"
  }
}

// 中断
{
  cancel: {
    reason: "user_cancelled"
  }
}
```

### 3.5 ServerMessage 处理与 IPC 转发

主进程解析 sidecar stdout，将 gRPC ServerMessage 转换为前端 `AgentStreamEvent`，通过 `webContents.send('agent:stream', event)` 推送到渲染进程：

| gRPC ServerMessage | 前端 AgentStreamEvent |
|---|---|
| `text_chunk` | `{ type: 'text', content, sessionId }` |
| `tool_start` | `{ type: 'tool_call', toolName, arguments, toolCallId, source, sessionId }` |
| `action_required` | `{ type: 'action_required', promptId, question, actionType, sessionId }` |
| `tool_result` | `{ type: 'tool_result', toolName, output, isError, toolCallId, sessionId }` |
| `done` | `{ type: 'done', fullText, promptTokens, completionTokens, sessionId }` |
| `error` | `{ type: 'error', message, code, sessionId }` |

### 3.6 进程 crash 响应

- 注册 `exit` 监听：非零退出码触发 `agent:crashed` IPC 事件
- 注册 `stderr` 监控：检测 `FATAL`/`panic`/`EADDRINUSE` 等关键词，发送 `agent:warning` 预警
- crash 后自动清理关联进程，通知渲染进程显示错误和重连选项

### 3.7 冷启动预热池

- 应用启动后后台预热 2 个 openclaude 进程
- `acquire()` 优先从池中取进程，更新配置（API Key、Model 等）后使用
- 池为空时直接创建，同时异步补充池

### 3.8 Bun 运行时检测

主进程启动时检测 Bun 运行时可用性：
- 检查 `BUN_PATH` 环境变量
- 检查 `~/.bun/bin/bun`（Windows: `bun.cmd`）
- 检查 PATH 中的 `bun`
- 不可用时通过 IPC 通知渲染进程显示安装引导

---

## 4. MCP 工具协议集成

### 4.1 设计原则

openclaude-temp 已内置完整的 MCP 客户端支持，Electron **不需要实现 MCP 客户端**，而是通过配置文件驱动 openclaude 自动加载 MCP 服务器。

### 4.2 配置 merge 规则明确化

```typescript
interface McpConfigLayer {
  level: 'enterprise' | 'global' | 'project' | 'local';
  path: string;
  config: McpServerMap;
  priority: number;  // 1(最高) ~ 4(最低)
}
```

Merge 规则（与 openclaude 内部一致）：
1. 同名服务器：高优先级层覆盖低优先级层
2. 不同名服务器：合并所有层的服务器
3. 企业策略独占：enterprise 层可设置 `allowedMcpServers`/`deniedMcpServers` 策略
4. disabled 标记：任何层可将服务器标记为 disabled，低优先级无法覆盖

### 4.3 Schema 校验

使用 Zod 定义 MCP 配置的严格 schema：

```typescript
const McpServerConfigSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('stdio'), command: z.string().min(1), args: z.array(z.string()).default([]), env: z.record(z.string()).default({}), disabled: z.boolean().default(false) }),
  z.object({ type: z.literal('sse'), url: z.string().url(), headers: z.record(z.string()).default({}), disabled: z.boolean().default(false) }),
  z.object({ type: z.literal('http'), url: z.string().url(), headers: z.record(z.string()).default({}), disabled: z.boolean().default(false) }),
  z.object({ type: z.literal('ws'), url: z.string().url(), disabled: z.boolean().default(false) }),
  z.object({ command: z.string().min(1), args: z.array(z.string()).default([]), env: z.record(z.string()).default({}), disabled: z.boolean().default(false) }),  // 默认 stdio
]);

const McpConfigFileSchema = z.object({
  mcpServers: z.record(McpServerConfigSchema).default({}),
});
```

校验失败时提供友好的路径级错误信息。

### 4.4 MCP 健康状态独立监控

独立于 gRPC 会话的 `McpHealthMonitor`：

- 每个已注册的 MCP 服务器有独立的健康检查（30 秒间隔）
- stdio 类型：spawn 临时子进程，发送 MCP `initialize` + `tools/list` 请求
- 远程类型（http/sse/ws）：发送 HTTP 请求探测
- 状态推送：通过 `mcp:status` IPC 事件推送到渲染进程
- 状态类型：`connecting` | `connected` | `disconnected` | `error`

### 4.5 MCP 与 gRPC 会话的集成流程

```
1. 用户在 Settings MCP Tab 添加 MCP 服务器
2. McpConfigManager 写入 .mcp.json 配置文件
3. 用户发起 Chat（创建/复用 Agent 会话）
4. LocalAgentBackend 启动 openclaude gRPC server
   → openclaude 自动读取 .mcp.json
   → 连接 MCP 服务器，获取工具列表
   → 将 MCP 工具注入 QueryEngine
5. AI Agent 可使用 MCP 工具（通过 gRPC tool_start/tool_result 流式返回）
6. 前端 ToolCallCard 显示 MCP 工具调用（与内置工具一致）
```

### 4.6 Session versioning（解决 MCP 配置变更需重启问题）

```typescript
interface AgentSession {
  id: string;
  version: number;
  configHash: string;
  mcpConfigSnapshot: McpServerMap;
}
```

- 配置变更检测：对比当前配置 hash 与会话启动时的 hash
- 配置漂移提示：`ConfigDriftBanner` 组件显示变更详情
- 优雅重启：保留消息历史，仅重启 openclaude 进程，通知渲染进程切换 sessionId

### 4.7 testConnection 升级为 capability 探测

```typescript
interface McpCapabilityReport {
  connected: boolean;
  protocolVersion: string;
  serverInfo: { name: string; version: string };
  capabilities: {
    tools?: { listChanged?: boolean };
    resources?: { subscribe?: boolean; listChanged?: boolean };
    prompts?: { listChanged?: boolean };
    logging?: {};
    sampling?: {};
  };
  tools: Array<{ name: string; description: string; inputSchema: object }>;
  resources?: Array<{ uri: string; name: string; description?: string; mimeType?: string }>;
  prompts?: Array<{ name: string; description?: string; arguments?: Array<{ name: string; required?: boolean }> }>;
  latency: number;
  error?: string;
}
```

完整探测：`initialize` + `tools/list` + `resources/list` + `prompts/list`，并行执行。

### 4.8 tool source 不靠字符串解析

由于不能修改 openclaude-temp 的 gRPC 服务端，tool source 信息需要通过 **sidecar 脚本的解析层** 注入。sidecar 脚本（位于 `packages/server/scripts/agent-grpc-sidecar.ts`，可修改）在转发 `tool_start` 消息时，根据 QueryEngine 的工具注册表推断 source：

**实现策略：sidecar 启动时加载工具注册表**

1. sidecar 启动时，通过 gRPC `Chat` 流的初始交互获取可用工具列表
2. sidecar 维护一个 `toolName → source` 映射表：
   - 内置工具（BashTool, FileReadTool 等）→ `builtin`
   - MCP 工具（格式 `mcp__{server}__{tool}`）→ `{ type: 'mcp', serverName }`
   - Skill 工具 → `{ type: 'skill', skillName }`
3. 转发 `tool_start` 时附加 `_source` 字段

```typescript
// sidecar 端增强
interface EnhancedToolCallStart {
  tool_name: string;
  arguments_json: string;
  tool_use_id: string;
  _source: {
    type: 'builtin' | 'mcp' | 'skill' | 'agent';
    serverName?: string;
    skillName?: string;
    agentName?: string;
  };
}

// 工具名 → source 映射（sidecar 维护）
function resolveToolSource(toolName: string, toolRegistry: ToolRegistry): ToolSource {
  if (toolRegistry.builtinTools.has(toolName)) return { type: 'builtin' };
  const mcpMatch = toolName.match(/^mcp__(.+?)__(.+)$/);
  if (mcpMatch) return { type: 'mcp', serverName: mcpMatch[1] };
  if (toolRegistry.skillTools.has(toolName)) return { type: 'skill', skillName: toolName };
  return { type: 'builtin' };  // fallback
}
```

前端 `ToolCallCard` 直接使用 `source.type`，不解析 `tool_name` 字符串。

### 4.9 进阶优化（后期实现）

- **安全策略层**：工具白名单/黑名单、自动批准规则、危险操作标记
- **UI 工具分组 + 调试模式**：按来源分组显示工具、完整参数/响应/时序信息

---

## 5. Skills 技能系统集成

### 5.1 设计原则

与 MCP 类似，Skills 通过配置文件驱动 openclaude 自动加载，Electron 负责 UI 管理和配置文件读写。

### 5.2 Skills 管理架构

```
SkillsManager
├── 目录: {project}/.claude/skills/
│   ├── debug/SKILL.md
│   ├── simplify/SKILL.md
│   └── custom/my-skill/SKILL.md
│
├── 方法:
│   - listSkills(projectPath) → SkillInfo[]
│   - getSkillDetail(projectPath, name) → SkillDetail
│   - createSkill(projectPath, skill) → void
│   - deleteSkill(projectPath, name) → void
│   - toggleSkill(projectPath, name, enabled) → void
```

### 5.3 SKILL.md 格式

```markdown
---
name: debug
description: 调试代码问题
aliases: [dbg, fix]
whenToUse: 当代码出现错误或异常行为时使用
argumentHint: <error-message>
allowedTools: [BashTool, FileReadTool, FileEditTool, GrepTool]
---

你是一个专业的代码调试专家。请根据用户提供的错误信息：

1. 分析错误原因
2. 定位问题代码
3. 提供修复方案
4. 验证修复效果
```

### 5.4 Skills 与 gRPC 会话的集成

```
1. 用户创建/编辑 SKILL.md 文件
2. SkillsManager 写入 .claude/skills/ 目录
3. 用户发起 Chat
4. openclaude gRPC server 启动时自动扫描 .claude/skills/ 目录
   → 解析 SKILL.md frontmatter
   → 注册为 slash command
5. 用户在 Chat 中输入 /debug <error> 触发技能
   → 通过 gRPC request.message 发送
   → openclaude 识别 slash command 并执行技能 prompt
6. 技能执行过程中的工具调用通过 gRPC 流式返回
```

---

## 6. useAgent Hook 与前端集成

### 6.1 useAgent Hook 接口

```typescript
interface UseAgentOptions {
  sessionId: string | null;
  mode: 'local' | 'remote';
  workingDirectory?: string;
}

interface UseAgentReturn {
  messages: AgentMessage[];
  streamingContent: string;
  isGenerating: boolean;
  generatingElapsed: number;
  isConnected: boolean;
  errorMessage: string | null;
  
  sendMessage: (content: string) => Promise<void>;
  approveTool: (toolCallId: string) => Promise<void>;
  rejectTool: (toolCallId: string) => Promise<void>;
  cancel: () => void;
  clearError: () => void;
  
  pendingToolCall: ToolCall | null;
  
  switchMode: (mode: 'local' | 'remote') => void;
  currentMode: 'local' | 'remote';
  
  configDrift: ConfigDriftResult | null;
  restartWithNewConfig: () => Promise<void>;
}
```

### 6.2 AgentMessage 统一类型

```typescript
interface AgentMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  toolCalls?: ToolCall[];
  source?: 'local' | 'remote';
}

interface ToolCall {
  id: string;
  name: string;
  arguments: string;
  result?: string;
  isError?: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'executing' | 'completed' | 'failed';
  source?: {
    type: 'builtin' | 'mcp' | 'skill' | 'agent';
    serverName?: string;
    skillName?: string;
  };
}
```

### 6.3 与现有 useChat 的兼容策略

1. 保留 useChat Hook（remote 模式下内部委托给 RemoteAgentBackend）
2. 新增 useAgent Hook（统一接口，支持 local/remote 切换）
3. Chat 组件逐步从 useChat 迁移到 useAgent
4. useChat 标记为 `@deprecated`，保留一个版本后移除

---

## 7. 本地文件操作与混合模式路由

### 7.1 本地文件操作实现

openclaude-temp 内置了 `FileReadTool`、`FileEditTool`、`GrepTool`、`GlobTool`、`BashTool` 等文件操作工具。在本地模式下，这些工具直接操作用户本地文件系统，无需额外实现文件操作层。

通过 `working_directory` 参数控制 Agent 的工作目录：

```typescript
const clientMessage: ClientMessage = {
  request: {
    message: config.initialMessage,
    working_directory: config.workingDirectory,  // 项目根目录
    model: config.model,
    session_id: sessionId,
  }
};
```

### 7.2 文件操作安全边界

```typescript
interface FileOperationPolicy {
  allowedDirectories: string[];     // Agent 只能操作这些目录下的文件
  deniedPatterns: string[];         // 禁止操作的路径模式（如 ~/.ssh/**, **/.env）
  maxFileSize: number;              // 文件大小限制（默认 10MB）
  allowBash: boolean;               // 是否允许 Bash 命令
  deniedCommands: string[];         // Bash 命令黑名单
}
```

通过环境变量注入策略到 openclaude gRPC 进程。

### 7.3 混合模式路由

```typescript
class AgentOrchestrator {
  determineMode(context: AgentContext): 'local' | 'remote' {
    if (context.userPreference) return context.userPreference;
    if (context.projectPath && isLocalPath(context.projectPath)) {
      if (this.localBackend.isBunAvailable()) return 'local';
    }
    return 'remote';
  }
}
```

模式切换流程：
1. 获取当前会话的消息历史
2. 销毁旧后端会话
3. 在新后端创建会话（恢复消息历史）
4. 更新路由表
5. 通知渲染进程切换 sessionId

### 7.4 完整数据流对比

**本地模式：**
```
用户输入 → useAgent.sendMessage()
  → ipcRenderer.invoke('agent:send')
  → AgentOrchestrator → LocalAgentBackend
  → sidecar stdin: { "op": "w", "msg": ClientMessage }
  → gRPC → openclaude QueryEngine → LLM
  → gRPC ServerMessage → sidecar stdout: { "t": "d", "m": ... }
  → AgentOrchestrator → webContents.send('agent:stream')
  → ipcRenderer.on → useAgent 状态更新 → UI 渲染
```

**远程模式：**
```
用户输入 → useAgent.sendMessage()
  → ipcRenderer.invoke('agent:send')
  → AgentOrchestrator → RemoteAgentBackend
  → WebSocketService → Server → Bun Sidecar → gRPC
  → gRPC Response → Server → WebSocket
  → webContents.send('agent:stream')
  → ipcRenderer.on → useAgent 状态更新 → UI 渲染
```

---

## 8. IPC 接口设计

### 8.1 新增 IPC 频道

| 频道 | 方向 | 用途 |
|------|------|------|
| `agent:createSession` | 渲染→主 | 创建 Agent 会话 |
| `agent:destroySession` | 渲染→主 | 销毁 Agent 会话 |
| `agent:send` | 渲染→主 | 发送消息 |
| `agent:approveTool` | 渲染→主 | 批准工具调用 |
| `agent:rejectTool` | 渲染→主 | 拒绝工具调用 |
| `agent:cancel` | 渲染→主 | 中断生成 |
| `agent:switchMode` | 渲染→主 | 切换 local/remote 模式 |
| `agent:stream` | 主→渲染 | 流式数据推送 |
| `agent:error` | 主→渲染 | 错误通知 |
| `agent:end` | 主→渲染 | 流结束通知 |
| `agent:crashed` | 主→渲染 | 进程崩溃通知 |
| `agent:warning` | 主→渲染 | 进程预警 |
| `agent:modeSwitched` | 主→渲染 | 模式切换完成 |
| `agent:restarted` | 主→渲染 | 会话重启完成 |
| `bun:required` | 主→渲染 | Bun 运行时缺失 |
| `mcp:list` | 渲染→主 | 列出 MCP 服务器 |
| `mcp:addServer` | 渲染→主 | 添加 MCP 服务器 |
| `mcp:removeServer` | 渲染→主 | 删除 MCP 服务器 |
| `mcp:toggleServer` | 渲染→主 | 启用/禁用 MCP 服务器 |
| `mcp:probeCapabilities` | 渲染→主 | 探测 MCP 服务器能力 |
| `mcp:status` | 主→渲染 | MCP 健康状态推送 |
| `skills:list` | 渲染→主 | 列出技能 |
| `skills:getDetail` | 渲染→主 | 获取技能详情 |
| `skills:create` | 渲染→主 | 创建技能 |
| `skills:delete` | 渲染→主 | 删除技能 |
| `skills:toggle` | 渲染→主 | 启用/禁用技能 |

### 8.2 preload.ts 新增接口

```typescript
contextBridge.exposeInMainWorld('electronAPI', {
  // ... 现有接口保留
  
  agent: {
    createSession: (config) => ipcRenderer.invoke('agent:createSession', config),
    destroySession: (sessionId) => ipcRenderer.invoke('agent:destroySession', sessionId),
    sendMessage: (sessionId, content) => ipcRenderer.invoke('agent:send', { sessionId, content }),
    approveTool: (sessionId, toolCallId) => ipcRenderer.invoke('agent:approveTool', { sessionId, toolCallId }),
    rejectTool: (sessionId, toolCallId) => ipcRenderer.invoke('agent:rejectTool', { sessionId, toolCallId }),
    cancel: (sessionId) => ipcRenderer.invoke('agent:cancel', sessionId),
    switchMode: (sessionId, mode) => ipcRenderer.invoke('agent:switchMode', { sessionId, mode }),
    onStreamData: (callback) => { /* ipcRenderer.on('agent:stream', ...) */ },
    onError: (callback) => { /* ipcRenderer.on('agent:error', ...) */ },
    onEnd: (callback) => { /* ipcRenderer.on('agent:end', ...) */ },
    onCrashed: (callback) => { /* ipcRenderer.on('agent:crashed', ...) */ },
    onWarning: (callback) => { /* ipcRenderer.on('agent:warning', ...) */ },
    onModeSwitched: (callback) => { /* ipcRenderer.on('agent:modeSwitched', ...) */ },
    onRestarted: (callback) => { /* ipcRenderer.on('agent:restarted', ...) */ },
  },
  
  mcp: {
    list: (projectPath) => ipcRenderer.invoke('mcp:list', projectPath),
    addServer: (projectPath, config) => ipcRenderer.invoke('mcp:addServer', projectPath, config),
    removeServer: (projectPath, name) => ipcRenderer.invoke('mcp:removeServer', projectPath, name),
    toggleServer: (projectPath, name, enabled) => ipcRenderer.invoke('mcp:toggleServer', projectPath, name, enabled),
    probeCapabilities: (config) => ipcRenderer.invoke('mcp:probeCapabilities', config),
    onStatus: (callback) => { /* ipcRenderer.on('mcp:status', ...) */ },
  },
  
  skills: {
    list: (projectPath) => ipcRenderer.invoke('skills:list', projectPath),
    getDetail: (projectPath, name) => ipcRenderer.invoke('skills:getDetail', projectPath, name),
    create: (projectPath, skill) => ipcRenderer.invoke('skills:create', projectPath, skill),
    delete: (projectPath, name) => ipcRenderer.invoke('skills:delete', projectPath, name),
    toggle: (projectPath, name, enabled) => ipcRenderer.invoke('skills:toggle', projectPath, name, enabled),
  },
});
```

---

## 9. i18n 国际化

所有新增 UI 文本必须使用 i18n 翻译，同步添加中英文翻译到 `packages/electron/src/i18n/translations.ts`。

新增翻译键：

| 键 | 中文 | 英文 |
|---|---|---|
| `agent.mode.local` | 本地模式 | Local Mode |
| `agent.mode.remote` | 远程模式 | Remote Mode |
| `agent.mode.switch` | 切换模式 | Switch Mode |
| `agent.crashed.grpc` | AI Agent 服务意外退出 | AI Agent service crashed |
| `agent.crashed.sidecar` | AI Agent 通信桥意外断开 | AI Agent bridge disconnected |
| `agent.config.drift` | MCP 配置已变更，需要重启 Agent 会话以应用 | MCP config changed, restart session to apply |
| `agent.config.restart` | 重启应用配置 | Restart with new config |
| `mcp.status.connecting` | 连接中 | Connecting |
| `mcp.status.connected` | 已连接 | Connected |
| `mcp.status.disconnected` | 已断开 | Disconnected |
| `mcp.status.error` | 连接错误 | Connection error |
| `mcp.addServer` | 添加 MCP 服务器 | Add MCP Server |
| `mcp.removeServer` | 删除 MCP 服务器 | Remove MCP Server |
| `mcp.probeCapabilities` | 探测能力 | Probe Capabilities |
| `skills.create` | 创建技能 | Create Skill |
| `skills.delete` | 删除技能 | Delete Skill |
| `bun.required` | 本地 AI 模式需要安装 Bun 运行时 | Bun runtime is required for local AI mode |
| `bun.installGuide` | 安装引导 | Installation Guide |
| `tool.source.builtin` | 内置工具 | Built-in Tool |
| `tool.source.mcp` | MCP: {name} | MCP: {name} |
| `tool.source.skill` | 技能: {name} | Skill: {name} |
| `tool.source.agent` | 代理: {name} | Agent: {name} |

---

## 10. 风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| Bun 运行时在 Windows 上不稳定 | 本地模式不可用 | 检测 Bun 可用性，不可用时自动回退到远程模式 |
| Node.js gRPC 与 Bun gRPC HTTP/2 不兼容 | 无法直连 gRPC | 使用 Bun Sidecar 桥接（已验证方案） |
| openclaude 进程 crash | Agent 会话中断 | exit 监听 + 自动清理 + 渲染进程通知 + 重连选项 |
| MCP 配置变更需重启 Agent | 用户体验中断 | Session versioning + 配置漂移检测 + 优雅重启 |
| 冷启动延迟 | 用户等待时间长 | 预热池（2 个预创建进程） |
| 端口冲突 | 进程启动失败 | OS 动态端口分配（bind port 0） |
| 安全风险（Agent 操作本地文件） | 数据丢失/泄露 | FileOperationPolicy 安全边界 + 工具审批流程 |
