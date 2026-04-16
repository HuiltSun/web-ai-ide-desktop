# Tasks

## Phase 1: 基础设施拆分

- [ ] Task 1: 创建 `services/pty/` 目录结构
  - [ ] SubTask 1.1: 创建目录 `packages/electron/src/services/pty/`
  - [ ] SubTask 1.2: 创建 `index.ts` 文件

- [ ] Task 2: 提取 `websocket-client.ts`
  - [ ] SubTask 2.1: 从 `pty-client.ts` 提取 WebSocket 连接逻辑
  - [ ] SubTask 2.2: 实现 `WebSocketClient` 类
  - [ ] SubTask 2.3: 确保文件 ≤ 150 行

- [ ] Task 3: 提取 `message-parser.ts`
  - [ ] SubTask 3.1: 定义 `MessageType` 枚举
  - [ ] SubTask 3.2: 实现 `parseMessage` 函数
  - [ ] SubTask 3.3: 实现类型守卫函数
  - [ ] SubTask 3.4: 确保文件 ≤ 100 行

- [ ] Task 4: 重构 `pty-connection.ts`
  - [ ] SubTask 4.1: 使用 `WebSocketClient` 和 `MessageParser`
  - [ ] SubTask 4.2: 实现 `PTYConnection` 类
  - [ ] SubTask 4.3: 确保文件 ≤ 200 行

- [ ] Task 5: 更新 `services/pty/index.ts`
  - [ ] SubTask 5.1: 导出所有公共接口
  - [ ] SubTask 5.2: 验证 TypeScript 编译通过

## Phase 2: Hook 简化

- [ ] Task 6: 重构 `hooks/usePTY.ts`
  - [ ] SubTask 6.1: 导入新的 `PTYConnection`
  - [ ] SubTask 6.2: 移除 `connectingRef` 冗余状态
  - [ ] SubTask 6.3: 简化 `connect()` 逻辑
  - [ ] SubTask 6.4: 确保文件 ≤ 150 行

## Phase 3: 组件拆分

- [ ] Task 7: 创建 `components/terminal/` 目录
  - [ ] SubTask 7.1: 创建目录 `packages/electron/src/components/terminal/`

- [ ] Task 8: 提取 `TerminalRenderer.tsx`
  - [ ] SubTask 8.1: 从 `TerminalPanel.tsx` 提取 xterm 渲染逻辑
  - [ ] SubTask 8.2: 实现纯渲染组件
  - [ ] SubTask 8.3: 确保文件 ≤ 100 行

- [ ] Task 9: 提取 `TerminalContent.tsx`
  - [ ] SubTask 9.1: 从 `TerminalPanel.tsx` 分离连接逻辑
  - [ ] SubTask 9.2: 使用 `usePTY` Hook
  - [ ] SubTask 9.3: 处理登录状态判断
  - [ ] SubTask 9.4: 确保文件 ≤ 150 行

- [ ] Task 10: 简化 `TerminalPanel.tsx`
  - [ ] SubTask 10.1: 只保留 Tab 管理逻辑
  - [ ] SubTask 10.2: 导入 `TerminalContent`
  - [ ] SubTask 10.3: 确保文件 ≤ 200 行

## Phase 4: 清理和验证

- [ ] Task 11: 删除旧文件
  - [ ] SubTask 11.1: 删除旧的 `pty-client.ts`
  - [ ] SubTask 11.2: 更新所有导入路径

- [ ] Task 12: 验证构建
  - [ ] SubTask 12.1: 运行 `npm run build`
  - [ ] SubTask 12.2: 修复 TypeScript 错误
  - [ ] SubTask 12.3: 验证终端连接功能正常

# Task Dependencies

- Task 2、3、4 依赖 Task 1
- Task 5 依赖 Task 2、3、4
- Task 6 依赖 Task 4、5
- Task 8、9、10 依赖 Task 6
- Task 11、12 依赖 Task 8、9、10
