# iOS 17/18 UI Style Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 web-ai-ide 添加 iOS 17/18 风格作为可选UI预设，同时保留现有默认主题

**Architecture:**
- 保留现有默认深色主题（重命名为 "Default" 预设）
- 新增 iOS 风格预设（iOS Light / iOS Dark）
- 用户可在 Settings > Appearance 中选择 UI 预设风格
- 选中的预设风格 + Light/Dark/System 颜色模式组合决定最终外观
- 使用 CSS 变量前缀区分不同预设：`--default-*` 和 `--ios-*`

**Tech Stack:** Tailwind CSS, CSS Variables with Prefixes, React Context

---

## File Mapping

| File | Responsibility |
|------|----------------|
| `packages/electron/src/index.css` | 主样式文件 - 同时定义 Default 和 iOS 两套 CSS 变量 |
| `packages/cli/src/index.css` | CLI样式文件 - 同步更新 |
| `packages/electron/tailwind.config.js` | Tailwind配置 - 添加 iOS 风格颜色 token |
| `packages/cli/tailwind.config.js` | Tailwind配置 - 添加 iOS 风格颜色 token |
| `packages/electron/src/contexts/SettingsContext.tsx` | 主题状态管理 - 支持 uiStyle 预设 |
| `packages/electron/src/components/Settings.tsx` | 主题切换UI组件 |

---

## Design System Architecture

### CSS Variable Naming Convention

```css
/* Default Preset (现有风格) */
:root {
  --default-bg-primary: #0a0a0d;
  --default-bg-secondary: #0f0f14;
  --default-text-primary: #f5f5f7;
  --default-accent: #6366f1;
  /* ... */
}

/* iOS Preset - Light */
:root.ios {
  --ios-bg-primary: #FFFFFF;
  --ios-bg-secondary: #F2F2F7;
  --ios-text-primary: #000000;
  --ios-accent: #007AFF;
  /* ... */
}

/* iOS Preset - Dark */
:root.ios.dark {
  --ios-bg-primary: #1C1C1E;
  --ios-bg-secondary: #2C2C2E;
  --ios-text-primary: #FFFFFF;
  --ios-accent: #64D2FF;
  /* ... */
}
```

### Theme Resolution Logic

```
User selects:
  UI Style: Default | iOS
  Color Mode: Light | Dark | System

Result:
  If UI Style = Default → use --default-* variables
  If UI Style = iOS:
    - If Color Mode = Light → use --ios-* variables (light values)
    - If Color Mode = Dark → use --ios-* variables (dark values)
    - If Color Mode = System → use system preference + --ios-* variables
```

---

## Tasks

### Task 1: 扩展 electron/index.css 添加 iOS 风格变量

**Files:**
- Modify: `packages/electron/src/index.css`

- [ ] **Step 1: 在现有 CSS 变量前添加 default- 前缀，保持向后兼容**

将现有 `:root` 块重命名为保留默认风格，同时添加新的 iOS 预设变量块：

