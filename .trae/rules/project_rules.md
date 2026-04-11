# 项目级规则

## 不修改的目录

- `packages/openclaude-temp` - 外部依赖的 AI Agent 引擎，禁止修改
  - 该包是独立的开源项目 (openclaude)
  - 如需修改应提交到上游或 fork
  - 仅使用其提供的 gRPC 接口进行集成