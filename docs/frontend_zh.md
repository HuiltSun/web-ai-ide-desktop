# Web AI IDE 前端文档

## 概述

Web AI IDE 包含两个共享相似架构的前端包：
- **Electron**: 桌面应用程序，带原生窗口控件
- **CLI**: 独立的 Web 应用程序，用于浏览器访问

两个包都基于 React 18、TypeScript、Vite 和 TailwindCSS 构建。

---

## 架构

### 包结构

```
packages/
├── electron/                    # 桌面应用 (Electron)
│   ├── src/
│   │   ├── components/          # UI 组件 (PTYTerminal, Chat, Editor...)
│   │   ├── contexts/            # React Context (SettingsContext)
│   │   ├── hooks/               # 自定义 Hooks (useChat, useFileSystem, usePTY)
│   │   ├── services/            # API、WebSocket 和 PTY 客户端服务 (pty-client.ts)
│   │   ├── App.tsx              # 根组件
│   │   ├── main.tsx             # 入口文件
│   │   └── index.css            # 全局样式 + 设计令牌
│   └── electron/                # 主进程 (main.ts, preload.ts)
│
└── cli/                         # Web 应用 (React SPA)
    └── src/
        ├── components/          # UI 组件 (PTYTerminal, Chat, Editor...)
        ├── contexts/            # React Context
        ├── hooks/               # 自定义 Hooks (useChat, useFileSystem, usePTY)
        ├── services/            # API、WebSocket 和 PTY 客户端服务 (pty-client.ts)
        ├── App.tsx              # 根组件
        ├── main.tsx             # 入口文件
        └── index.css            # 全局样式
```

### 组件层级

```
App
├── ErrorBoundary (仅 electron)
├── Layout
│   ├── Header
│   ├── Sidebar
│   │   ├── FileExplorer
│   │   └── FileTree
│   └── Main Content
│       ├── Chat
│       │   ├── ChatMessage
│       │   ├── ChatInput
│       │   └── ToolCallCard
│       ├── Editor (Monaco)
│       │   └── EditorTabs
│       └── PTYTerminal (WebSocket PTY)
├── Settings (模态框)
└── LoginModal (模态框, 仅 electron)
```

---

## 设计系统

### Electron 包（当前版本）

Electron 包采用精致的深色主题设计系统，具有玻璃态效果。

#### CSS 自定义属性（设计令牌）

