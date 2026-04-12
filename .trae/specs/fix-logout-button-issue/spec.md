# 修复退出按钮异常 Spec

## Why
用户报告登录后的退出按钮失效，需要检查并修复退出登录功能。

## What Changes
- 检查退出按钮的渲染逻辑
- 检查退出按钮的点击事件处理
- 检查退出登录后的状态清理
- 验证 localStorage 中 token 和 user 数据的清除
- 确保 UI 状态正确更新

## Impact
- 受影响的组件：Header.tsx, App.tsx
- 受影响的服务：api.ts
- 受影响的上下文：SettingsContext

## ADDED Requirements
### Requirement: 退出按钮正常显示和响应
系统 SHALL 在用户已登录时在 Header 组件中显示退出按钮，并在点击时正确执行退出登录。

#### Scenario: 用户已登录时
- **WHEN** 用户已登录
- **THEN** Header 显示用户邮箱和头像图标
- **THEN** 点击用户按钮显示下拉菜单
- **THEN** 下拉菜单中包含退出登录选项

#### Scenario: 点击退出登录
- **WHEN** 用户点击退出登录按钮
- **THEN** 清除 localStorage 中的 auth_token 和 user 数据
- **THEN** 清除 api 服务中的 authToken
- **THEN** 重置 user 状态为 null
- **THEN** 重置 selectedProjectId 和 selectedSessionId 为 null
- **THEN** 清空 projects 列表
- **THEN** UI 更新为未登录状态

## MODIFIED Requirements
无

## REMOVED Requirements
无
