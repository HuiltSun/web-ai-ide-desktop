# 聊天功能 P0 关键修复 设计文档

## 目标

修复聊天模块的 4 项 P0 级问题：消息列表 key 不稳定、错误事件用户无感知、硬编码 i18n 文本、WebSocket 无自动重连。

## 架构

4 项修复各自独立，按依赖顺序实施。消息 ID 修复是基础（其他组件依赖稳定的消息 key），i18n 修复最简单可并行，错误展示和 WebSocket 重连互不依赖。所有修改限定在 `packages/electron/src` 目录内。

## 技术栈

- React 18 + TypeScript
- 现有 WebSocket 服务（`services/websocket.ts`）
- 现有 i18n 体系（`i18n/zh.translations.ts` + `i18n/en.translations.ts`）
- `crypto.randomUUID()` 用于前端生成临时消息 ID

---

## 修复 1：消息唯一 ID + 替换 index key

### 问题

`Chat.tsx` 使用 `messages.map((message, index) => <ChatMessage key={index} ...>)` 以数组索引作为 React key。当消息插入/删除时，React 会错误复用 DOM 节点，导致动画异常和状态错乱。

### 方案

1. `ChatMessage` 类型新增 `id?: string` 字段
2. `useChat.ts` 中 `sendMessage` 为用户消息生成临时 ID（`crypto.randomUUID()`）
3. `fetchMessages` 返回的历史消息如后端带 id 则使用，否则前端补充
4. `Chat.tsx` 中 `key={index}` → `key={message.id || `msg-${index}`}`

### 涉及文件

- `src/types.ts` — `ChatMessage` 接口新增 `id?: string`
- `src/hooks/useChat.ts` — `sendMessage` 生成临时 ID；`fetchMessages` 返回值补充 ID
- `src/components/Chat.tsx` — 替换 key

### 数据流

```
用户输入 → sendMessage(content)
         → 生成 userMessage = { role: 'user', content, id: crypto.randomUUID() }
         → setMessages(prev => [...prev, userMessage])

历史消息 → fetchMessages(sessionId)
         → 返回值 map: msg.id ? msg : { ...msg, id: `hist-${index}` }

渲染 → messages.map((msg, i) => <ChatMessage key={msg.id || `msg-${i}`} />)
```

---

## 修复 2：错误事件展示给用户

### 问题

`useChat.ts` 中 `error` 事件仅 `console.error`，用户看不到任何错误提示，流式内容直接消失。

### 方案

1. `useChat.ts` 新增 `errorMessage: string | null` 状态
2. `error` 事件时设置 `errorMessage = event.content || 'Unknown error'`
3. `done` 事件和 `sendMessage` 时清除 `errorMessage`
4. `useChat` 返回值新增 `errorMessage` 和 `clearError` 函数（`clearError` 实现：`setErrorMessage(null)`）
5. `Chat.tsx` 在消息列表底部展示错误提示卡片（红色背景，可点击关闭）
6. 错误提示文本使用 i18n：`t.chat.errorPrefix` + 具体错误内容
7. `Chat.tsx` 中使用 `useEffect` 实现 5 秒自动消失：当 `errorMessage` 变化时启动定时器，调用 `clearError`

### 涉及文件

- `src/hooks/useChat.ts` — 新增 `errorMessage` 状态，修改 `error`/`done`/`sendMessage` 逻辑
- `src/components/Chat.tsx` — 展示错误提示卡片，新增 `clearError` 回调
- `src/i18n/zh.translations.ts` — 新增 `chat.errorPrefix`、`chat.dismiss`
- `src/i18n/en.translations.ts` — 新增 `chat.errorPrefix`、`chat.dismiss`
- `src/i18n/translations.types.ts` — 类型新增字段

### 错误提示 UI 规格

```
┌─────────────────────────────────────────┐
│ ⚠  发生错误: <具体错误内容>        [✕] │
└─────────────────────────────────────────┘
```

- 红色渐变背景 `from-red-500/10 to-rose-500/10`
- 红色边框 `border-red-500/20`
- 点击 ✕ 或 5 秒后自动消失
- 位于消息列表底部、输入框上方

---

## 修复 3：修复硬编码 "You" 文本

### 问题

`ChatMessage.tsx:34` 硬编码了 `"You"` 文本，未使用 i18n 翻译。

### 方案

1. `ChatMessage.tsx` 引入 `useSettings`，获取 `t`
2. 替换 `"You"` → `t.chat.you`
3. 中英文翻译文件各添加 `chat.you` 键

### 涉及文件

- `src/components/ChatMessage.tsx` — 引入 `useSettings`，替换硬编码
- `src/i18n/zh.translations.ts` — 新增 `chat.you: '你'`
- `src/i18n/en.translations.ts` — 新增 `chat.you: 'You'`
- `src/i18n/translations.types.ts` — 类型新增 `you: string`

---

## 修复 4：WebSocket 指数退避自动重连

### 问题

`websocket.ts` 中 `onclose` 仅打印日志，不会自动重连。网络波动或服务端重启后用户只能刷新页面。

### 方案

1. `WebSocketService` 新增重连状态：
   - `private reconnectTimer: ReturnType<typeof setTimeout> | null = null`
   - `private reconnectAttempts: number = 0`
   - `private manualClose: boolean = false`
   - `private maxReconnectDelay: number = 30000`（30 秒）
   - `private initialReconnectDelay: number = 1000`（1 秒）

2. 重连逻辑：
   - `onclose` 事件中，若 `manualClose === false`，启动重连定时器
   - 延迟计算：`min(initialDelay * 2^attempts, maxDelay) + random(0, 500ms)`
   - 重连时调用 `this.connect(this.sessionId!)`
   - 连接成功（`onopen`）时重置 `reconnectAttempts = 0`

3. `disconnect()` 方法设置 `manualClose = true`，清除重连定时器

4. `connect()` 方法开始时重置 `manualClose = false`

5. 新增 `onClose` 事件回调（与现有 `onOpen`/`onMessage` 模式一致：`onClose(handler) => () => void`），供 `useChat` 监听连接断开以更新 `isConnected` 状态

### 涉及文件

- `src/services/websocket.ts` — 新增重连逻辑
- `src/hooks/useChat.ts` — 监听 `onClose` 事件更新 `isConnected` 状态

### 重连时序

```
WebSocket 断开 (onclose)
  → manualClose? ──Yes──→ 不重连
  → manualClose? ──No──→ 计算延迟 (1s, 2s, 4s, 8s, 16s, 30s, 30s...)
                        → setTimeout → connect(sessionId)
                        → 成功? → 重置 attempts
                        → 失败? → onclose 再次触发 → 重复
```

---

## 翻译键汇总

| 键 | 中文 | 英文 |
|----|------|------|
| `chat.you` | 你 | You |
| `chat.errorPrefix` | 发生错误： | Error: |
| `chat.dismiss` | 关闭 | Dismiss |

---

## 不在范围内

- Markdown 渲染（P1）
- 流式更新节流（P1）
- 停止生成按钮（P1）
- 消息虚拟列表（P3）
- 消息时间戳（P3）
- AbortController（P2）
- WebSocket 服务架构重构（P3）
