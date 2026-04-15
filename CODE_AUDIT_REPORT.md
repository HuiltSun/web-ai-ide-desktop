# Web AI IDE 代码审核报告

> 审核日期：2026-04-15
> 审核范围：e:\web\web-ai-ide 全部源代码

---

## 一、项目概述

### 1.1 项目结构

```
web-ai-ide/
├── packages/
│   ├── electron/     # Electron 桌面客户端 (React + TypeScript)
│   ├── server/       # Fastify 后端服务 (Node.js + TypeScript)
│   ├── core/         # 核心 AI 逻辑 (providers, tools)
│   ├── shared/       # 共享类型定义
│   ├── worker/       # RabbitMQ 任务队列 Worker
│   └── cli/          # CLI 工具
├── Dockerfile        # 多阶段构建
├── docker-compose.yml # 容器编排
└── nginx.conf        # Nginx 配置
```

### 1.2 技术栈

- **前端**：Electron + React 18 + TypeScript + TailwindCSS + Vite
- **后端**：Fastify + Prisma (PostgreSQL) + Redis + RabbitMQ
- **AI 集成**：OpenAI / Anthropic / Qwen 通过 gRPC 与 openclaude-temp 通信
- **终端**：node-pty
- **部署**：Docker + Nginx

---

## 二、安全问题（高优先级）

### 2.1 🔴 严重问题

#### 2.1.1 加密模块使用随机 Salt 导致数据永久丢失风险

**文件**：`packages/server/src/utils/encryption.ts`

```typescript
// 第 33-38 行：当 ENCRYPTION_SALT 未设置时使用随机 Salt
const salt = crypto.randomBytes(SALT_LENGTH);
cachedKey = crypto.pbkdf2Sync(secret, salt, ITERATIONS, KEY_LENGTH, 'sha256');
```

**问题**：
- 如果 `ENCRYPTION_SALT` 环境变量未设置，每次服务重启都会生成不同的 Salt
- 这意味着之前加密的数据将无法解密
- 生产环境中一旦服务重启，所有加密的敏感数据（用户 API Keys、项目路径、聊天记录）将永久损坏

**建议**：
- 强制要求设置 `ENCRYPTION_SALT`，并在缺少时抛出明确错误而非静默使用随机值
- 添加启动时验证脚本，确保 Salt 在所有环境中保持一致

#### 2.1.2 WebSocket 端点完全无认证

**文件**：
- `packages/server/src/routes/pty.ts` (第 57 行)
- `packages/server/src/routes/terminal.ts` (第 48 行)

```typescript
// pty.ts 第 57 行
fastify.get('/ws/pty', { websocket: true }, (socket, req) => {

// terminal.ts 第 48 行
fastify.get('/ws/terminal', { websocket: true }, (socket, req) => {
```

**问题**：
- `/ws/pty` 和 `/ws/terminal` 端点没有任何身份验证
- 任何知道端点地址的人都可以创建终端会话并执行任意命令
- 这是一个严重的远程代码执行（RCE）漏洞

**建议**：
- 添加 Token 认证机制（通过 query 参数或 headers）
- 在 `preHandler` 中验证 JWT 或 Session

#### 2.1.3 JWT Secret 硬编码回退值

**文件**：`packages/server/src/index.ts` (第 78 行)

```typescript
await server.register(jwt, { secret: process.env.JWT_SECRET || 'web-ai-ide-secret-key-change-in-production' });
```

**问题**：
- 如果环境变量 `JWT_SECRET` 未设置，使用了一个知名的默认 secret
- 攻击者可以使用这个默认 secret 生成有效的 JWT token

**建议**：
- 移除回退值，在未设置时抛出明确错误
- 添加启动时验证

#### 2.1.4 SQL 注入风险 - SET search_path

**文件**：
- `packages/server/src/middleware/tenant.ts` (第 39 行)
- `packages/server/src/services/tenant.service.ts` (第 70 行)

```typescript
// tenant.ts 第 39 行
await prisma.$executeRaw`SET search_path TO ${request.tenantSchema}, public`;

// tenant.service.ts 第 70 行
await prisma.$executeRaw`SET search_path TO ${schema}, public`;
```

