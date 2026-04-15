# 布局拖动调整功能设计

## 1. 概述

为 Web AI IDE 的 Layout 组件添加侧边栏宽度和终端高度的拖动调整功能，提升用户自定义界面布局的灵活性。

## 2. 功能需求

### 2.1 可拖动区域
- **侧边栏宽度**：左侧 Sidebar 右侧边缘可拖动
- **终端高度**：底部 Terminal 顶部边缘可拖动

### 2.2 尺寸限制
- 侧边栏宽度：最小 120px，最大 400px，默认 256px
- 终端高度：最小 100px，最大 600px，默认 320px

### 2.3 用户交互
- 鼠标悬停在分隔条上时显示高亮指示
- 拖动时实时更新尺寸
- 拖动过程中显示尺寸预览
- 释放鼠标时保存最终尺寸

## 3. 技术方案

### 3.1 新建 ResizeHandle 组件

创建 `packages/electron/src/components/ResizeHandle.tsx`：

```tsx
interface ResizeHandleProps {
  direction: 'horizontal' | 'vertical';
  onResize: (delta: number) => void;
  min: number;
  max: number;
}
```

**功能**：
- 支持水平（调整宽度）和垂直（调整高度）两种模式
- 监听 mousedown/mousemove/mouseup 事件
- 拖动时调用 onResize 回调传入像素偏移量

**样式**：
- 默认：2px 宽/高，透明或 `border-[var(--color-border)]`
- Hover：`border-[var(--color-accent)]`，cursor 为 `col-resize` 或 `row-resize`
- 拖动中：高亮显示

### 3.2 修改 Layout.tsx

**新增状态**：
```tsx
const [sidebarWidth, setSidebarWidth] = useState(256);
const [terminalHeight, setTerminalHeight] = useState(320);
```

**侧边栏分隔条**：
- 位置：侧边栏右侧边缘
- 组件：`<ResizeHandle direction="horizontal" />`
- 事件处理：调整 sidebarWidth

**终端分隔条**：
- 位置：终端顶部边缘
- 组件：`<ResizeHandle direction="vertical" />`
- 事件处理：调整 terminalHeight

### 3.3 样式集成

分隔条样式遵循现有设计系统：
- 使用 CSS 变量 `var(--color-border)` 和 `var(--color-accent)`
- 使用 Tailwind CSS 类

## 4. 文件变更

| 文件 | 操作 |
|------|------|
| `packages/electron/src/components/ResizeHandle.tsx` | 新建 |
| `packages/electron/src/components/Layout.tsx` | 修改 |

## 5. 测试要点

- [ ] 侧边栏宽度拖动调整正常工作
- [ ] 终端高度拖动调整正常工作
- [ ] 尺寸限制（最小/最大）正常工作
- [ ] 拖动时 UI 不会卡顿
- [ ] 组件样式与现有设计一致