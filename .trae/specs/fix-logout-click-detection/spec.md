# 修复退出登录按钮点击检测 Spec

## Why
用户报告退出登录弹窗中的退出按钮点击没有响应，需要检查并修复点击事件处理。

## What Changes
- 检查退出按钮的点击区域
- 检查点击事件绑定
- 检查是否有 CSS 样式阻止点击
- 验证 onLogout 回调的传递
- 确保按钮可点击

## Impact
- 受影响的组件：Header.tsx
- 受影响的服务：无
- 受影响的上下文：无

## ADDED Requirements
### Requirement: 退出按钮正确响应点击
系统 SHALL 确保退出登录按钮能够正确响应用户的点击事件。

#### Scenario: 用户点击退出按钮
- **WHEN** 用户点击退出登录按钮
- **THEN** 按钮应该响应点击事件
- **THEN** onLogout 回调应该被调用
- **THEN** 用户菜单应该关闭
- **THEN** 用户应该被退出登录

## MODIFIED Requirements
无

## REMOVED Requirements
无