**问题**：
- 虽然 `tenant.service.ts` 有正则验证 schema 名称，但 `tenant.ts` 直接使用从请求头获取的 schema
- 攻击者可能通过伪造 `tenantSchema` 执行跨租户数据访问

**建议**：
- 使用 Prisma 的 `executeRawUnsafe` 或参数化查询
- 确保 schema 名称完全经过验证

#### 2.1.5 .env 文件包含真实凭证

**文件**：`packages/server/.env`

```env
DATABASE_URL=postgresql://myuser:StrongPass123!@localhost:5432/webaiide
JWT_SECRET=your-secret-key-change-in-production
```

**问题**：
- 真实的数据库密码和 JWT Secret 被提交到版本控制
- 如果仓库被公开或泄露，所有凭据都会暴露

**建议**：
- 将 `.env` 添加到 `.gitignore`
- 只保留 `.env.example` 作为模板
- 使用 Docker Secret 或环境变量注入

### 2.2 🟠 中等问题

#### 2.2.1 密码验证不一致

**文件**：
- `packages/server/src/routes/auth.ts` (第 16 行)
- `packages/server/src/services/auth.service.ts` (第 20 行)

```typescript
// auth.ts - Zod 验证
password: z.string().min(6),

// auth.service.ts - 实际验证
if (password.length < 8) {
  errors.push('Password must be at least 8 characters long');
}
```

**问题**：
- Zod schema 允许 6 字符密码，但 `auth.service.ts` 要求 8 字符
- 用户可能通过 API 注册时使用 6 字符密码，然后在登录时失败

**建议**：
- 统一密码最小长度为 8 字符

#### 2.2.2 解密失败时静默返回原始密文

**文件**：`packages/server/src/utils/encryption.ts` (第 76-78 行)

```typescript
} catch (error) {
  console.error('Decryption failed:', error);
  return encryptedText;  // 静默返回原始密文
}
```

**问题**：
- 解密失败时返回原始密文而非抛出错误
- 这可能掩盖数据损坏或篡改

**建议**：
- 抛出明确错误，让调用方知道解密失败
- 添加完整性验证

#### 2.2.3 敏感信息日志记录

**文件**：`packages/server/src/services/bun-grpc-chat-bridge.ts` (第 81-82 行)

```typescript
child.stderr?.on('data', (chunk: Buffer) => {
  console.error(`[bun-grpc-sidecar] ${chunk.toString()}`);
});
```

**问题**：
- gRPC sidecar 的 stderr 输出直接记录到日志
- 可能包含敏感的环境变量或错误信息

**建议**：
- 过滤或脱敏日志输出
- 避免记录完整的错误堆栈

---

## 三、架构与设计问题

### 3.1 🟠 重复代码与职责不清

#### 3.1.1 两套独立的 PTY 实现

**文件**：
- `packages/server/src/services/pty-manager.ts` - OpenClaude 会话管理
- `packages/server/src/services/pty.service.ts` - 本地 shell 会话管理

**问题**：
- 两个文件都管理 PTY 进程，但功能高度重叠
- `ShellRegistry` 试图统一两者，但只是一个薄包装
- 维护成本高，容易出现不一致

**建议**：
- 合并为单一 PTY 服务，支持多种会话类型
- 使用策略模式替代条件分支

#### 3.1.2 Tenant 中间件重复实现

**文件**：
- `packages/server/src/middleware/tenant.ts`
- `packages/server/src/routes/chat.ts` (第 46-54 行)
- `packages/server/src/routes/sessions.ts` (第 6-14 行)
- `packages/server/src/routes/projects.ts` (第 6-14 行)

```typescript
// sessions.ts 和 projects.ts 中的 preHandler
fastify.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
  const apiKey = request.headers['x-api-key'] as string;
  if (apiKey) {
    const tenant = await tenantService.getTenantByApiKey(apiKey);
    if (tenant) {
      await tenantService.setSearchPath(tenant.schema);
    }
  }
});
```

**问题**：
- 相同的租户解析逻辑在多个路由中重复
- 违反了 DRY 原则

