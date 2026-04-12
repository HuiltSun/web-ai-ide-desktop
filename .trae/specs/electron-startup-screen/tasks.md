# Tasks

- [ ] Task 1: 复制并适配 `openclaude-temp/src/components/StartupScreen.ts` 到 `electron/src/utils/startupScreen.ts`
  - [ ] SubTask 1.1: 复制 StartupScreen.ts 基础代码（渐变函数、颜色、边框绘制）
  - [ ] SubTask 1.2: 创建 ASCII Logo "WEB" + "AI" + "IDE" 替换原有 Logo
  - [ ] SubTask 1.3: 修改 Provider 检测逻辑从 electron-store 获取
  - [ ] SubTask 1.4: 修改版本号获取从 package.json

- [ ] Task 2: 修改 `electron/electron/main.ts` 在启动时调用 `printStartupScreen()`
  - [ ] SubTask 2.1: 导入 `printStartupScreen`
  - [ ] SubTask 2.2: 在 `app.whenReady()` 之前调用

- [ ] Task 3: 验证构建和运行
  - [ ] SubTask 3.1: 运行 `npm run build` 确认无错误
  - [ ] SubTask 3.2: 确认终端输出正确显示
