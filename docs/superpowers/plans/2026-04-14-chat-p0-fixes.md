# 聊天功能 P0 关键修复 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复聊天模块 4 项 P0 级问题：消息 key 不稳定、错误事件无感知、i18n 硬编码、WebSocket 无重连。

**Architecture:** 4 项修复按依赖顺序实施。修复 1（消息 ID）是基础，修复 3（i18n）最简单可并行，修复 2（错误展示）和修复 4（WebSocket 重连）互不依赖。

**Tech Stack:** React 18, TypeScript, 现有 WebSocket 服务, 现有 i18n 体系, crypto.randomUUID()

---

## 文件结构

| 操作 | 文件路径 | 职责 |
|------|----------|------|
| 修改 | `packages/electron/src/types.ts` | ChatMessage 类型新增 id 字段 |
| 修改 | `packages/electron/src/hooks/useChat.ts` | 消息 ID 生成、错误状态、onClose 监听 |
| 修改 | `packages/electron/src/components/Chat.tsx` | 替换 key、错误提示卡片、clearError |
| 修改 | `packages/electron/src/components/ChatMessage.tsx` | 替换硬编码 "You" |
| 修改 | `packages/electron/src/services/websocket.ts` | 指数退避重连、onClose 回调 |
| 修改 | `packages/electron/src/i18n/translations.types.ts` | chat 类型新增 you/errorPrefix/dismiss |
| 修改 | `packages/electron/src/i18n/zh.translations.ts` | 中文翻译新增 |
| 修改 | `packages/electron/src/i18n/en.translations.ts` | 英文翻译新增 |

---

### Task 1: ChatMessage 类型新增 id 字段

**Files:**
- Modify: `packages/electron/src/types.ts:33-36`

- [ ] **Step 1: 修改 ChatMessage 接口**

在 `ChatMessage` 接口中新增 `id` 可选字段：

```typescript
export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
}
```

- [ ] **Step 2: 验证 TypeScript 编译**

Run: `cd packages/electron && npx tsc --noEmit`
Expected: 无类型错误

---

### Task 2: useChat 中生成消息 ID

**Files:**
- Modify: `packages/electron/src/hooks/useChat.ts:6-12,150-155`

- [ ] **Step 1: 修改 fetchMessages 为历史消息补充 ID**

将 `fetchMessages` 函数改为为没有 id 的历史消息补充 id：

