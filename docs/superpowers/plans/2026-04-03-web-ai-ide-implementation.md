# Web AI Coding IDE Implementation Plan
# Web AI 编程 IDE - 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete Web AI Coding IDE with AI conversation, Monaco code editor, file explorer, and multi-model support.

**Architecture:** Monorepo with packages for frontend (React), core (AI agent logic), server (Fastify backend), and shared types. Reference Qwen Code's CLI/Core separation architecture.

**Tech Stack:** React 18, TypeScript 5, Vite 5, Monaco Editor, Fastify 4, Prisma 5, PostgreSQL 15, TailwindCSS 3

---

## Phase 1: Foundation / 阶段一：基础

### Task 1: Project Scaffolding / 项目脚手架

**Files:**
- Create: `package.json` (root)
- Create: `packages/cli/package.json`
- Create: `packages/core/package.json`
- Create: `packages/server/package.json`
- Create: `packages/shared/package.json`
- Create: `packages/shared/src/types.ts`
- Create: `tsconfig.json` (root)
- Create: `turbo.json` (monorepo tooling)
- Create: `docker-compose.yml`
- Create: `Dockerfile`

- [ ] **Step 1: Create root package.json**

```json
{
  "name": "web-ai-ide",
  "version": "1.0.0",
  "private": true,
  "workspaces": ["packages/*"],
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "test": "turbo test",
    "lint": "turbo lint"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.4.0"
  }
}
```

- [ ] **Step 2: Create packages/shared/src/types.ts**

```typescript
export interface User {
  id: string;
  email: string;
  name?: string;
  apiKeys?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  name: string;
  path: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id: string;
  projectId: string;
  model: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  toolCalls?: ToolCall[];
  createdAt: Date;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  result?: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
}

export type AIProvider = 'openai' | 'anthropic' | 'qwen';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatStreamEvent {
  type: 'text' | 'tool_call' | 'done' | 'error';
  content?: string;
  toolCall?: ToolCall;
}
```

- [ ] **Step 3: Create docker-compose.yml**

```yaml
version: '3.8'
services:
  frontend:
    build: ./packages/cli
    ports:
      - "3000:80"
    depends_on:
      - backend
    networks:
      - webaiide

  backend:
    build: ./packages/server
    ports:
      - "3001:3001"
    environment:
      DATABASE_URL: postgresql://webaiide:webaiide@db:5432/webaiide
    depends_on:
      - db
    networks:
      - webaiide

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: webaiide
      POSTGRES_PASSWORD: webaiide
      POSTGRES_DB: webaiide
    volumes:
      - pgdata:/var/lib/postgresql/data
    networks:
      - webaiide

networks:
  webaiide:
    driver: bridge

volumes:
  pgdata:
```

- [ ] **Step 4: Commit**

```bash
git add package.json packages/*/package.json packages/shared/src/types.ts docker-compose.yml turbo.json tsconfig.json
git commit -m "feat: initialize monorepo structure with shared types"
```

---

### Task 2: Backend API Structure / 后端 API 结构

**Files:**
- Create: `packages/server/src/index.ts`
- Create: `packages/server/src/routes/projects.ts`
- Create: `packages/server/src/routes/sessions.ts`
- Create: `packages/server/src/routes/chat.ts`
- Create: `packages/server/src/routes/files.ts`
- Create: `packages/server/src/services/project.service.ts`
- Create: `packages/server/src/services/session.service.ts`
- Create: `packages/server/src/services/chat.service.ts`
- Create: `packages/server/prisma/schema.prisma`
- Modify: `packages/server/package.json`

