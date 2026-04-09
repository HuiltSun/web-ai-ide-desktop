# Web Terminal 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现完整的 Web Terminal 功能，支持本地 Shell、多标签页、xterm.js 渲染和 iOS 风格 UI

**Architecture:** 分层架构 - 渲染层（xterm.js）←→ WebSocket ←→ 后端服务（PTYService）

**Tech Stack:** xterm.js, node-pty, ssh2, WebSocket, React Hooks

---

## 文件结构

```
packages/
├── electron/src/
│   ├── components/
│   │   └── Terminal.tsx          # [修改] 现有组件重写
│   ├── hooks/
│   │   └── useTerminal.ts        # [修改] 现有 hook 重写
│   └── services/
│       └── terminalSocket.ts      # [新建] WebSocket 客户端
├── server/src/
│   ├── routes/
│   │   └── terminal.ts           # [新建] WebSocket 终端路由
│   └── services/
│       ├── pty.service.ts        # [新建] 本地 PTY 管理
│       └── shellRegistry.ts      # [新建] Shell 类型注册表
└── shared/src/types/
    └── terminal.ts               # [新建] 共享类型定义
```

---

## Task 1: 共享类型定义

**Files:**
- Create: `packages/shared/src/types/terminal.ts`

- [ ] **Step 1: 创建类型定义文件**

```typescript
// packages/shared/src/types/terminal.ts

export type ShellType = 'local' | 'ssh' | 'webcontainer';

export type TerminalMessageType =
  | 'create'
  | 'resize'
  | 'input'
  | 'output'
  | 'exit'
  | 'list'
  | 'kill'
  | 'error'
  | 'created';

export interface TerminalSession {
  id: string;
  name: string;
  shellType: ShellType;
  createdAt: Date;
  lastActiveAt: Date;
  cwd?: string;
  env?: Record<string, string>;
}

export interface SSHSession extends TerminalSession {
  shellType: 'ssh';
  host: string;
  port: number;
  username: string;
  authMethod: 'password' | 'privateKey';
}

export interface LocalSession extends TerminalSession {
  shellType: 'local';
  shell: string;
}

export interface TerminalMessage {
  type: TerminalMessageType;
  sessionId?: string;
  payload?: unknown;
}

export interface CreateSessionPayload {
  shellType: ShellType;
  shell?: string;
  host?: string;
  port?: number;
  username?: string;
  authMethod?: 'password' | 'privateKey';
  cols?: number;
  rows?: number;
}

export interface ResizePayload {
  sessionId: string;
  cols: number;
  rows: number;
}

export interface InputPayload {
  sessionId: string;
  data: string;
}

export interface OutputPayload {
  sessionId: string;
  data: string;
}
```

- [ ] **Step 2: 导出类型**

```typescript
// packages/shared/src/types/index.ts
// 添加导出
export * from './terminal.js';
```

- [ ] **Step 3: 提交**

```bash
git add packages/shared/src/types/terminal.ts packages/shared/src/types/index.ts
git commit -m "feat(shared): add terminal types"
```

---

## Task 2: PTY 服务

**Files:**
- Create: `packages/server/src/services/pty.service.ts`

- [ ] **Step 1: 创建 PTY 服务**

