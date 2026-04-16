# 修复登录后异常 WebSocket 终端连接问题

## Why

用户登录后未进行任何操作，但日志显示 15 个并发的 `/ws/terminal` WebSocket 连接被创建。这表明前端组件在登录后存在异常的重复渲染或连接泄漏问题。

## What Changes

- 排查 `TerminalPanel` 组件的连接创建逻辑
- 修复 `usePTY` hook 中的连接去重机制
- 确保 WebSocket 连接在组件卸载时正确关闭
- 添加连接状态管理防止重复连接

## Impact

- Affected code:
  - `electron/src/components/TerminalPanel.tsx` — 多标签页连接管理
  - `electron/src/hooks/usePTY.ts` — PTY 连接状态管理
  - `electron/src/services/pty-client.ts` — WebSocket 客户端

---

## ADDED Requirements

### Requirement: 防止重复 WebSocket 连接

系统应确保每个 Terminal 标签页只创建一个 WebSocket 连接，并且在连接前检查是否已存在活跃连接。

#### Scenario: 防止重复连接
- **WHEN** 用户登录后 TerminalPanel 渲染
- **THEN** 每个标签页应该只创建一个 `/ws/terminal` 连接
- **AND** 不应有 15+ 个并发连接

#### Scenario: 连接复用
- **WHEN** `connect()` 被调用时已存在活跃连接
- **THEN** 不应创建新连接，直接返回

### Requirement: 组件卸载时关闭连接

系统应在组件卸载时正确关闭 WebSocket 连接，避免连接泄漏。

#### Scenario: 组件卸载清理
- **WHEN** TerminalPanel 或 usePTY 组件卸载
- **THEN** WebSocket 连接应被正确关闭
- **AND** `clientRef.current` 应被置为 null

---

## MODIFIED Requirements

### Requirement: TerminalPanel 标签页初始化

**修改原因**: 当前实现可能在初始化时创建过多标签页或重复调用 connect()

- 每个 TerminalPanel 实例初始化时应只有 1 个默认标签页
- `addTab()` 应检查是否已存在活跃连接再创建新 PTYClient

---

## REMOVED Requirements

无

---

## 排查方向

### 1. usePTY connect() 函数
```typescript
const connect = useCallback(() => {
  if (clientRef.current?.isConnected) {
    return;  // 已有连接则返回
  }
  // 创建新连接...
}, []);
```

### 2. TerminalPanel useEffect 依赖
```typescript
useEffect(() => {
  if (tabs.length === 0) {
    addTab();  // 确认只调用一次
  }
}, [tabs.length, addTab]);
```

### 3. PTYClient connect() 幂等性
确保多次调用 connect() 不会创建多个 WebSocket

---

## 验证标准

- [ ] 登录后只创建 1 个 `/ws/terminal` 连接（默认 1 个标签页）
- [ ] 多次调用 connect() 不会创建重复连接
- [ ] 组件卸载后连接正确关闭
- [ ] 创建多个标签页时，每个标签页有独立的连接但数量合理