- [ ] **Step 1: Create packages/server/prisma/schema.prisma**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String    @id @default(uuid())
  email     String    @unique
  name      String?
  apiKeys   Json?
  projects  Project[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

model Project {
  id        String    @id @default(uuid())
  name      String
  path      String
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  sessions  Session[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
}

model Session {
  id        String    @id @default(uuid())
  projectId String
  project   Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  model     String    @default("gpt-4o")
  messages  Message[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  @@index([projectId])
}

model Message {
  id        String    @id @default(uuid())
  sessionId String
  session   Session   @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  role      String
  content   String
  toolCalls Json?
  createdAt DateTime  @default(now())

  @@index([sessionId])
}
```

- [ ] **Step 2: Create packages/server/src/index.ts**

```typescript
import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import { projectsRouter } from './routes/projects.js';
import { sessionsRouter } from './routes/sessions.js';
import { chatRouter } from './routes/chat.js';
import { filesRouter } from './routes/files.js';

const server = Fastify({
  logger: true,
});

await server.register(cors, { origin: true });
await server.register(websocket);

await server.register(projectsRouter, { prefix: '/api/projects' });
await server.register(sessionsRouter, { prefix: '/api/sessions' });
await server.register(chatRouter, { prefix: '/api/chat' });
await server.register(filesRouter, { prefix: '/api/files' });

const start = async () => {
  try {
    await server.listen({ port: 3001, host: '0.0.0.0' });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();

export { server };
```

- [ ] **Step 3: Create packages/server/src/routes/projects.ts**

```typescript
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { projectService } from '../services/project.service.js';

export async function projectsRouter(fastify: FastifyInstance) {
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const projects = await projectService.listProjects();
    return projects;
  });

  fastify.get<{ Params: { id: string } }>(
    '/:id',
    async (request, reply) => {
      const project = await projectService.getProject(request.params.id);
      if (!project) {
        return reply.status(404).send({ error: 'Project not found' });
      }
      return project;
    }
  );

  fastify.post<{
    Body: { name: string; path: string; userId: string };
  }>('/', async (request, reply) => {
    const project = await projectService.createProject(request.body);
    return reply.status(201).send(project);
  });

  fastify.delete<{ Params: { id: string } }>(
    '/:id',
    async (request, reply) => {
      await projectService.deleteProject(request.params.id);
      return reply.status(204).send();
    }
  );
}
```

- [ ] **Step 4: Create packages/server/src/services/project.service.ts**

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const projectService = {
  async listProjects() {
    return prisma.project.findMany({
      orderBy: { updatedAt: 'desc' },
    });
  },

  async getProject(id: string) {
    return prisma.project.findUnique({ where: { id } });
  },

  async createProject(data: { name: string; path: string; userId: string }) {
    return prisma.project.create({ data });
  },

  async deleteProject(id: string) {
    return prisma.project.delete({ where: { id } });
  },
};
```

- [ ] **Step 5: Commit**

```bash
git add packages/server/src/ packages/server/prisma/ packages/server/package.json
git commit -m "feat(server): add backend API structure with Fastify"
```

---

### Task 3: Database Schema / 数据库架构

**Files:**
- Modify: `packages/server/prisma/schema.prisma`
- Create: `packages/server/prisma/migrations/` (migration files)

- [ ] **Step 1: Generate Prisma client**

```bash
cd packages/server
npx prisma generate
```

- [ ] **Step 2: Run database migration**

```bash
cd packages/server
npx prisma migrate dev --name init
```

- [ ] **Step 3: Commit**

```bash
git add packages/server/prisma/
git commit -m "feat(server): add database schema with Prisma"
```

---

### Task 4: Basic Frontend Layout / 基础前端布局

**Files:**
- Create: `packages/cli/src/App.tsx`
- Create: `packages/cli/src/main.tsx`
- Create: `packages/cli/src/index.css`
- Create: `packages/cli/src/components/Layout.tsx`
- Create: `packages/cli/src/components/Sidebar.tsx`
- Create: `packages/cli/src/components/Header.tsx`
- Create: `packages/cli/vite.config.ts`
- Create: `packages/cli/index.html`
- Modify: `packages/cli/package.json`

- [ ] **Step 1: Create packages/cli/package.json**

```json
{
  "name": "@web-ai-ide/cli",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.4.0",
    "vite": "^5.4.0"
  }
}
```

- [ ] **Step 2: Create packages/cli/src/App.tsx**

```tsx
import { useState } from 'react';
import { Layout } from './components/Layout';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';

function App() {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  return (
    <Layout
      header={<Header projectId={selectedProject} />}
      sidebar={
        <Sidebar
          selectedProject={selectedProject}
          onSelectProject={setSelectedProject}
        />
      }
    >
      <div className="flex-1 p-4">
        <p className="text-gray-500">Select a project to start coding</p>
      </div>
    </Layout>
  );
}

export default App;
```

- [ ] **Step 3: Create packages/cli/src/components/Layout.tsx**

```tsx
import { ReactNode } from 'react';

interface LayoutProps {
  header: ReactNode;
  sidebar: ReactNode;
  children: ReactNode;
}

export function Layout({ header, sidebar, children }: LayoutProps) {
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <header className="h-12 bg-white border-b border-gray-200 flex items-center px-4">
        {header}
      </header>
      <div className="flex-1 flex overflow-hidden">
        <aside className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
          {sidebar}
        </aside>
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create packages/cli/vite.config.ts**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:3001',
      '/ws': {
        target: 'ws://localhost:3001',
        ws: true,
      },
    },
  },
});
```

- [ ] **Step 5: Commit**

```bash
git add packages/cli/
git commit -m "feat(cli): add basic frontend layout with React"
```

---

## Phase 2: Core Features / 阶段二：核心功能

### Task 5: Monaco Editor Integration / Monaco Editor 集成

**Files:**
- Create: `packages/cli/src/components/Editor.tsx`
- Create: `packages/cli/src/components/EditorTabs.tsx`
- Modify: `packages/cli/package.json` (add monaco-editor)

- [ ] **Step 1: Install Monaco dependencies**

```bash
cd packages/cli
npm install @monaco-editor/react monaco-editor
```

- [ ] **Step 2: Create packages/cli/src/components/Editor.tsx**

```tsx
import { useState, useCallback } from 'react';
import MonacoEditor, { OnMount } from '@monaco-editor/react';
import { EditorTabs } from './EditorTabs';

interface EditorFile {
  path: string;
  content: string;
  language: string;
}

interface EditorProps {
  files: EditorFile[];
  activeFile: string;
  onFileSelect: (path: string) => void;
  onFileChange: (path: string, content: string) => void;
}

export function Editor({ files, activeFile, onFileSelect, onFileChange }: EditorProps) {
  const [editor, setEditor] = useState<unknown>(null);

  const handleMount: OnMount = useCallback((editor) => {
    setEditor(editor);
  }, []);

  const activeContent = files.find((f) => f.path === activeFile)?.content || '';

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <EditorTabs
        files={files}
        activeFile={activeFile}
        onSelect={onFileSelect}
      />
      <div className="flex-1">
        <MonacoEditor
          height="100%"
          language={files.find((f) => f.path === activeFile)?.language || 'plaintext'}
          value={activeContent}
          onChange={(value) => onFileChange(activeFile, value || '')}
          onMount={handleMount}
          options={{
            minimap: { enabled: true },
            fontSize: 14,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
          }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add packages/cli/src/components/Editor.tsx packages/cli/src/components/EditorTabs.tsx
git commit -m "feat(cli): integrate Monaco Editor with tabs"
```

---

### Task 6: File Explorer Component / 文件资源管理器组件

**Files:**
- Create: `packages/cli/src/components/FileExplorer.tsx`
- Create: `packages/cli/src/components/FileTree.tsx`
- Create: `packages/cli/src/hooks/useFileSystem.ts`

- [ ] **Step 1: Create packages/cli/src/hooks/useFileSystem.ts**

```typescript
import { useState, useCallback } from 'react';
import { api } from '../services/api';

export interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileNode[];
}

export function useFileSystem(projectId: string) {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(false);

  const loadFiles = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const data = await api.getProjectFiles(projectId);
      setFiles(data);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const createFile = useCallback(
    async (path: string, content: string) => {
      await api.writeFile(projectId, path, content);
      await loadFiles();
    },
    [projectId, loadFiles]
  );

  const deleteFile = useCallback(
    async (path: string) => {
      await api.deleteFile(projectId, path);
      await loadFiles();
    },
    [projectId, loadFiles]
  );

  return { files, loading, loadFiles, createFile, deleteFile };
}
```

- [ ] **Step 2: Create packages/cli/src/components/FileExplorer.tsx**

```tsx
import { useState } from 'react';
import { FileNode } from '../hooks/useFileSystem';
import { FileTree } from './FileTree';

interface FileExplorerProps {
  files: FileNode[];
  onFileSelect: (path: string) => void;
  onFileCreate: (path: string) => void;
  onFileDelete: (path: string) => void;
}

export function FileExplorer({
  files,
  onFileSelect,
  onFileCreate,
  onFileDelete,
}: FileExplorerProps) {
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    path: string;
  } | null>(null);

  const handleContextMenu = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, path });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-2 border-b border-gray-200">
        <button
          onClick={() => onFileCreate('')}
          className="w-full px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          + New File
        </button>
      </div>
      <div className="flex-1 overflow-auto p-2">
        <FileTree
          files={files}
          onSelect={onFileSelect}
          onContextMenu={handleContextMenu}
        />
      </div>
      {contextMenu && (
        <div
          className="fixed bg-white border border-gray-200 rounded shadow-lg py-1"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={() => {
              onFileDelete(contextMenu.path);
              setContextMenu(null);
            }}
            className="w-full px-4 py-1 text-left text-sm hover:bg-gray-100 text-red-600"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add packages/cli/src/components/FileExplorer.tsx packages/cli/src/components/FileTree.tsx packages/cli/src/hooks/useFileSystem.ts
git commit -m "feat(cli): add file explorer with tree view"
```

---

### Task 7: Chat Interface with Streaming / 带流式传输的聊天界面

**Files:**
- Create: `packages/cli/src/components/Chat.tsx`
- Create: `packages/cli/src/components/ChatMessage.tsx`
- Create: `packages/cli/src/components/ChatInput.tsx`
- Create: `packages/cli/src/components/ToolCallCard.tsx`
- Create: `packages/cli/src/services/websocket.ts`
- Create: `packages/cli/src/hooks/useChat.ts`

- [ ] **Step 1: Create packages/cli/src/services/websocket.ts**

```typescript
import { ChatStreamEvent } from '@web-ai-ide/shared';

type MessageHandler = (event: ChatStreamEvent) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private handlers: Set<MessageHandler> = new Set();

  connect(sessionId: string) {
    this.ws = new WebSocket(`ws://localhost:3001/ws/chat/${sessionId}`);

    this.ws.onmessage = (event) => {
      const data: ChatStreamEvent = JSON.parse(event.data);
      this.handlers.forEach((handler) => handler(data));
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
    };
  }

  send(message: { type: string; content: string }) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  onMessage(handler: MessageHandler) {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  disconnect() {
    this.ws?.close();
    this.ws = null;
  }
}

export const wsService = new WebSocketService();
```

- [ ] **Step 2: Create packages/cli/src/hooks/useChat.ts**

```typescript
import { useState, useCallback, useEffect } from 'react';
import { wsService } from '../services/websocket';
import { ChatMessage, ChatStreamEvent, ToolCall } from '@web-ai-ide/shared';

export function useChat(sessionId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingContent, setStreamingContent] = useState('');
  const [pendingToolCall, setPendingToolCall] = useState<ToolCall | null>(null);

  useEffect(() => {
    wsService.connect(sessionId);

    const unsubscribe = wsService.onMessage((event: ChatStreamEvent) => {
      if (event.type === 'text' && event.content) {
        setStreamingContent((prev) => prev + event.content);
      } else if (event.type === 'tool_call' && event.toolCall) {
        setPendingToolCall(event.toolCall);
      } else if (event.type === 'done') {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: streamingContent },
        ]);
        setStreamingContent('');
        setPendingToolCall(null);
      }
    });

    return () => {
      unsubscribe();
      wsService.disconnect();
    };
  }, [sessionId]);

  const sendMessage = useCallback((content: string) => {
    setMessages((prev) => [...prev, { role: 'user', content }]);
    wsService.send({ type: 'message', content });
  }, []);

  const approveTool = useCallback((toolCallId: string) => {
    wsService.send({ type: 'approve', toolCallId });
    setPendingToolCall(null);
  }, []);

  const rejectTool = useCallback((toolCallId: string) => {
    wsService.send({ type: 'reject', toolCallId });
    setPendingToolCall(null);
  }, []);

  return {
    messages,
    streamingContent,
    pendingToolCall,
    sendMessage,
    approveTool,
    rejectTool,
  };
}
```

- [ ] **Step 3: Create packages/cli/src/components/Chat.tsx**

```tsx
import { useChat } from '../hooks/useChat';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ToolCallCard } from './ToolCallCard';

