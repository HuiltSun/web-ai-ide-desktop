# Web AI IDE - Scalable Architecture Design Specification

**Date:** 2026-04-07
**Status:** Draft
**Version:** 3.1
**Supersedes:** 2026-04-03-web-ai-ide-design.md

---

## 1. Overview

### 1.1 Current Architecture (As-Is)

```
┌─────────────────────────────────────────────────────────────┐
│                    Clients                                   │
│  ┌─────────────────────┐      ┌─────────────────────┐      │
│  │  Web Browser        │      │  Electron Desktop   │      │
│  │  (localhost:3000)   │      │  (EXE)               │      │
│  └─────────────────────┘      └─────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                  Single Backend (Fastify)                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ JWT Auth | REST API | WebSocket | File Ops         │   │
│  └─────────────────────────────────────────────────────┘   │
│                               │                            │
│  ┌───────────────────────────┴───────────────────────┐   │
│  │              PostgreSQL (Single Schema)            │   │
│  │   Users | Projects | Sessions | Messages           │   │
│  └────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Current Limitations

| Component | Current State | Problem |
|-----------|---------------|---------|
| **Database** | Single schema, no tenant model | No multi-tenancy support |
| **Session State** | In-memory (lost on restart) | No horizontal scaling |
| **AI Calls** | Synchronous (blocking) | UI freezes during AI response |
| **Backend** | Single instance | Single point of failure |
| **Load Balancing** | None | Cannot scale horizontally |
| **Caching** | None | Repeated queries hit DB |

### 1.3 Target Architecture

See Section 2 for the full target architecture diagram.

---

## 2. Architecture Overview

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Clients                                             │
│  ┌─────────────────────┐      ┌─────────────────────┐                       │
│  │  Web Browser        │      │  Electron Desktop   │                       │
│  │  (localhost:3000)   │      │  (EXE)               │                       │
│  └─────────────────────┘      └─────────────────────┘                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Load Balancer Layer                                  │
│  ┌─────────────────────┐      ┌─────────────────────┐                       │
│  │  Nginx              │      │  Cloud LB            │                       │
│  │  (WebSocket sticky) │      │  (AWS ALB/GCLB)     │                       │
│  └─────────────────────┘      └─────────────────────┘                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Tenant Namespace (Per Customer)                           │
│                                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                     │
│  │ Fastify 1  │    │ Fastify 2  │    │ Fastify N  │  (Stateless API)     │
│  │ (API + WS) │    │ (API + WS) │    │ (API + WS) │                     │
│  └─────────────┘    └─────────────┘    └─────────────┘                     │
│                                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                     │
│  │ Worker 1    │    │ Worker 2    │    │ Worker N    │  (AI Task Pool)    │
│  └─────────────┘    └─────────────┘    └─────────────┘                     │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    Redis (Session Cache)                              │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Shared Infrastructure                                 │
│                                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                    │
│  │ RabbitMQ    │    │ PostgreSQL  │    │ Redis       │                    │
│  │ (Task Queue)│    │ (R/W Split) │    │ (Cluster)   │                    │
│  └─────────────┘    └─────────────┘    └─────────────┘                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Component Responsibilities

| Layer | Component | Responsibility | Scaling Strategy |
|-------|-----------|----------------|------------------|
| **Edge** | Nginx | TLS termination, routing, WebSocket sticky sessions | Horizontal (add more API instances) |
| **Application** | Fastify (Stateless) | REST API, WebSocket handling, request validation | Horizontal (docker-compose --scale) |
| **Session** | Redis | Session state, real-time caching, pub/sub | Redis Cluster or Sentinel |
| **Task Queue** | RabbitMQ | AI task distribution, load leveling | Clustering for HA |
| **Worker** | Worker Pool | AI provider calls, long-running tasks | Horizontal (docker-compose --scale) |
| **Data** | PostgreSQL | Persistent storage | Read replicas for scaling reads |

---

## 3. Multi-Tenancy Design

### 3.1 Isolation Strategy: Shared Database + Schema Isolation

This approach balances cost efficiency with security isolation:

```
PostgreSQL Instance
│
├── public schema (System)
│   ├── tenants (tenant registry)
│   └── api_keys (encrypted, tenant-scoped)
│
├── tenant_a schema
│   ├── users
│   ├── projects
│   ├── sessions
│   └── messages
│
├── tenant_b schema
│   ├── users
│   ├── projects
│   ├── sessions
│   └── messages
│
└── tenant_c schema
    └── ...
```

### 3.2 Tenant Context Flow

```
1. Client Request
   │
   ├─ Header: X-API-Key: ta_xxxxx
   │
