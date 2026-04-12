# Electron Cache Errors 修复 Spec (更新版)

## Why

运行 `launch.bat` 启动生产模式 Electron 应用时，出现多个缓存相关错误：
- `Unable to move the cache: 拒绝访问。 (0x5)` - 权限错误
- `Unable to create cache` - 缓存创建失败
- `Gpu Cache Creation failed: -2` - GPU 缓存创建失败
- `Failed to delete the database: Database IO error` - Service Worker 数据库 IO 错误

之前的修复尝试添加了 `app.commandLine.appendSwitch()` 但错误仍然存在，因为：
1. 命令行开关对 Service Worker 缓存无效
2. Service Worker 在 renderer 中注册，创建独立的缓存存储
3. 需要在 BrowserWindow webPreferences 中配置 partition 或完全禁用 Service Worker

## What Changes

- 在 Electron main 进程中禁用 Chromium 的缓存功能
- 在 BrowserWindow webPreferences 中设置 `partition: 'no-cache'` 来禁用渲染器缓存
- 移除或条件化 Service Worker 注册（在 Electron 环境中不应使用）

## Impact

- 受影响的功能：Electron 应用启动
- 影响区域：
  - `packages/electron/electron/main.ts`
  - `packages/electron/src/main.tsx`
- 预期影响：所有缓存功能被禁用，应用核心功能不受影响

## ADDED Requirements

### Requirement: 禁用 Chromium 渲染器缓存
系统 SHALL 在 BrowserWindow webPreferences 中配置 partition 为 'no-cache' 来完全禁用渲染器进程的缓存功能

#### Scenario: 生产环境启动
- **WHEN** 用户运行 `launch.bat`
- **THEN** 不应该出现任何缓存相关的错误日志

### Requirement: 禁用 Service Worker
系统 SHALL 在 Electron 生产环境中禁用 Service Worker 注册

#### Scenario: Service Worker 注册
- **WHEN** Electron 应用在生产模式启动
- **THEN** Service Worker 不应被注册，避免 `service_worker_storage.cc` 错误
