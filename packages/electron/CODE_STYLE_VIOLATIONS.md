# Code Style 违规报告

## 1. 命名规范

### 1.1 snake_case 混入 TypeScript 代码

| 文件 | 行号 | 问题 |
|------|------|------|
| [main.ts](file:///e:/web/web-ai-ide/packages/electron/electron/main.ts) | 22-28 | `StoreSchema` 接口使用 `ai_providers`、`selected_provider`、`selected_model` (snake_case) |
| [preload.ts](file:///e:/web/web-ai-ide/packages/electron/electron/preload.ts) | 16-22 | `SettingsData` 接口使用 `ai_providers`、`selected_provider` (snake_case) |
| [types.ts](file:///e:/web/web-ai-ide/packages/electron/src/types.ts) | 68-76 | `SettingsData` 接口使用 snake_case 键名 (`ai_providers`, `selected_provider`) |
| [SettingsContext.tsx](file:///e:/web/web-ai-ide/packages/electron/src/contexts/SettingsContext.tsx) | 213-218 | localStorage/electron 设置键使用 snake_case (`ai_providers`, `selected_provider`) 与 TypeScript 属性名 `aiProviders` 不一致 |

### 1.2 布尔变量命名

| 文件 | 行号 | 问题 |
|------|------|------|
| [SettingsContext.tsx](file:///e:/web/web-ai-ide/packages/electron/src/contexts/SettingsContext.tsx) | 64 | `isLoggedIn` 可改为 `isUserLoggedIn` 更明确 |

---

## 2. 文件结构 / 模块组织

### 2.1 导入顺序问题

| 文件 | 问题描述 |
|------|----------|
| [App.tsx](file:///e:/web/web-ai-ide/packages/electron/src/App.tsx) | 第11-14行导入组件与 React 导入未按"标准库→第三方→内部模块"顺序分组 |

### 2.2 单文件行数超限 (≤300行)

| 文件 | 行数 | 超出 |
|------|------|------|
| [Settings.tsx](file:///e:/web/web-ai-ide/packages/electron/src/components/Settings.tsx) | ~543 | +243 |
| [SettingsContext.tsx](file:///e:/web/web-ai-ide/packages/electron/src/contexts/SettingsContext.tsx) | ~482 | +182 |
| [App.tsx](file:///e:/web/web-ai-ide/packages/electron/src/App.tsx) | ~391 | +91 |
| [Layout.tsx](file:///e:/web/web-ai-ide/packages/electron/src/components/Layout.tsx) | ~165 | 在限制内 |
| [MenuBar.tsx](file:///e:/web/web-ai-ide/packages/electron/src/components/MenuBar.tsx) | ~199 | 在限制内 |

---

## 3. 代码简洁性

### 3.1 注释掉的死代码

| 文件 | 行号 | 描述 |
|------|------|------|
| [App.tsx](file:///e:/web/web-ai-ide/packages/electron/src/App.tsx) | 93, 101, 113 | `alert('Save functionality...')`、`alert('No project selected...')` 等提示信息为硬编码非 i18n |

### 3.2 console.log 调试代码

| 文件 | 行号 | 问题 |
|------|------|------|
| [App.tsx](file:///e:/web/web-ai-ide/packages/electron/src/App.tsx) | 196, 206 | `console.log('handleLogout 被调用')`、`console.log('退出登录完成')` |
| [Header.tsx](file:///e:/web/web-ai-ide/packages/electron/src/components/Header.tsx) | 69, 72, 75, 79 | 多处 `console.log` 调试代码 |

---

## 4. 接口 / 参数一致性

### 4.1 函数参数超过3个 (应改用对象)

| 文件 | 行号 | 函数签名 |
|------|------|----------|
| [api.ts](file:///e:/web/web-ai-ide/packages/electron/src/services/api.ts) | 44-50 | `getProjectFiles(projectId: string)` - 1个参数 |
| [api.ts](file:///e:/web/web-ai-ide/packages/electron/src/services/api.ts) | 52-58 | `readFile(projectId: string, path: string)` - 2个参数 |
| [api.ts](file:///e:/web/web-ai-ide/packages/electron/src/services/api.ts) | 60-67 | `writeFile(projectId: string, path: string, content: string)` - 3个参数，接近阈值 |
| [api.ts](file:///e:/web/web-ai-ide/packages/electron/src/services/api.ts) | 77-85 | `createProject(name: string, path: string, userId: string)` - 3个参数 |
| [App.tsx](file:///e:/web/web-ai-ide/packages/electron/src/App.tsx) | 240 | `duplicateFile` 函数嵌套深，参数复杂 |

---

## 5. i18n 国际化规则

### 5.1 硬编码用户可见文本

| 文件 | 行号 | 硬编码文本 |
|------|------|------------|
| [App.tsx](file:///e:/web/web-ai-ide/packages/electron/src/App.tsx) | 85 | `'Select project number:\n${projectNames}'` |
| [App.tsx](file:///e:/web/web-ai-ide/packages/electron/src/App.tsx) | 93 | `'Save functionality...'`, `'No project selected...'` |
| [App.tsx](file:///e:/web/web-ai-ide/packages/electron/src/App.tsx) | 106 | `prompt('Enter new project name for "Save As":')` |
| [AboutDialog.tsx](file:///e:/web/webai-ide/packages/electron/src/components/AboutDialog.tsx) | 70, 75, 79, 85, 89, 93, 100, 108 | 版本号、版权信息、按钮文本等硬编码 |
| [ToolCallCard.tsx](file:///e:/web/web-ai-ide/packages/electron/src/components/ToolCallCard.tsx) | 19, 35, 43 | `'Tool Request'`, `'Approve'`, `'Reject'` 硬编码 |
| [Editor.tsx](file:///e:/web/web-ai-ide/packages/electron/src/components/Editor.tsx) | 56 | `'Open a file to start editing'` |
| [FileExplorer.tsx](file:///e:/web/web-ai-ide/packages/electron/src/components/FileExplorer.tsx) | 41, 47, 64, 85 | `'Files'`, `'New File'`, `'No files yet...'`, `'Delete'` |
| [LoginModal.tsx](file:///e:/web/web-ai-ide/packages/electron/src/components/LoginModal.tsx) | 121 | `placeholder="you@example.com"` |
| [PTYTerminal.tsx](file:///e:/web/web-ai-ide/packages/electron/src/components/PTYTerminal.tsx) | 111, 114, 119, 129 | `'OpenClaude CLI'`, `'Connecting...'`, `'Connected'`, `'Close terminal'` |

---

## 6. 其他问题

### 6.1 未使用的导入

| 文件 | 行号 | 问题 |
|------|------|------|
| [FileTree.tsx](file:///e:/web/web-ai-ide/packages/electron/src/components/FileTree.tsx) | 1 | `FileNode` 导入但未使用 (已使用 `file.name`, `file.path`, `file.isDirectory` 等) |

### 6.2 handleApiError 返回类型

| 文件 | 行号 | 问题 |
|------|------|------|
| [api.ts](file:///e:/web/web-ai-ide/packages/electron/src/services/api.ts) | 14 | `handleApiError` 返回类型为 `never`，但实际使用 `throw new Error()` |

---

## 统计摘要

| 违规类别 | 数量 |
|----------|------|
| 命名规范 (snake_case 混入) | 4 |
| 布尔变量命名 | 1 |
| 文件超行数限制 | 3 |
| 硬编码用户文本 (非 i18n) | 15+ |
| 调试 console.log | 6+ |
| 导入顺序 | 1 |

**总计**: 约 30+ 处违规