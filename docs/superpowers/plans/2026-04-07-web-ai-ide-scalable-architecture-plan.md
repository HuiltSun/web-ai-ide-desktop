# Web AI IDE - Scalable Architecture Implementation Plan

**Date:** 2026-04-07
**Design Doc:** 2026-04-07-web-ai-ide-scalable-architecture-design.md
**Status:** Ready for Implementation

---

## Overview

This plan implements a scalable, multi-tenant architecture for Web AI IDE based on the current codebase structure.

**Current Codebase Structure:**
```
packages/server/
├── src/
│   ├── routes/          # auth.ts, chat.ts, files.ts, projects.ts, sessions.ts
│   ├── services/        # auth.service.ts, project.service.ts, session.service.ts
│   ├── utils/           # encryption.ts, prisma.ts
│   └── index.ts         # Fastify server with JWT, CORS, WebSocket
├── prisma/
│   └── schema.prisma    # User, Project, Session, Message models
└── package.json
```

**Required Additions:**
- `packages/server/src/utils/redis.ts` - Redis client
- `packages/server/src/utils/rabbitmq.ts` - RabbitMQ client
- `packages/server/src/services/session-cache.service.ts` - Redis session caching
- `packages/server/src/services/queue.service.ts` - RabbitMQ publisher
- `packages/worker/` - New worker package for AI task processing
- `nginx.conf` - Load balancer configuration

---

## Phase 1: Redis Session Externalization

**Goal:** Move session state from in-memory to Redis for horizontal scaling support
**Duration:** Week 1-2

### Task 1.1: Add Redis Client

**Files to Create:**
- `packages/server/src/utils/redis.ts`

**Steps:**

- [ ] **Step 1: Install Redis dependency**

```bash
cd packages/server
npm install ioredis
npm install -D @types/ioredis
```

- [ ] **Step 2: Create packages/server/src/utils/redis.ts**

```typescript
import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

class RedisClient {
  private static instance: Redis;

  static getInstance(): Redis {
    if (!RedisClient.instance) {
      RedisClient.instance = new Redis(REDIS_URL, {
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
          return Math.min(times * 50, 2000);
        },
      });

      RedisClient.instance.on('error', (err) => {
        console.error('Redis connection error:', err);
      });
    }
    return RedisClient.instance;
  }

  static async close(): Promise<void> {
    if (RedisClient.instance) {
      await RedisClient.instance.quit();
      RedisClient.instance = undefined as any;
    }
  }
}

export const redis = RedisClient.getInstance();
```

- [ ] **Step 3: Update .env.example**

```
REDIS_URL=redis://localhost:6379
```

---

### Task 1.2: Create Session Cache Service

**Files to Create:**
- `packages/server/src/services/session-cache.service.ts`

**Steps:**

- [ ] **Step 1: Create session cache service**

```typescript
import { redis } from '../utils/redis.js';

interface SessionCache {
  tenantId: string;
  userId: string;
  projectId: string;
  cursor: string;
  context: any[];
  provider: string;
  createdAt: number;
}

const SESSION_TTL = 60 * 60 * 24; // 24 hours

export const sessionCacheService = {
  async getSession(sessionId: string): Promise<SessionCache | null> {
    const data = await redis.get(`session:${sessionId}`);
    return data ? JSON.parse(data) : null;
  },

  async setSession(sessionId: string, session: SessionCache): Promise<void> {
    await redis.setex(
      `session:${sessionId}`,
      SESSION_TTL,
      JSON.stringify(session)
    );
  },

  async updateSession(sessionId: string, updates: Partial<SessionCache>): Promise<void> {
    const existing = await this.getSession(sessionId);
    if (existing) {
      const updated = { ...existing, ...updates };
      await this.setSession(sessionId, updated);
    }
  },

  async deleteSession(sessionId: string): Promise<void> {
    await redis.del(`session:${sessionId}`);
  },

  async addMessageToContext(sessionId: string, message: any): Promise<void> {
    const session = await this.getSession(sessionId);
    if (session) {
      session.context.push(message);
      if (session.context.length > 50) {
        session.context = session.context.slice(-50);
      }
      await this.setSession(sessionId, session);
    }
  },
};
```

---