```css
@import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

/* ============================================
   DEFAULT PRESET (现有风格 - 保持不变)
   ============================================ */
:root {
  /* Default 背景层级 */
  --color-bg-primary: #0a0a0d;
  --color-bg-secondary: #0f0f14;
  --color-bg-tertiary: #14141c;
  --color-bg-elevated: #1a1a24;
  --color-bg-hover: #1e1e2a;
  --color-surface: rgba(15, 15, 20, 0.85);
  --color-surface-hover: rgba(20, 20, 28, 0.9);

  /* Default 边框 */
  --color-border: rgba(255, 255, 255, 0.05);
  --color-border-hover: rgba(255, 255, 255, 0.1);
  --color-border-active: rgba(99, 102, 241, 0.3);

  /* Default 文字层级 */
  --color-text-primary: #f5f5f7;
  --color-text-secondary: #9ca3af;
  --color-text-tertiary: #6b7280;
  --color-text-muted: #4b5563;

  /* Default 强调色 */
  --color-accent: #6366f1;
  --color-accent-hover: #818cf8;
  --color-accent-subtle: rgba(99, 102, 241, 0.1);
  --color-accent-glow: rgba(99, 102, 241, 0.15);

  /* Default 状态色 */
  --color-success: #10b981;
  --color-success-subtle: rgba(16, 185, 129, 0.1);
  --color-warning: #f59e0b;
  --color-warning-subtle: rgba(245, 158, 11, 0.1);
  --color-error: #ef4444;
  --color-error-subtle: rgba(239, 68, 68, 0.1);

  /* 字体 */
  --font-sans: 'Instrument Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  /* 圆角系统 */
  --radius-xs: 6px;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  --radius-2xl: 24px;
  --radius-full: 9999px;

  /* 阴影 */
  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.5);
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.6);
  --shadow-xl: 0 16px 48px rgba(0, 0, 0, 0.7);
  --shadow-glow: 0 0 24px rgba(99, 102, 241, 0.2);

  /* 过渡 */
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-base: 200ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-spring: 400ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* ============================================
   iOS PRESET - SHARED VARIABLES
   ============================================ */
:root.ios {
  /* iOS 圆角系统 (更大) */
  --radius-xs: 8px;
  --radius-sm: 12px;
  --radius-md: 16px;
  --radius-lg: 20px;
  --radius-xl: 24px;
  --radius-2xl: 28px;
  --radius-full: 9999px;

  /* iOS 字体 */
  --font-sans: 'SF Pro Text', 'Instrument Sans', -apple-system, BlinkMacSystemFont, sans-serif;

  /* iOS 过渡动画 */
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-base: 200ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-spring: 400ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* iOS 浅色模式 */
:root.ios {
  --color-bg-primary: #FFFFFF;
  --color-bg-secondary: #F2F2F7;
  --color-bg-tertiary: #E5E5EA;
  --color-bg-elevated: #FFFFFF;
  --color-bg-hover: #F5F5F7;
  --color-surface: rgba(255, 255, 255, 0.72);
  --color-surface-hover: rgba(255, 255, 255, 0.85);

  --color-border: rgba(0, 0, 0, 0.06);
  --color-border-hover: rgba(0, 0, 0, 0.12);
  --color-border-active: rgba(0, 122, 255, 0.3);

  --color-text-primary: #000000;
  --color-text-secondary: #3C3C43;
  --color-text-tertiary: #8E8E93;
  --color-text-muted: #AEAEB2;

  --color-accent: #007AFF;
  --color-accent-hover: #0071E3;
  --color-accent-subtle: rgba(0, 122, 255, 0.1);
  --color-accent-glow: rgba(0, 122, 255, 0.2);

  --color-success: #34C759;
  --color-success-subtle: rgba(52, 199, 89, 0.12);
  --color-warning: #FF9500;
  --color-warning-subtle: rgba(255, 149, 0, 0.12);
  --color-error: #FF3B30;
  --color-error-subtle: rgba(255, 59, 48, 0.12);

  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.08);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.12);
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.16);
  --shadow-xl: 0 16px 48px rgba(0, 0, 0, 0.2);
  --shadow-glow: 0 0 20px rgba(0, 122, 255, 0.2);
}

/* iOS 深色模式 */
:root.ios.dark {
  --color-bg-primary: #1C1C1E;
  --color-bg-secondary: #2C2C2E;
  --color-bg-tertiary: #3A3A3C;
  --color-bg-elevated: #2C2C2E;
  --color-bg-hover: #3A3A3C;
  --color-surface: rgba(44, 44, 46, 0.72);
  --color-surface-hover: rgba(58, 58, 60, 0.85);

  --color-border: rgba(255, 255, 255, 0.08);
  --color-border-hover: rgba(255, 255, 255, 0.16);
  --color-border-active: rgba(100, 210, 255, 0.3);

  --color-text-primary: #FFFFFF;
  --color-text-secondary: #EBEBF5;
  --color-text-tertiary: #8E8E93;
  --color-text-muted: #636366;

  --color-accent: #64D2FF;
  --color-accent-hover: #85E0FF;
  --color-accent-subtle: rgba(100, 210, 255, 0.15);
  --color-accent-glow: rgba(100, 210, 255, 0.25);

  --color-success: #30D158;
  --color-success-subtle: rgba(48, 209, 88, 0.15);
  --color-warning: #FF9F0A;
  --color-warning-subtle: rgba(255, 159, 10, 0.15);
  --color-error: #FF453A;
  --color-error-subtle: rgba(255, 69, 58, 0.15);

  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.2);
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.5);
  --shadow-xl: 0 16px 48px rgba(0, 0, 0, 0.6);
  --shadow-glow: 0 0 20px rgba(100, 210, 255, 0.25);
}

/* ============================================
   BASE STYLES (通用)
   ============================================ */
*, *::before, *::after {
  box-sizing: border-box;
}

html, body, #root {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
  overflow: hidden;
}

body {
  font-family: var(--font-sans);
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-size: 14px;
  line-height: 1.5;
}

::selection {
  background: var(--color-accent-subtle);
  color: var(--color-text-primary);
}

::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: var(--color-border-hover);
  border-radius: 3px;
  transition: background var(--transition-fast);
}

::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-muted);
}

/* 毛玻璃面板 */
.glass-panel {
  background: var(--color-surface);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid var(--color-border);
}

.glass-panel-hover:hover {
  background: var(--color-surface-hover);
  border-color: var(--color-border-hover);
}

/* iOS 风格毛玻璃 (更强效果) */
:root.ios .glass-panel {
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
}

/* 动画 */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-12px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

.animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
.animate-slide-up { animation: slideUp 0.4s ease-out forwards; }
.animate-slide-down { animation: slideDown 0.3s ease-out forwards; }
.animate-scale-in { animation: scaleIn 0.25s ease-out forwards; }

.stagger-1 { animation-delay: 0.05s; }
.stagger-2 { animation-delay: 0.1s; }
.stagger-3 { animation-delay: 0.15s; }
.stagger-4 { animation-delay: 0.2s; }
.stagger-5 { animation-delay: 0.25s; }
.stagger-6 { animation-delay: 0.3s; }
.stagger-7 { animation-delay: 0.35s; }
.stagger-8 { animation-delay: 0.4s; }
```

