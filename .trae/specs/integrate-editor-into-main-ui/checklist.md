# Checklist

- [ ] EditorTabs 组件支持 `onClose` 回调，每个标签页有关闭按钮（X）
- [ ] 关闭按钮 hover 时变红，点击时调用 `onClose(path)` 而非切换标签
- [ ] translations.types.ts 中 editor 对象新增 `closeTab`、`noOpenFiles`、`editorPanel` 翻译键
- [ ] zh.translations.ts 和 en.translations.ts 同步添加对应翻译
- [ ] App.tsx 导入 Editor、FileExplorer、useFileSystem、EditorFile
- [ ] App.tsx 管理 `openFiles` 和 `activeFilePath` 状态
- [ ] 点击文件浏览器中的文件时，文件在编辑器中以新标签页打开
- [ ] 已打开的文件不会重复打开，而是切换到对应标签页
- [ ] 编辑器中修改文件内容后，通过 `api.writeFile` 保存
- [ ] 关闭标签页时，自动切换到相邻标签或显示空状态
- [ ] 有文件打开时，主内容区域上方显示 Editor，下方显示 Chat
- [ ] 没有文件打开时，主内容区域全屏显示 Chat
- [ ] `npm run build` 构建成功，无 TypeScript 错误
