# Web AI IDE - UI Design Document

> Last Updated: 2026-04-11

## Overview

Web AI IDE 是一个模块化的 AI 编程 IDE，包含三个主要 UI 包：

| Package | 技术栈 | 用途 |
|---------|--------|------|
| `packages/cli` | React + Tailwind CSS | 轻量级 Web CLI 界面 |
| `packages/electron` | React + Tailwind CSS | 桌面 Electron 应用 |
| `packages/openclaude-temp` | React + Ink (终端渲染) | 核心 CLI 界面 |

---

## 1. Electron 应用设计

### 1.1 整体布局

```
┌─────────────────────────────────────────────────────────┐
│  MenuBar (窗口控制按钮: 最小化 | 最大化 | 关闭)          │
├─────────────────────────────────────────────────────────┤
│  Header (h-14)                               [👤][⚙️] │
├────────┬────────────────────────────────────────────────┤
│        │                                                │
│ Sidebar│          Main Content Area                     │
│ (w-64) │          (Chat / Editor)                       │
│        │                                                │
│ Projects│                                               │
│  List   │                                               │
│ [+New]  │                                               │
├────────┼────────────────────────────────────────────────┤
│        │  PTYTerminal (h-80, optional)                  │
│        │  (WebSocket PTY)                               │
└────────┴────────────────────────────────────────────────┘
```

### 1.2 主题系统

Electron 应用支持 **双主题切换**：

#### iOS 主题 (默认浅色)
```css
--color-bg-primary: #FFFFFF
--color-accent: #007AFF (iOS 蓝)
--font-sans: 'SF Pro Text', 'Instrument Sans'
--radius-lg: 16px
```

#### Legacy 主题 (深色)
```css
--color-bg-primary: #0a0a0d
--color-accent: #6366f1 (Indigo)
--font-sans: 'Instrument Sans'
--radius-lg: 20px
```

#### CSS 变量速查表

| 变量 | 说明 | iOS Light | iOS Dark | Legacy |
|------|------|-----------|----------|--------|
| `--color-bg-primary` | 主背景 | #FFFFFF | #1C1C1E | #0a0a0d |
| `--color-bg-secondary` | 次级背景 | #F2F2F7 | #2C2C2E | #0f0f14 |
| `--color-accent` | 主题色 | #007AFF | #64D2FF | #6366f1 |
| `--color-text-primary` | 主文字 | #000000 | #FFFFFF | #f5f5f7 |
| `--color-border` | 边框 | rgba(0,0,0,0.06) | rgba(255,255,255,0.08) | rgba(255,255,255,0.05) |

### 1.3 组件规范

#### 按钮状态
| State | 样式 |
|-------|------|
| Default | `bg-slate-700/50 text-slate-500` |
| Hover | `hover:bg-white/10` |
| Active | `bg-gradient-to-br from-indigo-500 to-purple-500` |
| Disabled | `opacity-50 cursor-not-allowed` |

#### 卡片圆角
| Size | iOS | Legacy |
|------|-----|--------|
| sm | 12px | 8px |
| md | 16px | 12px |
| lg | 20px | 16px |
| xl | 24px | 20px |

#### 动画时长
```css
--transition-fast: 150ms   /* 微交互 */
--transition-base: 200ms  /* 标准过渡 */
--transition-slow: 300ms   /* 大幅变化 */
--transition-spring: 400ms /* 弹性动画 */
```

### 1.4 核心组件

#### Layout
- 三栏布局: Header(56px) + Sidebar(256px) + Main
- 背景渐变装饰 (`blur-3xl` 模糊光晕)
- 毛玻璃面板 (`glass-panel` class)

#### MenuBar
- 5 个菜单: File, Edit, View, Window, Help
- 窗口控制按钮组 (最小化/最大化/关闭)
- 悬停高亮 + 下拉动画

#### Header
- Logo + 状态指示灯 (绿点 = 在线)
- 用户头像下拉菜单
- 设置/刷新按钮

#### Sidebar
- 项目列表 (可选择/删除)
- 内联新建项目表单
- 空状态引导

#### Chat
- 消息气泡 (用户右对齐/AI 左对齐)
- 流式输出 (打字机效果)
- 工具调用卡片 (批准/拒绝)

#### ChatInput
- 自动高度 textarea (max 150px)
- 聚焦时边框发光
- Enter 发送, Shift+Enter 换行

