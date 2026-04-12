# 修复登录按钮异常 Spec

## Why
用户报告通过 `launch.bat` 启动的 IDE 中登录按钮出现异常，需要检查并修复登录按钮的功能和显示问题。

## What Changes
- 检查登录按钮的渲染逻辑
- 检查登录按钮的点击事件处理
- 检查登录模态框的显示/隐藏逻辑
- 验证用户状态管理是否正确
- **检查启动时的登录状态初始化逻辑**
- **验证 localStorage 中 token 的读取和验证流程**
- **确保用户状态与 UI 的同步**
- 确保翻译文本正确加载

## Impact
- 受影响的组件：Header.tsx, LoginModal.tsx, App.tsx
- 受影响的服务：api.ts
- 受影响的上下文：SettingsContext

## ADDED Requirements
### Requirement: 登录按钮正常显示和响应
系统 SHALL 在 Header 组件中正确显示登录按钮，并在点击时打开登录模态框。

#### Scenario: 用户未登录时
- **WHEN** 用户未登录
- **THEN** Header 显示用户图标按钮
- **THEN** 点击按钮打开登录模态框

#### Scenario: 用户已登录时
- **WHEN** 用户已登录
- **THEN** Header 显示用户邮箱和头像
- **THEN** 点击按钮显示用户菜单（包含退出登录选项）

### Requirement: 启动时登录状态初始化
系统 SHALL 在应用启动时正确初始化和恢复用户的登录状态。

#### Scenario: 有效 token 存在
- **WHEN** localStorage 中存在有效的 auth_token
- **THEN** 应用启动时自动验证 token
- **THEN** 验证成功后恢复用户状态
- **THEN** 自动加载用户的项目列表

#### Scenario: token 无效或过期
- **WHEN** localStorage 中的 token 无效或过期
- **THEN** 自动清除无效的 token 和用户数据
- **THEN** 显示未登录状态

#### Scenario: 无 token
- **WHEN** localStorage 中不存在 auth_token
- **THEN** 显示未登录状态
- **THEN** 用户可以点击登录按钮进行登录

## MODIFIED Requirements
### Requirement: 错误处理
确保所有登录相关的错误都能正确显示给用户。

## REMOVED Requirements
无
