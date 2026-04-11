# Web AI IDE

A browser-based + Electron desktop AI-assisted coding environment similar to Claude Code.

[English](README.md) | [中文](README_zh.md)

---

## Features

- 🤖 **AI Chat** - Real-time conversations with AI assistants supporting streaming responses
- 💻 **Code Editor** - Professional code editing powered by Monaco Editor
- 📁 **File Explorer** - Project file tree with create, edit, delete support
- 🖥️ **Terminal** - Built-in web terminal with WebSocket PTY support
- 🔧 **Tool System** - AI can invoke file read/write, shell commands and more
- 🔄 **Multi-Model Support** - OpenAI GPT, Anthropic Claude, Qwen and more
- 💾 **Session Management** - Save and restore conversation history (PostgreSQL storage)
- 🗄️ **Project Management** - Project persistence (PostgreSQL)
- 🐳 **Docker Deployment** - Quick deployment to any environment
- 💻 **Desktop App** - Windows EXE native desktop application
- 🌐 **Internationalization** - Supports English and Chinese interface switching
- 📋 **Custom Menu Bar** - Custom dark-themed menu bar, unified with design system
- 🔌 **gRPC Agent Engine** - Interact with openclaude-temp AI Agent via gRPC

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

### Option 1: Desktop App (Recommended) - One-Click Launch

**Use the debug script for one-click startup:**
```powershell
cd web-ai-ide
# Set database credentials (required)
$env:POSTGRES_USER="your_username"
$env:POSTGRES_PASSWORD="your_strong_password"
.\debug.ps1
```

**⚠️ Security Requirements:**
- `POSTGRES_USER` and `POSTGRES_PASSWORD` must be set via environment variables
- Use strong passwords, do not use defaults or weak passwords
- Credentials are not stored in the script, must be set each time

This script automatically:
- Starts PostgreSQL database (Docker)
- Initializes database schema (Prisma)
- Launches backend server in a new window
- Starts the latest desktop app release

**Manual steps (if you prefer):**

1. Build EXE:
```bash
cd packages/electron
npm install
npm run build
```

2. Start PostgreSQL:
```bash
docker run -d --name webaiide-postgres \
  -e POSTGRES_USER=your_username \
  -e POSTGRES_PASSWORD=your_strong_password \
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
web-ai-ide\launch.bat
```
or directly:
```
web-ai-ide\release\release-{timestamp}\Web AI IDE Setup 1.0.0.exe
```

**💡 Tip**: After each build, `launch.bat` is automatically updated to point to the latest EXE.

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

### Option 4: gRPC Service (AI Agent Engine)

`openclaude-temp` includes a headless gRPC server that exposes AI Agent capabilities (tools, bash, file editing) via bidirectional streaming. The server handles the full AI workflow including tool execution and user permission prompts.

#### Quick Start

**1. Install dependencies:**
```bash
cd packages/openclaude-temp
bun install
bun run build
```

**2. Configure AI provider:**

Create `packages/openclaude-temp/.env` file:
```bash
# For Qwen (default)
OPENAI_API_KEY="your-qwen-api-key"
OPENAI_BASE_URL="https://dashscope.aliyuncs.com/compatible-mode/v1"
OPENAI_MODEL="qwen3.5-plus"

# For OpenAI
CLAUDE_CODE_USE_OPENAI=1
OPENAI_API_KEY="your-openai-key"
OPENAI_MODEL="gpt-4o"

# For Anthropic
ANTHROPIC_API_KEY="your-anthropic-key"
ANTHROPIC_MODEL="claude-sonnet-4-5"
```

**3. Start gRPC Server:**
```bash
cd packages/openclaude-temp
bun run dev:grpc
```
Server runs at `localhost:50051` by default. Configure via `GRPC_PORT` and `GRPC_HOST` environment variables.

**4. Test with gRPC CLI:**
```bash
cd packages/openclaude-temp
bun run dev:grpc:cli
```

#### gRPC CLI Usage

The interactive CLI streams tokens, displays tool calls, and prompts for approval (y/n) when needed:

```bash
> What files are in the current directory?
[Tool Call] Bash
{"command": "ls -la"}

Tool executed successfully.

[Generation Complete]
```

Type `/exit` or `/quit` to end the session.

#### Protocol Definition

The gRPC interface is defined in `src/proto/openclaude.proto`:

```protobuf
service AgentService {
  rpc Chat(stream ClientMessage) returns (stream ServerMessage);
}
```

**ClientMessage types:**
- `ChatRequest` - Initial request with session_id, message, and working_directory
- `UserInput` - User response to permission prompts (reply + prompt_id)
- `CancelSignal` - Interrupt current generation

**ServerMessage types:**
- `TextChunk` - Streaming text tokens
- `ToolCallStart` - Agent started executing a tool
- `ToolCallResult` - Tool execution result
- `ActionRequired` - User permission required
- `FinalResponse` - Generation complete with token counts
- `ErrorResponse` - Error occurred

#### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `GRPC_PORT` | `50051` | gRPC server port |
| `GRPC_HOST` | `localhost` | gRPC server bind address |
| `OPENAI_API_KEY` | - | API key for OpenAI-compatible providers |
| `OPENAI_BASE_URL` | - | API endpoint base URL |
| `OPENAI_MODEL` | - | Model name |
| `ANTHROPIC_API_KEY` | - | API key for Anthropic |
| `ANTHROPIC_MODEL` | - | Anthropic model name |

#### Protocol Compatibility

The gRPC client **must use Bun** to run (not Node.js or npx tsx). There is a protocol compatibility issue between Node.js gRPC implementation and the Bun runtime.

**Correct:**
```bash
bun run dev:grpc:cli
```

**Incorrect (will fail):**
```bash
npx tsx scripts/grpc-cli.ts  # ❌ Protocol error
node scripts/grpc-cli.ts     # ❌ Protocol error
```

---

## Project Structure

```
web-ai-ide/
├── packages/
│   ├── electron/             # Electron desktop app
│   │   ├── electron/         # Main process (main.ts, preload.ts)
│   │   ├── src/              # React frontend
│   │   │   ├── components/   # Chat, Editor, FileExplorer, PTYTerminal, Settings, MenuBar, AboutDialog...
│   │   │   ├── hooks/        # useChat, useFileSystem, usePTY
│   │   │   ├── services/     # api.ts, websocket.ts, pty-client.ts
│   │   │   ├── contexts/     # SettingsContext
│   │   │   ├── i18n/         # translations.ts (internationalization)
│   │   │   └── index.css     # Design system (CSS variables)
│   │   ├── scripts/          # build-with-timestamp.cjs
│   │   └── dist/             # Build output
│   │
│   ├── cli/                  # Standalone React web app
│   │   └── src/
│   │       ├── components/   # UI components (PTYTerminal, Layout, Chat...)
│   │       ├── hooks/         # useChat, useFileSystem, usePTY
│   │       ├── services/      # api.ts, websocket.ts, pty-client.ts
│   │       └── contexts/      # SettingsContext
│   │
│   ├── core/                 # AI core logic (AIGateway + Providers)
│   │   └── src/
│   │       ├── ai/           # gateway.ts + providers (openai, anthropic, qwen)
│   │       ├── models/       # config.ts
│   │       └── tools/        # edit, file-read, file-write, glob, grep, registry
│   │
│   ├── openclaude-temp/      # AI Agent gRPC service
│   │   └── src/
│   │       ├── grpc/          # gRPC server (QueryEngine)
│   │       ├── tools/        # Agent tools (Bash, Read, Write, Grep...)
│   │       └── proto/        # openclaude.proto definition
│   │
│   ├── server/               # Fastify backend API
│   │   ├── src/
│   │   │   ├── routes/       # auth, chat, files, projects, sessions, pty
│   │   │   ├── services/     # auth, project, session, tenant, pty-manager, agent-*, bun-grpc-chat-bridge
│   │   │   ├── scripts/       # agent-grpc-sidecar.ts
│   │   │   └── utils/        # encryption, prisma, redis, rabbitmq
│   │   └── prisma/           # Database schema
│   │
│   └── shared/               # Shared type definitions

├── docs/                     # Design documents
│   ├── GRPC_CONNECTION_REPORT_zh.md
│   └── websocket-protocol.md
├── release/                  # Build output (release-{timestamp}/)
├── docker-compose.yml        # Docker orchestration
├── debug.ps1                  # One-click startup script
├── launch.bat                 # Quick launch script (auto-generated)
└── package.json
```

---

## Database

### PostgreSQL Configuration

Environment variable (`packages/server/.env`):
```
DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:5432/${POSTGRES_DB}?schema=public"
```

**⚠️ Security:** Please set `POSTGRES_USER` and `POSTGRES_PASSWORD` environment variables before running.

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

### Data Encryption

All sensitive data is encrypted at rest using AES-256-GCM with PBKDF2 key derivation:

| Model | Encrypted Fields |
|-------|-----------------|
| User | apiKeys |
| Project | path |
| Session | cwd |
| Message | content, systemPayload |

**Security Features:**
- AES-256-GCM authenticated encryption
- PBKDF2 key derivation with 100,000 iterations
- Random 16-byte salt (or use `ENCRYPTION_SALT` env var for consistency)
- Key caching for performance (call `clearEncryptionCache()` for testing)

**⚠️ Required Environment Variables:**
```
ENCRYPTION_SECRET=your-256-bit-secret-key-here
ENCRYPTION_SALT=optional-16-byte-hex-salt  # If not set, a random salt will be generated
```

**Note**: Using fixed `ENCRYPTION_SALT` in production will output a warning. It is recommended to use fixed salt only in development/testing environments.

Generate a secure key:
```bash
openssl rand -hex 32
```

---

## AI Model Configuration

### Custom Providers and Models

The Settings panel allows you to configure custom AI providers and models. You can:
- Add/remove AI providers (OpenAI, Anthropic, custom endpoints)
- Configure each provider's API endpoint and API key
- Add multiple models per provider with custom model IDs and display names
- Select active provider and model

### Environment Variable Configuration

Alternatively, configure API keys via environment variables:
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
