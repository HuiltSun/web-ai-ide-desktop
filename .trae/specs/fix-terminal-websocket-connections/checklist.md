# Checklist

## 排查

- [ ] 已排查 TerminalPanel 标签页初始化逻辑，确认 addTab() 调用次数
- [ ] 已排查 usePTY connect() 调用时机和 useCallback 依赖
- [ ] 已排查 PTYClient WebSocket 创建逻辑和连接关闭机制

## 修复

- [ ] TerminalPanel 初始化时只创建 1 个默认标签页
- [ ] usePTY connect() 在已有活跃连接时直接返回不创建新连接
- [ ] PTYClient connect() 在创建新连接前关闭旧连接
- [ ] 组件卸载时 WebSocket 连接被正确关闭

## 验证

- [ ] 登录后 /ws/terminal 连接数量为 1
- [ ] 创建 3 个标签页后连接数量为 3
- [ ] 关闭所有标签页后无残留连接
- [ ] npm run build 构建成功无错误
