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

- [ ] openclaude 具体版本/ commit
- [ ] 是否需要支持 MCP (Model Context Protocol)
- [ ] 是否需要保留 core/ai/gateway.ts 作为备用

---

*最后更新：2026-04-10*