**✅ 已修复**：
- 创建统一插件 [tenant.plugin.ts](file:///e:/web/web-ai-ide/packages/server/src/plugins/tenant.plugin.ts)
- `chat.ts`、`sessions.ts`、`projects.ts` 已更新为使用 `await fastify.register(tenantPlugin)`
- 消除了约 27 行重复代码

**修改详情**：

| 文件 | 变更 |
|------|------|
| `src/plugins/tenant.plugin.ts` | 新增统一租户插件 |
| `src/routes/chat.ts` | 移除重复代码，注册 tenantPlugin |
| `src/routes/sessions.ts` | 移除重复代码，注册 tenantPlugin |
| `src/routes/projects.ts` | 移除重复代码，注册 tenantPlugin |

### 3.2 🟡 类型安全问题

#### 3.2.1 大量使用 `any` 类型

**问题示例**：
- `packages/server/src/services/agent-session-manager.ts` (第 38 行)
  ```typescript
  call.on('data', (msg: any) => {
  ```

- `packages/server/src/services/chat.ts` (多处)
  ```typescript
  userId = (existingSession as any).userId || '';
  ```

**建议**：
- 定义完整的 gRPC 消息类型
- 使用类型守卫替代 `as any`

#### 3.2.2 Context 类型为 `any[]`

**文件**：`packages/server/src/services/session-cache.service.ts` (第 9 行)

```typescript
context: any[];
```

**问题**：
- 上下文数组没有类型定义
- 无法进行类型检查

**建议**：
- 定义 `ContextMessage` 接口

### 3.3 🟢 依赖注入缺失

**问题**：
- 所有服务文件直接 `import` 依赖
- 无法进行单元测试
- 无法替换实现（如使用 mock）

**建议**：
- 引入依赖注入容器（如 `tsyringe`、`typedi`）
- 或使用工厂函数模式

---

## 四、性能问题

### 4.1 🟠 同步阻塞 I/O

**文件**：`packages/server/src/index.ts` (第 24-30 行)

```typescript
function writeToFile(message: string) {
  try {
    appendFileSync(LOG_FILE, `${message}\n`);  // 同步阻塞
  } catch (err) {
    console.error('Failed to write to log file:', err);
  }
}
```

**问题**：
- `appendFileSync` 是同步操作
- 在高负载下会阻塞事件循环

**建议**：
- 使用 `fs.promises.appendFile` 或流式写入
- 或使用专业的日志库（如 `pino`）

### 4.2 🟡 非原子缓存更新

**文件**：`packages/server/src/services/session-cache.service.ts` (第 39-44 行)

```typescript
async updateSession(sessionId: string, updates: Partial<SessionCache>): Promise<void> {
  const existing = await this.getSession(sessionId);  // 读取
  if (existing) {
    const updated = { ...existing, ...updates };
    await this.setSession(sessionId, updated);         // 写入
  }
}
```

**问题**：
- 非原子操作，并发情况下可能丢失更新
- Redis 操作没有使用事务

**建议**：
- 使用 `WATCH` + `MULTI/EXEC` 事务
- 或使用 `HSET` 替代整个对象存储

### 4.3 🟡 消息过滤效率低

**文件**：`packages/server/src/services/queue.service.ts` (第 54-55 行)

```typescript
const result = JSON.parse(msg.content.toString());
if (result.sessionId === sessionId) {
```

**问题**：
- Worker 接收所有 `ai.results` 消息再过滤
- 应该使用 RabbitMQ 的 `routing key` 或 `selector`

**建议**：
- 为每个会话创建独立的临时队列
- 或使用 Redis Pub/Sub

### 4.4 🟢 缺少分页

**文件**：
- `packages/server/src/services/session.service.ts` (第 199-203 行)
- `packages/server/src/routes/sessions.ts`

```typescript
async getMessages(sessionId: string) {
  return prismaRead.message.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'asc' },
  });
}
```

**问题**：
- 没有分页，大型会话可能返回数千条消息
- 前端可能因此崩溃

**建议**：
- 添加 `take` / `skip` 参数
- 默认限制返回数量

---

## 五、错误处理问题

### 5.1 🟠 JSON 解析缺少错误处理

**文件**：`packages/server/src/services/agent-session-manager.ts` (第 88 行)

```typescript
arguments: JSON.parse(msg.tool_start.arguments_json || '{}'),
```

**问题**：
- 如果 `arguments_json` 是无效 JSON，会抛出未捕获的异常
- 可能导致整个会话崩溃

**建议**：
- 使用 `try-catch` 包裹，并返回错误信息

### 5.2 🟡 RabbitMQ 连接无重连

**文件**：`packages/server/src/utils/rabbitmq.ts`

```typescript
export const rabbitmq = {
  async getChannel(): Promise<AmqpChannel> {
    if (!channel) {
      connection = await amqp.connect(RABBITMQ_URL);
      channel = await connection.createChannel() as unknown as AmqpChannel;
      // 没有错误处理或重连逻辑
    }
    return channel;
  },
```

**问题**：
- 如果连接断开，没有重连机制
- 后续所有操作都会失败

**建议**：
- 添加连接事件监听器
- 实现自动重连逻辑

### 5.3 🟡 Redis 错误静默吞噬

**文件**：`packages/server/src/services/session-cache.service.ts` (多处)

```typescript
} catch (error) {
  console.error('Redis getSession error:', error);
  return null;  // 返回 null 而非抛出错误
}
```

**问题**：
- Redis 错误被静默处理，调用方无法区分"缓存未命中"和"Redis 故障"
- 可能导致意外行为

**建议**：
- 返回错误或使用哨兵值
- 添加健康检查端点

---

## 六、代码质量问题

### 6.1 🟡 日志输出格式不统一

**问题**：
- 部分使用 `console.log/error`
- 部分使用 `fastify.log`
- 部分写入文件

**建议**：
- 统一使用 `pino` 或类似结构化日志库
- 确保所有日志经过同一渠道

### 6.2 🟢 魔法数字

**文件**：`packages/server/src/services/agent-process-manager.ts`

```typescript
const GRPC_POST_TCP_SETTLE_MS = 800;    // 为什么是 800ms?
const timeout = 10000;                    // 10 秒超时
const TIMEOUT_MS = 30 * 60 * 1000;       // 30 分钟空闲超时
```

**建议**：
- 提取为配置常量
- 添加注释说明来源或目的

### 6.3 🟢 未使用的导入

**文件**：`packages/server/src/routes/pty.ts` (第 2 行)

```typescript
import type { FastifyInstance } from 'fastify';
import { WebSocket } from 'ws';  // WebSocket 类型在参数中未使用
```

---

## 七、数据库设计问题

### 7.1 🟠 Schema 与 Migration 不一致

**文件**：
- `packages/server/prisma/schema.prisma` - 定义了 `Tenant` 和 `ApiKey` 表
- `packages/server/prisma/migrations/20260403152701_init/migration.sql` - 没有这些表

**问题**：
- 新部署时可能创建不完整的数据库
- Schema 定义的模型与实际数据库结构不匹配

**建议**：
- 重新生成 migration
- 或添加缺失表的 migration

### 7.2 🟡 Message.content 类型可能溢出

**文件**：`packages/server/prisma/schema.prisma` (第 75 行)

```prisma
content        String
```

**问题**：
- 长对话的 `content` 可能超过 PostgreSQL 的 `VARCHAR` 限制
- AI 助手的回复可能非常长

**建议**：
- 使用 `@db.Text` 类型

### 7.3 🟢 缺少必要索引

**文件**：`packages/server/prisma/schema.prisma`

**问题**：
- `Message` 表按 `sessionId` 有索引，但 `createdAt` 没有
- 按时间范围查询消息可能很慢

**建议**：
- 添加复合索引 `@@index([sessionId, createdAt])`

---

## 八、Docker 与部署问题

### 8.1 🟠 Dockerfile 多阶段构建配置错误

**文件**：`Dockerfile`

```dockerfile
# 第 9 行
RUN npm ci   # 应该是 pnpm ci

# 第 16 行
COPY --chown=nodejs:nodejs --from=builder /app/packages/cli/dist ./dist
# 但 CMD 运行 CLI，实际应该构建 server
```

**问题**：
- 使用 `npm` 而非项目配置的 `pnpm`
- 复制了 CLI 的 dist，但实际运行的是 server
- 多阶段构建没有正确配置

**建议**：
- 修正为 `pnpm ci`
- 确认正确的构建目标

### 8.2 🟠 docker-compose.yml 缺少关键服务

**文件**：`docker-compose.yml`

**问题**：
- `api-1/2/3` 服务的构建上下文是 `./packages/server`，但 Dockerfile 位于根目录
- 没有构建 electron 包的服务

**建议**：
- 为每个服务配置正确的 `context` 和 `dockerfile`
- 添加 electron 构建服务

### 8.3 🟡 Nginx 配置缺少健康检查

**文件**：`nginx.conf`

```nginx
location /health {
    return 200 'OK';
    add_header Content-Type text/plain;
}
```

**问题**：
- 健康检查只返回 200，不检查后端服务状态
- 负载均衡可能将请求转发到已宕机的服务

**建议**：
- 使用 `nginx_upstream_check_module`
- 或添加 `/health/ready` 端点检查依赖服务

---

## 九、Electron 客户端问题

### 9.1 🟡 Preload 脚本 API 暴露过多

**文件**：`packages/electron/electron/preload.ts`

```typescript
contextBridge.exposeInMainWorld('electronAPI', {
  getAppPath: () => ipcRenderer.invoke('get-app-path'),
  getVersion: () => ipcRenderer.invoke('get-version'),
  settings: { get, set, getAll },
  window: { minimize, maximize, close, ... },
  shell: { openExternal },
  onMenuEvent: ...
});
```

**问题**：
- `openExternal` 直接暴露给渲染进程
- 恶意网页可以通过 Electron API打开任意 URL

**建议**：
- 添加 URL 白名单验证
- 使用 `shell.openExternal` 的第二个参数 `{ allowToOpenBrowser: true }`

### 9.2 🟡 窗口管理直接操作 DOM

**文件**：`packages/electron/src/components/Layout.tsx`

**建议**：
- 考虑使用 Web 标准 API 替代某些 Electron 特有功能
- 提高应用的可移植性

### 9.3 🟢 缺少自动更新机制

**问题**：
- 没有配置 `electron-updater`
- 用户需要手动下载新版本

**建议**：
- 集成 `electron-updater`
- 添加更新检查逻辑

---

## 十、国际化（i18n）问题

### 10.1 🟢 审核通过

**现状**：
- 所有用户可见文本都使用 i18n
- 翻译文件结构完整
- 中英文翻译齐全

**建议**：
- 定期检查是否有遗漏的硬编码文本

---

## 十一、测试覆盖

### 11.1 🟠 完全没有测试

**现状**：
- 整个项目没有任何测试文件
- 无法保证重构的安全性

**建议**：
- 优先为关键服务（auth、session）添加单元测试
- 使用 Jest + Supertest
- 添加集成测试覆盖 API 端点

---

## 十二，最优先修复建议

### 必须立即修复（高风险）

1. ~~修复加密模块的随机 Salt 问题~~
   - ~~强制要求 `ENCRYPTION_SALT` 环境变量~~
   - ~~验证现有加密数据不会丢失~~

2. **为 WebSocket 端点添加认证**
   - `/ws/pty` 和 `/ws/terminal` 必须验证 Token
   - 审查所有公开端点

3. **移除 .env 文件或加入 .gitignore**
   - 更改所有已泄露的凭据

4. **统一密码验证规则**
   - Zod schema 与 auth.service.ts 保持一致

### 尽快修复（中风险）

5. 修复 `SET search_path` 的 SQL 注入风险
6. 实现 RabbitMQ 重连机制
7. 添加 JSON 解析错误处理
8. 修复 Dockerfile 配置

### 持续改进（低风险）

9. 添加单元测试
10. 统一日志系统
11. 合并重复的 PTY 实现
12. 添加数据库迁移一致性检查

---

## 十三，已修复问题

### 3.1.2 ✅ Tenant 中间件重复实现

**修复日期**：2026-04-15

**变更**：
- 新增统一租户插件 [`packages/server/src/plugins/tenant.plugin.ts`](file:///e:/web/web-ai-ide/packages/server/src/plugins/tenant.plugin.ts)
- 更新 `chat.ts`、`sessions.ts`、`projects.ts` 使用插件
- 消除约 27 行重复代码
- TypeScript 类型检查通过

---

*本报告基于静态代码分析，实际运行时行为可能有所不同。建议结合动态测试和渗透测试进一步验证安全问题。*
