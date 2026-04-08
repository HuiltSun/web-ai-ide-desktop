# Web AI IDE Frontend Documentation

## Overview

The Web AI IDE features two frontend packages that share a similar architecture:
- **Electron**: Desktop application with native window controls
- **CLI**: Standalone web application for browser-based usage

Both packages are built with React 18, TypeScript, Vite, and TailwindCSS.

---

## Architecture

### Package Structure

```
packages/
├── electron/                    # Desktop app (Electron)
│   ├── src/
│   │   ├── components/          # UI Components
│   │   ├── contexts/            # React Contexts (SettingsContext)
│   │   ├── hooks/               # Custom hooks (useChat, useFileSystem, useTerminal)
│   │   ├── services/            # API & WebSocket services
│   │   ├── App.tsx              # Root component
│   │   ├── main.tsx             # Entry point
│   │   └── index.css            # Global styles + Design tokens
│   └── electron/                # Main process (main.ts, preload.ts)
│
└── cli/                         # Web app (React SPA)
    └── src/
        ├── components/          # UI Components
        ├── contexts/            # React Contexts
        ├── hooks/               # Custom hooks
        ├── services/            # API & WebSocket services
        ├── App.tsx              # Root component
        ├── main.tsx             # Entry point
        └── index.css            # Global styles
```

### Component Hierarchy

```
App
├── ErrorBoundary (electron only)
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
│       └── Terminal
├── Settings (Modal)
└── LoginModal (Modal, electron only)
```

---

## Design System

### Electron Package (Current)

The Electron package features a refined dark theme design system with glass-morphism effects.

#### CSS Custom Properties (Design Tokens)