### Task 1.3: Update Existing Session Service

**Files to Modify:**
- `packages/server/src/services/session.service.ts` (already exists)

**Steps:**

- [ ] **Step 1: Integrate Redis cache with existing session service**

```typescript
import { sessionCacheService } from './session-cache.service.js';

export const sessionService = {
  async createSession(projectId: string, model: string, tenantId: string, userId: string) {
    const session = await prisma.session.create({
      data: { projectId, model },
    });

    // Also cache in Redis for fast access
    await sessionCacheService.setSession(session.id, {
      tenantId,
      userId,
      projectId,
      cursor: '',
      context: [],
      provider: model,
      createdAt: Date.now(),
    });

    return session;
  },

  async getSession(id: string) {
    // Try cache first for fast access
    const cached = await sessionCacheService.getSession(id);
    if (cached) {
      return cached;
    }

    // Fallback to database
    return prisma.session.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
  },

  // ... existing methods (update, delete, etc.)
};
```

---

### Task 1.4: Docker Compose Update

**Files to Modify:**
- `docker-compose.yml`

**Steps:**

- [ ] **Step 1: Add Redis service to docker-compose.yml**

```yaml
services:
  # ... existing frontend, backend, db services

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - webaiide

  backend:
    # ... existing config
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER:-webaiide}:${POSTGRES_PASSWORD:-webaiide}@db:5432/${POSTGRES_DB:-webaiide}
      REDIS_URL: redis://redis:6379

volumes:
  pgdata:
  redis_data:

networks:
  webaiide:
    driver: bridge
```

- [ ] **Step 2: Test Redis integration**

```bash
docker-compose up -d redis
docker-compose exec backend npm run dev
# Verify session caching works
```

---

## Phase 2: Multi-Tenant Schema Isolation

**Goal:** Implement PostgreSQL schema-based tenant isolation

**Duration:** Week 2-3

### Task 2.1: Prisma Multi-Schema Setup

**Files to Modify:**
- `packages/server/prisma/schema.prisma`

**Steps:**

