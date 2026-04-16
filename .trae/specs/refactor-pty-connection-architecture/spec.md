# PTY 终端连接重构设计

## Why

当前 PTY 终端连接相关代码存在以下问题：
1. 单文件职责混杂，超出 300 行阈值
2. 状态管理冗余（`isConnected`、`isConnecting`、`connectingRef` 语义重复）
3. UI 组件与业务逻辑耦合

## What Changes

### 文件拆分方案

**现有文件：**
- `packages/electron/src/services/pty-client.ts` (149 行)
- `packages/electron/src/hooks/usePTY.ts` (112 行)
- `packages/electron/src/components/TerminalPanel.tsx` (360+ 行)

**重构后文件结构：**
```
packages/electron/src/
├── services/
│   ├── pty/
│   │   ├── websocket-client.ts      # 纯 WebSocket 封装 (≤150 行)
│   │   ├── message-parser.ts        # 消息解析 (≤100 行)
│   │   └── pty-connection.ts        # PTY 连接管理 (≤200 行)
│   │   └── index.ts                 # 统一导出
├── hooks/
│   └── usePTY.ts                    # 简化为状态管理 (≤150 行)
├── components/
│   └── terminal/
│       ├── TerminalPanel.tsx        # 只处理 Tab 管理 (≤200 行)
│       ├── TerminalContent.tsx      # 处理连接逻辑 (≤150 行)
│       └── TerminalRenderer.tsx     # 处理 xterm 渲染 (≤100 行)
```

### 职责划分

#### 1. `services/pty/websocket-client.ts`
**职责**：纯 WebSocket 连接管理，不包含业务逻辑
- 创建 WebSocket 连接
- 连接状态管理（connecting、connected、closed）
- 发送原始消息
- 监听 WebSocket 事件

**暴露接口**：
```typescript
export class WebSocketClient {
  constructor(url: string)
  connect(): Promise<void>
  send(data: string): void
  onMessage(callback: (data: string) => void): () => void
  onClose(callback: () => void): () => void
  onError(callback: (error: Error) => void): () => void
  close(): void
  get readyState(): number
}
```

#### 2. `services/pty/message-parser.ts`
**职责**：消息格式解析和验证
- 解析 WebSocket 消息
- 类型守卫和验证
- 消息类型枚举

**暴露接口**：
```typescript
export enum MessageType {
  CREATED = 'created',
  OUTPUT = 'output',
  EXIT = 'exit',
  ERROR = 'error',
}

export interface TerminalMessage {
  type: MessageType
  sessionId?: string
  payload?: any
}

export function parseMessage(data: string): TerminalMessage
export function isCreatedMessage(msg: TerminalMessage): msg is CreatedMessage
// ... 其他类型守卫
```

#### 3. `services/pty/pty-connection.ts`
**职责**：PTY 连接业务逻辑
- 使用 `WebSocketClient` 建立连接
- 使用 `MessageParser` 解析消息
- 管理 session ID
- 提供高层接口（write、resize、kill）

**暴露接口**：
```typescript
export interface PTYConnectionOptions {
  cols?: number
  rows?: number
  shellType?: 'local' | 'openclaude'
  shell?: string
}

export class PTYConnection {
  constructor(options: PTYConnectionOptions)
  connect(): Promise<void>
  write(data: string): void
  resize(cols: number, rows: number): void
  kill(): void
  onOutput(callback: (data: string) => void): () => void
  onExit(callback: (code: number) => void): () => void
  onError(callback: (error: string) => void): () => void
  disconnect(): void
  get isConnected(): boolean
  get sessionId(): string | null
}
```

#### 4. `services/pty/index.ts`
**职责**：统一导出
```typescript
export { WebSocketClient } from './websocket-client'
export { MessageType, parseMessage } from './message-parser'
export { PTYConnection } from './pty-connection'
export type { TerminalMessage, PTYConnectionOptions } from './message-parser'
```