interface ChatProps {
  sessionId: string;
}

export function Chat({ sessionId }: ChatProps) {
  const {
    messages,
    streamingContent,
    pendingToolCall,
    sendMessage,
    approveTool,
    rejectTool,
  } = useChat(sessionId);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <ChatMessage key={index} message={message} />
        ))}
        {streamingContent && (
          <ChatMessage message={{ role: 'assistant', content: streamingContent }} />
        )}
        {pendingToolCall && (
          <ToolCallCard
            toolCall={pendingToolCall}
            onApprove={() => approveTool(pendingToolCall.id)}
            onReject={() => rejectTool(pendingToolCall.id)}
          />
        )}
      </div>
      <ChatInput onSend={sendMessage} />
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add packages/cli/src/components/Chat.tsx packages/cli/src/components/ChatMessage.tsx packages/cli/src/components/ChatInput.tsx packages/cli/src/components/ToolCallCard.tsx packages/cli/src/services/websocket.ts packages/cli/src/hooks/useChat.ts
git commit -m "feat(cli): add chat interface with WebSocket streaming"
```

---

## Phase 3: AI Integration / 阶段三：AI 集成

### Task 8: AI Gateway Implementation / AI 网关实现

**Files:**
- Create: `packages/core/src/ai/gateway.ts`
- Create: `packages/core/src/ai/providers/openai.ts`
- Create: `packages/core/src/ai/providers/anthropic.ts`
- Create: `packages/core/src/ai/providers/qwen.ts`
- Create: `packages/core/src/ai/stream.ts`

- [ ] **Step 1: Create packages/core/src/ai/providers/openai.ts**

```typescript
import { AIProvider, ChatMessage } from '@web-ai-ide/shared';