- [ ] **Step 1: Update Prisma schema for multi-tenancy**

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// System tables in public schema
model Tenant {
  id        String   @id @default(uuid())
  name      String
  schema    String   @unique  // e.g., "tenant_a"
  apiKeys   ApiKey[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model ApiKey {
  id        String  @id @default(uuid())
  keyHash   String  @unique
  tenantId  String
  tenant    Tenant  @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
}

// Tenant-scoped models (created per tenant via Prisma migrate)
// These exist in each tenant schema
model Project {
  id        String    @id @default(uuid())
  name      String
  path      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@schema("tenant_a") // Default, runtime switches this
}

model Session {
  id        String    @id @default(uuid())
  projectId String
  cwd       String?
  gitBranch String?
  model     String    @default("gpt-4o")
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  @@schema("tenant_a")
}

model Message {
  id             String    @id @default(uuid())
  uuid           String    @unique @default(uuid())
  parentUuid     String?
  sessionId      String
  type           String    @default("user")
  subtype        String?
  role           String
  content        String
  toolCalls      Json?
  toolCallResult Json?
  usageMetadata  Json?
  model          String?
  systemPayload  Json?
  createdAt      DateTime  @default(now())

  @@schema("tenant_a")
}
```

---

### Task 2.2: Tenant Middleware

**Files to Create:**
- `packages/server/src/middleware/tenant.ts`

**Steps:**

- [ ] **Step 1: Create tenant context middleware**

```typescript
import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../utils/prisma.js';

declare module 'fastify' {
  interface FastifyRequest {
    tenantId: string;
    tenantSchema: string;
  }
}

export async function tenantMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const apiKey = request.headers['x-api-key'] as string;

  if (!apiKey) {
    return reply.status(401).send({ error: 'Missing API key' });
  }

  // Hash the API key and look up tenant
  const keyHash = await hashApiKey(apiKey);
  const apiKeyRecord = await prisma.$queryRaw`
    SELECT t.id as tenant_id, t.schema
    FROM public.api_keys ak
    JOIN public.tenants t ON t.id = ak.tenant_id
    WHERE ak.key_hash = ${keyHash}
  `;

  if (!apiKeyRecord || apiKeyRecord.length === 0) {
    return reply.status(403).send({ error: 'Invalid API key' });
  }

  request.tenantId = apiKeyRecord[0].tenant_id;
  request.tenantSchema = apiKeyRecord[0].schema;

  // Set PostgreSQL search path
  await prisma.$executeRaw`SET search_path TO ${request.tenantSchema}, public`;
}

async function hashApiKey(key: string): Promise<string> {
  const crypto = await import('crypto');
  return crypto.createHash('sha256').update(key).digest('hex');
}
```

---

### Task 2.3: Apply Middleware to Routes

**Files to Modify:**
- `packages/server/src/routes/projects.ts`
- `packages/server/src/routes/sessions.ts`
- `packages/server/src/routes/chat.ts`

**Steps:**

- [ ] **Step 1: Register middleware in index.ts**

```typescript
import { tenantMiddleware } from './middleware/tenant.js';

await server.register(async function (app) {
  app.addHook('preHandler', tenantMiddleware);
  app.register(projectsRouter, { prefix: '/api/projects' });
  app.register(sessionsRouter, { prefix: '/api/sessions' });
  app.register(chatRouter, { prefix: '/api/chat' });
});
```

---

### Task 2.4: Database Migration for Multi-Tenant

**Steps:**

- [ ] **Step 1: Create initial schemas**

```bash
cd packages/server

# Create tenant_a schema
npx prisma migrate dev --name init_tenant_a --schema=prisma/schema-tenant.prisma

# For production, run raw SQL to create schemas
psql $DATABASE_URL -c "CREATE SCHEMA tenant_a;"
psql $DATABASE_URL -c "CREATE SCHEMA tenant_b;"
```

---

## Phase 3: Stateless API + Load Balancing

**Goal:** Make Fastify API stateless and add Nginx load balancer

**Duration:** Week 3

### Task 3.1: Nginx Configuration

**Files to Create:**
- `nginx.conf`

**Steps:**

- [ ] **Step 1: Create Nginx configuration**

```nginx
worker_processes auto;
error_log /var/log/nginx/error.log warn;
events {
    worker_connections 1024;
}

http {
    upstream backend {
        ip_hash;
        server api-1:3001;
        server api-2:3001;
        server api-3:3001;
        keepalive 32;
    }

    server {
        listen 80;
        listen 443 ssl http2;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        # Health check endpoint
        location /health {
            return 200 'OK';
            add_header Content-Type text/plain;
        }

        # API routes
        location /api/ {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # WebSocket support
        location /ws {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_read_timeout 86400;
        }
    }
}
```

---

### Task 3.2: Update Docker Compose for Scaling

**Files to Modify:**
- `docker-compose.yml`

**Steps:**

- [ ] **Step 1: Add multiple API instances**

```yaml
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - api-1
      - api-2
      - api-3

  api-1:
    build: ./packages/server
    environment:
      TENANT_ID: shared
      DATABASE_URL: postgresql://webaiide:webaiide@db:5432/webaiide
      REDIS_URL: redis://redis:6379
    depends_on:
      - redis

  api-2:
    build: ./packages/server
    environment:
      TENANT_ID: shared
      DATABASE_URL: postgresql://webaiide:webaiide@db:5432/webaiide
      REDIS_URL: redis://redis:6379
    depends_on:
      - redis

  api-3:
    build: ./packages/server
    environment:
      TENANT_ID: shared
      DATABASE_URL: postgresql://webaiide:webaiide@db:5432/webaiide
      REDIS_URL: redis://redis:6379
    depends_on:
      - redis
```

---

## Phase 4: RabbitMQ Worker Pool

**Goal:** Implement async AI task processing via message queue

**Duration:** Week 3-4

### Task 4.1: RabbitMQ Integration

**Files to Create:**
- `packages/server/src/utils/rabbitmq.ts`
- `packages/server/src/services/queue.service.ts`

**Steps:**

- [ ] **Step 1: Install AMQP dependency**

```bash
cd packages/server
npm install amqplib
npm install -D @types/amqplib
```

- [ ] **Step 2: Create packages/server/src/utils/rabbitmq.ts**

```typescript
import amqp, { Connection, Channel } from 'amqplib';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';

let connection: Connection | null = null;
let channel: Channel | null = null;

export async function getRabbitMQChannel(): Promise<Channel> {
  if (!channel) {
    connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();

    // Declare queues
    await channel.assertQueue('ai.tasks', { durable: true });
    await channel.assertQueue('ai.results', { durable: true });
  }
  return channel;
}

export async function closeRabbitMQ(): Promise<void> {
  if (channel) {
    await channel.close();
    channel = null;
  }
  if (connection) {
    await connection.close();
    connection = null;
  }
}
```

---

### Task 4.2: Queue Service

**Files to Create:**
- `packages/server/src/services/queue.service.ts`

**Steps:**

- [ ] **Step 1: Create queue publisher service**

```typescript
import { getRabbitMQChannel } from '../utils/rabbitmq.js';
import { v4 as uuidv4 } from 'uuid';

export interface AITask {
  taskId: string;
  sessionId: string;
  tenantId: string;
  prompt: string;
  tools: any[];
  model: string;
  timestamp: number;
}

export const queueService = {
  async publishAITask(task: Omit<AITask, 'taskId' | 'timestamp'>): Promise<string> {
    const channel = await getRabbitMQChannel();
    const taskId = uuidv4();
    const fullTask: AITask = {
      ...task,
      taskId,
      timestamp: Date.now(),
    };

    channel.sendToQueue(
      'ai.tasks',
      Buffer.from(JSON.stringify(fullTask)),
      { persistent: true }
    );

    return taskId;
  },

  async subscribeToResults(
    sessionId: string,
    callback: (result: any) => void
  ): Promise<void> {
    const channel = await getRabbitMQChannel();

    channel.consume('ai.results', async (msg) => {
      if (msg) {
        const result = JSON.parse(msg.content.toString());
        if (result.sessionId === sessionId) {
          callback(result);
        }
        channel.ack(msg);
      }
    });
  },
};
```

---

### Task 4.3: Worker Service

**Files to Create:**
- `packages/worker/package.json`
- `packages/worker/src/index.ts`
- `packages/worker/src/ai-processor.ts`

**Steps:**

- [ ] **Step 1: Create worker package structure**

```bash
mkdir -p packages/worker/src
```

- [ ] **Step 2: Create packages/worker/package.json**

```json
{
  "name": "@web-ai-ide/worker",
  "version": "1.0.0",
  "type": "module",
  "main": "src/index.ts",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "amqplib": "^0.10.0",
    "openai": "^4.0.0",
    "@anthropic-ai/sdk": "^0.27.0"
  },
  "devDependencies": {
    "tsx": "^4.0.0",
    "typescript": "^5.0.0"
  }
}
```

- [ ] **Step 3: Create packages/worker/src/index.ts**

```typescript
import amqp from 'amqplib';
import { processAITask } from './ai-processor.js';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
const OUTPUT_QUEUE = 'ai.results';

async function main() {
  const connection = await amqp.connect(RABBITMQ_URL);
  const channel = await connection.createChannel();

  await channel.assertQueue('ai.tasks', { durable: true });
  channel.prefetch(1); // Process one task at a time per worker

  console.log('Worker started, waiting for tasks...');

  channel.consume('ai.tasks', async (msg) => {
    if (!msg) return;

    try {
      const task = JSON.parse(msg.content.toString());
      console.log(`Processing task ${task.taskId}`);

      const result = await processAITask(task);

      channel.sendToQueue(
        OUTPUT_QUEUE,
        Buffer.from(JSON.stringify({
          taskId: task.taskId,
          sessionId: task.sessionId,
          status: 'success',
          result,
        })),
        { persistent: true }
      );
    } catch (error: any) {
      console.error('Task failed:', error);
      channel.sendToQueue(
        OUTPUT_QUEUE,
        Buffer.from(JSON.stringify({
          taskId: JSON.parse(msg.content.toString()).taskId,
          sessionId: JSON.parse(msg.content.toString()).sessionId,
          status: 'error',
          error: error.message,
        })),
        { persistent: true }
      );
    }

    channel.ack(msg);
  });
}

main().catch(console.error);
```

- [ ] **Step 4: Create packages/worker/src/ai-processor.ts**

```typescript
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

interface AITask {
  taskId: string;
  sessionId: string;
  tenantId: string;
  prompt: string;
  tools: any[];
  model: string;
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function processAITask(task: AITask): Promise<string> {
  const { prompt, model } = task;

  if (model.startsWith('gpt-')) {
    const response = await openai.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      stream: false,
    });
    return response.choices[0]?.message?.content || '';
  }

  if (model.startsWith('claude-')) {
    const response = await anthropic.messages.create({
      model,
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    });
    return response.content[0]?.type === 'text' ? response.content[0].text : '';
  }

  throw new Error(`Unsupported model: ${model}`);
}
```

---

### Task 4.4: Update Docker Compose with Worker

**Files to Modify:**
- `docker-compose.yml`

**Steps:**

- [ ] **Step 1: Add worker service**

```yaml
services:
  # ... existing services

  rabbitmq:
    image: rabbitmq:3-management
    ports:
      - "5672:5672"
      - "15672:15672"
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq

  worker:
    build: ./packages/worker
    environment:
      REDIS_URL: redis://redis:6379
      RABBITMQ_URL: amqp://rabbitmq:5672
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
    depends_on:
      - rabbitmq
    deploy:
      replicas: 2