- [ ] **Step 2: 提交更改**

```bash
git add packages/electron/src/index.css
git commit -m "style(electron): add iOS preset CSS variables alongside default preset"
```

---

### Task 2: 同步更新 cli/index.css

**Files:**
- Modify: `packages/cli/src/index.css`

- [ ] **Step 1: 复制 Task 1 的 CSS 内容到 packages/cli/src/index.css**

- [ ] **Step 2: 提交更改**

```bash
git add packages/cli/src/index.css
git commit -m "style(cli): add iOS preset CSS variables alongside default preset"
```

---

### Task 3: 扩展 Tailwind 配置支持 iOS 风格

**Files:**
- Modify: `packages/electron/tailwind.config.js`
- Modify: `packages/cli/tailwind.config.js`

- [ ] **Step 1: 更新 electron/tailwind.config.js**

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: 'var(--color-accent)',
          hover: 'var(--color-accent-hover)',
          subtle: 'var(--color-accent-subtle)',
          glow: 'var(--color-accent-glow)',
        },
        surface: {
          DEFAULT: 'var(--color-surface)',
          hover: 'var(--color-surface-hover)',
        },
        background: {
          primary: 'var(--color-bg-primary)',
          secondary: 'var(--color-bg-secondary)',
          tertiary: 'var(--color-bg-tertiary)',
          elevated: 'var(--color-bg-elevated)',
          hover: 'var(--color-bg-hover)',
        },
        border: {
          DEFAULT: 'var(--color-border)',
          hover: 'var(--color-border-hover)',
          active: 'var(--color-border-active)',
        },
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          tertiary: 'var(--color-text-tertiary)',
          muted: 'var(--color-text-muted)',
        },
        success: {
          DEFAULT: 'var(--color-success)',
          subtle: 'var(--color-success-subtle)',
        },
        warning: {
          DEFAULT: 'var(--color-warning)',
          subtle: 'var(--color-warning-subtle)',
        },
        error: {
          DEFAULT: 'var(--color-error)',
          subtle: 'var(--color-error-subtle)',
        },
      },
      borderRadius: {
        'xs': 'var(--radius-xs)',
        'sm': 'var(--radius-sm)',
        'md': 'var(--radius-md)',
        'lg': 'var(--radius-lg)',
        'xl': 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
      },
      boxShadow: {
        'xs': 'var(--shadow-xs)',
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
        'xl': 'var(--shadow-xl)',
        'glow': 'var(--shadow-glow)',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
}
```

- [ ] **Step 2: 更新 cli/tailwind.config.js（相同内容）**

- [ ] **Step 3: 提交更改**

```bash
git add packages/electron/tailwind.config.js packages/cli/tailwind.config.js
git commit -m "config: extend Tailwind with iOS preset tokens"
```

---

### Task 4: 扩展 SettingsContext 支持 UI Style 预设

**Files:**
- Modify: `packages/electron/src/contexts/SettingsContext.tsx`

- [ ] **Step 1: 添加新的类型定义**

```tsx
type UIStyle = 'default' | 'ios';
type ThemeMode = 'light' | 'dark' | 'system';
```

- [ ] **Step 2: 更新 Settings 接口**

将 `theme: 'light' | 'dark'` 替换为：

```tsx
interface Settings {
  // ... 其他字段保持不变
  uiStyle: UIStyle;
  themeMode: ThemeMode; // 原 theme 改名为 themeMode
}
```

- [ ] **Step 3: 更新 defaultSettings**

```tsx
const defaultSettings: Settings = {
  // ... 其他保持不变
  uiStyle: 'default',
  themeMode: 'dark',
};
```

- [ ] **Step 4: 添加 applyUIStyle 函数**

在 SettingsProvider 中添加：

```tsx
const applyUIStyle = (style: UIStyle) => {
  const root = document.documentElement;
  if (style === 'ios') {
    root.classList.add('ios');
  } else {
    root.classList.remove('ios');
  }
};

