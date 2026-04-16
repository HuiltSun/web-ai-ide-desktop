# Tasks

## 排查阶段

- [ ] Task 1: 排查 TerminalPanel 标签页初始化逻辑
  - [ ] SubTask 1.1: 检查 addTab() 是否被多次调用
  - [ ] SubTask 1.2: 检查 useEffect 依赖是否导致重复执行
  - [ ] SubTask 1.3: 确认默认标签页数量

- [ ] Task 2: 排查 usePTY connect() 调用时机
  - [ ] SubTask 2.1: 检查 connect() 在 useEffect 中的调用
  - [ ] SubTask 2.2: 确认 useCallback 缓存是否正常工作
  - [ ] SubTask 2.3: 检查 isConnected 状态判断逻辑

- [ ] Task 3: 排查 PTYClient WebSocket 创建逻辑
  - [ ] SubTask 3.1: 检查 connect() 是否为幂等操作
  - [ ] SubTask 3.2: 确认旧连接是否被正确关闭

## 修复阶段

- [ ] Task 4: 修复 TerminalPanel 标签页初始化问题
  - [ ] SubTask 4.1: 添加日志或调试信息确认调用次数
  - [ ] SubTask 4.2: 修复重复 addTab() 调用

- [ ] Task 5: 修复 usePTY 连接去重机制
  - [ ] SubTask 5.1: 确保 connect() 在已有连接时直接返回
  - [ ] SubTask 5.2: 添加 connectionId 追踪

- [ ] Task 6: 修复 PTYClient 连接管理
  - [ ] SubTask 6.1: 确保 connect() 断开旧连接再创建新连接
  - [ ] SubTask 6.2: 添加连接状态追踪

## 验证阶段

- [ ] Task 7: 验证修复效果
  - [ ] SubTask 7.1: 登录后检查 /ws/terminal 连接数量（应为 1）
  - [ ] SubTask 7.2: 创建多个标签页验证连接数量正确
  - [ ] SubTask 7.3: 关闭标签页验证连接正确关闭

# Task Dependencies

- Task 4、5、6 依赖 Task 1、2、3 的排查结果
- Task 7 依赖 Task 4、5、6 的修复完成