```typescript
async function fetchMessages(sessionId: string): Promise<ChatMessage[]> {
  const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/chat/${sessionId}/messages`, {
    headers: api.getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch messages');
  const messages: ChatMessage[] = await response.json();
  return messages.map((msg, index) => ({
    ...msg,
    id: msg.id || `hist-${index}`,
  }));
}
```

- [ ] **Step 2: 修改 sendMessage 为用户消息生成临时 ID**

将 `sendMessage` 回调改为生成临时 ID：

```typescript
const sendMessage = useCallback((content: string) => {
  const userMessage: ChatMessage = { id: crypto.randomUUID(), role: 'user', content };
  setMessages((prev) => [...prev, userMessage]);
  setIsGenerating(true);
  wsService.sendMessage(content);
}, []);
```

- [ ] **Step 3: 修改 done 事件中合并助手消息时保留/生成 ID**

在 `done` case 中，为助手消息生成 ID：

```typescript
case 'done': {
  const fromChunks = streamingContentRef.current.trim();
  const fromServer = (typeof event.fullText === 'string' ? event.fullText : '').trim();
  const assistantContent = fromChunks || fromServer;
  if (assistantContent) {
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: assistantContent }]);
  }
  streamingContentRef.current = '';
  setStreamingContent('');
  setPendingToolCall(null);
  setIsGenerating(false);
  break;
}
```

- [ ] **Step 4: 验证 TypeScript 编译**

Run: `cd packages/electron && npx tsc --noEmit`
Expected: 无类型错误

---

### Task 3: Chat.tsx 替换 index key

**Files:**
- Modify: `packages/electron/src/components/Chat.tsx:80-82`

- [ ] **Step 1: 替换消息列表的 key**

将：

```tsx
{messages.map((message, index) => (
  <ChatMessage key={index} message={message} />
))}
```

替换为：

```tsx
{messages.map((message, index) => (
  <ChatMessage key={message.id || `msg-${index}`} message={message} />
))}
```

- [ ] **Step 2: 验证 TypeScript 编译**

Run: `cd packages/electron && npx tsc --noEmit`
Expected: 无类型错误

---

### Task 4: i18n 翻译键新增

**Files:**
- Modify: `packages/electron/src/i18n/translations.types.ts:156-169`
- Modify: `packages/electron/src/i18n/zh.translations.ts:156-169`
- Modify: `packages/electron/src/i18n/en.translations.ts:156-169`

- [ ] **Step 1: 修改 Translations 类型，在 chat 对象中新增 3 个字段**

在 `translations.types.ts` 的 `chat` 对象中，在 `disconnected: string;` 之后新增：

```typescript
chat: {
  placeholder: string;
  send: string;
  messagePlaceholder: string;
  pressEnter: string;
  aiAssistant: string;
  askMeAnything: string;
  writeCode: string;
  debugErrors: string;
  explainLogic: string;
  thinking: string;
  generating: string;
  disconnected: string;
  you: string;
  errorPrefix: string;
  dismiss: string;
};
```

- [ ] **Step 2: 修改中文翻译文件**

在 `zh.translations.ts` 的 `chat` 对象中，在 `disconnected` 之后新增：

```typescript
chat: {
  placeholder: '输入消息...',
  send: '发送',
  messagePlaceholder: '向 AI 助手发送消息...',
  pressEnter: '按 Enter 发送，Shift+Enter 换行',
  aiAssistant: 'AI 助手',
  askMeAnything: '问我任何关于代码的问题，或让我帮你构建出色的应用。',
  writeCode: '编写代码',
  debugErrors: '调试错误',
  explainLogic: '解释逻辑',
  thinking: '思考中...',
  generating: '正在生成回复...',
  disconnected: '连接已断开，正在重新连接...',
  you: '你',
  errorPrefix: '发生错误：',
  dismiss: '关闭',
},
```

- [ ] **Step 3: 修改英文翻译文件**

在 `en.translations.ts` 的 `chat` 对象中，在 `disconnected` 之后新增：

```typescript
chat: {
  placeholder: 'Type your message...',
  send: 'Send',
  messagePlaceholder: 'Message AI Assistant...',
  pressEnter: 'Press Enter to send, Shift+Enter for new line',
  aiAssistant: 'AI Assistant',
  askMeAnything: 'Ask me anything about your code, or let me help you build something amazing.',
  writeCode: 'Write code',
  debugErrors: 'Debug errors',
  explainLogic: 'Explain logic',
  thinking: 'Thinking...',
  generating: 'Generating response...',
  disconnected: 'Disconnected. Reconnecting...',
  you: 'You',
  errorPrefix: 'Error: ',
  dismiss: 'Dismiss',
},
```

- [ ] **Step 4: 验证 TypeScript 编译**

Run: `cd packages/electron && npx tsc --noEmit`
Expected: 无类型错误

---

### Task 5: ChatMessage.tsx 修复硬编码 "You"

**Files:**
- Modify: `packages/electron/src/components/ChatMessage.tsx:1,34`

- [ ] **Step 1: 引入 useSettings 并替换硬编码文本**

在文件顶部 import 中新增 `useSettings`：

```typescript
import { BotIcon, UserIcon } from './Icons';
import type { ChatMessage as ChatMessageType } from '../types';
import { useSettings } from '../contexts/SettingsContext';
```

在组件函数内获取 `t`：

```typescript
export function ChatMessage({ message }: ChatMessageProps) {
  const { t } = useSettings();
  const isUser = message.role === 'user';
```

将硬编码 `"You"` 替换为：

```tsx
{isUser && (
  <div className="mt-1 text-[10px] text-white/50 text-right">{t.chat.you}</div>
)}
```

- [ ] **Step 2: 验证 TypeScript 编译**

Run: `cd packages/electron && npx tsc --noEmit`
Expected: 无类型错误

---

### Task 6: useChat 新增错误状态

**Files:**
- Modify: `packages/electron/src/hooks/useChat.ts:15-22,118-137,150-155,165-176`

- [ ] **Step 1: 新增 errorMessage 状态**

在 `useChat` 函数中，在 `isGenerating` 状态之后新增：

```typescript
const [errorMessage, setErrorMessage] = useState<string | null>(null);
```

- [ ] **Step 2: 修改 error 事件处理**

将 `error` case 从：

```typescript
case 'error':
  console.error('Chat error:', event.content);
  streamingContentRef.current = '';
  setStreamingContent('');
  setIsGenerating(false);
  break;
```

改为：

```typescript
case 'error':
  console.error('Chat error:', event.content);
  setErrorMessage(event.content || 'Unknown error');
  streamingContentRef.current = '';
  setStreamingContent('');
  setIsGenerating(false);
  break;
```

- [ ] **Step 3: 修改 done 事件清除 errorMessage**

在 `done` case 中，在 `setIsGenerating(false)` 之前新增：

```typescript
setErrorMessage(null);
```

- [ ] **Step 4: 修改 sendMessage 清除 errorMessage**

在 `sendMessage` 回调中，在 `setIsGenerating(true)` 之前新增：

```typescript
setErrorMessage(null);
```

- [ ] **Step 5: 新增 clearError 回调并加入返回值**

在 `rejectTool` 回调之后新增：

```typescript
const clearError = useCallback(() => {
  setErrorMessage(null);
}, []);
```

修改返回值对象，新增 `errorMessage` 和 `clearError`：

```typescript
return {
  messages,
  streamingContent,
  pendingToolCall,
  isConnected,
  isLoading,
  isGenerating,
  generatingElapsed,
  errorMessage,
  sendMessage,
  approveTool,
  rejectTool,
  clearError,
};
```

- [ ] **Step 6: 在 sessionId 切换时重置 errorMessage**

在 `useEffect` 中，在 `setPendingToolCall(null)` 之后新增：

```typescript
setErrorMessage(null);
```

- [ ] **Step 7: 验证 TypeScript 编译**

Run: `cd packages/electron && npx tsc --noEmit`
Expected: 无类型错误

---

### Task 7: Chat.tsx 展示错误提示卡片

**Files:**
- Modify: `packages/electron/src/components/Chat.tsx:16-26,110-119`

- [ ] **Step 1: 从 useChat 解构 errorMessage 和 clearError**

将 `Chat` 组件中的 useChat 解构从：

```typescript
const {
  messages,
  streamingContent,
  pendingToolCall,
  isConnected,
  isLoading,
  isGenerating,
  generatingElapsed,
  sendMessage,
  approveTool,
  rejectTool,
} = useChat(sessionId);
```

改为：

```typescript
const {
  messages,
  streamingContent,
  pendingToolCall,
  isConnected,
  isLoading,
  isGenerating,
  generatingElapsed,
  errorMessage,
  sendMessage,
  approveTool,
  rejectTool,
  clearError,
} = useChat(sessionId);
```

- [ ] **Step 2: 新增 5 秒自动消失的 useEffect**

在 `scrollToBottom` 的 `useEffect` 之后新增：

```typescript
useEffect(() => {
  if (!errorMessage) return;
  const timer = setTimeout(clearError, 5000);
  return () => clearTimeout(timer);
}, [errorMessage, clearError]);
```

- [ ] **Step 3: 在消息列表中添加错误提示卡片**

在 `pendingToolCall` 卡片之后、`<div ref={messagesEndRef} />` 之前，新增错误提示：

```tsx
{errorMessage && (
  <div className="flex justify-center animate-in slide-in-from-bottom-2 duration-200">
    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-red-500/10 to-rose-500/10 border border-red-500/20 shadow-lg max-w-[90%]">
      <span className="text-sm text-red-400">
        {t.chat.errorPrefix}{errorMessage}
      </span>
      <button
        onClick={clearError}
        aria-label={t.chat.dismiss}
        className="flex-shrink-0 p-1 rounded-lg text-red-400/60 hover:text-red-300 hover:bg-red-500/10 transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  </div>
)}
```

- [ ] **Step 4: 验证 TypeScript 编译**

Run: `cd packages/electron && npx tsc --noEmit`
Expected: 无类型错误

---

### Task 8: WebSocket 指数退避自动重连

**Files:**
- Modify: `packages/electron/src/services/websocket.ts`

- [ ] **Step 1: 新增重连相关私有属性**

在 `WebSocketService` 类中，在 `private sessionId: string | null = null;` 之后新增：

```typescript
private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
private reconnectAttempts: number = 0;
private manualClose: boolean = false;
private readonly initialReconnectDelay: number = 1000;
private readonly maxReconnectDelay: number = 30000;
private closeHandlers: Set<OpenHandler> = new Set();
```

- [ ] **Step 2: 新增 scheduleReconnect 私有方法**

在 `disconnect()` 方法之前新增：

```typescript
private scheduleReconnect() {
  if (this.manualClose || !this.sessionId) return;

  const delay = Math.min(
    this.initialReconnectDelay * Math.pow(2, this.reconnectAttempts),
    this.maxReconnectDelay
  ) + Math.random() * 500;

  this.reconnectAttempts++;
  console.log(`WebSocket reconnecting in ${Math.round(delay)}ms (attempt ${this.reconnectAttempts})`);

  this.reconnectTimer = setTimeout(() => {
    if (this.sessionId && !this.manualClose) {
      this.connect(this.sessionId);
    }
  }, delay);
}
```

- [ ] **Step 3: 修改 connect 方法重置 manualClose**

在 `connect` 方法的最开头（`if (this.ws?.readyState === WebSocket.OPEN)` 之前）新增：

```typescript
this.manualClose = false;
```

- [ ] **Step 4: 修改 onopen 回调重置 reconnectAttempts**

在 `this.ws.onopen` 回调中，在 `this.openHandlers.forEach((h) => h());` 之前新增：

```typescript
this.reconnectAttempts = 0;
if (this.reconnectTimer) {
  clearTimeout(this.reconnectTimer);
  this.reconnectTimer = null;
}
```

- [ ] **Step 5: 修改 onclose 回调触发重连和通知 closeHandlers**

将 `this.ws.onclose` 回调从：

```typescript
this.ws.onclose = () => {
  console.log('WebSocket disconnected');
};
```

改为：

```typescript
this.ws.onclose = () => {
  console.log('WebSocket disconnected');
  this.closeHandlers.forEach((h) => h());
  this.scheduleReconnect();
};
```

- [ ] **Step 6: 修改 disconnect 方法阻止重连**

将 `disconnect` 方法从：

```typescript
disconnect() {
  this.ws?.close();
  this.ws = null;
  this.sessionId = null;
  this.handlers.clear();
  this.openHandlers.clear();
}
```

改为：

```typescript
disconnect() {
  this.manualClose = true;
  if (this.reconnectTimer) {
    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
  }
  this.ws?.close();
  this.ws = null;
  this.sessionId = null;
  this.reconnectAttempts = 0;
  this.handlers.clear();
  this.openHandlers.clear();
  this.closeHandlers.clear();
}
```

- [ ] **Step 7: 新增 onClose 方法**

在 `onOpen` 方法之后新增：

```typescript
onClose(handler: OpenHandler) {
  this.closeHandlers.add(handler);
  return () => this.closeHandlers.delete(handler);
}
```

- [ ] **Step 8: 验证 TypeScript 编译**

Run: `cd packages/electron && npx tsc --noEmit`
Expected: 无类型错误

---

### Task 9: useChat 监听 onClose 事件

**Files:**
- Modify: `packages/electron/src/hooks/useChat.ts:69-75`

- [ ] **Step 1: 在 useChat 的 useEffect 中注册 onClose 监听**

在 `const unsubOpen = wsService.onOpen(...)` 之后新增：

```typescript
const unsubClose = wsService.onClose(() => {
  if (!cancelled && sessionIdRef.current === sessionId) {
    setIsConnected(false);
  }
});
```

在 cleanup 函数中，在 `unsubOpen();` 之后新增：

```typescript
unsubClose();
```

- [ ] **Step 2: 验证 TypeScript 编译**

Run: `cd packages/electron && npx tsc --noEmit`
Expected: 无类型错误

---

### Task 10: 最终验证

- [ ] **Step 1: 完整 TypeScript 编译检查**

Run: `cd packages/electron && npx tsc --noEmit`
Expected: 无错误

- [ ] **Step 2: ESLint 检查**

Run: `cd packages/electron && npx eslint src/hooks/useChat.ts src/components/Chat.tsx src/components/ChatMessage.tsx src/services/websocket.ts src/types.ts src/i18n/translations.types.ts src/i18n/zh.translations.ts src/i18n/en.translations.ts`
Expected: 无错误或仅与本次修改无关的已有警告

- [ ] **Step 3: 提交代码**

```bash
git add packages/electron/src/types.ts packages/electron/src/hooks/useChat.ts packages/electron/src/components/Chat.tsx packages/electron/src/components/ChatMessage.tsx packages/electron/src/services/websocket.ts packages/electron/src/i18n/translations.types.ts packages/electron/src/i18n/zh.translations.ts packages/electron/src/i18n/en.translations.ts
git commit -m "fix: chat P0 - message ID keys, error display, i18n hardcode, WS reconnect"
```
