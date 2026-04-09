# Web Terminal 实现规范

## 概述

本规范定义了 Web AI IDE 内置 Web 终端的实现方案，支持本地 Shell、SSH 远程连接和 WebContainer 沙箱环境，提供完整的终端仿真功能。

## 设计原则

- **主题一致性**：终端 UI 风格与主应用 Settings 保持一致（iOS 17/18 现代风格）
- **分层架构**：渲染层（xterm.js）←→ 通信层（WebSocket）←→ 后端 PTY（node-pty）←→ Shell 类型（本地/SSH/WebContainer）
- **模块化设计**：各组件职责单一，可独立测试和替换

---

## 技术选型

| 层级 | 技术方案 |
|------|---------|
| 终端渲染 | xterm.js + xterm-addon-fit + xterm-addon-web-links |
| PTY 管理 | node-pty（支持 Windows/macOS/Linux） |
| SSH 连接 | ssh2（Node.js SSH 客户端库） |
| 容器环境 | WebContainer API（@webcontainer/api） |
| 实时通信 | WebSocket（JSON 协议） |
| 状态管理 | React Hooks（useTerminal） |

---

## 系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        渲染进程 (Renderer)                       │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Terminal.tsx │  │ useTerminal  │  │  TerminalTabs.tsx   │  │
│  │  (xterm.js)  │  │   (状态管理)  │  │    (多标签页)        │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
│         │                  │                     │              │
│         └──────────────────┼─────────────────────┘              │
│                            │                                    │
│                    ┌───────┴───────┐                            │
│                    │ websocket.ts  │                            │
│                    │  (WebSocket)  │                            │
│                    └───────┬───────┘                            │
└────────────────────────────┼────────────────────────────────────┘
                             │ ws://localhost:3001/terminal
┌────────────────────────────┼────────────────────────────────────┐
│                        后端服务 (Server)                          │
│                    ┌───────┴───────┐                            │
│                    │ ws/terminal   │                            │
│                    │   路由        │                            │
│                    └───────┬───────┘                            │
│                            │                                    │
│         ┌──────────────────┼──────────────────┐                 │
│         │                  │                  │                 │
│  ┌──────┴───────┐  ┌───────┴───────┐  ┌───────┴───────┐        │
│  │ PTYService   │  │ SSHService    │  │ WebContainer  │        │
│  │ (node-pty)   │  │ (ssh2)        │  │    Service    │        │
│  └──────┬───────┘  └───────┬───────┘  └───────┬───────┘        │
│         │                  │                  │                 │
│    本地 Shell          SSH 远程           WebContainer           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 目录结构

```
packages/
├── electron/
│   └── src/
│       ├── components/
│       │   ├── Terminal.tsx          # 终端主组件
│       │   ├── TerminalTabs.tsx      # 多标签页管理
│       │   └── TerminalSettings.tsx  # 终端设置面板
│       ├── hooks/
│       │   └── useTerminal.ts        # 终端状态管理
│       ├── services/
│       │   └── terminalSocket.ts    # WebSocket 客户端
│       └── index.css                 # 终端样式（iOS 主题）
│
├── server/
│   └── src/
│       ├── routes/
│       │   └── terminal.ts           # WebSocket 终端路由
│       ├── services/
│       │   ├── pty.service.ts        # 本地 PTY 管理
│       │   ├── ssh.service.ts         # SSH 连接管理
│       │   └── webcontainer.service.ts # WebContainer 管理
│       └── utils/
│           └── shellRegistry.ts      # Shell 类型注册表
│
└── shared/
    └── src/
        └── types/
            └── terminal.ts           # 共享类型定义
```

---

## 类型定义

### 终端会话

```typescript
// shared/src/types/terminal.ts

export type ShellType = 'local' | 'ssh' | 'webcontainer';

export interface TerminalSession {
  id: string;
  name: string;
  shellType: ShellType;
  createdAt: Date;
  lastActiveAt: Date;
  cwd?: string;                    // 当前工作目录
  env?: Record<string, string>;    // 环境变量
}

export interface SSHSession extends TerminalSession {
  shellType: 'ssh';
  host: string;
  port: number;
  username: string;
  authMethod: 'password' | 'privateKey';
  // 密码或私钥不直接存储，通过 sessionId 关联
}

export interface LocalSession extends TerminalSession {
  shellType: 'local';
  shell: string;                   // shell 路径，如 /bin/bash
}

export interface WebContainerSession extends TerminalSession {
  shellType: 'webcontainer';
  imageId?: string;                // 容器镜像 ID
}
```

