# Verification Checklist

- [x] main.ts BrowserWindow webPreferences 添加了 partition: 'no-cache'
- [x] main.tsx Service Worker 注册被条件化（仅非 Electron 环境）
- [x] 构建成功完成，无编译错误
- [ ] 运行 launch.bat 后不再出现 `Unable to move the cache` 错误
- [ ] 运行 launch.bat 后不再出现 `Gpu Cache Creation failed` 错误
- [ ] 运行 launch.bat 后不再出现 `Failed to delete the database` 错误
- [ ] 应用核心功能正常（窗口显示、设置修改等）
