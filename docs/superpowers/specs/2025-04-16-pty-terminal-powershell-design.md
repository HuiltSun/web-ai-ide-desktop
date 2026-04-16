# PTY Terminal PowerShell 集成设计

## 问题描述

终端面板没有显示真正的 PowerShell 环境，用户看到的不是预期的 Windows PowerShell 终端。

## 原因分析

信号流追踪发现以下问题：

1. **前端 PTYConnection.create** 调用时没有传递 `shell` 参数
2. **后端 terminal.ts** 路由通过 `shellRegistry.createSession` 处理，但没有从 payload 中提取 `shell` 参数
3. **ShellRegistry.createSession** 调用 `ptyService.createSession` 时传递了 `payload.shell`，但前端发送的消息格式不匹配

## 解决方案

### 方案 A：最小修复 - 确保 shell 参数正确传递

#### 架构概述（已修正）

```
前端 create(tab.id, cols, rows)
  → usePTY.create(id, cols, rows, { shellType: 'local', shell: 'powershell.exe' })
  → PTYConnection.create(id, cols, rows, { shellType, shell })
  → WebSocket 消息: { 
      type: 'create', 
      sessionId: id,
      payload: { shellType: 'local', shell: 'powershell.exe', cols, rows }
    }
  → 后端 terminal.ts 解析 message.payload
  → shellRegistry.createSession(sessionId, payload)
  → ptyService.createSession(sessionId, 'local', cols, rows, env, shell)
  → LocalShellStrategy.createSession(..., shell) → pty.spawn(shell, ...)
```

#### 修改点（已完成）

##### 1. 前端 message-parser.ts ✅
**文件**: `packages/electron/src/services/pty/message-parser.ts`
- `CreateMessage` 接口添加 `shellType` 和 `shell` 字段
- `createCreateMessage` 函数改为返回 `{ type, sessionId, payload }` 格式
- `isValidMessage` 验证逻辑更新为新格式

##### 2. 前端 PTYConnection.create ✅
**文件**: `packages/electron/src/services/pty/pty-connection.ts`
- `create` 方法 options 参数添加 `shellType` 和 `shell` 支持

##### 3. 前端 usePTY.create ✅
**文件**: `packages/electron/src/hooks/usePTY.ts`
- `create` 回调类型添加 `shellType` 和 `shell` 参数
- `connect` 使用 ref 模式替代 state 依赖

##### 4. 前端 TerminalContent ✅
**文件**: `packages/electron/src/components/terminal/TerminalContent.tsx`
- 使用组件级 `useRef(false)` 替代模块级 `WeakMap`
- 合并冗余 useEffect
- create 调用传递 `{ shellType: 'local', shell: platform === 'win32' ? 'powershell.exe' : 'bash' }`
- onConnectionChange 使用 ref 模式避免无限循环

##### 5. 后端 ShellRegistry（已支持）
**文件**: `packages/server/src/services/shellRegistry.ts`
- 已正确实现 `payload.shell` 传递到 `ptyService.createSession`

##### 6. 后端 PTYService（已支持）
**文件**: `packages/server/src/services/pty.service.ts`
- `LocalShellStrategy.createSession` 已支持 `shell` 参数
- Windows 下默认值为 `powershell.exe`

#### 第二轮审查修复（已完成）

##### 1. Session ID 跟踪修复 ✅
**文件**: `packages/electron/src/hooks/usePTY.ts`
- 在 `connect` 回调中为 `PTYConnection` 添加 `onCreated` 回调，自动设置 `sessionIdRef.current`
- 在 `onStateChange` 的 `connected` 状态中消费 `pendingCreateRef`，确保连接成功后自动执行 pending create
- `write` 和 `resize` 使用 `sessionIdRef.current` 而非传入的 id

##### 2. createCreateMessage 默认值修复 ✅
**文件**: `packages/electron/src/services/pty/message-parser.ts`
- `shellType` 使用默认值 `'local'`：`shellType: options?.shellType || 'local'`

##### 3. Exit 消息字段名统一 ✅
**文件**: `packages/server/src/routes/terminal.ts`
- `exit` 消息 payload 字段从 `exitCode` 改为 `code`，匹配前端解析逻辑

##### 4. Kill 消息参数修复 ✅
**文件**: `packages/electron/src/services/pty/pty-connection.ts`
- `kill(sessionId, signal)` 参数签名修正，`createKillMessage` 调用位置正确传递 sessionId

##### 5. Retry 按钮修复 ✅
**文件**: `packages/electron/src/components/terminal/TerminalContent.tsx`
- `onClick={connect}` 改为 `onClick={() => connect(tab.id)}`，确保传递正确的 tabId

#### 依赖

- Windows 系统已安装 PowerShell（Windows 10/11 默认包含）
- `node-pty` 已正确安装并编译

#### 风险

- 低风险，仅添加参数传递
- 后端已有默认值支持