```

---

## Phase 5: Database Read/Write Split

**Goal:** Improve database read performance with replicas

**Duration:** Week 4-5

### Task 5.1: PostgreSQL Replica Setup

**Steps:**

- [ ] **Step 1: Add replica to Docker Compose**

```yaml
services:
  postgres-primary:
    image: postgres:16
    volumes:
      - postgres_primary:/var/lib/postgresql/data
      - ./postgres/replica.conf:/etc/postgresql/replica.conf
    command: postgres -c config_file=/etc/postgresql/replica.conf

  postgres-replica:
    image: postgres:16
    volumes:
      - postgres_replica:/var/lib/postgresql/data
    environment:
      POSTGRES_HOST_PRIMARY: postgres-primary
      POSTGRES_USER: replicator
      POSTGRES_PASSWORD: replicator_password
    depends_on:
      - postgres-primary
```

- [ ] **Step 2: Configure streaming replication**

```bash
# On primary, create replication user
psql -U postgres -c "CREATE USER replicator WITH REPLICATION ENCRYPTED PASSWORD 'replicator_password';"
```

---

### Task 5.2: Prisma Read Replica Support

**Files to Modify:**
- `packages/server/src/utils/prisma.ts`

**Steps:**

- [ ] **Step 1: Create read replica client**

```typescript
import { PrismaClient } from '@prisma/client';