interface OpenAIConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

export class OpenAIProvider implements AIProvider {
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor(config: OpenAIConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.openai.com/v1';
    this.model = config.model || 'gpt-4o';
  }

  async *streamChat(messages: ChatMessage[]): AsyncGenerator<string> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') return;
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) yield content;
          } catch {}
        }
      }
    }
  }
}
```

- [ ] **Step 2: Create packages/core/src/ai/gateway.ts**

```typescript
import { ChatMessage, AIProvider } from '@web-ai-ide/shared';
import { OpenAIProvider } from './providers/openai.js';
import { AnthropicProvider } from './providers/anthropic.js';
import { QwenProvider } from './providers/qwen.js';

type ProviderType = 'openai' | 'anthropic' | 'qwen';

interface AIGatewayConfig {
  provider: ProviderType;
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

export class AIGateway {
  private provider: AIProvider;

  constructor(config: AIGatewayConfig) {
    switch (config.provider) {
      case 'openai':
        this.provider = new OpenAIProvider({
          apiKey: config.apiKey,
          baseUrl: config.baseUrl,
          model: config.model,
        });
        break;
      case 'anthropic':
        this.provider = new AnthropicProvider({
          apiKey: config.apiKey,
          model: config.model,
        });
        break;
      case 'qwen':
        this.provider = new QwenProvider({
          apiKey: config.apiKey,
          baseUrl: config.baseUrl,
          model: config.model,
        });
        break;
    }
  }

