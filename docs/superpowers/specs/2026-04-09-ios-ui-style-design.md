# iOS 17/18 现代风格 UI 设计规范

## 概述

本规范定义了将 web-ai-ide UI 修改为 iOS 17/18 现代风格的设计方向。

## 设计方向

### 核心风格特征
- **iOS 17/18 现代风格**：圆角更大、毛玻璃效果、半透明层、柔和阴影
- 接近 Apple 官方 App（如设置、备忘录）的设计语言

### 主题支持
- **双主题系统**：浅色模式 + 深色模式
- **手动切换**：类似 iOS 系统的"外观"设置
- **自适应强调色**：浅色用 iOS 蓝（#007AFF），深色用青蓝（#64D2FF）

---

## 色彩系统

### 浅色模式

```css
:root {
  /* 背景层级 */
  --color-bg-primary: #FFFFFF;
  --color-bg-secondary: #F2F2F7;
  --color-bg-tertiary: #E5E5EA;
  --color-bg-elevated: #FFFFFF;

  /* 毛玻璃 */
  --color-surface: rgba(255, 255, 255, 0.72);
  --color-surface-hover: rgba(255, 255, 255, 0.85);

  /* 边框 */
  --color-border: rgba(0, 0, 0, 0.06);
  --color-border-hover: rgba(0, 0, 0, 0.12);

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
}
```

### 深色模式

```css
:root.dark {
  /* 背景层级 - 稍带紫调的深灰 */
  --color-bg-primary: #1C1C1E;
  --color-bg-secondary: #2C2C2E;
  --color-bg-tertiary: #3A3A3C;
  --color-bg-elevated: #2C2C2E;

  /* 毛玻璃 */
  --color-surface: rgba(44, 44, 46, 0.72);
  --color-surface-hover: rgba(58, 58, 60, 0.85);

  /* 边框 */
  --color-border: rgba(255, 255, 255, 0.08);
  --color-border-hover: rgba(255, 255, 255, 0.16);

  /* 文字层级 */
  --color-text-primary: #FFFFFF;
  --color-text-secondary: #EBEBF5;
  --color-text-tertiary: #8E8E93;
  --color-text-muted: #636366;

  /* 强调色 - 青蓝色 */
  --color-accent: #64D2FF;
  --color-accent-hover: #85E0FF;
  --color-accent-subtle: rgba(100, 210, 255, 0.15);
  --color-accent-glow: rgba(100, 210, 255, 0.25);

  /* 状态色 */
  --color-success: #30D158;
  --color-success-subtle: rgba(48, 209, 88, 0.15);
  --color-warning: #FF9F0A;
  --color-warning-subtle: rgba(255, 159, 10, 0.15);
  --color-error: #FF453A;
  --color-error-subtle: rgba(255, 69, 58, 0.15);
}
```

---

## 圆角系统

```css
:root {
  --radius-xs: 6px;   /* 小标签、Badge */
  --radius-sm: 8px;   /* 按钮、输入框 */
  --radius-md: 12px; /* 卡片、面板 */
  --radius-lg: 16px; /* 大卡片、弹窗 */
  --radius-xl: 20px; /* 浮动面板、侧边栏 */
  --radius-2xl: 24px; /* 模态框 */
  --radius-full: 9999px; /* 圆形按钮、药丸形 */
}
```

---

## 毛玻璃效果

```css
.glass-panel {
  background: var(--color-surface);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid var(--color-border);
}

.glass-panel-elevated {
  background: var(--color-bg-elevated);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid var(--color-border);
}
```

---

## 阴影系统

```css
:root {
  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.08);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.12);
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.16);
  --shadow-xl: 0 16px 48px rgba(0, 0, 0, 0.2);
  --shadow-glow: 0 0 20px var(--color-accent-glow);
}
```

---

## 字体系统

```css
:root {
  --font-sans: 'SF Pro Text', 'Instrument Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-display: 'SF Pro Display', 'Instrument Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'SF Mono', 'JetBrains Mono', 'Fira Code', monospace;
}
```

字体大小层级沿用 iOS 规范：
- 大标题：34px / 700
- 标题1：28px / 700
- 标题2：22px / 700
- 标题3：20px / 600
- 正文：17px / 400
- 副标题：15px / 400
- 注释：13px / 400
- 最小：12px / 400

---

## 过渡动画

```css
:root {
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-base: 200ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-spring: 400ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

---

## 组件规范

### 按钮

| 类型 | 圆角 | 背景 | 文字 |
|------|------|------|------|
| Primary | var(--radius-sm) | var(--color-accent) | #FFFFFF |
| Secondary | var(--radius-sm) | var(--color-accent-subtle) | var(--color-accent) |
| Tertiary | var(--radius-sm) | transparent | var(--color-accent) |
| Destructive | var(--radius-sm) | var(--color-error-subtle) | var(--color-error) |

### 卡片

- 圆角：var(--radius-lg)
- 背景：毛玻璃或纯色背景
- 内边距：16-20px
- 阴影：var(--shadow-sm)

### 输入框

- 圆角：var(--radius-sm)
- 背景：var(--color-bg-secondary)
- 高度：44px（iOS标准触控高度）
- 聚焦：2px var(--color-accent) 边框

### 侧边栏

- 圆角：var(--radius-xl)（右侧）
- 宽度：280-320px
- 背景：毛玻璃

---

## 实现方案

### 技术选型
- **方案：Tailwind darkMode + CSS变量**
- 利用 `darkMode: 'class'` 根据切换的 class 自动切换主题
- 所有颜色定义为 CSS 变量，浅色/深色各一套
- 通过 JS 控制 class 切换，完全掌控

### 文件修改
1. `packages/electron/src/index.css` - 主样式文件
2. `packages/cli/src/index.css` - CLI 样式文件
3. `tailwind.config.js` - Tailwind 配置
4. `SettingsContext.tsx` - 主题状态管理
5. `Header.tsx` 或 `Settings.tsx` - 主题切换UI

### 主题切换机制
1. 默认跟随系统（prefers-color-scheme）
2. 用户可通过设置手动切换
3. 选择记录到 localStorage
4. 同时支持浅色/深色/系统三选项

---

## 预期效果

### 浅色模式
- 干净透亮的白色背景
- 柔和的灰色层级
- iOS经典蓝色强调
- 微妙的毛玻璃效果

### 深色模式
- 稍带紫色调的深灰背景
- 柔和的文字对比度
- 青蓝色强调色
- 适度的毛玻璃透明度

---

## 修订历史

| 日期 | 描述 |
|------|------|
| 2026-04-09 | 初始规范 |
