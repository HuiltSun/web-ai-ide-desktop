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

export interface Session {
  id: string;
  projectId: string;
  cwd: string | null;
  gitBranch: string | null;
  model: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectWithSession {
  project: Project;
  session: Session;
}

export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatStreamEvent {
  type: 'text' | 'tool_call' | 'done' | 'error' | 'action_required' | 'tool_result';
  content?: string;
  /** 服务端在 gRPC done 时带回的完整文本（用于无增量 chunk 时仍能展示/与 DB 一致） */
  fullText?: string;
  toolCall?: ToolCall;
  promptId?: string;
  question?: string;
  actionType?: string;
  toolCallId?: string;
  result?: {
    success: boolean;
    output?: string;
    error?: string;
  };
}

export interface AIModel {
  id: string;
  name: string;
}

export interface AIProvider {
  id: string;
  name: string;
  apiEndpoint: string;
  apiKey: string;
  models: AIModel[];
}

export interface SettingsData {
  ai_providers?: AIProvider[];
  selected_provider?: string;
  selected_model?: string;
  fontSize?: number;
  tabSize?: number;
  language?: string;
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
  window: {
    minimize: () => Promise<void>;
    maximize: () => Promise<void>;
    close: () => Promise<void>;
    isMaximized: () => Promise<boolean>;
    reload: () => Promise<void>;
    toggleDevTools: () => Promise<void>;
    toggleFullScreen: () => Promise<void>;
  };
  shell: {
    openExternal: (url: string) => Promise<void>;
  };
  onMenuEvent: (callback: (event: string) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}