const applyThemeMode = (mode: ThemeMode, uiStyle: UIStyle) => {
  const root = document.documentElement;
  let isDark: boolean;

  if (mode === 'system') {
    isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  } else {
    isDark = mode === 'dark';
  }

  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};
```

- [ ] **Step 5: 添加 setUIStyle 和 setThemeMode 函数**

```tsx
const setUIStyle = useCallback((style: UIStyle) => {
  setSettings(prev => {
    const newSettings = { ...prev, uiStyle: style };
    applyUIStyle(style);
    applyThemeMode(style.themeMode || 'dark', style);

    if (window.electronAPI?.settings) {
      window.electronAPI.settings.set('ui_style', style);
    } else {
      localStorage.setItem('ui_style', style);
    }

    return newSettings;
  });
}, []);

const setThemeMode = useCallback((mode: ThemeMode) => {
  setSettings(prev => {
    const newSettings = { ...prev, themeMode: mode };
    applyThemeMode(mode, newSettings.uiStyle);

    if (window.electronAPI?.settings) {
      window.electronAPI.settings.set('theme_mode', mode);
    } else {
      localStorage.setItem('theme_mode', mode);
    }

    return newSettings;
  });
}, []);
```

- [ ] **Step 6: 添加系统主题变化监听**

```tsx
useEffect(() => {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handleChange = () => {
    if (settings.themeMode === 'system') {
      applyThemeMode('system', settings.uiStyle);
    }
  };
  mediaQuery.addEventListener('change', handleChange);
  return () => mediaQuery.removeEventListener('change', handleChange);
}, [settings.themeMode, settings.uiStyle]);
```

- [ ] **Step 7: 初始化时应用保存的设置**

在 loadSettings 末尾添加：

```tsx
// 应用保存的 UI Style 和 Theme Mode
if (savedUIStyle && (savedUIStyle === 'default' || savedUIStyle === 'ios')) {
  setSettings(prev => ({ ...prev, uiStyle: savedUIStyle as UIStyle }));
  applyUIStyle(savedUIStyle as UIStyle);
}
if (savedThemeMode && ['light', 'dark', 'system'].includes(savedThemeMode)) {
  setSettings(prev => ({ ...prev, themeMode: savedThemeMode as ThemeMode }));
  applyThemeMode(savedThemeMode as ThemeMode, savedUIStyle as UIStyle || 'default');
}
```

- [ ] **Step 8: 更新 Context Value**

在 SettingsContext.Provider value 中添加 `setUIStyle` 和 `setThemeMode`。

- [ ] **Step 9: 提交更改**

```bash
git add packages/electron/src/contexts/SettingsContext.tsx
git commit -m "feat(settings): add UI style preset support (default/ios) and theme mode"
```

---

### Task 5: 更新 Settings UI 添加 Appearance Tab

**Files:**
- Modify: `packages/electron/src/components/Settings.tsx`
- Modify: `packages/electron/src/components/Icons.tsx`

- [ ] **Step 1: 添加新的 Icons（如果不存在）**

在 Icons.tsx 中添加 SunIcon, MoonIcon, MonitorIcon, PaletteIcon：

```tsx
export function SunIcon({ className = '', size = 20 }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

export function MoonIcon({ className = '', size = 20 }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export function MonitorIcon({ className = '', size = 20 }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}

export function PaletteIcon({ className = '', size = 20 }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="8" r="1.5" fill="currentColor" />
      <circle cx="8" cy="12" r="1.5" fill="currentColor" />
      <circle cx="16" cy="12" r="1.5" fill="currentColor" />
      <circle cx="12" cy="16" r="1.5" fill="currentColor" />
    </svg>
  );
}
```

- [ ] **Step 2: 更新 Settings.tsx 添加 Appearance Tab**

添加 Tab 类型和 tabs 数组：

```tsx
type Tab = 'ai' | 'database' | 'editor' | 'language' | 'appearance';

const tabs: { id: Tab; icon: React.ReactNode }[] = [
  { id: 'ai', icon: <SparklesIcon size={16} /> },
  { id: 'database', icon: <DatabaseIcon size={16} /> },
  { id: 'editor', icon: <CodeIcon size={16} /> },
  { id: 'appearance', icon: <PaletteIcon size={16} /> },
  { id: 'language', icon: <GlobeIcon size={16} /> },
];
```

- [ ] **Step 3: 解构新的 setter 函数**

```tsx
const { settings, t, setSelectedProvider, setSelectedModel, addProvider, removeProvider, updateProvider, addModel, removeModel, updateModel, setLanguage, updateSettings, setUIStyle, setThemeMode } = useSettings();
```

- [ ] **Step 4: 添加 Appearance Tab 内容**

在 `</div>` 关闭 activeTab === 'language' 的条件渲染后，添加：

```tsx
{activeTab === 'appearance' && (
  <div className="space-y-6">
    {/* UI Style Section */}
    <div className="p-4 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border)]">
      <div className="flex items-center gap-3 mb-4">
        <PaletteIcon size={20} className="text-[var(--color-accent)]" />
        <h3 className="text-sm font-medium text-[var(--color-text-primary)]">
          {t.settings.appearance?.uiStyleTitle || 'Interface Style'}
        </h3>
      </div>
      <p className="text-sm text-[var(--color-text-tertiary)] mb-4">
        {t.settings.appearance?.uiStyleDescription || 'Choose the visual style for the interface'}
      </p>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setUIStyle('default')}
          className={`p-4 rounded-lg border-2 transition-all ${
            settings.uiStyle === 'default'
              ? 'border-[var(--color-accent)] bg-[var(--color-accent-subtle)]'
              : 'border-[var(--color-border)] hover:border-[var(--color-border-hover)]'
          }`}
        >
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
              <SparklesIcon size={18} className="text-indigo-400" />
            </div>
            <span className="text-sm font-medium text-[var(--color-text-primary)]">
              {t.settings.appearance?.defaultStyle || 'Default'}
            </span>
            <span className="text-xs text-[var(--color-text-muted)]">
              {t.settings.appearance?.defaultStyleDesc || 'Dark theme'}
            </span>
          </div>
        </button>

        <button
          onClick={() => setUIStyle('ios')}
          className={`p-4 rounded-lg border-2 transition-all ${
            settings.uiStyle === 'ios'
              ? 'border-[var(--color-accent)] bg-[var(--color-accent-subtle)]'
              : 'border-[var(--color-border)] hover:border-[var(--color-border-hover)]'
          }`}
        >
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <SparklesIcon size={18} className="text-white" />
            </div>
            <span className="text-sm font-medium text-[var(--color-text-primary)]">
              {t.settings.appearance?.iosStyle || 'iOS Style'}
            </span>
            <span className="text-xs text-[var(--color-text-muted)]">
              {t.settings.appearance?.iosStyleDesc || 'iOS 17 aesthetic'}
            </span>
          </div>
        </button>
      </div>
    </div>

    {/* Color Mode Section (only show when iOS is selected) */}
    {settings.uiStyle === 'ios' && (
      <div className="p-4 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border)]">
        <div className="flex items-center gap-3 mb-4">
          <SunIcon size={20} className="text-[var(--color-accent)]" />
          <h3 className="text-sm font-medium text-[var(--color-text-primary)]">
            {t.settings.appearance?.colorModeTitle || 'Color Mode'}
          </h3>
        </div>
        <p className="text-sm text-[var(--color-text-tertiary)] mb-4">
          {t.settings.appearance?.colorModeDescription || 'Choose light or dark appearance'}
        </p>

        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => setThemeMode('light')}
            className={`p-4 rounded-lg border-2 transition-all ${
              settings.themeMode === 'light'
                ? 'border-[var(--color-accent)] bg-[var(--color-accent-subtle)]'
                : 'border-[var(--color-border)] hover:border-[var(--color-border-hover)]'
            }`}
          >
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center">
                <SunIcon size={16} className="text-amber-500" />
              </div>
              <span className="text-xs font-medium text-[var(--color-text-primary)]">
                {t.settings.appearance?.light || 'Light'}
              </span>
            </div>
          </button>

          <button
            onClick={() => setThemeMode('dark')}
            className={`p-4 rounded-lg border-2 transition-all ${
              settings.themeMode === 'dark'
                ? 'border-[var(--color-accent)] bg-[var(--color-accent-subtle)]'
                : 'border-[var(--color-border)] hover:border-[var(--color-border-hover)]'
            }`}
          >
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                <MoonIcon size={16} className="text-blue-400" />
              </div>
              <span className="text-xs font-medium text-[var(--color-text-primary)]">
                {t.settings.appearance?.dark || 'Dark'}
              </span>
            </div>
          </button>

          <button
            onClick={() => setThemeMode('system')}
            className={`p-4 rounded-lg border-2 transition-all ${
              settings.themeMode === 'system'
                ? 'border-[var(--color-accent)] bg-[var(--color-accent-subtle)]'
                : 'border-[var(--color-border)] hover:border-[var(--color-border-hover)]'
            }`}
          >
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-white to-slate-800 border border-gray-200 flex items-center justify-center">
                <MonitorIcon size={14} className="text-gray-600" />
              </div>
              <span className="text-xs font-medium text-[var(--color-text-primary)]">
                {t.settings.appearance?.system || 'System'}
              </span>
            </div>
          </button>
        </div>
      </div>
    )}
  </div>
)}
```

- [ ] **Step 5: 提交更改**

```bash
git add packages/electron/src/components/Settings.tsx packages/electron/src/components/Icons.tsx
git commit -m "feat(settings): add appearance tab with UI style and color mode selectors"
```

---

### Task 6: 添加 i18n 翻译

**Files:**
- Modify: `packages/electron/src/i18n/translations.ts`

- [ ] **Step 1: 在 en 和 zh 翻译对象中添加 appearance 翻译**

```ts
appearance: {
  uiStyleTitle: 'Interface Style',
  uiStyleDescription: 'Choose the visual style for the interface',
  defaultStyle: 'Default',
  defaultStyleDesc: 'Dark theme',
  iosStyle: 'iOS Style',
  iosStyleDesc: 'iOS 17 aesthetic',
  colorModeTitle: 'Color Mode',
  colorModeDescription: 'Choose light or dark appearance',
  light: 'Light',
  dark: 'Dark',
  system: 'System',
},
```

```ts
appearance: {
  uiStyleTitle: '界面风格',
  uiStyleDescription: '选择界面的视觉风格',
  defaultStyle: '默认',
  defaultStyleDesc: '深色主题',
  iosStyle: 'iOS 风格',
  iosStyleDesc: 'iOS 17 美学',
  colorModeTitle: '颜色模式',
  colorModeDescription: '选择浅色或深色外观',
  light: '浅色',
  dark: '深色',
  system: '跟随系统',
},
```

- [ ] **Step 2: 提交更改**

```bash
git add packages/electron/src/i18n/translations.ts
git commit -m "i18n: add appearance translations for UI style settings"
```

---

### Task 7: 全局样式一致性检查

**Files:**
- Review: `packages/electron/src/App.tsx`
- Review: `packages/cli/src/App.tsx`
- Review: 其他组件文件

- [ ] **Step 1: 检查是否有硬编码的 Tailwind 颜色类（如 slate-*, gray-*, indigo-*）**

如果有，替换为 CSS 变量类（如 `bg-[var(--color-bg-primary)]`）。

- [ ] **Step 2: 提交更改（如有）**

```bash
git add packages/electron/src/App.tsx packages/cli/src/App.tsx
git commit -m "style: update App components to use CSS variable tokens"
```

---

## Spec Coverage Check

| Spec Section | Task(s) |
|--------------|---------|
| 设计系统 - 保留默认预设 | Task 1, 2 |
| 设计系统 - 添加 iOS 预设 | Task 1, 2 |
| CSS 变量架构 | Task 1, 2 |
| Tailwind 配置 | Task 3 |
| SettingsContext UI Style 支持 | Task 4 |
| SettingsContext Theme Mode 支持 | Task 4 |
| Appearance Tab UI | Task 5 |
| i18n 翻译 | Task 6 |
| 组件样式一致性 | Task 7 |

---

## 新主题系统预览

用户在 Settings > Appearance 中将看到：

```
┌─────────────────────────────────────┐
│ Interface Style                     │
│ Choose the visual style             │
│                                     │
│ ┌─────────┐  ┌─────────┐            │
│ │ Default │  │ iOS     │            │
│ │ Dark    │  │ iOS 17  │            │
│ └─────────┘  └─────────┘            │
│                                     │
│ (当选择 iOS 时，显示 Color Mode)     │
│                                     │
│ Color Mode                          │
│ ┌───────┐ ┌───────┐ ┌───────┐      │
│ │ Light │ │ Dark  │ │System │      │
│ └───────┘ └───────┘ └───────┘      │
└─────────────────────────────────────┘
```

---

## Execution Options

**Plan complete and saved to `docs/superpowers/plans/2026-04-09-ios-ui-style-implementation.md`**

**Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
