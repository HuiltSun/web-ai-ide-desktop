export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  result?: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
}

export interface Project {
  id: string;
  name: string;
  path: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatStreamEvent {
  type: 'text' | 'tool_call' | 'done' | 'error';
  content?: string;
  toolCall?: ToolCall;
}

export interface AIProvider {
  name: string;
  apiKey: string;
  models: string[];
}

export interface SettingsData {
  ai_providers?: Record<string, AIProvider>;
  selected_model?: string;
  fontSize?: number;
  tabSize?: number;
  [key: string]: unknown;
}

export interface ElectronAPI {
  getAppPath: () => Promise<string>;
  getVersion: () => Promise<string>;
  settings: {
    get: (key: string) => Promise<unknown>;
    set: (key: string, value: unknown) => Promise<boolean>;
    getAll: () => Promise<SettingsData>;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}