2. Nginx Routes to Tenant Namespace
   │
3. Fastify Middleware extracts tenant
   │
4. Prisma SET search_path TO {tenant_schema}, public
   │
5. Request processed with tenant scope
```

### 3.3 Resource Quotas (Kubernetes)

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: tenant-quota
  namespace: tenant-{id}
spec:
  hard:
    requests.cpu: "4"
    requests.memory: 8Gi
    pods: "20"
---
apiVersion: v1
kind: LimitRange
metadata:
  name: tenant-limits
  namespace: tenant-{id}
spec:
  limits:
    - type: Container
      default:
        cpu: 500m
        memory: 512Mi
      max:
        cpu: 2
        memory: 2Gi
```

---

## 4. Session State Management

### 4.1 Redis Data Structures

```
# Session State (24h TTL)
session:{sessionId} → {
  tenantId: string,
  userId: string,
  projectId: string,
  cursor: string,
  context: Message[],
  provider: string,
  createdAt: timestamp
}

# WebSocket Connection Mapping
ws:user:{userId} → sessionId (for multi-tab sync)

# Real-time Presence
presence:session:{sessionId} → Set<userId>

# Rate Limiting
ratelimit:tenant:{tenantId}:{minute} → count
```

### 4.2 Sticky Session Configuration (Nginx)

```nginx
upstream backend {
  ip_hash;  # Sticky session by client IP
  server api-1:3001;
  server api-2:3001;
  server api-3:3001;
  keepalive 32;
}

server {
  location / {
    proxy_pass http://backend;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Tenant-ID $cookie_tenant;
  }

  location /ws {
    proxy_pass http://backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 86400;
  }
}
```

---

## 5. Async Task Processing

### 5.1 RabbitMQ Architecture

```
                    ┌─────────────┐
                    │   Fastify   │
                    │   (Publish) │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  RabbitMQ   │
                    │  Exchange   │
                    └──┬───────┬──┘
                       │       │
              ┌────────▼──┐ ┌───▼────────┐
              │ ai.tasks  │ │ ai.results │
              │  (Queue)  │ │  (Queue)   │
              └─────┬─────┘ └──────┬────┘
                    │              │
           ┌────────▼──┐    ┌──────▼──────┐
           │  Worker 1  │    │  Worker N   │
           └────────────┘    └─────────────┘
```

### 5.2 Message Format

```typescript
// Task Message
interface AITaskMessage {
  taskId: string;
  tenantId: string;
  sessionId: string;
  prompt: string;
  tools: ToolDefinition[];
  model: string;
  timestamp: number;
}

// Result Message
interface AIResultMessage {
  taskId: string;
  sessionId: string;
  status: 'success' | 'error';
  result?: string;
  error?: string;
}
```

### 5.3 Worker Pool Scaling

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: worker-hpa
  namespace: tenant-{id}
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ai-worker
  minReplicas: 2
  maxReplicas: 20
  metrics:
    - type: External
      external:
        metric:
          name: rabbitmq_queue_messages
          selector:
            matchLabels:
              queue: ai.tasks
        target:
          type: AverageValue
          averageValue: "100"
```

---

## 6. Database Optimization

### 6.1 Read/Write Split

```typescript
// Write operations → Master
await prisma.master.create({ data: userData });

// Read operations → Replica (load balanced)
await prisma.replica.findMany({ where: { tenantId } });
```

### 6.2 Connection Pooling

```yaml
# PostgreSQL Pool Configuration
shared_buffers: 256MB
max_connections: 100
effective_cache_size: 1GB
maintenance_work_mem: 64MB

# PgBouncer for connection pooling
[databases]
webaiide = host=postgres-primary port=5432 dbname=webaiide
webaiide_replica = host=postgres-replica-1 port=5432 dbname=webaiide

[pgbouncer]
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25
```

---

## 7. Docker Compose Comparison

### 7.1 Current Docker Compose (As-Is)

```yaml
# Existing docker-compose.yml
version: '3.8'
services:
  frontend:
    build: ./packages/cli
    ports:
      - "3000:80"
    depends_on:
      - backend

  backend:
    build: ./packages/server
    ports:
      - "3001:3001"
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}
    depends_on:
      - db

  db:
    image: postgres:15-alpine
    volumes:
      - pgdata:/var/lib/postgresql/data
```

**Issues with current setup:**
- Single backend instance (no scaling)
- No Redis (no session caching)
- No RabbitMQ (no async task processing)
- No load balancing
- PostgreSQL 15 (could upgrade to 16)

### 7.2 Target Docker Compose (To-Be)

```yaml
# Target docker-compose.yml
version: '3.9'