### WebSocket 消息

```typescript
// shared/src/types/terminal.ts

export type TerminalMessageType =
  | 'create'      // 创建终端
  | 'resize'      // 调整大小
  | 'input'       // 用户输入
  | 'output'      // 服务器输出
  | 'exit'        // 进程退出
  | 'list'        // 列出所有终端
  | 'kill'        // 终止终端
  | 'error';      // 错误信息

export interface TerminalMessage {
  type: TerminalMessageType;
  sessionId?: string;
  payload?: unknown;
}

export interface CreateSessionPayload {
  shellType: ShellType;
  shell?: string;           // 本地 shell 路径
  host?: string;            // SSH 主机
  port?: number;            // SSH 端口
  username?: string;       // SSH 用户名
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

---

## 核心组件

### 1. Terminal.tsx（渲染层）

**职责**：xterm.js 渲染 + 用户输入处理

**Props**：
```typescript
interface TerminalProps {
  sessionId: string;
  onExit?: (sessionId: string, exitCode: number) => void;
  theme?: TerminalTheme;
}
```

**功能**：
- xterm.js 终端仿真
- 自动滚动和选择复制
- 链接检测和点击（xterm-addon-web-links）
- 终端自适应调整（xterm-addon-fit）
- 键盘事件处理（Ctrl+C, Ctrl+V, Ctrl+L 等快捷键）

**主题**（iOS 风格）：
```typescript
const iosLightTheme: TerminalTheme = {
  background: '#FFFFFF',
  foreground: '#000000',
  cursor: '#007AFF',
  cursorAccent: '#FFFFFF',
  selectionBackground: 'rgba(0, 122, 255, 0.3)',
  black: '#000000',
  red: '#FF3B30',
  green: '#34C759',
  yellow: '#FF9500',
  blue: '#007AFF',
  magenta: '#AF52DE',
  cyan: '#5AC8FA',
  white: '#FFFFFF',
  brightBlack: '#8E8E93',
  brightRed: '#FF453A',
  brightGreen: '#30D158',
  brightYellow: '#FF9F0A',
  brightBlue: '#0071E3',
  brightMagenta: '#BF5AF2',
  brightCyan: '#64D2FF',
  brightWhite: '#FFFFFF',
};