  async *streamChat(messages: ChatMessage[]): AsyncGenerator<string> {
    yield* this.provider.streamChat(messages);
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add packages/core/src/ai/
git commit -m "feat(core): implement AI gateway with multi-provider support"
```

---

### Task 9: Tool System / 工具系统

**Files:**
- Create: `packages/core/src/tools/registry.ts`
- Create: `packages/core/src/tools/shell.ts`
- Create: `packages/core/src/tools/file-read.ts`
- Create: `packages/core/src/tools/file-write.ts`
- Create: `packages/core/src/tools/edit.ts`
- Create: `packages/core/src/tools/glob.ts`
- Create: `packages/core/src/tools/grep.ts`

- [ ] **Step 1: Create packages/core/src/tools/registry.ts**

```typescript
import { ToolCall } from '@web-ai-ide/shared';

export interface Tool {
  name: string;
  description: string;
  inputSchema: object;
  execute: (args: Record<string, unknown>) => Promise<string>;
  requiresApproval: boolean;
}

class ToolRegistry {
  private tools: Map<string, Tool> = new Map();

  register(tool: Tool) {
    this.tools.set(tool.name, tool);
  }

  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  listTools(): Tool[] {
    return Array.from(this.tools.values());
  }

  async executeTool(
    name: string,
    args: Record<string, unknown>
  ): Promise<string> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }
    return tool.execute(args);
  }
}

export const toolRegistry = new ToolRegistry();
```

- [ ] **Step 2: Create packages/core/src/tools/shell.ts**

```typescript
import { exec } from 'child_process';
import { promisify } from 'util';
import { toolRegistry } from './registry.js';

const execAsync = promisify(exec);

toolRegistry.register({
  name: 'shell',
  description: 'Execute shell commands',
  inputSchema: {
    type: 'object',
    properties: {
      command: { type: 'string', description: 'Shell command to execute' },
      timeout: { type: 'number', description: 'Timeout in milliseconds', default: 30000 },
    },
    required: ['command'],
  },
  requiresApproval: true,
  execute: async (args: Record<string, unknown>) => {
    const { command, timeout = 30000 } = args as { command: string; timeout?: number };

    try {
      const { stdout, stderr } = await execAsync(command, { timeout });
      return stdout || stderr;
    } catch (error: unknown) {
      if (error instanceof Error) {
        return `Error: ${error.message}`;
      }
      return 'Unknown error';
    }
  },
});
```

- [ ] **Step 3: Create packages/core/src/tools/file-read.ts**

```typescript
import { readFile } from 'fs/promises';
import { toolRegistry } from './registry.js';

toolRegistry.register({
  name: 'read_file',
  description: 'Read file contents',
  inputSchema: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'File path to read' },
    },
    required: ['path'],
  },
  requiresApproval: false,
  execute: async (args: Record<string, unknown>) => {
    const { path } = args as { path: string };

    try {
      const content = await readFile(path, 'utf-8');
      return content;
    } catch (error: unknown) {
      if (error instanceof Error) {
        return `Error reading file: ${error.message}`;
      }
      return 'Unknown error';
    }
  },
});
```

- [ ] **Step 4: Commit**

```bash
git add packages/core/src/tools/
git commit -m "feat(core): implement tool registry with file and shell tools"
```

---

### Task 10: Multi-Model Support / 多模型支持

**Files:**
- Create: `packages/core/src/models/registry.ts`
- Create: `packages/core/src/models/config.ts`
- Modify: `packages/core/src/ai/gateway.ts`

- [ ] **Step 1: Create packages/core/src/models/config.ts**

```typescript
export interface ModelConfig {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'qwen';
  apiKeyEnvVar: string;
  baseUrl?: string;
  defaultModel?: string;
}

