# Web AI IDE

一个基于 Web + Electron 的 AI 辅助编程环境，支持多 AI 模型协作、代码编辑、终端模拟。

---

## 技术栈

| 模块 | 技术 | 版本 |
|------|------|------|
| 前端 | React, TypeScript, Vite, TailwindCSS | React 18, TypeScript 5.x |
| 桌面 | Electron | 30.x |
| 代码编辑器 | Monaco Editor | 最新稳定版 |
| 后端 | Fastify, Node.js | Fastify 4 |
| 数据库 | PostgreSQL, Prisma ORM | PostgreSQL 16 |
| 容器 | Docker, Docker Compose | - |

---

## 目录结构

```
web-ai-ide/
├── packages/
│   ├── electron/              # Electron 桌面应用
│   │   ├── electron/          # 主进程 (main.ts, preload.ts)
│   │   └── src/              # React 前端
│   │       ├── components/   # UI 组件
│   │       ├── hooks/        # 状态钩子
│   │       ├── services/     # API、WebSocket 客户端
│   │       ├── contexts/    # SettingsContext
│   │       └── i18n/         # 国际化翻译
│   ├── cli/                   # 独立 React Web 应用
│   ├── core/                 # AI 核心逻辑 (AIGateway + Providers)
│   ├── openclaude-temp/       # AI Agent gRPC 服务
│   ├── server/               # Fastify 后端 API
│   └── shared/               # 共享类型定义
├── docs/                     # 设计文档
├── release/                  # 构建输出
├── docker-compose.yml        # Docker 编排
├── debug.ps1                # 一键启动脚本
└── package.json
```

---

## 安装 / 快速上手

### 环境要求

- Node.js >= 20.0
- Docker >= 24.0
- PostgreSQL >= 16（不使用 Docker 时）

### 桌面应用（推荐）

```powershell
# 1. 克隆
git clone https://github.com/your/web-ai-ide.git
cd web-ai-ide

# 2. 设置数据库凭据（必需）
$env:POSTGRES_USER="your_username"
$env:POSTGRES_PASSWORD="your_strong_password"

# 3. 一键启动
.\debug.ps1
```

`debug.ps1` 脚本自动完成：
- 启动 PostgreSQL（Docker）
- 初始化数据库（Prisma）
- 启动后端服务
- 启动桌面应用

### Docker 部署

```bash
# 1. 克隆
git clone https://github.com/your/web-ai-ide.git
cd web-ai-ide

# 2. 启动
docker-compose up -d
```

### 开发模式

```bash
# 后端
cd packages/server
npm install
npx prisma generate
npx prisma db push
npm run dev

# 桌面应用
cd packages/electron
npm install
npm run dev
```

---

## 功能说明

### AI 对话

与 AI 助手实时对话，支持流式响应。

```typescript
// 发送消息
ws.send(JSON.stringify({
  type: 'chat:message',
  sessionId: 'session_xxx',
  message: '解释这段代码'
}));
```

### 代码编辑器

基于 Monaco Editor，支持多标签页、语法高亮。

```typescript
// 打开文件
const content = await api.readFile(projectId, '/src/index.ts');
```

### 文件管理器

项目文件树，支持创建、编辑、删除。

```typescript
// 创建文件
await api.writeFile(projectId, '/src/utils.ts', 'export function helper() {}');
```

### 终端模拟器

内置 Web 终端，支持 WebSocket PTY 连接。

### 多模型支持

支持 OpenAI GPT、Anthropic Claude、Qwen 等。

```typescript
// 在 Settings 面板配置 API Key
// 或通过环境变量
env OPENAI_API_KEY=sk-...
```

---

## API 文档

### REST Endpoints

#### GET /api/projects

列出用户所有项目。

返回值：`Project[]` — 项目数组