#### 5. `hooks/usePTY.ts`
**职责**：React Hook，管理连接状态
- 使用 `PTYConnection` 进行连接
- 管理 React 状态（isConnected、isConnecting、error）
- 提供回调注册接口

**简化后接口**：
```typescript
export interface UsePTYOptions {
  cols?: number
  rows?: number
  shellType?: 'local' | 'openclaude'
  shell?: string
}

export interface UsePTYReturn {
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  connect: () => void
  disconnect: () => void
  write: (data: string) => void
  resize: (cols: number, rows: number) => void
  onOutput: (callback: (data: string) => void) => () => void
}

export function usePTY(options: UsePTYOptions): UsePTYReturn
```

#### 6. `components/terminal/TerminalPanel.tsx`
**职责**：只处理 Tab 管理和 UI 布局
- Tab 的添加、删除、切换
- 传递 props 给 `TerminalContent`
- 处理最大化/最小化

#### 7. `components/terminal/TerminalContent.tsx`
**职责**：连接逻辑和状态判断
- 使用 `usePTY` Hook
- 判断登录状态
- 渲染 `TerminalRenderer` 或登录提示

#### 8. `components/terminal/TerminalRenderer.tsx`
**职责**：xterm 终端渲染
- 初始化 xterm
- 绑定数据流
- 处理 resize

---

## 设计原则

### 1. 单一职责
每个文件只负责一个功能域：
- WebSocket 连接 → `websocket-client.ts`
- 消息解析 → `message-parser.ts`
- 业务逻辑 → `pty-connection.ts`
- React 状态 → `usePTY.ts`
- UI 渲染 → `Terminal*.tsx`

### 2. 依赖方向
```
TerminalPanel.tsx
    ↓
TerminalContent.tsx
    ↓
usePTY.ts (Hook)
    ↓
PTYConnection (Service)
    ↓
WebSocketClient + MessageParser (Infrastructure)
```

### 3. 接口隔离
- 高层模块不依赖低层模块的实现细节
- `usePTY` 只依赖 `PTYConnection` 的公开接口
- `PTYConnection` 组合使用 `WebSocketClient` 和 `MessageParser`

---

## 重构步骤

### Phase 1: 基础设施拆分
1. 创建 `services/pty/` 目录
2. 提取 `websocket-client.ts`
3. 提取 `message-parser.ts`
4. 重构 `pty-connection.ts`
5. 创建 `index.ts` 统一导出

### Phase 2: Hook 简化
1. 修改 `usePTY.ts` 使用新的 `PTYConnection`
2. 移除冗余状态（`connectingRef`）
3. 简化状态管理逻辑

### Phase 3: 组件拆分
1. 创建 `components/terminal/` 目录
2. 提取 `TerminalRenderer.tsx`
3. 提取 `TerminalContent.tsx`
4. 简化 `TerminalPanel.tsx`

### Phase 4: 清理和验证
1. 删除旧的 `pty-client.ts`
2. 更新所有导入路径
3. 运行构建和测试
4. 验证功能正常

---

## 行数限制检查清单

- [ ] `websocket-client.ts` ≤ 150 行
- [ ] `message-parser.ts` ≤ 100 行
- [ ] `pty-connection.ts` ≤ 200 行
- [ ] `usePTY.ts` ≤ 150 行
- [ ] `TerminalPanel.tsx` ≤ 200 行
- [ ] `TerminalContent.tsx` ≤ 150 行
- [ ] `TerminalRenderer.tsx` ≤ 100 行

---

## 风险和缓解

**风险 1**: 文件拆分导致导入路径复杂
- **缓解**: 使用 `index.ts` 统一导出，保持导入简洁

**风险 2**: 重构引入 bug
- **缓解**: 小步提交，每个 Phase 单独验证

**风险 3**: 性能开销
- **缓解**: 拆分不改变运行时行为，只是代码组织方式变化