const iosDarkTheme: TerminalTheme = {
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
```

### 2. TerminalTabs.tsx（标签页管理）

**职责**：管理多终端标签页

**功能**：
- 创建新终端（选择 Shell 类型）
- 关闭终端（确认后终止会话）
- 切换标签页
- 标签页拖拽排序
- 当前会话高亮

**UI 风格**：
- 标签栏位于终端下方或侧边
- 每个标签显示：终端名称 + 关闭按钮
- 新建按钮（+）位于标签栏右侧
- iOS 风格圆角和毛玻璃效果

### 3. useTerminal.ts（状态管理）

**职责**：终端状态管理 + WebSocket 通信

**接口**：
```typescript
interface UseTerminalReturn {
  // 状态
  sessions: TerminalSession[];
  activeSessionId: string | null;
  outputBuffer: Map<string, string[]>;

  // 操作
  createSession: (options: CreateSessionPayload) => Promise<string>;
  killSession: (sessionId: string) => Promise<void>;
  setActiveSession: (sessionId: string) => void;
  resizeTerminal: (sessionId: string, cols: number, rows: number) => void;

  // WebSocket 状态
  isConnected: boolean;
  connectionError: string | null;
}
```

### 4. terminalSocket.ts（WebSocket 客户端）

**职责**：WebSocket 连接管理 + 消息编解码

**功能**：
- 自动重连（指数退避）
- 心跳保活
- 消息队列（离线时缓存）
- 统一错误处理

---

## 后端服务

### 1. PTYService（本地 PTY）

```typescript
// packages/server/src/services/pty.service.ts

import * as pty from 'node-pty';
import { EventEmitter } from 'events';

export class PTYService extends EventEmitter {
  private processes: Map<string, pty.IPty> = new Map();

  createSession(
    sessionId: string,
    shell: string = process.platform === 'win32' ? 'powershell.exe' : '/bin/bash',
    cols: number = 80,
    rows: number = 24
  ): void {
    const proc = pty.spawn(shell, [], {
      cols,
      rows,
      env: process.env as { [key: string]: string },
    });

    proc.onData((data) => {
      this.emit('output', { sessionId, data });
    });

    proc.onExit(({ exitCode }) => {
      this.emit('exit', { sessionId, exitCode });
      this.processes.delete(sessionId);
    });

    this.processes.set(sessionId, proc);
  }

  write(sessionId: string, data: string): void {
    const proc = this.processes.get(sessionId);
    proc?.write(data);
  }

  resize(sessionId: string, cols: number, rows: number): void {
    const proc = this.processes.get(sessionId);
    proc?.resize(cols, rows);
  }

  kill(sessionId: string): void {
    const proc = this.processes.get(sessionId);
    proc?.kill();
    this.processes.delete(sessionId);
  }

  list(): string[] {
    return Array.from(this.processes.keys());
  }
}
```

### 2. SSHService（SSH 连接）

```typescript
// packages/server/src/services/ssh.service.ts

import { Client, ClientChannel } from 'ssh2';
import { EventEmitter } from 'events';

export class SSHService extends EventEmitter {
  private clients: Map<string, Client> = new Map();
  private channels: Map<string, ClientChannel> = new Map();

  async createSession(
    sessionId: string,
    config: SSHConfig
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const client = new Client();

      client.on('ready', () => {
        client.shell({ term: 'xterm-256color' }, (err, stream) => {
          if (err) {
            reject(err);
            return;
          }

          this.clients.set(sessionId, client);
          this.channels.set(sessionId, stream);

          stream.on('data', (data: Buffer) => {
            this.emit('output', { sessionId, data: data.toString() });
          });

          stream.on('close', () => {
            this.emit('exit', { sessionId, exitCode: 0 });
            this.cleanup(sessionId);
          });

          resolve();
        });
      });

      client.on('error', (err) => {
        this.emit('error', { sessionId, error: err.message });
        reject(err);
      });

      client.connect({
        host: config.host,
        port: config.port || 22,
        username: config.username,
        password: config.password,
        // privateKey: config.privateKey,
      });
    });
  }

  write(sessionId: string, data: string): void {
    const stream = this.channels.get(sessionId);
    stream?.write(data);
  }

  resize(sessionId: string, cols: number, rows: number): void {
    const stream = this.channels.get(sessionId);
    stream?.setWindow(rows, cols, 0, 0);
  }

  kill(sessionId: string): void {
    const client = this.clients.get(sessionId);
    client?.end();
    this.cleanup(sessionId);
  }

  private cleanup(sessionId: string): void {
    this.clients.delete(sessionId);
    this.channels.delete(sessionId);
  }
}
```

### 3. WebContainerService（WebContainer 沙箱）

```typescript
// packages/server/src/services/webcontainer.service.ts

import { WebContainer, WebContainerProcess } from '@webcontainer/api';
import { EventEmitter } from 'events';

export class WebContainerService extends EventEmitter {
  private instance: WebContainer | null = null;
  private processes: Map<string, WebContainerProcess> = new Map();

  async boot(): Promise<void> {
    this.instance = await WebContainer.boot();
  }

  async createSession(
    sessionId: string,
    options: { cols?: number; rows?: number } = {}
  ): Promise<void> {
    if (!this.instance) {
      await this.boot();
    }

    const proc = await this.instance!.spawn('jsh', {
      cols: options.cols || 80,
      rows: options.rows || 24,
    });

    proc.output.pipeTo(new WritableStream({
      write(data) {
        this.emit('output', { sessionId, data });
      }
    }));

    proc.exit.then((exitCode) => {
      this.emit('exit', { sessionId, exitCode });
      this.processes.delete(sessionId);
    });

    this.processes.set(sessionId, proc);
  }

  write(sessionId: string, data: string): void {
    const proc = this.processes.get(sessionId);
    proc?.write(data);
  }