**示例**
```typescript
const projects = await fetch('/api/projects', {
  headers: { 'Authorization': `Bearer ${token}` }
});
// [{ id: "proj_xxx", name: "my-project", path: "/path/to/project" }, ...]
```

#### POST /api/projects

创建新项目。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 项目名称，1-50 字符 |
| path | string | 是 | 项目路径 |
| userId | string | 是 | 用户 ID |

返回值：`Project` — 创建的项目对象

**示例**
```typescript
const project = await fetch('/api/projects', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({ name: 'my-project', path: '/path/to/project', userId: 'user_123' })
});
// { id: "proj_xxx", name: "my-project", path: "/path/to/project", userId: "user_123", createdAt: "..." }
```

#### DELETE /api/projects/:id

删除指定项目。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 项目 ID |

返回值：`{ success: boolean }`

#### GET /api/sessions/:id

获取会话详情。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 会话 ID |

返回值：`Session` — 会话对象

#### POST /api/sessions

创建新会话。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| projectId | string | 是 | 关联的项目 ID |

返回值：`Session` — 创建的会话对象

### WebSocket Events

#### chat:message (Client → Server)

发送聊天消息。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | string | 是 | 固定 `"chat:message"` |
| sessionId | string | 是 | 会话 ID |
| message | string | 是 | 消息内容 |

**示例**
```typescript
ws.send(JSON.stringify({
  type: 'chat:message',
  sessionId: 'session_xxx',
  message: '解释这段代码'
}));
```

#### chat:stream (Server → Client)

AI 流式响应。

| 参数 | 类型 | 说明 |
|------|------|------|
| type | string | 固定 `"chat:stream"` |
| sessionId | string | 会话 ID |
| content | string | 响应内容片段 |

#### chat:tool_call (Server → Client)

工具调用请求。

| 参数 | 类型 | 说明 |
|------|------|------|
| type | string | 固定 `"chat:tool_call"` |
| tool | string | 工具名称 |
| params | object | 工具参数 |

#### chat:approve (Client → Server)

批准工具调用。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | string | 是 | 固定 `"chat:approve"` |
| callId | string | 是 | 调用 ID |

#### chat:reject (Client → Server)

拒绝工具调用。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | string | 是 | 固定 `"chat:reject"` |
| callId | string | 是 | 调用 ID |

### gRPC 接口

```protobuf
service AgentService {
  rpc Chat(stream ClientMessage) returns (stream ServerMessage);
}
```

| 参数 | 类型 | 说明 |
|------|------|------|
| GRPC_PORT | number | 默认 `50051` |
| GRPC_HOST | string | 默认 `localhost` |

---

## 数据库

### 环境变量

```
DATABASE_URL="postgresql://user:pass@localhost:5432/db"
```

### 数据加密

敏感字段使用 AES-256-GCM 加密：

| 字段 | 模型 |
|------|------|
| apiKeys | User |
| path | Project |
| cwd | Session |
| content, systemPayload | Message |

---

## 贡献指南

### 提 Issue

- Bug Report：使用 [issue 模板](https://github.com/your/web-ai-ide/issues/new?template=bug_report.yml)，描述复现步骤、环境信息
- Feature Request：使用 [feature 模板](https://github.com/your/web-ai-ide/issues/new?template=feature_request.yml)，说明使用场景和预期行为

### 分支命名

- `feat/xxx` — 新功能
- `fix/xxx` — bug 修复
- `docs/xxx` — 文档更新
- `refactor/xxx` — 代码重构

### 开发流程

1. Fork 本仓库，基于 `main` 创建功能分支：`git checkout -b feat/your-feature`
2. 提交前确保 lint 和类型检查通过：`npm run lint && npm run typecheck`
3. 若涉及公开 API 变更，同步更新 README 文档
4. 发起 Pull Request，描述改动目的和测试方法

### 本地开发

```bash
# lint
npm run lint

# 类型检查
npm run typecheck

# 测试
npm test
```

---

## License

MIT License