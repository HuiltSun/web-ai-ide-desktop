# Checklist

- [ ] `electron/src/utils/startupScreen.ts` 文件创建，包含 `printStartupScreen` 导出函数
- [ ] `printStartupScreen()` 检测 `CI` 环境变量和非 TTY 模式并跳过输出
- [ ] 启动画面显示 ASCII Logo (WEB + AI + IDE)
- [ ] 启动画面显示 "AI Coding Environment" 标语
- [ ] 启动画面显示 Provider、Model、Endpoint 信息
- [ ] 启动画面正确区分 local/cloud Provider (颜色不同)
- [ ] `electron/main.ts` 在启动时调用 `printStartupScreen()`
- [ ] `npm run build` 构建成功，无 TypeScript 错误
