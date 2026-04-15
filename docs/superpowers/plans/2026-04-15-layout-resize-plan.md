# 布局拖动调整功能实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 Layout 组件添加侧边栏宽度和终端高度的拖动调整功能

**Architecture:** 创建可复用的 ResizeHandle 组件处理拖动逻辑，在 Layout.tsx 中集成两个方向的调整器。组件遵循现有设计系统，使用 CSS 变量和 Tailwind CSS。

**Tech Stack:** React, TypeScript, Tailwind CSS

---

## 文件结构

| 文件 | 操作 | 职责 |
|------|------|------|
| `packages/electron/src/components/ResizeHandle.tsx` | 新建 | 可复用拖动把手组件 |
| `packages/electron/src/components/Layout.tsx` | 修改 | 集成拖动功能 |

---

### Task 1: 创建 ResizeHandle 组件

**Files:**
- Create: `packages/electron/src/components/ResizeHandle.tsx`

- [ ] **Step 1: 创建 ResizeHandle.tsx 文件**

```tsx
import { useState, useCallback, useEffect } from 'react';

interface ResizeHandleProps {
  direction: 'horizontal' | 'vertical';
  onResize: (delta: number) => void;
  min: number;
  max: number;
  initialSize: number;
  onSizeChange: (size: number) => void;
}

export function ResizeHandle({
  direction,
  onResize,
  min,
  max,
  initialSize,
  onSizeChange,
}: ResizeHandleProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
    },
    []
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = direction === 'horizontal' ? e.movementX : e.movementY;
      onResize(delta);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, direction, onResize]);

  const isHorizontal = direction === 'horizontal';

  return (
    <div
      onMouseDown={handleMouseDown}
      className={`
        ${isHorizontal ? 'w-1 cursor-col-resize' : 'h-1 cursor-row-resize'}
        ${isDragging ? 'bg-[var(--color-accent)]' : 'bg-transparent hover:bg-[var(--color-accent)]/50'}
        transition-colors duration-150 flex-shrink-0
        ${isHorizontal ? 'border-l border-[var(--color-border)] hover:border-[var(--color-accent)]' : 'border-t border-[var(--color-border)] hover:border-[var(--color-accent)]'}
      `}
    />
  );
}
```

- [ ] **Step 2: 提交 ResizeHandle 组件**

---

### Task 2: 修改 Layout.tsx 集成拖动功能

**Files:**
- Modify: `packages/electron/src/components/Layout.tsx:1-165`

- [ ] **Step 1: 添加 useState 导入**

在文件顶部的 import 语句中添加 `useState`（如果尚未导入）

- [ ] **Step 2: 添加尺寸状态和回调函数**

在 Layout 函数组件内添加以下代码：

```tsx
const [sidebarWidth, setSidebarWidth] = useState(256);
const [terminalHeight, setTerminalHeight] = useState(320);

const handleSidebarResize = useCallback((delta: number) => {
  setSidebarWidth((prev) => {
    const newWidth = prev + delta;
    if (newWidth < 120 || newWidth > 400) return prev;
    return newWidth;
  });
}, []);

const handleTerminalResize = useCallback((delta: number) => {
  setTerminalHeight((prev) => {
    const newHeight = prev - delta;
    if (newHeight < 100 || newHeight > 600) return prev;
    return newHeight;
  });
}, []);
```

- [ ] **Step 3: 修改侧边栏 width**

找到侧边栏的 aside 元素：
```tsx
<aside className="w-64 glass-panel border-r border-[var(--color-border)] overflow-y-auto">
```

改为：
```tsx
<aside style={{ width: sidebarWidth }} className="glass-panel border-r border-[var(--color-border)] overflow-y-auto flex-shrink-0">
```

- [ ] **Step 4: 在侧边栏右侧添加水平拖动把手**

在侧边栏 closing tag 之后、main 开始之前添加：

```tsx
<ResizeHandle
  direction="horizontal"
  onResize={handleSidebarResize}
  min={120}
  max={400}
  initialSize={sidebarWidth}
  onSizeChange={setSidebarWidth}
/>
```

- [ ] **Step 5: 修改终端容器高度**

找到终端容器：
```tsx
<div className="h-80 border-t border-[var(--color-border)]">
```

改为：
```tsx
<div style={{ height: terminalHeight }} className="border-t border-[var(--color-border)] flex-shrink-0">
```

- [ ] **Step 6: 在终端顶部添加垂直拖动把手**

在终端容器之前、main 内容区之后添加：

```tsx
{terminal && (
  <>
    <ResizeHandle
      direction="vertical"
      onResize={handleTerminalResize}
      min={100}
      max={600}
      initialSize={terminalHeight}
      onSizeChange={setTerminalHeight}
    />
    <div style={{ height: terminalHeight }} className="border-t border-[var(--color-border)] flex-shrink-0">
      {terminal}
    </div>
  </>
)}
```

注意：需要移除原有的 terminal 渲染逻辑，用新的条件渲染替代。

- [ ] **Step 7: 验证修改后的 Layout.tsx 完整结构**

确保最终结构为：
```
div.flex-1.flex.overflow-hidden
  aside (sidebar with dynamic width)
  ResizeHandle (horizontal, for sidebar)
  main (flex-1)
    div.relative.h-full.flex.flex-col
      div.flex-1.overflow-hidden (editor area)
      ResizeHandle (vertical, for terminal) + terminal div
```

- [ ] **Step 8: 提交 Layout.tsx 修改**

---

### Task 3: 验证功能

**Files:**
- Modify: `packages/electron/src/components/Layout.tsx`

- [ ] **Step 1: 检查组件是否正确导出**

确认 ResizeHandle 组件有正确的 export 或在 Layout.tsx 中正确导入

- [ ] **Step 2: 运行 lint 检查**

确保代码符合项目规范

- [ ] **Step 3: 提交最终代码**

---

## 自检清单

- [ ] ResizeHandle 组件支持 horizontal 和 vertical 两种方向
- [ ] 侧边栏宽度限制在 120-400px 之间
- [ ] 终端高度限制在 100-600px 之间
- [ ] 拖动时样式正确（hover 高亮、cursor 变化）
- [ ] Layout.tsx 结构完整无语法错误