#### PTYTerminal

- xterm.js 终端模拟器 + WebSocket PTY
- JetBrains Mono 字体
- iOS 深色主题配色
- 支持后端 PTY 管理器的 WebSocket 连接

#### Settings
5 个标签页:
- AI: 提供商/模型管理
- Database: 连接状态
- Editor: 字体/Tab 配置
- Appearance: iOS/Legacy 切换
- Language: 中英文

---

## 2. openclaude-temp 设计 (终端 CLI)

### 2.1 架构特点

- 使用 **Ink** (React-like 终端渲染库) 替代 DOM
- 全键盘导航支持
- 快捷键驱动交互

### 2.2 组件层级

```
App
├── LogoHeader (状态通知)
├── Messages (虚拟列表)
│   └── MessageRow[]
├── PromptInput (底部输入)
│   ├── PromptInputModeIndicator
│   ├── TextInput / VimTextInput
│   └── PromptInputFooter
└── Dialog (覆盖层)
```

### 2.3 设计系统组件

| 组件 | 用途 |
|------|------|
| `Dialog` | 终端对话框 |
| `Tabs` | 标签切换 |
| `Pane` | 面板容器 |
| `ProgressBar` | 进度条 |
| `KeyboardShortcutHint` | 快捷键提示 |
| `FuzzyPicker` | 模糊选择器 |

### 2.4 PromptInput 功能

核心输入组件 (~2375 行)，支持:
- 多模式输入: prompt / bash / agent
- 图片/文本粘贴
- 快捷键系统
- 建议/自动补全
- Vim 模式
- Footer 导航 (tasks/teams/bridge)

---

## 3. CLI 应用设计

### 3.1 组件列表

```
packages/cli/src/components/
├── Layout.tsx       # 基础三栏布局
├── Header.tsx       # 头部
├── Sidebar.tsx      # 项目侧边栏
├── Chat.tsx         # 聊天界面
├── ChatInput.tsx    # 输入框
├── ChatMessage.tsx  # 消息气泡
├── Editor.tsx       # 编辑器
├── EditorTabs.tsx   # 文件标签
├── FileExplorer.tsx # 文件浏览器
├── FileTree.tsx     # 文件树
├── PTYTerminal.tsx  # WebSocket PTY 终端
├── Settings.tsx     # 设置
├── ToolCallCard.tsx # 工具调用卡片
└── Icons.tsx        # SVG 图标
```

### 3.2 样式规范

使用 Tailwind CSS:
- 深色主题 (`bg-slate-900`)
- 渐变装饰 (`bg-gradient-to-br from-indigo-500`)
- 动画效果 (`animate-pulse`, `animate-float`)

---

## 4. 色彩系统

### 4.1 主色调

| 用途 | 颜色 | 渐变 |
|------|------|------|
| Primary | Indigo | `from-indigo-500 via-purple-500 to-pink-500` |
| Success | Emerald | `from-emerald-400 to-teal-500` |
| Warning | Amber | `from-amber-400 to-orange-500` |
| Error | Red | `#FF3B30` (iOS) / `#ef4444` (Legacy) |

### 4.2 文字层级

| 层级 | 颜色 | 用途 |
|------|------|------|
| Primary | `#f5f5f7` / `#000000` | 标题/重要文字 |
| Secondary | `#9ca3af` / `#3C3C43` | 正文 |
| Tertiary | `#6b7280` / `#8E8E93` | 次要信息 |
| Muted | `#4b5563` / `#AEAEB2` | 禁用/占位符 |

### 4.3 边框透明度

```css
/* iOS Light */
--color-border: rgba(0, 0, 0, 0.06);

/* iOS Dark */
--color-border: rgba(255, 255, 255, 0.08);

/* Legacy */
--color-border: rgba(255, 255, 255, 0.05);
```

---

## 5. 动画规范

### 5.1 预定义动画

| 类名 | 效果 | 时长 |
|------|------|------|
| `.animate-fade-in` | 淡入 | 300ms |
| `.animate-slide-up` | 上滑进入 | 400ms |
| `.animate-slide-down` | 下滑进入 | 300ms |
| `.animate-scale-in` | 缩放进入 | 250ms |
| `.animate-pulse-glow` | 脉冲发光 | 2s infinite |
| `.animate-float` | 漂浮 | 3s infinite |
| `.animate-shimmer` | 闪光 | 2s infinite |