```typescript
// packages/server/src/services/pty.service.ts

import * as pty from 'node-pty';
import { EventEmitter } from 'events';

export interface PTYProcess {
  id: string;
  pty: pty.IPty;
  shellType: 'local';
}

export class PTYService extends EventEmitter {
  private processes: Map<string, PTYProcess> = new Map();

  createSession(
    sessionId: string,
    shell: string = process.platform === 'win32' ? 'powershell.exe' : 'bash',
    cols: number = 80,
    rows: number = 24,
    env: Record<string, string> = process.env as Record<string, string>
  ): void {
    if (this.processes.has(sessionId)) {
      throw new Error(`Session ${sessionId} already exists`);
    }

    const proc = pty.spawn(shell, [], {
      name: 'xterm-256color',
      cols,
      rows,
      env,
      cwd: env.HOME || env.USERPROFILE || '/',
    });

    proc.onData((data: string) => {
      this.emit('output', { sessionId, data });
    });

    proc.onExit(({ exitCode }) => {
      this.emit('exit', { sessionId, exitCode });
      this.processes.delete(sessionId);
    });

    this.processes.set(sessionId, { id: sessionId, pty: proc, shellType: 'local' });
  }

  write(sessionId: string, data: string): void {
    const process = this.processes.get(sessionId);
    if (process) {
      process.pty.write(data);
    }
  }

  resize(sessionId: string, cols: number, rows: number): void {
    const process = this.processes.get(sessionId);
    if (process) {
      process.pty.resize(cols, rows);
    }
  }

  kill(sessionId: string): void {
    const process = this.processes.get(sessionId);
    if (process) {
      process.pty.kill();
      this.processes.delete(sessionId);
    }
  }

  list(): string[] {
    return Array.from(this.processes.keys());
  }

  get(sessionId: string): PTYProcess | undefined {
    return this.processes.get(sessionId);
  }
}
```

- [ ] **Step 2: 创建 Shell 注册表**

```typescript
// packages/server/src/services/shellRegistry.ts

import { PTYService } from './pty.service.js';
import type { ShellType, CreateSessionPayload } from '@web-ai-ide/shared';

export class ShellRegistry {
  private ptyService: PTYService;

  constructor() {
    this.ptyService = new PTYService();
  }

  getPTYService(): PTYService {
    return this.ptyService;
  }

  async createSession(sessionId: string, payload: CreateSessionPayload): Promise<void> {
    switch (payload.shellType) {
      case 'local':
        this.ptyService.createSession(
          sessionId,
          payload.shell,
          payload.cols || 80,
          payload.rows || 24
        );
        break;
      case 'ssh':
      case 'webcontainer':
        throw new Error(`Shell type ${payload.shellType} not implemented yet`);
      default:
        throw new Error(`Unknown shell type: ${payload.shellType}`);
    }
  }

  write(sessionId: string, type: ShellType, data: string): void {
    if (type === 'local') {
      this.ptyService.write(sessionId, data);
    }
  }

  resize(sessionId: string, type: ShellType, cols: number, rows: number): void {
    if (type === 'local') {
      this.ptyService.resize(sessionId, cols, rows);
    }
  }

  kill(sessionId: string, type: ShellType): void {
    if (type === 'local') {
      this.ptyService.kill(sessionId);
    }
  }

  list(type: ShellType): string[] {
    if (type === 'local') {
      return this.ptyService.list();
    }
    return [];
  }
}
```

- [ ] **Step 3: 添加依赖**

检查 `packages/server/package.json` 是否已有 `node-pty`，如果没有则需要添加。

- [ ] **Step 4: 提交**

```bash
git add packages/server/src/services/pty.service.ts packages/server/src/services/shellRegistry.ts
git commit -m "feat(server): add PTY service for terminal"
```

---

## Task 3: WebSocket 终端路由

**Files:**
- Create: `packages/server/src/routes/terminal.ts`
- Modify: `packages/server/src/index.ts` (注册路由)

- [ ] **Step 1: 创建终端 WebSocket 路由**

```typescript
// packages/server/src/routes/terminal.ts

import type { FastifyInstance } from 'fastify';
import { WebSocket } from 'ws';
import { ShellRegistry } from '../services/shellRegistry.js';
import type { TerminalMessage, CreateSessionPayload, InputPayload, ResizePayload } from '@web-ai-ide/shared';

let shellRegistry: ShellRegistry | null = null;

export function getShellRegistry(): ShellRegistry {
  if (!shellRegistry) {
    shellRegistry = new ShellRegistry();
  }
  return shellRegistry;
}

function generateSessionId(): string {
  return `term_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function send(socket: WebSocket, data: object): void {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(data));
  }
}

