# Tasks

## Phase 1: i18n 翻译键准备

- [x] Task 1.1: 检查并补充 translations.ts 中缺失的翻译键
  - 检查 AboutDialog 需要的翻译键（版本号、版权、按钮）
  - 检查 ToolCallCard 需要的翻译键（Tool Request、Approve、Reject）
  - 检查 Editor 需要的翻译键（Open a file to start editing）
  - 检查 FileExplorer 需要的翻译键（Files、New File、Delete 等）
  - 检查 PTYTerminal 需要的翻译键（OpenClaude CLI、Connecting、Connected、Close terminal）
  - 检查 App.tsx alert/prompt 需要的翻译键
  - 已补充中英文翻译

## Phase 2: 组件 i18n 修复

- [x] Task 2.1: 修复 AboutDialog.tsx i18n 违规
  - 将硬编码文本改为 t() 调用
  - 涉及行：70, 75, 79, 85, 89, 93, 100, 108

- [x] Task 2.2: 修复 ToolCallCard.tsx i18n 违规
  - 将 'Tool Request'、'Approve'、'Reject' 改为 t()

- [x] Task 2.3: 修复 Editor.tsx i18n 违规
  - 将 'Open a file to start editing' 改为 t()

- [x] Task 2.4: 修复 FileExplorer.tsx i18n 违规
  - 将 'Files'、'New File'、'No files yet...'、'Delete' 改为 t()

- [x] Task 2.5: 修复 PTYTerminal.tsx i18n 违规
  - 将 'OpenClaude CLI'、'Connecting...'、'Connected'、'Close terminal' 改为 t()

- [x] Task 2.6: 修复 App.tsx i18n 违规
  - 将 alert/prompt 消息改为 t()

## Phase 3: 调试代码清理

- [x] Task 3.1: 清理 App.tsx console.log
  - 删除第 196、206 行的 console.log

- [x] Task 3.2: 清理 Header.tsx console.log
  - 删除第 69、72、75、79 行的 console.log

## Phase 4: 导入顺序修复

- [x] Task 4.1: 修复 App.tsx 导入顺序
  - 重组导入顺序为：标准库 → 第三方 → 内部模块

## Phase 5: 类型修复

- [x] Task 5.1: 修复 api.ts handleApiError 返回类型 (误报，never 类型是正确的)

## Task Dependencies

- Task 2.1-2.6 依赖 Task 1.1（需要先确认翻译键存在）
- 其他任务无依赖关系，可以并行执行

## 暂不处理

以下问题本次不处理（属于重构范围）：
- snake_case 命名问题（需评估数据迁移风险）
- 文件行数超限（需较大重构）