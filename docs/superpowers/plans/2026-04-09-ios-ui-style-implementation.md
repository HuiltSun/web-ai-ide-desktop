# iOS 17/18 UI Style Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 web-ai-ide UI 修改为 iOS 17/18 现代风格，支持浅色/深色/系统三模式切换

**Architecture:**
- 使用 Tailwind darkMode: 'class' + CSS变量实现双主题
- 主题状态存储在 SettingsContext 中，支持 'light' | 'dark' | 'system'
- 通过在 `<html>` 元素上添加/移除 `.dark` class 控制主题切换
- 自适应强调色：浅色模式用 iOS蓝(#007AFF)，深色模式用青蓝(#64D2FF)

**Tech Stack:** Tailwind CSS, CSS Variables, React Context

---

## File Mapping

| File | Responsibility |
|------|----------------|
| `packages/electron/src/index.css` | 主样式文件 - 定义CSS变量、圆角、毛玻璃效果 |
| `packages/cli/src/index.css` | CLI样式文件 - 同步更新iOS风格 |
| `packages/electron/tailwind.config.js` | Tailwind配置 - 启用darkMode |
| `packages/cli/tailwind.config.js` | Tailwind配置 - 启用darkMode |
| `packages/electron/src/contexts/SettingsContext.tsx` | 主题状态管理 |
| `packages/electron/src/components/Settings.tsx` | 主题切换UI组件 |

---

## Tasks

### Task 1: 更新 electron/index.css 为 iOS 风格

**Files:**
- Modify: `packages/electron/src/index.css`

- [ ] **Step 1: 替换整个文件为iOS风格CSS变量系统**

```css
@import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  /* 浅色模式 - iOS 白色系 */
  --color-bg-primary: #FFFFFF;
  --color-bg-secondary: #F2F2F7;
  --color-bg-tertiary: #E5E5EA;
  --color-bg-elevated: #FFFFFF;
  --color-bg-hover: #F5F5F7;

  /* 毛玻璃 */
  --color-surface: rgba(255, 255, 255, 0.72);
  --color-surface-hover: rgba(255, 255, 255, 0.85);

  /* 边框 */
  --color-border: rgba(0, 0, 0, 0.06);
  --color-border-hover: rgba(0, 0, 0, 0.12);
  --color-border-active: rgba(0, 122, 255, 0.3);

  /* 文字层级 */
  --color-text-primary: #000000;
  --color-text-secondary: #3C3C43;
  --color-text-tertiary: #8E8E93;
  --color-text-muted: #AEAEB2;

  /* 强调色 - iOS蓝 */
  --color-accent: #007AFF;
  --color-accent-hover: #0071E3;
  --color-accent-subtle: rgba(0, 122, 255, 0.1);
  --color-accent-glow: rgba(0, 122, 255, 0.2);

  /* 状态色 */
  --color-success: #34C759;
  --color-success-subtle: rgba(52, 199, 89, 0.12);
  --color-warning: #FF9500;
  --color-warning-subtle: rgba(255, 149, 0, 0.12);
  --color-error: #FF3B30;
  --color-error-subtle: rgba(255, 59, 48, 0.12);

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

  /* 阴影 - iOS柔和阴影 */
  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.08);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.12);
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.16);
  --shadow-xl: 0 16px 48px rgba(0, 0, 0, 0.2);
  --shadow-glow: 0 0 20px var(--color-accent-glow);

  /* 过渡 */
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-base: 200ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-spring: 400ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* 深色模式 */
:root.dark {
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

  /* 深色模式强调色 - 青蓝色 */
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
}

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

/* iOS风格按钮 */
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 20px;
  background: var(--color-accent);
  color: #FFFFFF;
  border-radius: var(--radius-sm);
  font-weight: 500;
  font-size: 14px;
  transition: all var(--transition-fast);
  border: none;
  cursor: pointer;
}

.btn-primary:hover {
  background: var(--color-accent-hover);
  transform: translateY(-1px);
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 20px;
  background: var(--color-accent-subtle);
  color: var(--color-accent);
  border-radius: var(--radius-sm);
  font-weight: 500;
  font-size: 14px;
  transition: all var(--transition-fast);
  border: none;
  cursor: pointer;
}

.btn-secondary:hover {
  background: var(--color-accent);
  color: #FFFFFF;
}

/* iOS风格卡片 */
.ios-card {
  background: var(--color-bg-secondary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  padding: 16px;
  transition: all var(--transition-base);
}

.ios-card:hover {
  border-color: var(--color-border-hover);
}

/* iOS风格输入框 */
.ios-input {
  width: 100%;
  padding: 12px 16px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 14px;
  color: var(--color-text-primary);
  transition: all var(--transition-fast);
  height: 44px;
}

.ios-input:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px var(--color-accent-subtle);
}

.ios-input::placeholder {
  color: var(--color-text-muted);
}

/* 动画 */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-out forwards;
}

.animate-slide-up {
  animation: slideUp 0.4s ease-out forwards;
}

.animate-slide-down {
  animation: slideDown 0.3s ease-out forwards;
}

.animate-scale-in {
  animation: scaleIn 0.25s ease-out forwards;
}

/* 交错动画延迟 */
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
git commit -m "style(electron): apply iOS 17/18 design system with CSS variables"
```

---

### Task 2: 更新 cli/index.css 为 iOS 风格

**Files:**
- Modify: `packages/cli/src/index.css`

- [ ] **Step 1: 替换整个文件（与electron保持一致的iOS风格CSS变量系统）**

复制 Task 1 的 CSS 内容到 `packages/cli/src/index.css`

- [ ] **Step 2: 提交更改**

```bash
git add packages/cli/src/index.css
git commit -m "style(cli): apply iOS 17/18 design system with CSS variables"
```

---

### Task 3: 配置 Tailwind darkMode

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

- [ ] **Step 2: 更新 cli/tailwind.config.js**

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

- [ ] **Step 3: 提交更改**

```bash
git add packages/electron/tailwind.config.js packages/cli/tailwind.config.js
git commit -m "config: enable Tailwind darkMode class and extend iOS color tokens"
```

---

### Task 4: 扩展 SettingsContext 支持三主题模式

**Files:**
- Modify: `packages/electron/src/contexts/SettingsContext.tsx`

- [ ] **Step 1: 添加theme类型和系统主题检测hook**

在文件顶部添加：

```tsx
type ThemeMode = 'light' | 'dark' | 'system';
```

在 Settings 接口中，将 `theme: 'light' | 'dark'` 替换为：

```tsx
theme: ThemeMode;
```

在 SettingsContextValue 接口中添加：

```tsx
setTheme: (theme: ThemeMode) => void;
```

- [ ] **Step 2: 添加useEffect监听系统主题变化**

在 SettingsProvider 组件中添加：

```tsx
const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark');

const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'dark';
};

useEffect(() => {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handleChange = () => {
    if (settings.theme === 'system') {
      setResolvedTheme(getSystemTheme());
      applyTheme(getSystemTheme());
    }
  };
  mediaQuery.addEventListener('change', handleChange);
  return () => mediaQuery.removeEventListener('change', handleChange);
}, [settings.theme]);
```

- [ ] **Step 3: 添加applyTheme函数和setTheme实现**

在 SettingsProvider 组件中添加：

```tsx
const applyTheme = (theme: 'light' | 'dark') => {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};

const setTheme = useCallback((theme: ThemeMode) => {
  setSettings(prev => {
    const newSettings = { ...prev, theme };
    
    // 计算实际主题
    let resolved: 'light' | 'dark';
    if (theme === 'system') {
      resolved = getSystemTheme();
    } else {
      resolved = theme;
    }
    setResolvedTheme(resolved);
    applyTheme(resolved);
    
    if (window.electronAPI?.settings) {
      window.electronAPI.settings.set('theme', theme);
    } else {
      localStorage.setItem('theme', theme);
    }
    
    return newSettings;
  });
}, []);
```

- [ ] **Step 4: 更新updateSettings中的theme处理**

在 updateSettings 函数中确保 theme 变更时调用 applyTheme。

- [ ] **Step 5: 初始化时应用保存的主题**

在 loadSettings 的末尾（在 `loadSettings();` 调用之后直接添加）：

```tsx
useEffect(() => {
  let initialTheme: 'light' | 'dark';
  if (settings.theme === 'system') {
    initialTheme = getSystemTheme();
  } else {
    initialTheme = settings.theme;
  }
  setResolvedTheme(initialTheme);
  applyTheme(initialTheme);
}, [settings.theme]);
```

- [ ] **Step 6: 在 SettingsContext.Provider value 中添加 setTheme**

```tsx
<SettingsContext.Provider
  value={{
    settings,
    t,
    updateSettings,
    addProvider,
    removeProvider,
    updateProvider,
    addModel,
    removeModel,
    updateModel,
    setSelectedProvider,
    setSelectedModel,
    setLanguage,
    setTheme,
    getSelectedProvider,
    getSelectedModel,
  }}
>
```

- [ ] **Step 7: 提交更改**

```bash
git add packages/electron/src/contexts/SettingsContext.tsx
git commit -m "feat(settings): add theme mode support (light/dark/system)"
```

---

### Task 5: 在 Settings 组件中添加主题切换 UI

**Files:**
- Modify: `packages/electron/src/components/Settings.tsx`

- [ ] **Step 1: 添加Appearance Tab到tabs数组**

将 tabs 数组修改为：

```tsx
type Tab = 'ai' | 'database' | 'editor' | 'language' | 'appearance';

const tabs: { id: Tab; icon: React.ReactNode }[] = [
  { id: 'ai', icon: <SparklesIcon size={16} /> },
  { id: 'database', icon: <DatabaseIcon size={16} /> },
  { id: 'editor', icon: <CodeIcon size={16} /> },
  { id: 'appearance', icon: <SunIcon size={16} /> },
  { id: 'language', icon: <GlobeIcon size={16} /> },
];
```

注意：需要添加 SunIcon 到 import

```tsx
import { CloseIcon, PlusIcon, TrashIcon, SparklesIcon, DatabaseIcon, CodeIcon, GlobeIcon, ChevronDownIcon, SunIcon, MoonIcon, MonitorIcon } from './Icons';
```

- [ ] **Step 2: 添加appearance图标（如果不存在）到Icons.tsx**

在 Icons.tsx 末尾添加：

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
```

- [ ] **Step 3: 解构 setTheme 从 useSettings**

```tsx
const { settings, t, setSelectedProvider, setSelectedModel, addProvider, removeProvider, updateProvider, addModel, removeModel, updateModel, setLanguage, updateSettings, setTheme } = useSettings();
```

- [ ] **Step 4: 添加 appearance Tab 内容**

在 `</div>` 关闭 activeTab === 'language' 的条件渲染后，添加：

```tsx
{activeTab === 'appearance' && (
  <div className="space-y-6">
    <div className="p-4 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border)]">
      <div className="flex items-center gap-3 mb-4">
        <SunIcon size={20} className="text-[var(--color-accent)]" />
        <h3 className="text-sm font-medium text-[var(--color-text-primary)]">{t.settings.appearance?.title || 'Appearance'}</h3>
      </div>
      <p className="text-sm text-[var(--color-text-tertiary)] mb-4">{t.settings.appearance?.description || 'Choose how web-ai-ide looks to you'}</p>

      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => setTheme('light')}
          className={`p-4 rounded-lg border-2 transition-all ${
            settings.theme === 'light'
              ? 'border-[var(--color-accent)] bg-[var(--color-accent-subtle)]'
              : 'border-[var(--color-border)] hover:border-[var(--color-border-hover)]'
          }`}
        >
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center">
              <SunIcon size={16} className="text-amber-500" />
            </div>
            <span className="text-xs font-medium text-[var(--color-text-primary)]">Light</span>
          </div>
        </button>

        <button
          onClick={() => setTheme('dark')}
          className={`p-4 rounded-lg border-2 transition-all ${
            settings.theme === 'dark'
              ? 'border-[var(--color-accent)] bg-[var(--color-accent-subtle)]'
              : 'border-[var(--color-border)] hover:border-[var(--color-border-hover)]'
          }`}
        >
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
              <MoonIcon size={16} className="text-blue-400" />
            </div>
            <span className="text-xs font-medium text-[var(--color-text-primary)]">Dark</span>
          </div>
        </button>

        <button
          onClick={() => setTheme('system')}
          className={`p-4 rounded-lg border-2 transition-all ${
            settings.theme === 'system'
              ? 'border-[var(--color-accent)] bg-[var(--color-accent-subtle)]'
              : 'border-[var(--color-border)] hover:border-[var(--color-border-hover)]'
          }`}
        >
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-white to-slate-800 border border-gray-200 flex items-center justify-center">
              <MonitorIcon size={14} className="text-gray-600" />
            </div>
            <span className="text-xs font-medium text-[var(--color-text-primary)]">System</span>
          </div>
        </button>
      </div>
    </div>
  </div>
)}
```

- [ ] **Step 5: 提交更改**

```bash
git add packages/electron/src/components/Settings.tsx packages/electron/src/components/Icons.tsx
git commit -m "feat(settings): add appearance tab with light/dark/system theme selector"
```

---

### Task 6: 添加 i18n 翻译（Appearance）

**Files:**
- Modify: `packages/electron/src/i18n/translations.ts`

- [ ] **Step 1: 在 translations.ts 中添加 appearance 翻译**

找到 en 和 zh 两个翻译对象，添加：

```ts
appearance: {
  title: 'Appearance',
  description: 'Choose how web-ai-ide looks to you',
},
```

```ts
appearance: {
  title: '外观',
  description: '选择 web-ai-ide 的显示风格',
},
```

- [ ] **Step 2: 提交更改**

```bash
git add packages/electron/src/i18n/translations.ts
git commit -m "i18n: add appearance translations for theme settings"
```

---

### Task 7: 全局样式一致性检查

**Files:**
- Review: `packages/electron/src/App.tsx`
- Review: `packages/cli/src/App.tsx`

- [ ] **Step 1: 确保App组件正确使用iOS风格类**

检查 App.tsx 中是否有硬编码的 slate/gray 等 Tailwind 颜色，如有则替换为 CSS 变量类。

- [ ] **Step 2: 提交更改（如有）**

```bash
git add packages/electron/src/App.tsx packages/cli/src/App.tsx
git commit -m "style: update App components to use iOS design tokens"
```

---

## Spec Coverage Check

| Spec Section | Task(s) |
|--------------|---------|
| 色彩系统 - 浅色模式 | Task 1, 2 |
| 色彩系统 - 深色模式 | Task 1, 2 |
| 圆角系统 | Task 1, 2, 3 |
| 毛玻璃效果 | Task 1, 2 |
| 阴影系统 | Task 1, 2 |
| 字体系统 | Task 1, 2 |
| 过渡动画 | Task 1, 2 |
| 组件规范 | Task 5, 7 |
| 实现方案 - Tailwind darkMode | Task 3 |
| 实现方案 - CSS变量 | Task 1, 2 |
| 实现方案 - 主题切换机制 | Task 4, 5, 6 |
| 双主题支持 | Task 1-7 |

---

## Execution Options

**Plan complete and saved to `docs/superpowers/plans/2026-04-09-ios-ui-style-implementation.md`**

**Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
