# Tasks
- [x] Task 1: 检查退出按钮的渲染逻辑
  - [x] 验证 Header 组件中用户菜单的显示条件
  - [x] 验证退出登录按钮的渲染
  - [x] 验证退出按钮的点击事件处理
- [x] Task 2: 检查退出登录的状态管理
  - [x] 验证 App.tsx 中 handleLogout 函数的实现
  - [x] 验证 localStorage 数据清除
  - [x] 验证 api.setAuthToken 的调用
  - [x] 验证用户状态重置
- [x] Task 3: 检查项目状态清理
  - [x] 验证 projects 列表清空
  - [x] 验证 selectedProjectId 重置
  - [x] 验证 selectedSessionId 重置
- [x] Task 4: 测试和验证
  - [x] 测试已登录状态下退出按钮显示
  - [x] 测试点击退出按钮的功能
  - [x] 测试退出后 UI 状态更新
  - [x] 测试退出后重新登录

# Task Dependencies
- [Task 2] depends on [Task 1]
- [Task 3] depends on [Task 2]
- [Task 4] depends on [Task 3]
