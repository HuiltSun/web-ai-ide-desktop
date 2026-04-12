# 修复代码风格违规 Spec

## Why

`CODE_STYLE_VIOLATIONS.md` 中记录了约 30+ 处代码风格违规，涉及命名规范、i18n 国际化、文件长度、调试代码等问题，需要逐一修复以提升代码质量。

## What Changes

### 1. 命名规范修复
- 将 `snake_case` 接口属性改为 `camelCase`（涉及 main.ts、preload.ts、types.ts、SettingsContext.tsx）
- 布尔变量命名优化（如有）

### 2. i18n 国际化修复
- AboutDialog.tsx：版本号、版权信息、按钮文本等改为 i18n 翻译
- ToolCallCard.tsx：`'Tool Request'`、`'Approve'`、`'Reject'` 改为 i18n
- Editor.tsx：`'Open a file to start editing'` 改为 i18n
- FileExplorer.tsx：`'Files'`、`'New File'`、`'Delete'` 等改为 i18n
- PTYTerminal.tsx：`'OpenClaude CLI'`、`'Connected'`、`'Close terminal'` 等改为 i18n
- App.tsx：alert/prompt 消息改为 i18n

### 3. 调试代码清理
- App.tsx：删除 `console.log('handleLogout 被调用')` 等调试代码
- Header.tsx：删除多处 `console.log` 调试代码

### 4. 导入顺序修复
- App.tsx：重组导入顺序为"标准库→第三方→内部模块"

### 5. 类型修复
- api.ts：`handleApiError` 返回类型从 `never` 改为 `void`（实际使用 throw）

## Impact

- Affected specs: 无
- Affected code:
  - `electron/main.ts` - StoreSchema 接口
  - `electron/preload.ts` - SettingsData 接口
  - `src/types.ts` - SettingsData 接口
  - `src/contexts/SettingsContext.tsx` - 设置存储键名
  - `src/components/AboutDialog.tsx` - i18n 文本
  - `src/components/ToolCallCard.tsx` - i18n 文本
  - `src/components/Editor.tsx` - i18n 文本
  - `src/components/FileExplorer.tsx` - i18n 文本
  - `src/components/PTYTerminal.tsx` - i18n 文本
  - `src/components/App.tsx` - i18n、console.log、导入顺序
  - `src/components/Header.tsx` - console.log
  - `src/services/api.ts` - 类型修复

## ADDED Requirements

### Requirement: snake_case 接口属性命名
- **WHEN** TypeScript 接口定义中需要定义设置相关属性
- **THEN** 必须使用 camelCase 命名（如 `aiProviders` 而非 `ai_providers`）

### Requirement: 用户可见文本必须 i18n 化
- **WHEN** 组件中需要显示用户可见的文本
- **THEN** 必须使用 `useSettings()` 获取翻译 `t` 对象，禁止硬编码

### Requirement: 禁止保留调试代码
- **WHEN** 项目发布或提交前
- **THEN** 必须删除所有 `console.log` 调试代码

## MODIFIED Requirements

### Requirement: 导入顺序规范
- **WHEN** 导入多个模块时
- **THEN** 按顺序：标准库 → 第三方 → 内部模块，组间空一行

## REMOVED Requirements

无

## 注意事项

1. **snake_case 问题**：main.ts、preload.ts、types.ts 中的 snake_case 是与 Electron store 或 localStorage 交互的键名，修改可能导致数据丢失。需要评估：
   - 选项A：保持 store 键为 snake_case，仅在 TypeScript 接口中使用 camelCase 映射
   - 选项B：迁移现有数据，将所有键改为 camelCase
   - 建议采用选项A，在 SettingsContext 中做键名映射

2. **文件行数超限**：Settings.tsx、SettingsContext.tsx、App.tsx 超出 300 行限制，考虑拆分但本次暂不处理（属于重构范围）

3. **i18n 翻译键**：需要先确认 translations.ts 中是否有对应翻译键，如有则复用，如无则添加