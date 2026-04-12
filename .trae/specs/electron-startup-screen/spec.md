# Web AI IDE 终端启动画面

## Why

当前的 `electron/main.ts` 只有 `electron-log` 日志输出，缺少面向用户的终端启动画面。参考 openclaude 的 `StartupScreen.ts`，需要添加一个在 Electron 主进程启动时显示的终端欢迎界面。

## What Changes

- 新建 `electron/src/utils/startupScreen.ts` — 终端启动画面模块
- 修改 `electron/main.ts` — 在应用启动时调用启动画面
- 添加 i18n 翻译键 — 启动画面使用的翻译

## Impact

- Affected code:
  - `electron/main.ts` — 调用 `printStartupScreen()`
  - 新增 `electron/src/utils/startupScreen.ts`

---

## ADDED Requirements

### Requirement: 终端启动画面

系统应在 Electron 应用启动时，在终端输出带有品牌 Logo、Provider 信息和状态指示的启动画面。

#### Scenario: 正常启动
- **WHEN** Electron 应用启动
- **THEN** 在终端输出 ASCII Logo（渐变色）
- **AND** 显示 "Web AI IDE" 标语
- **AND** 显示 Provider、Model、Endpoint 信息
- **AND** 显示 "Ready" 状态

#### Scenario: 非交互模式/CI 环境
- **WHEN** `process.stdout.isTTY` 为 `false` 或 `CI` 环境变量存在
- **THEN** 跳过启动画面，不输出任何内容

---

## Design

### 输出格式

```
  ████████╗ ████████╗ ████████╗ ██╗  ██╗
  ██╔═══██║ ██╔═══██║ ██╔═════╝ ███╗ ██║
  ██║   ██║ ████████║ ██████╗   ████╗██║
  ██║   ██║ ██╔═════╝ ██╔═══╝   ██╔████║
  ████████║ ██║       ████████╗ ██║ ╚███║
  ╚═══════╝ ╚═╝       ╚═══════╝ ╚═╝  ╚══╝

  ████████╗ ██╗      ████████╗ ██╗   ██╗ ████████╗ ████████╗
  ██╔═════╝ ██║      ██╔═══██║ ██║   ██║ ██╔═══██║ ██╔═════╝
  ██║       ██║      ████████║ ██║   ██║ ██║   ██║ ██████╗
  ██║       ██║      ██╔═══██║ ██║   ██║ ██║   ██║ ██╔═══╝
  ████████║ ████████╗██║   ██║ ╚██████╔╝ ████████║ ████████╗
  ╚═══════╝ ╚═══════╝╚═╝   ╚═╝  ╚═════╝  ╚═══════╝ ╚═══════╝

  ✦ AI Coding Environment ✦

╔════════════════════════════════════════════════════════════╗
│ Provider  OpenAI                                         │
│ Model     gpt-4o                                         │
│ Endpoint  https://api.openai.com/v1                     │
╠════════════════════════════════════════════════════════════╣
│ ● cloud    Ready                                        │
╚════════════════════════════════════════════════════════════╝
  Web AI IDE v1.0.0
```

### 颜色方案

- Logo 渐变：日落色系 (橙色 → 红色)
- 边框：深棕色
- 文字：米色/浅色
- Local Provider：绿色 (表示本地模型)
- Cloud Provider：橙色 (表示云端模型)

### 依赖检测

从 `electron-store` 获取当前选定的 Provider 配置，检测是否为本地模型 (localhost/ollama)。

### 实现方式

复制 `openclaude-temp/src/components/StartupScreen.ts` 的**全部内容**到 `electron/src/utils/startupScreen.ts`，然后进行适配修改：

需要复制的完整内容：
- ASCII Logo 生成函数 (`paintLine`, `gradAt`, `lerp`)
- 颜色定义 (SUNSET_GRAD, ACCENT, CREAM, DIMCOL, BORDER)
- 边框绘制函数 (`boxRow`)
- `printStartupScreen()` 函数

需要进行以下适配：
- 将 Logo 文字从 "OPEN" + "CLAUDE" 改为 "WEB" + "AI" + "IDE"
- 从 `electron-store` 获取 Provider 配置（`main.ts` 中的 store 实例），而非环境变量
- 版本号从 package.json 获取
- Provider 检测改为从 store 读取 `selectedProvider` 和 `selectedModel`

### 文件结构

```
electron/
├── electron/
│   └── main.ts                 # 修改 - 导入并调用 printStartupScreen
└── src/
    └── utils/
        └── startupScreen.ts    # 复制自 openclaude-temp 并适配