export const MODEL_CONFIGS: Record<string, ModelConfig> = {
  'gpt-4o': {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    apiKeyEnvVar: 'OPENAI_API_KEY',
    defaultModel: 'gpt-4o',
  },
  'gpt-4o-mini': {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai',
    apiKeyEnvVar: 'OPENAI_API_KEY',
    defaultModel: 'gpt-4o-mini',
  },
  'claude-3-5-sonnet': {
    id: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    apiKeyEnvVar: 'ANTHROPIC_API_KEY',
    defaultModel: 'claude-3-5-sonnet-20240620',
  },
  'claude-3-opus': {
    id: 'claude-3-opus',
    name: 'Claude 3 Opus',
    provider: 'anthropic',
    apiKeyEnvVar: 'ANTHROPIC_API_KEY',
    defaultModel: 'claude-3-opus-20240229',
  },
  'qwen-coder-plus': {
    id: 'qwen-coder-plus',
    name: 'Qwen Coder Plus',
    provider: 'qwen',
    apiKeyEnvVar: 'DASHSCOPE_API_KEY',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    defaultModel: 'qwen-coder-plus',
  },
  'qwen3-coder': {
    id: 'qwen3-coder',
    name: 'Qwen3 Coder',
    provider: 'qwen',
    apiKeyEnvVar: 'DASHSCOPE_API_KEY',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    defaultModel: 'qwen3-coder',
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add packages/core/src/models/
git commit -m "feat(core): add multi-model configuration registry"
```

---

## Phase 4: Polish / 阶段四：完善

### Task 11: Terminal Emulator / 终端模拟器

**Files:**
- Create: `packages/cli/src/components/Terminal.tsx`
- Create: `packages/cli/src/components/TerminalInput.tsx`
- Create: `packages/cli/src/hooks/useTerminal.ts`
- Create: `packages/server/src/routes/terminal.ts`

- [ ] **Step 1: Create packages/cli/src/components/Terminal.tsx**

```tsx
import { useState, useEffect, useRef } from 'react';
import { TerminalInput } from './TerminalInput';

interface TerminalLine {
  type: 'command' | 'output' | 'error';
  content: string;
  timestamp: Date;
}

interface TerminalProps {
  onCommand: (command: string) => void;
  lines: TerminalLine[];
}

export function Terminal({ onCommand, lines }: TerminalProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  return (
    <div className="h-full flex flex-col bg-gray-900 text-green-400 font-mono text-sm">
      <div className="flex-1 overflow-y-auto p-2" ref={scrollRef}>
        {lines.map((line, index) => (
          <div key={index} className={line.type === 'error' ? 'text-red-400' : ''}>
            {line.type === 'command' && (
              <span className="text-blue-400">$ </span>
            )}
            {line.content}
          </div>
        ))}
      </div>
      <TerminalInput onCommand={onCommand} />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/cli/src/components/Terminal.tsx packages/cli/src/components/TerminalInput.tsx packages/cli/src/hooks/useTerminal.ts
git commit -m "feat(cli): add terminal emulator component"
```

---

### Task 12: Session Management / 会话管理

**Files:**
- Modify: `packages/server/src/routes/sessions.ts`
- Create: `packages/server/src/services/session.service.ts`
- Modify: `packages/cli/src/contexts/SessionContext.tsx`

- [ ] **Step 1: Create packages/server/src/services/session.service.ts**

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const sessionService = {
  async createSession(projectId: string, model: string) {
    return prisma.session.create({
      data: { projectId, model },
    });
  },

  async getSession(id: string) {
    return prisma.session.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
  },

  async listSessions(projectId: string) {
    return prisma.session.findMany({
      where: { projectId },
      orderBy: { updatedAt: 'desc' },
      include: { messages: { take: 1, orderBy: { createdAt: 'desc' } } },
    });
  },

  async addMessage(sessionId: string, role: string, content: string, toolCalls?: unknown) {
    return prisma.message.create({
      data: { sessionId, role, content, toolCalls: toolCalls || undefined },
    });
  },

  async deleteSession(id: string) {
    return prisma.session.delete({ where: { id } });
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add packages/server/src/services/session.service.ts
git commit -m "feat(server): add session management service"
```

---

### Task 13: Settings / Preferences / 设置/偏好

**Files:**
- Create: `packages/cli/src/components/Settings.tsx`
- Create: `packages/cli/src/contexts/SettingsContext.tsx`
- Create: `packages/server/src/routes/settings.ts`

- [ ] **Step 1: Create packages/cli/src/contexts/SettingsContext.tsx**

```tsx
import { createContext, useContext, useState, ReactNode } from 'react';
import { ModelConfig, MODEL_CONFIGS } from '@web-ai-ide/core';

interface Settings {
  selectedModel: string;
  apiKeys: Record<string, string>;
  theme: 'light' | 'dark';
  fontSize: number;
}

interface SettingsContextValue {
  settings: Settings;
  updateSettings: (updates: Partial<Settings>) => void;
  availableModels: ModelConfig[];
}

const defaultSettings: Settings = {
  selectedModel: 'gpt-4o',
  apiKeys: {},
  theme: 'dark',
  fontSize: 14,
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  const updateSettings = (updates: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  };

  const availableModels = Object.values(MODEL_CONFIGS);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, availableModels }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within SettingsProvider');
  return context;
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/cli/src/contexts/SettingsContext.tsx packages/cli/src/components/Settings.tsx
git commit -m "feat(cli): add settings context and component"
```

---

## Implementation Order Summary / 实施顺序总结

1. **Task 1:** Project Scaffolding / 项目脚手架
2. **Task 2:** Backend API Structure / 后端 API 结构
3. **Task 3:** Database Schema / 数据库架构
4. **Task 4:** Basic Frontend Layout / 基础前端布局
5. **Task 5:** Monaco Editor Integration / Monaco Editor 集成
6. **Task 6:** File Explorer Component / 文件资源管理器
7. **Task 7:** Chat Interface with Streaming / 聊天界面
8. **Task 8:** AI Gateway Implementation / AI 网关
9. **Task 9:** Tool System / 工具系统
10. **Task 10:** Multi-Model Support / 多模型支持
11. **Task 11:** Terminal Emulator / 终端模拟器
12. **Task 12:** Session Management / 会话管理
13. **Task 13:** Settings / Preferences / 设置/偏好

---

**Plan complete and saved to `docs/superpowers/plans/2026-04-03-web-ai-ide-implementation.md`.**

Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