```css
:root {
  /* 背景颜色 */
  --color-bg-primary: #0a0a0d;
  --color-bg-secondary: #0f0f14;
  --color-bg-tertiary: #14141c;
  --color-bg-elevated: #1a1a24;
  --color-bg-hover: #1e1e2a;
  --color-surface: rgba(15, 15, 20, 0.85);
  --color-surface-hover: rgba(20, 20, 28, 0.9);

  /* 边框颜色 */
  --color-border: rgba(255, 255, 255, 0.05);
  --color-border-hover: rgba(255, 255, 255, 0.1);
  --color-border-active: rgba(99, 102, 241, 0.3);

  /* 文本颜色 */
  --color-text-primary: #f5f5f7;
  --color-text-secondary: #9ca3af;
  --color-text-tertiary: #6b7280;
  --color-text-muted: #4b5563;

  /* 强调颜色 */
  --color-accent: #6366f1;
  --color-accent-hover: #818cf8;
  --color-accent-subtle: rgba(99, 102, 241, 0.1);
  --color-accent-glow: rgba(99, 102, 241, 0.15);

  /* 状态颜色 */
  --color-success: #10b981;
  --color-success-subtle: rgba(16, 185, 129, 0.1);
  --color-warning: #f59e0b;
  --color-warning-subtle: rgba(245, 158, 11, 0.1);
  --color-error: #ef4444;
  --color-error-subtle: rgba(239, 68, 68, 0.1);

  /* 字体 */
  --font-sans: 'Instrument Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  /* 圆角 */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-xl: 20px;

  /* 阴影 */
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.5);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.6);
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.7);
  --shadow-glow: 0 0 24px var(--color-accent-glow);
  --shadow-glow-lg: 0 0 40px rgba(99, 102, 241, 0.2);

  /* 过渡动画 */
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-base: 200ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

#### 字体

- **UI 字体**: Instrument Sans (Google Fonts)
- **等宽字体**: JetBrains Mono (Google Fonts)

#### 工具类

| 类名 | 描述 |
|------|------|
| `.glass-panel` | 带背景模糊的玻璃态面板 |
| `.glass-panel-hover` | 悬停变体，背景更亮 |
| `.gradient-border` | 悬停时渐变边框效果 |
| `.text-gradient` | 渐变文字效果 |
| `.glow-accent` | 柔和的强调色发光阴影 |
| `.glow-accent-lg` | 更强的强调色发光阴影 |
| `.animate-fade-in` | 淡入动画 |
| `.animate-slide-up` | 向上滑动 + 淡入动画 |
| `.animate-slide-down` | 向下滑动 + 淡入动画 |
| `.animate-scale-in` | 缩放 + 淡入动画 |
| `.animate-pulse-glow` | 脉冲发光效果 |
| `.animate-float` | 浮动动画 |
| `.animate-shimmer` | 闪光效果 |
| `.stagger-1` 至 `.stagger-8` | 动画延迟工具类 |

#### 关键帧动画

```css
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
@keyframes slideDown { from { opacity: 0; transform: translateY(-12px); } to { opacity: 1; transform: translateY(0); } }
@keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
@keyframes pulseGlow { 0%, 100% { box-shadow: 0 0 8px var(--color-accent-glow); } 50% { box-shadow: 0 0 20px rgba(99, 102, 241, 0.25); } }
@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
```

### CLI 包

CLI 包使用更简单的 CSS 方案，通过 CSS 自定义属性实现主题化：

```css
:root {
  --color-bg-primary: #0c0c0f;
  --color-bg-secondary: #121218;
  --color-bg-tertiary: #18181f;
  --color-bg-elevated: #1e1e26;
  --color-border: rgba(255, 255, 255, 0.06);
  --color-text-primary: #f4f4f5;
  --color-accent-primary: #6366f1;
  --font-sans: 'Satoshi', -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
}
```

---

## 组件

### Layout 组件

`Layout` 组件是根容器，用于构建整个应用程序的结构：

```tsx
// packages/electron/src/components/Layout.tsx
export function Layout({ header, sidebar, children }: LayoutProps) {
  return (
    <div className="h-screen flex flex-col bg-[var(--color-bg-primary)] relative overflow-hidden">
      {/* 大气层渐变光球 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[var(--color-accent)]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-[#8b5cf6]/5 rounded-full blur-3xl" />
      </div>

      {/* 头部 */}
      <header className="h-14 glass-panel border-b border-[var(--color-border)] flex items-center px-4 relative z-10">
        {header}
      </header>

      {/* 主内容区域 */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        <aside className="w-64 glass-panel border-r border-[var(--color-border)] overflow-y-auto">
          {sidebar}
        </aside>

        <main className="flex-1 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/10 pointer-events-none" />
          <div className="relative h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
```

### Header 组件

头部显示项目信息，并提供对设置和用户控制的访问。

### Sidebar 组件

- **Sidebar**: 文件浏览器和项目导航容器
- **FileExplorer**: 项目文件树，支持创建、编辑、删除
- **FileTree**: 文件和文件夹的递归树结构

### Chat 组件

- **Chat**: 带消息列表和输入框的主聊天界面
- **ChatMessage**: 单条消息气泡（用户/AI/系统）
- **ChatInput**: 带发送按钮的文本输入框
- **ToolCallCard**: 显示 AI 工具调用请求的卡片

### Editor 组件

- **Editor**: Monaco Editor 代码编辑集成
- **EditorTabs**: 打开文件的标签栏

### PTYTerminal 组件

基于 WebSocket PTY 的终端模拟器，用于执行 Shell 命令。支持 WebSocket PTY 连接和 xterm.js 渲染。

### 模态框组件

- **Settings**: AI 提供商和模型配置
- **LoginModal**: 用户认证（仅 electron）

---

## Contexts

### SettingsContext

管理 AI 提供商和模型配置：

```typescript
interface AIProvider {
  id: string;
  name: string;
  apiEndpoint: string;
  apiKey: string;
  models: AIModel[];
}

interface AIModel {
  id: string;
  name: string;
}
```

---

## Hooks

### useChat

管理聊天状态和 AI 对话的 WebSocket 通信。

### useFileSystem

处理项目工作空间内的文件操作（读取、写入、删除）。

### usePTY

管理 PTY 终端会话和 Shell 命令执行，通过 WebSocket 与后端 PTY 服务通信。

---

## Services

### api.ts

后端通信的 REST API 客户端：
- `listProjects()`
- `createProject()`
- `deleteProject()`
- `getProjectWithSession()`

### websocket.ts

用于实时聊天流和工具调用处理的 WebSocket 客户端，支持连接状态管理和断线重连。

### pty-client.ts

WebSocket PTY 客户端，用于终端模拟器与后端 PTY 服务的通信。

---

## 样式指南

### Tailwind CSS

两个包都使用 Tailwind CSS 进行样式设计。自定义类在 `index.css` 中使用 CSS 自定义属性定义。

### 最佳实践

1. **使用 CSS 变量**: 优先使用 CSS 自定义属性而非硬编码值
2. **玻璃态效果**: 使用 `.glass-panel` 实现提升效果的表面
3. **一致的间距**: 使用 Tailwind 间距比例（1-96, px 等）
4. **颜色系统**: 使用语义化颜色变量进行主题化
5. **动画**: 使用提供的动画类实现一致的动效

### 响应式设计

应用程序针对桌面使用进行了优化（h-screen 约束）。目前未实现移动端响应式适配。

---

## 文件参考

| 文件 | 描述 |
|------|------|
| `packages/electron/src/index.css` | 设计令牌和全局样式（243 行） |
| `packages/electron/src/components/Layout.tsx` | 带大气层效果的根容器 |
| `packages/electron/src/components/PTYTerminal.tsx` | WebSocket PTY 终端组件 |
| `packages/electron/src/hooks/usePTY.ts` | PTY Hook |
| `packages/electron/src/services/pty-client.ts` | PTY WebSocket 客户端 |
| `packages/cli/src/index.css` | 带 CSS 变量的 CLI 包样式 |
| `packages/cli/src/components/Layout.tsx` | Web 版简化布局 |
| `packages/cli/src/components/PTYTerminal.tsx` | WebSocket PTY 终端组件 |
| `packages/cli/src/hooks/usePTY.ts` | PTY Hook |
| `packages/cli/src/services/pty-client.ts` | PTY WebSocket 客户端 |

---

*文档生成日期：2026-04-11*