export async function terminalRoutes(fastify: FastifyInstance): Promise<void> {
  const registry = getShellRegistry();
  const ptyService = registry.getPTYService();

  ptyService.on('output', ({ sessionId, data }: { sessionId: string; data: string }) => {
    // 通过 WebSocket 发送输出到所有连接的客户端
    // 注意：需要维护 sessionId -> WebSocket 映射
  });

  fastify.get('/ws/terminal', { websocket: true }, (socket, req) => {
    const sessionSockets = new Map<string, WebSocket>();

    socket.on('message', (data) => {
      try {
        const message: TerminalMessage = JSON.parse(data.toString());
        handleMessage(socket, message, registry, sessionSockets);
      } catch (error) {
        send(socket, { type: 'error', payload: { error: 'Invalid message format' } });
      }
    });

    socket.on('close', () => {
      // 清理会话
    });

    socket.on('error', (error) => {
      fastify.log.error('WebSocket error:', error);
    });
  });

  async function handleMessage(
    socket: WebSocket,
    message: TerminalMessage,
    registry: ShellRegistry,
    sessionSockets: Map<string, WebSocket>
  ): Promise<void> {
    switch (message.type) {
      case 'create': {
        const payload = message.payload as CreateSessionPayload;
        const newSessionId = generateSessionId();

        try {
          await registry.createSession(newSessionId, payload);
          sessionSockets.set(newSessionId, socket);
          send(socket, { type: 'created', sessionId: newSessionId, payload: { success: true } });
        } catch (error) {
          send(socket, {
            type: 'error',
            payload: { error: error instanceof Error ? error.message : 'Failed to create session' }
          });
        }
        break;
      }

      case 'input': {
        const { sessionId, data } = message.payload as InputPayload & { type: string };
        registry.write(sessionId, 'local', data);
        break;
      }

      case 'resize': {
        const { sessionId, cols, rows } = message.payload as ResizePayload & { type: string };
        registry.resize(sessionId, 'local', cols, rows);
        break;
      }

      case 'kill': {
        const { sessionId } = message.payload as { sessionId: string };
        registry.kill(sessionId, 'local');
        sessionSockets.delete(sessionId);
        break;
      }

      case 'list': {
        const sessions = registry.list('local');
        send(socket, { type: 'list', payload: { sessions } });
        break;
      }

      default:
        send(socket, { type: 'error', payload: { error: `Unknown message type: ${message.type}` } });
    }
  }
}
```

- [ ] **Step 2: 在 index.ts 中注册路由**

```typescript
// packages/server/src/index.ts
// 在适当位置添加
import { terminalRoutes } from './routes/terminal.js';

// 在 fastify.register() 部分添加
await fastify.register(terminalRoutes);
```

- [ ] **Step 3: 提交**

```bash
git add packages/server/src/routes/terminal.ts packages/server/src/index.ts
git commit -m "feat(server): add WebSocket terminal route"
```

---

## Task 4: 前端 WebSocket 客户端

**Files:**
- Create: `packages/electron/src/services/terminalSocket.ts`

- [ ] **Step 1: 创建 WebSocket 客户端服务**

```typescript
// packages/electron/src/services/terminalSocket.ts

import type { TerminalMessage, CreateSessionPayload, OutputPayload } from '@web-ai-ide/shared';

type MessageHandler = (message: TerminalMessage) => void;

export class TerminalSocket {
  private ws: WebSocket | null = null;
  private url: string;
  private handlers: Set<MessageHandler> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isIntentionallyClosed = false;

  constructor(url: string = `ws://${window.location.host}/ws/terminal`) {
    this.url = url;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: TerminalMessage = JSON.parse(event.data);
            this.handlers.forEach((handler) => handler(message));
          } catch {
            console.error('Failed to parse message:', event.data);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
        };