services:
  # === Shared Infrastructure ===

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-webaiide}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-webaiide}
      POSTGRES_DB: ${POSTGRES_DB:-webaiide}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - webaiide

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - webaiide

  rabbitmq:
    image: rabbitmq:3-management
    ports:
      - "5672:5672"
      - "15672:15672"
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
    networks:
      - webaiide

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - api-1
      - api-2
      - api-3
    networks:
      - webaiide

  # === API Instances (Horizontally Scalable) ===

  api-1:
    build: ./packages/server
    environment:
      TENANT_ID: shared
      DATABASE_URL: postgresql://webaiide:webaiide@postgres:5432/webaiide
      REDIS_URL: redis://redis:6379
      RABBITMQ_URL: amqp://guest:guest@rabbitmq:5672
    depends_on:
      - redis
      - rabbitmq
    networks:
      - webaiide

  api-2:
    build: ./packages/server
    environment:
      TENANT_ID: shared
      DATABASE_URL: postgresql://webaiide:webaiide@postgres:5432/webaiide
      REDIS_URL: redis://redis:6379
      RABBITMQ_URL: amqp://guest:guest@rabbitmq:5672
    depends_on:
      - redis
      - rabbitmq
    networks:
      - webaiide

  api-3:
    build: ./packages/server
    environment:
      TENANT_ID: shared
      DATABASE_URL: postgresql://webaiide:webaiide@postgres:5432/webaiide
      REDIS_URL: redis://redis:6379
      RABBITMQ_URL: amqp://guest:guest@rabbitmq:5672
    depends_on:
      - redis
      - rabbitmq
    networks:
      - webaiide

  # === Worker Pool (AI Task Processing) ===

  worker-1:
    build: ./packages/worker
    environment:
      REDIS_URL: redis://redis:6379
      RABBITMQ_URL: amqp://guest:guest@rabbitmq:5672
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
    depends_on:
      - redis
      - rabbitmq
    networks:
      - webaiide

  worker-2:
    build: ./packages/worker
    environment:
      REDIS_URL: redis://redis:6379
      RABBITMQ_URL: amqp://guest:guest@rabbitmq:5672
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
    depends_on:
      - redis
      - rabbitmq
    networks:
      - webaiide

networks:
  webaiide:
    driver: bridge

volumes:
  postgres_data:
  redis_data:
  rabbitmq_data:
```

---

## 8. Deployment Architecture (Docker Only)

### 8.1 Docker Compose Production Stack

For production deployments, use Docker Compose with multiple replicas:

```yaml
# docker-compose.prod.yml
version: '3.9'

services:
  # === Infrastructure ===

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

  # === Load Balancer ===

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - api-1
      - api-2
      - api-3
    restart: unless-stopped

  # === API Replicas ===

  api-1:
    build: ./packages/server
    environment:
      TENANT_ID: shared
      DATABASE_URL: postgresql://webaiide:webaiide@postgres:5432/webaiide
      REDIS_URL: redis://redis:6379
      RABBITMQ_URL: amqp://guest:guest@rabbitmq:5672
    restart: unless-stopped

  api-2:
    build: ./packages/server
    environment:
      TENANT_ID: shared
      DATABASE_URL: postgresql://webaiide:webaiide@postgres:5432/webaiide
      REDIS_URL: redis://redis:6379
      RABBITMQ_URL: amqp://guest:guest@rabbitmq:5672
    restart: unless-stopped

  api-3:
    build: ./packages/server
    environment:
      TENANT_ID: shared
      DATABASE_URL: postgresql://webaiide:webaiide@postgres:5432/webaiide
      REDIS_URL: redis://redis:6379
      RABBITMQ_URL: amqp://guest:guest@rabbitmq:5672
    restart: unless-stopped

  # === Worker Pool ===

  worker-1:
    build: ./packages/worker
    environment:
      REDIS_URL: redis://redis:6379
      RABBITMQ_URL: amqp://guest:guest@rabbitmq:5672
    restart: unless-stopped

  worker-2:
    build: ./packages/worker
    environment:
      REDIS_URL: redis://redis:6379
      RABBITMQ_URL: amqp://guest:guest@rabbitmq:5672
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
  rabbitmq_data:
```

### 8.2 Scaling Commands

```bash
# Scale API instances
docker-compose up -d --scale api=5

# Scale workers
docker-compose up -d --scale worker=4

# View running containers
docker-compose ps

# View logs
docker-compose logs -f api-1
```

### 8.3 Health Checks

All services should implement health checks for orchestration:

```yaml
services:
  api-1:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

---

