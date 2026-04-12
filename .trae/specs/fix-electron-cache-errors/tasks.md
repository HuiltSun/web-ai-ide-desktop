# Tasks

- [x] Task 1: 在 main.ts BrowserWindow webPreferences 中添加 partition: 'no-cache'
  - 修改 webPreferences 配置，添加 partition 选项

- [x] Task 2: 条件化 Service Worker 注册
  - 在 main.tsx 中检查是否在 Electron 环境
  - 仅在非 Electron 环境注册 Service Worker

- [x] Task 3: 重新构建并测试
  - 运行 npm run build 构建生产版本
  - 运行 launch.bat 验证缓存错误是否消失

# Task Dependencies
- [Task 2] 可以与 [Task 1] 并行进行
- [Task 3] 依赖 [Task 1, Task 2]
