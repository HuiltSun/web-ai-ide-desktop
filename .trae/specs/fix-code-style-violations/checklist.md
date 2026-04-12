# Checklist

## i18n 翻译键准备

- [x] Task 1.1: translations.ts 中已补充所有缺失翻译键

## 组件 i18n 修复

- [x] Task 2.1: AboutDialog.tsx i18n 修复完成
  - [x] 版本号文本已改为 t()
  - [x] 版权信息已改为 t()
  - [x] 按钮文本已改为 t()

- [x] Task 2.2: ToolCallCard.tsx i18n 修复完成
  - [x] 'Tool Request' 已改为 t()
  - [x] 'Approve' 已改为 t()
  - [x] 'Reject' 已改为 t()

- [x] Task 2.3: Editor.tsx i18n 修复完成
  - [x] 'Open a file to start editing' 已改为 t()

- [x] Task 2.4: FileExplorer.tsx i18n 修复完成
  - [x] 'Files' 已改为 t()
  - [x] 'New File' 已改为 t()
  - [x] 'No files yet...' 已改为 t()
  - [x] 'Delete' 已改为 t()

- [x] Task 2.5: PTYTerminal.tsx i18n 修复完成
  - [x] 'OpenClaude CLI' 已改为 t()
  - [x] 'Connecting...' 已改为 t()
  - [x] 'Connected' 已改为 t()
  - [x] 'Close terminal' 已改为 t()

- [x] Task 2.6: App.tsx i18n 修复完成
  - [x] 'Select project number' alert 已改为 t()
  - [x] 'Save functionality' alert 已改为 t()
  - [x] 'No project selected' alert 已改为 t()
  - [x] 'Enter new project name' prompt 已改为 t()

## 调试代码清理

- [x] Task 3.1: App.tsx console.log 已清理
  - [x] 'handleLogout 被调用' 已删除
  - [x] '退出登录完成' 已删除

- [x] Task 3.2: Header.tsx console.log 已清理
  - [x] 所有调试 console.log 已删除

## 导入顺序修复

- [x] Task 4.1: App.tsx 导入顺序已修复
  - [x] 导入顺序为：标准库 → 第三方 → 内部模块

## 类型修复

- [x] Task 5.1: api.ts handleApiError 返回类型已修复 (误报，never 类型是正确的)