const DATABASE_URL = process.env.DATABASE_URL || '';
const DATABASE_REPLICA_URL = process.env.DATABASE_REPLICA_URL || DATABASE_URL;

// Primary for writes
export const prisma = new PrismaClient({
  datasources: {
    db: { url: DATABASE_URL },
  },
});

// Replica for reads
export const prismaRead = new PrismaClient({
  datasources: {
    db: { url: DATABASE_REPLICA_URL },
  },
});
```

- [ ] **Step 2: Update service methods**

```typescript
// Use prismaRead for list/find operations
export const projectService = {
  async listProjects() {
    return prismaRead.project.findMany({
      orderBy: { updatedAt: 'desc' },
    });
  },

  async getProject(id: string) {
    return prismaRead.project.findUnique({ where: { id } });
  },

  async createProject(data: { name: string; path: string; userId: string }) {
    return prisma.project.create({ data });
  },
};
```

---

### Task 5.3: Connection Pooling with PgBouncer

**Files to Modify:**
- `docker-compose.yml`

**Steps:**

- [ ] **Step 1: Add PgBouncer**

```yaml
services:
  pgbouncer:
    image: pgbouncer/pgbouncer:latest
    ports:
      - "6432:5432"
    environment:
      DATABASE_URL: postgresql://postgres:5432/webaiide
      POOL_MODE: transaction
      MAX_CLIENT_CONN: 1000
      DEFAULT_POOL_SIZE: 25
    depends_on:
      - postgres-primary