  async resize(sessionId: string, cols: number, rows: number): Promise<void> {
    const proc = this.processes.get(sessionId);
    if (proc && 'resize' in proc) {
      // WebContainer API 可能支持 resize
    }
  }

  kill(sessionId: string): void {
    const proc = this.processes.get(sessionId);
    proc?.kill();
    this.processes.delete(sessionId);
  }
}
```

### 4. ShellRegistry（Shell 注册表）

```typescript
// packages/server/src/utils/shellRegistry.ts

import { PTYService } from '../services/pty.service';
import { SSHService } from '../services/ssh.service';
import { WebContainerService } from '../services/webcontainer.service';
import type { ShellType, CreateSessionPayload } from '@web-ai-ide/shared';

export class ShellRegistry {
  private services: Map<ShellType, PTYService | SSHService | WebContainerService>;

  constructor() {
    this.services = new Map();
    this.services.set('local', new PTYService());
    this.services.set('ssh', new SSHService());
    this.services.set('webcontainer', new WebContainerService());
  }

  getService(type: ShellType): PTYService | SSHService | WebContainerService {
    const service = this.services.get(type);
    if (!service) {
      throw new Error(`Unknown shell type: ${type}`);
    }
    return service;
  }

  async createSession(sessionId: string, payload: CreateSessionPayload): Promise<void> {
    const service = this.getService(payload.shellType);

    switch (payload.shellType) {
      case 'local':
        (service as PTYService).createSession(
          sessionId,
          payload.shell,
          payload.cols,
          payload.rows
        );
        break;
      case 'ssh':
        await (service as SSHService).createSession(sessionId, {
          host: payload.host!,
          port: payload.port,
          username: payload.username!,
          authMethod: payload.authMethod!,
          password: '', // 密码通过安全方式获取
        });
        break;
      case 'webcontainer':
        await (service as WebContainerService).createSession(sessionId, {
          cols: payload.cols,
          rows: payload.rows,
        });
        break;
    }
  }

  write(sessionId: string, type: ShellType, data: string): void {
    const service = this.getService(type);
    service.write(sessionId, data);
  }

  resize(sessionId: string, type: ShellType, cols: number, rows: number): void {
    const service = this.getService(type);
    service.resize(sessionId, cols, rows);
  }

  kill(sessionId: string, type: ShellType): void {
    const service = this.getService(type);
    service.kill(sessionId);
  }
}
```

### 5. WebSocket 路由

```typescript
// packages/server/src/routes/terminal.ts

import type { FastifyInstance } from 'fastify';
import { WebSocket } from 'ws';
import { ShellRegistry } from '../services/shellRegistry';
import type { TerminalMessage, CreateSessionPayload } from '@web-ai-ide/shared';

const shellRegistry = new ShellRegistry();

export async function terminalRoutes(fastify: FastifyInstance) {
  const wss = new WebSocket.Server({ noServer: true });

  fastify.get('/terminal', { websocket: true }, (socket, req) => {
    const sessionId = generateSessionId();

    socket.on('message', async (data) => {
      try {
        const message: TerminalMessage = JSON.parse(data.toString());
        await handleMessage(socket, message);
      } catch (error) {
        sendError(socket, sessionId, 'Invalid message format');
      }
    });

    socket.on('close', () => {
      // 清理会话
    });

    socket.on('error', (error) => {
      fastify.log.error('WebSocket error:', error);
    });
  });

  async function handleMessage(socket: WebSocket, message: TerminalMessage) {
    switch (message.type) {
      case 'create': {
        const payload = message.payload as CreateSessionPayload;
        const newSessionId = generateSessionId();
        await shellRegistry.createSession(newSessionId, payload);
        socket.send(JSON.stringify({
          type: 'created',
          sessionId: newSessionId,
        }));
        break;
      }
      case 'resize': {
        const { sessionId, cols, rows } = message.payload as any;
        shellRegistry.resize(sessionId, 'local', cols, rows);
        break;
      }
      case 'input': {
        const { sessionId, data } = message.payload as any;
        shellRegistry.write(sessionId, 'local', data);
        break;
      }
      case 'kill': {
        const { sessionId } = message.payload as any;
        shellRegistry.kill(sessionId, 'local');
        break;
      }
    }
  }

  function sendError(socket: WebSocket, sessionId: string, error: string) {
    socket.send(JSON.stringify({
      type: 'error',
      sessionId,
      payload: { error },
    }));
  }
}

