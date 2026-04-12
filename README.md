# Web AI IDE

A browser-based + Electron desktop AI-assisted coding environment with multi-AI model support, code editing, and terminal emulation.

---

## Tech Stack

| Module | Technology | Version |
|--------|------------|---------|
| Frontend | React, TypeScript, Vite, TailwindCSS | React 18, TypeScript 5.x |
| Desktop | Electron | 30.x |
| Code Editor | Monaco Editor | Latest stable |
| Backend | Fastify, Node.js | Fastify 4 |
| Database | PostgreSQL, Prisma ORM | PostgreSQL 16 |
| Container | Docker, Docker Compose | - |

---

## Project Structure

```
web-ai-ide/
├── packages/
│   ├── electron/              # Electron desktop app
│   │   ├── electron/          # Main process (main.ts, preload.ts)
│   │   └── src/              # React frontend
│   │       ├── components/   # UI components
│   │       ├── hooks/        # State hooks
│   │       ├── services/     # API, WebSocket clients
│   │       ├── contexts/     # SettingsContext
│   │       └── i18n/         # Internationalization
│   ├── cli/                   # Standalone React web app
│   ├── core/                 # AI core logic (AIGateway + Providers)
│   ├── openclaude-temp/      # AI Agent gRPC service
│   ├── server/               # Fastify backend API
│   └── shared/               # Shared type definitions
├── docs/                     # Design documents
├── release/                  # Build output
├── docker-compose.yml        # Docker orchestration
├── debug.ps1                # One-click startup script
└── package.json
```

---

## Installation / Quick Start

### Prerequisites

- Node.js >= 20.0
- Docker >= 24.0
- PostgreSQL >= 16 (if not using Docker)

### Desktop App (Recommended)

```powershell
# 1. Clone
git clone https://github.com/your/web-ai-ide.git
cd web-ai-ide

# 2. Set database credentials (required)
$env:POSTGRES_USER="your_username"
$env:POSTGRES_PASSWORD="your_strong_password"

# 3. One-click start
.\debug.ps1
```

`debug.ps1` automatically:
- Starts PostgreSQL (Docker)
- Initializes database (Prisma)
- Starts backend server
- Launches desktop app

### Docker Deployment

```bash
# 1. Clone
git clone https://github.com/your/web-ai-ide.git
cd web-ai-ide

# 2. Start
docker-compose up -d
```

### Development Mode

```bash
# Backend
cd packages/server
npm install
npx prisma generate
npx prisma db push
npm run dev

# Desktop app
cd packages/electron
npm install
npm run dev
```

---

## Features

### AI Chat

Real-time conversations with AI assistants, supporting streaming responses.

```typescript
// Send message
ws.send(JSON.stringify({
  type: 'chat:message',
  sessionId: 'session_xxx',
  message: 'Explain this code'
}));
```

### Code Editor

Powered by Monaco Editor, supporting multiple tabs and syntax highlighting.

```typescript
// Open file
const content = await api.readFile(projectId, '/src/index.ts');
```

### File Explorer

Project file tree with create, edit, delete support.

```typescript
// Create file
await api.writeFile(projectId, '/src/utils.ts', 'export function helper() {}');
```

### Terminal

Built-in web terminal with WebSocket PTY support.

### Multi-Model Support

Supports OpenAI GPT, Anthropic Claude, Qwen, and more.

```typescript
// Configure API Key in Settings panel
// Or via environment variable
env OPENAI_API_KEY=sk-...
```

---

## API Reference

### REST Endpoints

#### GET /api/projects

List all user projects.

Returns：`Project[]` — Array of projects

**Example**
```typescript
const projects = await fetch('/api/projects', {
  headers: { 'Authorization': `Bearer ${token}` }
});
// [{ id: "proj_xxx", name: "my-project", path: "/path/to/project" }, ...]
```

#### POST /api/projects

Create a new project.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Project name, 1-50 characters |
| path | string | Yes | Project path |
| userId | string | Yes | User ID |

Returns：`Project` — Created project object

**Example**
```typescript
const project = await fetch('/api/projects', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({ name: 'my-project', path: '/path/to/project', userId: 'user_123' })
});
// { id: "proj_xxx", name: "my-project", path: "/path/to/project", userId: "user_123", createdAt: "..." }
```

#### DELETE /api/projects/:id

Delete a project.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes | Project ID |

Returns：`{ success: boolean }`

#### GET /api/sessions/:id

Get session details.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes | Session ID |

Returns：`Session` — Session object

#### POST /api/sessions

Create a new session.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| projectId | string | Yes | Associated project ID |

Returns：`Session` — Created session object

### WebSocket Events

#### chat:message (Client → Server)

Send a chat message.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| type | string | Yes | Fixed `"chat:message"` |
| sessionId | string | Yes | Session ID |
| message | string | Yes | Message content |

**Example**
```typescript
ws.send(JSON.stringify({
  type: 'chat:message',
  sessionId: 'session_xxx',
  message: 'Explain this code'
}));
```

#### chat:stream (Server → Client)

AI streaming response.

| Param | Type | Description |
|-------|------|-------------|
| type | string | Fixed `"chat:stream"` |
| sessionId | string | Session ID |
| content | string | Response content fragment |

#### chat:tool_call (Server → Client)

Tool call request.

| Param | Type | Description |
|-------|------|-------------|
| type | string | Fixed `"chat:tool_call"` |
| tool | string | Tool name |
| params | object | Tool parameters |

#### chat:approve (Client → Server)

Approve tool call.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| type | string | Yes | Fixed `"chat:approve"` |
| callId | string | Yes | Call ID |

#### chat:reject (Client → Server)

Reject tool call.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| type | string | Yes | Fixed `"chat:reject"` |
| callId | string | Yes | Call ID |

### gRPC Interface

```protobuf
service AgentService {
  rpc Chat(stream ClientMessage) returns (stream ServerMessage);
}
```

| Param | Type | Description |
|-------|------|-------------|
| GRPC_PORT | number | Default `50051` |
| GRPC_HOST | string | Default `localhost` |

---

## Database

### Environment Variables

```
DATABASE_URL="postgresql://user:pass@localhost:5432/db"
```

### Data Encryption

Sensitive fields are encrypted with AES-256-GCM:

| Field | Model |
|-------|-------|
| apiKeys | User |
| path | Project |
| cwd | Session |
| content, systemPayload | Message |

---

## Contributing

### Opening Issues

- Bug Report：Use [issue template](https://github.com/your/web-ai-ide/issues/new?template=bug_report.yml), describe reproduction steps and environment info
- Feature Request：Use [feature template](https://github.com/your/web-ai-ide/issues/new?template=feature_request.yml), explain use case and expected behavior

### Branch Naming

- `feat/xxx` — New feature
- `fix/xxx` — Bug fix
- `docs/xxx` — Documentation update
- `refactor/xxx` — Code refactoring

### Development Flow

1. Fork this repository, create a feature branch from `main`: `git checkout -b feat/your-feature`
2. Ensure lint and type checks pass before committing: `npm run lint && npm run typecheck`
3. If public API changes are involved, update README documentation
4. Create a Pull Request describing the change purpose and test methods

### Local Development

```bash
# lint
npm run lint

# type check
npm run typecheck

# test
npm test
```

---

## License

MIT License