```css
:root {
  /* Background Colors */
  --color-bg-primary: #0a0a0d;
  --color-bg-secondary: #0f0f14;
  --color-bg-tertiary: #14141c;
  --color-bg-elevated: #1a1a24;
  --color-bg-hover: #1e1e2a;
  --color-surface: rgba(15, 15, 20, 0.85);
  --color-surface-hover: rgba(20, 20, 28, 0.9);

  /* Border Colors */
  --color-border: rgba(255, 255, 255, 0.05);
  --color-border-hover: rgba(255, 255, 255, 0.1);
  --color-border-active: rgba(99, 102, 241, 0.3);

  /* Text Colors */
  --color-text-primary: #f5f5f7;
  --color-text-secondary: #9ca3af;
  --color-text-tertiary: #6b7280;
  --color-text-muted: #4b5563;

  /* Accent Colors */
  --color-accent: #6366f1;
  --color-accent-hover: #818cf8;
  --color-accent-subtle: rgba(99, 102, 241, 0.1);
  --color-accent-glow: rgba(99, 102, 241, 0.15);

  /* Status Colors */
  --color-success: #10b981;
  --color-success-subtle: rgba(16, 185, 129, 0.1);
  --color-warning: #f59e0b;
  --color-warning-subtle: rgba(245, 158, 11, 0.1);
  --color-error: #ef4444;
  --color-error-subtle: rgba(239, 68, 68, 0.1);

  /* Typography */
  --font-sans: 'Instrument Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  /* Border Radius */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-xl: 20px;

  /* Shadows */
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.5);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.6);
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.7);
  --shadow-glow: 0 0 24px var(--color-accent-glow);
  --shadow-glow-lg: 0 0 40px rgba(99, 102, 241, 0.2);

  /* Transitions */
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-base: 200ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

#### Typography

- **Display/UI Font**: Instrument Sans (Google Fonts)
- **Monospace Font**: JetBrains Mono (Google Fonts)

#### Utility Classes

| Class | Description |
|-------|-------------|
| `.glass-panel` | Glass-morphism panel with backdrop blur |
| `.glass-panel-hover` | Hover variant with lighter background |
| `.gradient-border` | Gradient border effect on hover |
| `.text-gradient` | Gradient text effect |
| `.glow-accent` | Subtle accent glow shadow |
| `.glow-accent-lg` | Stronger accent glow shadow |
| `.animate-fade-in` | Fade in animation |
| `.animate-slide-up` | Slide up + fade animation |
| `.animate-slide-down` | Slide down + fade animation |
| `.animate-scale-in` | Scale + fade animation |
| `.animate-pulse-glow` | Pulsing glow effect |
| `.animate-float` | Floating animation |
| `.animate-shimmer` | Shimmer effect |
| `.stagger-1` to `.stagger-8` | Animation delay utilities |

#### Keyframe Animations

```css
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
@keyframes slideDown { from { opacity: 0; transform: translateY(-12px); } to { opacity: 1; transform: translateY(0); } }
@keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
@keyframes pulseGlow { 0%, 100% { box-shadow: 0 0 8px var(--color-accent-glow); } 50% { box-shadow: 0 0 20px rgba(99, 102, 241, 0.25); } }
@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
```

### CLI Package

The CLI package uses a simpler CSS approach with CSS custom properties for theming:

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

## Components

### Layout Component

The `Layout` component is the root container that structures the entire application:

```tsx
// packages/electron/src/components/Layout.tsx
export function Layout({ header, sidebar, children }: LayoutProps) {
  return (
    <div className="h-screen flex flex-col bg-[var(--color-bg-primary)] relative overflow-hidden">
      {/* Atmospheric gradient orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[var(--color-accent)]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-[#8b5cf6]/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="h-14 glass-panel border-b border-[var(--color-border)] flex items-center px-4 relative z-10">
        {header}
      </header>

      {/* Main content area */}
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

### Header Component

The header displays project info and provides access to settings and user controls.

### Sidebar Components

- **Sidebar**: Container for file explorer and project navigation
- **FileExplorer**: Project file tree with create, edit, delete support
- **FileTree**: Recursive tree structure for files and folders

### Chat Components

- **Chat**: Main chat interface with message list and input
- **ChatMessage**: Individual message bubble (user/AI/system)
- **ChatInput**: Text input with send button
- **ToolCallCard**: Card displaying AI tool call requests

### Editor Components

- **Editor**: Monaco Editor integration for code editing
- **EditorTabs**: Tab bar for open files

### Terminal Component

Web-based terminal emulator for shell commands.

### Modal Components

- **Settings**: AI provider and model configuration
- **LoginModal**: User authentication (electron only)

---

## Contexts

### SettingsContext

Manages AI provider and model configuration:

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

Manages chat state and WebSocket communication for AI conversations.

### useFileSystem

Handles file operations (read, write, delete) within the project workspace.

### useTerminal

Manages terminal session and shell command execution.

---

## Services

### api.ts

REST API client for backend communication:
- `listProjects()`
- `createProject()`
- `deleteProject()`
- `getProjectWithSession()`

### websocket.ts

WebSocket client for real-time chat streaming and tool call handling.

---

## Styling Guidelines

### Tailwind CSS

Both packages use Tailwind CSS for utility-first styling. Custom classes are defined in `index.css` using CSS custom properties.

### Best Practices

1. **Use CSS Variables**: Prefer CSS custom properties over hardcoded values
2. **Glass-morphism**: Use `.glass-panel` for elevated surfaces
3. **Consistent Spacing**: Use Tailwind spacing scale (1-96, px, etc.)
4. **Color System**: Use semantic color variables for theming
5. **Animations**: Use provided animation classes for consistent motion

### Responsive Design

The application is optimized for desktop use (h-screen constraint). Mobile responsiveness is not currently implemented.

---

## Files Reference

| File | Description |
|------|-------------|
| `packages/electron/src/index.css` | Design tokens and global styles (243 lines) |
| `packages/electron/src/components/Layout.tsx` | Root container with atmospheric effects |
| `packages/cli/src/index.css` | CLI package styles with CSS variables |
| `packages/cli/src/components/Layout.tsx` | Simplified layout for web |

---

*Document generated: 2026-04-08*