function generateSessionId(): string {
  return `term_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
```

---

## 功能特性

### 1. 多终端标签页

- 支持创建多个终端会话
- 每个标签页独立 PTY 进程
- 标签页名称可编辑
- 关闭标签页时确认提示
- 标签页拖拽排序

### 2. 会话持久化

- 终端会话状态保存到数据库
- 支持恢复之前的会话
- 会话列表展示（最近 10 个）

### 3. 命令历史

- 每个会话独立历史记录
- 上下键浏览历史
- Ctrl+R 搜索历史命令
- 历史记录持久化

### 4. 输出搜索

- Ctrl+F 激活搜索
- 实时高亮匹配
- Next/Previous 导航
- 匹配计数显示

### 5. 主题定制

- iOS 浅色/深色主题
- 跟随主应用主题设置
- 支持自定义字体大小

### 6. Shell 类型选择

#### 本地 Shell（默认）
- Windows: PowerShell / CMD
- macOS: zsh / bash
- Linux: bash / zsh

#### SSH 远程连接
- 支持密码/密钥认证
- 连接配置保存
- 自动重连

#### WebContainer 沙箱
- 浏览器内 Node.js 环境
- 完全隔离的沙箱
- 适合 Web 开发测试

---

## iOS 风格 UI

### 终端组件样式

```css
/* 终端容器 */
.terminal-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--color-bg-primary);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

/* 标签栏 */
.terminal-tabs {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 8px 12px;
  background: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border);
}

.terminal-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--color-bg-tertiary);
  border-radius: var(--radius-sm);
  font-size: 13px;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.terminal-tab:hover {
  background: var(--color-surface-hover);
}

.terminal-tab.active {
  background: var(--color-bg-primary);
  color: var(--color-accent);
}

.terminal-tab-close {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.terminal-tab:hover .terminal-tab-close {
  opacity: 1;
}

.terminal-tab-close:hover {
  background: var(--color-error-subtle);
  color: var(--color-error);
}

/* 新建按钮 */
.terminal-new-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-accent);
  border-radius: var(--radius-sm);
  color: white;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.terminal-new-btn:hover {
  background: var(--color-accent-hover);
}

/* xterm 容器 */
.terminal-xterm {
  flex: 1;
  padding: 8px;
  background: var(--color-bg-primary);
}

.terminal-xterm .xterm {
  height: 100%;
}

.terminal-xterm .xterm-viewport {
  scrollbar-width: thin;
  scrollbar-color: var(--color-border) transparent;
}
```

### 终端设置面板

```css
.terminal-settings {
  padding: 16px;
  background: var(--color-surface);
  backdrop-filter: blur(20px);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
}

.terminal-settings-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 16px;
}

.terminal-settings-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid var(--color-border);
}

.terminal-settings-item:last-child {
  border-bottom: none;
}

.terminal-settings-label {
  font-size: 15px;
  color: var(--color-text-primary);
}

.terminal-settings-select {
  padding: 6px 12px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-primary);
  font-size: 14px;
}
```

---

## 错误处理

### 连接错误

| 错误类型 | 用户提示 | 处理方式 |
|---------|---------|---------|
| WebSocket 断开 | "连接已断开，正在重连..." | 自动重连（最多 5 次） |
| PTY 创建失败 | "无法创建终端会话" | 显示错误日志 |
| SSH 认证失败 | "认证失败，请检查凭据" | 打开重新连接对话框 |
| WebContainer 启动失败 | "沙箱环境启动失败" | 显示错误信息 |

### 会话管理

- 会话超时：30 分钟无活动自动休眠
- 最大会话数：10 个并发终端
- 资源限制：单个 PTY 内存限制 512MB

---

## 安全考虑

1. **SSH 密钥**：私钥不持久化存储，使用 OS 密钥链
2. **命令审计**：所有命令记录到审计日志
3. **输入验证**：WebSocket 消息严格验证
4. **资源限制**：PTY 进程资源限制
5. **WebContainer 隔离**：完全沙箱环境

---

## 修订历史

| 日期 | 描述 |
|------|------|
| 2026-04-09 | 初始规范 |