### 5.2 交错延迟

```css
.stagger-1 { animation-delay: 0.05s; }
.stagger-2 { animation-delay: 0.10s; }
.stagger-3 { animation-delay: 0.15s; }
.stagger-4 { animation-delay: 0.20s; }
/* ... 最多 8 个 */
```

### 5.3 玻璃效果

```css
.glass-panel {
  background: var(--color-surface);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid var(--color-border);
}
```

---

## 6. 字体规范

### 6.1 字体族

| 用途 | iOS | Legacy |
|------|-----|--------|
| Sans | SF Pro Text, Instrument Sans | Instrument Sans |
| Mono | JetBrains Mono | JetBrains Mono |

### 6.2 字号

| 用途 | 大小 |
|------|------|
| 页面标题 | 24px / 2xl |
| 区块标题 | 18px / lg |
| 正文 | 14px / base |
| 小字 | 12px / sm |
| 最小 | 10px / xs |

---

## 7. 间距系统

基于 4px 网格:

| Token | 大小 |
|-------|------|
| xs | 4px |
| sm | 8px |
| md | 12px |
| lg | 16px |
| xl | 20px |
| 2xl | 24px |
| 3xl | 32px |

---

## 8. 组件状态

### 8.1 按钮

```tsx
// Default
className="bg-slate-700/50 text-slate-500"

// Hover
className="hover:bg-white/10 text-white"

// Active / Loading
className="bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg"

// Disabled
className="opacity-50 cursor-not-allowed"
```

### 8.2 输入框

```tsx
// Default
className="border border-slate-700/50 bg-slate-800/50"

// Focus
className="border-indigo-500/50 bg-slate-800/80 shadow-lg shadow-indigo-500/10"

// Error
className="border-red-500/50 bg-red-500/10"
```

### 8.3 卡片

```tsx
// Default
className="rounded-xl bg-slate-800/50 border border-slate-700/50"

// Selected
className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border-indigo-500/30"

// Hover
className="hover:bg-white/5"
```

---

## 9. 响应式策略

当前主要为桌面端设计 (min-width: 768px):

| 断点 | 布局调整 |
|------|----------|
| < 640px | 单栏, 隐藏侧边栏 |
| 640-1024px | 窄侧边栏 (48px) |
| > 1024px | 完整布局 |

---

## 10. 无障碍设计

### 10.1 焦点管理
- 所有可交互元素可键盘访问
- 焦点状态有明确视觉指示
- 模态框打开时焦点 trap

### 10.2 屏幕阅读器
- 语义化 HTML 标签
- ARIA 属性标记
- 替代文本

### 10.3 色彩对比
- 主文字: ≥ 4.5:1
- 次级文字: ≥ 3:1

---

## 附录

### A. 文件结构

```
packages/
├── electron/src/
│   ├── components/
│   │   ├── Layout.tsx
│   │   ├── MenuBar.tsx
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Chat.tsx
│   │   ├── ChatInput.tsx
│   │   ├── ChatMessage.tsx
│   │   ├── PTYTerminal.tsx
│   │   ├── PTYTerminalTabs.tsx
│   │   ├── Settings.tsx
│   │   ├── LoginModal.tsx
│   │   ├── AboutDialog.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── ToolCallCard.tsx
│   │   ├── FileExplorer.tsx
│   │   ├── FileTree.tsx
│   │   ├── Editor.tsx
│   │   ├── EditorTabs.tsx
│   │   └── Icons.tsx
│   ├── contexts/SettingsContext.tsx
│   ├── hooks/
│   ├── services/
│   ├── i18n/translations.ts
│   ├── index.css
│   └── App.tsx
├── openclaude-temp/src/
│   ├── components/
│   │   ├── design-system/
│   │   ├── PromptInput/
│   │   ├── permissions/
│   │   ├── tasks/
│   │   └── messages/
│   └── ink/
└── cli/src/
    └── components/
```

### B. 依赖版本

| 库 | 版本 | 用途 |
|----|------|------|
| React | ^18.x | UI 框架 |
| Tailwind CSS | ^3.x | 样式 |
| @xterm/xterm | ^5.x | 终端模拟 |
| @xterm/addon-fit | ^5.x | 终端自适应 |
| @xterm/addon-web-links | ^5.x | 终端超链接 |
| Ink | (内置) | 终端渲染 |
