# Web AI IDE - Phase 1: Redis Session Externalization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Redis client to Fastify server and implement session caching for horizontal scaling support

**Architecture:** Session state will be cached in Redis with 24h TTL, while maintaining database as persistent store. Cache-first reads for performance, with database fallback.

**Tech Stack:** ioredis, existing Fastify server, existing Prisma

---

## File Structure

```
packages/server/
├── src/
│   ├── utils/
│   │   └── redis.ts              # NEW: Redis client singleton
│   ├── services/
│   │   └── session-cache.service.ts  # NEW: Redis session caching
│   └── services/
│       └── session.service.ts     # MODIFY: Integrate Redis cache
├── package.json                   # MODIFY: Add ioredis dependency
└── .env.example                   # MODIFY: Add REDIS_URL
```

---

## Task 1: Add Redis Dependency

**Files:**
- Modify: `packages/server/package.json`
- Modify: `packages/server/.env.example`

- [ ] **Step 1: Install ioredis**

Run: `cd packages/server && npm install ioredis && npm install -D @types/ioredis`

- [ ] **Step 2: Add REDIS_URL to .env.example**

Add to file:
```
REDIS_URL=redis://localhost:6379
```

---

## Task 2: Create Redis Client Singleton

**Files:**
- Create: `packages/server/src/utils/redis.ts`

- [ ] **Step 1: Create Redis client utility**

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
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
      });

      RedisClient.instance.on('error', (err) => {
        console.error('Redis connection error:', err);
      });

      RedisClient.instance.on('connect', () => {
        console.log('Redis connected successfully');
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

---

## Task 3: Create Session Cache Service

**Files:**
- Create: `packages/server/src/services/session-cache.service.ts`

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

const SESSION_TTL = 60 * 60 * 24; // 24 hours in seconds

export const sessionCacheService = {
  async getSession(sessionId: string): Promise<SessionCache | null> {
    try {
      const data = await redis.get(`session:${sessionId}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Redis getSession error:', error);
      return null;
    }
  },

  async setSession(sessionId: string, session: SessionCache): Promise<void> {
    try {
      await redis.setex(
        `session:${sessionId}`,
        SESSION_TTL,
        JSON.stringify(session)
      );
    } catch (error) {
      console.error('Redis setSession error:', error);
    }
  },

  async updateSession(sessionId: string, updates: Partial<SessionCache>): Promise<void> {
    const existing = await this.getSession(sessionId);
    if (existing) {
      const updated = { ...existing, ...updates };
      await this.setSession(sessionId, updated);
    }
  },

  async deleteSession(sessionId: string): Promise<void> {
    try {
      await redis.del(`session:${sessionId}`);
    } catch (error) {
      console.error('Redis deleteSession error:', error);
    }
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

## Task 4: Integrate Redis Cache with Session Service

**Files:**
- Read: `packages/server/src/services/session.service.ts`
- Modify: `packages/server/src/services/session.service.ts`

- [ ] **Step 1: Read existing session service**

Read file: `packages/server/src/services/session.service.ts`

- [ ] **Step 2: Add Redis import and integrate caching**

Modify the file to add:

```typescript
import { sessionCacheService } from './session-cache.service.js';
```

Update `createSession` method to cache after create:

```typescript
async createSession(projectId: string, model: string, tenantId: string, userId: string) {
  const session = await prisma.session.create({
    data: { projectId, model },
  });

  // Cache in Redis for fast access
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
}
```

Update `getSession` method for cache-first read:

```typescript
async getSession(id: string) {
  // Try cache first for fast access
  const cached = await sessionCacheService.getSession(id);
  if (cached) {
    console.log(`Session ${id} found in cache`);
    return cached;
  }

  // Fallback to database
  const session = await prisma.session.findUnique({
    where: { id },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  });

  // Cache for next time
  if (session) {
    await sessionCacheService.setSession(session.id, {
      tenantId: '', // Will be set by caller
      userId: '',
      projectId: session.projectId,
      cursor: '',
      context: session.messages,
      provider: session.model,
      createdAt: session.createdAt.getTime(),
    });
  }

  return session;
}
```

Add `deleteSession` to also clear cache:

```typescript
async deleteSession(id: string) {
  // Delete from cache first
  await sessionCacheService.deleteSession(id);
  // Then from database
  return prisma.session.delete({ where: { id } });
}
```

---

## Task 5: Add Graceful Shutdown

**Files:**
- Read: `packages/server/src/index.ts`
- Modify: `packages/server/src/index.ts`

- [ ] **Step 1: Read existing index.ts**

Read file: `packages/server/src/index.ts`

- [ ] **Step 2: Add Redis shutdown handler**

Add import:
```typescript
import { redis } from './utils/redis.js';
```

Add shutdown handler after server.listen:

```typescript
// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...');
  await server.close();
  await redis.quit();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down...');
  await server.close();
  await redis.quit();
  process.exit(0);
});
```

---

## Task 6: Update Docker Compose

**Files:**
- Read: `docker-compose.yml`
- Modify: `docker-compose.yml`

- [ ] **Step 1: Read existing docker-compose.yml**

Read file: `docker-compose.yml`

- [ ] **Step 2: Add Redis service and update backend**

Add Redis service:

```yaml
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - webaiide
```

Update backend environment:

```yaml
  backend:
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER:-webaiide}:${POSTGRES_PASSWORD:-webaiide}@db:5432/${POSTGRES_DB:-webaiide}
      REDIS_URL: redis://redis:6379
```

Add to volumes:

```yaml
volumes:
  pgdata:
  redis_data:
```

---

## Task 7: Test Redis Integration

- [ ] **Step 1: Start Docker services**

Run: `docker-compose up -d redis db`

- [ ] **Step 2: Verify Redis connection**

Run: `docker-compose exec redis redis-cli ping`
Expected: `PONG`

- [ ] **Step 3: Start backend**

Run: `cd packages/server && npm run dev`

- [ ] **Step 4: Check for Redis connection log**

Expected in console: `Redis connected successfully`

- [ ] **Step 5: Test session creation**

Create a session via API and verify it's cached in Redis:

Run: `docker-compose exec redis redis-cli keys "session:*"`

Expected: Should show session keys after API calls

---

## Task 8: Commit Phase 1

- [ ] **Step 1: Stage changes**

Run: `cd e:/web/web-ai-ide && git add packages/server/src/utils/redis.ts packages/server/src/services/session-cache.service.ts packages/server/src/services/session.service.ts packages/server/package.json packages/server/.env.example docker-compose.yml`

- [ ] **Step 2: Commit**

Run: `git commit -m "feat(server): add Redis session caching for horizontal scaling"`
