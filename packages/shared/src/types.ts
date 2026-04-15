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

export type ShellType = 'local' | 'ssh' | 'webcontainer' | 'openclaude';

export type TerminalMessageType =
  | 'create'
  | 'resize'
  | 'input'
  | 'output'
  | 'exit'
  | 'list'
  | 'kill'
  | 'error'
  | 'created';

export interface TerminalSession {
  id: string;
  name: string;
  shellType: ShellType;
  createdAt: Date;
  lastActiveAt: Date;
  cwd?: string;
  env?: Record<string, string>;
}

export interface SSHSession extends TerminalSession {
  shellType: 'ssh';
  host: string;
  port: number;
  username: string;
  authMethod: 'password' | 'privateKey';
}

export interface LocalSession extends TerminalSession {
  shellType: 'local';
  shell: string;
}

export interface TerminalMessage {
  type: TerminalMessageType;
  sessionId?: string;
  payload?: unknown;
}

export interface CreateSessionPayload {
  shellType: ShellType;
  shell?: string;
  host?: string;
  port?: number;
  username?: string;
  authMethod?: 'password' | 'privateKey';
  cols?: number;
  rows?: number;
}

export interface ResizePayload {
  sessionId: string;
  cols: number;
  rows: number;
}

export interface InputPayload {
  sessionId: string;
  data: string;
}

export interface OutputPayload {
  sessionId: string;
  data: string;
}