```

---

## Phase 6: EXE Startup Optimization

**Goal:** Reduce desktop application cold start time

**Duration:** Week 5-6

### Task 6.1: Code Splitting

**Files to Modify:**
- `packages/electron/src/App.tsx`
- `packages/electron/vite.config.ts`

**Steps:**

- [ ] **Step 1: Enable lazy loading in vite.config.ts**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'monaco-editor': ['monaco-editor'],
          'vendor': ['react', 'react-dom'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
});
```

- [ ] **Step 2: Lazy load Monaco Editor in component**

```typescript
import { lazy, Suspense, useState } from 'react';

const MonacoEditor = lazy(() => import('@monaco-editor/react'));

function CodeEditor({ file }) {
  const [editor, setEditor] = useState(null);

  return (
    <Suspense fallback={<div>Loading editor...</div>}>
      <MonacoEditor
        onMount={setEditor}
        // ... other props
      />
    </Suspense>
  );
}
```

---

### Task 6.2: Preconnect and Service Worker

**Files to Create/Modify:**
- `packages/electron/index.html`
- `packages/electron/public/sw.js`

**Steps:**

- [ ] **Step 1: Add preconnect to index.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Web AI IDE</title>
  <link rel="preconnect" href="https://api.webaiide.com">
  <link rel="dns-prefetch" href="https://api.webaiide.com">
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
```

- [ ] **Step 2: Create service worker for caching**

```javascript
const CACHE_NAME = 'webaiide-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/assets/vendor.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
```

---

## Phase 7: EXE Startup Optimization

**Goal:** Reduce desktop application cold start time
**Duration:** Week 5-6

### Task 7.1: Code Splitting

**Files to Modify:**
- `packages/electron/vite.config.ts`
- `packages/electron/src/App.tsx`

**Steps:**

- [ ] **Step 1: Enable lazy loading in vite.config.ts**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'monaco-editor': ['monaco-editor'],
          'vendor': ['react', 'react-dom'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
});
```

- [ ] **Step 2: Lazy load Monaco Editor in component**

```typescript
import { lazy, Suspense, useState } from 'react';

const MonacoEditor = lazy(() => import('@monaco-editor/react'));

function CodeEditor({ file }) {
  const [editor, setEditor] = useState(null);

  return (
    <Suspense fallback={<div>Loading editor...</div>}>
      <MonacoEditor
        onMount={setEditor}
        // ... other props
      />
    </Suspense>
  );
}
```

---

### Task 7.2: Preconnect and Service Worker

**Files to Create/Modify:**
- `packages/electron/index.html`
- `packages/electron/public/sw.js`

**Steps:**

- [ ] **Step 1: Add preconnect to index.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Web AI IDE</title>
  <link rel="preconnect" href="https://api.webaiide.com">
  <link rel="dns-prefetch" href="https://api.webaiide.com">
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
```

- [ ] **Step 2: Create service worker for caching**

```javascript
const CACHE_NAME = 'webaiide-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/assets/vendor.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
```

---

## Phase 8: Docker Production Deployment

**Goal:** Create production-ready Docker Compose configuration
**Duration:** Week 6-7

### Task 8.1: Production Docker Compose

**Files to Create:**
- `docker-compose.prod.yml`

**Steps:**

- [ ] **Step 1: Create production docker-compose**

```yaml
version: '3.9'

services:
  postgres:
    image: postgres:16-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G

  rabbitmq:
    image: rabbitmq:3-management
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - api
    restart: unless-stopped

  api:
    build:
      context: .
      dockerfile: packages/server/Dockerfile
    environment:
      TENANT_ID: shared
      DATABASE_URL: postgresql://webaiide:webaiide@postgres:5432/webaiide
      REDIS_URL: redis://redis:6379
      RABBITMQ_URL: amqp://guest:guest@rabbitmq:5672
    depends_on:
      - postgres
      - redis
      - rabbitmq
    restart: unless-stopped
    deploy:
      replicas: 3

  worker:
    build:
      context: .
      dockerfile: packages/worker/Dockerfile
    environment:
      REDIS_URL: redis://redis:6379
      RABBITMQ_URL: amqp://guest:guest@rabbitmq:5672
    depends_on:
      - redis
      - rabbitmq
    restart: unless-stopped
    deploy:
      replicas: 2

volumes:
  postgres_data:
  redis_data:
  rabbitmq_data:
