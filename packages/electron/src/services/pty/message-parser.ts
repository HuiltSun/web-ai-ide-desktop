/**
 * PTY 消息解析器
 * 处理 WebSocket 消息的序列化和反序列化
 */

export enum MessageType {
  CREATE = 'create',
  INPUT = 'input',
  OUTPUT = 'output',
  RESIZE = 'resize',
  KILL = 'kill',
  LIST = 'list',
  EXIT = 'exit',
  ERROR = 'error',
  CREATED = 'created',
}

export interface BaseMessage {
  type: MessageType;
}

export interface CreateMessage extends BaseMessage {
  type: MessageType.CREATE;
  sessionId: string;
  payload: {
    shellType?: 'local' | 'openclaude';
    shell?: string;
    cols: number;
    rows: number;
    cwd?: string;
    command?: string;
    args?: string[];
    env?: Record<string, string>;
  };
}

export interface InputMessage extends BaseMessage {
  type: MessageType.INPUT;
  sessionId: string;
  payload: {
    sessionId: string;
    data: string;
  };
}

export interface OutputMessage extends BaseMessage {
  type: MessageType.OUTPUT;
  sessionId: string;
  payload: {
    sessionId: string;
    data: string;
  };
}

export interface ExitMessage extends BaseMessage {
  type: MessageType.EXIT;
  sessionId: string;
  payload: {
    sessionId: string;
    code?: number;
    signal?: number;
  };
}

export interface ListMessage extends BaseMessage {
  type: MessageType.LIST;
  payload?: {
    sessions?: string[];
  };
}

export interface ResizeMessage extends BaseMessage {
  type: MessageType.RESIZE;
  sessionId: string;
  payload: {
    sessionId: string;
    cols: number;
    rows: number;
  };
}

export interface KillMessage extends BaseMessage {
  type: MessageType.KILL;
  sessionId?: string;
  payload?: {
    sessionId?: string;
    signal?: number;
  };
}

export interface ErrorMessage extends BaseMessage {
  type: MessageType.ERROR;
  message?: string;
  payload?: {
    error?: string;
  };
}

export interface CreatedMessage extends BaseMessage {
  type: MessageType.CREATED;
  sessionId: string;
  payload?: {
    success?: boolean;
  };
}

export type PTYMessage =
  | CreateMessage
  | InputMessage
  | OutputMessage
  | ResizeMessage
  | KillMessage
  | ListMessage
  | ExitMessage
  | ErrorMessage
  | CreatedMessage;

export function parseMessage(raw: string): PTYMessage {
  try {
    const parsed = JSON.parse(raw);
    
    if (!isValidMessage(parsed)) {
      throw new Error(`无效的消息格式：${raw}`);
    }
    
    return parsed;
  } catch (error) {
    return {
      type: MessageType.ERROR,
      message: error instanceof Error ? error.message : '未知错误',
    };
  }
}

export function createCreateMessage(
  id: string,
  cols: number,
  rows: number,
  options?: { shellType?: 'local' | 'openclaude'; shell?: string; cwd?: string; command?: string; args?: string[]; env?: Record<string, string> }
): { type: MessageType.CREATE; sessionId: string; payload: { shellType?: 'local' | 'openclaude'; shell?: string; cols: number; rows: number; cwd?: string; command?: string; args?: string[]; env?: Record<string, string> } } {
  return {
    type: MessageType.CREATE,
    sessionId: id,
    payload: {
      shellType: options?.shellType || 'local',
      shell: options?.shell,
      cols,
      rows,
      cwd: options?.cwd,
      command: options?.command,
      args: options?.args,
      env: options?.env,
    },
  };
}

export function createInputMessage(sessionId: string, data: string): InputMessage {
  return { 
    type: MessageType.INPUT, 
    sessionId,
    payload: { sessionId, data }
  };
}

export function createOutputMessage(sessionId: string, data: string): OutputMessage {
  return { 
    type: MessageType.OUTPUT, 
    sessionId,
    payload: { sessionId, data }
  };
}

export function createResizeMessage(sessionId: string, cols: number, rows: number): ResizeMessage {
  return { 
    type: MessageType.RESIZE, 
    sessionId,
    payload: { sessionId, cols, rows }
  };
}

export function createKillMessage(sessionId: string, signal?: number): KillMessage {
  return { 
    type: MessageType.KILL, 
    sessionId,
    payload: { sessionId, signal }
  };
}

export function createListMessage(): ListMessage {
  return { type: MessageType.LIST };
}

export function createExitMessage(sessionId: string, code?: number, signal?: number): ExitMessage {
  return { 
    type: MessageType.EXIT, 
    sessionId,
    payload: { sessionId, code, signal }
  };
}

export function createCreatedMessage(sessionId: string, success?: boolean): CreatedMessage {
  return {
    type: MessageType.CREATED,
    sessionId,
    payload: { success }
  };
}

export function isCreateMessage(msg: PTYMessage): msg is CreateMessage {
  return msg.type === MessageType.CREATE;
}

export function isInputMessage(msg: PTYMessage): msg is InputMessage {
  return msg.type === MessageType.INPUT;
}

export function isOutputMessage(msg: PTYMessage): msg is OutputMessage {
  return msg.type === MessageType.OUTPUT;
}

export function isResizeMessage(msg: PTYMessage): msg is ResizeMessage {
  return msg.type === MessageType.RESIZE;
}

export function isKillMessage(msg: PTYMessage): msg is KillMessage {
  return msg.type === MessageType.KILL;
}

export function isListMessage(msg: PTYMessage): msg is ListMessage {
  return msg.type === MessageType.LIST;
}

export function isExitMessage(msg: PTYMessage): msg is ExitMessage {
  return msg.type === MessageType.EXIT;
}

export function isErrorMessage(msg: PTYMessage): msg is ErrorMessage {
  return msg.type === MessageType.ERROR;
}

function isValidMessage(msg: unknown): msg is PTYMessage {
  if (!msg || typeof msg !== 'object') return false;
  const m = msg as Record<string, unknown>;
  
  if (!m.type || typeof m.type !== 'string') return false;
  
  switch (m.type) {
    case MessageType.CREATE:
      return typeof m.sessionId === 'string' && typeof m.payload === 'object' && m.payload !== null && typeof (m.payload as Record<string, unknown>).cols === 'number' && typeof (m.payload as Record<string, unknown>).rows === 'number';
    case MessageType.INPUT:
      return typeof m.sessionId === 'string' && typeof m.payload === 'object' && m.payload !== null && typeof (m.payload as Record<string, unknown>).sessionId === 'string' && typeof (m.payload as Record<string, unknown>).data === 'string';
    case MessageType.OUTPUT:
      return typeof m.sessionId === 'string' && typeof m.payload === 'object' && m.payload !== null && typeof (m.payload as Record<string, unknown>).data === 'string';
    case MessageType.RESIZE:
      return typeof m.sessionId === 'string' && typeof m.payload === 'object' && m.payload !== null && typeof (m.payload as Record<string, unknown>).cols === 'number' && typeof (m.payload as Record<string, unknown>).rows === 'number';
    case MessageType.KILL:
      return typeof m.sessionId === 'string';
    case MessageType.LIST:
      return true;
    case MessageType.EXIT:
      return typeof m.sessionId === 'string' && typeof m.payload === 'object' && m.payload !== null;
    case MessageType.ERROR:
      return typeof m.message === 'string' || (typeof m.payload === 'object' && m.payload !== null && typeof (m.payload as Record<string, unknown>).error === 'string');
    case MessageType.CREATED:
      return typeof m.sessionId === 'string';
    default:
      return false;
  }
}
