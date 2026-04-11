# Web AI IDE 数据库说明

## 概述

Web AI IDE 使用 **PostgreSQL** 作为主数据库，通过 **Prisma ORM** 进行数据库操作。

### 连接信息

| 配置项 | 值 |
|--------|-----|
| 数据库类型 | PostgreSQL 16 |
| 默认端口 | 5432 |
| 默认数据库 | webaiide |
| 连接地址 | localhost:5432 |
| Docker 容器名 | webaiide-postgres |

### 环境变量

```bash
POSTGRES_USER=myuser          # 用户名
POSTGRES_PASSWORD=StrongPass123!  # 密码
POSTGRES_DB=webaiide          # 数据库名
DATABASE_URL=postgresql://myuser:StrongPass123!@localhost:5432/webaiide
```

---

## 数据模型

### ER 图

```
┌─────────┐       ┌─────────┐       ┌─────────┐
│  User   │──────<│ Project │──────<│ Session │
└─────────┘       └─────────┘       └────┬────┘
                                          │
                                    ┌─────┴─────┐
                                    │  Message  │
                                    └───────────┘

┌─────────┐       ┌─────────┐
│ Tenant  │──────<│  ApiKey │
└─────────┘       └─────────┘
```

### 模型详解

#### 1. User (用户)

存储用户账户信息。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String (UUID) | 主键 |
| email | String | 唯一邮箱 |
| name | String? | 用户名（可选） |
| password | String | bcrypt 加密的密码 |
| apiKeys | Json? | API 密钥配置（加密存储） |
| createdAt | DateTime | 创建时间 |
| updatedAt | DateTime | 更新时间 |

#### 2. Project (项目)

存储 AI 项目信息。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String (UUID) | 主键 |
| name | String | 项目名称 |
| path | String | 项目路径（加密存储） |
| userId | String | 所属用户 ID |
| createdAt | DateTime | 创建时间 |
| updatedAt | DateTime | 更新时间 |

**索引**: `[userId]`

#### 3. Session (会话)

存储项目会话信息。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String (UUID) | 主键 |
| projectId | String | 所属项目 ID |
| cwd | String? | 工作目录（加密存储） |
| gitBranch | String? | Git 分支 |
| model | String | AI 模型，默认 gpt-4o |
| createdAt | DateTime | 创建时间 |
| updatedAt | DateTime | 更新时间 |

**索引**: `[projectId]`

#### 4. Message (消息)

存储会话中的聊天消息。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String (UUID) | 主键 |
| uuid | String | 消息唯一标识 |
| parentUuid | String? | 父消息 UUID |
| sessionId | String | 所属会话 ID |
| type | String | 消息类型，默认 user |
| subtype | String? | 子类型 |
| role | String | 角色 |
| content | String | 消息内容（加密存储） |
| toolCalls | Json? | 工具调用 |
| toolCallResult | Json? | 工具调用结果 |
| usageMetadata | Json? | 用量元数据 |
| model | String? | 使用的模型 |
| systemPayload | Json? | 系统负载（加密存储） |
| createdAt | DateTime | 创建时间 |

**索引**: `[sessionId]`

#### 5. Tenant (租户)

支持多租户功能。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String (UUID) | 主键 |
| name | String | 租户名称 |
| schema | String | 独立的数据库 Schema |
| createdAt | DateTime | 创建时间 |
| updatedAt | DateTime | 更新时间 |

**约束**: `schema` 字段唯一

#### 6. ApiKey (API 密钥)

存储租户的 API 密钥。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String (UUID) | 主键 |
| keyHash | String | API 密钥的 SHA-256 哈希值 |
| name | String | 密钥名称，默认 Default |
| tenantId | String | 所属租户 ID |
| createdAt | DateTime | 创建时间 |

**约束**: `keyHash` 字段唯一

---

## 字段加密

以下敏感字段在存储前会自动加密：

| 模型 | 加密字段 |
|------|---------|
| User | apiKeys |
| Project | path |
| Session | cwd |
| Message | content, systemPayload |

加密通过 Prisma `$use` 中间件实现：
- **写入时**: 自动加密
- **读取时**: 自动解密

---

## 读写分离

系统支持数据库读写分离：

| 客户端 | 用途 | 环境变量 |
|--------|------|---------|
| `prisma` | 写操作 (INSERT/UPDATE/DELETE) | DATABASE_URL |
| `prismaRead` | 读操作 (SELECT) | DATABASE_REPLICA_URL |

当 `DATABASE_REPLICA_URL` 与 `DATABASE_URL` 相同时，两个客户端指向同一数据库。

---

## 服务层

### 核心服务

| 服务 | 文件 | 职责 |
|------|------|------|
| projectService | src/services/project.service.ts | 项目 CRUD |
| sessionService | src/services/session.service.ts | 会话和消息管理 |
| authService | src/services/auth.service.ts | 用户注册和登录 |
| tenantService | src/services/tenant.service.ts | 租户和 API 密钥管理 |

### 缓存服务

| 服务 | 文件 | 职责 |
|------|------|------|
| sessionCacheService | src/services/session-cache.service.ts | 会话内存缓存 |

---

## API 路由

| 路由 | 方法 | 说明 |
|------|------|------|
| `/api/projects` | GET | 列出所有项目 |
| `/api/projects/:id` | GET | 获取单个项目（含最新会话） |
| `/api/projects` | POST | 创建项目 |
| `/api/projects/:id` | DELETE | 删除项目 |
| `/api/sessions` | GET | 列出项目会话 |
| `/api/sessions/:id` | GET | 获取会话详情 |
| `/api/sessions/:id/conversation` | GET | 获取会话完整对话 |
| `/api/sessions` | POST | 创建会话 |
| `/api/sessions/:id` | DELETE | 删除会话 |
| `/api/chat/:sessionId/stream` | WebSocket | 聊天流 |

---

## 数据库操作示例

### 1. 查看所有表

```sql
\dt
```

### 2. 查询用户

```sql
SELECT * FROM "User";
```

### 3. 查询项目及会话

```sql
SELECT p.id, p.name, p.path, s.id as session_id, s.model
FROM "Project" p
LEFT JOIN "Session" s ON s."projectId" = p.id;
```

### 4. 查询会话消息

```sql
SELECT m.uuid, m.role, m.content, m."createdAt"
FROM "Message" m
WHERE m."sessionId" = 'your-session-id'
ORDER BY m."createdAt" ASC;
```

### 5. 统计各表数据量

```sql
SELECT 'User' as table_name, COUNT(*) as count FROM "User"
UNION ALL
SELECT 'Project', COUNT(*) FROM "Project"
UNION ALL
SELECT 'Session', COUNT(*) FROM "Session"
UNION ALL
SELECT 'Message', COUNT(*) FROM "Message";
```

---

## Prisma 命令

### 生成 Prisma Client

```bash
cd packages/server
npx prisma generate
```

### 推送 Schema 到数据库

```bash
npx prisma db push
```

### 打开 Prisma Studio

```bash
npx prisma studio
```

### 数据库迁移

```bash
npx prisma migrate dev --name init
```

---

## 注意事项

1. **密码安全**: 用户密码使用 bcrypt 加盐哈希存储，不可逆
2. **API 密钥**: 仅存储哈希值，原始密钥只显示一次
3. **字段加密**: 敏感字段在数据库中以加密形式存储
4. **级联删除**: 删除用户会删除其所有项目、会话和消息
5. **索引优化**: Session 和 Message 表有索引支持快速查询
