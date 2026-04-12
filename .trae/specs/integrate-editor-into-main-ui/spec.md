# 代码编辑器集成到主界面 Spec

## Why

Editor 组件和 EditorTabs 组件已完整实现，但未集成到 App.tsx 主界面中。当前主界面只展示 Chat 和 Terminal，缺少文件编辑器入口。FileExplorer 组件也已实现但未接入。需要将 Editor + FileExplorer + useFileSystem 联动集成到主界面，使代码编辑器真正可用。

## What Changes

- 修改 `App.tsx` — 引入 Editor、FileExplorer 组件，添加编辑器状态管理，将文件浏览器与编辑器联动
- 修改 `Layout.tsx` — 支持在主内容区域展示编辑器面板（与 Chat 并列或切换）
- 修改 `EditorTabs.tsx` — 添加标签页关闭按钮（X 按钮）
- 添加 i18n 翻译键 — 编辑器面板相关的翻译

## Impact

- Affected code:
  - `packages/electron/src/App.tsx` — 核心改动，引入编辑器状态和组件
  - `packages/electron/src/components/Layout.tsx` — 布局调整，支持编辑器面板
  - `packages/electron/src/components/EditorTabs.tsx` — 添加关闭按钮
  - `packages/electron/src/i18n/translations.types.ts` — 新增翻译类型
  - `packages/electron/src/i18n/zh.translations.ts` — 新增中文翻译
  - `packages/electron/src/i18n/en.translations.ts` — 新增英文翻译

---

## ADDED Requirements

### Requirement: 编辑器面板集成

系统应在主界面中集成代码编辑器面板，当用户选中项目并点击文件时，在编辑器中打开文件。

#### Scenario: 用户选中项目后查看文件
- **WHEN** 用户选中一个项目
- **THEN** 侧边栏显示文件浏览器（FileExplorer）
- **AND** 文件浏览器展示项目的文件树

#### Scenario: 用户点击文件打开编辑器
- **WHEN** 用户在文件浏览器中点击一个文件
- **THEN** 该文件在编辑器面板中以新标签页打开
- **AND** 编辑器显示文件内容，支持语法高亮
- **AND** 如果文件已打开，则切换到该标签页而非重复打开

#### Scenario: 用户编辑文件内容
- **WHEN** 用户在编辑器中修改文件内容
- **THEN** 修改实时反映在编辑器中
- **AND** 通过 `api.writeFile` 保存文件内容

#### Scenario: 用户关闭标签页
- **WHEN** 用户点击标签页上的关闭按钮
- **THEN** 该标签页被关闭
- **AND** 如果关闭的是当前活动标签，自动切换到相邻标签
- **AND** 如果关闭的是最后一个标签，编辑器显示空状态

### Requirement: 编辑器与 Chat 面板布局

系统应在主内容区域同时展示 Chat 和编辑器，采用可切换的标签页布局。

#### Scenario: 默认视图
- **WHEN** 用户选中项目但未打开任何文件
- **THEN** 主内容区域显示 Chat 面板

#### Scenario: 打开文件后
- **WHEN** 用户打开文件
- **THEN** 主内容区域分为上下两部分：上方为编辑器，下方为 Chat
- **AND** 编辑器占据主要空间

### Requirement: 标签页关闭按钮

EditorTabs 组件的每个标签页应有关闭按钮。

#### Scenario: 点击关闭按钮
- **WHEN** 用户点击标签页上的 X 按钮
- **THEN** 调用 `onClose` 回调关闭该标签页

## MODIFIED Requirements

### Requirement: Layout 组件

Layout 组件需支持在主内容区域渲染编辑器面板，当前 Layout 只渲染 children（Chat）和 terminal，需要增加编辑器面板的渲染位置。

## REMOVED Requirements

无