## 9. EXE Startup Optimization

### 9.1 Current Bottlenecks

1. **Bundle Size** - Large JS bundle requires time to download/parse
2. **Backend Connection Wait** - App waits for backend before showing UI
3. **Monaco Editor** - Heavy component, lazy load required

### 9.2 Optimization Strategies

| Strategy | Impact | Implementation |
|----------|--------|----------------|
| Code Splitting | High | Lazy load non-critical components |
| Service Worker | High | Cache static assets |
| Backend Pre-connect | Medium | Connect to backend on splash screen |
| Monaco Lazy Load | High | Load editor only when needed |
| Asset Optimization | Medium | Minify, compress, CDN |
| Electron Builder Optimization | Medium | Disable unnecessary features |

### 9.3 Implementation

```typescript
// Lazy load Monaco Editor
const MonacoEditor = lazy(() => import('@monaco-editor/react'));

// Pre-connect to backend during splash
useEffect(() => {
  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = 'https://api.webaiide.com';
  document.head.appendChild(link);
}, []);

// Service worker for offline caching
navigator.serviceWorker.register('/sw.js');
```

---

## 10. Security Considerations

### 10.1 Multi-Tenant Security

- **Schema Isolation** - Each tenant's data in separate PostgreSQL schema
- **API Key Rotation** - Automatic rotation with zero downtime
- **Rate Limiting** - Per-tenant limits prevent resource exhaustion
- **Network Policies** - Kubernetes network policies restrict pod-to-pod communication

### 10.2 Data Encryption

- **TLS 1.3** - All external communications encrypted
- **AES-256-GCM** - Sensitive fields encrypted at rest (existing)
- **Redis TLS** - Inter-service communication encrypted

---

## 11. Monitoring & Observability

### 11.1 Metrics

| Metric | Source | Alert Threshold |
|--------|--------|-----------------|
| API Latency P99 | Nginx/Prometheus | > 500ms |
| Error Rate | Fastify/Prometheus | > 1% |
| Queue Depth | RabbitMQ | > 1000 |
| Worker Utilization | K8s Metrics | > 80% |
| DB Connections | PgBouncer | > 80% |

### 11.2 Logging

```yaml
# Fluentd/Fluent Bit config for multi-tenant log routing
<filter tenant-*.**>
  @type parser
  key_name log
  format json
  add_prefix kubernetes.tenant
</filter>
```

---

## 12. Migration Path

### Phase 1: Redis Session Externalization (Week 1-2)
1. Add Redis client to Fastify
2. Move session state to Redis
3. Update session service for cache-first reads
4. Deploy and test

### Phase 2: Stateless API + Load Balancing (Week 2)
1. Add Nginx with sticky session configuration
2. Deploy multiple API instances via docker-compose
3. Verify session continuity across instances

### Phase 3: Multi-Tenant Schema Isolation (Week 2-3)
1. Add Tenant and ApiKey models to Prisma schema
2. Create tenant context middleware
3. Implement schema-based data isolation
4. Add tenant-specific API key validation

### Phase 4: RabbitMQ Worker Pool (Week 3-4)
1. Integrate RabbitMQ publisher in Fastify
2. Create worker service package
3. Migrate AI calls to async queue
4. Add result subscription via Redis pub/sub

### Phase 5: Database Read Replica (Week 4-5)
1. Set up PostgreSQL replica
2. Update Prisma client for read/write separation
3. Route read queries to replica
4. Load test

### Phase 6: EXE Startup Optimization (Week 5-6)
1. Implement code splitting with lazy loading
2. Add Monaco Editor lazy load
3. Configure service worker for caching
4. Optimize Electron build settings

---

## 13. Appendix

### 13.1 Glossary

| Term | Definition |
|------|------------|
| **Tenant** | A customer organization with isolated data and resources |
| **Schema Isolation** | PostgreSQL feature where each tenant has its own schema |
| **Sticky Session** | Routing user requests to the same backend server |
| **Docker Compose Scale** | Docker Compose feature for running multiple containers of same image |
| **RabbitMQ** | Message broker for asynchronous task processing |

### 13.2 References

- [Qwen Code Architecture](https://github.com/QwenLM/qwen-code)
- [Prisma Multi-Schema](https://www.prisma.io/docs/guides/multi-tenancy)
- [Docker Compose Scaling](https://docs.docker.com/compose/features_overview/)
- [RabbitMQ Clustering](https://www.rabbitmq.com/clustering.html)
- [Nginx Load Balancing](https://docs.nginx.com/nginx/admin-guide/load-balancer/)

---

**Document Status:** Ready for Review
**Next Step:** Create implementation plan
