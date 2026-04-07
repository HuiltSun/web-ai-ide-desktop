# Web AI IDE

A browser-based + Electron desktop AI-assisted coding environment similar to Claude Code.

[English](README.md) | [中文](README_zh.md)

---

## Features

- 🤖 **AI Chat** - Real-time conversations with AI assistants supporting streaming responses
- 💻 **Code Editor** - Professional code editing powered by Monaco Editor
- 📁 **File Explorer** - Project file tree with create, edit, delete support
- 🖥️ **Terminal** - Built-in web terminal
- 🔧 **Tool System** - AI can invoke file read/write, shell commands and more
- 🔄 **Multi-Model Support** - OpenAI GPT, Anthropic Claude, Qwen and more
- 💾 **Session Management** - Save and restore conversation history (PostgreSQL storage)
- 🗄️ **Project Management** - Project persistence (PostgreSQL)
- 🐳 **Docker Deployment** - Quick deployment to any environment
- 💻 **Desktop App** - Windows EXE native desktop application

---

## Tech Stack

| Module | Technology |
|--------|------------|
| Frontend | React 18, TypeScript, Vite, TailwindCSS |
| Desktop | Electron 30 |
| Code Editor | Monaco Editor |
| Backend | Fastify 4, Node.js |
| Database | PostgreSQL 16, Prisma ORM |
| AI | OpenAI, Anthropic, Qwen |
| Container | Docker, Docker Compose |
| Packaging | Electron Builder |

---

## Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 16+ (if not using Docker)

### Option 1: Desktop App (Recommended)

1. Build EXE:
```bash
cd packages/electron
npm install
npm run build
```

2. Start PostgreSQL:
```bash
docker run -d --name webaiide-postgres \
  -e POSTGRES_USER=user \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=webaiide \
  -p 5432:5432 postgres:16
```

3. Start backend server:
```bash
cd packages/server
npm install
npx prisma generate
npx prisma db push
npm run dev
```

4. Run desktop app:
```
web-ai-ide/release/release-{timestamp}/Web AI IDE Setup 1.0.0.exe
```

### Option 2: Docker Deployment

```bash
docker-compose up -d
```

### Option 3: Development Mode

**Backend:**
```bash
cd packages/server
npm run dev  # http://localhost:3001
```

**Desktop App:**
```bash
cd packages/electron
npm run dev
```

---

## Project Structure

```
web-ai-ide/
├── packages/
│   ├── electron/           # Electron desktop app
│   │   ├── electron/      # Main process (main.ts, preload.ts)
│   │   ├── src/           # React frontend
│   │   ├── scripts/       # Build scripts
│   │   └── dist/          # Build output
│   │
│   ├── cli/               # Standalone React app (optional)
│   │
│   ├── core/               # AI core logic
│   │   └── src/
│   │       ├── ai/         # AI gateway and providers
│   │       ├── models/     # Model configuration
│   │       └── tools/      # Tool system
│   │
│   ├── server/             # Fastify backend
│   │   ├── src/
│   │   │   ├── routes/     # API routes
│   │   │   └── services/   # Business logic
│   │   └── prisma/         # Database schema
│   │
│   └── shared/             # Shared type definitions
│
├── release/                 # Build output (release-{timestamp}/)
├── docs/                   # Documentation
├── docker-compose.yml      # Docker orchestration
└── package.json
```

---

## Database

### PostgreSQL Configuration

Environment variable (`packages/server/.env`):
```
DATABASE_URL="postgresql://user:password@localhost:5432/webaiide?schema=public"
```

### Database Models

- **User** - User accounts
- **Project** - Projects (linked to user)
- **Session** - Sessions (linked to project, supports cwd, gitBranch)
- **Message** - Messages (supports uuid chain, tool calls)

### Database Migration

```bash
cd packages/server
npx prisma generate    # Generate Prisma Client
npx prisma db push    # Push schema to database
```

---

## AI Model Configuration

### Supported Models

| Model | Provider | Description |
|-------|----------|-------------|
| GPT-4o | OpenAI | Most capable model |
| GPT-4o Mini | OpenAI | Fast and cost-effective |
| Claude 3.5 Sonnet | Anthropic | Balanced performance |
| Claude 3 Opus | Anthropic | Most capable Claude |
| Qwen Coder Plus | Qwen | Optimized for code |
| Qwen3 Coder | Qwen | Latest open-source coder |

### API Key Setup

Configure API keys in the Settings panel, or via environment variables:
```env
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
DASHSCOPE_API_KEY=sk-...
```

---

## Build Desktop App

```bash
cd packages/electron
npm run build
```

**Output directory:** `packages/electron/release/release-{timestamp}/`

| Build Mode | Command | Output |
|------------|---------|--------|
| Production (NSIS installer) | `npm run build` | `release/release-{timestamp}/Web AI IDE Setup 1.0.0.exe` |
| Development (unpacked) | `npm run build -- --dir` | `release/dev/win-unpacked/` |

---

## API Reference

### REST Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List all projects |
| POST | `/api/projects` | Create new project |
| DELETE | `/api/projects/:id` | Delete project |
| GET | `/api/sessions/project/:projectId` | Get project's sessions |
| GET | `/api/sessions/:id` | Get session details |
| GET | `/api/sessions/:id/conversation` | Reconstruct full conversation |
| POST | `/api/sessions` | Create new session |
| DELETE | `/api/sessions/:id` | Delete session |

### WebSocket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `chat:message` | Client → Server | Send chat message |
| `chat:stream` | Server → Client | AI streaming response |
| `chat:tool_call` | Server → Client | Tool call request |
| `chat:approve` | Client → Server | Approve operation |
| `chat:reject` | Client → Server | Reject operation |

---

## Security

- API keys are provided by users, not stored on server
- Shell commands require explicit user approval
- File operations restricted to project workspace
- Sensitive operations require confirmation

---

## Reference Projects

- [Qwen Code](https://github.com/QwenLM/qwen-code) - Architecture reference
- [Claude Code](https://claude.ai/code) - Feature inspiration
- [VS Code Web](https://github.com/microsoft/vscode) - Monaco Editor integration

---

## License

MIT License
