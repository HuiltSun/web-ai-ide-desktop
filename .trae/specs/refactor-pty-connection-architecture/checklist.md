# Checklist

## Phase 1: 基础设施拆分

- [ ] `services/pty/` 目录创建成功
- [ ] `websocket-client.ts` ≤ 150 行，只包含纯 WebSocket 封装
- [ ] `message-parser.ts` ≤ 100 行，包含消息类型和解析函数
- [ ] `pty-connection.ts` ≤ 200 行，使用 `WebSocketClient` 和 `MessageParser`
- [ ] `index.ts` 正确导出所有公共接口
- [ ] TypeScript 编译无错误

## Phase 2: Hook 简化

- [ ] `usePTY.ts` ≤ 150 行
- [ ] 移除 `connectingRef` 冗余状态
- [ ] `connect()` 逻辑简化
- [ ] 接口类型定义清晰

## Phase 3: 组件拆分

- [ ] `components/terminal/` 目录创建成功
- [ ] `TerminalRenderer.tsx` ≤ 100 行，只处理 xterm 渲染
- [ ] `TerminalContent.tsx` ≤ 150 行，处理连接逻辑
- [ ] `TerminalPanel.tsx` ≤ 200 行，只处理 Tab 管理
- [ ] 组件间 props 传递正确

## Phase 4: 清理和验证

- [ ] 旧 `pty-client.ts` 已删除
- [ ] 所有导入路径已更新
- [ ] `npm run build` 构建成功
- [ ] 终端连接功能正常
- [ ] WebSocket 连接数量正确（登录后 1 个）

## 代码质量检查

- [ ] 每个文件职责单一
- [ ] 依赖方向清晰（UI → Hook → Service → Infrastructure）
- [ ] 无循环依赖
- [ ] 类型定义完整
