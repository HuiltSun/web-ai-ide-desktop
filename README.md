# Web AI IDE

A browser-based AI-assisted coding environment similar to Claude Code, built with Electron for desktop deployment.

[中文](README.md) | English

---

## Features

- 🤖 **AI Chat** - Real-time conversations with AI assistants supporting streaming responses
- 💻 **Code Editor** - Professional code editing powered by Monaco Editor
- 📁 **File Explorer** - Project file tree with create, edit, delete support
- 🖥️ **Terminal** - Built-in web terminal
- 🔧 **Tool System** - AI can invoke file read/write, shell commands and more
- 🔄 **Multi-Model Support** - OpenAI GPT, Anthropic Claude, Qwen and more
- 💾 **Session Management** - Save and restore conversation history
- 🐳 **Docker Deployment** - Quick deployment to any environment
- 💻 **Desktop App** - Available as Windows exe

---

## Tech Stack

| Module | Technology |
|--------|------------|
| Frontend | React 18, TypeScript, Vite, TailwindCSS |
| Code Editor | Monaco Editor |
| Desktop | Electron 30 |
| Backend | Fastify 4, Node.js |
| Database | PostgreSQL, Prisma ORM |
| AI | OpenAI, Anthropic, Qwen |
| Packaging | Electron Builder |

---

## Project Structure

```
web-ai-ide/
├── packages/
│   ├── electron/           # Electron desktop app
│   │   ├── electron/        # Main process (main.ts, preload.ts)
│   │   ├── src/            # React frontend
│   │   └── dist/           # Built files
│   │
│   ├── cli/                # Standalone React app (optional)
│   │   └── src/
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
│   │   │   └── services/    # Business logic
│   │   └── prisma/         # Database schema
│   │
│   └── shared/             # Shared type definitions
│
├── docs/                   # Documentation
├── docker-compose.yml      # Docker orchestration
└── package.json
```

---

## Quick Start

### Desktop App (Windows)

1. Download or build the exe:
   ```bash
   cd packages/electron
   npm install
   npm run build
   ```

2. Run the exe:
   ```
   packages/electron/release/win-unpacked/Web AI IDE.exe
   ```

### Development

#### Frontend + Desktop

```bash
cd packages/electron
npm install
npm run dev
```

#### Full Stack (Frontend + Backend)

**Backend:**
```bash
cd packages/server
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

**Frontend:**
```bash
cd packages/cli
npm install
npm run dev
```

### Docker Deployment

```bash
docker-compose up -d
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

### Build Windows EXE

```bash
cd packages/electron
npm run build
```

Output: `packages/electron/release/win-unpacked/Web AI IDE.exe`

### Build Installer

```bash
npm run build:exe
```

Output: `packages/electron/release/Web AI IDE Setup.exe`

---

## Development Guide

### Adding New AI Provider

1. Create provider in `packages/core/src/ai/providers/`
2. Implement `AIProvider` interface
3. Register in `packages/core/src/ai/gateway.ts`
4. Add model config in `packages/core/src/models/config.ts`

### Adding New Tool

1. Create tool in `packages/core/src/tools/`
2. Implement `Tool` interface
3. Register in `packages/core/src/tools/registry.ts`

---

## Architecture

### Frontend Architecture

```
┌─────────────────────────────────────────────┐
│                  React App                  │
├─────────────┬─────────────┬─────────────────┤
│   Layout    │   Editor    │   FileExplorer  │
├─────────────┴─────────────┴─────────────────┤
│                  Chat                       │
├─────────────────────────────────────────────┤
│              Settings                        │
└─────────────────────────────────────────────┘
```

### Backend Architecture

```
┌─────────────────────────────────────────────┐
│              Fastify Server                 │
├──────────┬──────────┬──────────┬───────────┤
│ Projects │ Sessions │  Chat    │   Files   │
│  Routes  │  Routes  │  Routes  │  Routes   │
├──────────┴──────────┴──────────┴───────────┤
│             Services Layer                  │
├─────────────────────────────────────────────┤
│              Prisma ORM                      │
├─────────────────────────────────────────────┤
│             PostgreSQL                       │
└─────────────────────────────────────────────┘
```

---

## Security

- API keys are provided by users, not stored on server
- Shell commands require explicit user approval
- File operations restricted to project workspace
- Sensitive operations require confirmation

---

## Contributing

Issues and Pull Requests are welcome!

---

## License

MIT License

---

## Reference Projects

- [Qwen Code](https://github.com/QwenLM/qwen-code) - Architecture reference
- [Claude Code](https://claude.ai/code) - Feature inspiration
- [VS Code Web](https://github.com/microsoft/vscode) - Monaco Editor integration