```

---

### Task 8.2: Production Nginx Config

**Files to Create:**
- `nginx.conf`

**Steps:**

- [ ] **Step 1: Create production nginx.conf**

```nginx
worker_processes auto;
error_log /var/log/nginx/error.log warn;

events {
    worker_connections 1024;
}

http {
    upstream api_backend {
        least_conn;
        server api-1:3001;
        server api-2:3001;
        server api-3:3001;
        keepalive 32;
    }

    server {
        listen 80;
        return 301 https://$host$request_uri;
    }

    server {
        listen 443 ssl http2;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        location /health {
            return 200 'OK';
            add_header Content-Type text/plain;
        }

        location /api/ {
            proxy_pass http://api_backend;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /ws {
            proxy_pass http://api_backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_read_timeout 86400;
        }
    }
}
```

---

## Implementation Order Summary

| Phase | Task | Duration | Priority | Dependencies |
|-------|------|----------|----------|--------------|
| 1 | Redis Session Externalization | Week 1-2 | Critical | None |
| 2 | Stateless API + Load Balancing | Week 2 | High | Phase 1 |
| 3 | Multi-Tenant Schema Isolation | Week 2-3 | Critical | Phase 1 |
| 4 | RabbitMQ Worker Pool | Week 3-4 | High | Phase 1 |
| 5 | Database Read Replica | Week 4-5 | Medium | Phase 2 |
| 6 | EXE Startup Optimization | Week 5-6 | Medium | None |
| 7 | Docker Production Deployment | Week 6-7 | Medium | Phase 2, 4 |

---

## Architecture Comparison Summary

### Current State vs Target State

| Component | Current | Target | Improvement |
|-----------|---------|--------|-------------|
| **Backend** | Single Fastify instance | 3+ instances with Nginx LB | N× horizontal scaling |
| **Session State** | In-memory (lost on restart) | Redis (24h TTL, persistent) | Reliability + scaling |
| **AI Processing** | Synchronous (blocking) | Async via RabbitMQ Worker Pool | UI non-blocking |
| **Multi-Tenancy** | None (single schema) | Schema per tenant | Enterprise isolation |
| **Database** | Single PostgreSQL | R/W split with replica | Read performance +300% |
| **Load Balancing** | None | Nginx sticky sessions | Session affinity |
| **Caching** | None | Redis multi-purpose | Reduced DB load |
| **Message Queue** | None | RabbitMQ | Async task processing |

---

## Verification Checklist

After each phase, verify:

- [ ] **Phase 1:** Redis connection and session caching working
- [ ] **Phase 2:** Tenant isolation prevents cross-tenant data access
- [ ] **Phase 3:** Multiple API instances handle requests correctly
- [ ] **Phase 4:** Worker processes AI tasks from queue
- [ ] **Phase 5:** Read replica serves read queries
- [ ] **Phase 6:** EXE starts within 3 seconds
- [ ] **Phase 7:** Kubernetes deployments scale correctly

---

## Files Summary

### New Files to Create

```
packages/server/src/
├── utils/
│   ├── redis.ts              # Redis client singleton
│   └── rabbitmq.ts           # RabbitMQ client singleton
├── services/
│   ├── session-cache.service.ts  # Redis session caching
│   └── queue.service.ts      # RabbitMQ publisher
└── middleware/
    └── tenant.ts             # Multi-tenant middleware

packages/worker/              # NEW PACKAGE
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts              # Worker entry point
    └── ai-processor.ts       # AI task processor

nginx.conf                    # Load balancer config
docker-compose.yml            # Updated with all services
```

### Files to Modify

```
packages/server/
├── package.json              # Add: ioredis, amqplib
├── src/
│   ├── index.ts              # Add: Redis/RabbitMQ init, graceful shutdown
│   └── services/
│       └── session.service.ts # Integrate Redis cache

packages/server/prisma/
└── schema.prisma              # Add: Tenant, ApiKey models (for multi-tenancy)

packages/electron/
├── vite.config.ts            # Code splitting, lazy loading
└── src/
    └── App.tsx               # Add: lazy Monaco, preconnect
```

---

**Plan Status:** Ready for Implementation
**Next Step:** Begin Phase 1 implementation (Redis Session Externalization)