        this.ws.onclose = () => {
          if (!this.isIntentionallyClosed && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
            setTimeout(() => this.connect(), delay);
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    this.isIntentionallyClosed = true;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(message: TerminalMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  onMessage(handler: MessageHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  createSession(payload: CreateSessionPayload): Promise<string> {
    return new Promise((resolve, reject) => {
      const handler = (message: TerminalMessage) => {
        if (message.type === 'created' && message.sessionId) {
          resolve(message.sessionId);
          this.off(handler);
        } else if (message.type === 'error') {
          reject(new Error((message.payload as { error: string }).error));
          this.off(handler);
        }
      };

      this.onMessage(handler);
      this.send({ type: 'create', payload });
    });
  }

  write(sessionId: string, data: string): void {
    this.send({ type: 'input', sessionId, payload: { sessionId, data } });
  }

  resize(sessionId: string, cols: number, rows: number): void {
    this.send({ type: 'resize', sessionId, payload: { sessionId, cols, rows } });
  }

  kill(sessionId: string): void {
    this.send({ type: 'kill', sessionId, payload: { sessionId } });
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}
```

- [ ] **Step 2: 提交**

```bash
git add packages/electron/src/services/terminalSocket.ts
git commit -m "feat(electron): add terminal WebSocket client"
```

---

## Task 5: useTerminal Hook

**Files:**
- Modify: `packages/electron/src/hooks/useTerminal.ts`

- [ ] **Step 1: 重写 useTerminal Hook**

```typescript
// packages/electron/src/hooks/useTerminal.ts

import { useState, useCallback, useEffect, useRef } from 'react';
import { TerminalSocket } from '../services/terminalSocket.js';
import type { TerminalSession, CreateSessionPayload, OutputPayload } from '@web-ai-ide/shared';

export interface UseTerminalReturn {
  sessions: TerminalSession[];
  activeSessionId: string | null;
  isConnected: boolean;
  connectionError: string | null;
  createSession: (options: CreateSessionPayload) => Promise<string>;
  killSession: (sessionId: string) => Promise<void>;
  setActiveSession: (sessionId: string) => void;
  resizeTerminal: (sessionId: string, cols: number, rows: number) => void;
  writeToTerminal: (sessionId: string, data: string) => void;
  outputBuffer: Map<string, string[]>;
  onOutput: (sessionId: string, callback: (data: string) => void) => void;
}

export function useTerminal(): UseTerminalReturn {
  const [sessions, setSessions] = useState<TerminalSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [outputBuffer, setOutputBuffer] = useState<Map<string, string[]>>(new Map());

  const socketRef = useRef<TerminalSocket | null>(null);
  const outputCallbacksRef = useRef<Map<string, (data: string) => void>>(new Map());

  useEffect(() => {
    const socket = new TerminalSocket();
    socketRef.current = socket;

    socket.connect().then(() => {
      setIsConnected(true);
      setConnectionError(null);
    }).catch((error) => {
      setConnectionError(error.message);
      setIsConnected(false);
    });

    socket.onMessage((message) => {
      if (message.type === 'output') {
        const { sessionId, data } = message.payload as OutputPayload;
        setOutputBuffer((prev) => {
          const newMap = new Map(prev);
          const existing = newMap.get(sessionId) || [];
          newMap.set(sessionId, [...existing, data]);
          return newMap;
        });
        const callback = outputCallbacksRef.current.get(sessionId);
        if (callback) {
          callback(data);
        }
      } else if (message.type === 'exit') {
        const { sessionId } = message.payload as { sessionId: string; exitCode: number };
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        if (activeSessionId === sessionId) {
          setActiveSessionId(null);
        }
      } else if (message.type === 'created') {
        const { sessionId } = message;
        if (sessionId) {
          const newSession: TerminalSession = {
            id: sessionId,
            name: `Terminal ${sessions.length + 1}`,
            shellType: 'local',
            createdAt: new Date(),
            lastActiveAt: new Date(),
          };
          setSessions((prev) => [...prev, newSession]);
          setActiveSessionId(sessionId);
        }
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const createSession = useCallback(async (options: CreateSessionPayload): Promise<string> => {
    if (!socketRef.current) {
      throw new Error('Socket not connected');
    }
    const sessionId = await socketRef.current.createSession(options);
    return sessionId;
  }, []);

  const killSession = useCallback(async (sessionId: string): Promise<void> => {
    if (!socketRef.current) {
      throw new Error('Socket not connected');
    }
    socketRef.current.kill(sessionId);
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    if (activeSessionId === sessionId) {
      setActiveSessionId(null);
    }
  }, [activeSessionId]);

  const setActiveSession = useCallback((sessionId: string): void => {
    setActiveSessionId(sessionId);
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId ? { ...s, lastActiveAt: new Date() } : s
      )
    );
  }, []);

  const resizeTerminal = useCallback((sessionId: string, cols: number, rows: number): void => {
    if (socketRef.current) {
      socketRef.current.resize(sessionId, cols, rows);
    }
  }, []);

  const writeToTerminal = useCallback((sessionId: string, data: string): void => {
    if (socketRef.current) {
      socketRef.current.write(sessionId, data);
    }
  }, []);

  const onOutput = useCallback((sessionId: string, callback: (data: string) => void): void => {
    outputCallbacksRef.current.set(sessionId, callback);
  }, []);

  return {
    sessions,
    activeSessionId,
    isConnected,
    connectionError,
    createSession,
    killSession,
    setActiveSession,
    resizeTerminal,
    writeToTerminal,
    outputBuffer,
    onOutput,
  };
}
```

- [ ] **Step 2: 提交**

```bash
git add packages/electron/src/hooks/useTerminal.ts
git commit -m "feat(electron): rewrite useTerminal hook with WebSocket"
```

---

## Task 6: Terminal 组件（xterm.js）

**Files:**
- Modify: `packages/electron/src/components/Terminal.tsx`

- [ ] **Step 1: 添加 xterm.js 依赖**

```bash
cd packages/electron
npm install @xterm/xterm @xterm/addon-fit @xterm/addon-web-links
npm install -D @types/node
```

- [ ] **Step 2: 安装字体样式**

在 `index.css` 中添加：
```css
@import '@xterm/xterm/css/xterm.css';
```

- [ ] **Step 3: 重写 Terminal 组件**

```tsx
// packages/electron/src/components/Terminal.tsx

import { useEffect, useRef, useCallback } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { useTerminal } from '../hooks/useTerminal.js';

interface TerminalProps {
  sessionId: string;
  onExit?: (sessionId: string, exitCode: number) => void;
}

const iosDarkTheme = {
  background: '#1C1C1E',
  foreground: '#FFFFFF',
  cursor: '#64D2FF',
  cursorAccent: '#1C1C1E',
  selectionBackground: 'rgba(100, 210, 255, 0.3)',
  black: '#000000',
  red: '#FF453A',
  green: '#30D158',
  yellow: '#FF9F0A',
  blue: '#64D2FF',
  magenta: '#BF5AF2',
  cyan: '#5AC8FA',
  white: '#FFFFFF',
  brightBlack: '#636366',
  brightRed: '#FF6B6B',
  brightGreen: '#4AE04A',
  brightYellow: '#FFB84D',
  brightBlue: '#85E0FF',
  brightMagenta: '#D27AFF',
  brightCyan: '#7FDBFF',
  brightWhite: '#FFFFFF',
};

export function Terminal({ sessionId, onExit }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  const { resizeTerminal, writeToTerminal, onOutput } = useTerminal();

  const handleResize = useCallback(() => {
    if (fitAddonRef.current && xtermRef.current) {
      fitAddonRef.current.fit();
      const { cols, rows } = xtermRef.current;
      resizeTerminal(sessionId, cols, rows);
    }
  }, [sessionId, resizeTerminal]);

  useEffect(() => {
    if (!terminalRef.current) return;

    const xterm = new XTerm({
      theme: iosDarkTheme,
      fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
      fontSize: 14,
      lineHeight: 1.4,
      cursorBlink: true,
      cursorStyle: 'bar',
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    xterm.loadAddon(fitAddon);
    xterm.loadAddon(webLinksAddon);

    xterm.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = xterm;
    fitAddonRef.current = fitAddon;

    xterm.onData((data) => {
      writeToTerminal(sessionId, data);
    });

    onOutput(sessionId, (data) => {
      xterm.write(data);
    });

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(terminalRef.current);

    window.addEventListener('resize', handleResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      xterm.dispose();
    };
  }, [sessionId, writeToTerminal, onOutput, handleResize]);

  return (
    <div
      ref={terminalRef}
      className="h-full w-full terminal-xterm"
      style={{ background: '#1C1C1E' }}
    />
  );
}
```

- [ ] **Step 4: 添加样式**

在 `index.css` 中添加：
```css
.terminal-xterm {
  padding: 8px;
}

.terminal-xterm .xterm {
  height: 100%;
}

.terminal-xterm .xterm-viewport {
  scrollbar-width: thin;
  scrollbar-color: var(--color-border, #3A3A3C) transparent;
}

.terminal-xterm .xterm-viewport::-webkit-scrollbar {
  width: 8px;
}

.terminal-xterm .xterm-viewport::-webkit-scrollbar-track {
  background: transparent;
}

.terminal-xterm .xterm-viewport::-webkit-scrollbar-thumb {
  background: var(--color-border, #3A3A3C);
  border-radius: 4px;
}
```

- [ ] **Step 5: 提交**

```bash
git add packages/electron/src/components/Terminal.tsx packages/electron/src/index.css
git commit -m "feat(electron): integrate xterm.js into Terminal component"
```

---

## Task 7: TerminalTabs 组件

**Files:**
- Create: `packages/electron/src/components/TerminalTabs.tsx`

- [ ] **Step 1: 创建 TerminalTabs 组件**

```tsx
// packages/electron/src/components/TerminalTabs.tsx

import { useState } from 'react';
import { Terminal } from './Terminal.js';
import { useTerminal } from '../hooks/useTerminal.js';
import { TerminalIcon, PlusIcon, XIcon } from './Icons.js';

interface NewSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (shellType: 'local', shell?: string) => void;
}

function NewSessionModal({ isOpen, onClose, onCreate }: NewSessionModalProps) {
  const [shellType, setShellType] = useState<'local'>('local');
  const [shell, setShell] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[var(--color-bg-secondary)] rounded-xl p-6 w-96 border border-[var(--color-border)]">
        <h3 className="text-lg font-semibold mb-4 text-[var(--color-text-primary)]">
          New Terminal
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-[var(--color-text-secondary)] mb-2">
              Shell Type
            </label>
            <select
              value={shellType}
              onChange={(e) => setShellType(e.target.value as 'local')}
              className="w-full px-3 py-2 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] text-[var(--color-text-primary)]"
            >
              <option value="local">Local Shell</option>
              <option value="ssh" disabled>SSH (Coming Soon)</option>
              <option value="webcontainer" disabled>WebContainer (Coming Soon)</option>
            </select>
          </div>
          {shellType === 'local' && (
            <div>
              <label className="block text-sm text-[var(--color-text-secondary)] mb-2">
                Shell Path (optional)
              </label>
              <input
                type="text"
                value={shell}
                onChange={(e) => setShell(e.target.value)}
                placeholder="bash, powershell.exe, ..."
                className="w-full px-3 py-2 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)]"
              />
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onCreate(shellType, shell || undefined);
              onClose();
            }}
            className="px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)]"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}

export function TerminalTabs() {
  const {
    sessions,
    activeSessionId,
    createSession,
    killSession,
    setActiveSession,
  } = useTerminal();

  const [showNewModal, setShowNewModal] = useState(false);

  const handleCreate = async (shellType: 'local', shell?: string) => {
    try {
      await createSession({ shellType, shell });
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  const handleClose = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (confirm('Close this terminal?')) {
      await killSession(sessionId);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[var(--color-bg-primary)]">
      {/* Tab Bar */}
      <div className="flex items-center gap-1 px-2 py-1.5 bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)]">
        <div className="flex-1 flex items-center gap-1 overflow-x-auto">
          {sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => setActiveSession(session.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${
                activeSessionId === session.id
                  ? 'bg-[var(--color-bg-primary)] text-[var(--color-accent)] shadow-sm'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]'
              }`}
            >
              <TerminalIcon size={14} />
              <span className="max-w-32 truncate">{session.name}</span>
              <span
                onClick={(e) => handleClose(e, session.id)}
                className="ml-1 p-0.5 rounded hover:bg-[var(--color-error-subtle)] hover:text-[var(--color-error)]"
              >
                <XIcon size={12} />
              </span>
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors"
        >
          <PlusIcon size={16} />
        </button>
      </div>

      {/* Terminal Content */}
      <div className="flex-1 overflow-hidden">
        {activeSessionId ? (
          <Terminal sessionId={activeSessionId} />
        ) : (
          <div className="h-full flex items-center justify-center text-[var(--color-text-muted)]">
            <div className="text-center">
              <TerminalIcon size={48} className="mx-auto mb-4 opacity-50" />
              <p>No active terminal</p>
              <button
                onClick={() => setShowNewModal(true)}
                className="mt-4 px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)]"
              >
                Create Terminal
              </button>
            </div>
          </div>
        )}
      </div>

      {/* New Session Modal */}
      <NewSessionModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        onCreate={handleCreate}
      />
    </div>
  );
}
```

- [ ] **Step 2: 添加缺失的图标**

检查 `Icons.tsx` 是否有 `PlusIcon` 和 `XIcon`，如果没有则添加：
```tsx
export const PlusIcon = ({ size = 16, className = '' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export const XIcon = ({ size = 16, className = '' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
```

- [ ] **Step 3: 提交**

```bash
git add packages/electron/src/components/TerminalTabs.tsx packages/electron/src/components/Icons.tsx
git commit -m "feat(electron): add TerminalTabs component for multi-session support"
```

---

## Task 8: 集成到 Layout

**Files:**
- Modify: `packages/electron/src/components/Layout.tsx`

- [ ] **Step 1: 导入并集成 TerminalTabs**

在 Layout.tsx 中找到终端相关区域，替换为 TerminalTabs 组件：

```tsx
// 在 imports 部分添加
import { TerminalTabs } from './TerminalTabs.js';

// 在 JSX 中替换终端区域
{
  activePanel === 'terminal' && (
    <div className="h-full">
      <TerminalTabs />
    </div>
  );
}
```

- [ ] **Step 2: 提交**

```bash
git add packages/electron/src/components/Layout.tsx
git commit -m "feat(electron): integrate TerminalTabs into Layout"
```

---

## Task 9: Vite 配置修改（仅 Windows 开发）

**Files:**
- Modify: `packages/electron/vite.config.ts` 或 `vite.config.js`

- [ ] **Step 1: 配置 node-pty 原生模块**

node-pty 需要原生构建支持，在 Vite 配置中添加：

```typescript
// packages/electron/vite.config.ts
import { defineConfig } from 'vite';
import electron from 'vite-plugin-electron';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    electron({
      entry: 'electron/main.ts',
      vite: {
        build: {
          rollupOptions: {
            external: ['node-pty'],
          },
        },
      },
    }),
  ],
  resolve: {
    alias: {
      '@web-ai-ide/shared': path.resolve(__dirname, '../shared/src'),
    },
  },
  build: {
    rollupOptions: {
      external: ['node-pty', 'ssh2'],
    },
  },
});
```

- [ ] **Step 2: 提交**

```bash
git add packages/electron/vite.config.ts
git commit -m "chore(electron): configure vite for native modules"
```

---

## Task 10: 端到端测试

**Files:**
- Create: `packages/electron/src/__tests__/Terminal.test.tsx` (可选)

- [ ] **Step 1: 手动测试清单**

1. 启动后端服务器
2. 启动 Electron 应用
3. 打开终端面板
4. 创建新终端
5. 执行命令（ls, pwd, echo 等）
6. 验证输出显示正确
7. 调整终端大小
8. 创建第二个终端
9. 切换标签页
10. 关闭终端

- [ ] **Step 2: 提交**

```bash
git add -A
git commit -m "feat(electron): complete Web Terminal implementation"
```

---

## 执行选项

**Plan 完成并保存至 `docs/superpowers/plans/2026-04-09-web-terminal-plan.md`。两种执行方式：**

**1. Subagent-Driven（推荐）** - 每个任务派遣新的 subagent，任务间审核，快速迭代

**2. Inline Execution** - 在当前会话执行任务，使用 executing-plans，带检查点审核

**选择哪种方式？**
