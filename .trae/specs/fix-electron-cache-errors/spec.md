# Electron Cache Errors 修复 Spec

## Why

运行 `launch.bat` 启动生产模式 Electron 应用时，出现多个缓存相关错误：
- `Unable to move the cache: 拒绝访问。(0x5)` - 权限错误
- `Unable to create cache` - 缓存创建失败
- `Gpu Cache Creation failed: -2` - GPU 缓存创建失败
- `Failed to delete the database: Database IO error` - Service Worker 数据库 IO 错误

这些错误虽然应用仍能运行，但可能影响性能和用户体验，且表明存在潜在问题。

## What Changes

- 在 Electron main 进程中禁用 Chromium 的缓存功能
- 添加启动参数来避免缓存相关的权限问题
- 优化应用启动时的设置加载逻辑，避免重复调用

## Impact

- 受影响的功能：Electron 应用启动
- 影响区域：`packages/electron/electron/main.ts`
- 预期影响：缓存功能被禁用，但应用核心功能不受影响（缓存主要用于性能优化，非必需）

## REMOVED Requirements

### Requirement: Chromium 默认缓存
**Reason**: 在生产环境 EXE 中，Chromium 缓存会导致权限错误，且对于开发/内部使用场景性能影响可接受
**Migration**: 通过启动参数禁用缓存

## ADDED Requirements

### Requirement: 禁用 Chromium 缓存
系统 SHALL 在 Electron 启动时禁用以下缓存功能：
- GPU 缓存
- 磁盘缓存
- Service Worker 缓存
- 应用缓存

#### Scenario: 生产环境启动
- **WHEN** 用户运行 `launch.bat`
- **THEN** 不应该出现任何缓存相关的错误日志

### Requirement: 优化设置加载
系统 SHALL 避免在应用启动时重复加载设置
- **WHEN** 应用启动
- **THEN** 设置应该只被加载一次，而不是多次
