# Tasks

- [ ] Task 1: 为 EditorTabs 添加关闭按钮
  - [ ] SubTask 1.1: 在 EditorTabsProps 接口中添加 `onClose: (path: string) => void` 属性
  - [ ] SubTask 1.2: 在每个标签按钮中添加 X 关闭图标，点击时调用 `onClose`
  - [ ] SubTask 1.3: 关闭按钮样式：hover 时变红，与标签文字有间距

- [ ] Task 2: 添加 i18n 翻译键
  - [ ] SubTask 2.1: 在 translations.types.ts 的 editor 对象中添加 `closeTab`、`noOpenFiles`、`editorPanel` 翻译键类型
  - [ ] SubTask 2.2: 在 zh.translations.ts 中添加对应中文翻译
  - [ ] SubTask 2.3: 在 en.translations.ts 中添加对应英文翻译

- [ ] Task 3: 修改 App.tsx 集成编辑器和文件浏览器
  - [ ] SubTask 3.1: 导入 Editor、FileExplorer、useFileSystem、EditorFile 类型
  - [ ] SubTask 3.2: 添加编辑器状态：`openFiles: EditorFile[]`、`activeFilePath: string | null`
  - [ ] SubTask 3.3: 使用 useFileSystem hook 获取文件树和文件操作方法
  - [ ] SubTask 3.4: 实现文件打开逻辑：点击文件→读取内容→添加到 openFiles→设置 activeFilePath
  - [ ] SubTask 3.5: 实现文件内容修改回调：更新 openFiles 中对应文件的内容
  - [ ] SubTask 3.6: 实现标签页关闭逻辑：从 openFiles 移除文件，自动切换活动标签
  - [ ] SubTask 3.7: 实现文件保存逻辑：修改内容后调用 api.writeFile 保存
  - [ ] SubTask 3.8: 在 Layout 中渲染 FileExplorer（侧边栏下方）和 Editor（主内容区域）

- [ ] Task 4: 调整布局，编辑器与 Chat 共存
  - [ ] SubTask 4.1: 当有文件打开时，主内容区域上方显示 Editor，下方显示 Chat
  - [ ] SubTask 4.2: 当没有文件打开时，主内容区域全屏显示 Chat
  - [ ] SubTask 4.3: 编辑器区域可调整高度或占据合理比例（如 60% 编辑器 + 40% Chat）

- [ ] Task 5: 验证构建和功能
  - [ ] SubTask 5.1: 运行 `npm run build` 确认无 TypeScript 错误
  - [ ] SubTask 5.2: 验证文件浏览器→编辑器→标签页的完整流程

# Task Dependencies

- [Task 2] depends on [Task 1] (翻译键 closeTab 需要关闭按钮功能)
- [Task 3] depends on [Task 1] (App.tsx 需要使用 EditorTabs 的 onClose 回调)
- [Task 3] depends on [Task 2] (App.tsx 中使用新的翻译键)
- [Task 4] depends on [Task 3] (布局调整依赖编辑器集成)
- [Task 5] depends on [Task 4] (验证依赖所有功能完成)
